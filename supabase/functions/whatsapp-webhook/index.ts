import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate webhook secret
  const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");
  const incomingSecret =
    req.headers.get("x-webhook-secret") ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!WEBHOOK_SECRET || incomingSecret !== WEBHOOK_SECRET) {
    console.warn("🚫 Webhook rejected: invalid secret");
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await req.json();
    console.log("Webhook received - event:", payload?.event);
    console.log("Webhook payload keys:", Object.keys(payload || {}));
    console.log("Webhook payload preview:", JSON.stringify(payload).slice(0, 800));

    // Evolution API sends messages in data object
    const data = payload?.data;
    if (!data) {
      return new Response(JSON.stringify({ ok: true, skipped: "no data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ignore messages sent by us (fromMe)
    if (data.key?.fromMe) {
      return new Response(JSON.stringify({ ok: true, skipped: "fromMe" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ignore status updates
    if (data.key?.remoteJid === "status@broadcast") {
      return new Response(JSON.stringify({ ok: true, skipped: "status broadcast" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract phone number - prefer remoteJidAlt (has real number) over remoteJid (may use @lid format)
    const remoteJid = data.key?.remoteJidAlt || data.key?.remoteJid || "";
    const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "").replace("@lid", "");
    if (!phone) {
      return new Response(JSON.stringify({ ok: true, skipped: "no phone" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract message text
    const messageText =
      data.message?.conversation ||
      data.message?.extendedTextMessage?.text ||
      null;

    if (!messageText) {
      return new Response(JSON.stringify({ ok: true, skipped: "no text" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the most recent open ticket matching this phone number
    // We search for the phone digits in notification_phone
    const phoneDigits = phone.replace(/\D/g, "");
    // Try matching last 10-11 digits (BR numbers: country code + DDD + number)
    const searchPhone = phoneDigits.length > 11 ? phoneDigits.slice(-11) : phoneDigits;

    const { data: tickets, error: ticketError } = await supabaseAdmin
      .from("support_tickets")
      .select("id, user_id, status, notification_phone")
      .not("status", "in", '("resolvido","fechado")')
      .order("created_at", { ascending: false });

    if (ticketError) {
      console.error("Error fetching tickets:", ticketError);
      return new Response(JSON.stringify({ error: "db error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Match ticket by notification_phone containing the search digits
    const matchedTicket = (tickets || []).find((t: any) => {
      if (!t.notification_phone) return false;
      const ticketDigits = t.notification_phone.replace(/\D/g, "");
      // Match last digits (handle with/without country code)
      const ticketSearch = ticketDigits.length > 11 ? ticketDigits.slice(-11) : ticketDigits;
      return ticketSearch === searchPhone || 
             ticketDigits.endsWith(searchPhone) || 
             searchPhone.endsWith(ticketSearch);
    });

    if (!matchedTicket) {
      console.log("No matching ticket for phone:", searchPhone);
      return new Response(JSON.stringify({ ok: true, skipped: "no matching ticket" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Matched ticket:", matchedTicket.id, "for phone:", searchPhone);

    // Insert message
    const { error: insertError } = await supabaseAdmin
      .from("ticket_messages")
      .insert({
        ticket_id: matchedTicket.id,
        user_id: matchedTicket.user_id,
        message: messageText,
        source: "whatsapp",
      });

    if (insertError) {
      console.error("Error inserting message:", insertError);
      return new Response(JSON.stringify({ error: "insert error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If ticket is aguardando_usuario, move to em_andamento and resume SLA
    if (matchedTicket.status === "aguardando_usuario") {
      // Fetch full ticket to get sla_paused_at and sla_deadline
      const { data: fullTicket } = await supabaseAdmin
        .from("support_tickets")
        .select("sla_paused_at, sla_deadline, sla_paused_total_ms")
        .eq("id", matchedTicket.id)
        .single();

      const updateData: Record<string, any> = { status: "em_andamento", sla_paused_at: null };
      if (fullTicket?.sla_paused_at) {
        const pausedMs = Date.now() - new Date(fullTicket.sla_paused_at).getTime();
        updateData.sla_deadline = new Date(new Date(fullTicket.sla_deadline).getTime() + pausedMs).toISOString();
        updateData.sla_paused_total_ms = (fullTicket.sla_paused_total_ms || 0) + pausedMs;
      }

      await supabaseAdmin
        .from("support_tickets")
        .update(updateData)
        .eq("id", matchedTicket.id);

      // Record status change
      await supabaseAdmin.from("ticket_status_history").insert({
        ticket_id: matchedTicket.id,
        old_status: "aguardando_usuario",
        new_status: "em_andamento",
        changed_by: matchedTicket.user_id,
        reason: "Resposta via WhatsApp",
      });
    }

    return new Response(
      JSON.stringify({ ok: true, ticketId: matchedTicket.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
