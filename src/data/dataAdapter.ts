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
  motivoPerda?: string;
  numAtividades: number;
}

// Etapas reais da planilha EVOLVE
export const etapasReais = [
  'TRAFEGO PAGO',
  'PROSPECÇÃO',
  'QUALIFICAÇÃO',
  'QUALIFICADO',
  'CONTATO REALIZADO',
  'PROPOSTA',
  'NEGOCIAÇÃO'
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

export function adaptSheetData(sheetData: SheetProposal[]): Proposal[] {
  return sheetData.map((item, index) => {
    const status = mapStatus(item.status);
    const etapa = item.etapa?.trim() || 'TRAFEGO PAGO';
    
    return {
      id: item.projeto_id || `PROP-${String(index).padStart(4, '0')}`,
      etapa,
      projetoId: item.projeto_id || `PROJ-${String(index).padStart(4, '0')}`,
      nomeCliente: item.nome_cliente || 'Cliente Desconhecido',
      clienteTelefone: item.cliente_telefone || '',
      clienteEmail: item.cliente_email || '',
      status,
      responsavel: item.responsavel || '', // pré-vendedor
      representante: item.representante || '', // vendedor
      valorProposta: item.valor_proposta || 0,
      potenciaSistema: parseFloat(item.potencia_sistema) || 0,
      nomeProposta: item.nome_proposta || 'Proposta',
      dataCriacaoProjeto: parseDate(item.data_criacao_projeto) || '',
      dataCriacaoProposta: parseDate(item.data_criacao_proposta) || '',
      slaProposta: parseInt(item.sla_proposta) || 48,
      ultimaAtualizacao: parseDate(item.ultima_atualizacao) || new Date().toISOString().split('T')[0],
      motivoPerda: status === 'Perdido' ? 'Não informado' : undefined,
      numAtividades: 1
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
  // Coluna L = data_criacao_projeto, Coluna M = data_criacao_proposta
  // IMPORTANTE: Ignorar registros com datas vazias, inválidas ou iguais
  const ciclos: number[] = [];
  
  for (const p of proposals) {
    // Verificar se ambas as datas existem e não estão vazias
    if (!p.dataCriacaoProjeto || !p.dataCriacaoProposta || 
        p.dataCriacaoProjeto.trim() === '' || p.dataCriacaoProposta.trim() === '') {
      continue;
    }
    
    // Ignorar se as datas são iguais (ciclo = 0 não é útil)
    if (p.dataCriacaoProjeto === p.dataCriacaoProposta) {
      continue;
    }
    
    try {
      const dataL = new Date(p.dataCriacaoProjeto);
      const dataM = new Date(p.dataCriacaoProposta);
      
      // Verificar se as datas são válidas
      if (isNaN(dataL.getTime()) || isNaN(dataM.getTime())) {
        continue;
      }
      
      const diffMs = dataM.getTime() - dataL.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      // Apenas ciclos positivos (proposta depois do projeto)
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
    cicloProposta
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
  // Agrupa por etapa real da planilha
  const etapasUnicos = [...new Set(proposals.map(p => p.etapa))];
  
  return etapasUnicos.map((etapa) => {
    const etapaProposals = proposals.filter(p => p.etapa === etapa);
    const valor = etapaProposals.reduce((acc, p) => acc + p.valorProposta, 0);
    
    return {
      etapa,
      quantidade: etapaProposals.length,
      valor,
      taxaConversao: proposals.length > 0 ? (etapaProposals.length / proposals.length) * 100 : 0
    };
  }).sort((a, b) => b.quantidade - a.quantidade);
}

export function getVendedorPerformance(proposals: Proposal[]) {
  const vendedoresUnicos = [...new Set(proposals.map(p => p.representante).filter(Boolean))];
  
  return vendedoresUnicos.map(vendedor => {
    const vendedorProposals = proposals.filter(p => p.representante === vendedor);
    const ganhos = vendedorProposals.filter(p => p.status === 'Ganho');
    const perdidos = vendedorProposals.filter(p => p.status === 'Perdido');
    const abertos = vendedorProposals.filter(p => p.status === 'Aberto');
    
    // Calcula VALORES por status (não quantidade)
    const valorGanho = ganhos.reduce((acc, p) => acc + p.valorProposta, 0);
    const valorPerdido = perdidos.reduce((acc, p) => acc + p.valorProposta, 0);
    const valorAberto = abertos.reduce((acc, p) => acc + p.valorProposta, 0);
    const valorTotal = vendedorProposals.reduce((acc, p) => acc + p.valorProposta, 0);
    
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
      atividades: vendedorProposals.length
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
  
  return etapasUnicos.map((etapa) => {
    const etapaProposals = proposals.filter(p => p.etapa === etapa);
    const potencia = etapaProposals.reduce((acc, p) => acc + p.potenciaSistema, 0);
    
    return {
      etapa,
      quantidade: etapaProposals.length,
      potencia,
      taxaConversao: proposals.length > 0 ? (etapaProposals.length / proposals.length) * 100 : 0
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
