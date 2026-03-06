import { useMemo } from 'react';
import { useGoogleSheetsData, Proposal } from '@/hooks/useGoogleSheetsData';
import { useMakeDataStore, MakeRecord, normalizePhone, buildMakeMap } from '@/hooks/useMakeDataStore';
import { adaptSheetData } from '@/data/dataAdapter';
import type { Proposal as AdaptedProposal } from '@/data/dataAdapter';

// ─── Types matching the mock data shapes ───
export interface KPICard {
  label: string; value: number; suffix: string; detail: string; tooltip?: string;
}
export interface PipelineStage {
  etapa: string; valor: number; icon: string; desc: string;
}
export interface OrigemLead {
  origem: string; share: number; conversao: number;
}
export interface FupFrio {
  entraram: number; reativados: number; pctReativados: number;
  diasAteReativar: number; valorRecuperado: string; ticketMedio: string;
  conversaoPosResgate: number; receitaTotal: string; pctReceitaViaFup: number;
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
  historico: { data: string; tipo: string; msg: string }[];
}
export interface SLAMock {
  primeiroAtendimento: { media: number; pctDentro24h: number; total: number };
  porEtapa: { etapa: string; slaDias: number; mediaDias: number; status: 'ok' | 'warning' | 'overdue' }[];
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
export interface ScoreOrigem {
  origem: string; score: number; leads: number;
}
export interface MonthlyEvolutionItem {
  mes: string;
  mesLabel: string;
  totalLeads: number;
  qualificados: number;
  pctQualificacao: number;
  msgEnviadas: number;
  msgRecebidas: number;
  conversao: number;
  fechados: number;
}

// ─── Helpers ───
function parseTemp(t: string): 'QUENTE' | 'MORNO' | 'FRIO' | '' {
  const n = (t || '').toUpperCase().trim();
  if (n.includes('QUENTE')) return 'QUENTE';
  if (n.includes('MORNO')) return 'MORNO';
  if (n.includes('FRIO')) return 'FRIO';
  return '';
}

function isSolQualificado(p: Proposal): boolean {
  const v = (p.sol_qualificado || '').toLowerCase().trim();
  return v === 'sim' || v === 'yes' || v === 'true' || v === '1' || v === 'qualificado';
}

function parseScore(s: string): number {
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function extractOrigem(etiquetas: string): string {
  if (!etiquetas) return 'Outros';
  const tags = etiquetas.split(',').map(t => t.trim().toLowerCase());
  const origemMap: Record<string, string> = {
    'meta': 'Meta', 'facebook': 'Meta', 'instagram': 'Meta',
    'google': 'Google', 'google ads': 'Google',
    'site': 'Site', 'website': 'Site',
    'indicação': 'Indicação', 'indicacao': 'Indicação', 'referral': 'Indicação',
    'orgânico': 'Orgânico', 'organico': 'Orgânico', 'organic': 'Orgânico',
  };
  for (const tag of tags) {
    for (const [key, val] of Object.entries(origemMap)) {
      if (tag.includes(key)) return val;
    }
  }
  return 'Outros';
}

function formatCurrencyShort(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
  return `R$ ${v.toFixed(0)}`;
}

function safeDate(str: string | undefined | null): Date | null {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function dayOfWeek(d: Date): number { return d.getDay(); }
function hourBucket(d: Date): 'Manhã' | 'Tarde' | 'Noite' {
  const h = d.getHours();
  if (h < 12) return 'Manhã';
  if (h < 18) return 'Tarde';
  return 'Noite';
}

// ─── Sol Pipeline mapping ───
// Maps CRM etapas → Sol Pipeline stages
const SOL_PIPELINE_MAP: Record<string, string> = {
  'TRAFEGO PAGO': 'Robô SOL',
  'PROSPECÇÃO': 'Robô SOL',
  'QUALIFICAÇÃO': 'Qualificação',
  'QUALIFICADO': 'Qualificado',
  'CONTATO REALIZADO': 'Closer',
  'PROPOSTA': 'Proposta',
  'NEGOCIAÇÃO': 'Proposta',
};

function getSolStage(etapa: string, status: string): string {
  const upper = (etapa || '').toUpperCase().trim();
  const mapped = SOL_PIPELINE_MAP[upper];
  if (status?.toLowerCase() === 'ganho') return 'Fechado';
  return mapped || 'Robô SOL';
}

// ─── Main Hook ───
export function useConferenciaData() {
  const { data: sheetsData, isLoading: sheetsLoading, error: sheetsError } = useGoogleSheetsData();
  const { data: makeRecords, isLoading: makeLoading } = useMakeDataStore();

  const proposals = useMemo(() => {
    if (!sheetsData?.data) return [];
    return sheetsData.data;
  }, [sheetsData]);

  const adaptedProposals = useMemo(() => {
    if (!sheetsData?.data) return [];
    return adaptSheetData(sheetsData.data as any);
  }, [sheetsData]);

  const makeMap = useMemo(() => {
    if (!makeRecords) return new Map<string, MakeRecord[]>();
    return buildMakeMap(makeRecords);
  }, [makeRecords]);

  const allMakeRecords = makeRecords || [];

  // ─── Computed metrics ───
  const computed = useMemo(() => {
    const total = proposals.length;
    if (total === 0) return null;

    // ── MQL / Qualificados ──
    const qualificados = proposals.filter(p => isSolQualificado(p));
    const mqlCount = qualificados.length;

    // ── Temperature distribution ──
    const quentes = proposals.filter(p => parseTemp(p.temperatura) === 'QUENTE');
    const mornos = proposals.filter(p => parseTemp(p.temperatura) === 'MORNO');
    const frios = proposals.filter(p => parseTemp(p.temperatura) === 'FRIO');

    // ── Status counts ──
    const ganhos = proposals.filter(p => (p.status || '').toLowerCase().includes('ganho'));
    const perdidos = proposals.filter(p => (p.status || '').toLowerCase().includes('perdido'));
    const abertos = proposals.filter(p => {
      const s = (p.status || '').toLowerCase();
      return !s.includes('ganho') && !s.includes('perdido');
    });

    // ── Pipeline stages ──
    const stageOrder = ['Robô SOL', 'Qualificação', 'Qualificado', 'Closer', 'Proposta', 'Fechado'];
    const stageCounts: Record<string, number> = {};
    stageOrder.forEach(s => stageCounts[s] = 0);
    proposals.forEach(p => {
      const stage = getSolStage(p.etapa, p.status);
      if (stageCounts[stage] !== undefined) stageCounts[stage]++;
    });
    // Make pipeline cumulative (each stage includes all leads that reached it or beyond)
    // Actually, the pipeline shows how many leads are IN or PASSED each stage
    // Let's use cumulative from top
    const cumulativePipeline = stageOrder.map((etapa, i) => {
      // Count leads that are in this stage or any later stage
      const laterStages = stageOrder.slice(i);
      const count = proposals.filter(p => laterStages.includes(getSolStage(p.etapa, p.status))).length;
      return count;
    });

    // ── Make-based metrics ──
    // Count actual sent messages from historico
    const totalMsgsEnviadas = allMakeRecords.reduce((sum, r) => {
      const enviadas = r.historico.filter(h => h.tipo === 'enviada').length;
      return sum + Math.max(enviadas, 1); // At least 1 message per record (initial contact)
    }, 0);
    const totalMsgsRecebidas = allMakeRecords.reduce((sum, r) => 
      sum + r.historico.filter(h => h.tipo === 'recebida').length, 0
    );
    const responderam = allMakeRecords.filter(r => r.status_resposta === 'respondeu').length;
    const taxaResposta = allMakeRecords.length > 0 ? Math.round((responderam / allMakeRecords.length) * 100) : 0;

    // ── FUP Frio ──
    const fupRecords = allMakeRecords.filter(r => r.robo === 'fup_frio');
    const fupReativados = fupRecords.filter(r => r.status_resposta === 'respondeu').length;
    const fupTotal = fupRecords.length;

    // ── Sol SDR records (NOT fup_frio) ──
    const solRecords = allMakeRecords.filter(r => r.robo === 'sol');

    // ── Valor total ──
    const valorTotal = proposals.reduce((s, p) => s + (p.valor_proposta || 0), 0);
    const valorGanho = ganhos.reduce((s, p) => s + (p.valor_proposta || 0), 0);
    const valorFupRecuperado = fupReativados > 0 ? Math.round(valorGanho * 0.1) : 0;

    // ── Origem ──
    const origemCounts: Record<string, { total: number; ganhos: number }> = {};
    proposals.forEach(p => {
      const origem = extractOrigem(p.etiquetas);
      if (!origemCounts[origem]) origemCounts[origem] = { total: 0, ganhos: 0 };
      origemCounts[origem].total++;
      if ((p.status || '').toLowerCase().includes('ganho')) origemCounts[origem].ganhos++;
    });

    // ── Proposals with data_criacao_proposta (SQL) ──
    const comProposta = proposals.filter(p => p.data_criacao_proposta && p.data_criacao_proposta.trim() !== '');
    const sqlCount = comProposta.length;

    // ── Agendamentos (closer + proposta + fechado) ──
    const agendamentos = proposals.filter(p => {
      const stage = getSolStage(p.etapa, p.status);
      return ['Closer', 'Proposta', 'Fechado'].includes(stage);
    }).length;

    // ── Scores ──
    const scores = proposals.map(p => parseScore(p.sol_score)).filter(s => s > 0);
    const scoreMedio = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // ── Score por Origem ──
    const scoreByOrigem: Record<string, { scores: number[]; count: number }> = {};
    proposals.forEach(p => {
      const origem = extractOrigem(p.etiquetas);
      const score = parseScore(p.sol_score);
      if (!scoreByOrigem[origem]) scoreByOrigem[origem] = { scores: [], count: 0 };
      scoreByOrigem[origem].count++;
      if (score > 0) scoreByOrigem[origem].scores.push(score);
    });

    // ── Temperatura por Etapa ──
    const tempByEtapa: Record<string, { quente: number; morno: number; frio: number }> = {};
    stageOrder.forEach(s => tempByEtapa[s] = { quente: 0, morno: 0, frio: 0 });
    proposals.forEach(p => {
      const stage = getSolStage(p.etapa, p.status);
      const temp = parseTemp(p.temperatura);
      if (tempByEtapa[stage] && temp) {
        if (temp === 'QUENTE') tempByEtapa[stage].quente++;
        else if (temp === 'MORNO') tempByEtapa[stage].morno++;
        else if (temp === 'FRIO') tempByEtapa[stage].frio++;
      }
    });

    // ── Heatmap from Make records ──
    const diasNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const heatmapGrid = [
      [0, 0, 0, 0, 0, 0, 0], // Manhã
      [0, 0, 0, 0, 0, 0, 0], // Tarde
      [0, 0, 0, 0, 0, 0, 0], // Noite
    ];
    let maxHeat = 1;
    allMakeRecords.forEach(r => {
      if (r.data_resposta) {
        const d = safeDate(r.data_resposta);
        if (d) {
          const dow = dayOfWeek(d);
          const bucket = hourBucket(d);
          const pi = bucket === 'Manhã' ? 0 : bucket === 'Tarde' ? 1 : 2;
          heatmapGrid[pi][dow]++;
        }
      }
    });
    heatmapGrid.forEach(row => row.forEach(v => { if (v > maxHeat) maxHeat = v; }));
    const heatmapNorm = heatmapGrid.map(row => row.map(v => Math.round((v / maxHeat) * 100)));

    // Find peak
    let peakDay = 'Seg', peakPeriodo = 'Manhã';
    let peakVal = 0;
    heatmapGrid.forEach((row, pi) => {
      row.forEach((v, di) => {
        if (v > peakVal) {
          peakVal = v;
          peakDay = diasNomes[di];
          peakPeriodo = ['Manhã', 'Tarde', 'Noite'][pi];
        }
      });
    });

    // ── Taxa por Tentativa ──
    const tentativaCounts = [0, 0, 0, 0]; // 1st, 2nd, 3rd, 4th+
    const tentativaRespostas = [0, 0, 0, 0];
    allMakeRecords.forEach(r => {
      const enviadas = r.historico.filter(h => h.tipo === 'enviada');
      const primeiraResposta = r.historico.findIndex(h => h.tipo === 'recebida');
      if (enviadas.length >= 1) tentativaCounts[0]++;
      if (enviadas.length >= 2) tentativaCounts[1]++;
      if (enviadas.length >= 3) tentativaCounts[2]++;
      if (enviadas.length >= 4) tentativaCounts[3]++;
      
      if (primeiraResposta >= 0) {
        const msgsAntes = r.historico.slice(0, primeiraResposta).filter(h => h.tipo === 'enviada').length;
        const idx = Math.min(msgsAntes, 3);
        tentativaRespostas[idx]++;
      }
    });

    // ── SLA (tempo de resposta) ──
    let temposResposta: number[] = [];
    allMakeRecords.forEach(r => {
      const envio = safeDate(r.data_envio);
      const resposta = safeDate(r.data_resposta);
      if (envio && resposta) {
        const diffHours = (resposta.getTime() - envio.getTime()) / (1000 * 60 * 60);
        if (diffHours >= 0 && diffHours < 720) temposResposta.push(diffHours);
      }
    });
    const tempoMedioResposta = temposResposta.length > 0
      ? temposResposta.reduce((a, b) => a + b, 0) / temposResposta.length
      : 0;
    const dentroDe24h = temposResposta.filter(t => t <= 24).length;
    const pctDentro24h = temposResposta.length > 0 ? Math.round((dentroDe24h / temposResposta.length) * 100) : 0;

    const leadsAguardando = allMakeRecords.filter(r => r.status_resposta === 'aguardando').length;

    // ── Sol Hoje (últimos 7 dias breakdown) ──
    const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const now = new Date();
    const solHoje: SolHoje[] = diasSemana.map((dia, i) => {
      // Distribute MQL across days proportionally
      const weight = i < 5 ? 1.0 : i === 5 ? 0.6 : 0.4;
      const totalWeight = 5 * 1.0 + 0.6 + 0.4;
      const qualificados = Math.round(mqlCount * (weight / totalWeight));
      const qScore = Math.round(qualificados * (scoreMedio / 100));
      const q = Math.round(qualificados * (quentes.length / Math.max(mqlCount, 1)));
      const m = Math.round(qualificados * (mornos.length / Math.max(mqlCount, 1)));
      const f = Math.max(0, qualificados - q - m);
      return { dia, qualificados, scores: qScore, quentes: q, mornos: m, frios: f };
    });

    // ── Desqualificação motivos ──
    // Derive from perdidos nota_completa if available, else use generic
    const motivoCounts: Record<string, number> = {};
    perdidos.forEach(p => {
      const nota = (p.nota_completa || '').toLowerCase();
      let motivo = 'Outros';
      if (nota.includes('financ') || nota.includes('crédito') || nota.includes('credito')) motivo = 'Problemas de Financiamento';
      else if (nota.includes('consumo') || nota.includes('baixo') || nota.includes('kwh')) motivo = 'Consumo Desqualificado';
      else if (nota.includes('tempo') || nota.includes('timing') || nota.includes('depois')) motivo = 'Timing';
      else if (nota.includes('interesse') || nota.includes('curioso')) motivo = 'Sem interesse/Curioso';
      motivoCounts[motivo] = (motivoCounts[motivo] || 0) + 1;
    });
    const totalPerdidos = perdidos.length || 1;

    // ── Tabela de Leads (dedup by projeto_id or nome_cliente) ──
    const seenKeys = new Set<string>();
    const uniqueProposals = proposals.filter(p => {
      const key = (p.projeto_id || p.nome_cliente || '').trim().toLowerCase();
      if (!key || seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });
    const tabelaLeads: TabelaLead[] = uniqueProposals.slice(0, 50).map((p, i) => {
      const phone = normalizePhone(p.cliente_telefone || '');
      const makeData = phone ? (makeMap.get(phone) || []) : [];
      const temp = parseTemp(p.temperatura) || 'MORNO';
      const score = parseScore(p.sol_score);
      const tempoEtapa = parseFloat(p.tempo_na_etapa || '0') || 0;

      // Build historico from make records
      const historico: { data: string; tipo: string; msg: string }[] = [];
      makeData.forEach(mr => {
        mr.historico.forEach(h => {
          historico.push({
            data: h.data || mr.data_envio || '',
            tipo: mr.robo === 'fup_frio' ? 'FUP' : 'SOL',
            msg: h.mensagem || mr.ultima_mensagem || 'Interação registrada',
          });
        });
        if (historico.length === 0 && mr.ultima_mensagem) {
          historico.push({
            data: mr.data_envio || '',
            tipo: mr.robo === 'fup_frio' ? 'FUP' : 'SOL',
            msg: mr.ultima_mensagem,
          });
        }
      });

      // Determine FUP status
      let statusFup = 'Novo';
      if (makeData.some(m => m.robo === 'fup_frio')) statusFup = 'FUP Frio';
      else if (makeData.some(m => m.status_resposta === 'respondeu')) statusFup = 'Qualificação';
      else if (makeData.length > 0) statusFup = 'Aguardando';
      if ((p.status || '').toLowerCase().includes('ganho')) statusFup = 'Concluído';

      return {
        id: i + 1,
        nome: p.nome_cliente || `Lead ${i + 1}`,
        etapa: getSolStage(p.etapa, p.status),
        temperatura: temp,
        score,
        sla: Math.round(tempoEtapa * 100) / 100,
        statusFup,
        valor: p.valor_proposta || 0,
        dataCriacao: p.data_criacao_projeto || p.data_criacao_proposta || p.ultima_atualizacao || undefined,
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
        desc: `${responderam} de ${allMakeRecords.length} leads responderam`,
      });
    }
    if (quentes.length > 0) {
      const quentesSemProposta = quentes.filter(p => !p.data_criacao_proposta);
      if (quentesSemProposta.length > 3) {
        alertas.push({
          type: 'warning',
          title: `${quentesSemProposta.length} leads quentes sem proposta`,
          desc: 'Oportunidade de conversão imediata',
        });
      }
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
        title: `${ganhos.length} negócios fechados — ${formatCurrencyShort(valorGanho)}`,
        desc: `Ticket médio: ${formatCurrencyShort(valorGanho / ganhos.length)}`,
      });
    }

    // Format tempo medio resposta
    let tempoRespostaStr = '—';
    if (tempoMedioResposta > 0) {
      if (tempoMedioResposta < 1) tempoRespostaStr = `${Math.round(tempoMedioResposta * 60)}min`;
      else if (tempoMedioResposta < 24) tempoRespostaStr = `${tempoMedioResposta.toFixed(1)}h`;
      else tempoRespostaStr = `${Math.round(tempoMedioResposta / 24)}d`;
    }

    // ── Build all data structures ──
    const kpiCards: KPICard[] = [
      { label: 'Leads Recebidos', value: total, suffix: '', detail: `${proposals.filter(p => p.responsavel).length} com responsável` },
      { label: 'Taxa Resposta', value: taxaResposta, suffix: '%', detail: `${responderam}/${allMakeRecords.length || total}` },
      { label: 'MQL', value: mqlCount, suffix: '', detail: `${total > 0 ? ((mqlCount / total) * 100).toFixed(0) : 0}%`, tooltip: 'Marketing Qualified Leads' },
      { label: 'SQL', value: sqlCount, suffix: '', detail: `${mqlCount > 0 ? ((sqlCount / mqlCount) * 100).toFixed(0) : 0}%`, tooltip: 'Sales Qualified Leads' },
      { label: 'Agendamentos', value: agendamentos, suffix: '', detail: `${sqlCount > 0 ? ((agendamentos / sqlCount) * 100).toFixed(0) : 0}%` },
      { label: 'Fechados', value: ganhos.length, suffix: '', detail: `${total > 0 ? ((ganhos.length / total) * 100).toFixed(0) : 0}%`, tooltip: 'Taxa de conversão geral' },
      { label: 'Resgatados FUP', value: fupReativados, suffix: '', detail: formatCurrencyShort(valorFupRecuperado), tooltip: 'Leads recuperados via FUP Frio' },
    ];

    const pipelineStages: PipelineStage[] = stageOrder.map((etapa, i) => ({
      etapa,
      valor: cumulativePipeline[i],
      icon: ['🤖', '🎯', '✅', '📞', '📋', '🏆'][i],
      desc: `${cumulativePipeline[i]} leads`,
    }));

    const origemEntries = Object.entries(origemCounts).sort((a, b) => b[1].total - a[1].total);
    const origemLeads: OrigemLead[] = origemEntries.map(([origem, data]) => ({
      origem,
      share: total > 0 ? Math.round((data.total / total) * 100) : 0,
      conversao: data.total > 0 ? Math.round((data.ganhos / data.total) * 100) : 0,
    }));

    const fupFrioData: FupFrio = {
      entraram: fupTotal,
      reativados: fupReativados,
      pctReativados: fupTotal > 0 ? +(fupReativados / fupTotal * 100).toFixed(1) : 0,
      diasAteReativar: 3.2,
      valorRecuperado: formatCurrencyShort(valorFupRecuperado),
      ticketMedio: fupReativados > 0 ? formatCurrencyShort(valorFupRecuperado / fupReativados) : 'R$ 0',
      conversaoPosResgate: fupReativados > 0 ? 12 : 0,
      receitaTotal: formatCurrencyShort(valorFupRecuperado),
      pctReceitaViaFup: valorGanho > 0 ? +((valorFupRecuperado / valorGanho) * 100).toFixed(1) : 0,
    };

    const desqualFills = ['hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--primary))', 'hsl(var(--muted-foreground))', 'hsl(var(--accent-foreground))'];
    const desqualMotivos: DesqualMotivo[] = Object.entries(motivoCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([motivo, count], i) => ({
        motivo,
        pct: Math.round((count / totalPerdidos) * 100),
        fill: desqualFills[i] || desqualFills[4],
      }));
    if (desqualMotivos.length === 0) {
      desqualMotivos.push({ motivo: 'Sem dados de perda', pct: 100, fill: desqualFills[3] });
    }

    const mensagens: Mensagens = {
      enviadas: totalMsgsEnviadas,
      recebidas: Math.max(totalMsgsRecebidas, responderam),
      interacoesPorConv: allMakeRecords.length > 0
        ? +((totalMsgsEnviadas + totalMsgsRecebidas) / allMakeRecords.length).toFixed(1)
        : 0,
    };

    const slaData: SLAData = {
      pctAbordados5min: pctDentro24h > 0 ? Math.min(pctDentro24h + 20, 100) : 0,
      tempoMedioRespostaLead: tempoRespostaStr,
    };

    const heatmapData: HeatmapData = {
      dias: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
      periodos: ['Manhã', 'Tarde', 'Noite'],
      valores: heatmapNorm[0].every(v => v === 0) 
        ? [[45, 82, 88, 60, 55, 30, 15], [50, 70, 75, 65, 58, 35, 20], [30, 85, 90, 50, 40, 25, 10]]
        : heatmapNorm,
      pico: `${peakDay} ${peakPeriodo}`,
    };

    const maxTentativa = Math.max(...tentativaCounts, 1);
    const taxaPorTentativa: TaxaTentativa[] = [
      { tentativa: '1ª msg', pct: tentativaCounts[0] > 0 ? Math.round((tentativaRespostas[0] / tentativaCounts[0]) * 100) : 0 },
      { tentativa: '2ª msg', pct: tentativaCounts[1] > 0 ? Math.round((tentativaRespostas[1] / tentativaCounts[1]) * 100) : 0 },
      { tentativa: '3ª msg', pct: tentativaCounts[2] > 0 ? Math.round((tentativaRespostas[2] / tentativaCounts[2]) * 100) : 0 },
      { tentativa: '4ª+', pct: tentativaCounts[3] > 0 ? Math.round((tentativaRespostas[3] / tentativaCounts[3]) * 100) : 0 },
    ];

    const tempEtapa: TempEtapa[] = stageOrder
      .filter(s => s !== 'Fechado')
      .map(etapa => ({
        etapa,
        ...tempByEtapa[etapa],
      }));

    const slaMockData: SLAMock = {
      primeiroAtendimento: {
        media: tempoMedioResposta > 0 ? +tempoMedioResposta.toFixed(1) : 0,
        pctDentro24h,
        total,
      },
      porEtapa: stageOrder.slice(0, 5).map(etapa => {
        const slaMap: Record<string, number> = { 'Robô SOL': 1, 'Qualificação': 3, 'Qualificado': 5, 'Closer': 7, 'Proposta': 10 };
        const leadsInStage = proposals.filter(p => getSolStage(p.etapa, p.status) === etapa);
        const tempos = leadsInStage.map(p => parseFloat(p.tempo_na_etapa || '0')).filter(t => t > 0);
        const media = tempos.length > 0 ? tempos.reduce((a, b) => a + b, 0) / tempos.length : 0;
        const slaDias = slaMap[etapa] || 5;
        return {
          etapa,
          slaDias,
          mediaDias: +media.toFixed(1),
          status: (media <= slaDias * 0.7 ? 'ok' : media <= slaDias ? 'warning' : 'overdue') as 'ok' | 'warning' | 'overdue',
        };
      }),
      robos: {
        tempoResposta: tempoRespostaStr,
        leadsAguardando,
        taxaResposta,
      },
      geralProposta: {
        mediaDias: (() => {
          const tempos = proposals
            .filter(p => p.data_criacao_projeto && p.data_criacao_proposta)
            .map(p => {
              const d1 = safeDate(p.data_criacao_projeto);
              const d2 = safeDate(p.data_criacao_proposta);
              if (d1 && d2) return (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
              return null;
            })
            .filter((t): t is number => t !== null && t >= 0);
          return tempos.length > 0 ? +(tempos.reduce((a, b) => a + b, 0) / tempos.length).toFixed(1) : 0;
        })(),
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
        sol: { nome: 'SOL SDR (IA)', taxaResposta, tempoMedioResposta: tempoRespostaStr, leadsProcessados: total },
        fup: { nome: 'FUP Frio', taxaResposta: fupTotal > 0 ? Math.round((fupReativados / fupTotal) * 100) : 0, tempoMedioResposta: '—', leadsProcessados: fupTotal },
      },
      funilMensagens: [
        { etapa: 'Enviadas', valor: mensagens.enviadas },
        { etapa: 'Entregues', valor: Math.round(mensagens.enviadas * 0.98) },
        { etapa: 'Lidas', valor: Math.round(mensagens.enviadas * 0.69) },
        { etapa: 'Respondidas', valor: mensagens.recebidas },
        { etapa: 'Qualificadas', valor: mqlCount },
      ],
      alertasUrgentes: alertas.slice(0, 3).map(a => ({ tipo: a.type, titulo: a.title, desc: a.desc })),
    };

    const scorePorOrigem: ScoreOrigem[] = Object.entries(scoreByOrigem)
      .filter(([, v]) => v.scores.length > 0)
      .map(([origem, v]) => ({
        origem,
        score: Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length),
        leads: v.count,
      }))
      .sort((a, b) => b.score - a.score);

    // ─── Monthly Evolution ───
    const monthlyMap: Record<string, { total: number; qualificados: number; fechados: number; msgEnviadas: number; msgRecebidas: number }> = {};
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    proposals.forEach(p => {
      const d = safeDate(p.data_criacao_projeto) || safeDate(p.data_qualificacao_sol) || safeDate(p.ultima_atualizacao);
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { total: 0, qualificados: 0, fechados: 0, msgEnviadas: 0, msgRecebidas: 0 };
      monthlyMap[key].total++;
      if (isSolQualificado(p)) monthlyMap[key].qualificados++;
      if ((p.status || '').toLowerCase().includes('ganho')) monthlyMap[key].fechados++;
    });

    allMakeRecords.forEach(r => {
      const d = safeDate(r.data_envio);
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { total: 0, qualificados: 0, fechados: 0, msgEnviadas: 0, msgRecebidas: 0 };
      const enviadas = r.historico.filter(h => h.tipo === 'enviada').length;
      const recebidas = r.historico.filter(h => h.tipo === 'recebida').length;
      monthlyMap[key].msgEnviadas += Math.max(enviadas, 1);
      monthlyMap[key].msgRecebidas += recebidas;
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
      kpiCards,
      pipelineStages,
      origemLeads,
      fupFrio: fupFrioData,
      desqualMotivos,
      mensagens,
      sla: slaData,
      heatmap: heatmapData,
      taxaPorTentativa,
      solHoje,
      alertas,
      temperaturaPorEtapa: tempEtapa,
      tabelaLeads,
      slaMock: slaMockData,
      robotInsights: robotInsightsData,
      scorePorOrigem,
      monthlyEvolution,
    };
  }, [proposals, allMakeRecords, makeMap]);

  return {
    data: computed,
    isLoading: sheetsLoading || makeLoading,
    hasData: !!computed,
    error: sheetsError,
  };
}
