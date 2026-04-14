import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAKE_BASE = "https://us2.make.com/api/v2";
const KROLIC_SEND_URL = "https://api.camkrolik.com.br/core/v2/api/chats/send-text";

function detectCategory(name: string): string {
  const n = (name ?? "").toLowerCase();
  if (/sol|sdr|qualif/i.test(n)) return "SDR / Qualificação";
  if (/pagamento|asaas|pix/i.test(n)) return "Financeiro";
  if (/whatsapp|mensagem/i.test(n)) return "Mensageria";
  if (/solarmarket|crm|krolic/i.test(n)) return "Integração CRM";
  return "Geral Evolve";
}

// Critical flows that trigger N3 escalation
const CRITICAL_FLOW_PATTERNS = [
  /captura.*lead/i, /fluxo 1/i, /fluxo 2/i, /sdr/i, /qualif/i, 
  /sync.*ds/i, /sol.*sync/i, /data.*store/i
];

function isCriticalFlow(name: string): boolean {
  return CRITICAL_FLOW_PATTERNS.some((p) => p.test(name ?? ""));
}

async function fetchLogDetail(
  sid: number,
  logId: string,
  headers: Record<string, string>
): Promise<{ moduleName: string; moduleIndex: number } | null> {
  try {
    const res = await fetch(`${MAKE_BASE}/scenarios/${sid}/logs/${logId}`, { headers });
    if (!res.ok) { await res.text(); return null; }
    const data = await res.json();
    const detail = data.scenarioLog ?? data;
    const moduleName = detail.moduleName ?? detail.imtModuleName ?? null;
    const moduleIndex = detail.moduleIndex ?? detail.imtModuleIndex ?? detail.moduleOrder ?? null;
    if (moduleName || moduleIndex) {
      return { moduleName: moduleName ?? "Unknown", moduleIndex: moduleIndex ?? 0 };
    }
    return null;
  } catch { return null; }
}

async function enrichLogsWithModuleInfo(
  logs: any[], sid: number, headers: Record<string, string>, batchSize = 5
): Promise<void> {
  for (let i = 0; i < logs.length; i += batchSize) {
    const batch = logs.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (log) => {
        if (log.module_name !== "Unknown") return null;
        const logId = String(log._rawLogId ?? log.execution_id);
        const detail = await fetchLogDetail(sid, logId, headers);
        return { log, detail };
      })
    );
    for (const r of results) {
      if (r?.detail) {
        r.log.module_name = r.detail.moduleName;
        r.log.failed_module_index = r.detail.moduleIndex;
      }
    }
  }
}

// ── WhatsApp Alert helpers ──

async function sendWhatsAppMessage(apiKey: string, phone: string, message: string): Promise<boolean> {
  try {
    const cleanPhone = phone.replace(/\D/g, "");
    const phoneWithCountry = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const response = await fetch(KROLIC_SEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "access-token": apiKey },
      body: JSON.stringify({ number: phoneWithCountry, message, forceSend: true, verifyContact: false, linkPreview: false }),
    });
    const ok = response.status >= 200 && response.status < 300;
    try { await response.text(); } catch { /* ignore */ }
    return ok;
  } catch (e) {
    console.error("[alert] send error:", e);
    return false;
  }
}

function formatN1Message(record: any, autofixActive: boolean): string {
  const time = record.occurred_at
    ? new Date(record.occurred_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : "agora";
  const isWarning = record.execution_status === "warning";
  return [
    isWarning ? "⚠️ *ALERTA N1 — Aviso em Fluxo*" : "🟠 *ALERTA N1 — Erro em Fluxo*",
    "",
    `📋 *Fluxo:* ${record.scenario_name}`,
    `📂 *Categoria:* ${record.flow_category}`,
    `⚙️ *Módulo:* [${record.module_app}] ${record.module_name}`,
    record.failed_module_index && record.total_modules
      ? `📊 *Progresso:* Parou no módulo ${record.failed_module_index}/${record.total_modules}`
      : null,
    `🕐 *Horário:* ${time}`,
    "",
    autofixActive
      ? "🤖 *AutoFix ativado* — analisando com IA e iniciando correção automática..."
      : `O fluxo continuou executando mas registrou ${isWarning ? "um aviso" : "um erro"}.`,
    "",
    "Sol Estrateg.IA — Monitor de Fluxos",
  ].filter(Boolean).join("\n");
}

function formatN2Message(record: any, autofixActive: boolean): string {
  const time = record.occurred_at
    ? new Date(record.occurred_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : "agora";
  return [
    "🔴 *ALERTA N2 — FLUXO PARADO*",
    "",
    `📋 *Fluxo:* ${record.scenario_name}`,
    `📂 *Categoria:* ${record.flow_category}`,
    `🆔 *Scenario ID:* ${record.scenario_id}`,
    `⚙️ *Módulo com falha:* [${record.module_app}] ${record.module_name}`,
    record.failed_module_index && record.total_modules
      ? `📊 *Progresso:* Parou no módulo ${record.failed_module_index}/${record.total_modules}`
      : null,
    `❌ *Tipo de erro:* ${record.error_type ?? "Desconhecido"}`,
    `💬 *Mensagem:* ${(record.error_message ?? "Sem detalhes").substring(0, 300)}`,
    `🔄 *Tentativas:* ${record.attempts ?? 1}`,
    `🕐 *Horário:* ${time}`,
    `🆔 *Execution ID:* ${record.execution_id}`,
    "",
    autofixActive
      ? "🤖 *AutoFix ativado* — analisando com IA e iniciando correção automática..."
      : "⚠️ Este fluxo está PARADO e precisa de ação imediata.",
    "",
    "Sol Estrateg.IA — Monitor de Fluxos",
  ].filter(Boolean).join("\n");
}

function formatInactiveMessage(record: any): string {
  const time = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  return [
    "🔕 *ALERTA — FLUXO INATIVO (DESLIGADO)*",
    "",
    `📋 *Fluxo:* ${record.scenario_name}`,
    `📂 *Categoria:* ${record.flow_category}`,
    `🆔 *Scenario ID:* ${record.scenario_id}`,
    `🕐 *Detectado em:* ${time}`,
    "",
    "O cenário está *desligado* no Make e não está executando.",
    "Verifique se foi intencional ou reative o fluxo.",
    "",
    "Sol Estrateg.IA — Monitor de Fluxos",
  ].join("\n");
}

function formatN3Message(stoppedCritical: any[]): string {
  const flowList = stoppedCritical
    .map((r) => `  • ${r.scenario_name} — [${r.module_app}] ${r.module_name}`)
    .join("\n");
  return [
    "🚨🚨🚨 *ALERTA N3 — FLUXOS CRÍTICOS PARADOS* 🚨🚨🚨",
    "",
    `*${stoppedCritical.length} fluxo(s) crítico(s) estão PARADOS:*`,
    "",
    flowList,
    "",
    "Esses fluxos afetam diretamente a captura de leads, qualificação ou sincronização de dados.",
    "",
    "⚠️ *Ação imediata necessária para evitar perda de leads e receita.*",
    "",
    "Sol Estrateg.IA — Monitor de Fluxos",
  ].join("\n");
}

// ── AutoFix helpers (Claude + Make PATCH) ──

async function fetchBlueprint(scenarioId: number, headers: Record<string, string>): Promise<any | null> {
  try {
    const res = await fetch(`${MAKE_BASE}/scenarios/${scenarioId}/blueprint`, { headers });
    if (!res.ok) { await res.text(); return null; }
    const data = await res.json();
    return data.response?.blueprint ?? data.blueprint ?? data;
  } catch { return null; }
}

async function patchBlueprint(scenarioId: number, blueprint: any, headers: Record<string, string>): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch(`${MAKE_BASE}/scenarios/${scenarioId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ blueprint: JSON.stringify(blueprint) }),
    });
    const body = await res.text();
    if (res.ok) return { ok: true, detail: "Blueprint atualizado com sucesso" };
    return { ok: false, detail: `PATCH falhou [${res.status}]: ${body.substring(0, 300)}` };
  } catch (e) {
    return { ok: false, detail: `PATCH error: ${e}` };
  }
}

async function askClaudeFix(anthropicKey: string, scenarioName: string, errorMessage: string, moduleName: string, blueprint: any): Promise<{ fixed: boolean; explanation: string; patchedBlueprint?: any }> {
  const systemPrompt = `Você é um especialista em Make.com (Integromat). 
Recebe um blueprint JSON de um cenário com erro e deve:
1. Diagnosticar a causa raiz
2. Corrigir o blueprint JSON
3. Retornar APENAS JSON válido (sem markdown) no formato:
{
  "diagnosis": "explicação curta do problema",
  "fix_applied": "o que foi alterado",
  "blueprint": { ...blueprint corrigido completo... }
}
Se não for possível corrigir automaticamente, retorne:
{
  "diagnosis": "explicação",
  "fix_applied": null,
  "blueprint": null
}`;

  const userContent = `CENÁRIO: ${scenarioName}
MÓDULO COM ERRO: ${moduleName}
MENSAGEM DE ERRO: ${errorMessage}

BLUEPRINT ATUAL:
${JSON.stringify(blueprint, null, 2).substring(0, 50000)}

Analise e corrija o blueprint.`;

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error(`[autofix] Claude error [${resp.status}]: ${t}`);
      return { fixed: false, explanation: `Claude API error: ${resp.status}` };
    }

    const data = await resp.json();
    const raw = data.content?.[0]?.text || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { fixed: false, explanation: "Claude não retornou JSON válido" };
    }

    const result = JSON.parse(jsonMatch[0]);
    if (result.blueprint && result.fix_applied) {
      return {
        fixed: true,
        explanation: `${result.diagnosis} → ${result.fix_applied}`,
        patchedBlueprint: result.blueprint,
      };
    }
    return { fixed: false, explanation: result.diagnosis || "Correção automática não possível" };
  } catch (e) {
    console.error("[autofix] Claude call failed:", e);
    return { fixed: false, explanation: `Erro ao chamar Claude: ${e}` };
  }
}

async function runAutoFix(
  record: any,
  makeHeaders: Record<string, string>,
  anthropicKey: string,
  supabase: any,
  krolicKey: string | null,
  centralNumber: string | null
): Promise<{ fixed: boolean; patched: boolean; explanation: string } | null> {
  const scenarioId = record.scenario_id;
  if (!scenarioId) return null;

  console.log(`[autofix] Iniciando análise de "${record.scenario_name}" (ID ${scenarioId})`);

  // Notify start
  if (krolicKey && centralNumber) {
    await sendWhatsAppMessage(krolicKey, centralNumber, [
      "🤖 *AutoFix Iniciado*",
      "",
      `📋 *Fluxo:* ${record.scenario_name}`,
      `⚙️ *Módulo:* [${record.module_app}] ${record.module_name}`,
      `❌ *Erro:* ${(record.error_message ?? "").substring(0, 200)}`,
      "",
      "Analisando com IA e tentando corrigir automaticamente...",
      "",
      "Sol Estrateg.IA — Skill AutoFix",
    ].join("\n"));
  }

  // Fetch blueprint
  const blueprint = await fetchBlueprint(scenarioId, makeHeaders);
  if (!blueprint) {
    console.warn(`[autofix] Blueprint inacessível para cenário ${scenarioId}`);
    if (krolicKey && centralNumber) {
      await sendWhatsAppMessage(krolicKey, centralNumber, [
        "⚠️ *AutoFix — Blueprint Inacessível*",
        "",
        `📋 *Fluxo:* ${record.scenario_name}`,
        "Não foi possível acessar o blueprint. Verificação manual necessária.",
        "",
        "Sol Estrateg.IA — Skill AutoFix",
      ].join("\n"));
    }
    return { fixed: false, patched: false, explanation: "Blueprint inacessível" };
  }

  // Claude analysis
  const claudeResult = await askClaudeFix(
    anthropicKey,
    record.scenario_name,
    record.error_message ?? "Unknown error",
    record.module_name ?? "Unknown",
    blueprint
  );

  if (claudeResult.fixed && claudeResult.patchedBlueprint) {
    const patchResult = await patchBlueprint(scenarioId, claudeResult.patchedBlueprint, makeHeaders);

    // Log insight
    await supabase.from("sol_insights").insert({
      franquia_id: "global",
      tipo: "autofix",
      titulo: patchResult.ok
        ? `✅ AutoFix: ${record.scenario_name}`
        : `⚠️ AutoFix parcial: ${record.scenario_name}`,
      descricao: claudeResult.explanation,
      severidade: patchResult.ok ? "info" : "warning",
      categoria: "operacional",
      robo: "skill-autofix-make",
      acao_sugerida: patchResult.ok ? "Monitorar próximas execuções" : "Verificar PATCH manual",
      dados: {
        execution_id: record.execution_id,
        scenario_id: scenarioId,
        error: record.error_message,
        fix: claudeResult.explanation,
        patched: patchResult.ok,
        patch_detail: patchResult.detail,
      },
    });

    // Notify result
    if (krolicKey && centralNumber) {
      if (patchResult.ok) {
        await sendWhatsAppMessage(krolicKey, centralNumber, [
          "✅ *CORRIGIDO — AutoFix Aplicado*",
          "",
          `📋 *Fluxo:* ${record.scenario_name}`,
          `🔧 *Diagnóstico:* ${claudeResult.explanation.substring(0, 300)}`,
          "",
          "O blueprint foi atualizado automaticamente.",
          "Monitore as próximas execuções para confirmar.",
          "",
          "Sol Estrateg.IA — Skill AutoFix",
        ].join("\n"));
      } else {
        await sendWhatsAppMessage(krolicKey, centralNumber, [
          "⚠️ *AutoFix — PATCH Falhou*",
          "",
          `📋 *Fluxo:* ${record.scenario_name}`,
          `🔧 *Diagnóstico:* ${claudeResult.explanation.substring(0, 200)}`,
          `❌ *PATCH:* ${patchResult.detail.substring(0, 200)}`,
          "",
          "A IA identificou a correção, mas o PATCH falhou.",
          "",
          "Sol Estrateg.IA — Skill AutoFix",
        ].join("\n"));
      }
    }

    return { fixed: true, patched: patchResult.ok, explanation: claudeResult.explanation };
  } else {
    // Claude couldn't fix
    await supabase.from("sol_insights").insert({
      franquia_id: "global",
      tipo: "autofix",
      titulo: `❌ AutoFix falhou: ${record.scenario_name}`,
      descricao: claudeResult.explanation,
      severidade: "critical",
      categoria: "operacional",
      robo: "skill-autofix-make",
      acao_sugerida: "Correção manual necessária",
      dados: {
        execution_id: record.execution_id,
        scenario_id: scenarioId,
        error: record.error_message,
        claude_response: claudeResult.explanation,
      },
    });

    if (krolicKey && centralNumber) {
      await sendWhatsAppMessage(krolicKey, centralNumber, [
        "⚠️ *AutoFix — Correção Não Possível*",
        "",
        `📋 *Fluxo:* ${record.scenario_name}`,
        `🤖 *Diagnóstico:* ${claudeResult.explanation.substring(0, 200)}`,
        "",
        "A IA não conseguiu corrigir automaticamente.",
        "Intervenção manual necessária.",
        "",
        "Sol Estrateg.IA — Skill AutoFix",
      ].join("\n"));
    }

    return { fixed: false, patched: false, explanation: claudeResult.explanation };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const apiKeyHeader = req.headers.get("apikey");
    
    if (!authHeader?.startsWith("Bearer ") && !apiKeyHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const token = authHeader?.replace("Bearer ", "") ?? "";

    // Decode JWT payload to check role (anon/service_role = cron, otherwise user)
    let isServiceCall = !!apiKeyHeader;
    try {
      const payloadB64 = token.split(".")[1];
      if (payloadB64) {
        const payload = JSON.parse(atob(payloadB64));
        if (payload.role === "anon" || payload.role === "service_role") {
          isServiceCall = true;
        }
      }
    } catch { /* not a valid JWT, will validate as user */ }

    if (!isServiceCall) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? apiKeyHeader ?? token;
      const anonClient = createClient(SUPABASE_URL, anonKey, {
        global: { headers: { Authorization: authHeader! } },
      });
      const { data: userData, error: authError } = await anonClient.auth.getUser(token);
      if (authError || !userData?.user) {
        console.log(`[auth] User auth failed: ${authError?.message}`);
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    console.log(`[auth] Authorized — isServiceCall: ${isServiceCall}`);

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
    async function fetchRetry(url: string, opts: RequestInit, retries = 3): Promise<Response> {
      for (let attempt = 0; attempt < retries; attempt++) {
        const res = await fetch(url, opts);
        if (res.status === 429) {
          const wait = Math.pow(2, attempt + 1) * 1000;
          console.log(`429 rate limited, waiting ${wait}ms...`);
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }
        return res;
      }
      return fetch(url, opts);
    }

    // 1. Fetch folders to find monitored folder ("solestrategia")
    const MONITORED_FOLDER_NAME = "solestrategia_";
    let monitoredFolderId: number | null = null;
    try {
      const foldersRes = await fetchRetry(
        `${MAKE_BASE}/scenarios-folders?teamId=${MAKE_TEAM_ID}`,
        { headers: makeHeaders }
      );
      if (foldersRes.ok) {
        const foldersData = await foldersRes.json();
        const folders = foldersData.scenariosFolders ?? foldersData.folders ?? foldersData ?? [];
        const folderList = Array.isArray(folders) ? folders : [];
        console.log(`[folders] Total pastas retornadas: ${folderList.length}`);
        console.log(`[folders] Nomes: ${folderList.map((f: any) => `"${f.name}" (id:${f.id})`).join(", ")}`);
        const match = folderList.find((f: any) =>
          (f.name ?? "").toLowerCase().includes("solestrategia")
        );
        if (match) {
          monitoredFolderId = match.id;
          console.log(`[folders] Pasta "${match.name}" encontrada (ID: ${monitoredFolderId})`);
        } else {
          console.warn(`[folders] Pasta com "solestrategia" não encontrada — monitorando todos os cenários`);
        }
      }
    } catch (e) {
      console.warn("[folders] Erro ao buscar pastas:", e);
    }

    // 2. Fetch scenarios (filtered by folder if found)
    const scenarioUrl = monitoredFolderId
      ? `${MAKE_BASE}/scenarios?teamId=${MAKE_TEAM_ID}&folderId=${monitoredFolderId}&pg[limit]=200`
      : `${MAKE_BASE}/scenarios?teamId=${MAKE_TEAM_ID}&pg[limit]=200`;
    const scenariosRes = await fetchRetry(scenarioUrl, { headers: makeHeaders });
    if (!scenariosRes.ok) {
      const errText = await scenariosRes.text();
      throw new Error(`Failed to fetch scenarios [${scenariosRes.status}]: ${errText}`);
    }
    const scenariosData = await scenariosRes.json();
    const scenarios: Record<number, { name: string; modules: number; isActive: boolean }> = {};
    const inactiveScenarios: Array<{ id: number; name: string }> = [];
    for (const s of scenariosData.scenarios ?? []) {
      const active = s.isActive ?? s.scheduling?.isActive ?? true;
      scenarios[s.id] = { name: s.name, modules: s.blueprint?.flow?.length ?? 0, isActive: active };
      if (!active) {
        inactiveScenarios.push({ id: s.id, name: s.name });
      }
    }
    console.log(`[scenarios] ${Object.keys(scenarios).length} cenários monitorados${monitoredFolderId ? ` (pasta: ${MONITORED_FOLDER_NAME})` : " (todas as pastas)"}`);
    if (inactiveScenarios.length > 0) {
      console.log(`[scenarios] ${inactiveScenarios.length} cenários INATIVOS detectados: ${inactiveScenarios.map(s => s.name).join(", ")}`);
    }
    
    // Set of monitored scenario IDs for filtering incomplete executions
    const monitoredScenarioIds = new Set(Object.keys(scenarios).map(Number));

    const records: any[] = [];

    // ── Detect INACTIVE scenarios and create synthetic error records ──
    for (const inactive of inactiveScenarios) {
      records.push({
        execution_id: `inactive-${inactive.id}-${new Date().toISOString().slice(0, 13)}`,
        scenario_id: inactive.id,
        scenario_name: inactive.name,
        module_name: "N/A",
        module_app: "Scheduling",
        failed_module_index: 0,
        total_modules: scenarios[inactive.id]?.modules ?? 0,
        error_type: "ScenarioInactive",
        error_code: "INACTIVE",
        error_message: `O cenário "${inactive.name}" está INATIVO (desligado). Nenhuma execução será realizada até que seja reativado.`,
        attempts: 0,
        execution_status: "inactive",
        flow_category: detectCategory(inactive.name),
        execution_duration_seconds: null,
        occurred_at: new Date().toISOString(),
      });
    }

    // 3. Incomplete executions (stopped flows — only monitored scenarios)
    const incompleteRes = await fetch(
      `${MAKE_BASE}/incomplete-executions?teamId=${MAKE_TEAM_ID}&pg[limit]=100`,
      { headers: makeHeaders }
    );
    if (incompleteRes.ok) {
      const incompleteData = await incompleteRes.json();
      for (const item of incompleteData.incompleteExecutions ?? []) {
        // Skip scenarios outside monitored folder
        if (!monitoredScenarioIds.has(item.scenarioId)) continue;
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

    // 4. Error/warning logs from each monitored scenario (batched to avoid 429)
    const scenarioIds = Object.keys(scenarios).map(Number);
    const BATCH_SIZE = 2;
    const BATCH_DELAY = 2000;
    
    for (let i = 0; i < scenarioIds.length; i += BATCH_SIZE) {
      if (i > 0) await new Promise((r) => setTimeout(r, BATCH_DELAY));
      const batch = scenarioIds.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(async (sid) => {
        try {
          const logRes = await fetch(
            `${MAKE_BASE}/scenarios/${sid}/logs?pg[limit]=50`,
            { headers: makeHeaders }
          );
          if (!logRes.ok) { await logRes.text(); return []; }
          const logData = await logRes.json();
          const scenarioInfo = scenarios[sid] ?? { name: `Scenario ${sid}`, modules: 0 };

          const errorLogs = (logData.scenarioLogs ?? [])
            .filter((item: any) => item.status === 2 || item.status === 3)
            .map((item: any) => {
              const isWarning = item.status === 3;
              return {
                _rawLogId: item.id,
                execution_id: String(item.id ?? `${sid}-${item.timestamp}`),
                scenario_id: sid,
                scenario_name: scenarioInfo.name,
                module_name: "Unknown",
                module_app: "Unknown",
                failed_module_index: 0,
                total_modules: scenarioInfo.modules,
                error_type: isWarning ? "Warning" : "RuntimeError",
                error_code: null,
                error_message: "Error in execution",
                attempts: 1,
                execution_status: isWarning ? "warning" : "error_continued",
                flow_category: detectCategory(scenarioInfo.name),
                execution_duration_seconds: item.duration ? Math.round(item.duration / 1000) : null,
                occurred_at: item.timestamp ?? new Date().toISOString(),
              };
            });

          await enrichLogsWithModuleInfo(errorLogs, sid, makeHeaders, 2);
          return errorLogs;
        } catch { return []; }
      }));
      for (const logs of batchResults) {
        records.push(...logs);
      }
    }

    // 4. Upsert + track NEW records for alerting
    const newRecords: any[] = [];
    for (const record of records) {
      delete record._rawLogId;

      const { data: existing } = await supabase
        .from("make_errors")
        .select("id, status, resolution_notes")
        .eq("execution_id", record.execution_id)
        .maybeSingle();

      if (existing) {
        const { status: _s, resolution_notes: _r, ...updateFields } = record;
        await supabase.from("make_errors").update(updateFields).eq("execution_id", record.execution_id);
      } else {
        await supabase.from("make_errors").insert(record);
        newRecords.push(record);
      }
    }

    const stopped = records.filter((r) => r.execution_status === "stopped").length;
    const inactive = records.filter((r) => r.execution_status === "inactive").length;
    const errorContinued = records.filter((r) => r.execution_status === "error_continued").length;
    const warnings = records.filter((r) => r.execution_status === "warning").length;

    // ── 5. Hourly consolidated WhatsApp summary ──
    let alertsSent = 0;
    const autofixResults: any[] = [];

    // Get Krolic API key and central number
    const { data: settings } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["krolic_api_token", "central_whatsapp_number", "fetch_errors_last_alert"]);

    const apiKey = settings?.find((s: any) => s.key === "krolic_api_token")?.value;
    const centralNumber = settings?.find((s: any) => s.key === "central_whatsapp_number")?.value;
    const lastAlertRaw = settings?.find((s: any) => s.key === "fetch_errors_last_alert")?.value;

    // Hourly cooldown: only send summary once per hour
    const HOURLY_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
    const lastAlertTime = lastAlertRaw ? new Date(lastAlertRaw).getTime() : 0;
    const now = Date.now();
    const shouldSendSummary = (now - lastAlertTime) >= HOURLY_COOLDOWN_MS;

    if (shouldSendSummary && apiKey && centralNumber) {
      console.log(`[alerts] Hourly summary triggered — ${records.length} total records`);

      // Build consolidated summary
      const stoppedList = records.filter((r) => r.execution_status === "stopped");
      const inactiveList = records.filter((r) => r.execution_status === "inactive");
      const errorList = records.filter((r) => r.execution_status === "error_continued");
      const warningList = records.filter((r) => r.execution_status === "warning");

      const allGood = stoppedList.length === 0 && inactiveList.length === 0 && errorList.length === 0;

      let summaryMsg: string;

      if (allGood) {
        // Everything is fine
        const time = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        summaryMsg = [
          "✅ *SOL Monitor — Tudo OK*",
          "",
          `🕐 ${time}`,
          `📊 ${Object.keys(scenarios).length} cenários monitorados`,
          warningList.length > 0 ? `⚠️ ${warningList.length} aviso(s) leve(s)` : null,
          "",
          "Todos os fluxos estão rodando normalmente.",
          "",
          "Sol Estrateg.IA",
        ].filter(Boolean).join("\n");
      } else {
        // There are issues — consolidated report
        const time = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        const lines: string[] = [
          "🛑 *SOL Monitor — Resumo Horário*",
          "",
          `🕐 ${time}`,
          `📊 ${Object.keys(scenarios).length} cenários monitorados`,
          "",
        ];

        if (inactiveList.length > 0) {
          lines.push(`🔕 *${inactiveList.length} cenário(s) INATIVO(S):*`);
          for (const r of inactiveList.slice(0, 5)) {
            lines.push(`  • ${r.scenario_name} (ID ${r.scenario_id})`);
          }
          if (inactiveList.length > 5) lines.push(`  ... e mais ${inactiveList.length - 5}`);
          lines.push("");
        }

        if (stoppedList.length > 0) {
          lines.push(`🔴 *${stoppedList.length} fluxo(s) PARADO(S):*`);
          for (const r of stoppedList.slice(0, 5)) {
            const errType = r.error_type ?? "Erro";
            lines.push(`  • ${r.scenario_name} — ${errType}`);
            if (r.error_message) {
              lines.push(`    💬 ${(r.error_message as string).substring(0, 120)}`);
            }
          }
          if (stoppedList.length > 5) lines.push(`  ... e mais ${stoppedList.length - 5}`);
          lines.push("");
        }

        if (errorList.length > 0) {
          lines.push(`🟠 ${errorList.length} erro(s) em fluxos que continuaram rodando`);
        }
        if (warningList.length > 0) {
          lines.push(`⚠️ ${warningList.length} aviso(s)`);
        }

        if (stoppedList.length > 0 || inactiveList.length > 0) {
          lines.push("");
          lines.push("⚠️ *Ação manual necessária nos itens acima.*");
        }

        lines.push("");
        lines.push("Sol Estrateg.IA");

        summaryMsg = lines.join("\n");
      }

      // Send the single summary
      const sent = await sendWhatsAppMessage(apiKey, centralNumber, summaryMsg);
      if (sent) {
        alertsSent = 1;
        // Update last alert timestamp
        await supabase.from("app_settings").upsert(
          { key: "fetch_errors_last_alert", value: new Date().toISOString() },
          { onConflict: "key" }
        );
      }
      console.log(`[alerts] Hourly summary sent: ${sent}`);
    } else if (!shouldSendSummary) {
      const minutesLeft = Math.ceil((HOURLY_COOLDOWN_MS - (now - lastAlertTime)) / 60000);
      console.log(`[alerts] Cooldown active — next summary in ~${minutesLeft}min`);
    } else {
      if (!apiKey) console.warn("[alerts] Krolic API key not configured");
      if (!centralNumber) console.warn("[alerts] Central WhatsApp number not configured");
    }

    // AutoFix disabled — manual remediation preferred
    console.log("[autofix] Automatic AutoFix disabled, skipping");

    return new Response(
      JSON.stringify({
        stopped,
        inactive,
        errorContinued,
        warnings,
        total: records.length,
        newErrors: newRecords.length,
        alertsSent,
        autofix: {
          processed: autofixResults.length,
          fixed: autofixResults.filter((r) => r.patched).length,
          failed: autofixResults.filter((r) => !r.fixed).length,
        },
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
