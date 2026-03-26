import { ComercialRecord, mapStatusProposta } from '@/hooks/useMakeComercialData';
import { MakeRecord, normalizePhone, buildMakeMap } from '@/hooks/useMakeDataStore';

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
  // Campos da Sol (colunas Q-Y)
  solQualificado: boolean;
  solScore: number;
  temperatura: 'QUENTE' | 'MORNO' | 'FRIO' | '';
  dataQualificacaoSol: string;
  notaCompleta: string;
  tempoNaEtapa: number;
  solSdr: boolean;
  tempoSolSdr: number;
  etiquetas: string;
  // Campos derivados para compatibilidade
  origemLead: string;
  probabilidade: number;
  motivoPerda: string;
  // Campos enriquecidos do Make Data Store
  makeStatus?: string;
  makeTemperatura?: string;
  makeScore?: string;
  makeRobo?: string;
  makeStatusResposta?: string;
  makeTotalMensagens?: number;
  makeMensagensRecebidas?: number;
  makeRespondeu?: boolean;
  makeDataResposta?: string;
  makeHistorico?: { tipo: string; mensagem: string; data: string }[];
  makeCidade?: string;
  makeValorConta?: string;
  makeEmail?: string;
  makeImovel?: string;
  makeNome?: string;
  makeSentimento?: string;
  makeInteresse?: string;
  makeUltimaMensagem?: string;
}

// Etapas reais da planilha SOL Insights
export const etapasReais = [
  'TRAFEGO PAGO',
  'PROSPECÇÃO',
  'FOLLOW UP',
  'QUALIFICAÇÃO',
  'QUALIFICADO',
  'CONTATO REALIZADO',
  'PROPOSTA',
  'NEGOCIAÇÃO',
  'CONTRATO ASSINADO',
];

// Etapas do Pipeline Pipedrive-style
export const etapasPipeline = [
  'Prospecção',
  'Diagnóstico',
  'Proposta Enviada',
  'Negociação',
  'Aprovação Financeira',
  'Fechamento'
];

/** Etapas que indicam status "Ganho" (pós-venda) */
const GANHO_ETAPAS = [
  'CONTRATO ASSINADO', 'COBRANÇA', 'COBRANCA', 'ANÁLISE DOCUMENTOS', 'ANALISE DOCUMENTOS',
  'APROVAÇÃO DE FINANCIAMENTO', 'APROVACAO DE FINANCIAMENTO',
  'ELABORAÇÃO DE CONTRATO', 'ELABORACAO DE CONTRATO',
  'CONTRATO ENVIADO', 'AGUARDANDO DOCUMENTOS',
];

/** Etapas que indicam status "Perdido" */
const PERDIDO_ETAPAS = ['PERDIDO', 'DECLÍNIO', 'DECLINIO', 'CANCELADO'];

// Mapeia status da planilha — agora usa etapa_sm como fonte primária
function mapStatus(statusProposta: string, etapaSM?: string): 'Aberto' | 'Ganho' | 'Perdido' {
  const etapaUpper = (etapaSM || '').toUpperCase().trim();
  
  // Prioridade 1: classificar por etapa_sm
  if (GANHO_ETAPAS.includes(etapaUpper)) return 'Ganho';
  if (PERDIDO_ETAPAS.includes(etapaUpper)) return 'Perdido';
  
  // Prioridade 2: classificar por status_proposta textual
  const normalized = (statusProposta || '').toLowerCase().trim();
  if (normalized === 'ganho' || normalized.includes('ganho') || normalized.includes('fechado') || normalized.includes('vencido')) return 'Ganho';
  if (normalized === 'perdido' || normalized.includes('perdido') || normalized.includes('cancelado')) return 'Perdido';
  
  return 'Aberto';
}

function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  const trimmed = dateStr.trim();
  
  // Try different date formats
  const formats = [
    /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
    /(\d{4})-(\d{2})-(\d{2})/,   // YYYY-MM-DD
    /(\d{2})-(\d{2})-(\d{4})/,   // DD-MM-YYYY
  ];
  
  for (const fmt of formats) {
    const match = trimmed.match(fmt);
    if (match) {
      if (fmt === formats[0] || fmt === formats[2]) {
        return `${match[3]}-${match[2]}-${match[1]}`;
      }
      // YYYY-MM-DD: return only the date part (strip time if present)
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }
  
  // Try parsing as Date object (handles ISO strings, timestamps, etc.)
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  
  return null;
}

// Calcula tempo na etapa baseado na última atualização
function calcularTempoNaEtapa(ultimaAtualizacao: string): number {
  if (!ultimaAtualizacao) return 0;
  const dataUltima = new Date(ultimaAtualizacao);
  const hoje = new Date();
  const diffMs = hoje.getTime() - dataUltima.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

// Probabilidade dinâmica baseada na etapa do funil
const PROBABILIDADE_POR_ETAPA: Record<string, number> = {
  'TRAFEGO PAGO': 5,
  'PROSPECÇÃO': 10,
  'FOLLOW UP': 10,
  'QUALIFICAÇÃO': 15,
  'QUALIFICADO': 15,
  'CONTATO REALIZADO': 25,
  'PROPOSTA': 40,
  'NEGOCIAÇÃO': 70,
  'CONTRATO ASSINADO': 100,
  'COBRANÇA': 90,
  'ANÁLISE DOCUMENTOS': 95,
  'ANALISE DOCUMENTOS': 95,
  'APROVAÇÃO DE FINANCIAMENTO': 92,
  'APROVACAO DE FINANCIAMENTO': 92,
  'ELABORAÇÃO DE CONTRATO': 88,
  'ELABORACAO DE CONTRATO': 88,
  'CONTRATO ENVIADO': 85,
  'AGUARDANDO DOCUMENTOS': 80,
};

function calcularProbabilidadePorEtapa(etapa: string, status: string): number {
  if (status === 'Ganho') return 100;
  if (status === 'Perdido') return 0;
  const etapaUp = (etapa || '').toUpperCase().trim();
  return PROBABILIDADE_POR_ETAPA[etapaUp] ?? 50;
}

export function adaptComercialData(records: ComercialRecord[]): Proposal[] {
  return records.map((item, index) => {
    const status = mapStatus(item.statusProposta, item.etapaSM);
    const etapa = item.etapaSM?.trim() || 'TRAFEGO PAGO';
    const ultimaAtualizacao = parseDate(item.tsProposta) || new Date().toISOString().split('T')[0];
    const tempoNaEtapa = calcularTempoNaEtapa(ultimaAtualizacao);
    const etiquetas = (item.etiquetas || '').trim();

    // Probabilidade derivada de etapa + status
    let probabilidade = calcularProbabilidadePorEtapa(etapa, status);

    return {
      id: item.projetoId || `PROP-${String(index).padStart(4, '0')}`,
      etapa,
      projetoId: item.projetoId || `PROJ-${String(index).padStart(4, '0')}`,
      nomeCliente: item.nomeProposta || 'Cliente Desconhecido',
      clienteTelefone: item.telefone || '',
      clienteEmail: '',
      status,
      responsavel: item.responsavel || '',
      responsavelId: item.responsavelId || '',
      representante: item.representante || '',
      valorProposta: item.valorProposta || 0,
      potenciaSistema: item.potenciaSistema || 0,
      nomeProposta: item.nomeProposta || 'Proposta',
      dataCriacaoProjeto: parseDate(item.tsProposta) || '',
      dataCriacaoProposta: parseDate(item.tsProposta) || '',
      slaProposta: 48,
      ultimaAtualizacao,
      solQualificado: false,
      solScore: 0,
      temperatura: '' as Proposal['temperatura'],
      dataQualificacaoSol: '',
      notaCompleta: '',
      tempoNaEtapa,
      solSdr: false,
      tempoSolSdr: 0,
      etiquetas,
      origemLead: etiquetas,
      probabilidade,
      motivoPerda: '',
    };
  });
}

/** @deprecated Use adaptComercialData instead */
export function adaptSheetData(sheetData: any[]): Proposal[] {
  return adaptComercialData(sheetData.map((item: any) => {
    const statusProposta = String(item.status || '');
    const faseSM = String(item.fase_sm || '');
    return {
      projetoId: item.projeto_id || '',
      telefone: item.cliente_telefone || '',
      etapaSM: item.etapa || '',
      faseSM,
      responsavel: item.responsavel || '',
      responsavelId: '',
      representante: item.representante || '',
      etiquetas: item.etiquetas || '',
      nomeProposta: item.nome_cliente || item.nome_proposta || '',
      valorProposta: item.valor_proposta || 0,
      potenciaSistema: parseFloat(item.potencia_sistema) || 0,
      tsProposta: item.data_criacao_proposta || item.data_criacao_projeto || '',
      statusProposta,
      status: mapStatusProposta(statusProposta, faseSM),
      tsSync: '',
    };
  }));
}

export function extractVendedores(proposals: Proposal[]): string[] {
  const vendedoresSet = new Set(proposals.map(p => p.representante).filter(Boolean));
  return Array.from(vendedoresSet).sort();
}

export function extractPreVendedores(proposals: Proposal[]): string[] {
  const preVendedoresSet = new Set(proposals.map(p => p.responsavel).filter(Boolean));
  return Array.from(preVendedoresSet).sort();
}

export function extractOrigens(proposals: Proposal[]): string[] {
  const origensSet = new Set(proposals.map(p => p.origemLead).filter(Boolean));
  return Array.from(origensSet).sort();
}

// Funções de cálculo usando dados reais
export function getKPIs(proposals: Proposal[]) {
  const totalNegocios = proposals.length;
  const ganhos = proposals.filter(p => p.status === 'Ganho');
  const perdidos = proposals.filter(p => p.status === 'Perdido');
  const abertos = proposals.filter(p => p.status === 'Aberto');
  
  // Soma total de valores e potência
  const valorPipeline = proposals.reduce((acc, p) => acc + p.valorProposta, 0);
  const valorGanho = ganhos.reduce((acc, p) => acc + p.valorProposta, 0);
  const valorPerdido = perdidos.reduce((acc, p) => acc + p.valorProposta, 0);
  const potenciaTotal = proposals.reduce((acc, p) => acc + p.potenciaSistema, 0);
  
  // Taxa de Conversão = Ganhos / Total
  const taxaConversao = totalNegocios > 0 ? (ganhos.length / totalNegocios) * 100 : 0;
  
  // Ticket Médio = Soma Valor Propostas / Quantidade Propostas
  const ticketMedio = totalNegocios > 0 ? valorPipeline / totalNegocios : 0;
  
  // Ciclo de Proposta = Diferença entre Data Proposta (M) e Data Projeto (L)
  const ciclos: number[] = [];
  
  for (const p of proposals) {
    if (!p.dataCriacaoProjeto || !p.dataCriacaoProposta || 
        p.dataCriacaoProjeto.trim() === '' || p.dataCriacaoProposta.trim() === '') {
      continue;
    }
    
    if (p.dataCriacaoProjeto === p.dataCriacaoProposta) {
      continue;
    }
    
    try {
      const dataL = new Date(p.dataCriacaoProjeto);
      const dataM = new Date(p.dataCriacaoProposta);
      
      if (isNaN(dataL.getTime()) || isNaN(dataM.getTime())) {
        continue;
      }
      
      const diffMs = dataM.getTime() - dataL.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        ciclos.push(diffDays);
      }
    } catch {
      continue;
    }
  }
  
  const cicloProposta = ciclos.length > 0 
    ? Math.round(ciclos.reduce((a, b) => a + b, 0) / ciclos.length) 
    : 0;

  // Forecast (Receita Prevista) = Soma(Valor * Probabilidade) para negócios abertos
  const receitaPrevista = abertos.reduce((acc, p) => acc + (p.valorProposta * p.probabilidade / 100), 0);
  const potenciaPrevista = abertos.reduce((acc, p) => acc + (p.potenciaSistema * p.probabilidade / 100), 0);
  
  return {
    totalNegocios,
    negociosAbertos: abertos.length,
    negociosGanhos: ganhos.length,
    negociosPerdidos: perdidos.length,
    valorPipeline,
    valorGanho,
    valorPerdido,
    potenciaTotal,
    taxaConversao,
    ticketMedio,
    cicloProposta,
    receitaPrevista,
    potenciaPrevista
  };
}

// Funil de Status (Ciclo de Vida)
export function getStatusFunnelData(proposals: Proposal[]) {
  const abertos = proposals.filter(p => p.status === 'Aberto');
  const ganhos = proposals.filter(p => p.status === 'Ganho');
  const perdidos = proposals.filter(p => p.status === 'Perdido');
  
  return [
    {
      status: 'Aberto',
      quantidade: abertos.length,
      valor: abertos.reduce((acc, p) => acc + p.valorProposta, 0),
      percentual: proposals.length > 0 ? (abertos.length / proposals.length) * 100 : 0
    },
    {
      status: 'Ganho',
      quantidade: ganhos.length,
      valor: ganhos.reduce((acc, p) => acc + p.valorProposta, 0),
      percentual: proposals.length > 0 ? (ganhos.length / proposals.length) * 100 : 0
    },
    {
      status: 'Perdido',
      quantidade: perdidos.length,
      valor: perdidos.reduce((acc, p) => acc + p.valorProposta, 0),
      percentual: proposals.length > 0 ? (perdidos.length / proposals.length) * 100 : 0
    }
  ];
}

export function getFunnelData(proposals: Proposal[]) {
  const etapasUnicos = [...new Set(proposals.map(p => p.etapa))];
  const valorTotal = proposals.reduce((acc, p) => acc + p.valorProposta, 0);
  
  return etapasUnicos.map((etapa) => {
    const etapaProposals = proposals.filter(p => p.etapa === etapa);
    const valor = etapaProposals.reduce((acc, p) => acc + p.valorProposta, 0);
    
    return {
      etapa,
      quantidade: etapaProposals.length,
      valor,
      taxaConversao: valorTotal > 0 ? (valor / valorTotal) * 100 : 0
    };
  }).sort((a, b) => b.quantidade - a.quantidade);
}

export function getVendedorPerformance(proposals: Proposal[]) {
  const CLOSERS_OLIMPIA = new Set(['Vitoria Coelho', 'Danieli Nicasso', 'DANIELI NICASSO', 'Devisson Apolinário', 'Gabriel Ferrari', 'Vinicius Selane']);
  const getVendedor = (p: Proposal) => {
    const v = p.representante || p.responsavel || '';
    return CLOSERS_OLIMPIA.has(v) ? v : '';
  };
  
  const vendedoresUnicos = [...new Set(proposals.map(getVendedor).filter(Boolean))];
  
  return vendedoresUnicos.map(vendedor => {
    const vendedorProposals = proposals.filter(p => getVendedor(p) === vendedor);
    const ganhos = vendedorProposals.filter(p => p.status === 'Ganho');
    const perdidos = vendedorProposals.filter(p => p.status === 'Perdido');
    const abertos = vendedorProposals.filter(p => p.status === 'Aberto');
    
    const valorGanho = ganhos.reduce((acc, p) => acc + p.valorProposta, 0);
    const valorPerdido = perdidos.reduce((acc, p) => acc + p.valorProposta, 0);
    const valorAberto = abertos.reduce((acc, p) => acc + p.valorProposta, 0);
    const valorTotal = vendedorProposals.reduce((acc, p) => acc + p.valorProposta, 0);
    const totalFollowUps = 0;
    
    // Calcular tempo médio de resposta (speed-to-lead) usando dataQualificacaoSol
    const temposResposta: number[] = [];
    for (const p of vendedorProposals) {
      if (p.dataCriacaoProjeto && p.dataQualificacaoSol) {
        const dataProj = new Date(p.dataCriacaoProjeto);
        const dataContato = new Date(p.dataQualificacaoSol);
        if (!isNaN(dataProj.getTime()) && !isNaN(dataContato.getTime())) {
          const diff = Math.max(0, Math.ceil((dataContato.getTime() - dataProj.getTime()) / (1000 * 60 * 60 * 24)));
          temposResposta.push(diff);
        }
      }
    }
    const tempoMedioResposta = temposResposta.length > 0 
      ? Math.round(temposResposta.reduce((a, b) => a + b, 0) / temposResposta.length) 
      : 0;
    
    return {
      nome: vendedor,
      totalPropostas: vendedorProposals.length,
      ganhos: ganhos.length,
      perdidos: perdidos.length,
      abertos: abertos.length,
      valorTotal,
      valorGanho,
      valorPerdido,
      valorAberto,
      taxaConversao: vendedorProposals.length > 0 
        ? (ganhos.length / vendedorProposals.length) * 100 
        : 0,
      atividades: vendedorProposals.length,
      totalFollowUps,
      tempoMedioResposta,
      ticketMedio: vendedorProposals.length > 0 ? valorTotal / vendedorProposals.length : 0
    };
  }).sort((a, b) => b.valorTotal - a.valorTotal);
}

export function getPreVendedorPerformance(proposals: Proposal[]) {
  const preVendedoresUnicos = [...new Set(proposals.map(p => p.responsavel).filter(Boolean))];
  
  return preVendedoresUnicos.map(rep => {
    const repProposals = proposals.filter(p => p.responsavel === rep);
    const ganhos = repProposals.filter(p => p.status === 'Ganho');
    const valorTotal = repProposals.reduce((acc, p) => acc + p.valorProposta, 0);
    
    return {
      nome: rep,
      leadsTrabalhos: repProposals.length,
      convertidos: ganhos.length,
      valorTotal,
      taxaConversao: repProposals.length > 0 
        ? (ganhos.length / repProposals.length) * 100 
        : 0,
      atividades: repProposals.length
    };
  }).sort((a, b) => b.valorTotal - a.valorTotal);
}

// Função para funil de potência (kWh)
export function getPowerFunnelData(proposals: Proposal[]) {
  const etapasUnicos = [...new Set(proposals.map(p => p.etapa))];
  const potenciaTotal = proposals.reduce((acc, p) => acc + p.potenciaSistema, 0);
  
  return etapasUnicos.map((etapa) => {
    const etapaProposals = proposals.filter(p => p.etapa === etapa);
    const potencia = etapaProposals.reduce((acc, p) => acc + p.potenciaSistema, 0);
    
    return {
      etapa,
      quantidade: etapaProposals.length,
      potencia,
      taxaConversao: potenciaTotal > 0 ? (potencia / potenciaTotal) * 100 : 0
    };
  }).sort((a, b) => b.quantidade - a.quantidade);
}

export function getMonthlyData(proposals: Proposal[]) {
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  
  return months.map((mes, index) => {
    const monthProposals = proposals.filter(p => {
      const date = new Date(p.dataCriacaoProjeto);
      return date.getMonth() === index;
    });
    
    const ganhos = monthProposals.filter(p => p.status === 'Ganho');
    
    return {
      mes,
      iniciados: monthProposals.length,
      valorFechado: ganhos.reduce((acc, p) => acc + p.valorProposta, 0),
      taxaConversao: monthProposals.length > 0 
        ? (ganhos.length / monthProposals.length) * 100 
        : 0
    };
  });
}

// ============ NOVAS FUNÇÕES PARA CRM PIPEDRIVE-STYLE ============

// Forecast - Previsão de receita
export function getForecastData(proposals: Proposal[]) {
  const abertos = proposals.filter(p => p.status === 'Aberto');
  const ganhos = proposals.filter(p => p.status === 'Ganho');
  
  // Previsão 30 dias (alta confiança: prob >= 70%)
  const forecast30 = abertos
    .filter(p => p.probabilidade >= 70)
    .reduce((acc, p) => acc + (p.valorProposta * p.probabilidade / 100), 0);
  
  // Previsão 60 dias (média + alta: prob >= 40%)
  const forecast60 = abertos
    .filter(p => p.probabilidade >= 40)
    .reduce((acc, p) => acc + (p.valorProposta * p.probabilidade / 100), 0);
  
  // Previsão 90 dias (todo pipeline aberto)
  const forecast90 = abertos
    .reduce((acc, p) => acc + (p.valorProposta * p.probabilidade / 100), 0);
  
  // Potência prevista
  const potencia30 = abertos
    .filter(p => p.probabilidade >= 70)
    .reduce((acc, p) => acc + (p.potenciaSistema * p.probabilidade / 100), 0);
  
  const potencia60 = abertos
    .filter(p => p.probabilidade >= 40)
    .reduce((acc, p) => acc + (p.potenciaSistema * p.probabilidade / 100), 0);
  
  const potencia90 = abertos
    .reduce((acc, p) => acc + (p.potenciaSistema * p.probabilidade / 100), 0);
  
  // Propostas de alta probabilidade (>= 70%)
  const altaProbabilidade = abertos.filter(p => p.probabilidade >= 70);
  
  // Propostas em risco (< 30% ou tempo na etapa > 30 dias)
  const emRisco = abertos.filter(p => p.probabilidade < 30 || p.tempoNaEtapa > 30);
  
  // Distribuição por probabilidade
  const distribuicao = [
    { faixa: '0-25%', quantidade: abertos.filter(p => p.probabilidade <= 25).length, valor: abertos.filter(p => p.probabilidade <= 25).reduce((a, p) => a + p.valorProposta, 0) },
    { faixa: '26-50%', quantidade: abertos.filter(p => p.probabilidade > 25 && p.probabilidade <= 50).length, valor: abertos.filter(p => p.probabilidade > 25 && p.probabilidade <= 50).reduce((a, p) => a + p.valorProposta, 0) },
    { faixa: '51-75%', quantidade: abertos.filter(p => p.probabilidade > 50 && p.probabilidade <= 75).length, valor: abertos.filter(p => p.probabilidade > 50 && p.probabilidade <= 75).reduce((a, p) => a + p.valorProposta, 0) },
    { faixa: '76-100%', quantidade: abertos.filter(p => p.probabilidade > 75).length, valor: abertos.filter(p => p.probabilidade > 75).reduce((a, p) => a + p.valorProposta, 0) }
  ];

  // === Contratos (Ganhos) ===
  const receitaConfirmada = ganhos.reduce((acc, p) => acc + p.valorProposta, 0);
  const potenciaConfirmada = ganhos.reduce((acc, p) => acc + p.potenciaSistema, 0);
  const totalContratos = ganhos.length;
  const ticketMedioContrato = totalContratos > 0 ? receitaConfirmada / totalContratos : 0;

  // Distribuição por etapa (para visão detalhada)
  const etapaMap = new Map<string, { count: number; valor: number; potencia: number; prob: number }>();
  abertos.forEach(p => {
    const etapa = p.etapa || 'SEM ETAPA';
    const curr = etapaMap.get(etapa) || { count: 0, valor: 0, potencia: 0, prob: 0 };
    curr.count++;
    curr.valor += p.valorProposta;
    curr.potencia += p.potenciaSistema;
    curr.prob += p.probabilidade;
    etapaMap.set(etapa, curr);
  });
  const distribuicaoPorEtapa = Array.from(etapaMap.entries()).map(([etapa, d]) => ({
    etapa,
    quantidade: d.count,
    valor: d.valor,
    valorPonderado: d.valor * (d.prob / d.count) / 100,
    potencia: d.potencia,
    probabilidadeMedia: Math.round(d.prob / d.count),
  })).sort((a, b) => b.probabilidadeMedia - a.probabilidadeMedia);
  
  return {
    forecast30,
    forecast60,
    forecast90,
    potencia30,
    potencia60,
    potencia90,
    altaProbabilidade,
    emRisco,
    distribuicao,
    pipelinePonderado: forecast90,
    // Novos campos: Contratos
    receitaConfirmada,
    potenciaConfirmada,
    totalContratos,
    ticketMedioContrato,
    totalPropostasAbertas: abertos.length,
    distribuicaoPorEtapa,
  };
}

// Atividades e Follow-ups
export function getAtividadesData(proposals: Proposal[]) {
  const hoje = new Date();
  const abertos = proposals.filter(p => p.status === 'Aberto');
  
  // Leads sem atualização há mais de 3 dias
  const leadsSemContato = abertos.filter(p => {
    const dataContato = new Date(p.ultimaAtualizacao);
    const diffDias = Math.floor((hoje.getTime() - dataContato.getTime()) / (1000 * 60 * 60 * 24));
    return diffDias > 3;
  });
  
  // Leads com SLA alto (tempo na etapa > 7 dias)
  const followUpsAtrasados = abertos.filter(p => p.tempoNaEtapa > 7);
  
  // Negócios parados
  const semProximaAtividade = abertos.filter(p => p.tempoNaEtapa > 14);
  
  // Speed-to-Lead (tempo entre criação do projeto e qualificação Sol)
  const temposSpeedToLead: number[] = [];
  for (const p of proposals) {
    if (p.dataCriacaoProjeto && p.dataQualificacaoSol) {
      const dataProj = new Date(p.dataCriacaoProjeto);
      const dataContato = new Date(p.dataQualificacaoSol);
      if (!isNaN(dataProj.getTime()) && !isNaN(dataContato.getTime())) {
        const diff = Math.max(0, Math.ceil((dataContato.getTime() - dataProj.getTime()) / (1000 * 60 * 60 * 24)));
        temposSpeedToLead.push(diff);
      }
    }
  }
  const speedToLead = temposSpeedToLead.length > 0 
    ? Math.round(temposSpeedToLead.reduce((a, b) => a + b, 0) / temposSpeedToLead.length) 
    : 0;
  
  // Atividades do dia - leads com SLA crítico
  const atividadesDoDia = abertos.filter(p => p.tempoNaEtapa > 5 && p.tempoNaEtapa <= 10);
  
  return {
    atividadesDoDia,
    followUpsAtrasados,
    leadsSemContato,
    semProximaAtividade,
    speedToLead,
    totalFollowUps: 0
  };
}

// Análise de Perdas
export function getPerdasData(proposals: Proposal[]) {
  const perdidos = proposals.filter(p => p.status === 'Perdido');
  
  // Agrupar por motivo de perda
  const motivosMap = new Map<string, { quantidade: number; valor: number }>();
  for (const p of perdidos) {
    const motivo = p.motivoPerda || 'Não informado';
    const atual = motivosMap.get(motivo) || { quantidade: 0, valor: 0 };
    motivosMap.set(motivo, {
      quantidade: atual.quantidade + 1,
      valor: atual.valor + p.valorProposta
    });
  }
  const porMotivo = Array.from(motivosMap.entries())
    .map(([motivo, dados]) => ({ motivo, ...dados }))
    .sort((a, b) => b.quantidade - a.quantidade);
  
  // Agrupar por etapa
  const etapasMap = new Map<string, { quantidade: number; valor: number }>();
  for (const p of perdidos) {
    const atual = etapasMap.get(p.etapa) || { quantidade: 0, valor: 0 };
    etapasMap.set(p.etapa, {
      quantidade: atual.quantidade + 1,
      valor: atual.valor + p.valorProposta
    });
  }
  const porEtapa = Array.from(etapasMap.entries())
    .map(([etapa, dados]) => ({ etapa, ...dados }))
    .sort((a, b) => b.quantidade - a.quantidade);
  
  // Agrupar por vendedor
  const vendedoresMap = new Map<string, { quantidade: number; valor: number }>();
  for (const p of perdidos) {
    const vendedor = p.representante || p.responsavel || 'Não atribuído';
    const atual = vendedoresMap.get(vendedor) || { quantidade: 0, valor: 0 };
    vendedoresMap.set(vendedor, {
      quantidade: atual.quantidade + 1,
      valor: atual.valor + p.valorProposta
    });
  }
  const porVendedor = Array.from(vendedoresMap.entries())
    .map(([vendedor, dados]) => ({ vendedor, ...dados }))
    .sort((a, b) => b.quantidade - a.quantidade);
  
  // Agrupar por origem
  const origensMap = new Map<string, { quantidade: number; valor: number }>();
  for (const p of perdidos) {
    const origem = p.origemLead || 'Não informado';
    const atual = origensMap.get(origem) || { quantidade: 0, valor: 0 };
    origensMap.set(origem, {
      quantidade: atual.quantidade + 1,
      valor: atual.valor + p.valorProposta
    });
  }
  const porOrigem = Array.from(origensMap.entries())
    .map(([origem, dados]) => ({ origem, ...dados }))
    .sort((a, b) => b.quantidade - a.quantidade);
  
  return {
    totalPerdidos: perdidos.length,
    valorTotalPerdido: perdidos.reduce((acc, p) => acc + p.valorProposta, 0),
    porMotivo,
    porEtapa,
    porVendedor,
    porOrigem,
    principalMotivo: porMotivo[0]?.motivo || 'N/A',
    etapaQueMaisPerde: porEtapa[0]?.etapa || 'N/A'
  };
}

// Análise de Origem dos Leads
export function getOrigensData(proposals: Proposal[]) {
  const origensMap = new Map<string, Proposal[]>();
  
  for (const p of proposals) {
    const origem = p.origemLead || 'Não informado';
    const atual = origensMap.get(origem) || [];
    origensMap.set(origem, [...atual, p]);
  }
  
  return Array.from(origensMap.entries()).map(([origem, props]) => {
    const ganhos = props.filter(p => p.status === 'Ganho');
    const valorTotal = props.reduce((acc, p) => acc + p.valorProposta, 0);
    const valorGanho = ganhos.reduce((acc, p) => acc + p.valorProposta, 0);
    
    // Calcular tempo médio até fechamento
    const temposFechamento: number[] = [];
    for (const p of ganhos) {
      if (p.dataCriacaoProjeto && p.dataCriacaoProposta) {
        const dataProj = new Date(p.dataCriacaoProjeto);
        const dataProp = new Date(p.dataCriacaoProposta);
        if (!isNaN(dataProj.getTime()) && !isNaN(dataProp.getTime())) {
          const diff = Math.max(0, Math.ceil((dataProp.getTime() - dataProj.getTime()) / (1000 * 60 * 60 * 24)));
          temposFechamento.push(diff);
        }
      }
    }
    const tempoMedioFechamento = temposFechamento.length > 0 
      ? Math.round(temposFechamento.reduce((a, b) => a + b, 0) / temposFechamento.length) 
      : 0;
    
    return {
      origem,
      totalLeads: props.length,
      ganhos: ganhos.length,
      taxaConversao: props.length > 0 ? (ganhos.length / props.length) * 100 : 0,
      valorTotal,
      valorGanho,
      ticketMedio: props.length > 0 ? valorTotal / props.length : 0,
      tempoMedioFechamento
    };
  }).sort((a, b) => b.totalLeads - a.totalLeads);
}

// Heatmap de gargalos (tempo por etapa)
export function getGargalosData(proposals: Proposal[]) {
  const etapasMap = new Map<string, number[]>();
  
  for (const p of proposals) {
    const tempos = etapasMap.get(p.etapa) || [];
    tempos.push(p.tempoNaEtapa);
    etapasMap.set(p.etapa, tempos);
  }
  
  return Array.from(etapasMap.entries()).map(([etapa, tempos]) => {
    const tempoMedio = tempos.length > 0 
      ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length) 
      : 0;
    const tempoMax = Math.max(...tempos, 0);
    
    return {
      etapa,
      tempoMedio,
      tempoMax,
      quantidade: tempos.length,
      // Intensidade para heatmap (0-100)
      intensidade: Math.min(100, tempoMedio * 3)
    };
  }).sort((a, b) => b.tempoMedio - a.tempoMedio);
}

// Conversão por etapa
export function getConversaoPorEtapa(proposals: Proposal[]) {
  const etapasMap = new Map<string, { total: number; ganhos: number }>();
  
  for (const p of proposals) {
    const atual = etapasMap.get(p.etapa) || { total: 0, ganhos: 0 };
    etapasMap.set(p.etapa, {
      total: atual.total + 1,
      ganhos: atual.ganhos + (p.status === 'Ganho' ? 1 : 0)
    });
  }
  
  return Array.from(etapasMap.entries()).map(([etapa, dados]) => ({
    etapa,
    total: dados.total,
    ganhos: dados.ganhos,
    taxaConversao: dados.total > 0 ? (dados.ganhos / dados.total) * 100 : 0
  })).sort((a, b) => b.taxaConversao - a.taxaConversao);
}

// ============ FUNÇÕES DE ANÁLISE DE LEADS ============

export function getLeadsKPIs(proposals: Proposal[]) {
  const total = proposals.length;
  const qualificados = proposals.filter(p => p.solQualificado).length;
  const abertos = proposals.filter(p => p.status === 'Aberto');
  const naoQualificados = abertos.filter(p => !p.solQualificado).length;
  const taxaQualificacao = total > 0 ? (qualificados / total) * 100 : 0;
  const quentes = proposals.filter(p => p.temperatura === 'QUENTE').length;
  const mornos = proposals.filter(p => p.temperatura === 'MORNO').length;
  const frios = proposals.filter(p => p.temperatura === 'FRIO').length;
  const scores = proposals.filter(p => p.solScore > 0).map(p => p.solScore);
  const scoreMedio = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  
  return { total, qualificados, naoQualificados, taxaQualificacao, quentes, mornos, frios, scoreMedio };
}

export function getLeadsByEtiqueta(proposals: Proposal[]) {
  const map = new Map<string, { quantidade: number; valor: number; qualificados: number }>();
  for (const p of proposals) {
    const tags = p.etiquetas ? p.etiquetas.split(',').map(t => t.trim()).filter(Boolean) : ['Sem etiqueta'];
    for (const tag of tags) {
      const atual = map.get(tag) || { quantidade: 0, valor: 0, qualificados: 0 };
      map.set(tag, {
        quantidade: atual.quantidade + 1,
        valor: atual.valor + p.valorProposta,
        qualificados: atual.qualificados + (p.solQualificado ? 1 : 0),
      });
    }
  }
  return Array.from(map.entries()).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.quantidade - a.quantidade);
}

export function getLeadsByEtapa(proposals: Proposal[]) {
  const map = new Map<string, number>();
  for (const p of proposals) {
    map.set(p.etapa, (map.get(p.etapa) || 0) + 1);
  }
  return Array.from(map.entries()).map(([etapa, quantidade]) => ({ etapa, quantidade })).sort((a, b) => b.quantidade - a.quantidade);
}

export function getTempoQualificacao(proposals: Proposal[]) {
  const tempos: number[] = [];
  for (const p of proposals) {
    if (p.dataCriacaoProjeto && p.dataQualificacaoSol) {
      const d1 = new Date(p.dataCriacaoProjeto);
      const d2 = new Date(p.dataQualificacaoSol);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        const diff = Math.max(0, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
        if (diff <= 365) tempos.push(diff);
      }
    }
  }
  const media = tempos.length > 0 ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length) : 0;
  const mediana = tempos.length > 0 ? tempos.sort((a, b) => a - b)[Math.floor(tempos.length / 2)] : 0;
  const min = tempos.length > 0 ? Math.min(...tempos) : 0;
  const max = tempos.length > 0 ? Math.max(...tempos) : 0;
  return { media, mediana, min, max, totalComDados: tempos.length };
}

export function getTemperaturaPorEtapa(proposals: Proposal[]) {
  const map = new Map<string, { quente: number; morno: number; frio: number; sem: number }>();
  for (const p of proposals) {
    const atual = map.get(p.etapa) || { quente: 0, morno: 0, frio: 0, sem: 0 };
    if (p.temperatura === 'QUENTE') atual.quente++;
    else if (p.temperatura === 'MORNO') atual.morno++;
    else if (p.temperatura === 'FRIO') atual.frio++;
    else atual.sem++;
    map.set(p.etapa, atual);
  }
  return Array.from(map.entries()).map(([etapa, d]) => ({ etapa, ...d }));
}

export function getSolPerformance(proposals: Proposal[]) {
  const qualificados = proposals.filter(p => p.solQualificado);
  const scores = qualificados.filter(p => p.solScore > 0).map(p => p.solScore);
  const scoreMedio = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const quentes = qualificados.filter(p => p.temperatura === 'QUENTE').length;
  const percentQuentes = qualificados.length > 0 ? (quentes / qualificados.length) * 100 : 0;
  
  // Conversão Sol -> Proposta
  const etapasAvancadas = ['PROPOSTA', 'NEGOCIAÇÃO', 'NEGOCIACAO'];
  const solParaProposta = qualificados.filter(p => etapasAvancadas.some(e => p.etapa.toUpperCase().includes(e)));
  const conversaoSolProposta = qualificados.length > 0 ? (solParaProposta.length / qualificados.length) * 100 : 0;
  
  // Conversão Sol -> Fechamento
  const ganhos = qualificados.filter(p => p.status === 'Ganho');
  const conversaoSolFechamento = qualificados.length > 0 ? (ganhos.length / qualificados.length) * 100 : 0;

  return { totalQualificados: qualificados.length, scoreMedio, percentQuentes, conversaoSolProposta, conversaoSolFechamento, valorQualificados: qualificados.reduce((a, p) => a + p.valorProposta, 0) };
}

export function getScorePorOrigem(proposals: Proposal[]) {
  const map = new Map<string, { scores: number[]; quantidade: number }>();
  for (const p of proposals) {
    const tags = p.etiquetas ? p.etiquetas.split(',').map(t => t.trim()).filter(Boolean) : ['Sem etiqueta'];
    for (const tag of tags) {
      const atual = map.get(tag) || { scores: [], quantidade: 0 };
      if (p.solScore > 0) atual.scores.push(p.solScore);
      atual.quantidade++;
      map.set(tag, atual);
    }
  }
  return Array.from(map.entries()).map(([origem, d]) => ({
    origem,
    scoreMedio: d.scores.length > 0 ? d.scores.reduce((a, b) => a + b, 0) / d.scores.length : 0,
    quantidade: d.quantidade
  })).sort((a, b) => b.scoreMedio - a.scoreMedio);
}

export function getSolSDRMetrics(proposals: Proposal[]) {
  const passouSdr = proposals.filter(p => p.solSdr);
  const tempos = passouSdr.filter(p => p.tempoSolSdr > 0).map(p => p.tempoSolSdr);
  const tempoMedio = tempos.length > 0 ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length) : 0;
  const taxaPassagem = proposals.length > 0 ? (passouSdr.length / proposals.length) * 100 : 0;
  return { total: passouSdr.length, tempoMedio, taxaPassagem };
}

export function getLeadsQuentesAbandonados(proposals: Proposal[], thresholdDias = 7) {
  return proposals.filter(p => 
    p.temperatura === 'QUENTE' && 
    p.status === 'Aberto' && 
    p.tempoNaEtapa > thresholdDias
  );
}

export function getROIPorOrigem(proposals: Proposal[]) {
  const map = new Map<string, { total: number; ganhos: number; valor: number; scores: number[] }>();
  for (const p of proposals) {
    const tags = p.etiquetas ? p.etiquetas.split(',').map(t => t.trim()).filter(Boolean) : ['Sem etiqueta'];
    for (const tag of tags) {
      const atual = map.get(tag) || { total: 0, ganhos: 0, valor: 0, scores: [] };
      atual.total++;
      if (p.status === 'Ganho') atual.ganhos++;
      atual.valor += p.valorProposta;
      if (p.solScore > 0) atual.scores.push(p.solScore);
      map.set(tag, atual);
    }
  }
  return Array.from(map.entries()).map(([origem, d]) => ({
    origem,
    totalLeads: d.total,
    ganhos: d.ganhos,
    taxaConversao: d.total > 0 ? (d.ganhos / d.total) * 100 : 0,
    valorTotal: d.valor,
    scoreMedio: d.scores.length > 0 ? d.scores.reduce((a, b) => a + b, 0) / d.scores.length : 0,
    ticketMedio: d.total > 0 ? d.valor / d.total : 0,
  })).sort((a, b) => b.valorTotal - a.valorTotal);
}

// ============ ENRIQUECIMENTO COM MAKE DATA STORE ============

/**
 * Enriquece propostas do CRM com dados do Make Data Store (cross 360°).
 * Matching por telefone normalizado.
 */
export function enrichProposalsWithMake(proposals: Proposal[], makeRecords: MakeRecord[]): Proposal[] {
  if (!makeRecords || makeRecords.length === 0) return proposals;
  
  const makeMap = buildMakeMap(makeRecords);
  
  return proposals.map(p => {
    const phone = normalizePhone(p.clienteTelefone);
    if (!phone) return p;
    
    const matches = makeMap.get(phone);
    if (!matches || matches.length === 0) return p;
    
    // Use the most recent match (by data_envio)
    const sorted = [...matches].sort((a, b) => {
      const da = new Date(a.data_envio || 0).getTime();
      const db = new Date(b.data_envio || 0).getTime();
      return db - da;
    });
    const primary = sorted[0];
    
    // Aggregate across all matches
    const totalMensagens = matches.reduce((sum, m) => sum + (m.historico?.length || 0), 0);
    const mensagensRecebidas = matches.reduce((sum, m) => 
      sum + (m.historico?.filter(h => h.tipo === 'recebida').length || 0), 0);
    const respondeu = matches.some(m => m.status_resposta === 'respondeu');
    
    // Enrichment: fallback CRM fields with Make data
    let temperatura = p.temperatura;
    if (!temperatura && primary.makeTemperatura) {
      const mt = primary.makeTemperatura.toUpperCase();
      if (['QUENTE', 'MORNO', 'FRIO'].includes(mt)) {
        temperatura = mt as Proposal['temperatura'];
      }
    }
    
    let solScore = p.solScore;
    if (solScore === 0 && primary.makeScore) {
      const parsed = parseFloat(primary.makeScore);
      if (!isNaN(parsed)) solScore = parsed;
    }
    
    // MQL/SQL enrichment: Make status QUALIFICADO or WHATSAPP = qualified
    let solQualificado = p.solQualificado;
    if (!solQualificado && primary.makeStatus) {
      const ms = primary.makeStatus.toUpperCase();
      if (ms === 'QUALIFICADO' || ms === 'WHATSAPP') {
        solQualificado = true;
      }
    }
    
    // Recalculate probability with enriched data
    let probabilidade = p.probabilidade;
    if (p.status === 'Aberto') {
      if (solScore > 0 && solScore !== p.solScore) {
        probabilidade = Math.min(100, solScore * 10);
      }
      if (temperatura === 'QUENTE') probabilidade = Math.max(probabilidade, 70);
      else if (temperatura === 'FRIO') probabilidade = Math.min(probabilidade, 30);
      if (respondeu) probabilidade = Math.max(probabilidade, 60);
    }
    
    // Flatten all historico from all matches
    const allHistorico = matches.flatMap(m => m.historico || []);
    
    return {
      ...p,
      temperatura,
      solScore,
      solQualificado,
      probabilidade,
      makeStatus: primary.makeStatus,
      makeTemperatura: primary.makeTemperatura,
      makeScore: primary.makeScore,
      makeRobo: primary.robo,
      makeStatusResposta: primary.status_resposta,
      makeTotalMensagens: totalMensagens,
      makeMensagensRecebidas: mensagensRecebidas,
      makeRespondeu: respondeu,
      makeDataResposta: primary.data_resposta,
      makeHistorico: allHistorico,
      makeCidade: primary.cidade,
      makeValorConta: primary.valorConta,
      makeEmail: primary.email,
      makeImovel: primary.imovel,
      makeNome: primary.nome,
    };
  });
}
