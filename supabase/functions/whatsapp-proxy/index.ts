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

  // Always respond 200 to avoid retries / cascading redelivery
  const ok200 = (body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const payload = await req.json();
    console.log("📩 Proxy received:", JSON.stringify(payload).slice(0, 800));

    const targetUrl =
      "https://xffzjdulkdgyicsllznp.supabase.co/functions/v1/whatsapp-webhook";

    try {
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": WEBHOOK_SECRET,
        },
        body: JSON.stringify(payload),
      });
      const body = await res.text();

      if (res.ok) {
        console.log(`✅ whatsapp-webhook: ${res.status}`);
      } else {
        console.warn(`⚠️ whatsapp-webhook: ${res.status} — ${body.slice(0, 200)}`);
      }

      return ok200({ ok: res.ok, status: res.status });
    } catch (fetchErr) {
      console.error("❌ whatsapp-webhook: NETWORK ERROR", fetchErr);
      return ok200({ ok: false, error: "network_error", detail: String(fetchErr) });
    }
  } catch (err) {
    console.error("❌ Proxy parse error:", err);
    return ok200({ ok: false, error: "parse_error", detail: String(err) });
  }
});
