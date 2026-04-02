import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Check role
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

    // Use OPENAI_API_KEY if available, fallback to LOVABLE_API_KEY
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    let apiUrl: string;
    let apiKey: string;
    let model: string;

    if (openaiKey) {
      apiUrl = "https://api.openai.com/v1/chat/completions";
      apiKey = openaiKey;
      model = "gpt-4o";
    } else if (lovableKey) {
      apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
      apiKey = lovableKey;
      model = "google/gemini-3-flash-preview";
    } else {
      return new Response(JSON.stringify({ error: "No AI API key configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tablesAvailable = [
      "sol_leads_sync (leads com telefone, nome, status, temperatura, score, etapa_funil, canal_origem, ts_cadastro, custo_total_usd)",
      "sol_equipe_sync (vendedores com nome, cargo, taxa_conversao, leads_hoje, leads_mes)",
      "sol_config_sync (configurações do robô SDR)",
      "sol_funis_sync (etapas do funil)",
      "sol_conversions_sync (conversões CAPI)",
      "campaign_metrics (métricas de anúncios: spend, clicks, leads, cpl, roas)",
      "analytics_ga4_daily (sessões, usuários, bounce, conversões)",
      "make_heartbeat (saúde dos cenários de automação)",
      "make_errors (erros de cenários)",
      "report_templates (templates de relatórios WhatsApp)",
    ];

    const prompt = `Você é um arquiteto de automações inteligentes para a plataforma Scale (multi-vertical).

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
  "alert_channel": "whatsapp|insight|dashboard|none"
}`;

    const aiResp = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione fundos na sua conta." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResp.text();
      console.error("AI error:", aiResp.status, errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: "AI did not return valid JSON", raw: content }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const skillDef = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ success: true, skill: skillDef, provider: openaiKey ? "openai" : "lovable" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("generate-skill error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
