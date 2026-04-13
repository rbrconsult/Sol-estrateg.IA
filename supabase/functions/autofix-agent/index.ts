import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAKE_BASE = "https://us2.make.com/api/v2";
const KROLIC_SEND_URL =
  "https://api.camkrolik.com.br/core/v2/api/chats/send-text";

// ── WhatsApp helper ──
async function sendWhatsApp(
  apiKey: string,
  phone: string,
  message: string
): Promise<boolean> {
  try {
    const cleanPhone = phone.replace(/\D/g, "");
    const p = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const res = await fetch(KROLIC_SEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "access-token": apiKey },
      body: JSON.stringify({
        number: p,
        message,
        forceSend: true,
        verifyContact: false,
        linkPreview: false,
      }),
    });
    try { await res.text(); } catch { /* drain */ }
    return res.status >= 200 && res.status < 300;
  } catch (e) {
    console.error("[whatsapp] send error:", e);
    return false;
  }
}

// ── Make API helpers ──
async function fetchScenarios(
  teamId: string,
  headers: Record<string, string>
): Promise<any[]> {
  // Find monitored folder using configurable prefix
  const { data: folderPrefixSetting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "autofix_folder_prefix")
    .maybeSingle();
  const folderPrefix = (folderPrefixSetting?.value || "solestrategia").toLowerCase();

  let folderId: number | null = null;
  try {
    const fRes = await fetch(
      `${MAKE_BASE}/scenarios-folders?teamId=${teamId}`,
      { headers }
    );
    if (fRes.ok) {
      const fData = await fRes.json();
      const folders = fData.scenariosFolders ?? fData.folders ?? fData ?? [];
      const match = (Array.isArray(folders) ? folders : []).find(
        (f: any) => (f.name ?? "").toLowerCase().includes(folderPrefix)
      );
      if (match) folderId = match.id;
    }
  } catch { /* ignore */ }

  const url = folderId
    ? `${MAKE_BASE}/scenarios?teamId=${teamId}&folderId=${folderId}&pg[limit]=200`
    : `${MAKE_BASE}/scenarios?teamId=${teamId}&pg[limit]=200`;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Scenarios fetch failed [${res.status}]`);
  const data = await res.json();
  return data.scenarios ?? [];
}

async function activateScenario(
  scenarioId: number,
  headers: Record<string, string>
): Promise<{ ok: boolean; detail: string }> {
  try {
    // Make API uses PATCH /scenarios/{id} with scheduling to activate
    const res = await fetch(`${MAKE_BASE}/scenarios/${scenarioId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        scheduling: JSON.stringify({ type: "indefinitely", interval: 900 }),
      }),
    });
    const body = await res.text();
    if (!res.ok) {
      return { ok: false, detail: `PATCH scheduling falhou [${res.status}]: ${body.substring(0, 200)}` };
    }

    // Now start the scenario
    const startRes = await fetch(`${MAKE_BASE}/scenarios/${scenarioId}/start`, {
      method: "POST",
      headers,
    });
    const startBody = await startRes.text();
    if (startRes.ok) return { ok: true, detail: "Cenário ativado e iniciado com sucesso" };
    // Even if start fails, scheduling was set
    return { ok: true, detail: `Scheduling atualizado. Start: [${startRes.status}] ${startBody.substring(0, 150)}` };
  } catch (e) {
    return { ok: false, detail: `Erro: ${e}` };
  }
}

// ── Main ──
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const MAKE_API_KEY = Deno.env.get("MAKE_API_KEY");
    const MAKE_TEAM_ID = Deno.env.get("MAKE_TEAM_ID") ?? "1934898";

    if (!MAKE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "MAKE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const makeHeaders = {
      Authorization: `Token ${MAKE_API_KEY}`,
      "Content-Type": "application/json",
    };

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if skill 6.12 is enabled
    const { data: toggleData } = await supabase
      .from("skill_toggles")
      .select("enabled")
      .eq("skill_id", "6.12")
      .maybeSingle();

    if (toggleData && !toggleData.enabled) {
      console.log("[autofix-agent] Skill 6.12 disabled, skipping");
      return new Response(
        JSON.stringify({ skipped: true, reason: "Skill 6.12 disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduplication: minimum 10 min between runs
    const DEDUP_KEY = "autofix_agent_last_run";
    const { data: lastRun } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", DEDUP_KEY)
      .maybeSingle();

    const lastRunTime = lastRun?.value ? new Date(lastRun.value).getTime() : 0;
    const now = Date.now();

    // Configurable cooldown (default 10 min)
    const { data: cooldownSetting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "autofix_cooldown_minutes")
      .maybeSingle();
    const cooldownMin = Number(cooldownSetting?.value || "10");
    const MIN_INTERVAL_MS = cooldownMin * 60 * 1000;

    if (now - lastRunTime < MIN_INTERVAL_MS) {
      console.log("[autofix-agent] Skipping — ran recently");
      return new Response(
        JSON.stringify({ skipped: true, reason: "Ran recently", lastRun: lastRun?.value }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[autofix-agent] Starting autonomous scan...");

    // 1. Fetch all scenarios
    const scenarios = await fetchScenarios(MAKE_TEAM_ID, makeHeaders);
    // Cenários excluídos do autofix (lidos do banco)
    const { data: excludedSetting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "autofix_excluded_scenarios")
      .maybeSingle();
    let EXCLUDED_SCENARIOS: string[] = ["SOL Remarketing"];
    try {
      if (excludedSetting?.value) EXCLUDED_SCENARIOS = JSON.parse(excludedSetting.value);
    } catch { /* keep default */ }

    const inactive = scenarios.filter(
      (s: any) =>
        !(s.isActive ?? s.scheduling?.isActive ?? true) &&
        !EXCLUDED_SCENARIOS.some((name) =>
          (s.name ?? "").toLowerCase().includes(name.toLowerCase())
        )
    );

    console.log(
      `[autofix-agent] ${scenarios.length} cenários, ${inactive.length} inativos`
    );

    // 2. Activate all inactive scenarios
    const results: Array<{
      id: number;
      name: string;
      activated: boolean;
      detail: string;
    }> = [];

    for (const s of inactive) {
      console.log(`[autofix-agent] Ativando "${s.name}" (ID ${s.id})...`);
      const result = await activateScenario(s.id, makeHeaders);
      results.push({ id: s.id, name: s.name, activated: result.ok, detail: result.detail });

      // Log insight per scenario
      await supabase.from("sol_insights").insert({
        franquia_id: "global",
        tipo: "autofix",
        titulo: result.ok
          ? `✅ AutoFix: "${s.name}" reativado`
          : `⚠️ AutoFix: falha ao reativar "${s.name}"`,
        descricao: result.detail,
        severidade: result.ok ? "info" : "warning",
        categoria: "operacional",
        robo: "autofix-agent",
        acao_sugerida: result.ok
          ? "Monitorar próximas execuções"
          : "Ativar manualmente no Make",
        dados: {
          scenario_id: s.id,
          scenario_name: s.name,
          success: result.ok,
          detail: result.detail,
        },
      });

      // Mark as resolved in make_errors
      if (result.ok) {
        await supabase
          .from("make_errors")
          .update({
            status: "resolved",
            resolved_at: new Date().toISOString(),
            resolution_notes: "Reativado automaticamente pelo AutoFix Agent",
          })
          .eq("scenario_id", s.id)
          .eq("error_type", "ScenarioInactive")
          .eq("status", "new");
      }

      // Rate limit
      await new Promise((r) => setTimeout(r, 1000));
    }

    // 3. Update last run
    await supabase
      .from("app_settings")
      .upsert(
        { key: DEDUP_KEY, value: new Date().toISOString() },
        { onConflict: "key" }
      );

    // 4. Get Krolic credentials & send summary (HARDCODED to RBR central)
    const { data: settings } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["krolic_api_token"]);

    const krolicKey = settings?.find((s: any) => s.key === "krolic_api_token")?.value;
    const centralNumber = "5511974426112"; // RBR central — único destino

    const activated = results.filter((r) => r.activated);
    const failed = results.filter((r) => !r.activated);

    if (krolicKey && centralNumber) {
      const lines = [
        "🤖 *AutoFix Agent — Varredura Automática*",
        "",
        `📊 *Total cenários:* ${scenarios.length}`,
        `🔴 *Inativos detectados:* ${inactive.length}`,
      ];

      if (activated.length > 0) {
        lines.push("");
        lines.push(`✅ *Reativados (${activated.length}):*`);
        for (const r of activated) {
          lines.push(`  • ${r.name} (ID ${r.id})`);
        }
      }

      if (failed.length > 0) {
        lines.push("");
        lines.push(`❌ *Falha na reativação (${failed.length}):*`);
        for (const r of failed) {
          lines.push(`  • ${r.name}: ${r.detail.substring(0, 100)}`);
        }
      }

      if (inactive.length === 0) {
        lines.push("");
        lines.push("✅ Todos os cenários estão ativos. Nenhuma ação necessária.");
      }

      lines.push("");
      lines.push("Sol Estrateg.IA — AutoFix Agent");

      await sendWhatsApp(krolicKey, centralNumber, lines.join("\n"));
    }

    const summary = {
      success: true,
      totalScenarios: scenarios.length,
      inactiveDetected: inactive.length,
      activated: activated.length,
      failed: failed.length,
      details: results,
      timestamp: new Date().toISOString(),
    };

    console.log(`[autofix-agent] Done: ${activated.length} activated, ${failed.length} failed`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[autofix-agent] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
