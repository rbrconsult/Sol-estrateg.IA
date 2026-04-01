import type { SolLead } from '@/hooks/useSolData';

export interface Proposal {
  id: string;
  etapa: string;
  projetoId: string;
  nomeCliente: string;
  clienteTelefone: string;
  clienteEmail: string;
  status: 'Aberto' | 'Ganho' | 'Perdido';
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

const PROBABILIDADE_POR_STATUS: Record<string, number> = {
  TRAFEGO_PAGO: 5,
  EM_QUALIFICACAO: 15,
  FOLLOW_UP: 10,
  QUALIFICADO: 40,
  GANHO: 100,
  PERDIDO: 0,
  DESQUALIFICADO: 0,
  CONTRATO: 95,
};

function mapStatus(status: string | null): 'Aberto' | 'Ganho' | 'Perdido' {
  const s = (status || '').toUpperCase();
  if (s === 'GANHO' || s === 'CONTRATO') return 'Ganho';
  if (s === 'PERDIDO' || s === 'DESQUALIFICADO') return 'Perdido';
  return 'Aberto';
}

/** Convert SolLead[] to Proposal[] for backward compat with existing pages */
export function solLeadsToProposals(leads: SolLead[]): Proposal[] {
  return leads.map((l, i) => {
    const status = mapStatus(l.status);
    const etapa = l.etapa_funil || l.status || 'TRAFEGO_PAGO';
    const ultimaAtualizacao = parseDate(l.ts_ultima_interacao || l.ts_cadastro || '') || '';
    const tempoNaEtapa = calcularTempoNaEtapa(ultimaAtualizacao);
    const score = l.score ? parseFloat(l.score) : 0;
    const temp = (l.temperatura || '').toUpperCase();
    const temperatura = (['QUENTE', 'MORNO', 'FRIO'].includes(temp) ? temp : '') as Proposal['temperatura'];
    const probabilidade = status === 'Ganho' ? 100 : status === 'Perdido' ? 0 : (PROBABILIDADE_POR_STATUS[l.status || ''] ?? 20);

    return {
      id: l.project_id || l.telefone || `LEAD-${i}`,
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
      solQualificado: l.status === 'QUALIFICADO' || l.transferido_comercial === true,
      solScore: isNaN(score) ? 0 : score,
      temperatura,
      dataQualificacaoSol: parseDate(l.ts_qualificado || '') || '',
      notaCompleta: l.resumo_conversa || '',
      tempoNaEtapa,
      solSdr: l.status === 'EM_QUALIFICACAO' || l.status === 'TRAFEGO_PAGO',
      tempoSolSdr: 0,
      etiquetas: l.canal_origem || '',
      origemLead: l.canal_origem || '',
      probabilidade,
      motivoPerda: l.status === 'DESQUALIFICADO' ? 'Desqualificado' : '',
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

// ── Etapas ──

export const etapasReais = [
  'TRAFEGO_PAGO', 'EM_QUALIFICACAO', 'FOLLOW_UP', 'QUALIFICADO',
  'GANHO', 'PERDIDO', 'DESQUALIFICADO', 'CONTRATO',
];

export const etapasPipeline = [
  'TRAFEGO_PAGO', 'EM_QUALIFICACAO', 'QUALIFICADO', 'GANHO',
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

export function getVendedorPerformance(proposals: Proposal[]) {
  const vendedores = [...new Set(proposals.map(p => p.representante || p.responsavel).filter(Boolean))];
  return vendedores.map(v => {
    const ps = proposals.filter(p => (p.representante || p.responsavel) === v);
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

export function getForecastData(proposals: Proposal[]) {
  const abertos = proposals.filter(p => p.status === 'Aberto');
  const ganhos = proposals.filter(p => p.status === 'Ganho');
  const mkForecast = (minProb: number) => abertos.filter(p => p.probabilidade >= minProb).reduce((a, p) => a + (p.valorProposta * p.probabilidade / 100), 0);
  const receitaConfirmada = ganhos.reduce((a, p) => a + p.valorProposta, 0);
  return {
    forecast7: mkForecast(90), forecast14: mkForecast(70), forecast21: mkForecast(40), forecast28: mkForecast(0),
    potencia7: 0, potencia14: 0, potencia21: 0, potencia28: 0,
    altaProbabilidade: abertos.filter(p => p.probabilidade >= 70),
    emRisco: abertos.filter(p => p.probabilidade < 30 || p.tempoNaEtapa > 30),
    distribuicao: [
      { faixa: '0-25%', quantidade: abertos.filter(p => p.probabilidade <= 25).length, valor: abertos.filter(p => p.probabilidade <= 25).reduce((a, p) => a + p.valorProposta, 0) },
      { faixa: '26-50%', quantidade: abertos.filter(p => p.probabilidade > 25 && p.probabilidade <= 50).length, valor: abertos.filter(p => p.probabilidade > 25 && p.probabilidade <= 50).reduce((a, p) => a + p.valorProposta, 0) },
      { faixa: '51-75%', quantidade: abertos.filter(p => p.probabilidade > 50 && p.probabilidade <= 75).length, valor: abertos.filter(p => p.probabilidade > 50 && p.probabilidade <= 75).reduce((a, p) => a + p.valorProposta, 0) },
      { faixa: '76-100%', quantidade: abertos.filter(p => p.probabilidade > 75).length, valor: abertos.filter(p => p.probabilidade > 75).reduce((a, p) => a + p.valorProposta, 0) },
    ],
    pipelinePonderado: mkForecast(0),
    receitaConfirmada, potenciaConfirmada: 0,
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

export function getPerdasData(proposals: Proposal[]) {
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
  const porVendedor = byKey(p => (p.representante || 'Não atribuído') as string).map(({ key, ...r }) => ({ vendedor: key, ...r }));
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
