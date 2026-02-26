import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Webhook proxy received payload:", JSON.stringify(payload).slice(0, 1000));

    const targetUrl = "https://xffzjdulkdgyicsllznp.supabase.co/functions/v1/whatsapp-webhook";

    try {
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.text();
      const label = targetUrl.split("/").pop();

      if (res.ok) {
        console.log(`✅ ${label}: ${res.status}`);
      } else {
        console.warn(`⚠️ ${label}: ${res.status} — ${body.slice(0, 200)}`);
      }

      return new Response(
        JSON.stringify({ ok: res.ok, status: res.status, body }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (fetchErr) {
      console.error(`❌ whatsapp-webhook: NETWORK ERROR`, fetchErr);
      return new Response(
        JSON.stringify({ ok: false, error: String(fetchErr) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    console.error("Proxy error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
