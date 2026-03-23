import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { franquia_id, nome, ativo, krolic, sm_id, krolik_id, krolik_setor_id } = body;

    // Get DS ID from app_settings or env
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: setting } = await adminClient
      .from("app_settings")
      .select("value")
      .eq("key", "make_ds_time_comercial")
      .single();

    const dsId = setting?.value;

    if (!dsId) {
      console.log("DS Time Comercial ID not configured yet, skipping Make sync");
      return new Response(
        JSON.stringify({ ok: true, synced: false, reason: "DS ID not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const makeApiKey = Deno.env.get("MAKE_API_KEY");
    const teamId = Deno.env.get("MAKE_TEAM_ID") || "1437295";
    const key = `${franquia_id}_${krolik_id || sm_id || nome}`;

    const makePayload = {
      dataStoreId: parseInt(dsId),
      teamId: parseInt(teamId),
      key,
      data: {
        franquia_id,
        nome,
        ativo: ativo ?? true,
        krolic: krolic ?? true,
        sm_id: sm_id ?? null,
        krolik_id: krolik_id ?? null,
        krolik_setor_id: krolik_setor_id ?? null,
      },
    };

    const makeRes = await fetch(
      `https://us2.make.com/api/v2/data-stores/${dsId}/data?teamId=${teamId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Token ${makeApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key, data: makePayload.data }),
      }
    );

    const makeResult = await makeRes.text();
    console.log("Make sync result:", makeRes.status, makeResult);

    return new Response(
      JSON.stringify({ ok: true, synced: true, makeStatus: makeRes.status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("sync-time-comercial error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
