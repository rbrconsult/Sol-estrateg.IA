import { addDays, endOfDay, startOfDay } from 'date-fns';
import type { SolLead, SolProjeto } from '@/hooks/useSolData';
import {
  mapLeadStatusToProjetoStatus,
  mapProjetoRowToStatus,
  type ProjetoStatus,
} from '@/lib/projetoStatus';

export type { ProjetoStatus } from '@/lib/projetoStatus';
export { PROJETO_STATUS_KEYS, PROJETO_STATUS_LABEL, projetoStatusLabel } from '@/lib/projetoStatus';

export interface Proposal {
  id: string;
  /** `sol_projetos_sync.franquia_id` — alinhado ao slug da org no sync (hífen ou underscore). */
  franquiaId: string;
  etapa: string;
  projetoId: string;
  nomeCliente: string;
  clienteTelefone: string;
  clienteEmail: string;
  status: ProjetoStatus;
  responsavel: string;
  responsavelId: string;
  representante: string;
  valorProposta: number;
  potenciaSistema: number;
  nomeProposta: string;
  dataCriacaoProjeto: string;
  dataCriacaoProposta: string;
  slaProposta: number;
  ultimaAtualizacao: string;
  solQualificado: boolean;
  solScore: number;
  temperatura: 'QUENTE' | 'MORNO' | 'FRIO' | '';
  dataQualificacaoSol: string;
  notaCompleta: string;
  tempoNaEtapa: number;
  solSdr: boolean;
  tempoSolSdr: number;
  etiquetas: string;
  origemLead: string;
  probabilidade: number;
  motivoPerda: string;
  faseSM: string;
  makeStatus?: string;
  makeTemperatura?: string;
  makeScore?: string;
  makeRobo?: string;
  makeNome?: string;
  makeCidade?: string;
  makeEmail?: string;
  makeValorConta?: string;
  makeImovel?: string;
  makeSentimento?: string;
  makeInteresse?: string;
  makeUltimaMensagem?: string;
  makeHistorico?: { data: string; tipo: string; mensagem: string }[];
  makeStatusResposta?: string;
  makeRespondeu?: boolean;
  makeTotalMensagens?: number;
  makeMensagensRecebidas?: number;
  makeDataResposta?: string;
  /** `sol_projetos_sync.valor_comissao` (R$), quando preenchido no banco. */
  comissaoValorSync?: number;
  /** `sol_projetos_sync.percentual_comissao` (% sobre valor_proposta), quando preenchido no banco. */
  comissaoPercentualSync?: number;
}

// ── Helpers ──

function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const trimmed = dateStr.trim();
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return null;
}

function calcularTempoNaEtapa(ultimaAtualizacao: string): number {
  if (!ultimaAtualizacao) return 0;
  const d = new Date(ultimaAtualizacao);
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

const PROBABILIDADE_POR_ETAPA: Record<string, number> = {
  'TRAFEGO PAGO': 5,
  'SOL SDR': 15,
  'FOLLOW UP': 10,
  'QUALIFICADO': 40,
  'CONTATO REALIZADO': 50,
  'PROPOSTA': 60,
  'NEGOCIAÇÃO': 70,
  'COBRANÇA': 80,
  'CONTRATO ASSINADO (FN)': 95,
  'DECLÍNIO': 0,
  'REMARKETING': 5,
};

/** Convert SolLead[] to Proposal[] for backward compat with existing pages */
export function solLeadsToProposals(leads: SolLead[]): Proposal[] {
  return leads.map((l, i) => {
    const status = mapLeadStatusToProjetoStatus(l.status);
    const etapa = l.etapa_funil || 'TRAFEGO PAGO';
    const ultimaAtualizacao = parseDate(l.ts_ultima_interacao || l.ts_cadastro || '') || '';
    const tempoNaEtapa = calcularTempoNaEtapa(ultimaAtualizacao);
    const score = l.score ? parseFloat(l.score) : 0;
    const temp = (l.temperatura || '').toUpperCase();
    const temperatura = (['QUENTE', 'MORNO', 'FRIO'].includes(temp) ? temp : '') as Proposal['temperatura'];
    const probabilidade = status === 'Ganho' ? 100 : status === 'Perdido' ? 0 : (PROBABILIDADE_POR_ETAPA[l.etapa_funil || ''] ?? 20);

    return {
      id: l.project_id || l.telefone || `LEAD-${i}`,
      franquiaId: l.franquia_id || "",
      etapa,
      projetoId: l.project_id || '',
      nomeCliente: l.nome || `Lead ...${(l.telefone || '').slice(-4)}`,
      clienteTelefone: l.telefone || '',
      clienteEmail: l.email || '',
      status,
      responsavel: l.closer_nome || '',
      responsavelId: l.closer_sm_id || '',
      representante: l.closer_nome || '',
      // B4 FIX: valor_conta = conta de luz do lead (pré-venda), NÃO é valor da proposta comercial
      // valor_proposta deveria vir de sol_projetos_sync (hoje vazio)
      valorProposta: 0,
      potenciaSistema: 0,
      nomeProposta: l.nome || '',
      dataCriacaoProjeto: parseDate(l.ts_cadastro || '') || '',
      dataCriacaoProposta: parseDate(l.ts_qualificado || '') || '',
      slaProposta: 48,
      ultimaAtualizacao,
      solQualificado: (l.etapa_funil || '').toUpperCase().trim() === 'QUALIFICADO' || l.transferido_comercial === true,
      solScore: isNaN(score) ? 0 : score,
      temperatura,
      dataQualificacaoSol: parseDate(l.ts_qualificado || '') || '',
      notaCompleta: l.resumo_conversa || '',
      tempoNaEtapa,
      solSdr: ['TRAFEGO PAGO', 'SOL SDR', 'FOLLOW UP'].includes((l.etapa_funil || '').toUpperCase().trim()),
      tempoSolSdr: 0,
      etiquetas: l.canal_origem || '',
      origemLead: l.canal_origem || '',
      probabilidade,
      motivoPerda: (l.etapa_funil || '').toUpperCase().includes('DECL') ? 'Declínio' : (l.status === 'PERDIDO' ? 'Perdido' : ''),
      faseSM: l.etapa_funil || '',
      makeStatus: l.status || undefined,
      makeTemperatura: l.temperatura || undefined,
      makeScore: l.score || undefined,
      makeNome: l.nome || undefined,
      makeCidade: l.cidade || undefined,
      makeEmail: l.email || undefined,
      makeValorConta: l.valor_conta || undefined,
      makeImovel: l.tipo_imovel || undefined,
      makeSentimento: undefined,
      makeInteresse: undefined,
      makeUltimaMensagem: l.resumo_conversa || undefined,
      makeHistorico: [],
      makeStatusResposta: l.transferido_comercial ? 'respondeu' : undefined,
      makeRespondeu: l.transferido_comercial || false,
      makeTotalMensagens: l.total_mensagens_ia || 0,
      makeMensagensRecebidas: 0,
      makeDataResposta: l.ts_ultima_interacao || undefined,
    };
  });
}

function tsToMs(s: string | null | undefined): number {
  if (!s) return 0;
  const t = new Date(s).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function isNonEmptySyncField(v: string | number | null | undefined): boolean {
  if (v == null) return false;
  if (typeof v === "number") return Number.isFinite(v);
  return String(v).trim() !== "";
}

/** `synced_at` existe na tabela; tipos gerados do Supabase podem omitir. */
function projetosRowSyncedAt(r: SolProjeto): string | null | undefined {
  return (r as SolProjeto & { synced_at?: string | null }).synced_at;
}

/** PK do DS / linha de evento; fallback quando tipos não expõem `key`. */
function projetosRowKey(r: SolProjeto): string | null | undefined {
  return (r as SolProjeto & { key?: string | null }).key;
}

/**
 * sol_projetos_sync é log de eventos: linhas recentes costumam trazer etapa/status atualizados
 * mas com valor_proposta / potencia_sistema vazios. Recupera o último valor não vazio no histórico.
 */
function coalesceValorPotenciaFromHistory(group: SolProjeto[]): {
  valor_proposta: SolProjeto["valor_proposta"];
  potencia_sistema: SolProjeto["potencia_sistema"];
} {
  const sorted = [...group].sort(
    (a, b) =>
      tsToMs(b.ts_evento || projetosRowSyncedAt(b)) - tsToMs(a.ts_evento || projetosRowSyncedAt(a)),
  );
  let valor_proposta: SolProjeto["valor_proposta"] = null;
  let potencia_sistema: SolProjeto["potencia_sistema"] = null;
  for (const r of sorted) {
    if (valor_proposta == null || !isNonEmptySyncField(valor_proposta)) {
      if (isNonEmptySyncField(r.valor_proposta)) valor_proposta = r.valor_proposta;
    }
    if (potencia_sistema == null || !isNonEmptySyncField(potencia_sistema)) {
      if (isNonEmptySyncField(r.potencia_sistema)) potencia_sistema = r.potencia_sistema;
    }
    if (isNonEmptySyncField(valor_proposta) && isNonEmptySyncField(potencia_sistema)) break;
  }
  return { valor_proposta, potencia_sistema };
}

/** Uma linha por project_id: estado atual = evento mais recente; valor/potência = último preenchido no histórico. */
export function dedupeProjetosLatest(rows: SolProjeto[]): SolProjeto[] {
  const byProject = new Map<string, SolProjeto[]>();
  for (const r of rows) {
    const id = r.project_id;
    if (!id) continue;
    if (!byProject.has(id)) byProject.set(id, []);
    byProject.get(id)!.push(r);
  }
  const out: SolProjeto[] = [];
  for (const [, group] of byProject) {
    const sorted = [...group].sort(
      (a, b) =>
        tsToMs(b.ts_evento || projetosRowSyncedAt(b)) - tsToMs(a.ts_evento || projetosRowSyncedAt(a)),
    );
    const latest = sorted[0];
    const { valor_proposta, potencia_sistema } = coalesceValorPotenciaFromHistory(sorted);
    const v =
      valor_proposta != null && isNonEmptySyncField(valor_proposta) ? valor_proposta : latest.valor_proposta;
    const p =
      potencia_sistema != null && isNonEmptySyncField(potencia_sistema)
        ? potencia_sistema
        : latest.potencia_sistema;
    out.push({ ...latest, valor_proposta: v ?? latest.valor_proposta, potencia_sistema: p ?? latest.potencia_sistema });
  }
  return out;
}

function parseValorPropostaBR(raw: string | number | null | undefined): number {
  if (raw == null) return 0;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  let s = String(raw).trim();
  if (s === "") return 0;
  s = s.replace(/R\$\s?/gi, "").replace(/\u00a0/g, "").replace(/\s/g, "");
  if (s.includes(",")) {
    const norm = s.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(norm);
    return Number.isNaN(n) ? 0 : n;
  }
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

function parsePercentualComissao(raw: string | number | null | undefined): number | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const s = String(raw).trim().replace("%", "").replace(/\s/g, "").replace(",", ".");
  if (s === "") return undefined;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : undefined;
}

function parsePotenciaKwp(raw: string | number | null | undefined): number {
  if (raw == null) return 0;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  const s = String(raw)
    .trim()
    .replace(/kwp?/gi, "")
    .replace(/\s/g, "")
    .replace(",", ".");
  if (s === "") return 0;
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

function normalizeEtapaKanban(
  raw: string | null,
  status: ProjetoStatus,
): string {
  if (status === "Ganho") return "CONTRATO ASSINADO";
  const e = (raw || "").toUpperCase().trim();
  /** Ordem: strings mais específicas antes de includes genéricos ("CONTATO" vs "CONTATO REALIZADO"). */
  const pairs: [string, string][] = [
    ["SOL SDR", "SOL SDR"],
    ["SDR", "SOL SDR"],
    ["TRAFEGO PAGO", "TRAFEGO PAGO"],
    ["TRAFEGO", "TRAFEGO PAGO"],
    ["PROSPECÇÃO", "PROSPECÇÃO"],
    ["PROSPEC", "PROSPECÇÃO"],
    ["FOLLOW UP", "FOLLOW UP"],
    ["FOLLOW", "FOLLOW UP"],
    ["QUALIFICAÇÃO", "QUALIFICAÇÃO"],
    ["QUALIFICADO", "QUALIFICADO"],
    ["CONTATO REALIZADO", "CONTATO REALIZADO"],
    ["CONTATO", "CONTATO REALIZADO"],
    ["PROPOSTA", "PROPOSTA"],
    ["NEGOCIAÇÃO", "NEGOCIAÇÃO"],
    ["NEGOCIA", "NEGOCIAÇÃO"],
    ["COBRAN", "NEGOCIAÇÃO"],
    ["CONTRATO ASSINADO", "CONTRATO ASSINADO"],
    ["CONTRATO", "CONTRATO ASSINADO"],
    ["INSTALA", "NEGOCIAÇÃO"],
    ["DECLÍNIO", "QUALIFICADO"],
    ["DECLINIO", "QUALIFICADO"],
    ["REMARKETING", "TRAFEGO PAGO"],
  ];
  for (const [k, col] of pairs) {
    if (e.includes(k)) return col;
  }
  /** Não enviar etapas SM desconhecidas para PROPOSTA (gera coluna cheia de R$ 0 fora do contexto). */
  if (e) return "QUALIFICADO";
  return "QUALIFICADO";
}

/** Converte sol_projetos_sync (estado atual por projeto) em Proposal[] para telas comerciais existentes. */
export function projetosToProposals(rows: SolProjeto[]): Proposal[] {
  return rows.map((r, i) => {
    const status = mapProjetoRowToStatus(r);
    const ultimaAtualizacao = parseDate(r.ts_evento || projetosRowSyncedAt(r) || '') || '';
    const dataCriacaoProjeto = parseDate(r.ts_cadastro_projeto || '') || '';
    const dataCriacaoProposta =
      parseDate(r.ts_proposta || '') ||
      parseDate(r.ts_proposta_aceita || '') ||
      parseDate(r.ts_evento || '') ||
      dataCriacaoProjeto ||
      ultimaAtualizacao;
    const etapa = normalizeEtapaKanban(r.etapa, status);
    const valorProposta = parseValorPropostaBR(r.valor_proposta);
    const potenciaSistema = parsePotenciaKwp(r.potencia_sistema);
    const rawVc = r.comissao_valor;
    const rawPct = r.comissao_percentual;
    const comissaoValorSync =
      rawVc != null && String(rawVc).trim() !== "" ? parseValorPropostaBR(rawVc) : undefined;
    const comissaoPercentualSync =
      rawPct != null && String(rawPct).trim() !== "" ? parsePercentualComissao(rawPct) : undefined;
    const tempoNaEtapa = calcularTempoNaEtapa(ultimaAtualizacao || dataCriacaoProposta);
    const probKey = (r.etapa || etapa).toUpperCase();
    const probabilidade =
      status === 'Ganho' ? 100 : status === 'Perdido' ? 0 : (PROBABILIDADE_POR_ETAPA[probKey] ?? PROBABILIDADE_POR_ETAPA[etapa] ?? 50);

    return {
      id: r.project_id || projetosRowKey(r) || `SM-${i}`,
      franquiaId: (r.franquia_id as string) || '',
      etapa,
      projetoId: r.project_id || '',
      nomeCliente:
        r.nome_cliente || r.nome_proposta || r.telefone || `Projeto …${String(r.project_id || '').slice(-4)}`,
      clienteTelefone: r.telefone || '',
      clienteEmail: r.email_cliente || '',
      status,
      responsavel: r.closer_nome || r.representante_nome || '',
      responsavelId: r.closer_sm_id || r.representante_id || '',
      representante: r.representante_nome || r.closer_nome || '',
      valorProposta,
      potenciaSistema,
      nomeProposta: r.nome_proposta || r.nome_cliente || '',
      dataCriacaoProjeto: dataCriacaoProjeto || dataCriacaoProposta,
      dataCriacaoProposta,
      slaProposta: 48,
      ultimaAtualizacao: ultimaAtualizacao || dataCriacaoProposta,
      solQualificado: true,
      solScore: 0,
      temperatura: '',
      dataQualificacaoSol: dataCriacaoProposta,
      notaCompleta: '',
      tempoNaEtapa,
      solSdr: false,
      tempoSolSdr: 0,
      etiquetas: [r.canal_origem, r.campanha_nome].filter(Boolean).join(', '),
      origemLead: r.canal_origem || '',
      probabilidade,
      motivoPerda: status === 'Perdido' ? (r.evento || r.status_projeto || 'Perdido') : '',
      faseSM: r.etapa || '',
      makeNome: r.nome_cliente || undefined,
      makeEmail: r.email_cliente || undefined,
      comissaoValorSync,
      comissaoPercentualSync,
    };
  });
}

// ── Etapas ──

export const etapasReais = [
  'TRAFEGO PAGO', 'SOL SDR', 'FOLLOW UP', 'QUALIFICADO',
  'CONTATO REALIZADO', 'PROPOSTA', 'NEGOCIAÇÃO', 'COBRANÇA',
  'DECLÍNIO', 'REMARKETING',
];

export const etapasPipeline = [
  'TRAFEGO PAGO', 'SOL SDR', 'FOLLOW UP', 'QUALIFICADO',
  'CONTATO REALIZADO', 'PROPOSTA', 'NEGOCIAÇÃO',
];

export const etapasPreVenda = [
  'TRAFEGO PAGO', 'SOL SDR', 'FOLLOW UP',
];

export const etapasComercial = [
  'QUALIFICADO', 'CONTATO REALIZADO', 'PROPOSTA', 'NEGOCIAÇÃO', 'COBRANÇA',
];

// ── Analysis functions (unchanged API, work with Proposal[]) ──

export function extractVendedores(proposals: Proposal[]): string[] {
  return [...new Set(proposals.map(p => p.representante).filter(Boolean))].sort();
}

export function extractOrigem(proposals: Proposal[]): string[] {
  return [...new Set(proposals.map(p => p.origemLead).filter(Boolean))].sort();
}

export function getKPIs(proposals: Proposal[]) {
  const ganhos = proposals.filter(p => p.status === 'Ganho');
  const perdidos = proposals.filter(p => p.status === 'Perdido');
  const abertos = proposals.filter(p => p.status === 'Aberto');
  const valorPipeline = proposals.reduce((a, p) => a + p.valorProposta, 0);
  const valorGanho = ganhos.reduce((a, p) => a + p.valorProposta, 0);
  const taxaConversao = proposals.length > 0 ? (ganhos.length / proposals.length) * 100 : 0;
  const ticketMedio = proposals.length > 0 ? valorPipeline / proposals.length : 0;
  const receitaPrevista = abertos.reduce((a, p) => a + (p.valorProposta * p.probabilidade / 100), 0);

  return {
    totalNegocios: proposals.length,
    negociosAbertos: abertos.length,
    negociosGanhos: ganhos.length,
    negociosPerdidos: perdidos.length,
    valorPipeline, valorGanho,
    valorPerdido: perdidos.reduce((a, p) => a + p.valorProposta, 0),
    potenciaTotal: 0,
    taxaConversao, ticketMedio,
    cicloProposta: 0,
    receitaPrevista,
    potenciaPrevista: 0,
  };
}

export function getStatusFunnelData(proposals: Proposal[]) {
  const byStatus = (s: string) => proposals.filter(p => p.status === s);
  return ['Aberto', 'Ganho', 'Perdido'].map(s => {
    const ps = byStatus(s);
    return {
      status: s, quantidade: ps.length,
      valor: ps.reduce((a, p) => a + p.valorProposta, 0),
      percentual: proposals.length > 0 ? (ps.length / proposals.length) * 100 : 0,
    };
  });
}

export function getFunnelData(proposals: Proposal[]) {
  const etapas = [...new Set(proposals.map(p => p.etapa))];
  const valorTotal = proposals.reduce((a, p) => a + p.valorProposta, 0);
  return etapas.map(etapa => {
    const ps = proposals.filter(p => p.etapa === etapa);
    const valor = ps.reduce((a, p) => a + p.valorProposta, 0);
    return { etapa, quantidade: ps.length, valor, taxaConversao: valorTotal > 0 ? (valor / valorTotal) * 100 : 0 };
  }).sort((a, b) => b.quantidade - a.quantidade);
}

/** Agrupamento de performance: closer = campo comercial (closer na sync, mapeado em `responsavel`); representante = legado rep+closer. */
export type VendedorPerformanceGroupBy = "closer" | "representante";

export function vendedorPerformanceKey(p: Proposal, groupBy: VendedorPerformanceGroupBy = "closer"): string {
  if (groupBy === "closer") {
    const c = (p.responsavel || "").trim();
    return c || "Closer não preenchido na sync";
  }
  const s = (p.representante || p.responsavel || "").trim();
  return s || "Sem identificação";
}

export function getVendedorPerformance(
  proposals: Proposal[],
  groupBy: VendedorPerformanceGroupBy = "closer",
) {
  const vendedores = [...new Set(proposals.map((p) => vendedorPerformanceKey(p, groupBy)))];
  return vendedores.map((v) => {
    const ps = proposals.filter((p) => vendedorPerformanceKey(p, groupBy) === v);
    const ganhos = ps.filter(p => p.status === 'Ganho');
    const perdidos = ps.filter(p => p.status === 'Perdido');
    const abertos = ps.filter(p => p.status === 'Aberto');
    const valorTotal = ps.reduce((a, p) => a + p.valorProposta, 0);
    return {
      nome: v, totalPropostas: ps.length,
      ganhos: ganhos.length, perdidos: perdidos.length, abertos: abertos.length,
      valorTotal, valorGanho: ganhos.reduce((a, p) => a + p.valorProposta, 0),
      valorPerdido: perdidos.reduce((a, p) => a + p.valorProposta, 0),
      valorAberto: abertos.reduce((a, p) => a + p.valorProposta, 0),
      taxaConversao: ps.length > 0 ? (ganhos.length / ps.length) * 100 : 0,
      atividades: ps.length, totalFollowUps: 0, tempoMedioResposta: 0,
      ticketMedio: ps.length > 0 ? valorTotal / ps.length : 0,
    };
  }).sort((a, b) => b.valorTotal - a.valorTotal);
}

/**
 * Sem campo de “data de fechamento” no SM: usamos **data de criação da proposta + N dias** como proxy.
 * Exportado para copy de UI / documentação.
 */
export const FORECAST_EXPECTED_CLOSE_LAG_DAYS = 15;

function parseLocalDateYmd(s: string | undefined): Date | null {
  if (!s?.trim()) return null;
  const m = s.trim().slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return startOfDay(dt);
}

/** Data esperada de fechamento (proxy): criação da proposta + {@link FORECAST_EXPECTED_CLOSE_LAG_DAYS} dias. */
export function expectedCloseDateFromProposal(p: Proposal): Date | null {
  const base = parseLocalDateYmd(p.dataCriacaoProposta);
  if (!base) return null;
  return addDays(base, FORECAST_EXPECTED_CLOSE_LAG_DAYS);
}

function weightedValorProposta(p: Proposal): number {
  return p.valorProposta * (p.probabilidade / 100);
}

/**
 * Forecast por horizonte **cumulativo** em calendário: soma receita ponderada (e kWp) dos **abertos** cuja
 * data esperada de fechamento cai até o fim do dia `hoje + horizonDays` (inclui negócios já “atrasados” vs o proxy).
 * Propostas sem `dataCriacaoProposta` válida não entram nesses quadrantes (ainda entram no pipeline ponderado total).
 */
function sumForecastByCloseHorizon(
  abertos: Proposal[],
  horizonDays: number,
  today: Date = new Date(),
): { receita: number; potencia: number } {
  const limit = endOfDay(addDays(startOfDay(today), horizonDays));
  let receita = 0;
  let potencia = 0;
  for (const p of abertos) {
    const exp = expectedCloseDateFromProposal(p);
    if (!exp) continue;
    if (exp.getTime() <= limit.getTime()) {
      receita += weightedValorProposta(p);
      potencia += p.potenciaSistema || 0;
    }
  }
  return { receita, potencia };
}

export function getForecastData(proposals: Proposal[]) {
  const abertos = proposals.filter(p => p.status === 'Aberto');
  const ganhos = proposals.filter(p => p.status === 'Ganho');
  const receitaConfirmada = ganhos.reduce((a, p) => a + p.valorProposta, 0);
  const potenciaConfirmada = ganhos.reduce((a, p) => a + (p.potenciaSistema || 0), 0);
  const f7 = sumForecastByCloseHorizon(abertos, 7);
  const f14 = sumForecastByCloseHorizon(abertos, 14);
  const f21 = sumForecastByCloseHorizon(abertos, 21);
  const f28 = sumForecastByCloseHorizon(abertos, 28);
  const pipelinePonderado = abertos.reduce((a, p) => a + weightedValorProposta(p), 0);
  return {
    forecast7: f7.receita,
    forecast14: f14.receita,
    forecast21: f21.receita,
    forecast28: f28.receita,
    potencia7: f7.potencia,
    potencia14: f14.potencia,
    potencia21: f21.potencia,
    potencia28: f28.potencia,
    altaProbabilidade: abertos.filter(p => p.probabilidade >= 70),
    emRisco: abertos.filter(p => p.probabilidade < 30 || p.tempoNaEtapa > 30),
    distribuicao: [
      { faixa: '0-25%', quantidade: abertos.filter(p => p.probabilidade <= 25).length, valor: abertos.filter(p => p.probabilidade <= 25).reduce((a, p) => a + p.valorProposta, 0) },
      { faixa: '26-50%', quantidade: abertos.filter(p => p.probabilidade > 25 && p.probabilidade <= 50).length, valor: abertos.filter(p => p.probabilidade > 25 && p.probabilidade <= 50).reduce((a, p) => a + p.valorProposta, 0) },
      { faixa: '51-75%', quantidade: abertos.filter(p => p.probabilidade > 50 && p.probabilidade <= 75).length, valor: abertos.filter(p => p.probabilidade > 50 && p.probabilidade <= 75).reduce((a, p) => a + p.valorProposta, 0) },
      { faixa: '76-100%', quantidade: abertos.filter(p => p.probabilidade > 75).length, valor: abertos.filter(p => p.probabilidade > 75).reduce((a, p) => a + p.valorProposta, 0) },
    ],
    pipelinePonderado,
    receitaConfirmada,
    potenciaConfirmada,
    totalContratos: ganhos.length, ticketMedioContrato: ganhos.length > 0 ? receitaConfirmada / ganhos.length : 0,
    totalPropostasAbertas: abertos.length,
    distribuicaoPorEtapa: [],
    totalNegociosIniciados: proposals.length, valorNegociosIniciados: proposals.reduce((a, p) => a + p.valorProposta, 0),
    ticketMedioIniciados: 0, totalLeadsQualificados: 0, valorLeadsQualificados: 0,
    totalPropostasGeradas: 0, valorPropostasGeradas: 0, ticketMedioPropostas: 0,
    totalPropostasAceitas: ganhos.length, valorPropostasAceitas: receitaConfirmada, ticketMedioAceitas: ganhos.length > 0 ? receitaConfirmada / ganhos.length : 0,
    totalCobranca: ganhos.length, ticketMedioCobranca: ganhos.length > 0 ? receitaConfirmada / ganhos.length : 0,
    taxaConversao: proposals.length > 0 ? (ganhos.length / proposals.length) * 100 : 0,
    slaFechamentoDias: 0,
  };
}

export function getAtividadesData(proposals: Proposal[]) {
  const abertos = proposals.filter(p => p.status === 'Aberto');
  return {
    atividadesDoDia: abertos.filter(p => p.tempoNaEtapa > 5 && p.tempoNaEtapa <= 10),
    followUpsAtrasados: abertos.filter(p => p.tempoNaEtapa > 7),
    leadsSemContato: abertos.filter(p => p.tempoNaEtapa > 3),
    semProximaAtividade: abertos.filter(p => p.tempoNaEtapa > 14),
    speedToLead: 0, totalFollowUps: 0,
  };
}

export function getPerdasData(
  proposals: Proposal[],
  vendedorGroupBy: VendedorPerformanceGroupBy = "representante",
) {
  const perdidos = proposals.filter(p => p.status === 'Perdido');
  const byKey = <T extends string>(key: (p: Proposal) => T) => {
    const map = new Map<T, { quantidade: number; valor: number }>();
    for (const p of perdidos) {
      const k = key(p);
      const c = map.get(k) || { quantidade: 0, valor: 0 };
      map.set(k, { quantidade: c.quantidade + 1, valor: c.valor + p.valorProposta });
    }
    return Array.from(map.entries()).map(([k, v]) => ({ key: k, ...v })).sort((a, b) => b.quantidade - a.quantidade);
  };
  const porMotivo = byKey(p => (p.motivoPerda || 'Não informado') as string).map(({ key, ...r }) => ({ motivo: key, ...r }));
  const porEtapa = byKey(p => p.etapa).map(({ key, ...r }) => ({ etapa: key, ...r }));
  const porVendedor = byKey(p => vendedorPerformanceKey(p, vendedorGroupBy) as string).map(({ key, ...r }) => ({ vendedor: key, ...r }));
  const porOrigem = byKey(p => (p.origemLead || 'Não informado') as string).map(({ key, ...r }) => ({ origem: key, ...r }));
  return {
    totalPerdidos: perdidos.length,
    valorTotalPerdido: perdidos.reduce((a, p) => a + p.valorProposta, 0),
    porMotivo, porEtapa, porVendedor, porOrigem,
    principalMotivo: porMotivo[0]?.motivo || 'N/A',
    etapaQueMaisPerde: porEtapa[0]?.etapa || 'N/A',
  };
}

export function getOrigensData(proposals: Proposal[]) {
  const map = new Map<string, Proposal[]>();
  for (const p of proposals) {
    const o = p.origemLead || 'Não informado';
    map.set(o, [...(map.get(o) || []), p]);
  }
  return Array.from(map.entries()).map(([origem, ps]) => {
    const ganhos = ps.filter(p => p.status === 'Ganho');
    return {
      origem, totalLeads: ps.length, ganhos: ganhos.length,
      taxaConversao: ps.length > 0 ? (ganhos.length / ps.length) * 100 : 0,
      valorTotal: ps.reduce((a, p) => a + p.valorProposta, 0),
      valorGanho: ganhos.reduce((a, p) => a + p.valorProposta, 0),
      ticketMedio: ps.length > 0 ? ps.reduce((a, p) => a + p.valorProposta, 0) / ps.length : 0,
      tempoMedioFechamento: 0,
    };
  }).sort((a, b) => b.totalLeads - a.totalLeads);
}

export function getLeadsKPIs(proposals: Proposal[]) {
  const total = proposals.length;
  const qualificados = proposals.filter(p => p.solQualificado).length;
  const abertos = proposals.filter(p => p.status === 'Aberto');
  const naoQualificados = abertos.filter(p => !p.solQualificado).length;
  const quentes = proposals.filter(p => p.temperatura === 'QUENTE').length;
  const mornos = proposals.filter(p => p.temperatura === 'MORNO').length;
  const frios = proposals.filter(p => p.temperatura === 'FRIO').length;
  const scores = proposals.filter(p => p.solScore > 0).map(p => p.solScore);
  const scoreMedio = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  return { total, qualificados, naoQualificados, taxaQualificacao: total > 0 ? (qualificados / total) * 100 : 0, quentes, mornos, frios, scoreMedio };
}

export function getLeadsByEtapa(proposals: Proposal[]) {
  const map = new Map<string, number>();
  for (const p of proposals) map.set(p.etapa, (map.get(p.etapa) || 0) + 1);
  return Array.from(map.entries()).map(([etapa, quantidade]) => ({ etapa, quantidade })).sort((a, b) => b.quantidade - a.quantidade);
}

export function getLeadsByEtiqueta(proposals: Proposal[]) {
  const map = new Map<string, { quantidade: number; valor: number; qualificados: number }>();
  for (const p of proposals) {
    const tags = p.etiquetas ? p.etiquetas.split(',').map(t => t.trim()).filter(Boolean) : ['Sem etiqueta'];
    for (const tag of tags) {
      const c = map.get(tag) || { quantidade: 0, valor: 0, qualificados: 0 };
      map.set(tag, { quantidade: c.quantidade + 1, valor: c.valor + p.valorProposta, qualificados: c.qualificados + (p.solQualificado ? 1 : 0) });
    }
  }
  return Array.from(map.entries()).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.quantidade - a.quantidade);
}

export function getTempoQualificacao(proposals: Proposal[]) {
  return { media: 0, mediana: 0, min: 0, max: 0, totalComDados: 0 };
}

export function getTemperaturaPorEtapa(proposals: Proposal[]) {
  const map = new Map<string, { quente: number; morno: number; frio: number; sem: number }>();
  for (const p of proposals) {
    const c = map.get(p.etapa) || { quente: 0, morno: 0, frio: 0, sem: 0 };
    if (p.temperatura === 'QUENTE') c.quente++; else if (p.temperatura === 'MORNO') c.morno++; else if (p.temperatura === 'FRIO') c.frio++; else c.sem++;
    map.set(p.etapa, c);
  }
  return Array.from(map.entries()).map(([etapa, d]) => ({ etapa, ...d }));
}

export function getSolPerformance(proposals: Proposal[]) {
  const qualificados = proposals.filter(p => p.solQualificado);
  const scores = qualificados.filter(p => p.solScore > 0).map(p => p.solScore);
  const scoreMedio = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const quentes = qualificados.filter(p => p.temperatura === 'QUENTE').length;
  return { totalQualificados: qualificados.length, scoreMedio, percentQuentes: qualificados.length > 0 ? (quentes / qualificados.length) * 100 : 0, conversaoSolProposta: 0, conversaoSolFechamento: 0, valorQualificados: qualificados.reduce((a, p) => a + p.valorProposta, 0) };
}

export function getScorePorOrigem(proposals: Proposal[]) {
  const map = new Map<string, { scores: number[]; quantidade: number }>();
  for (const p of proposals) {
    const o = p.origemLead || 'Não informado';
    const c = map.get(o) || { scores: [], quantidade: 0 };
    if (p.solScore > 0) c.scores.push(p.solScore);
    c.quantidade++;
    map.set(o, c);
  }
  return Array.from(map.entries()).map(([origem, d]) => ({ origem, scoreMedio: d.scores.length > 0 ? d.scores.reduce((a, b) => a + b, 0) / d.scores.length : 0, quantidade: d.quantidade })).sort((a, b) => b.scoreMedio - a.scoreMedio);
}

export function getSolSDRMetrics(proposals: Proposal[]) {
  return { total: 0, tempoMedio: 0, taxaPassagem: 0 };
}

export function getLeadsQuentesAbandonados(proposals: Proposal[], thresholdDias = 7) {
  return proposals.filter(p => p.temperatura === 'QUENTE' && p.status === 'Aberto' && p.tempoNaEtapa > thresholdDias);
}

export function getROIPorOrigem(proposals: Proposal[]) {
  const map = new Map<string, { total: number; ganhos: number; valor: number; scores: number[] }>();
  for (const p of proposals) {
    const o = p.origemLead || 'Não informado';
    const c = map.get(o) || { total: 0, ganhos: 0, valor: 0, scores: [] };
    c.total++; if (p.status === 'Ganho') c.ganhos++; c.valor += p.valorProposta; if (p.solScore > 0) c.scores.push(p.solScore);
    map.set(o, c);
  }
  return Array.from(map.entries()).map(([origem, d]) => ({
    origem, totalLeads: d.total, ganhos: d.ganhos,
    taxaConversao: d.total > 0 ? (d.ganhos / d.total) * 100 : 0,
    valorTotal: d.valor,
    scoreMedio: d.scores.length > 0 ? d.scores.reduce((a, b) => a + b, 0) / d.scores.length : 0,
    ticketMedio: d.total > 0 ? d.valor / d.total : 0,
  })).sort((a, b) => b.valorTotal - a.valorTotal);
}

export function getGargalosData(proposals: Proposal[]) {
  const map = new Map<string, number[]>();
  for (const p of proposals) { const t = map.get(p.etapa) || []; t.push(p.tempoNaEtapa); map.set(p.etapa, t); }
  return Array.from(map.entries()).map(([etapa, tempos]) => {
    const tempoMedio = tempos.length > 0 ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length) : 0;
    return { etapa, tempoMedio, tempoMax: Math.max(...tempos, 0), quantidade: tempos.length, intensidade: Math.min(100, tempoMedio * 3) };
  }).sort((a, b) => b.tempoMedio - a.tempoMedio);
}

export function getConversaoPorEtapa(proposals: Proposal[]) {
  const map = new Map<string, { total: number; ganhos: number }>();
  for (const p of proposals) { const c = map.get(p.etapa) || { total: 0, ganhos: 0 }; c.total++; if (p.status === 'Ganho') c.ganhos++; map.set(p.etapa, c); }
  return Array.from(map.entries()).map(([etapa, d]) => ({ etapa, total: d.total, ganhos: d.ganhos, taxaConversao: d.total > 0 ? (d.ganhos / d.total) * 100 : 0 })).sort((a, b) => b.taxaConversao - a.taxaConversao);
}

export function getMonthlyData(proposals: Proposal[]) {
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return months.map((mes, i) => {
    const ps = proposals.filter(p => { const d = new Date(p.dataCriacaoProjeto); return d.getMonth() === i; });
    const ganhos = ps.filter(p => p.status === 'Ganho');
    return { mes, iniciados: ps.length, valorFechado: ganhos.reduce((a, p) => a + p.valorProposta, 0), taxaConversao: ps.length > 0 ? (ganhos.length / ps.length) * 100 : 0 };
  });
}

export function getPowerFunnelData(proposals: Proposal[]) {
  return getFunnelData(proposals).map(d => ({ ...d, potencia: 0 }));
}

export function getPreVendedorPerformance(proposals: Proposal[]) {
  const reps = [...new Set(proposals.map(p => p.responsavel).filter(Boolean))];
  return reps.map(rep => {
    const ps = proposals.filter(p => p.responsavel === rep);
    const ganhos = ps.filter(p => p.status === 'Ganho');
    return { nome: rep, leadsTrabalhos: ps.length, convertidos: ganhos.length, valorTotal: ps.reduce((a, p) => a + p.valorProposta, 0), taxaConversao: ps.length > 0 ? (ganhos.length / ps.length) * 100 : 0, atividades: ps.length };
  }).sort((a, b) => b.valorTotal - a.valorTotal);
}

// Legacy compat
export function extractPreVendedores(proposals: Proposal[]): string[] {
  return [...new Set(proposals.map(p => p.responsavel).filter(Boolean))].sort();
}
