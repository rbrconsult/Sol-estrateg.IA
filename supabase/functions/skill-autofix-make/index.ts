import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAKE_BASE = "https://us2.make.com/api/v2";
const KROLIC_SEND_URL = "https://api.camkrolik.com.br/core/v2/api/chats/send-text";
const CENTRAL_PHONE = "5511974426112";

// ── WhatsApp helper ──
async function sendWhatsApp(apiKey: string, phone: string, message: string): Promise<boolean> {
  try {
    const res = await fetch(KROLIC_SEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "access-token": apiKey },
      body: JSON.stringify({ number: phone, message, forceSend: true, verifyContact: false, linkPreview: false }),
    });
    return res.status >= 200 && res.status < 300;
  } catch (e) {
    console.error("[autofix] WhatsApp send error:", e);
    return false;
  }
}

// ── Claude fix via Anthropic API ──
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

// ── Make API helpers ──
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

async function fetchIncompleteExecutions(headers: Record<string, string>, teamId: string): Promise<any[]> {
  try {
    const res = await fetch(`${MAKE_BASE}/incomplete-executions?teamId=${teamId}&pg[limit]=50`, { headers });
    if (!res.ok) { await res.text(); return []; }
    const data = await res.json();
    return data.incompleteExecutions ?? [];
  } catch { return []; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── Auth: aceita cron (anon/service_role) ou user autenticado ──
    const authHeader = req.headers.get("Authorization");
    const apiKeyHeader = req.headers.get("apikey");
    if (!authHeader?.startsWith("Bearer ") && !apiKeyHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const token = authHeader?.replace("Bearer ", "") ?? "";

    let isServiceCall = !!apiKeyHeader;
    try {
      const payloadB64 = token.split(".")[1];
      if (payloadB64) {
        const payload = JSON.parse(atob(payloadB64));
        if (payload.role === "anon" || payload.role === "service_role") isServiceCall = true;
      }
    } catch { /* not JWT */ }

    if (!isServiceCall) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? apiKeyHeader ?? token;
      const anonClient = createClient(SUPABASE_URL, anonKey, {
        global: { headers: { Authorization: authHeader! } },
      });
      const { error: authError } = await anonClient.auth.getUser(token);
      if (authError) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── Env checks ──
    const MAKE_API_KEY = Deno.env.get("MAKE_API_KEY");
    const MAKE_TEAM_ID = Deno.env.get("MAKE_TEAM_ID");
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!MAKE_API_KEY) throw new Error("MAKE_API_KEY not configured");
    if (!MAKE_TEAM_ID) throw new Error("MAKE_TEAM_ID not configured");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const makeHeaders = { Authorization: `Token ${MAKE_API_KEY}`, "Content-Type": "application/json" };
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // ── Krolic API key ──
    const { data: settings } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["krolic_api_token"]);
    const krolicKey = settings?.find((s: any) => s.key === "krolic_api_token")?.value;

    // ── Skill toggle check ──
    const { data: toggleData } = await supabase
      .from("skill_toggles")
      .select("enabled")
      .eq("skill_id", "6.12")
      .maybeSingle();
    if (toggleData && !toggleData.enabled) {
      return new Response(JSON.stringify({ skipped: true, reason: "Skill 6.12 desabilitada" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 1. Fetch incomplete executions (erros que pararam o fluxo) ──
    console.log("[autofix] Buscando execuções incompletas...");
    const incompletes = await fetchIncompleteExecutions(makeHeaders, MAKE_TEAM_ID);
    console.log(`[autofix] ${incompletes.length} execuções incompletas encontradas`);

    // ── 2. Deduplicação: só processa erros novos ──
    const seenErrors = new Set<string>();
    const { data: recentFixes } = await supabase
      .from("sol_insights")
      .select("dados")
      .eq("tipo", "autofix")
      .gte("created_at", new Date(Date.now() - 3600000).toISOString()) // última 1h
      .limit(100);
    
    recentFixes?.forEach((fix: any) => {
      const execId = fix.dados?.execution_id;
      if (execId) seenErrors.add(String(execId));
    });

    const newErrors = incompletes.filter((item) => !seenErrors.has(String(item.id)));
    console.log(`[autofix] ${newErrors.length} erros novos (${seenErrors.size} já vistos)`);

    const results: Array<{
      scenario_id: number;
      scenario_name: string;
      error: string;
      fixed: boolean;
      patched: boolean;
      explanation: string;
    }> = [];

    // ── 3. Para cada erro novo: blueprint → Claude → PATCH → WhatsApp ──
    for (const item of newErrors) {
      const scenarioId = item.scenarioId;
      const scenarioName = item.scenarioName ?? `Scenario ${scenarioId}`;
      const errorMsg = item.reason?.message ?? item.reason ?? "Unknown error";
      const moduleName = item.lastModuleName ?? "Unknown";

      console.log(`[autofix] Processando erro em "${scenarioName}" (ID ${scenarioId})`);

      // 3a. Notifica erro detectado
      if (krolicKey) {
        await sendWhatsApp(krolicKey, CENTRAL_PHONE, [
          "🚨 *ERRO DETECTADO — AutoFix Iniciado*",
          "",
          `📋 *Fluxo:* ${scenarioName}`,
          `⚙️ *Módulo:* ${moduleName}`,
          `❌ *Erro:* ${errorMsg.substring(0, 200)}`,
          "",
          "🤖 Analisando com IA e tentando corrigir automaticamente...",
          "",
          "Sol Estrateg.IA — Skill AutoFix",
        ].join("\n"));
      }

      // 3b. Busca blueprint
      const blueprint = await fetchBlueprint(scenarioId, makeHeaders);
      if (!blueprint) {
        console.warn(`[autofix] Não foi possível buscar blueprint do cenário ${scenarioId}`);
        const explanation = "Blueprint inacessível";
        results.push({ scenario_id: scenarioId, scenario_name: scenarioName, error: errorMsg, fixed: false, patched: false, explanation });
        
        if (krolicKey) {
          await sendWhatsApp(krolicKey, CENTRAL_PHONE, [
            "⚠️ *FALHA AutoFix — Blueprint Inacessível*",
            "",
            `📋 *Fluxo:* ${scenarioName}`,
            `❌ *Erro:* ${errorMsg.substring(0, 200)}`,
            "",
            "Não foi possível acessar o blueprint. Verificação manual necessária.",
            "",
            "Sol Estrateg.IA — Skill AutoFix",
          ].join("\n"));
        }
        continue;
      }

      // 3c. Claude analisa e sugere fix
      const claudeResult = await askClaudeFix(ANTHROPIC_API_KEY, scenarioName, errorMsg, moduleName, blueprint);

      if (claudeResult.fixed && claudeResult.patchedBlueprint) {
        // 3d. Aplica PATCH no Make
        const patchResult = await patchBlueprint(scenarioId, claudeResult.patchedBlueprint, makeHeaders);

        results.push({
          scenario_id: scenarioId,
          scenario_name: scenarioName,
          error: errorMsg,
          fixed: true,
          patched: patchResult.ok,
          explanation: claudeResult.explanation,
        });

        // Registra insight
        await supabase.from("sol_insights").insert({
          franquia_id: "global",
          tipo: "autofix",
          titulo: patchResult.ok
            ? `✅ AutoFix: ${scenarioName}`
            : `⚠️ AutoFix parcial: ${scenarioName}`,
          descricao: claudeResult.explanation,
          severidade: patchResult.ok ? "info" : "warning",
          categoria: "operacional",
          robo: "skill-autofix-make",
          acao_sugerida: patchResult.ok ? "Monitorar próximas execuções" : "Verificar PATCH manual",
          dados: {
            execution_id: String(item.id),
            scenario_id: scenarioId,
            error: errorMsg,
            fix: claudeResult.explanation,
            patched: patchResult.ok,
            patch_detail: patchResult.detail,
          },
        });

        // 3e. WhatsApp resultado
        if (krolicKey) {
          if (patchResult.ok) {
            await sendWhatsApp(krolicKey, CENTRAL_PHONE, [
              "✅ *CORRIGIDO — AutoFix Aplicado*",
              "",
              `📋 *Fluxo:* ${scenarioName}`,
              `🔧 *Diagnóstico:* ${claudeResult.explanation.substring(0, 300)}`,
              "",
              "O blueprint foi atualizado automaticamente.",
              "Monitore as próximas execuções para confirmar.",
              "",
              "Sol Estrateg.IA — Skill AutoFix",
            ].join("\n"));
          } else {
            await sendWhatsApp(krolicKey, CENTRAL_PHONE, [
              "⚠️ *FALHA no PATCH — Correção Identificada mas não aplicada*",
              "",
              `📋 *Fluxo:* ${scenarioName}`,
              `🔧 *Diagnóstico:* ${claudeResult.explanation.substring(0, 200)}`,
              `❌ *PATCH:* ${patchResult.detail.substring(0, 200)}`,
              "",
              "A IA identificou a correção, mas o PATCH falhou.",
              "Verificação manual necessária.",
              "",
              "Sol Estrateg.IA — Skill AutoFix",
            ].join("\n"));
          }
        }
      } else {
        // Claude não conseguiu corrigir
        results.push({
          scenario_id: scenarioId,
          scenario_name: scenarioName,
          error: errorMsg,
          fixed: false,
          patched: false,
          explanation: claudeResult.explanation,
        });

        await supabase.from("sol_insights").insert({
          franquia_id: "global",
          tipo: "autofix",
          titulo: `❌ AutoFix falhou: ${scenarioName}`,
          descricao: claudeResult.explanation,
          severidade: "critical",
          categoria: "operacional",
          robo: "skill-autofix-make",
          acao_sugerida: "Correção manual necessária",
          dados: {
            execution_id: String(item.id),
            scenario_id: scenarioId,
            error: errorMsg,
            claude_response: claudeResult.explanation,
          },
        });

        if (krolicKey) {
          await sendWhatsApp(krolicKey, CENTRAL_PHONE, [
            "⚠️ *FALHA AutoFix — Verificação Manual Necessária*",
            "",
            `📋 *Fluxo:* ${scenarioName}`,
            `❌ *Erro:* ${errorMsg.substring(0, 200)}`,
            `🤖 *Claude:* ${claudeResult.explanation.substring(0, 200)}`,
            "",
            "A IA não conseguiu corrigir automaticamente.",
            "Intervenção manual necessária.",
            "",
            "Sol Estrateg.IA — Skill AutoFix",
          ].join("\n"));
        }
      }

      // Rate limiting entre cenários
      await new Promise((r) => setTimeout(r, 2000));
    }

    const fixed = results.filter((r) => r.patched).length;
    const failed = results.filter((r) => !r.fixed).length;

    console.log(`[autofix] Concluído: ${results.length} processados, ${fixed} corrigidos, ${failed} falharam`);

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      fixed,
      failed,
      skipped: incompletes.length - newErrors.length,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("[autofix] Fatal error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
