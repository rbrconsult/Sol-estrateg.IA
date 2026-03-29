import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAKE_BASE = "https://us2.make.com/api/v2";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Run promises sequentially in batches of `size` with delay between batches */
async function batchedPromises<T>(fns: (() => Promise<T>)[], size: number, delayMs = 1500): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < fns.length; i += size) {
    if (i > 0) await delay(delayMs);
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
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await anonClient.auth.getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MAKE_API_TOKEN = Deno.env.get("MAKE_API_KEY");
    const MAKE_TEAM_ID = Deno.env.get("MAKE_TEAM_ID");

    if (!MAKE_API_TOKEN) throw new Error("MAKE_API_KEY not configured");
    if (!MAKE_TEAM_ID) throw new Error("MAKE_TEAM_ID not configured");

    const makeHeaders = {
      Authorization: `Token ${MAKE_API_TOKEN}`,
      "Content-Type": "application/json",
    };

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Helper: fetch with retry on 429
    async function fetchWithRetry(url: string, opts: RequestInit, retries = 3): Promise<Response> {
      for (let attempt = 0; attempt < retries; attempt++) {
        const res = await fetch(url, opts);
        if (res.status === 429) {
          const wait = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
          console.log(`429 rate limited, waiting ${wait}ms before retry...`);
          await delay(wait);
          continue;
        }
        return res;
      }
      return fetch(url, opts); // final attempt
    }

    // 1. Fetch all scenarios
    const scenariosRes = await fetchWithRetry(
      `${MAKE_BASE}/scenarios?teamId=${MAKE_TEAM_ID}&pg[limit]=200`,
      { headers: makeHeaders }
    );
    if (!scenariosRes.ok) {
      const errText = await scenariosRes.text();
      throw new Error(`Failed to fetch scenarios [${scenariosRes.status}]: ${errText}`);
    }
    const scenariosData = await scenariosRes.json();
    const scenarios: { id: number; name: string }[] = (scenariosData.scenarios ?? [])
      .filter((s: any) => s.isActive === true || s.scheduling?.type === "indefinitely")
      .map((s: any) => ({ id: s.id, name: s.name }));

    console.log(`Found ${scenarios.length} scenarios`);

    // 2. Fetch logs in batches of 2 with 1.5s delay between batches
    const records: any[] = [];

    const fetchFns = scenarios.map((scenario) => async () => {
      try {
        const res = await fetchWithRetry(
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

    const allResults = await batchedPromises(fetchFns, 2);
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

    // 4. Auto-update monitored_scenario_ids with ALL discovered scenarios
    const monitoredPayload = scenarios.map((s) => ({ id: s.id, name: s.name }));
    const { error: settingsErr } = await supabase
      .from("app_settings")
      .upsert(
        { key: "monitored_scenario_ids", value: JSON.stringify(monitoredPayload), updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    if (settingsErr) {
      console.error("Failed to auto-update monitored scenarios:", settingsErr.message);
    } else {
      console.log(`Auto-updated monitored_scenario_ids with ${monitoredPayload.length} scenarios`);
    }

    // 5. Auto-discover Data Stores and save to app_settings
    try {
      const dsRes = await fetchWithRetry(
        `${MAKE_BASE}/data-stores?teamId=${MAKE_TEAM_ID}&pg[limit]=200`,
        { headers: makeHeaders }
      );
      if (dsRes.ok) {
        const dsData = await dsRes.json();
        const dataStores = (dsData.dataStores ?? []).map((ds: any) => ({
          id: ds.id,
          name: ds.name,
          records: ds.records ?? 0,
          size: ds.datasize ?? 0,
        }));
        await supabase
          .from("app_settings")
          .upsert(
            { key: "make_data_stores", value: JSON.stringify(dataStores), updated_at: new Date().toISOString() },
            { onConflict: "key" }
          );
        console.log(`Auto-discovered ${dataStores.length} data stores`);
      }
    } catch (dsErr) {
      console.error("Failed to discover data stores:", dsErr);
    }

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
