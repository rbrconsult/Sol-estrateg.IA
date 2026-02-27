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

    console.log(`Found ${scenarios.length} scenarios:`, scenarios.map(s => `${s.id}:${s.name}`));

    // 2. Fetch recent logs for each scenario (all statuses in one call without status filter)
    const records: any[] = [];
    const debugInfo: any[] = [];

    const logPromises = scenarios.map(async (scenario) => {
      const results: any[] = [];
      
      // Try fetching ALL logs without status filter first
      try {
        const logUrl = `${MAKE_BASE}/scenarios/${scenario.id}/logs?pg[limit]=100&pg[sortDir]=desc&pg[sortBy]=timestamp`;
        console.log(`Fetching logs for scenario ${scenario.id}: ${logUrl}`);
        
        const logRes = await fetch(logUrl, { headers: makeHeaders });
        const rawText = await logRes.text();
        
        if (!logRes.ok) {
          console.error(`Scenario ${scenario.id} logs failed [${logRes.status}]: ${rawText.substring(0, 200)}`);
          debugInfo.push({ scenario_id: scenario.id, name: scenario.name, status: logRes.status, error: rawText.substring(0, 200) });
          return [];
        }
        
        let logData: any;
        try {
          logData = JSON.parse(rawText);
        } catch {
          console.error(`Scenario ${scenario.id}: invalid JSON response`);
          debugInfo.push({ scenario_id: scenario.id, name: scenario.name, error: "invalid JSON", raw: rawText.substring(0, 200) });
          return [];
        }
        
        const logs = logData.scenarioLogs ?? logData.logs ?? logData.data ?? [];
        console.log(`Scenario ${scenario.id} (${scenario.name}): ${logs.length} logs found, keys: ${Object.keys(logData)}`);
        
        if (logs.length === 0) {
          debugInfo.push({ scenario_id: scenario.id, name: scenario.name, logsCount: 0, responseKeys: Object.keys(logData), sample: JSON.stringify(logData).substring(0, 300) });
        }
        
        for (const item of logs) {
          // Determine status from the log entry
          let status = "success";
          if (item.status === "error" || item.status === 2) status = "error";
          else if (item.status === "warning" || item.status === 3) status = "warning";
          else if (item.status === "success" || item.status === 1) status = "success";
          else if (typeof item.status === "number") {
            // Make uses numeric statuses: 1=success, 2=error, 3=warning
            if (item.status === 2) status = "error";
            else if (item.status === 3) status = "warning";
            else status = "success";
          }
          
          results.push({
            scenario_id: scenario.id,
            scenario_name: scenario.name,
            execution_id: String(item.id ?? item.executionId ?? `${scenario.id}-${item.timestamp}`),
            status,
            duration_seconds: item.duration ?? null,
            ops_count: item.operations ?? null,
            transfer_bytes: item.transfer ?? null,
            error_message: item.error?.message ?? item.warning?.message ?? null,
            started_at: item.createdAt ?? item.timestamp ?? new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error(`Scenario ${scenario.id} fetch error:`, err);
        debugInfo.push({ scenario_id: scenario.id, name: scenario.name, error: String(err) });
      }
      
      return results;
    });

    const results = await Promise.all(logPromises);
    for (const logs of results) {
      records.push(...logs);
    }

    console.log(`Total fetched: ${records.length} execution logs`);
    if (debugInfo.length > 0) {
      console.log(`Debug info for empty scenarios:`, JSON.stringify(debugInfo));
    }

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
        debugInfo: debugInfo.length > 0 ? debugInfo : undefined,
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
