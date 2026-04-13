import { useMemo } from 'react';
import { useSolLeads, type SolLead } from '@/hooks/useSolData';
import { filterRecordsByGlobalFilters, getEffectiveDateRange, parseDateFlexible, type FilterState } from '@/lib/globalFilters';

// ─── Types matching the page component shapes ───
export interface KPICard {
  label: string; value: number; suffix: string; detail: string; tooltip?: string;
}
export interface PipelineStage {
  etapa: string; valor: number; icon: string; desc: string;
}
export interface OrigemLead {
  origem: string;
  share: number;
  /** % leads da origem com status/etapa de ganho (vitória comercial no lead). */
  conversao: number;
  /** % que atingiram qualificado ou estágio posterior (útil quando ainda não há ganhos). */
  conversaoMql: number;
  ganhosCount: number;
  mqlPlusCount: number;
  total: number;
  /** Média do score SOL na origem (só quando existem scores válidos). */
  scoreMedio: number | null;
}
export interface FupFrio {
  /** Leads que entraram na sequência FUP (≥1 disparo). */
  entraram: number;
  /** Leads que responderam após estar no FUP (proxy de resgate). */
  reativados: number;
  pctReativados: number;
  /** Dias médios entre cadastro e último FUP (leads que responderam no FUP). */
  diasAteReativar: number;
  valorRecuperado: string;
  ticketMedio: string;
  conversaoPosResgate: number;
  receitaTotal: string;
  pctReceitaViaFup: number;
  /** Base total no período (ex.: 46 recebidos). */
  totalRecebidos: number;
  /** % da base que passou pelo FUP Frio. */
  pctBaseComFup: number;
  /** Ganhos comerciais (lead) que tiveram FUP na jornada. */
  fechadosComFup: number;
  valorFechadosComFup: string;
  /** % dos ganhos (em qtd) que passaram pelo FUP. */
  pctGanhosQuePassaramFup: number;
  /** % do valor estimado dos ganhos atribuível a leads com FUP. */
  pctValorGanhosViaFup: number;
}
export interface DesqualMotivo {
  motivo: string; pct: number; fill: string;
}
export interface Mensagens {
  enviadas: number; recebidas: number; interacoesPorConv: number;
}
export interface SLAData {
  pctAbordados5min: number; tempoMedioRespostaLead: string;
}
export interface HeatmapData {
  dias: string[]; periodos: string[]; valores: number[][]; pico: string;
}
export interface TaxaTentativa {
  tentativa: string; pct: number;
}
export interface SolHoje {
  dia: string; qualificados: number; scores: number; quentes: number; mornos: number; frios: number;
}
export interface Alerta {
  type: 'danger' | 'warning' | 'success' | 'info'; title: string; desc: string;
}
export interface TempEtapa {
  etapa: string; quente: number; morno: number; frio: number;
}
export interface TabelaLead {
  id: number; nome: string; etapa: string; temperatura: string; score: number;
  sla: number; statusFup: string; valor: number; dataCriacao?: string;
  makeStatus?: string;
  etapaSm?: string; closerAtribuido?: string; statusProposta?: string;
  dataProposta?: string; dataFechamento?: string;
  dataQualificacao?: string; lastFollowupDate?: string;
  respondeu?: boolean;
  historico: { data: string; tipo: string; msg: string }[];
}
export interface SLAMetricsData {
  primeiroAtendimento: { media: number; pctDentro24h: number; total: number };
  porEtapa: {
    etapa: string;
    slaDias: number;
    mediaDias: number;
    /** ok/warning/overdue = pré-venda SOL; comercial = pós-handover (barra neutra, SLA do time comercial). */
    status: 'ok' | 'warning' | 'overdue' | 'comercial';
    leadsNaEtapa: number;
    solNaJornadaCount: number;
    solNaJornadaPct: number;
  }[];
  robos: { tempoResposta: string; leadsAguardando: number; taxaResposta: number };
  geralProposta: { mediaDias: number };
}
export interface RobotInsightsData {
  destaques: { label: string; value: number; icon: 'bot' | 'send' | 'users' | 'flame'; color: string }[];
  comparacao: {
    sol: { nome: string; taxaResposta: number; tempoMedioResposta: string; leadsProcessados: number };
    fup: { nome: string; taxaResposta: number; tempoMedioResposta: string; leadsProcessados: number };
  };
  funilMensagens: { etapa: string; valor: number }[];
  alertasUrgentes: { tipo: 'danger' | 'warning' | 'success' | 'info'; titulo: string; desc: string }[];
}
export interface MonthlyEvolutionItem {
  mes: string; mesLabel: string; totalLeads: number; qualificados: number;
  pctQualificacao: number; msgEnviadas: number; msgRecebidas: number; conversao: number; fechados: number;
}

// ─── Helpers ───
function parseTemp(t: string | undefined): 'QUENTE' | 'MORNO' | 'FRIO' | '' {
  const n = (t || '').toUpperCase().trim();
  if (n.includes('QUENTE')) return 'QUENTE';
  if (n.includes('MORNO')) return 'MORNO';
  if (n.includes('FRIO')) return 'FRIO';
  return '';
}

function parseScore(s: string | undefined): number {
  if (!s) return 0;
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function safeDate(str: string | undefined | null): Date | null {
  return parseDateFlexible(str);
}

function dayOfWeek(d: Date): number { return d.getDay(); }
function hourBucket(d: Date): 'Manhã' | 'Tarde' | 'Noite' {
  const h = d.getHours();
  if (h < 12) return 'Manhã';
  if (h < 18) return 'Tarde';
  return 'Noite';
}

function formatCurrencyShort(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
  return `R$ ${v.toFixed(0)}`;
}

function getPrimaryDateForFilter(r: SolLead): Date | null {
  return safeDate(
    r.ts_cadastro ||
    r.ts_ultimo_fup ||
    r.ts_ultima_interacao ||
    r.ts_qualificado ||
    r.ts_transferido ||
    r.ts_cadastro
  );
}

function getOrigemLabel(r: SolLead): string {
  const raw = (r.canal_origem || '').trim().toLowerCase();
  if (raw === 'meta_ads' || raw.includes('facebook') || raw.includes('instagram') || raw.includes('meta')) return 'Meta Ads';
  if (raw === 'google_ads' || raw.includes('google')) return 'Google Ads';
  if (raw === 'site' || raw.includes('landing')) return 'Site';
  if (raw === 'whatsapp' || raw.includes('whatsapp')) return 'WhatsApp';
  if (raw) return raw;
  return 'Direto / Não identificado';
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

function getStageAnchorDate(r: SolLead, stage: string): Date | null {
  if (stage === 'Robô SOL') return safeDate(r.ts_cadastro || r.ts_cadastro);
  if (stage === 'Qualificação') return safeDate(r.ts_ultima_interacao || r.ts_ultimo_fup || r.ts_cadastro || r.ts_cadastro);
  if (stage === 'Qualificado') return safeDate(r.ts_ultima_interacao || r.ts_ultimo_fup || r.ts_cadastro || r.ts_cadastro);
  if (stage === 'Closer') return safeDate(r.ts_ultimo_fup || r.ts_ultima_interacao || r.ts_cadastro || r.ts_cadastro);
  if (stage === 'Proposta') return safeDate(r.ts_qualificado || r.ts_ultimo_fup || r.ts_cadastro || r.ts_cadastro);
  return safeDate(r.ts_transferido || r.ts_qualificado || r.ts_ultimo_fup || r.ts_cadastro);
}

/** Negócio ganho / encerrado com vitória (para funil CEO). */
function isWonClosed(r: SolLead): boolean {
  const etapa = (r.etapa_funil || '').toUpperCase().trim();
  const status = (r.status || '').toUpperCase().trim();
  return (
    status.includes('GANHO') ||
    status.includes('FECHADO') ||
    status.includes('VENDA') ||
    etapa === 'GANHO' ||
    etapa.includes('CONTRATO ASSINADO')
  );
}

/**
 * Maior estágio alcançado na jornada (0..5) para funil cumulativo do dashboard.
 * 0 = só na base (recebido), 1 = pré-qualificação robô, 2 = qualificado, 3 = handover closer,
 * 4 = proposta ativa, 5 = fechado (ganho).
 */
function getCeoJourneyMaxStage(r: SolLead): number {
  const etapa = (r.etapa_funil || '').toUpperCase().trim();
  const status = (r.status || '').toUpperCase().trim();

  if (isWonClosed(r)) return 5;

  let m = 0;

  if (['TRAFEGO PAGO', 'SOL SDR', 'FOLLOW UP'].includes(etapa)) m = Math.max(m, 1);

  if (
    etapa === 'QUALIFICADO' ||
    (status.includes('QUALIFICADO') &&
      !status.includes('DESQUALIFICADO') &&
      !status.includes('DES_QUAL'))
  ) {
    m = Math.max(m, 2);
  }

  if (r.transferido_comercial === true || etapa === 'CONTATO REALIZADO') m = Math.max(m, 3);

  if (etapa === 'PROPOSTA' || etapa.includes('NEGOCI') || etapa.includes('NEGOCIA')) m = Math.max(m, 4);

  if ((etapa.includes('COBRANÇA') || etapa.includes('COBRANCA')) && !isWonClosed(r)) m = Math.max(m, 4);

  return m;
}

const CEO_PIPELINE_LABELS = ['Recebidos', 'Qualificação', 'Qualificado', 'Closer', 'Proposta', 'Fechado'] as const;

/** Map Make status → Sol Pipeline stage */
function getSolStageFromMake(r: SolLead): string {
  // Prioritize etapa_sm from CRM if available
  const etapaSm = (r.etapa_funil || '').toUpperCase();
  if (etapaSm) {
    if (etapaSm.includes('CONTRATO') || etapaSm.includes('ASSINADO') || etapaSm.includes('COBRANÇA') || etapaSm.includes('GANHO')) return 'Fechado';
    if (etapaSm.includes('PROPOSTA') || etapaSm.includes('NEGOCI')) return 'Proposta';
    if (etapaSm.includes('AGEND') || etapaSm.includes('CONTATO') || etapaSm.includes('CLOSER')) return 'Closer';
  }

  const status = (r.status || '').toUpperCase();
  if (status.includes('GANHO') || status.includes('FECHADO') || status.includes('VENDA')) return 'Fechado';
  if (status.includes('PROPOSTA') || status.includes('NEGOCI')) return 'Proposta';
  if (status.includes('CONTATO') || status.includes('AGEND')) return 'Closer';
  if (status.includes('QUALIFICADO') && !status.includes('DES')) return 'Qualificado';
  if (status.includes('WHATSAPP')) return 'Qualificação';
  if (((r as any)._status_resposta || '') === 'respondeu') return 'Qualificação';
  return 'Robô SOL';
}

function getTemp(r: SolLead): string {
  const t = parseTemp(r.temperatura);
  if (t) return t;
  const s = parseScore(r.score);
  if (s >= 70) return 'QUENTE';
  if (s >= 40) return 'MORNO';
  if (s > 0) return 'FRIO';
  return 'MORNO'; // default
}

function estimateValueFromBill(r: SolLead): number {
  const bill = (r.valor_conta || '').toLowerCase();
  if (bill.includes('1.000') || bill.includes('1000') || bill.includes('acima')) return 45000;
  if (bill.includes('700') || bill.includes('400')) return 28000;
  if (bill.includes('250') || bill.includes('350')) return 18000;
  if (bill.includes('menos') || bill.includes('<')) return 8000;
  return 17000; // default
}

/** Valor monetário do lead: tenta conta de luz; senão estimativa. */
function parseValorContaLead(r: SolLead): number {
  const raw = r.valor_conta;
  if (raw == null || String(raw).trim() === '') return estimateValueFromBill(r);
  const cleaned = String(raw).replace(/[^\d.,]/g, '');
  if (!cleaned) return estimateValueFromBill(r);
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(/,/g, '');
  const n = parseFloat(normalized);
  return isNaN(n) || n <= 0 ? estimateValueFromBill(r) : n;
}

/** Lead no universo FUP (disparos ou etapa de follow-up) — alinhado a Robô FUP / taxas FUP no dashboard. */
export function isFupFrioLead(r: SolLead): boolean {
  if ((r.fup_followup_count ?? 0) >= 1) return true;
  const e = (r.etapa_funil || '').toUpperCase().trim();
  return e === 'FOLLOW UP';
}

function isGanhoLeadRecord(r: SolLead): boolean {
  const s = (r.status || '').toUpperCase();
  return s.includes('GANHO') || s.includes('FECHADO') || s.includes('VENDA');
}

/** Lead teve atuação mensurável do robô SOL (mensagens IA, FUP ou etapa de pré-venda / qualificação SOL). */
export function solParticipouNaJornada(r: SolLead): boolean {
  if ((r.total_mensagens_ia ?? 0) > 0) return true;
  if ((r.fup_followup_count ?? 0) >= 1) return true;
  const et = (r.etapa_funil || '').toUpperCase().trim();
  if (['TRAFEGO PAGO', 'SOL SDR', 'FOLLOW UP'].includes(et)) return true;
  const q = (r.qualificado_por || '').toLowerCase();
  if (q.includes('sol') || q.includes('robô') || q.includes('robo') || q.includes('ia')) return true;
  return false;
}

export const EMPTY_FUP_FRIO: FupFrio = {
  entraram: 0,
  reativados: 0,
  pctReativados: 0,
  diasAteReativar: 0,
  valorRecuperado: 'R$ 0',
  ticketMedio: 'R$ 0',
  conversaoPosResgate: 0,
  receitaTotal: 'R$ 0',
  pctReceitaViaFup: 0,
  totalRecebidos: 0,
  pctBaseComFup: 0,
  fechadosComFup: 0,
  valorFechadosComFup: 'R$ 0',
  pctGanhosQuePassaramFup: 0,
  pctValorGanhosViaFup: 0,
};

/** Métricas do card “FUP Frio — Dinheiro na Mesa” (Dashboard / Robô FUP). */
export function computeFupFrioBlock(allRecords: SolLead[]): FupFrio {
  const total = allRecords.length;
  if (total === 0) return { ...EMPTY_FUP_FRIO };

  const ganhos = allRecords.filter(isGanhoLeadRecord);
  const fupRecords = allRecords.filter(isFupFrioLead);
  const fupTotal = fupRecords.length;
  const fupReativados = fupRecords.filter(r => ((r as any)._status_resposta || '') === 'respondeu').length;

  const fechadosViaFup = allRecords.filter(r => isFupFrioLead(r) && isGanhoLeadRecord(r));
  const fechadosViaFupCount = fechadosViaFup.length;
  const valorFechadosFupSum = fechadosViaFup.reduce((s, r) => s + parseValorContaLead(r), 0);
  const valorTotalGanhosSum = ganhos.reduce((s, r) => s + parseValorContaLead(r), 0);
  const pctValorGanhosViaFup =
    valorTotalGanhosSum > 0 ? +((valorFechadosFupSum / valorTotalGanhosSum) * 100).toFixed(1) : 0;
  const pctGanhosQuePassaramFup =
    ganhos.length > 0 ? +((fechadosViaFupCount / ganhos.length) * 100).toFixed(1) : 0;
  const pctBaseComFup = total > 0 ? +((fupTotal / total) * 100).toFixed(1) : 0;

  const valorEstimado = valorTotalGanhosSum;
  const valorFupRecuperadoEstimado = fupReativados > 0 && fechadosViaFupCount === 0 ? fupReativados * 7000 : 0;
  const valorRecuperadoNum = fechadosViaFupCount > 0 ? valorFechadosFupSum : valorFupRecuperadoEstimado;

  const fupReactivationDays = fupRecords
    .filter(r => ((r as any)._status_resposta || '') === 'respondeu')
    .map(r => {
      const start = safeDate(r.ts_cadastro);
      const end = safeDate(r.ts_ultimo_fup || r.ts_ultima_interacao);
      if (!start || !end) return null;
      const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      if (diff < 0 || diff > 365) return null;
      return diff;
    })
    .filter((v): v is number => v !== null);

  return {
    entraram: fupTotal,
    reativados: fupReativados,
    pctReativados: fupTotal > 0 ? +(fupReativados / fupTotal * 100).toFixed(1) : 0,
    diasAteReativar: fupReactivationDays.length > 0 ? +average(fupReactivationDays).toFixed(1) : 0,
    valorRecuperado: formatCurrencyShort(valorRecuperadoNum),
    ticketMedio:
      fechadosViaFupCount > 0
        ? formatCurrencyShort(valorFechadosFupSum / fechadosViaFupCount)
        : fupReativados > 0
          ? formatCurrencyShort(valorRecuperadoNum / fupReativados)
          : 'R$ 0',
    conversaoPosResgate: fupTotal > 0 ? Math.round((fupReativados / fupTotal) * 100) : 0,
    receitaTotal: formatCurrencyShort(valorRecuperadoNum),
    pctReceitaViaFup:
      valorEstimado > 0 && fechadosViaFupCount > 0 ? pctValorGanhosViaFup : valorEstimado > 0 && valorRecuperadoNum > 0
        ? +((valorRecuperadoNum / valorEstimado) * 100).toFixed(1)
        : 0,
    totalRecebidos: total,
    pctBaseComFup,
    fechadosComFup: fechadosViaFupCount,
    valorFechadosComFup: formatCurrencyShort(valorFechadosFupSum),
    pctGanhosQuePassaramFup,
    pctValorGanhosViaFup,
  };
}

// ─── Main Hook ───
export function useConferenciaData(filters: FilterState) {
  const { data: solLeads, isLoading: makeLoading } = useSolLeads();

  const effectiveDateRange = useMemo(
    () => getEffectiveDateRange(filters),
    [filters.periodo, filters.dateFrom?.getTime(), filters.dateTo?.getTime()],
  );

  const allRecords = useMemo(() => {
    const raw = solLeads || [];
    return filterRecordsByGlobalFilters(raw, filters, effectiveDateRange);
  }, [
    solLeads,
    effectiveDateRange,
    filters.periodo,
    filters.dateFrom?.getTime(),
    filters.dateTo?.getTime(),
    filters.canal,
    filters.temperatura,
    filters.searchTerm,
    filters.etapa,
    filters.status,
  ]);

  const computed = useMemo(() => {
    const total = allRecords.length;
    if (total === 0) return null;

    const solRecords = allRecords.filter(r => (r.fup_followup_count ?? 0) < 1);

    // ── Stage classification ──
    const stageOrder = ['Robô SOL', 'Qualificação', 'Qualificado', 'Closer', 'Proposta', 'Fechado'];
    const stageCounts: Record<string, number> = {};
    stageOrder.forEach(s => stageCounts[s] = 0);
    allRecords.forEach(r => {
      const stage = getSolStageFromMake(r);
      if (stageCounts[stage] !== undefined) stageCounts[stage]++;
    });

    // ── Temperature ──
    const quentes = allRecords.filter(r => getTemp(r) === 'QUENTE');
    const mornos = allRecords.filter(r => getTemp(r) === 'MORNO');
    const frios = allRecords.filter(r => getTemp(r) === 'FRIO');

    // ── Status counts ──
    const qualificados = allRecords.filter(r => {
      const s = (r.status || '').toUpperCase();
      return s.includes('QUALIFICADO') && !s.includes('DES');
    });
    const desqualificados = allRecords.filter(r => (r.etapa_funil || '').toUpperCase().includes('DECL'));
    const responderam = allRecords.filter(r => ((r as any)._status_resposta || '') === 'respondeu');
    const taxaResposta = total > 0 ? Math.round((responderam.length / total) * 100) : 0;

    const ganhos = allRecords.filter(isGanhoLeadRecord);
    const mqlCount = qualificados.length;

    // ── Funil CEO (cumulativo): coluna i = leads com estágio máximo ≥ i (alinhado à jornada pré-venda → comercial)
    const cumulativePipeline = CEO_PIPELINE_LABELS.map((_, i) =>
      allRecords.filter(r => getCeoJourneyMaxStage(r) >= i).length,
    );

    const emQualificacaoRobo = allRecords.filter(r => {
      const e = (r.etapa_funil || '').toUpperCase().trim();
      return ['TRAFEGO PAGO', 'SOL SDR', 'FOLLOW UP'].includes(e);
    }).length;

    const qualificadosMqlCount = allRecords.filter(r => getCeoJourneyMaxStage(r) >= 2).length;

    const handoverOuAlémCount = allRecords.filter(r => getCeoJourneyMaxStage(r) >= 3).length;

    const fechadosGanhoCount = allRecords.filter(r => getCeoJourneyMaxStage(r) >= 5).length;

    // ── Make-based metrics ──
    const totalMsgsEnviadas = allRecords.reduce((sum, r) =>
      sum + Math.max(([] as any[]).filter(h => h.tipo === 'enviada').length, 1), 0
    );
    const totalMsgsRecebidas = allRecords.reduce((sum, r) =>
      sum + ([] as any[]).filter(h => h.tipo === 'recebida').length, 0
    );

    const fupFrioData = computeFupFrioBlock(allRecords);
    const fupTotal = fupFrioData.entraram;
    const fupReativados = fupFrioData.reativados;
    const valorEstimado = ganhos.reduce((s, r) => s + parseValorContaLead(r), 0);

    // ── SQL (leads with advanced status) ──
    const sqlRecords = allRecords.filter(r => {
      const stage = getSolStageFromMake(r);
      return ['Closer', 'Proposta', 'Fechado'].includes(stage);
    });
    const sqlCount = sqlRecords.length;
    const agendamentos = allRecords.filter(r => {
      const stage = getSolStageFromMake(r);
      return ['Closer', 'Proposta', 'Fechado'].includes(stage);
    }).length;

    // ── Scores ──
    const scores = allRecords.map(r => parseScore(r.score)).filter(s => s > 0);
    const scoreMedio = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // ── Heatmap from responses ──
    const diasNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const heatmapGrid = [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]];
    let maxHeat = 1;
    allRecords.forEach(r => {
      if (r.ts_ultima_interacao) {
        const d = safeDate(r.ts_ultima_interacao);
        if (d) {
          const dow = dayOfWeek(d);
          const pi = hourBucket(d) === 'Manhã' ? 0 : hourBucket(d) === 'Tarde' ? 1 : 2;
          heatmapGrid[pi][dow]++;
        }
      }
    });
    heatmapGrid.forEach(row => row.forEach(v => { if (v > maxHeat) maxHeat = v; }));
    const heatmapNorm = heatmapGrid.map(row => row.map(v => Math.round((v / maxHeat) * 100)));

    let peakDay = 'Seg', peakPeriodo = 'Manhã', peakVal = 0;
    heatmapGrid.forEach((row, pi) => {
      row.forEach((v, di) => {
        if (v > peakVal) { peakVal = v; peakDay = diasNomes[di]; peakPeriodo = ['Manhã', 'Tarde', 'Noite'][pi]; }
      });
    });

    // ── Taxa por disparo FUP (base: leads com fup_followup_count ≥ 1) ──
    const fupBase = allRecords.filter(isFupFrioLead);
    const tentativaCounts = [0, 0, 0, 0];
    const tentativaRespostas = [0, 0, 0, 0];
    const fupBand = (r: SolLead): number => {
      const n = r.fup_followup_count ?? 0;
      if (n <= 0) return -1;
      if (n === 1) return 0;
      if (n === 2) return 1;
      if (n === 3) return 2;
      return 3;
    };
    fupBase.forEach(r => {
      const b = fupBand(r);
      if (b < 0) return;
      tentativaCounts[b]++;
      if (((r as any)._status_resposta || '') === 'respondeu') tentativaRespostas[b]++;
    });

    // ── SLA ──
    const temposRespostaMin: number[] = [];
    allRecords.forEach(r => {
      const envio = safeDate(r.ts_cadastro || r.ts_cadastro);
      const resposta = safeDate(r.ts_ultima_interacao || r.ts_ultimo_fup);
      if (envio && resposta) {
        const diffMin = (resposta.getTime() - envio.getTime()) / (1000 * 60);
        if (diffMin >= 0 && diffMin <= 60 * 24 * 30) temposRespostaMin.push(diffMin);
      }
    });
    const tempoMedioRespostaMin = average(temposRespostaMin);
    const abordadosAte5Min = temposRespostaMin.filter(t => t <= 5).length;
    const dentroDe24h = temposRespostaMin.filter(t => t <= 24 * 60).length;
    const pctAbordados5min = temposRespostaMin.length > 0 ? Math.round((abordadosAte5Min / temposRespostaMin.length) * 100) : 0;
    const pctDentro24h = temposRespostaMin.length > 0 ? Math.round((dentroDe24h / temposRespostaMin.length) * 100) : 0;
    const leadsAguardando = allRecords.filter(r => ((r as any)._status_resposta || '') === 'aguardando').length;

    let tempoRespostaStr = '—';
    if (tempoMedioRespostaMin > 0) {
      if (tempoMedioRespostaMin < 60) tempoRespostaStr = `${Math.round(tempoMedioRespostaMin)}min`;
      else if (tempoMedioRespostaMin < 1440) tempoRespostaStr = `${(tempoMedioRespostaMin / 60).toFixed(1)}h`;
      else tempoRespostaStr = `${Math.round(tempoMedioRespostaMin / 1440)}d`;
    }

    // ── Sol Hoje (últimos 7 dias) ──
    const daysBack = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    const weekLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const solHoje: SolHoje[] = daysBack.map(day => {
      const dayStart = new Date(day);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const dayRecords = allRecords.filter(r => {
        const d = getPrimaryDateForFilter(r);
        return !!d && d >= dayStart && d <= dayEnd;
      });

      const dayQualified = dayRecords.filter(r => {
        const stage = getSolStageFromMake(r);
        return ['Qualificado', 'Closer', 'Proposta', 'Fechado'].includes(stage);
      });

      const scoresSum = dayQualified.reduce((acc, r) => acc + parseScore(r.score), 0);
      const dayQuentes = dayQualified.filter(r => getTemp(r) === 'QUENTE').length;
      const dayMornos = dayQualified.filter(r => getTemp(r) === 'MORNO').length;
      const dayFrios = dayQualified.filter(r => getTemp(r) === 'FRIO').length;

      return {
        dia: weekLabels[day.getDay()],
        qualificados: dayQualified.length,
        scores: Math.round(scoresSum),
        quentes: dayQuentes,
        mornos: dayMornos,
        frios: dayFrios,
      };
    });

    // ── Desqualificação motivos ──
    const motivoCounts: Record<string, number> = {};
    desqualificados.forEach(r => {
      const msgs = ([] as any[]).map(h => h.mensagem.toLowerCase()).join(' ');
      const bill = (r.valor_conta || '').toLowerCase();
      let motivo = 'Sem interesse/Curioso';
      if (bill.includes('menos') || bill.includes('<') || bill.includes('250')) motivo = 'Consumo Desqualificado';
      else if (msgs.includes('financ') || msgs.includes('crédito')) motivo = 'Problemas de Financiamento';
      else if (msgs.includes('depois') || msgs.includes('momento') || msgs.includes('agora não')) motivo = 'Timing';
      else if (msgs.includes('concorr') || msgs.includes('outra empresa')) motivo = 'Concorrência';
      else if (msgs.includes('aluguel') || msgs.includes('alugado')) motivo = 'Imóvel alugado';
      else if (r.status === 'NAO_RESPONDEU') motivo = 'Não respondeu';
      motivoCounts[motivo] = (motivoCounts[motivo] || 0) + 1;
    });
    const totalDesqual = desqualificados.length || 1;

    // C3: Use canal_origem exclusively — no message text inference
    const origemCounts: Record<string, { total: number; ganhos: number; mqlPlus: number }> = {};
    allRecords.forEach(r => {
      const origem = getOrigemLabel(r);

      if (!origemCounts[origem]) origemCounts[origem] = { total: 0, ganhos: 0, mqlPlus: 0 };
      origemCounts[origem].total++;
      if (isGanhoLeadRecord(r)) origemCounts[origem].ganhos++;
      if (getCeoJourneyMaxStage(r) >= 2) origemCounts[origem].mqlPlus++;
    });

    // ── Score por Origem ──
    const scoreByOrigem: Record<string, { scores: number[]; count: number }> = {};
    allRecords.forEach(r => {
      const score = parseScore(r.score);
      const origem = getOrigemLabel(r);
      if (!scoreByOrigem[origem]) scoreByOrigem[origem] = { scores: [], count: 0 };
      scoreByOrigem[origem].count++;
      if (score > 0) scoreByOrigem[origem].scores.push(score);
    });

    // ── Temperatura por Etapa ──
    const tempByEtapa: Record<string, { quente: number; morno: number; frio: number }> = {};
    stageOrder.forEach(s => tempByEtapa[s] = { quente: 0, morno: 0, frio: 0 });
    allRecords.forEach(r => {
      const stage = getSolStageFromMake(r);
      const temp = getTemp(r);
      if (tempByEtapa[stage]) {
        if (temp === 'QUENTE') tempByEtapa[stage].quente++;
        else if (temp === 'MORNO') tempByEtapa[stage].morno++;
        else if (temp === 'FRIO') tempByEtapa[stage].frio++;
      }
    });

    // ── Tabela de Leads ──
    const seenPhones = new Set<string>();
    const uniqueRecords = allRecords.filter(r => {
      if (!r.telefone) return false;
      if (seenPhones.has(r.telefone)) return false;
      seenPhones.add(r.telefone);
      return true;
    });

    const tabelaLeads: TabelaLead[] = uniqueRecords.map((r, i) => {
      const stage = getSolStageFromMake(r);
      const temp = getTemp(r);
      const score = parseScore(r.score);
      const valor = estimateValueFromBill(r);

      let statusFup = 'Novo';
      if (false) statusFup = 'FUP Frio';
      else if (((r as any)._status_resposta || '') === 'respondeu') statusFup = 'Qualificação';
      else if (([] as any[]).length > 0) statusFup = 'Aguardando';
      if (stage === 'Fechado') statusFup = 'Concluído';

      const historico = ([] as any[]).map(h => ({
        data: h.data || r.ts_cadastro || '',
        tipo: false ? 'FUP' : 'SOL',
        msg: h.mensagem || 'Interação registrada',
      }));

      // Calculate SLA (days since last interaction)
      const lastDate = safeDate(r.ts_ultimo_fup || r.ts_ultima_interacao || r.ts_cadastro);
      const sla = lastDate ? Math.round((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

      return {
        id: i + 1,
        nome: r.nome || `Lead ...${r.telefone.slice(-4)}`,
        etapa: stage,
        temperatura: temp,
        score,
        sla,
        statusFup,
        valor,
        dataCriacao: r.ts_cadastro || undefined,
        makeStatus: (r.status || '').toUpperCase(),
        etapaSm: r.etapa_funil || undefined,
        closerAtribuido: r.closer_nome || undefined,
        statusProposta: r.status || undefined,
        dataProposta: r.ts_qualificado || undefined,
        dataFechamento: r.ts_transferido || undefined,
        dataQualificacao: r.ts_ultima_interacao || undefined,
        lastFollowupDate: r.ts_ultimo_fup || undefined,
        respondeu: ((r as any)._status_resposta || '') === 'respondeu',
        historico: historico.length > 0 ? historico : [{ data: '', tipo: 'SOL', msg: 'Sem interações registradas' }],
      };
    });

    // ── Alertas ──
    const alertas: Alerta[] = [];
    if (total > 0) {
      alertas.push({
        type: 'success',
        title: `${total} leads processados pela Sol`,
        desc: `${mqlCount} qualificados (${total > 0 ? ((mqlCount / total) * 100).toFixed(0) : 0}% taxa de qualificação)`,
      });
    }
    if (taxaResposta > 0) {
      alertas.push({
        type: taxaResposta >= 50 ? 'success' : 'warning',
        title: `Taxa de resposta: ${taxaResposta}%`,
        desc: `${responderam.length} de ${total} leads responderam`,
      });
    }
    if (quentes.length > 3) {
      alertas.push({
        type: 'warning',
        title: `${quentes.length} leads quentes ativos`,
        desc: 'Oportunidade de conversão imediata',
      });
    }
    if (fupReativados > 0) {
      alertas.push({
        type: 'info',
        title: `FUP Frio reativou ${fupReativados} leads`,
        desc: `De ${fupTotal} leads no fluxo de repescagem`,
      });
    }
    if (ganhos.length > 0) {
      alertas.push({
        type: 'success',
        title: `${ganhos.length} negócios fechados — ${formatCurrencyShort(valorEstimado)}`,
        desc: `Ticket médio: ${formatCurrencyShort(valorEstimado / ganhos.length)}`,
      });
    }

    // ── Build all data structures ──
    const kpiCards: KPICard[] = [
      { label: 'Leads Recebidos', value: total, suffix: '', detail: 'Base no período (captura)' },
      {
        label: 'Em qualif. (robô)',
        value: emQualificacaoRobo,
        suffix: '',
        detail: 'Tráfego pago / SOL SDR / Follow up',
        tooltip: 'Leads cuja etapa_funil ainda está na pré-qualificação',
      },
      {
        label: 'Qualificados (MQL+)',
        value: qualificadosMqlCount,
        suffix: '',
        detail: `${total > 0 ? ((qualificadosMqlCount / total) * 100).toFixed(0) : 0}% da base`,
        tooltip: 'Alcançaram etapa ou status de qualificado (ou estágios posteriores)',
      },
      {
        label: 'Handover / Closer+',
        value: handoverOuAlémCount,
        suffix: '',
        detail: `${qualificadosMqlCount > 0 ? ((handoverOuAlémCount / qualificadosMqlCount) * 100).toFixed(0) : 0}% após MQL`,
        tooltip: 'transferido_comercial ou contato realizado (ou posteriores)',
      },
      {
        label: 'Fechados (ganho)',
        value: fechadosGanhoCount,
        suffix: '',
        detail: `${total > 0 ? ((fechadosGanhoCount / total) * 100).toFixed(0) : 0}% da base`,
        tooltip: 'Status/etapa de negócio ganho (vitória)',
      },
    ];

    const pipelineStages: PipelineStage[] = CEO_PIPELINE_LABELS.map((etapa, i) => ({
      etapa,
      valor: cumulativePipeline[i] ?? 0,
      icon: ['📥', '🤖', '✅', '📞', '📋', '🏆'][i],
      desc: `${cumulativePipeline[i] ?? 0} leads (≥ este estágio)`,
    }));

    const origemEntries = Object.entries(origemCounts).sort((a, b) => b[1].total - a[1].total);
    const origemLeads: OrigemLead[] = origemEntries.map(([origem, data]) => {
      const sb = scoreByOrigem[origem];
      const scoreMedio =
        sb && sb.scores.length > 0
          ? Math.round(sb.scores.reduce((a, b) => a + b, 0) / sb.scores.length)
          : null;
      return {
        origem,
        share: total > 0 ? Math.round((data.total / total) * 100) : 0,
        conversao: data.total > 0 ? Math.round((data.ganhos / data.total) * 100) : 0,
        conversaoMql: data.total > 0 ? Math.round((data.mqlPlus / data.total) * 100) : 0,
        ganhosCount: data.ganhos,
        mqlPlusCount: data.mqlPlus,
        total: data.total,
        scoreMedio,
      };
    });

    const desqualFills = ['hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--primary))', 'hsl(var(--muted-foreground))', 'hsl(var(--accent-foreground))', 'hsl(var(--info))'];
    const desqualMotivos: DesqualMotivo[] = Object.entries(motivoCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([motivo, count], i) => ({
        motivo,
        pct: Math.round((count / totalDesqual) * 100),
        fill: desqualFills[i % desqualFills.length],
      }));
    if (desqualMotivos.length === 0) {
      desqualMotivos.push({ motivo: 'Sem dados', pct: 100, fill: desqualFills[3] });
    }

    const mensagens: Mensagens = {
      enviadas: totalMsgsEnviadas,
      recebidas: Math.max(totalMsgsRecebidas, responderam.length),
      interacoesPorConv: total > 0 ? +((totalMsgsEnviadas + totalMsgsRecebidas) / total).toFixed(1) : 0,
    };

    const slaData: SLAData = {
      pctAbordados5min,
      tempoMedioRespostaLead: tempoRespostaStr,
    };

    const heatmapData: HeatmapData = {
      dias: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
      periodos: ['Manhã', 'Tarde', 'Noite'],
      valores: heatmapNorm,
      pico: `${peakDay} ${peakPeriodo}`,
    };

    const taxaPorTentativa: TaxaTentativa[] = [
      { tentativa: 'FUP 1', pct: tentativaCounts[0] > 0 ? Math.round((tentativaRespostas[0] / tentativaCounts[0]) * 100) : 0 },
      { tentativa: 'FUP 2', pct: tentativaCounts[1] > 0 ? Math.round((tentativaRespostas[1] / tentativaCounts[1]) * 100) : 0 },
      { tentativa: 'FUP 3', pct: tentativaCounts[2] > 0 ? Math.round((tentativaRespostas[2] / tentativaCounts[2]) * 100) : 0 },
      { tentativa: 'FUP 4+', pct: tentativaCounts[3] > 0 ? Math.round((tentativaRespostas[3] / tentativaCounts[3]) * 100) : 0 },
    ];

    const tempEtapa: TempEtapa[] = stageOrder
      .filter(s => s !== 'Fechado')
      .map(etapa => ({ etapa, ...tempByEtapa[etapa] }));

    const slaMetricsData: SLAMetricsData = {
      primeiroAtendimento: {
        media: tempoMedioRespostaMin > 0 ? +tempoMedioRespostaMin.toFixed(1) : 0,
        pctDentro24h,
        total: temposRespostaMin.length,
      },
      porEtapa: stageOrder.slice(0, 5).map(etapa => {
        const slaMap: Record<string, number> = { 'Robô SOL': 1, 'Qualificação': 3, 'Qualificado': 5, 'Closer': 7, 'Proposta': 10 };
        const posComercial = etapa === 'Closer' || etapa === 'Proposta';
        const leadsInStage = allRecords.filter(r => getSolStageFromMake(r) === etapa);
        const solNaJornadaCount = leadsInStage.filter(solParticipouNaJornada).length;
        const solNaJornadaPct =
          leadsInStage.length > 0 ? Math.round((solNaJornadaCount / leadsInStage.length) * 100) : 0;
        const stageDurations = leadsInStage
          .map(r => {
            const anchor = getStageAnchorDate(r, etapa);
            if (!anchor) return null;
            const days = (Date.now() - anchor.getTime()) / (1000 * 60 * 60 * 24);
            if (days < 0 || days > 365) return null;
            return days;
          })
          .filter((v): v is number => v !== null);

        const mediaDias = average(stageDurations);
        const slaDias = slaMap[etapa] || 5;
        const statusPreSol: 'ok' | 'warning' | 'overdue' =
          mediaDias <= slaDias * 0.7 ? 'ok' : mediaDias <= slaDias ? 'warning' : 'overdue';
        return {
          etapa,
          slaDias,
          mediaDias: +mediaDias.toFixed(1),
          status: (posComercial ? 'comercial' : statusPreSol) as 'ok' | 'warning' | 'overdue' | 'comercial',
          leadsNaEtapa: leadsInStage.length,
          solNaJornadaCount,
          solNaJornadaPct,
        };
      }),
      robos: { tempoResposta: tempoRespostaStr, leadsAguardando, taxaResposta },
      geralProposta: {
        mediaDias: +average(
          allRecords
            .map(r => {
              const start = safeDate(r.ts_cadastro || r.ts_cadastro);
              const proposta = safeDate(r.ts_qualificado);
              if (!start || !proposta) return null;
              const diff = (proposta.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
              if (diff < 0 || diff > 365) return null;
              return diff;
            })
            .filter((v): v is number => v !== null)
        ).toFixed(1),
      },
    };

    const robotInsightsData: RobotInsightsData = {
      destaques: [
        { label: 'Leads Qualificados', value: mqlCount, icon: 'bot', color: 'text-primary' },
        { label: 'Mensagens Enviadas', value: mensagens.enviadas, icon: 'send', color: 'text-foreground' },
        { label: 'Contatos Únicos', value: total, icon: 'users', color: 'text-primary' },
        { label: 'Leads Quentes', value: quentes.length, icon: 'flame', color: 'text-orange-500' },
      ],
      comparacao: {
        sol: {
          nome: 'SOL SDR (IA)',
          taxaResposta,
          tempoMedioResposta: tempoRespostaStr,
          /** Alinhado à coluna «Qualificação» do funil cumulativo (jornada máx. ≥ pré-qualificação robô). */
          leadsProcessados: cumulativePipeline[1] ?? 0,
        },
        fup: { nome: 'FUP Frio', taxaResposta: fupTotal > 0 ? Math.round((fupReativados / fupTotal) * 100) : 0, tempoMedioResposta: '—', leadsProcessados: fupTotal },
      },
      funilMensagens: [
        { etapa: 'Enviadas', valor: mensagens.enviadas },
        { etapa: 'Entregues', valor: mensagens.enviadas },
        { etapa: 'Lidas', valor: mensagens.recebidas },
        { etapa: 'Respondidas', valor: mensagens.recebidas },
        { etapa: 'Qualificadas', valor: mqlCount },
      ],
      alertasUrgentes: alertas.slice(0, 3).map(a => ({ tipo: a.type, titulo: a.title, desc: a.desc })),
    };

    // ─── Monthly Evolution (histórico completo: usa todos os leads, não o recorte do filtro global) ───
    const monthlyMap: Record<string, { total: number; qualificados: number; fechados: number; msgEnviadas: number; msgRecebidas: number }> = {};
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const nowForMonthly = new Date();
    const currentMonthKey = `${nowForMonthly.getFullYear()}-${String(nowForMonthly.getMonth() + 1).padStart(2, '0')}`;
    const rawForMonthly = solLeads || [];
    rawForMonthly.forEach(r => {
      const d = safeDate(r.ts_cadastro);
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (key > currentMonthKey) return;
      if (!monthlyMap[key]) monthlyMap[key] = { total: 0, qualificados: 0, fechados: 0, msgEnviadas: 0, msgRecebidas: 0 };
      monthlyMap[key].total++;
      if (getCeoJourneyMaxStage(r) >= 2) monthlyMap[key].qualificados++;
      if (isWonClosed(r)) monthlyMap[key].fechados++;
      const ia = r.total_mensagens_ia;
      monthlyMap[key].msgEnviadas += ia != null && ia > 0 ? ia : 1;
      if (((r as any)._status_resposta || '') === 'respondeu') monthlyMap[key].msgRecebidas++;
    });

    const monthlyEvolution: MonthlyEvolutionItem[] = Object.keys(monthlyMap)
      .sort()
      .slice(-12)
      .map(key => {
        const v = monthlyMap[key];
        const [year, month] = key.split('-');
        return {
          mes: key,
          mesLabel: `${meses[parseInt(month) - 1]}/${year.slice(2)}`,
          totalLeads: v.total,
          qualificados: v.qualificados,
          pctQualificacao: v.total > 0 ? Math.round((v.qualificados / v.total) * 100) : 0,
          msgEnviadas: v.msgEnviadas,
          msgRecebidas: v.msgRecebidas,
          conversao: v.total > 0 ? Math.round((v.fechados / v.total) * 100) : 0,
          fechados: v.fechados,
        };
      });

    return {
      kpiCards, pipelineStages, origemLeads, fupFrio: fupFrioData,
      desqualMotivos, mensagens, sla: slaData, heatmap: heatmapData,
      taxaPorTentativa, solHoje, alertas, temperaturaPorEtapa: tempEtapa,
      tabelaLeads, slaMetrics: slaMetricsData, robotInsights: robotInsightsData,
      monthlyEvolution,
    };
  }, [allRecords, solLeads]);

  return {
    data: computed,
    isLoading: makeLoading,
    hasData: !!computed,
    error: null,
  };
}
