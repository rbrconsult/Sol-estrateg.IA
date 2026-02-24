import { Proposal as SheetProposal } from '@/hooks/useGoogleSheetsData';

export interface Proposal {
  id: string;
  etapa: string;
  projetoId: string;
  nomeCliente: string;
  clienteTelefone: string;
  clienteEmail: string;
  status: 'Aberto' | 'Ganho' | 'Perdido';
  responsavel: string;
  representante: string;
  valorProposta: number;
  potenciaSistema: number;
  nomeProposta: string;
  dataCriacaoProjeto: string;
  dataCriacaoProposta: string;
  slaProposta: number;
  ultimaAtualizacao: string;
  // Novos campos (aguardando dados no Google Sheets)
  origemLead: string;
  dataPrimeiroContato: string;
  dataUltimoContato: string;
  numeroFollowUps: number;
  proximaAtividade: string;
  probabilidade: number;
  motivoPerda: string;
  tempoNaEtapa: number;
  desconto: number;
}

// Etapas reais da planilha SOL Insights
export const etapasReais = [
  'TRAFEGO PAGO',
  'PROSPECÇÃO',
  'QUALIFICAÇÃO',
  'QUALIFICADO',
  'CONTATO REALIZADO',
  'PROPOSTA',
  'NEGOCIAÇÃO'
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

// Mapeia status da planilha (Coluna F: aberto, perdido, ganho)
function mapStatus(status: string): 'Aberto' | 'Ganho' | 'Perdido' {
  const normalized = status?.toLowerCase().trim() || '';
  
  if (normalized === 'ganho' || normalized.includes('ganho') || normalized.includes('fechado') || normalized.includes('vencido')) {
    return 'Ganho';
  }
  if (normalized === 'perdido' || normalized.includes('perdido') || normalized.includes('cancelado')) {
    return 'Perdido';
  }
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
  
  for (const format of formats) {
    const match = trimmed.match(format);
    if (match) {
      if (format === formats[0] || format === formats[2]) {
        return `${match[3]}-${match[2]}-${match[1]}`;
      }
      return trimmed;
    }
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

export function adaptSheetData(sheetData: SheetProposal[]): Proposal[] {
  return sheetData.map((item, index) => {
    const status = mapStatus(item.status);
    const etapa = item.etapa?.trim() || 'TRAFEGO PAGO';
    const ultimaAtualizacao = parseDate(item.ultima_atualizacao) || new Date().toISOString().split('T')[0];
    
    return {
      id: item.projeto_id || `PROP-${String(index).padStart(4, '0')}`,
      etapa,
      projetoId: item.projeto_id || `PROJ-${String(index).padStart(4, '0')}`,
      nomeCliente: item.nome_cliente || 'Cliente Desconhecido',
      clienteTelefone: item.cliente_telefone || '',
      clienteEmail: item.cliente_email || '',
      status,
      responsavel: item.responsavel || '',
      representante: item.representante || '',
      valorProposta: item.valor_proposta || 0,
      potenciaSistema: parseFloat(item.potencia_sistema) || 0,
      nomeProposta: item.nome_proposta || 'Proposta',
      dataCriacaoProjeto: parseDate(item.data_criacao_projeto) || '',
      dataCriacaoProposta: parseDate(item.data_criacao_proposta) || '',
      slaProposta: parseInt(item.sla_proposta) || 48,
      ultimaAtualizacao,
      // Novos campos - usando dados da planilha se existirem, senão valores padrão
      origemLead: (item as any).origem_lead || '',
      dataPrimeiroContato: parseDate((item as any).data_primeiro_contato) || '',
      dataUltimoContato: parseDate((item as any).data_ultimo_contato) || ultimaAtualizacao,
      numeroFollowUps: parseInt((item as any).numero_followups) || 0,
      proximaAtividade: (item as any).proxima_atividade || '',
      probabilidade: parseInt((item as any).probabilidade) || (status === 'Ganho' ? 100 : status === 'Perdido' ? 0 : 50),
      motivoPerda: status === 'Perdido' ? ((item as any).motivo_perda || 'Não informado') : '',
      tempoNaEtapa: parseInt((item as any).tempo_na_etapa) || calcularTempoNaEtapa(ultimaAtualizacao),
      desconto: parseFloat((item as any).desconto) || 0
    };
  });
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
  const getVendedor = (p: Proposal) => p.representante || p.responsavel || '';
  
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
    const totalFollowUps = vendedorProposals.reduce((acc, p) => acc + p.numeroFollowUps, 0);
    
    // Calcular tempo médio de resposta (speed-to-lead)
    const temposResposta: number[] = [];
    for (const p of vendedorProposals) {
      if (p.dataCriacaoProjeto && p.dataPrimeiroContato) {
        const dataProj = new Date(p.dataCriacaoProjeto);
        const dataContato = new Date(p.dataPrimeiroContato);
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
  const hoje = new Date();
  const abertos = proposals.filter(p => p.status === 'Aberto');
  
  // Previsão 30 dias
  const forecast30 = abertos
    .filter(p => p.probabilidade >= 70)
    .reduce((acc, p) => acc + (p.valorProposta * p.probabilidade / 100), 0);
  
  // Previsão 60 dias
  const forecast60 = abertos
    .filter(p => p.probabilidade >= 40)
    .reduce((acc, p) => acc + (p.valorProposta * p.probabilidade / 100), 0);
  
  // Previsão 90 dias
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
    pipelinePonderado: forecast90
  };
}

// Atividades e Follow-ups
export function getAtividadesData(proposals: Proposal[]) {
  const hoje = new Date();
  const abertos = proposals.filter(p => p.status === 'Aberto');
  
  // Leads sem contato há mais de 3 dias
  const leadsSemContato = abertos.filter(p => {
    if (!p.dataUltimoContato) return true;
    const dataContato = new Date(p.dataUltimoContato);
    const diffDias = Math.floor((hoje.getTime() - dataContato.getTime()) / (1000 * 60 * 60 * 24));
    return diffDias > 3;
  });
  
  // Follow-ups atrasados (com próxima atividade no passado)
  const followUpsAtrasados = abertos.filter(p => {
    if (!p.proximaAtividade) return false;
    const dataAtividade = new Date(p.proximaAtividade);
    return dataAtividade < hoje;
  });
  
  // Negócios sem próxima atividade
  const semProximaAtividade = abertos.filter(p => !p.proximaAtividade);
  
  // Speed-to-Lead (tempo entre criação do projeto e primeiro contato)
  const temposSpeedToLead: number[] = [];
  for (const p of proposals) {
    if (p.dataCriacaoProjeto && p.dataPrimeiroContato) {
      const dataProj = new Date(p.dataCriacaoProjeto);
      const dataContato = new Date(p.dataPrimeiroContato);
      if (!isNaN(dataProj.getTime()) && !isNaN(dataContato.getTime())) {
        const diff = Math.max(0, Math.ceil((dataContato.getTime() - dataProj.getTime()) / (1000 * 60 * 60 * 24)));
        temposSpeedToLead.push(diff);
      }
    }
  }
  const speedToLead = temposSpeedToLead.length > 0 
    ? Math.round(temposSpeedToLead.reduce((a, b) => a + b, 0) / temposSpeedToLead.length) 
    : 0;
  
  // Atividades do dia (próximas atividades para hoje)
  const atividadesDoDia = abertos.filter(p => {
    if (!p.proximaAtividade) return false;
    const dataAtividade = new Date(p.proximaAtividade);
    return dataAtividade.toDateString() === hoje.toDateString();
  });
  
  return {
    atividadesDoDia,
    followUpsAtrasados,
    leadsSemContato,
    semProximaAtividade,
    speedToLead,
    totalFollowUps: proposals.reduce((acc, p) => acc + p.numeroFollowUps, 0)
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
