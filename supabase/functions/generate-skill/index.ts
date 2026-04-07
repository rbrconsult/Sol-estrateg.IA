import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const tablesAvailable = [
  "sol_leads_sync (leads com telefone, nome, status, temperatura, score, etapa_funil, canal_origem, ts_cadastro, custo_total_usd)",
  "sol_equipe_sync (vendedores com nome, cargo, taxa_conversao, leads_hoje, leads_mes)",
  "sol_config_sync (configurações do robô SDR)",
  "sol_funis_sync (etapas do funil)",
  "sol_conversions_sync (conversões CAPI)",
  "ads_meta_campaigns_daily (métricas de anúncios: spend, clicks, leads, cpl, roas)",
  "analytics_ga4_daily (sessões, usuários, bounce, conversões)",
  "make_heartbeat (saúde dos cenários de automação)",
  "make_errors (erros de cenários)",
  "report_templates (templates de relatórios WhatsApp)",
];

async function callOpenAI(apiKey: string, prompt: string): Promise<string> {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`OpenAI error [${resp.status}]: ${t}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callClaude(apiKey: string, systemPrompt: string, userContent: string): Promise<string> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Claude error [${resp.status}]: ${t}`);
  }
  const data = await resp.json();
  return data.content?.[0]?.text || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: hasAdmin } = await supabase.rpc("has_role", { _user_id: authData.user.id, _role: "super_admin" });
    const { data: hasDirector } = await supabase.rpc("has_role", { _user_id: authData.user.id, _role: "diretor" });
    if (!hasAdmin && !hasDirector) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { description, vertical, category } = await req.json();
    if (!description || typeof description !== "string" || description.length < 10 || description.length > 2000) {
      return new Response(JSON.stringify({ error: "description required (10-2000 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══════════════════════════════════════════════════
    // ESTÁGIO 1: OpenAI gera o blueprint da skill
    // ═══════════════════════════════════════════════════
    const generatorPrompt = `Você é um arquiteto de automações inteligentes para a plataforma Scale (multi-vertical).

O gestor quer criar uma nova Skill (automação inteligente). Gere a definição completa.

DESCRIÇÃO DO GESTOR: "${description}"
VERTICAL: ${vertical || "universal"}
CATEGORIA SUGERIDA: ${category || "auto-detectar"}

TABELAS DISPONÍVEIS NO SUPABASE:
${tablesAvailable.map(t => `- ${t}`).join("\n")}

Responda APENAS com JSON válido (sem markdown):
{
  "id": "custom-XX" (use um ID descritivo curto),
  "name": "Nome da Skill (máx 40 chars)",
  "desc": "Descrição clara (máx 120 chars)",
  "category": "pre-venda|comercial|campanhas|site|financeiro|operacional|mercado",
  "verticals": ["universal"] ou ["solar","financeiro",etc],
  "fonte": "tabela(s) fonte de dados",
  "output": "o que a skill entrega",
  "trigger": "cron_5m|cron_15m|cron_1h|cron_daily|webhook|manual",
  "logic_summary": "Resumo em 2-3 linhas da lógica que a Edge Function deve implementar",
  "sql_hint": "Query SQL aproximada que busca os dados necessários (SELECT ... FROM ...)",
  "alert_channel": "whatsapp|insight|dashboard|none",
  "delivery_method": "whatsapp|email|inbox|dashboard|whatsapp+inbox" (como o resultado é entregue ao usuário),
  "frequency": "realtime|5min|15min|1h|diario|semanal|mensal|manual" (com que frequência a skill executa)
}`;

    let stage1Content: string;
    let stage1Provider: string;

    stage1Provider = "openai/gpt-4o";
    stage1Content = await callOpenAI(openaiKey, generatorPrompt);

    const jsonMatch = stage1Content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: "AI did not return valid JSON", raw: stage1Content }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let skillDef = JSON.parse(jsonMatch[0]);

    // ═══════════════════════════════════════════════════
    // ESTÁGIO 2: Claude Sonnet revisa como gestor
    // ═══════════════════════════════════════════════════
    let reviewNotes: string | null = null;

    if (anthropicKey) {
      try {
        const reviewSystem = `Você é um Diretor de Operações (DM) experiente revisando blueprints de automações inteligentes.
Seu papel é:
1. Validar se a lógica faz sentido para o negócio
2. Verificar se as tabelas referenciadas existem e fazem sentido
3. Sugerir melhorias de performance ou escopo
4. Garantir que o trigger frequency é adequado (não pollar a cada 5min algo que muda 1x/dia)
5. Avaliar se o output é acionável pelo time
6. Validar se delivery_method e frequency são coerentes com o tipo de skill

Tabelas disponíveis: ${tablesAvailable.join(", ")}

Responda APENAS com JSON válido (sem markdown):
{
  "approved": true/false,
  "score": 1-10,
  "review_notes": "Notas de revisão do DM (máx 200 chars)",
  "improvements": { ...campos do blueprint que devem ser alterados, apenas se necessário }
}`;

        const reviewContent = `PEDIDO ORIGINAL DO GESTOR: "${description}"

BLUEPRINT GERADO (Estágio 1 - OpenAI):
${JSON.stringify(skillDef, null, 2)}

Revise como DM e aprove ou sugira melhorias.`;

        const reviewRaw = await callClaude(anthropicKey, reviewSystem, reviewContent);
        const reviewMatch = reviewRaw.match(/\{[\s\S]*\}/);

        if (reviewMatch) {
          const review = JSON.parse(reviewMatch[0]);
          reviewNotes = review.review_notes || null;

          if (review.improvements && typeof review.improvements === "object") {
            skillDef = { ...skillDef, ...review.improvements };
          }

          skillDef._review = {
            approved: review.approved,
            score: review.score,
            notes: reviewNotes,
            reviewer: "claude-sonnet-4",
          };
        }
      } catch (claudeErr) {
        console.error("Claude review failed (non-blocking):", claudeErr);
        skillDef._review = {
          approved: null,
          score: null,
          notes: "Revisão indisponível — Claude não respondeu",
          reviewer: "claude-sonnet-4",
          error: true,
        };
      }
    }

    return new Response(JSON.stringify({
      success: true,
      skill: skillDef,
      pipeline: {
        stage1: stage1Provider,
        stage2: anthropicKey ? "anthropic/claude-sonnet-4" : "skipped",
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("generate-skill error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";

    if (msg.includes("429")) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (msg.includes("402")) {
      return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
