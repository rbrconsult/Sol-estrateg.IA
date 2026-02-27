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

    // 1. Fetch all scenarios with scheduling info
    const scenariosRes = await fetch(
      `${MAKE_BASE}/scenarios?teamId=${MAKE_TEAM_ID}&pg[limit]=200`,
      { headers: makeHeaders }
    );
    if (!scenariosRes.ok) {
      const errText = await scenariosRes.text();
      throw new Error(`Failed to fetch scenarios [${scenariosRes.status}]: ${errText}`);
    }
    const scenariosData = await scenariosRes.json();
    const scenarios: { id: number; name: string; isActive: boolean; nextExec: string | null }[] = 
      (scenariosData.scenarios ?? []).map((s: any) => ({
        id: s.id,
        name: s.name,
        isActive: s.islinked ?? s.isPaused === false ?? true,
        nextExec: s.nextExec ?? null,
      }));

    console.log(`Found ${scenarios.length} scenarios`);

    // 2. Try MULTIPLE endpoint formats to find what works
    const records: any[] = [];
    const debugInfo: any[] = [];

    // Try different Make API endpoints for execution history
    const endpointVariants = [
      (sid: number) => `${MAKE_BASE}/scenarios/${sid}/logs?pg[limit]=50`,
      (sid: number) => `${MAKE_BASE}/scenarios/${sid}/executions?pg[limit]=50`,
    ];

    // First, probe one scenario with all variants to find which works
    const probeScenario = scenarios[0];
    let workingEndpointIndex = -1;
    
    if (probeScenario) {
      for (let i = 0; i < endpointVariants.length; i++) {
        const url = endpointVariants[i](probeScenario.id);
        console.log(`Probing endpoint variant ${i}: ${url}`);
        try {
          const res = await fetch(url, { headers: makeHeaders });
          const text = await res.text();
          console.log(`Variant ${i} status=${res.status}, body preview: ${text.substring(0, 500)}`);
          
          if (res.ok) {
            const data = JSON.parse(text);
            const possibleArrays = [
              data.scenarioLogs,
              data.executions, 
              data.logs,
              data.data,
            ];
            for (const arr of possibleArrays) {
              if (Array.isArray(arr) && arr.length > 0) {
                console.log(`✅ Variant ${i} works! Found ${arr.length} entries. Sample keys: ${Object.keys(arr[0])}`);
                console.log(`Sample entry: ${JSON.stringify(arr[0]).substring(0, 500)}`);
                workingEndpointIndex = i;
                break;
              }
            }
            if (workingEndpointIndex === -1) {
              // Even if arrays are empty, check if 200 and valid JSON
              debugInfo.push({ variant: i, url, status: res.status, keys: Object.keys(data), sample: text.substring(0, 300) });
            }
          } else {
            debugInfo.push({ variant: i, url, status: res.status, body: text.substring(0, 200) });
          }
        } catch (err) {
          debugInfo.push({ variant: i, url, error: String(err) });
        }
        if (workingEndpointIndex >= 0) break;
      }
    }

    console.log(`Working endpoint: variant ${workingEndpointIndex}`);

    // 3. If we found a working endpoint, fetch all scenarios
    if (workingEndpointIndex >= 0) {
      const getUrl = endpointVariants[workingEndpointIndex];
      
      const fetchPromises = scenarios.map(async (scenario) => {
        try {
          const res = await fetch(getUrl(scenario.id), { headers: makeHeaders });
          if (!res.ok) { await res.text(); return []; }
          const data = await res.json();
          
          const entries = data.scenarioLogs ?? data.executions ?? data.logs ?? data.data ?? [];
          
          return entries.map((item: any) => {
            let status = "success";
            const rawStatus = item.status;
            if (rawStatus === "error" || rawStatus === 2 || rawStatus === "failed") status = "error";
            else if (rawStatus === "warning" || rawStatus === 3) status = "warning";
            
            return {
              scenario_id: scenario.id,
              scenario_name: scenario.name,
              execution_id: String(item.id ?? item.executionId ?? `${scenario.id}-${Date.now()}-${Math.random()}`),
              status,
              duration_seconds: item.duration ?? null,
              ops_count: item.operations ?? item.operationsCount ?? null,
              transfer_bytes: item.transfer ?? item.dataTransfer ?? null,
              error_message: item.error?.message ?? item.warning?.message ?? item.errorMessage ?? null,
              started_at: item.createdAt ?? item.startedAt ?? item.timestamp ?? new Date().toISOString(),
            };
          });
        } catch {
          return [];
        }
      });

      const allResults = await Promise.all(fetchPromises);
      for (const logs of allResults) {
        records.push(...logs);
      }
    } else {
      // Fallback: create heartbeat entries from scenario metadata (at least show them as active)
      console.log("No working log endpoint found. Using scenario metadata as fallback.");
      for (const s of scenarios) {
        records.push({
          scenario_id: s.id,
          scenario_name: s.name,
          execution_id: `meta-${s.id}-${Date.now()}`,
          status: s.isActive ? "success" : "warning",
          duration_seconds: null,
          ops_count: null,
          transfer_bytes: null,
          error_message: s.isActive ? null : "Cenário inativo",
          started_at: new Date().toISOString(),
        });
      }
    }

    console.log(`Total records to upsert: ${records.length}`);

    // 4. Upsert into make_heartbeat
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
        workingEndpoint: workingEndpointIndex,
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
