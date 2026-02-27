import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAKE_BASE = "https://us2.make.com/api/v2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MAKE_API_TOKEN = Deno.env.get("MAKE_API_KEY");
    const MAKE_TEAM_ID = Deno.env.get("MAKE_TEAM_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!MAKE_API_TOKEN) throw new Error("MAKE_API_KEY not configured");
    if (!MAKE_TEAM_ID) throw new Error("MAKE_TEAM_ID not configured");

    const makeHeaders = {
      Authorization: `Token ${MAKE_API_TOKEN}`,
      "Content-Type": "application/json",
    };

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Fetch all scenarios
    const scenariosRes = await fetch(
      `${MAKE_BASE}/scenarios?teamId=${MAKE_TEAM_ID}&pg[limit]=200`,
      { headers: makeHeaders }
    );
    if (!scenariosRes.ok) {
      const errText = await scenariosRes.text();
      throw new Error(`Failed to fetch scenarios [${scenariosRes.status}]: ${errText}`);
    }
    const scenariosData = await scenariosRes.json();
    const scenarios: { id: number; name: string }[] = (scenariosData.scenarios ?? []).map(
      (s: any) => ({ id: s.id, name: s.name })
    );

    console.log(`Found ${scenarios.length} scenarios`);

    // 2. Fetch recent logs for each scenario (all statuses)
    const logStatuses = ["success", "error", "warning"];
    const records: any[] = [];

    const logPromises = scenarios.flatMap((scenario) =>
      logStatuses.map(async (logStatus) => {
        try {
          const logRes = await fetch(
            `${MAKE_BASE}/scenarios/${scenario.id}/logs?pg[limit]=50&status=${logStatus}`,
            { headers: makeHeaders }
          );
          if (!logRes.ok) {
            await logRes.text();
            return [];
          }
          const logData = await logRes.json();
          return (logData.scenarioLogs ?? []).map((item: any) => ({
            scenario_id: scenario.id,
            scenario_name: scenario.name,
            execution_id: String(item.id ?? `${scenario.id}-${item.timestamp}-${logStatus}`),
            status: logStatus,
            duration_seconds: item.duration ?? null,
            ops_count: item.operations ?? null,
            transfer_bytes: item.transfer ?? null,
            error_message: item.error?.message ?? item.warning?.message ?? null,
            started_at: item.createdAt ?? item.timestamp ?? new Date().toISOString(),
          }));
        } catch {
          return [];
        }
      })
    );

    const results = await Promise.all(logPromises);
    for (const logs of results) {
      records.push(...logs);
    }

    console.log(`Fetched ${records.length} execution logs`);

    // 3. Upsert into make_heartbeat
    let upserted = 0;
    // Batch upsert in chunks of 50
    for (let i = 0; i < records.length; i += 50) {
      const batch = records.slice(i, i + 50);
      const { error } = await supabase
        .from("make_heartbeat")
        .upsert(batch, { onConflict: "execution_id", ignoreDuplicates: false });
      if (error) {
        console.error("Upsert error:", error.message);
      } else {
        upserted += batch.length;
      }
    }

    const success = records.filter((r) => r.status === "success").length;
    const errors = records.filter((r) => r.status === "error").length;
    const warnings = records.filter((r) => r.status === "warning").length;

    return new Response(
      JSON.stringify({
        scenarios: scenarios.length,
        success,
        errors,
        warnings,
        total: upserted,
        syncedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("fetch-make-heartbeat error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
