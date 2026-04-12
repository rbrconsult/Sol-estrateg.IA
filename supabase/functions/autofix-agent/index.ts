import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAKE_MCP_URL =
  "https://us2.make.com/mcp/server/2b8e2e8f-ab5f-472e-bc9c-8c4f9255567e";
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

// ── Claude + MCP agentic loop ──
async function runAgentLoop(
  anthropicKey: string,
  teamId: string,
  prompt: string
): Promise<{ steps: string[]; finalText: string }> {
  const PROXY_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/autofix-proxy`;
  const steps: string[] = [];

  const systemPrompt = `Você é SOL AutoFix — agente autônomo de correção de cenários Make.com.

MISSÃO: RESOLVER problemas. Nunca apenas descrever.

REGRAS ABSOLUTAS:
1. Cenário INATIVO → chame scenarios_activate com o scenarioId imediatamente
2. Erro de execução → scenarios_get → analise o blueprint → scenarios_update com correção
3. Múltiplos cenários inativos → ative TODOS em sequência
4. Após cada ação → confirme o status atual
5. NUNCA finalize sem executar pelo menos uma ação corretiva

CONTEXTO:
- teamId: ${teamId}
- orgId: 6724658
- Região: us2.make.com

FORMATO: Direto. Liste ações executadas e resultado final.`;

  const messages: Array<{ role: string; content: string | Array<Record<string, unknown>> }> = [
    { role: "user", content: prompt },
  ];

  let iter = 0;
  let finalText = "";

  while (iter < 10) {
    iter++;
    steps.push(`Iteração ${iter}`);

    const res = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: systemPrompt,
        messages,
        mcp_servers: [{ type: "url", url: MAKE_MCP_URL, name: "make-rbr" }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Proxy HTTP ${res.status}: ${errText.substring(0, 300)}`);
    }

    const data = await res.json();
    if (data.error) throw new Error(JSON.stringify(data.error));

    const blocks = data.content || [];
    const asst: Array<Record<string, unknown>> = [];
    let hasTools = false;

    for (const b of blocks) {
      if (b.type === "text" && b.text?.trim()) {
        steps.push(`AI: ${b.text.substring(0, 200)}`);
        finalText = b.text;
        asst.push(b);
      } else if (b.type === "mcp_tool_use" || b.type === "tool_use") {
        hasTools = true;
        steps.push(`Tool: ${b.name} → ${JSON.stringify(b.input).substring(0, 150)}`);
        asst.push(b);
      } else if (b.type === "mcp_tool_result" || b.type === "tool_result") {
        const txt = b.content?.[0]?.text || JSON.stringify(b.content || "");
        steps.push(`Result: ${txt.substring(0, 150)}`);
        asst.push(b);
      }
    }

    messages.push({ role: "assistant", content: asst });

    if (data.stop_reason === "end_turn") {
      steps.push("✅ Concluído");
      break;
    }

    if (hasTools) {
      const hasResults = blocks.some(
        (b: Record<string, unknown>) =>
          b.type === "mcp_tool_result" || b.type === "tool_result"
      );
      if (!hasResults) messages.push({ role: "user", content: "Continue." });
      continue;
    }

    steps.push("✅ Finalizado");
    break;
  }

  if (iter >= 10) steps.push("⚠️ Limite de iterações atingido");

  return { steps, finalText };
}

// ── Main ──
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    const MAKE_TEAM_ID = Deno.env.get("MAKE_TEAM_ID") ?? "1934898";

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if skill 6.12 is enabled
    const { data: toggleData } = await supabase
      .from("skill_toggles")
      .select("enabled")
      .eq("skill_id", "6.12")
      .maybeSingle();

    const enabled = !toggleData || toggleData.enabled;
    if (!enabled) {
      console.log("[autofix-agent] Skill 6.12 disabled, skipping");
      return new Response(
        JSON.stringify({ skipped: true, reason: "Skill 6.12 disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Krolic credentials
    const { data: settings } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["krolic_api_token", "central_whatsapp_number"]);

    const krolicKey = settings?.find((s: any) => s.key === "krolic_api_token")?.value;
    const centralNumber = settings?.find((s: any) => s.key === "central_whatsapp_number")?.value;

    // Deduplication: check last run
    const DEDUP_KEY = "autofix_agent_last_run";
    const { data: lastRun } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", DEDUP_KEY)
      .maybeSingle();

    const lastRunTime = lastRun?.value ? new Date(lastRun.value).getTime() : 0;
    const now = Date.now();
    const MIN_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes minimum between runs

    if (now - lastRunTime < MIN_INTERVAL_MS) {
      console.log("[autofix-agent] Skipping — ran recently");
      return new Response(
        JSON.stringify({ skipped: true, reason: "Ran recently", lastRun: lastRun?.value }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[autofix-agent] Starting autonomous scan...");

    // Run the agent loop with the "varredura geral" prompt
    const prompt = `Liste todos os cenários do teamId ${MAKE_TEAM_ID}. Para cada isActive=false crítico para SOL v3, execute scenarios_activate. Reporte quais foram ativados.`;

    const { steps, finalText } = await runAgentLoop(ANTHROPIC_API_KEY, MAKE_TEAM_ID, prompt);

    console.log(`[autofix-agent] Completed in ${steps.length} steps`);

    // Log insight
    await supabase.from("sol_insights").insert({
      franquia_id: "global",
      tipo: "autofix",
      titulo: "🤖 AutoFix Agent — Varredura Automática",
      descricao: finalText.substring(0, 500) || "Varredura concluída",
      severidade: "info",
      categoria: "operacional",
      robo: "autofix-agent",
      acao_sugerida: "Monitorar próximas execuções",
      dados: { steps, timestamp: new Date().toISOString() },
    });

    // Update last run timestamp
    await supabase
      .from("app_settings")
      .upsert({ key: DEDUP_KEY, value: new Date().toISOString() }, { onConflict: "key" });

    // Send WhatsApp summary if there were actions
    const hasActions = steps.some((s) => s.startsWith("Tool:"));
    if (krolicKey && centralNumber && hasActions) {
      await sendWhatsApp(krolicKey, centralNumber, [
        "🤖 *AutoFix Agent — Varredura Concluída*",
        "",
        finalText.substring(0, 500) || "Nenhuma ação necessária.",
        "",
        `📊 *Iterações:* ${steps.filter((s) => s.startsWith("Iteração")).length}`,
        `🔧 *Ações:* ${steps.filter((s) => s.startsWith("Tool:")).length}`,
        "",
        "Sol Estrateg.IA — AutoFix Agent",
      ].join("\n"));
    }

    return new Response(
      JSON.stringify({
        success: true,
        stepsCount: steps.length,
        actionsCount: steps.filter((s) => s.startsWith("Tool:")).length,
        summary: finalText.substring(0, 500),
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[autofix-agent] Error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
