import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { templateContent, templateTitle } = await req.json();
    if (!templateContent) {
      return new Response(JSON.stringify({ error: "templateContent required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 1. Query leads data (today / current month) ──
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    // Leads from thread (pre-sales)
    const { data: leads, error: leadsErr } = await supabase
      .from("leads_consolidados")
      .select("*")
      .gte("data_entrada", monthStart);

    if (leadsErr) {
      console.error("Error fetching leads:", leadsErr);
    }

    const allLeads = leads || [];
    const todayLeads = allLeads.filter((l: any) => l.data_entrada?.startsWith(todayStr));

    // ── 2. Calculate KPIs ──
    const leadsGerados = todayLeads.length || allLeads.length;

    const qualificados = todayLeads.filter((l: any) =>
      ["QUALIFICADO", "CONTATO REALIZADO"].includes(l.etapa?.toUpperCase() || "")
    );

    const comProposta = allLeads.filter((l: any) => l.valor_proposta && l.valor_proposta > 0);
    const vendas = allLeads.filter((l: any) =>
      (l.status?.toLowerCase() || "").includes("ganho") ||
      (l.etapa?.toLowerCase() || "").includes("contrato")
    );

    const faturamento = vendas.reduce((s: number, l: any) => s + (Number(l.valor_proposta) || 0), 0);

    const responderam = allLeads.filter((l: any) => l.respondeu === true);
    const taxaResposta = allLeads.length > 0
      ? ((responderam.length / allLeads.length) * 100).toFixed(1)
      : "0";

    const taxaQualificacao = leadsGerados > 0
      ? ((qualificados.length / leadsGerados) * 100).toFixed(1)
      : "0";

    // Robô stats
    const roboLeads = allLeads.filter((l: any) =>
      l.robo && l.robo !== "" && l.robo !== "N/A"
    );
    const roboQualificados = roboLeads.filter((l: any) =>
      ["QUALIFICADO", "CONTATO REALIZADO"].includes(l.etapa?.toUpperCase() || "")
    );

    // Best closer
    const closerMap: Record<string, number> = {};
    vendas.forEach((l: any) => {
      const resp = l.responsavel || "Sem responsável";
      closerMap[resp] = (closerMap[resp] || 0) + 1;
    });
    const melhorCloser = Object.entries(closerMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    const conversao = comProposta.length > 0
      ? ((vendas.length / comProposta.length) * 100).toFixed(1)
      : "0";

    // ── 3. Build data context for AI ──
    const dataContext = {
      data: todayStr.split("-").reverse().join("/"),
      leads_gerados: String(leadsGerados),
      leads_qualificados: String(qualificados.length),
      taxa_qualificacao: `${taxaQualificacao}%`,
      oportunidades: String(comProposta.length),
      vendas: String(vendas.length),
      faturamento: `R$ ${faturamento.toLocaleString("pt-BR")}`,
      conversao: `${conversao}%`,
      melhor_closer: melhorCloser,
      taxa_resposta: `${taxaResposta}%`,
      conversas_robo: String(roboLeads.length),
      leads_robo: String(roboLeads.length),
      taxa_qual_robo: roboLeads.length > 0
        ? `${((roboQualificados.length / roboLeads.length) * 100).toFixed(1)}%`
        : "0%",
      falhas: "0",
      // Closer details for closer template
      leads_distribuidos: String(allLeads.filter((l: any) => l.responsavel).length),
      reunioes: String(allLeads.filter((l: any) => l.data_agendamento).length),
      propostas: String(comProposta.length),
      // Robô template
      conversas_totais: String(roboLeads.length),
      handoff: roboLeads.length > 0
        ? `${((roboQualificados.length / roboLeads.length) * 100).toFixed(1)}%`
        : "0%",
      // Campaign
      semana: `${monthStart.split("-").reverse().slice(0, 2).join("/")} a ${todayStr.split("-").reverse().join("/")}`,
    };

    // ── 4. AI generates insights ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let aiInsights = {
      insight_1: "Dados insuficientes para gerar insight",
      insight_2: "",
      insight_3: "",
      recomendacao: "Continuar monitorando os indicadores",
      closers_detalhes: "",
      destaque_1: "",
      destaque_2: "",
      atencao: "",
      acao_gerencial: "",
      sol_conversas: String(roboLeads.length),
      sol_qualificados: `${roboQualificados.length} (${roboLeads.length > 0 ? ((roboQualificados.length / roboLeads.length) * 100).toFixed(1) : 0}%)`,
      sol_score: "0",
      sol_temperatura: "N/A",
      sol_tempo_qual: "N/A",
      sol_erros: "0",
      fup_disparos: "0",
      fup_respostas: "0",
      fup_reativados: "0",
      fup_melhor_etapa: "N/A",
      saude_cenarios: "• Todos os cenários: ✅ Operacional",
      ajuste: "Sem ajustes necessários no momento",
      investimento: "N/A",
      cpl: "N/A",
      qualificados: String(qualificados.length),
      cac: "N/A",
      roi: "N/A",
      perfil: "N/A",
      origem: "N/A",
      intencao: "N/A",
      objecao: "N/A",
      top_campanhas: "Dados de campanha não disponíveis",
      proximas_acoes: "Analisar ROI por canal e ajustar orçamento",
    };

    if (LOVABLE_API_KEY && allLeads.length > 0) {
      try {
        // Summarize data for AI
        const etapas: Record<string, number> = {};
        const origens: Record<string, number> = {};
        const responsaveis: Record<string, { leads: number; vendas: number; faturamento: number }> = {};

        allLeads.forEach((l: any) => {
          const e = l.etapa || "Sem etapa";
          etapas[e] = (etapas[e] || 0) + 1;

          const o = l.canal_origem || "Desconhecido";
          origens[o] = (origens[o] || 0) + 1;

          const r = l.responsavel || "Sem responsável";
          if (!responsaveis[r]) responsaveis[r] = { leads: 0, vendas: 0, faturamento: 0 };
          responsaveis[r].leads++;
          if ((l.status?.toLowerCase() || "").includes("ganho")) {
            responsaveis[r].vendas++;
            responsaveis[r].faturamento += Number(l.valor_proposta) || 0;
          }
        });

        const prompt = `Você é o analista de dados da Sol Estrateg.IA, uma plataforma de gestão comercial para empresas de energia solar.

Com base nos dados abaixo, gere:
1. Três insights curtos e acionáveis (insight_1, insight_2, insight_3)
2. Uma recomendação estratégica (recomendacao)
3. Dois destaques positivos (destaque_1, destaque_2) 
4. Um ponto de atenção (atencao)
5. Uma ação gerencial sugerida (acao_gerencial)

DADOS DO PERÍODO (${dataContext.data}):
- Total leads: ${leadsGerados}
- Qualificados: ${qualificados.length} (${taxaQualificacao}%)
- Com proposta: ${comProposta.length}
- Vendas: ${vendas.length}
- Faturamento: R$ ${faturamento.toLocaleString("pt-BR")}
- Taxa resposta: ${taxaResposta}%
- Distribuição por etapa: ${JSON.stringify(etapas)}
- Distribuição por origem: ${JSON.stringify(origens)}
- Performance por responsável: ${JSON.stringify(responsaveis)}

Responda APENAS com um JSON válido sem markdown, usando as chaves: insight_1, insight_2, insight_3, recomendacao, destaque_1, destaque_2, atencao, acao_gerencial. Cada valor deve ser uma string curta (máx 100 caracteres) em português do Brasil.`;

        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          // Extract JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            aiInsights = { ...aiInsights, ...parsed };
          }
        } else {
          console.error("AI gateway error:", aiResp.status, await aiResp.text());
        }
      } catch (aiErr) {
        console.error("AI error:", aiErr);
      }
    }

    // ── 5. Replace variables in template ──
    const allVars = { ...dataContext, ...aiInsights };
    let filledContent = templateContent;
    for (const [key, value] of Object.entries(allVars)) {
      filledContent = filledContent.replaceAll(`{{${key}}}`, String(value || ""));
    }

    return new Response(JSON.stringify({ 
      success: true, 
      content: filledContent,
      variables: allVars,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("generate-report error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
