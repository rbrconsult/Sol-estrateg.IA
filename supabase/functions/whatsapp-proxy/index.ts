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

    // Forward to both webhooks in parallel
    const targets = [
      "https://acisqlfprkeowuvhqhkn.supabase.co/functions/v1/whatsapp-centro-comando-webhook",
      "https://xffzjdulkdgyicsllznp.supabase.co/functions/v1/whatsapp-webhook",
    ];

    const results = await Promise.allSettled(
      targets.map(async (url) => {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const body = await res.text();
          console.log(`→ ${url.split("/").pop()}: ${res.status}`);
          return { url, status: res.status, body };
        } catch (err) {
          console.error(`→ ${url.split("/").pop()}: ERROR`, err);
          return { url, error: String(err) };
        }
      })
    );

    return new Response(
      JSON.stringify({ ok: true, results: results.map((r) => r.status === "fulfilled" ? r.value : r.reason) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Proxy error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
