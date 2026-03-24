import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REPORT_TIMEZONE = "America/Sao_Paulo";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toDateKey = (value: string | Date) => {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: REPORT_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(value));
  } catch {
    return null;
  }
};

/* ── Make DS fetcher (reusable) ── */
async function fetchMakeDS(dsId: string, makeApiKey: string, teamId: string): Promise<any[]> {
  const all: any[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;
  while (hasMore) {
    const url = `https://us2.make.com/api/v2/data-stores/${dsId}/data?teamId=${teamId}&pg[limit]=${limit}&pg[offset]=${offset}`;
    const authValue = makeApiKey.startsWith("Token ") ? makeApiKey : `Token ${makeApiKey}`;
    const res = await fetch(url, {
      headers: { Authorization: authValue, "Content-Type": "application/json" },
    });
    if (!res.ok) {
      console.error(`Make DS ${dsId} error:`, res.status, await res.text());
      break;
    }
    const json = await res.json();
    const records = json?.records || json?.data || [];
    if (Array.isArray(records)) all.push(...records);
    hasMore = Array.isArray(records) && records.length === limit;
    offset += limit;
  }
  return all;
}

/* ── Normalize record data (Make DS records have nested .data) ── */
function norm(rec: any): any {
  return rec?.data ?? rec;
}

/* ── Status classification (mirrors dataAdapter mapStatus) ── */
const GANHO = ["CONTRATO ASSINADO", "COBRANÇA", "ANÁLISE DOCUMENTOS", "VISTORIA", "HOMOLOGADO", "INSTALAÇÃO", "INSTALADO", "COMISSÃO"];
const PERDIDO_ETAPAS = ["PERDIDO", "DECLÍNIO", "CANCELADO"];
function classifyStatus(d: any): "Aberto" | "Ganho" | "Perdido" {
  const etapa = (d.etapa_sm || d.etapa || "").toUpperCase().trim();
  if (GANHO.some(g => etapa.includes(g))) return "Ganho";
  if (PERDIDO_ETAPAS.some(p => etapa.includes(p))) return "Perdido";
  const st = (d.status_proposta || d.status || "").toLowerCase();
  if (st.includes("ganho")) return "Ganho";
  if (st.includes("perdido")) return "Perdido";
  return "Aberto";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { templateContent, templateTitle, organizationId: requestedOrganizationId } = await req.json();
    if (!templateContent) {
      return new Response(JSON.stringify({ error: "templateContent required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (requestedOrganizationId && !UUID_REGEX.test(String(requestedOrganizationId))) {
      return new Response(JSON.stringify({ error: "Invalid organizationId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Determine effective org ──
    const userId = authData.user.id;
    const { data: baseOrganizationId } = await supabase.rpc("get_user_org", { p_user_id: userId });
    const { data: isSuperAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "super_admin" });

    let effectiveOrgId: string | null = null;
    if (requestedOrganizationId) {
      if (requestedOrganizationId !== baseOrganizationId && !isSuperAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden organization context" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      effectiveOrgId = requestedOrganizationId;
    } else if (!isSuperAdmin) {
      effectiveOrgId = String(baseOrganizationId);
    }

    // ── Resolve Make credentials (org-specific → global fallback) ──
    let makeApiKey = "";
    let dsThreadId = "";
    let dsComercialId = "";
    let dsMetaAdsId = "";
    let dsGoogleAdsId = "";
    let dsProducaoId = "";
    const makeTeamId = (Deno.env.get("MAKE_TEAM_ID") || "1437295").trim();

    if (effectiveOrgId) {
      const { data: orgConfigs } = await supabase
        .from("organization_configs")
        .select("config_key, config_value")
        .eq("organization_id", effectiveOrgId)
        .in("config_key", ["make_api_key", "ds_thread", "ds_comercial", "ds_meta_ads", "ds_google_ads", "ds_producao"]);
      for (const c of orgConfigs || []) {
        if (c.config_key === "make_api_key") makeApiKey = c.config_value.trim();
        if (c.config_key === "ds_thread") dsThreadId = c.config_value.trim();
        if (c.config_key === "ds_comercial") dsComercialId = c.config_value.trim();
        if (c.config_key === "ds_meta_ads") dsMetaAdsId = c.config_value.trim();
        if (c.config_key === "ds_google_ads") dsGoogleAdsId = c.config_value.trim();
        if (c.config_key === "ds_producao") dsProducaoId = c.config_value.trim();
      }
    }
    if (!makeApiKey) makeApiKey = (Deno.env.get("MAKE_API_KEY") || "").trim();
    if (!dsThreadId) dsThreadId = (Deno.env.get("MAKE_DATASTORE_ID") || "").trim();
    if (!dsComercialId) dsComercialId = (Deno.env.get("MAKE_COMERCIAL_DATASTORE_ID") || "").trim();

    if (!makeApiKey) {
      return new Response(JSON.stringify({ error: "MAKE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Get allowed team members for filtering ──
    let allowedNames: string[] = [];
    if (effectiveOrgId) {
      const { data: orgData } = await supabase.from("organizations").select("slug").eq("id", effectiveOrgId).single();
      if (orgData?.slug) {
        const { data: team } = await supabase
          .from("time_comercial")
          .select("nome, sm_id")
          .eq("franquia_id", orgData.slug)
          .eq("ativo", true);
        allowedNames = (team || []).map((m: any) => (m.nome || "").trim().toLowerCase()).filter(Boolean);
      }
    }

    // Resolve org slug for Ads/Produção filtering
    let orgSlug = "";
    if (effectiveOrgId) {
      const { data: slugData } = await supabase.from("organizations").select("slug").eq("id", effectiveOrgId).single();
      orgSlug = slugData?.slug || "";
    }

    console.log(`generate-report: org=${effectiveOrgId}, slug=${orgSlug}, dsThread=${dsThreadId}, dsComercial=${dsComercialId}, dsMetaAds=${dsMetaAdsId}, dsGoogleAds=${dsGoogleAdsId}, dsProducao=${dsProducaoId}, team=${allowedNames.length}`);

    // ── 1. Fetch Make Data Stores in parallel ──
    const [rawThread, rawComercial, rawMetaAds, rawGoogleAds, rawProducao] = await Promise.all([
      dsThreadId ? fetchMakeDS(dsThreadId, makeApiKey, makeTeamId) : Promise.resolve([]),
      dsComercialId ? fetchMakeDS(dsComercialId, makeApiKey, makeTeamId) : Promise.resolve([]),
      dsMetaAdsId ? fetchMakeDS(dsMetaAdsId, makeApiKey, makeTeamId) : Promise.resolve([]),
      dsGoogleAdsId ? fetchMakeDS(dsGoogleAdsId, makeApiKey, makeTeamId) : Promise.resolve([]),
      dsProducaoId ? fetchMakeDS(dsProducaoId, makeApiKey, makeTeamId) : Promise.resolve([]),
    ]);

    // Normalize
    const threadLeads = rawThread.map(norm);
    let comercialLeads = rawComercial.map(norm);

    // Filter comercial by team members if org-scoped
    if (allowedNames.length > 0) {
      comercialLeads = comercialLeads.filter((d: any) => {
        const resp = (d.responsavel || d.representante || "").toLowerCase().trim();
        return resp && allowedNames.some(n => n.includes(resp) || resp.includes(n));
      });
    }

    // Normalize & filter Ads + Produção
    let metaAds = rawMetaAds.map(norm);
    let googleAds = rawGoogleAds.map(norm);
    let producao = rawProducao.map(norm);
    if (orgSlug) {
      metaAds = metaAds.filter((d: any) => d.franquia_id === orgSlug);
      googleAds = googleAds.filter((d: any) => d.franquia_id === orgSlug);
      producao = producao.filter((d: any) => d.franquia_id === orgSlug);
    }

    console.log(`generate-report: threadLeads=${threadLeads.length}, comercialLeads=${comercialLeads.length}, metaAds=${metaAds.length}, googleAds=${googleAds.length}, producao=${producao.length}`);

    // ── 2. Calculate KPIs from REAL data ──
    const now = new Date();
    const todayStr = toDateKey(now) || "";

    // Thread DS: pre-sales / robot data (all records, not date-filtered — DS already has current state)
    const totalThread = threadLeads.length;
    const threadResponderam = threadLeads.filter((d: any) => d.respondeu === true || d.status_resposta === "respondeu");
    const threadQualificados = threadLeads.filter((d: any) => {
      const status = (d.makeStatus || d.status || "").toUpperCase();
      return status.includes("QUALIFICADO") || status.includes("CONTATO REALIZADO");
    });
    const threadTemperatura: Record<string, number> = {};
    threadLeads.forEach((d: any) => {
      const t = d.makeTemperatura || d.temperatura || "Sem temperatura";
      threadTemperatura[t] = (threadTemperatura[t] || 0) + 1;
    });
    const mainTemp = Object.entries(threadTemperatura).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // Comercial DS: CRM proposals
    const totalComercial = comercialLeads.length;
    const propostas = comercialLeads.filter((d: any) => {
      const val = Number(d.valor_proposta || d.valorProposta || 0);
      return val > 0;
    });
    const vendasArr = comercialLeads.filter((d: any) => classifyStatus(d) === "Ganho");
    const faturamento = vendasArr.reduce((s: number, d: any) => s + (Number(d.valor_proposta || d.valorProposta || 0)), 0);
    const agendamentos = comercialLeads.filter((d: any) => d.data_agendamento || d.dataAgendamento);

    // Closer performance
    const closerMap: Record<string, { leads: number; vendas: number; faturamento: number }> = {};
    comercialLeads.forEach((d: any) => {
      const resp = d.responsavel || d.representante || "Sem responsável";
      if (!closerMap[resp]) closerMap[resp] = { leads: 0, vendas: 0, faturamento: 0 };
      closerMap[resp].leads++;
      if (classifyStatus(d) === "Ganho") {
        closerMap[resp].vendas++;
        closerMap[resp].faturamento += Number(d.valor_proposta || d.valorProposta || 0);
      }
    });
    const melhorCloser = Object.entries(closerMap).sort((a, b) => b[1].vendas - a[1].vendas)[0]?.[0] || "N/A";
    const conversao = propostas.length > 0 ? ((vendasArr.length / propostas.length) * 100).toFixed(1) : "0";
    const taxaResposta = totalThread > 0 ? ((threadResponderam.length / totalThread) * 100).toFixed(1) : "0";
    const taxaQualificacao = totalThread > 0 ? ((threadQualificados.length / totalThread) * 100).toFixed(1) : "0";

    // Robô stats (closer_atribuido = 11995 in thread DS)
    const roboLeads = threadLeads.filter((d: any) => String(d.closer_atribuido) === "11995");
    const roboQualificados = roboLeads.filter((d: any) => {
      const st = (d.makeStatus || d.status || "").toUpperCase();
      return st.includes("QUALIFICADO") || st.includes("CONTATO");
    });

    // Closer details text
    const closerDetalhes = Object.entries(closerMap)
      .filter(([name]) => name !== "Sem responsável")
      .sort((a, b) => b[1].vendas - a[1].vendas)
      .slice(0, 5)
      .map(([name, stats]) => `• ${name}: ${stats.leads} leads | ${stats.vendas} vendas | R$ ${stats.faturamento.toLocaleString("pt-BR")}`)
      .join("\n") || "Nenhum closer com atividade";

    // Origins
    const origens: Record<string, number> = {};
    threadLeads.forEach((d: any) => {
      const o = d.canal || d.canal_origem || d.campanha || "Desconhecido";
      origens[o] = (origens[o] || 0) + 1;
    });
    const mainOrigem = Object.entries(origens).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // Scores
    const scores = threadLeads.map((d: any) => Number(d.makeScore || d.score || 0)).filter(s => s > 0);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(0) : "0";

    // Etapas distribution
    const etapas: Record<string, number> = {};
    comercialLeads.forEach((d: any) => {
      const e = d.etapa_sm || d.etapa || "Sem etapa";
      etapas[e] = (etapas[e] || 0) + 1;
    });

    const monthStart = todayStr ? `${todayStr.slice(0, 7)}-01` : "";

    // ── Ads KPIs (Meta + Google) ──
    const allAds = [...metaAds, ...googleAds];
    const totalInvestimento = allAds.reduce((s: number, d: any) => s + (Number(d.gasto_total || d.custo || 0)), 0);
    const totalCliques = allAds.reduce((s: number, d: any) => s + (Number(d.cliques || 0)), 0);
    const totalLeadsAds = allAds.reduce((s: number, d: any) => s + (Number(d.leads_total || d.conversoes || 0)), 0);
    const cplCalc = totalLeadsAds > 0 ? (totalInvestimento / totalLeadsAds) : 0;
    const cacCalc = vendasArr.length > 0 ? (totalInvestimento / vendasArr.length) : 0;
    const roiCalc = totalInvestimento > 0 ? (((faturamento - totalInvestimento) / totalInvestimento) * 100) : 0;

    // Top campaigns
    const campMap: Record<string, { gasto: number; leads: number; cliques: number }> = {};
    allAds.forEach((d: any) => {
      const name = d.campaign_name || "Sem nome";
      if (!campMap[name]) campMap[name] = { gasto: 0, leads: 0, cliques: 0 };
      campMap[name].gasto += Number(d.gasto_total || d.custo || 0);
      campMap[name].leads += Number(d.leads_total || d.conversoes || 0);
      campMap[name].cliques += Number(d.cliques || 0);
    });
    const topCampanhas = Object.entries(campMap)
      .sort((a, b) => b[1].gasto - a[1].gasto)
      .slice(0, 3)
      .map(([name, s]) => `• ${name}: R$ ${s.gasto.toFixed(2)} | ${s.leads} leads | ${s.cliques} cliques`)
      .join("\n") || "Dados de campanha não disponíveis";

    // ── Produção KPIs (SDR + FUP) ──
    const sdrProd = producao.filter((d: any) => d.robo === "SDR");
    const fupProd = producao.filter((d: any) => d.robo === "FUP" || d.robo === "FUP_FRIO");
    const sdrMsgsEnviadas = sdrProd.reduce((s: number, d: any) => s + (Number(d.msgs_enviadas || 0)), 0);
    const sdrMsgsRecebidas = sdrProd.reduce((s: number, d: any) => s + (Number(d.msgs_recebidas || 0)), 0);
    const sdrQualDia = sdrProd.reduce((s: number, d: any) => s + (Number(d.qualificados_dia || 0)), 0);
    const fupDisparos = fupProd.reduce((s: number, d: any) => s + (Number(d.msgs_enviadas || 0)), 0);
    const fupRespostas = fupProd.reduce((s: number, d: any) => s + (Number(d.msgs_recebidas || 0)), 0);
    const fupReativados = fupProd.reduce((s: number, d: any) => s + (Number(d.qualificados_dia || 0)), 0);

    // ── 3. Build data context ──
    const dataContext: Record<string, string> = {
      data: todayStr ? todayStr.split("-").reverse().join("/") : new Date().toLocaleDateString("pt-BR"),
      leads_gerados: String(totalThread),
      leads: String(totalThread),
      leads_qualificados: String(threadQualificados.length),
      taxa_qualificacao: `${taxaQualificacao}%`,
      oportunidades: String(propostas.length),
      vendas: String(vendasArr.length),
      faturamento: `R$ ${faturamento.toLocaleString("pt-BR")}`,
      conversao: `${conversao}%`,
      melhor_closer: melhorCloser,
      taxa_resposta: `${taxaResposta}%`,
      conversas_robo: String(roboLeads.length),
      leads_robo: String(roboLeads.length),
      taxa_qual_robo: roboLeads.length > 0 ? `${((roboQualificados.length / roboLeads.length) * 100).toFixed(1)}%` : "0%",
      falhas: "0",
      leads_distribuidos: String(comercialLeads.filter((d: any) => d.responsavel || d.representante).length),
      reunioes: String(agendamentos.length),
      propostas: String(propostas.length),
      conversas_totais: String(roboLeads.length),
      handoff: roboLeads.length > 0 ? `${((roboQualificados.length / roboLeads.length) * 100).toFixed(1)}%` : "0%",
      semana: monthStart ? `${monthStart.split("-").reverse().slice(0, 2).join("/")} a ${todayStr.split("-").reverse().join("/")}` : "",
    };

    // ── 4. AI insights ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let aiInsights: Record<string, string> = {
      insight_1: "Dados insuficientes para gerar insight",
      insight_2: "",
      insight_3: "",
      recomendacao: "Continuar monitorando os indicadores",
      closers_detalhes: closerDetalhes,
      destaque_1: "",
      destaque_2: "",
      atencao: "",
      acao_gerencial: "",
      sol_conversas: String(sdrMsgsEnviadas || roboLeads.length),
      sol_qualificados: `${sdrQualDia || roboQualificados.length} (${(sdrMsgsEnviadas || roboLeads.length) > 0 ? (((sdrQualDia || roboQualificados.length) / (sdrMsgsEnviadas || roboLeads.length || 1)) * 100).toFixed(1) : 0}%)`,
      sol_score: avgScore,
      sol_temperatura: mainTemp,
      sol_tempo_qual: "N/A",
      sol_erros: String(sdrProd.reduce((s: number, d: any) => s + (Number(d.erros || 0)), 0)),
      fup_disparos: String(fupDisparos),
      fup_respostas: String(fupRespostas),
      fup_reativados: String(fupReativados),
      fup_melhor_etapa: "N/A",
      saude_cenarios: "• Todos os cenários: ✅ Operacional",
      ajuste: "Sem ajustes necessários no momento",
      investimento: totalInvestimento > 0 ? `R$ ${totalInvestimento.toFixed(2)}` : "N/A",
      cpl: cplCalc > 0 ? `R$ ${cplCalc.toFixed(2)}` : "N/A",
      qualificados: String(threadQualificados.length),
      cac: cacCalc > 0 ? `R$ ${cacCalc.toFixed(2)}` : "N/A",
      roi: totalInvestimento > 0 ? `${roiCalc.toFixed(1)}%` : "N/A",
      perfil: "N/A",
      origem: mainOrigem,
      intencao: "N/A",
      objecao: "N/A",
      top_campanhas: topCampanhas,
      proximas_acoes: "Analisar ROI por canal e ajustar orçamento",
    };

    if (LOVABLE_API_KEY && (totalThread > 0 || totalComercial > 0)) {
      try {
        const prompt = `Você é o analista de dados da Sol Estrateg.IA, plataforma de gestão comercial para energia solar.

Gere com base nos dados:
1. Três insights curtos e acionáveis (insight_1, insight_2, insight_3)
2. Uma recomendação estratégica (recomendacao)
3. Dois destaques positivos (destaque_1, destaque_2)
4. Um ponto de atenção (atencao)
5. Uma ação gerencial sugerida (acao_gerencial)

DADOS (${dataContext.data}):
- Leads (pré-venda): ${totalThread}
- Qualificados: ${threadQualificados.length} (${taxaQualificacao}%)
- Responderam: ${threadResponderam.length} (${taxaResposta}%)
- Robô SOL: ${roboLeads.length} conversas, ${roboQualificados.length} qualificados
- Score médio: ${avgScore}
- Temperatura predominante: ${mainTemp}
- Propostas (CRM): ${propostas.length}
- Vendas fechadas: ${vendasArr.length}
- Faturamento: R$ ${faturamento.toLocaleString("pt-BR")}
- Agendamentos: ${agendamentos.length}
- Distribuição por etapa CRM: ${JSON.stringify(etapas)}
- Origens: ${JSON.stringify(origens)}
- Top closers: ${JSON.stringify(Object.entries(closerMap).slice(0, 5).map(([n, s]) => ({ nome: n, ...s })))}
- INVESTIMENTO ADS: R$ ${totalInvestimento.toFixed(2)} (Meta: ${metaAds.length} registros, Google: ${googleAds.length} registros)
- CPL: R$ ${cplCalc.toFixed(2)} | CAC: R$ ${cacCalc.toFixed(2)} | ROI: ${roiCalc.toFixed(1)}%
- PRODUÇÃO ROBÔS: SDR ${sdrMsgsEnviadas} msgs enviadas, ${sdrMsgsRecebidas} recebidas, ${sdrQualDia} qualificados | FUP: ${fupDisparos} disparos, ${fupRespostas} respostas, ${fupReativados} reativados

Responda APENAS com JSON válido sem markdown. Chaves: insight_1, insight_2, insight_3, recomendacao, destaque_1, destaque_2, atencao, acao_gerencial. Cada valor string curta (máx 120 chars) em pt-BR.`;

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

    // ── 5. Replace variables ──
    const allVars = { ...dataContext, ...aiInsights };
    let filledContent = templateContent;
    for (const [key, value] of Object.entries(allVars)) {
      filledContent = filledContent.replaceAll(`{{${key}}}`, String(value || ""));
    }
    // Fallback: any remaining {{var}} → N/A
    filledContent = filledContent.replace(/\{\{\s*[^{}]+\s*\}\}/g, "N/A");

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
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
