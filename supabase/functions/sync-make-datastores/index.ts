import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAKE_BASE = "https://us2.make.com/api/v2/data-stores";
const TEAM_ID = "1934898";

interface DSConfig {
  dsId: number;
  table: string;
  pk: string;
  mapRecord: (key: string, data: Record<string, unknown>) => Record<string, unknown>;
}

// ── Helpers ──

/** Convert empty objects {} to null */
function cleanValue(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v === "object" && !Array.isArray(v) && Object.keys(v as object).length === 0) return null;
  return v;
}

/** Pick only known columns from data, applying camelCase→snake_case for known fields */
function pickColumns(data: Record<string, unknown>, columns: string[]): Record<string, unknown> {
  const CAMEL_TO_SNAKE: Record<string, string> = {
    chatId: "chat_id",
    contactId: "contact_id",
    closerNome: "closer_nome",
    closerSmId: "closer_sm_id",
    etapaFunil: "etapa_funil",
    canalOrigem: "canal_origem",
    qualificadoPor: "qualificado_por",
    valorConta: "valor_conta",
    valorContaConfirmadoOcr: "valor_conta_confirmado_ocr",
    tipoImovel: "tipo_imovel",
    tipoTelhado: "tipo_telhado",
    acrescimoCarga: "acrescimo_carga",
    prazoDecisao: "prazo_decisao",
    formaPagamento: "forma_pagamento",
    preferenciaContato: "preferencia_contato",
    totalMensagensIa: "total_mensagens_ia",
    totalAudiosEnviados: "total_audios_enviados",
    custoOpenai: "custo_openai",
    custoElevenlabs: "custo_elevenlabs",
    custoTotalUsd: "custo_total_usd",
    resumoConversa: "resumo_conversa",
    resumoQualificacao: "resumo_qualificacao",
    transferidoComercial: "transferido_comercial",
    aguardandoContaLuz: "aguardando_conta_luz",
    projectId: "project_id",
    franquiaId: "franquia_id",
    tsCadastro: "ts_cadastro",
    tsUltimaInteracao: "ts_ultima_interacao",
    tsQualificado: "ts_qualificado",
    tsTransferido: "ts_transferido",
    tsDesqualificado: "ts_desqualificado",
    tsPedidoContaLuz: "ts_pedido_conta_luz",
    fupFollowupCount: "fup_followup_count",
    tsUltimoFup: "ts_ultimo_fup",
    valorText: "valor_text",
    updatedBy: "updated_by",
    updatedAt: "updated_at",
    krolikAtivo: "krolik_ativo",
    smId: "sm_id",
    krolikId: "krolik_id",
    krolikSetorId: "krolik_setor_id",
    horarioPicoInicio: "horario_pico_inicio",
    horarioPicoFim: "horario_pico_fim",
    taxaConversao: "taxa_conversao",
    leadsHoje: "leads_hoje",
    leadsMes: "leads_mes",
    funilId: "funil_id",
    funilNome: "funil_nome",
    smRoboId: "sm_robo_id",
    smEtiquetaRobo: "sm_etiqueta_robo",
    leadsNovos: "leads_novos",
    leadsQualificados: "leads_qualificados",
    leadsTransferidos: "leads_transferidos",
    custoTotal: "custo_total",
    tsEvento: "ts_evento",
    eventName: "event_name",
    capiSent: "capi_sent",
    googleSent: "google_sent",
    capiResponse: "capi_response",
    googleResponse: "google_response",
    tsEnviado: "ts_enviado",
    modeloNegocio: "modelo_negocio",
    dadosQualificacao: "dados_qualificacao",
    tsPrimeiraQualificacao: "ts_primeira_qualificacao",
    tsUltimaAtualizacao: "ts_ultima_atualizacao",
    valorComissao: "valor_comissao",
    percentualComissao: "percentual_comissao",
    valorProposta: "valor_proposta",
    nomeCliente: "nome_cliente",
    nomeProposta: "nome_proposta",
    emailCliente: "email_cliente",
    potenciaSistema: "potencia_sistema",
    tsProposta: "ts_proposta",
    tsPropostaAceita: "ts_proposta_aceita",
    tsCadastroProjeto: "ts_cadastro_projeto",
    tsGanho: "ts_ganho",
    tsPerdido: "ts_perdido",
    tsPagamentoComissao: "ts_pagamento_comissao",
    tsSync: "ts_sync",
    statusProjeto: "status_projeto",
    statusProposta: "status_proposta",
    valorContrato: "valor_contrato",
    motivoPerda: "motivo_perda",
    motivoPerdaId: "motivo_perda_id",
    etapaId: "etapa_id",
    representanteNome: "representante_nome",
    representanteId: "representante_id",
    campanhaNome: "campanha_nome",
    funilNome: "funil_nome",
    margemBruta: "margem_bruta",
    margemPercentual: "margem_percentual",
    custoAquisicao: "custo_aquisicao",
    comissaoValor: "comissao_valor",
    comissaoPercentual: "comissao_percentual",
    comissaoRepresentanteValor: "comissao_representante_valor",
    comissaoRepresentantePct: "comissao_representante_pct",
    comissaoStatus: "comissao_status",
    financeira: "financeira",
    parcelas: "parcelas",
    propostaAtiva: "proposta_ativa",
  };

  const result: Record<string, unknown> = {};
  const colSet = new Set(columns);

  for (const [k, v] of Object.entries(data)) {
    const snakeKey = CAMEL_TO_SNAKE[k] || k;
    if (colSet.has(snakeKey)) {
      result[snakeKey] = cleanValue(v);
    }
  }

  return result;
}

// ── DS Configurations ──

const LEADS_COLS = [
  "nome", "email", "cidade", "status", "score", "temperatura", "canal_origem",
  "franquia_id", "project_id", "identificador", "chat_id", "contact_id",
  "transferido_comercial", "total_mensagens_ia", "resumo_conversa", "resumo_qualificacao",
  "valor_conta", "tipo_imovel", "tipo_telhado", "acrescimo_carga", "prazo_decisao",
  "forma_pagamento", "preferencia_contato", "closer_nome", "closer_sm_id", "etapa_funil",
  "qualificado_por", "aguardando_conta_luz", "valor_conta_confirmado_ocr",
  "custo_openai", "custo_elevenlabs", "custo_total_usd", "total_audios_enviados",
  "ts_cadastro", "ts_ultima_interacao", "ts_qualificado", "ts_transferido",
  "ts_desqualificado", "ts_pedido_conta_luz", "fup_followup_count", "ts_ultimo_fup",
];

const CONFIG_COLS = ["valor_text", "counter", "updated_by"];
const EQUIPE_COLS = [
  "franquia_id", "nome", "cargo", "ativo", "krolik_ativo", "sm_id",
  "krolik_id", "krolik_setor_id", "horario_pico_inicio", "horario_pico_fim",
  "taxa_conversao", "leads_hoje", "leads_mes", "updated_by",
];
const FUNIS_COLS = [
  "funil_id", "funil_nome", "sm_robo_id", "sm_etiqueta_robo", "etapas", "updated_by",
];
const METRICAS_COLS = [
  "data", "robo", "franquia_id", "leads_novos", "leads_qualificados",
  "leads_transferidos", "custo_total",
];
/** Colunas alinhadas ao schema sol_propostas — tudo que existir no registro do Make DS 87423 é persistido. */
const PROJETOS_COLS = [
  "project_id",
  "identificador",
  "etapa",
  "etapa_id",
  "evento",
  "franquia_id",
  "funil_nome",
  "ts_evento",
  "ts_proposta",
  "ts_proposta_aceita",
  "ts_cadastro_projeto",
  "ts_ganho",
  "ts_perdido",
  "ts_pagamento_comissao",
  "ts_sync",
  "telefone",
  "nome_cliente",
  "email_cliente",
  "nome_proposta",
  "valor_proposta",
  "valor_contrato",
  "potencia_sistema",
  "forma_pagamento",
  "parcelas",
  "financeira",
  "status_projeto",
  "status_proposta",
  "proposta_ativa",
  "closer_nome",
  "closer_sm_id",
  "representante_nome",
  "representante_id",
  "campanha_nome",
  "canal_origem",
  "etiquetas",
  "margem_bruta",
  "margem_percentual",
  "custo_aquisicao",
  "motivo_perda",
  "motivo_perda_id",
  "comissao_valor",
  "comissao_percentual",
  "comissao_representante_valor",
  "comissao_representante_pct",
  "comissao_status",
  "valor_comissao",
  "percentual_comissao",
];
const QUALIFICACAO_COLS = [
  "franquia_id", "modelo_negocio", "dados_qualificacao", "resumo_qualificacao",
  "score", "temperatura", "acao", "ts_primeira_qualificacao", "ts_ultima_atualizacao",
];
const CONVERSIONS_COLS = [
  "telefone", "project_id", "event_name", "canal", "capi_sent", "google_sent",
  "capi_response", "google_response", "value", "gclid", "fbclid", "ts_evento", "ts_enviado",
];

const DS_CONFIGS: DSConfig[] = [
  {
    dsId: 87418, table: "sol_leads_sync", pk: "telefone",
    mapRecord: (key, data) => ({ telefone: key, ...pickColumns(data, LEADS_COLS), synced_at: new Date().toISOString() }),
  },
  {
    dsId: 87419, table: "sol_config_sync", pk: "key",
    mapRecord: (key, data) => ({ key, ...pickColumns(data, CONFIG_COLS), synced_at: new Date().toISOString() }),
  },
  {
    dsId: 87420, table: "sol_equipe_sync", pk: "key",
    mapRecord: (key, data) => ({ key, ...pickColumns(data, EQUIPE_COLS), synced_at: new Date().toISOString() }),
  },
  {
    dsId: 87421, table: "sol_funis_sync", pk: "franquia_id",
    mapRecord: (key, data) => ({ franquia_id: key, ...pickColumns(data, FUNIS_COLS), synced_at: new Date().toISOString() }),
  },
  {
    dsId: 87422, table: "sol_metricas_sync", pk: "key",
    mapRecord: (key, data) => ({ key, ...pickColumns(data, METRICAS_COLS), synced_at: new Date().toISOString() }),
  },
  {
    dsId: 87423, table: "sol_propostas", pk: "key",
    mapRecord: (key, data) => ({ key, ...pickColumns(data, PROJETOS_COLS), synced_at: new Date().toISOString() }),
  },
  {
    dsId: 87715, table: "sol_qualificacao_sync", pk: "telefone",
    mapRecord: (key, data) => ({ telefone: key, ...pickColumns(data, QUALIFICACAO_COLS), synced_at: new Date().toISOString() }),
  },
  {
    dsId: 87775, table: "sol_conversions_sync", pk: "key",
    mapRecord: (key, data) => ({ key, ...pickColumns(data, CONVERSIONS_COLS), synced_at: new Date().toISOString() }),
  },
];

// ── Frequency groups ──
const FREQ_5MIN = new Set([87418, 87715, 87775]);   // leads, qualificacao, conversions
const FREQ_15MIN = new Set([87422, 87423]);          // metricas, projetos
const FREQ_1H = new Set([87419, 87420, 87421]);      // config, equipe, funis

// ── Fetch from Make API ──
async function fetchDS(dsId: number, token: string): Promise<{ key: string; data: Record<string, unknown> }[]> {
  const allRecords: { key: string; data: Record<string, unknown> }[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const url = `${MAKE_BASE}/${dsId}/data?teamId=${TEAM_ID}&pg[limit]=${limit}&pg[offset]=${offset}`;
    const res = await fetch(url, {
      headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Make API ${dsId}: ${res.status} — ${body}`);
    }
    const json = await res.json();
    const records = json.records || json;
    if (!Array.isArray(records) || records.length === 0) break;
    allRecords.push(...records);
    if (records.length < limit) break; // Last page
    offset += limit;
  }

  return allRecords;
}

// ── Upsert to Supabase ──
async function syncDS(config: DSConfig, token: string, supabase: ReturnType<typeof createClient>): Promise<{ table: string; fetched: number; upserted: number; error?: string }> {
  try {
    const records = await fetchDS(config.dsId, token);
    if (records.length === 0) {
      return { table: config.table, fetched: 0, upserted: 0 };
    }

    const rows = records.map(r => config.mapRecord(r.key, r.data || {}));

    // Upsert in batches of 100
    let upserted = 0;
    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await supabase
        .from(config.table)
        .upsert(batch as never[], { onConflict: config.pk, ignoreDuplicates: false });
      if (error) {
        return { table: config.table, fetched: records.length, upserted, error: error.message };
      }
      upserted += batch.length;
    }

    return { table: config.table, fetched: records.length, upserted };
  } catch (e) {
    return { table: config.table, fetched: 0, upserted: 0, error: (e as Error).message };
  }
}

// ── Main Handler ──
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const makeToken = Deno.env.get("MAKE_API_KEY");
    if (!makeToken) {
      return new Response(JSON.stringify({ error: "MAKE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Determine which DSes to sync based on "group" parameter
    let group = "all";
    try {
      const body = await req.json();
      group = body.group || "all";
    } catch {
      // No body = sync all
    }

    let configs: DSConfig[];
    switch (group) {
      case "fast":    // 5min: leads, qualificacao, conversions
        configs = DS_CONFIGS.filter(c => FREQ_5MIN.has(c.dsId));
        break;
      case "medium":  // 15min: metricas, projetos
        configs = DS_CONFIGS.filter(c => FREQ_15MIN.has(c.dsId));
        break;
      case "slow":    // 1h: config, equipe, funis
        configs = DS_CONFIGS.filter(c => FREQ_1H.has(c.dsId));
        break;
      default:        // all
        configs = DS_CONFIGS;
    }

    // Sync all configs in parallel
    const results = await Promise.all(configs.map(c => syncDS(c, makeToken, supabase)));

    // Log to integration_runs
    const totalFetched = results.reduce((a, r) => a + r.fetched, 0);
    const totalUpserted = results.reduce((a, r) => a + r.upserted, 0);
    const errors = results.filter(r => r.error);

    await supabase.from("integration_runs").insert({
      integration_name: `sync-make-ds-${group}`,
      status: errors.length > 0 ? "partial" : "success",
      rows_received: totalFetched,
      rows_upserted: totalUpserted,
      error_message: errors.length > 0 ? errors.map(e => `${e.table}: ${e.error}`).join("; ") : null,
      franquia_id: "evolve_olimpia",
      meta: { group, results },
    });

    return new Response(JSON.stringify({ success: true, group, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
