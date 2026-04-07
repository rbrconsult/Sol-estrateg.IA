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
    const {
      franquia_id,
      nome,
      cargo,
      ativo,
      sm_id,
      krolik_id,
      krolik_setor_id,
      krolik_ativo,
      horario_pico_inicio,
      horario_pico_fim,
      gestor_key,
      taxa_conversao,
      leads_hoje,
      leads_mes,
    } = body;

    // Get DS ID from app_settings — should be 87420 (sol_equipe v2)
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
    const teamId = Deno.env.get("MAKE_TEAM_ID") || "1934898";
    // Key matches sol_equipe_sync convention
    const key = body.key || `${franquia_id}_${sm_id || krolik_id || nome}`;

    // Payload aligned with sol_equipe_sync columns
    const data: Record<string, unknown> = {
      franquia_id,
      nome,
      cargo: cargo ?? null,
      ativo: ativo ?? true,
      sm_id: sm_id ?? null,
      krolik_id: krolik_id ?? null,
      krolik_setor_id: krolik_setor_id ?? null,
      krolik_ativo: krolik_ativo ?? false,
      horario_pico_inicio: horario_pico_inicio ?? null,
      horario_pico_fim: horario_pico_fim ?? null,
      gestor_key: gestor_key ?? null,
      taxa_conversao: taxa_conversao ?? 0,
      leads_hoje: leads_hoje ?? 0,
      leads_mes: leads_mes ?? 0,
      updated_by: "lovable",
      updated_at: new Date().toISOString(),
    };

    const makeRes = await fetch(
      `https://us2.make.com/api/v2/data-stores/${dsId}/data?teamId=${teamId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Token ${makeApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key, data }),
      }
    );

    const makeResult = await makeRes.text();
    console.log("Make sync result:", makeRes.status, makeResult);

    // Also update sol_equipe_sync locally so UI reflects immediately
    const { error: upsertErr } = await adminClient
      .from("sol_equipe_sync")
      .upsert(
        { key, ...data, synced_at: new Date().toISOString() },
        { onConflict: "key" }
      );

    if (upsertErr) {
      console.error("sol_equipe_sync upsert error:", upsertErr.message);
    }

    return new Response(
      JSON.stringify({ ok: true, synced: true, makeStatus: makeRes.status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("sync-time-comercial error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
