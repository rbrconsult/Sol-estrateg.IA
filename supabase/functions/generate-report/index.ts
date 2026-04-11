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

/* ── Supabase paginated fetcher ── */
async function fetchSupabaseTable(supabase: any, table: string, selectCols: string, filters?: Record<string, any>): Promise<any[]> {
  const allRows: any[] = [];
  let offset = 0;
  const pageSize = 1000;
  let hasMore = true;
  while (hasMore) {
    let q = supabase.from(table).select(selectCols).range(offset, offset + pageSize - 1);
    if (filters) {
      for (const [key, val] of Object.entries(filters)) {
        q = q.eq(key, val);
      }
    }
    const { data, error } = await q;
    if (error) { console.error(`Supabase ${table} error:`, error.message); break; }
    if (data && data.length > 0) {
      allRows.push(...data);
      hasMore = data.length === pageSize;
      offset += pageSize;
    } else {
      hasMore = false;
    }
  }
  return allRows;
}

/* ── Normalize record data (Make DS records have nested .data) ── */
function norm(rec: any): any {
  return rec?.data ?? rec;
}

/* ── Status classification ── */
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

/* ── Safe math expression evaluator ── */
function evaluateCalcExpression(expr: string, numericVars: Record<string, number>): string {
  try {
    // Replace variable names with their numeric values
    let resolved = expr.trim();
    // Sort keys by length desc to avoid partial replacements
    const sortedKeys = Object.keys(numericVars).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      resolved = resolved.replaceAll(key, String(numericVars[key]));
    }
    // Only allow numbers, operators, spaces, dots, parens
    if (!/^[\d\s+\-*/().]+$/.test(resolved)) {
      return "N/A";
    }
    // Evaluate
    const result = new Function(`"use strict"; return (${resolved});`)();
    if (typeof result !== "number" || !isFinite(result)) return "N/A";
    // Format nicely
    if (Number.isInteger(result)) return String(result);
    return result.toFixed(2);
  } catch {
    return "N/A";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth (hybrid: user JWT OR service_role/anon for cron/Make) ──
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

    // Try to decode JWT to check if it's service_role or anon (cron/Make calls)
    const token = authHeader.replace("Bearer ", "");
    let isServiceCall = false;
    let authUserId: string | null = null;

    try {
      const payloadB64 = token.split(".")[1];
      if (payloadB64) {
        const payload = JSON.parse(atob(payloadB64));
        if (payload.role === "service_role" || payload.role === "anon") {
          isServiceCall = true;
        }
      }
    } catch { /* not a standard JWT, try user auth */ }

    if (!isServiceCall) {
      const authClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: authData, error: authError } = await authClient.auth.getUser();
      if (authError || !authData.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      authUserId = authData.user.id;
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
    let baseOrganizationId: string | null = null;
    let isSuperAdmin = false;

    if (authUserId) {
      const { data: orgId } = await supabase.rpc("get_user_org", { p_user_id: authUserId });
      baseOrganizationId = orgId;
      const { data: sa } = await supabase.rpc("has_role", { _user_id: authUserId, _role: "super_admin" });
      isSuperAdmin = !!sa;
    } else {
      // Service call (Make/cron) — treat as super_admin
      isSuperAdmin = true;
    }

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

    // ── Resolve Make credentials ──
    let makeApiKey = "";
    let dsThreadId = "";
    let dsComercialId = "";
    let dsMetaAdsId = "";
    let dsGoogleAdsId = "";
    let dsProducaoId = "";
    const makeTeamId = (Deno.env.get("MAKE_TEAM_ID") || "1934898").trim();

    if (effectiveOrgId) {
      const { data: orgConfigs } = await supabase
        .from("organization_configs")
        .select("config_key, config_value")
        .eq("organization_id", effectiveOrgId)
        .in("config_key", ["make_api_key", "ds_thread", "ds_thread_id", "ds_comercial", "ds_meta_ads", "ds_google_ads", "ds_producao", "ds_sol_producao"]);
      for (const c of orgConfigs || []) {
        if (c.config_key === "make_api_key") makeApiKey = c.config_value.trim();
        if (c.config_key === "ds_thread" || c.config_key === "ds_thread_id") dsThreadId = dsThreadId || c.config_value.trim();
        if (c.config_key === "ds_comercial") dsComercialId = c.config_value.trim();
        if (c.config_key === "ds_meta_ads") dsMetaAdsId = c.config_value.trim();
        if (c.config_key === "ds_google_ads") dsGoogleAdsId = c.config_value.trim();
        if (c.config_key === "ds_producao" || c.config_key === "ds_sol_producao") dsProducaoId = dsProducaoId || c.config_value.trim();
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

    // ── Get allowed team members ──
    let allowedNames: string[] = [];
    let orgSlug = "";
    if (effectiveOrgId) {
      const { data: orgData } = await supabase.from("organizations").select("slug").eq("id", effectiveOrgId).single();
      orgSlug = orgData?.slug || "";
      if (orgSlug) {
        const { data: team } = await supabase
          .from("sol_equipe_sync")
          .select("nome, sm_id")
          .eq("franquia_id", orgSlug)
          .eq("ativo", true);
        allowedNames = (team || []).map((m: any) => (m.nome || "").trim().toLowerCase()).filter(Boolean);
      }
    }

    console.log(`generate-report: org=${effectiveOrgId}, slug=${orgSlug}`);

    // ── 1. Fetch Make DS + Supabase tables in parallel ──
    const orgFilter = effectiveOrgId ? { organization_id: effectiveOrgId } : {};
    const [
      rawThread, rawComercial, rawMetaAds, rawGoogleAds, rawProducao,
      dbLeads, dbCampaignMetrics, dbGA4Metrics,
    ] = await Promise.all([
      dsThreadId ? fetchMakeDS(dsThreadId, makeApiKey, makeTeamId) : Promise.resolve([]),
      dsComercialId ? fetchMakeDS(dsComercialId, makeApiKey, makeTeamId) : Promise.resolve([]),
      dsMetaAdsId ? fetchMakeDS(dsMetaAdsId, makeApiKey, makeTeamId) : Promise.resolve([]),
      dsGoogleAdsId ? fetchMakeDS(dsGoogleAdsId, makeApiKey, makeTeamId) : Promise.resolve([]),
      dsProducaoId ? fetchMakeDS(dsProducaoId, makeApiKey, makeTeamId) : Promise.resolve([]),
      // Supabase tables
      fetchSupabaseTable(supabase, "sol_leads_sync",
        "telefone, nome, canal_origem, status, temperatura, score, closer_nome, etapa_funil, valor_conta, ts_cadastro, ts_qualificado, transferido_comercial",
        orgSlug ? { franquia_id: orgSlug } : {}),
      fetchSupabaseTable(supabase, "ads_meta_campaigns_daily",
        "campaign_name, campaign_id, date, spend, impressions, clicks, leads, ctr, cpc, cpl, roas, receita_gerada, objetivo",
        orgSlug ? { franquia_id: orgSlug } : {}),
      fetchSupabaseTable(supabase, "analytics_ga4_daily",
        "date, source, medium, campaign, landing_page, sessions, users, new_users, bounce_rate, avg_session_duration, conversions",
        orgSlug ? { franquia_id: orgSlug } : {}),
    ]);

    // Normalize Make DS
    const threadLeads = rawThread.map(norm);
    let comercialLeads = rawComercial.map(norm);
    if (allowedNames.length > 0) {
      comercialLeads = comercialLeads.filter((d: any) => {
        const resp = (d.responsavel || d.representante || "").toLowerCase().trim();
        return resp && allowedNames.some(n => n.includes(resp) || resp.includes(n));
      });
    }
    let metaAds = rawMetaAds.map(norm);
    let googleAds = rawGoogleAds.map(norm);
    let producao = rawProducao.map(norm);
    if (orgSlug) {
      metaAds = metaAds.filter((d: any) => d.franquia_id === orgSlug);
      googleAds = googleAds.filter((d: any) => d.franquia_id === orgSlug);
      producao = producao.filter((d: any) => d.franquia_id === orgSlug);
    }

    console.log(`generate-report: threadLeads=${threadLeads.length}, comercialLeads=${comercialLeads.length}, dbLeads=${dbLeads.length}, dbCampaigns=${dbCampaignMetrics.length}, dbGA4=${dbGA4Metrics.length}`);

    // ── 2. Calculate KPIs from REAL data ──
    const now = new Date();
    const todayStr = toDateKey(now) || "";

    // === THREAD DS KPIs ===
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

    // === COMERCIAL DS KPIs ===
    const totalComercial = comercialLeads.length;
    const propostas = comercialLeads.filter((d: any) => Number(d.valor_proposta || d.valorProposta || 0) > 0);
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

    // Robô stats
    const roboLeads = threadLeads.filter((d: any) => String(d.closer_atribuido) === "11995");
    const roboQualificados = roboLeads.filter((d: any) => {
      const st = (d.makeStatus || d.status || "").toUpperCase();
      return st.includes("QUALIFICADO") || st.includes("CONTATO");
    });

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

    const scores = threadLeads.map((d: any) => Number(d.makeScore || d.score || 0)).filter(s => s > 0);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(0) : "0";

    const etapas: Record<string, number> = {};
    comercialLeads.forEach((d: any) => {
      const e = d.etapa_sm || d.etapa || "Sem etapa";
      etapas[e] = (etapas[e] || 0) + 1;
    });

    const monthStart = todayStr ? `${todayStr.slice(0, 7)}-01` : "";

    // === ADS KPIs (Make DS) ===
    const allAds = [...metaAds, ...googleAds];
    const totalInvestimento = allAds.reduce((s: number, d: any) => s + (Number(d.gasto_total || d.custo || 0)), 0);
    const totalCliques = allAds.reduce((s: number, d: any) => s + (Number(d.cliques || 0)), 0);
    const totalLeadsAds = allAds.reduce((s: number, d: any) => s + (Number(d.leads_total || d.conversoes || 0)), 0);

    // === SUPABASE CAMPAIGN_METRICS KPIs (supplement/override) ===
    const dbSpend = dbCampaignMetrics.reduce((s: number, r: any) => s + (Number(r.spend) || 0), 0);
    const dbClicks = dbCampaignMetrics.reduce((s: number, r: any) => s + (Number(r.clicks) || 0), 0);
    const dbImpressions = dbCampaignMetrics.reduce((s: number, r: any) => s + (Number(r.impressions) || 0), 0);
    const dbAdsLeads = dbCampaignMetrics.reduce((s: number, r: any) => s + (Number(r.leads) || 0), 0);
    const dbReceita = dbCampaignMetrics.reduce((s: number, r: any) => s + (Number(r.receita) || 0), 0);

    // Use DB data if available, fallback to Make DS
    const finalInvestimento = dbSpend > 0 ? dbSpend : totalInvestimento;
    const finalCliques = dbClicks > 0 ? dbClicks : totalCliques;
    const finalImpressions = dbImpressions;
    const finalLeadsAds = dbAdsLeads > 0 ? dbAdsLeads : totalLeadsAds;

    const cplCalc = finalLeadsAds > 0 ? (finalInvestimento / finalLeadsAds) : 0;
    const cacCalc = vendasArr.length > 0 ? (finalInvestimento / vendasArr.length) : 0;
    const roiCalc = finalInvestimento > 0 ? (((faturamento - finalInvestimento) / finalInvestimento) * 100) : 0;
    const roasCalc = finalInvestimento > 0 ? (faturamento / finalInvestimento) : 0;
    const ctrCalc = finalImpressions > 0 ? ((finalCliques / finalImpressions) * 100) : 0;

    // Top campaigns (from DB if available)
    const campMap: Record<string, { gasto: number; leads: number; cliques: number }> = {};
    if (dbCampaignMetrics.length > 0) {
      dbCampaignMetrics.forEach((d: any) => {
        const name = d.campaign_name || "Sem nome";
        if (!campMap[name]) campMap[name] = { gasto: 0, leads: 0, cliques: 0 };
        campMap[name].gasto += Number(d.spend) || 0;
        campMap[name].leads += Number(d.leads) || 0;
        campMap[name].cliques += Number(d.clicks) || 0;
      });
    } else {
      allAds.forEach((d: any) => {
        const name = d.campaign_name || "Sem nome";
        if (!campMap[name]) campMap[name] = { gasto: 0, leads: 0, cliques: 0 };
        campMap[name].gasto += Number(d.gasto_total || d.custo || 0);
        campMap[name].leads += Number(d.leads_total || d.conversoes || 0);
        campMap[name].cliques += Number(d.cliques || 0);
      });
    }
    const topCampanhas = Object.entries(campMap)
      .sort((a, b) => b[1].gasto - a[1].gasto)
      .slice(0, 3)
      .map(([name, s]) => `• ${name}: R$ ${s.gasto.toFixed(2)} | ${s.leads} leads | ${s.cliques} cliques`)
      .join("\n") || "Dados de campanha não disponíveis";

    // === SUPABASE GA4 KPIs ===
    const ga4Sessions = dbGA4Metrics.reduce((s: number, r: any) => s + (Number(r.sessions) || 0), 0);
    const ga4Users = dbGA4Metrics.reduce((s: number, r: any) => s + (Number(r.users_count) || 0), 0);
    const ga4NewUsers = dbGA4Metrics.reduce((s: number, r: any) => s + (Number(r.new_users) || 0), 0);
    const ga4Conversions = dbGA4Metrics.reduce((s: number, r: any) => s + (Number(r.conversions) || 0), 0);
    const ga4BounceAvg = dbGA4Metrics.length > 0
      ? dbGA4Metrics.reduce((s: number, r: any) => s + (Number(r.bounce_rate) || 0), 0) / dbGA4Metrics.length
      : 0;
    const ga4DurationAvg = dbGA4Metrics.length > 0
      ? dbGA4Metrics.reduce((s: number, r: any) => s + (Number(r.avg_session_duration) || 0), 0) / dbGA4Metrics.length
      : 0;
    const ga4ConvRate = ga4Sessions > 0 ? ((ga4Conversions / ga4Sessions) * 100) : 0;

    // GA4 top source
    const sourceMap: Record<string, number> = {};
    dbGA4Metrics.forEach((r: any) => {
      const src = r.source || "(direct)";
      sourceMap[src] = (sourceMap[src] || 0) + (Number(r.sessions) || 0);
    });
    const ga4TopSource = Object.entries(sourceMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // === DB LEADS KPIs (supplement) ===
    const dbLeadsFechados = dbLeads.filter((l: any) => classifyStatus(l) === "Ganho");
    const dbLeadsQualif = dbLeads.filter((l: any) => {
      const st = (l.status || "").toUpperCase();
      const etapa = (l.etapa || "").toUpperCase();
      return st.includes("QUALIFICADO") || etapa.includes("QUALIFICADO");
    });
    const dbPipelineAberto = dbLeads.filter((l: any) => classifyStatus(l) === "Aberto" && Number(l.valor_proposta || 0) > 0);
    const pipelineValor = dbPipelineAberto.reduce((s: number, l: any) => s + (Number(l.valor_proposta) || 0), 0);
    const ticketMedio = dbLeadsFechados.length > 0
      ? dbLeadsFechados.reduce((s: number, l: any) => s + (Number(l.valor_proposta) || 0), 0) / dbLeadsFechados.length
      : (vendasArr.length > 0 ? faturamento / vendasArr.length : 0);

    // === PRODUÇÃO KPIs ===
    const sdrProd = producao.filter((d: any) => d.robo === "SDR");
    const fupProd = producao.filter((d: any) => d.robo === "FUP" || d.robo === "FUP_FRIO");
    const sdrMsgsEnviadas = sdrProd.reduce((s: number, d: any) => s + (Number(d.msgs_enviadas || 0)), 0);
    const sdrMsgsRecebidas = sdrProd.reduce((s: number, d: any) => s + (Number(d.msgs_recebidas || 0)), 0);
    const sdrQualDia = sdrProd.reduce((s: number, d: any) => s + (Number(d.qualificados_dia || 0)), 0);
    const fupDisparos = fupProd.reduce((s: number, d: any) => s + (Number(d.msgs_enviadas || 0)), 0);
    const fupRespostas = fupProd.reduce((s: number, d: any) => s + (Number(d.msgs_recebidas || 0)), 0);
    const fupReativados = fupProd.reduce((s: number, d: any) => s + (Number(d.qualificados_dia || 0)), 0);

    // ── 3. Build data context (display values) ──
    const dataContext: Record<string, string> = {
      data: todayStr ? todayStr.split("-").reverse().join("/") : new Date().toLocaleDateString("pt-BR"),
      leads_gerados: String(totalThread || dbLeads.length),
      leads: String(totalThread || dbLeads.length),
      leads_qualificados: String(threadQualificados.length || dbLeadsQualif.length),
      taxa_qualificacao: `${taxaQualificacao}%`,
      oportunidades: String(propostas.length),
      vendas: String(vendasArr.length || dbLeadsFechados.length),
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
      ticket_medio: `R$ ${ticketMedio.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`,
      pipeline_valor: `R$ ${pipelineValor.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`,
      pipeline_count: String(dbPipelineAberto.length),
      // Ads
      investimento: finalInvestimento > 0 ? `R$ ${finalInvestimento.toFixed(2)}` : "N/A",
      cliques_total: String(finalCliques),
      impressoes_total: String(finalImpressions),
      cpl: cplCalc > 0 ? `R$ ${cplCalc.toFixed(2)}` : "N/A",
      cac: cacCalc > 0 ? `R$ ${cacCalc.toFixed(2)}` : "N/A",
      roi: finalInvestimento > 0 ? `${roiCalc.toFixed(1)}%` : "N/A",
      roas_geral: roasCalc > 0 ? `${roasCalc.toFixed(1)}x` : "N/A",
      ctr_medio: ctrCalc > 0 ? `${ctrCalc.toFixed(2)}%` : "N/A",
      top_campanhas: topCampanhas,
      // GA4
      ga4_sessoes: String(ga4Sessions),
      ga4_usuarios: String(ga4Users),
      ga4_novos_usuarios: String(ga4NewUsers),
      ga4_conversoes: String(ga4Conversions),
      ga4_bounce: `${ga4BounceAvg.toFixed(1)}%`,
      ga4_duracao: `${Math.floor(ga4DurationAvg / 60)}m ${Math.round(ga4DurationAvg % 60)}s`,
      ga4_top_source: ga4TopSource,
      ga4_taxa_conversao: `${ga4ConvRate.toFixed(2)}%`,
      // Legacy
      qualificados: String(threadQualificados.length || dbLeadsQualif.length),
      origem: mainOrigem,
    };

    // ── Numeric variables for calc expressions ──
    const numericVars: Record<string, number> = {
      vendas_num: vendasArr.length || dbLeadsFechados.length,
      propostas_num: propostas.length,
      leads_gerados_num: totalThread || dbLeads.length,
      leads_qualificados_num: threadQualificados.length || dbLeadsQualif.length,
      faturamento_num: faturamento,
      investimento_num: finalInvestimento,
      cliques_num: finalCliques,
      impressoes_num: finalImpressions,
      ga4_sessoes_num: ga4Sessions,
      ga4_conversoes_num: ga4Conversions,
      ga4_usuarios_num: ga4Users,
      pipeline_valor_num: pipelineValor,
      pipeline_count_num: dbPipelineAberto.length,
      ticket_medio_num: ticketMedio,
      robo_leads_num: roboLeads.length,
      robo_qualificados_num: roboQualificados.length,
      cpl_num: cplCalc,
      cac_num: cacCalc,
      roi_num: roiCalc,
      roas_num: roasCalc,
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
      perfil: "N/A",
      intencao: "N/A",
      objecao: "N/A",
      proximas_acoes: "Analisar ROI por canal e ajustar orçamento",
    };

    if (LOVABLE_API_KEY && (totalThread > 0 || totalComercial > 0 || dbLeads.length > 0)) {
      try {
        const prompt = `Você é o analista de dados da Sol Estrateg.IA, plataforma de gestão comercial para energia solar.

Gere com base nos dados:
1. Três insights curtos e acionáveis (insight_1, insight_2, insight_3)
2. Uma recomendação estratégica (recomendacao)
3. Dois destaques positivos (destaque_1, destaque_2)
4. Um ponto de atenção (atencao)
5. Uma ação gerencial sugerida (acao_gerencial)

DADOS (${dataContext.data}):
- Leads (pré-venda): ${totalThread || dbLeads.length}
- Qualificados: ${threadQualificados.length || dbLeadsQualif.length} (${taxaQualificacao}%)
- Responderam: ${threadResponderam.length} (${taxaResposta}%)
- Robô SOL: ${roboLeads.length} conversas, ${roboQualificados.length} qualificados
- Score médio: ${avgScore}
- Temperatura predominante: ${mainTemp}
- Propostas (CRM): ${propostas.length}
- Vendas fechadas: ${vendasArr.length || dbLeadsFechados.length}
- Faturamento: R$ ${faturamento.toLocaleString("pt-BR")}
- Agendamentos: ${agendamentos.length}
- Pipeline: ${dbPipelineAberto.length} propostas (R$ ${pipelineValor.toLocaleString("pt-BR")})
- Distribuição por etapa CRM: ${JSON.stringify(etapas)}
- Origens: ${JSON.stringify(origens)}
- Top closers: ${JSON.stringify(Object.entries(closerMap).slice(0, 5).map(([n, s]) => ({ nome: n, ...s })))}
- INVESTIMENTO ADS: R$ ${finalInvestimento.toFixed(2)} | Cliques: ${finalCliques} | Impressões: ${finalImpressions}
- CPL: R$ ${cplCalc.toFixed(2)} | CAC: R$ ${cacCalc.toFixed(2)} | ROI: ${roiCalc.toFixed(1)}% | ROAS: ${roasCalc.toFixed(1)}x
- GA4: ${ga4Sessions} sessões, ${ga4Users} usuários, ${ga4Conversions} conversões, bounce ${ga4BounceAvg.toFixed(1)}%
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

    // First: resolve calc expressions {{calc: expr}}
    filledContent = filledContent.replace(/\{\{calc:\s*([^}]+)\}\}/gi, (_match: string, expr: string) => {
      return evaluateCalcExpression(expr, numericVars);
    });

    // Then: replace standard variables
    for (const [key, value] of Object.entries(allVars)) {
      filledContent = filledContent.replaceAll(`{{${key}}}`, String(value || ""));
    }

    // Also replace _num variables if used directly
    for (const [key, value] of Object.entries(numericVars)) {
      filledContent = filledContent.replaceAll(`{{${key}}}`, String(value));
    }

    // Fallback: any remaining {{var}} → N/A
    filledContent = filledContent.replace(/\{\{\s*[^{}]+\s*\}\}/g, "N/A");

    return new Response(JSON.stringify({
      success: true,
      content: filledContent,
      variables: { ...allVars, ...Object.fromEntries(Object.entries(numericVars).map(([k, v]) => [k, String(v)])) },
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
