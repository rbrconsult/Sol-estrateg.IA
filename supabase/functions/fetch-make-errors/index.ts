import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAKE_BASE = "https://us2.make.com/api/v2";

function detectCategory(name: string): string {
  const n = (name ?? "").toLowerCase();
  if (/sol|sdr|qualif/i.test(n)) return "SDR / Qualificação";
  if (/pagamento|asaas|pix/i.test(n)) return "Financeiro";
  if (/whatsapp|mensagem/i.test(n)) return "Mensageria";
  if (/solarmarket|crm|krolic/i.test(n)) return "Integração CRM";
  return "Geral Evolve";
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

    // 1. Fetch scenarios to map IDs -> names
    const scenariosRes = await fetch(
      `${MAKE_BASE}/scenarios?teamId=${MAKE_TEAM_ID}&pg[limit]=200`,
      { headers: makeHeaders }
    );
    if (!scenariosRes.ok) {
      const errText = await scenariosRes.text();
      throw new Error(`Failed to fetch scenarios [${scenariosRes.status}]: ${errText}`);
    }
    const scenariosData = await scenariosRes.json();
    const scenarios: Record<number, { name: string; modules: number }> = {};
    for (const s of scenariosData.scenarios ?? []) {
      scenarios[s.id] = {
        name: s.name,
        modules: s.blueprint?.flow?.length ?? 0,
      };
    }

    const records: any[] = [];

    // 2. SOURCE 1: Incomplete executions (stopped flows)
    const incompleteRes = await fetch(
      `${MAKE_BASE}/incomplete-executions?teamId=${MAKE_TEAM_ID}&pg[limit]=100`,
      { headers: makeHeaders }
    );
    if (incompleteRes.ok) {
      const incompleteData = await incompleteRes.json();
      for (const item of incompleteData.incompleteExecutions ?? []) {
        const scenarioInfo = scenarios[item.scenarioId] ?? { name: `Scenario ${item.scenarioId}`, modules: 0 };
        records.push({
          execution_id: String(item.id),
          scenario_id: item.scenarioId,
          scenario_name: scenarioInfo.name,
          module_name: item.lastModuleName ?? "Unknown",
          module_app: item.lastModuleApp ?? "Unknown",
          failed_module_index: item.lastModuleOrder ?? 0,
          total_modules: scenarioInfo.modules,
          error_type: item.reason?.type ?? "RuntimeError",
          error_code: item.reason?.code ?? null,
          error_message: item.reason?.message ?? item.reason ?? "Unknown error",
          attempts: item.attempts ?? 1,
          execution_status: "stopped",
          flow_category: detectCategory(scenarioInfo.name),
          execution_duration_seconds: null,
          occurred_at: item.createdAt ?? new Date().toISOString(),
        });
      }
    } else {
      await incompleteRes.text();
    }

    // 3. SOURCE 2: Error logs from each scenario
    const scenarioIds = Object.keys(scenarios).map(Number);
    const logPromises = scenarioIds.map(async (sid) => {
      try {
        const logRes = await fetch(
          `${MAKE_BASE}/scenarios/${sid}/logs?pg[limit]=50&status=error`,
          { headers: makeHeaders }
        );
        if (!logRes.ok) {
          await logRes.text();
          return [];
        }
        const logData = await logRes.json();
        const scenarioInfo = scenarios[sid] ?? { name: `Scenario ${sid}`, modules: 0 };
        return (logData.scenarioLogs ?? []).map((item: any) => ({
          execution_id: String(item.id ?? `${sid}-${item.timestamp}`),
          scenario_id: sid,
          scenario_name: scenarioInfo.name,
          module_name: item.lastModuleName ?? "Unknown",
          module_app: item.lastModuleApp ?? "Unknown",
          failed_module_index: item.lastModuleOrder ?? 0,
          total_modules: scenarioInfo.modules,
          error_type: item.error?.type ?? "RuntimeError",
          error_code: item.error?.code ?? null,
          error_message: item.error?.message ?? "Unknown error",
          attempts: item.attempts ?? 1,
          execution_status: "error_continued",
          flow_category: detectCategory(scenarioInfo.name),
          execution_duration_seconds: item.duration ?? null,
          occurred_at: item.createdAt ?? item.timestamp ?? new Date().toISOString(),
        }));
      } catch {
        return [];
      }
    });

    const logResults = await Promise.all(logPromises);
    for (const logs of logResults) {
      records.push(...logs);
    }

    // 4. Upsert to Supabase (never overwrite status/resolution_notes)
    let upserted = 0;
    for (const record of records) {
      const { data: existing } = await supabase
        .from("make_errors")
        .select("id, status, resolution_notes")
        .eq("execution_id", record.execution_id)
        .maybeSingle();

      if (existing) {
        // Update but preserve status and resolution_notes
        const { status: _s, resolution_notes: _r, ...updateFields } = record;
        await supabase
          .from("make_errors")
          .update(updateFields)
          .eq("execution_id", record.execution_id);
      } else {
        await supabase.from("make_errors").insert(record);
      }
      upserted++;
    }

    const stopped = records.filter((r) => r.execution_status === "stopped").length;
    const errorContinued = records.filter((r) => r.execution_status === "error_continued").length;

    return new Response(
      JSON.stringify({
        stopped,
        errorContinued,
        total: upserted,
        syncedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("fetch-make-errors error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
