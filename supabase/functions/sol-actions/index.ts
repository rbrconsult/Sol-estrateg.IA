import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const WEBHOOKS: Record<string, string> = {
  qualificar: "https://hook.us2.make.com/oxaip1d1e946l7hmtyhpr1aic626o92m",
  desqualificar: "https://hook.us2.make.com/joonk1hj7ubqeogtq1hxwymncruxslbl",
  reprocessar: "https://hook.us2.make.com/m6zaweontguh6vqsfvid3g73bxb1qg44",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, ...data } = body;

    if (!action || !WEBHOOKS[action]) {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use: qualificar, desqualificar, reprocessar" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data.telefone) {
      return new Response(
        JSON.stringify({ error: "telefone is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const webhookUrl = WEBHOOKS[action];

    // Build payload per action
    let payload: Record<string, any> = {};

    if (action === "qualificar") {
      payload = {
        telefone: data.telefone,
        project_id: data.project_id || "",
        chatId: data.chatId || data.chat_id || "",
        contactId: data.contactId || data.contact_id || "",
        nome: data.nome || "",
        score: data.score || 0,
        valor_conta: data.valor_conta || "",
        mensagem: data.mensagem !== undefined ? data.mensagem : true,
        closer_sm_id: data.closer_sm_id || null,
        closer_krolik_id: data.closer_krolik_id || null,
      };
    } else if (action === "desqualificar") {
      payload = {
        telefone: data.telefone,
        project_id: data.project_id || "",
        chatId: data.chatId || data.chat_id || "",
        nome: data.nome || "",
      };
    } else if (action === "reprocessar") {
      payload = {
        telefone: data.telefone,
      };
    }

    console.log(`[sol-actions] ${action} → ${webhookUrl}`, JSON.stringify(payload));

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseText = await res.text();

    if (!res.ok) {
      console.error(`[sol-actions] Webhook error: ${res.status}`, responseText);
      return new Response(
        JSON.stringify({ error: `Webhook returned ${res.status}`, details: responseText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, action, response: responseText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[sol-actions] Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
