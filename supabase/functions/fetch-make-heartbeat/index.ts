import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAKE_BASE = "https://us2.make.com/api/v2";

/** Run promises in batches of `size` to avoid rate limiting */
async function batchedPromises<T>(fns: (() => Promise<T>)[], size: number): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < fns.length; i += size) {
    const batch = fns.slice(i, i + size);
    const batchResults = await Promise.all(batch.map((fn) => fn()));
    results.push(...batchResults);
  }
  return results;
}

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

    // 2. Fetch logs sequentially in batches of 3 to avoid rate limiting
    const records: any[] = [];

    const fetchFns = scenarios.map((scenario) => async () => {
      try {
        const res = await fetch(
          `${MAKE_BASE}/scenarios/${scenario.id}/logs?pg[limit]=50`,
          { headers: makeHeaders }
        );
        if (!res.ok) {
          const errText = await res.text();
          console.log(`Scenario ${scenario.id} failed [${res.status}]: ${errText.substring(0, 100)}`);
          return [] as any[];
        }
        const data = await res.json();
        const logs = data.scenarioLogs ?? [];
        console.log(`Scenario ${scenario.id} (${scenario.name}): ${logs.length} logs`);

        return logs.map((item: any) => {
          let status = "success";
          if (item.status === 2) status = "error";
          else if (item.status === 3) status = "warning";

          return {
            scenario_id: scenario.id,
            scenario_name: scenario.name,
            execution_id: String(item.id),
            status,
            duration_seconds: item.duration ? Math.round(item.duration / 1000) : null,
            ops_count: item.operations ?? null,
            transfer_bytes: item.transfer ?? null,
            error_message: null,
            started_at: item.timestamp,
          };
        });
      } catch (err) {
        console.error(`Scenario ${scenario.id} error:`, err);
        return [] as any[];
      }
    });

    const allResults = await batchedPromises(fetchFns, 3);
    for (const logs of allResults) {
      records.push(...logs);
    }

    console.log(`Total records: ${records.length}`);

    // 3. Upsert into make_heartbeat
    let upserted = 0;
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
