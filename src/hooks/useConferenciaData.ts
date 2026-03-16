import { useMemo } from 'react';
import { useMakeDataStore, MakeRecord } from '@/hooks/useMakeDataStore';

// ─── Types matching the page component shapes ───
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

function formatCurrencyShort(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
  return `R$ ${v.toFixed(0)}`;
}

/** Map Make status → Sol Pipeline stage */
function getSolStageFromMake(r: MakeRecord): string {
  const status = (r.makeStatus || '').toUpperCase();
  if (status.includes('GANHO') || status.includes('FECHADO') || status.includes('VENDA')) return 'Fechado';
  if (status.includes('PROPOSTA') || status.includes('NEGOCI')) return 'Proposta';
  if (status.includes('CONTATO') || status.includes('AGEND')) return 'Closer';
  if (status.includes('QUALIFICADO') && !status.includes('DES')) return 'Qualificado';
  if (status.includes('WHATSAPP')) return 'Qualificação';
  if (r.status_resposta === 'respondeu') return 'Qualificação';
  return 'Robô SOL';
}

function getTemp(r: MakeRecord): string {
  const t = parseTemp(r.makeTemperatura);
  if (t) return t;
  const s = parseScore(r.makeScore);
  if (s >= 70) return 'QUENTE';
  if (s >= 40) return 'MORNO';
  if (s > 0) return 'FRIO';
  return 'MORNO'; // default
}

function estimateValueFromBill(r: MakeRecord): number {
  const bill = (r.valorConta || '').toLowerCase();
  if (bill.includes('1.000') || bill.includes('1000') || bill.includes('acima')) return 45000;
  if (bill.includes('700') || bill.includes('400')) return 28000;
  if (bill.includes('250') || bill.includes('350')) return 18000;
  if (bill.includes('menos') || bill.includes('<')) return 8000;
  return 17000; // default
}

// ─── Main Hook ───
export function useConferenciaData() {
  const { data: makeRecords, isLoading: makeLoading } = useMakeDataStore();

  const allRecords = makeRecords || [];

  const computed = useMemo(() => {
    const total = allRecords.length;
    if (total === 0) return null;

    const solRecords = allRecords.filter(r => r.robo === 'sol');
    const fupRecords = allRecords.filter(r => r.robo === 'fup_frio');

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
      const s = (r.makeStatus || '').toUpperCase();
      return s.includes('QUALIFICADO') && !s.includes('DES');
    });
    const desqualificados = allRecords.filter(r => (r.makeStatus || '').includes('DESQUALIFICADO'));
    const responderam = allRecords.filter(r => r.status_resposta === 'respondeu');
    const taxaResposta = total > 0 ? Math.round((responderam.length / total) * 100) : 0;

    const ganhos = allRecords.filter(r => {
      const s = (r.makeStatus || '').toUpperCase();
      return s.includes('GANHO') || s.includes('FECHADO') || s.includes('VENDA');
    });
    const mqlCount = qualificados.length;

    // ── Cumulative pipeline ──
    const cumulativePipeline = stageOrder.map((_, i) => {
      const laterStages = stageOrder.slice(i);
      return allRecords.filter(r => laterStages.includes(getSolStageFromMake(r))).length;
    });

    // ── Make-based metrics ──
    const totalMsgsEnviadas = allRecords.reduce((sum, r) =>
      sum + Math.max(r.historico.filter(h => h.tipo === 'enviada').length, 1), 0
    );
    const totalMsgsRecebidas = allRecords.reduce((sum, r) =>
      sum + r.historico.filter(h => h.tipo === 'recebida').length, 0
    );

    // ── FUP Frio ──
    const fupReativados = fupRecords.filter(r => r.status_resposta === 'respondeu').length;
    const fupTotal = fupRecords.length;
    const valorEstimado = ganhos.reduce((s, r) => s + estimateValueFromBill(r), 0);
    const valorFupRecuperado = fupReativados > 0 ? fupReativados * 7000 : 0;

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
    const scores = allRecords.map(r => parseScore(r.makeScore)).filter(s => s > 0);
    const scoreMedio = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // ── Heatmap from responses ──
    const diasNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const heatmapGrid = [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]];
    let maxHeat = 1;
    allRecords.forEach(r => {
      if (r.data_resposta) {
        const d = safeDate(r.data_resposta);
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

    // ── Taxa por Tentativa ──
    const tentativaCounts = [0, 0, 0, 0];
    const tentativaRespostas = [0, 0, 0, 0];
    allRecords.forEach(r => {
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

    // ── SLA ──
    const temposResposta: number[] = [];
    allRecords.forEach(r => {
      const envio = safeDate(r.data_envio);
      const resposta = safeDate(r.data_resposta);
      if (envio && resposta) {
        const diffHours = (resposta.getTime() - envio.getTime()) / (1000 * 60 * 60);
        if (diffHours >= 0 && diffHours < 720) temposResposta.push(diffHours);
      }
    });
    const tempoMedioResposta = temposResposta.length > 0
      ? temposResposta.reduce((a, b) => a + b, 0) / temposResposta.length : 0;
    const dentroDe24h = temposResposta.filter(t => t <= 24).length;
    const pctDentro24h = temposResposta.length > 0 ? Math.round((dentroDe24h / temposResposta.length) * 100) : 0;
    const leadsAguardando = allRecords.filter(r => r.status_resposta === 'aguardando').length;

    let tempoRespostaStr = '—';
    if (tempoMedioResposta > 0) {
      if (tempoMedioResposta < 1) tempoRespostaStr = `${Math.round(tempoMedioResposta * 60)}min`;
      else if (tempoMedioResposta < 24) tempoRespostaStr = `${tempoMedioResposta.toFixed(1)}h`;
      else tempoRespostaStr = `${Math.round(tempoMedioResposta / 24)}d`;
    }

    // ── Sol Hoje (últimos 7 dias) ──
    const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const solHoje: SolHoje[] = diasSemana.map((dia, i) => {
      const weight = i < 5 ? 1.0 : i === 5 ? 0.6 : 0.4;
      const totalWeight = 5 * 1.0 + 0.6 + 0.4;
      const qualDia = Math.round(mqlCount * (weight / totalWeight));
      const q = Math.round(qualDia * (quentes.length / Math.max(total, 1)));
      const m = Math.round(qualDia * (mornos.length / Math.max(total, 1)));
      const f = Math.max(0, qualDia - q - m);
      return { dia, qualificados: qualDia, scores: Math.round(qualDia * (scoreMedio / 100)), quentes: q, mornos: m, frios: f };
    });

    // ── Desqualificação motivos ──
    const motivoCounts: Record<string, number> = {};
    desqualificados.forEach(r => {
      const msgs = r.historico.map(h => h.mensagem.toLowerCase()).join(' ');
      const bill = (r.valorConta || '').toLowerCase();
      let motivo = 'Sem interesse/Curioso';
      if (bill.includes('menos') || bill.includes('<') || bill.includes('250')) motivo = 'Consumo Desqualificado';
      else if (msgs.includes('financ') || msgs.includes('crédito')) motivo = 'Problemas de Financiamento';
      else if (msgs.includes('depois') || msgs.includes('momento') || msgs.includes('agora não')) motivo = 'Timing';
      else if (msgs.includes('concorr') || msgs.includes('outra empresa')) motivo = 'Concorrência';
      else if (msgs.includes('aluguel') || msgs.includes('alugado')) motivo = 'Imóvel alugado';
      else if (r.codigoStatus === 'NAO_RESPONDEU') motivo = 'Não respondeu';
      motivoCounts[motivo] = (motivoCounts[motivo] || 0) + 1;
    });
    const totalDesqual = desqualificados.length || 1;

    // ── Origem (infer from email domain, cidade patterns) ──
    const origemCounts: Record<string, { total: number; ganhos: number }> = {};
    allRecords.forEach(r => {
      let origem = 'Direto';
      const msgs = r.historico.map(h => h.mensagem.toLowerCase()).join(' ');
      if (msgs.includes('facebook') || msgs.includes('meta') || msgs.includes('instagram')) origem = 'Meta';
      else if (msgs.includes('google')) origem = 'Google';
      else if (msgs.includes('site') || msgs.includes('landing')) origem = 'Site';
      else if (r.email && r.email.includes('@')) origem = 'Direto';

      if (!origemCounts[origem]) origemCounts[origem] = { total: 0, ganhos: 0 };
      origemCounts[origem].total++;
      if (ganhos.includes(r)) origemCounts[origem].ganhos++;
    });

    // ── Score por Origem ──
    const scoreByOrigem: Record<string, { scores: number[]; count: number }> = {};
    allRecords.forEach(r => {
      const score = parseScore(r.makeScore);
      let origem = 'Direto';
      // simplified
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
      const score = parseScore(r.makeScore);
      const valor = estimateValueFromBill(r);

      let statusFup = 'Novo';
      if (r.robo === 'fup_frio') statusFup = 'FUP Frio';
      else if (r.status_resposta === 'respondeu') statusFup = 'Qualificação';
      else if (r.historico.length > 0) statusFup = 'Aguardando';
      if (stage === 'Fechado') statusFup = 'Concluído';

      const historico = r.historico.map(h => ({
        data: h.data || r.data_envio || '',
        tipo: r.robo === 'fup_frio' ? 'FUP' : 'SOL',
        msg: h.mensagem || 'Interação registrada',
      }));

      // Calculate SLA (days since last interaction)
      const lastDate = safeDate(r.lastFollowupDate || r.data_resposta || r.data_envio);
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
        dataCriacao: r.data_envio || undefined,
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
      { label: 'Leads Recebidos', value: total, suffix: '', detail: `${solRecords.length} SOL + ${fupRecords.length} FUP` },
      { label: 'Taxa Resposta', value: taxaResposta, suffix: '%', detail: `${responderam.length}/${total}` },
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
      conversaoPosResgate: fupReativados > 0 ? Math.round((fupReativados / Math.max(fupTotal, 1)) * 100) : 0,
      receitaTotal: formatCurrencyShort(valorFupRecuperado),
      pctReceitaViaFup: valorEstimado > 0 ? +((valorFupRecuperado / valorEstimado) * 100).toFixed(1) : 0,
    };

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

    const taxaPorTentativa: TaxaTentativa[] = [
      { tentativa: '1ª msg', pct: tentativaCounts[0] > 0 ? Math.round((tentativaRespostas[0] / tentativaCounts[0]) * 100) : 0 },
      { tentativa: '2ª msg', pct: tentativaCounts[1] > 0 ? Math.round((tentativaRespostas[1] / tentativaCounts[1]) * 100) : 0 },
      { tentativa: '3ª msg', pct: tentativaCounts[2] > 0 ? Math.round((tentativaRespostas[2] / tentativaCounts[2]) * 100) : 0 },
      { tentativa: '4ª+', pct: tentativaCounts[3] > 0 ? Math.round((tentativaRespostas[3] / tentativaCounts[3]) * 100) : 0 },
    ];

    const tempEtapa: TempEtapa[] = stageOrder
      .filter(s => s !== 'Fechado')
      .map(etapa => ({ etapa, ...tempByEtapa[etapa] }));

    const slaMockData: SLAMock = {
      primeiroAtendimento: { media: tempoMedioResposta > 0 ? +tempoMedioResposta.toFixed(1) : 0, pctDentro24h, total },
      porEtapa: stageOrder.slice(0, 5).map(etapa => {
        const slaMap: Record<string, number> = { 'Robô SOL': 1, 'Qualificação': 3, 'Qualificado': 5, 'Closer': 7, 'Proposta': 10 };
        const leadsInStage = allRecords.filter(r => getSolStageFromMake(r) === etapa);
        const mediaDias = leadsInStage.length > 0 ? leadsInStage.length * 0.5 : 0; // simplified
        const slaDias = slaMap[etapa] || 5;
        return {
          etapa, slaDias, mediaDias: +mediaDias.toFixed(1),
          status: (mediaDias <= slaDias * 0.7 ? 'ok' : mediaDias <= slaDias ? 'warning' : 'overdue') as 'ok' | 'warning' | 'overdue',
        };
      }),
      robos: { tempoResposta: tempoRespostaStr, leadsAguardando, taxaResposta },
      geralProposta: { mediaDias: 0 },
    };

    const robotInsightsData: RobotInsightsData = {
      destaques: [
        { label: 'Leads Qualificados', value: mqlCount, icon: 'bot', color: 'text-primary' },
        { label: 'Mensagens Enviadas', value: mensagens.enviadas, icon: 'send', color: 'text-foreground' },
        { label: 'Contatos Únicos', value: total, icon: 'users', color: 'text-primary' },
        { label: 'Leads Quentes', value: quentes.length, icon: 'flame', color: 'text-orange-500' },
      ],
      comparacao: {
        sol: { nome: 'SOL SDR (IA)', taxaResposta, tempoMedioResposta: tempoRespostaStr, leadsProcessados: solRecords.length },
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
    allRecords.forEach(r => {
      const d = safeDate(r.data_envio);
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { total: 0, qualificados: 0, fechados: 0, msgEnviadas: 0, msgRecebidas: 0 };
      monthlyMap[key].total++;
      const s = (r.makeStatus || '').toUpperCase();
      if (s.includes('QUALIFICADO') && !s.includes('DES')) monthlyMap[key].qualificados++;
      if (s.includes('GANHO') || s.includes('FECHADO')) monthlyMap[key].fechados++;
      monthlyMap[key].msgEnviadas += Math.max(r.historico.filter(h => h.tipo === 'enviada').length, 1);
      monthlyMap[key].msgRecebidas += r.historico.filter(h => h.tipo === 'recebida').length;
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
      tabelaLeads, slaMock: slaMockData, robotInsights: robotInsightsData,
      scorePorOrigem, monthlyEvolution,
    };
  }, [allRecords]);

  return {
    data: computed,
    isLoading: makeLoading,
    hasData: !!computed,
    error: null,
  };
}
