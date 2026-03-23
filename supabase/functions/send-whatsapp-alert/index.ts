import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const KROLIC_SEND_URL = "https://api.camkrolik.com.br/core/v2/api/chats/send-text";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { phone, message, errorId } = await req.json();

    // Read Krolic API key from settings
    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: settings } = await supabaseAdmin
      .from("app_settings")
      .select("key, value")
      .in("key", ["evolution_api_key"]);

    const apiKey = settings?.find((s: any) => s.key === "evolution_api_key")?.value;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Krolic API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize phone
    const cleanPhone = phone.replace(/\D/g, "");
    const phoneWithCountry = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

    console.log(`[send-whatsapp-alert] Sending to ${phoneWithCountry} for error ${errorId}`);

    let responseData: unknown = null;
    let statusCode = 0;
    try {
      const response = await fetch(KROLIC_SEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access-token": apiKey,
        },
        body: JSON.stringify({
          number: phoneWithCountry,
          message,
          forceSend: true,
          verifyContact: true,
          linkPreview: true,
        }),
      });
      statusCode = response.status;
      try {
        const rawBody = await response.text();
        try { responseData = JSON.parse(rawBody); } catch { responseData = rawBody; }
      } catch {
        console.warn(`[send-whatsapp-alert] Body read error (status ${statusCode}), treating as sent`);
        responseData = { note: "body_read_error", statusCode };
      }
    } catch (fetchErr) {
      console.error(`[send-whatsapp-alert] Network error:`, fetchErr);
      return new Response(
        JSON.stringify({ success: false, error: String(fetchErr) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-whatsapp-alert] Krolic response: ${statusCode}`, JSON.stringify(responseData));

    return new Response(
      JSON.stringify({ success: statusCode >= 200 && statusCode < 300, status: statusCode, data: responseData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("send-whatsapp-alert error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
