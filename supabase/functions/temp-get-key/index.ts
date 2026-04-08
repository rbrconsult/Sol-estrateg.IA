const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "NOT SET";

  return new Response(JSON.stringify({ service_role_key: key }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
