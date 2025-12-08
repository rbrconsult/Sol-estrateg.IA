import { Proposal as SheetProposal } from '@/hooks/useGoogleSheetsData';
import { Proposal, etapas, motivosPerda as defaultMotivosPerda, vendedores as defaultVendedores, preVendedores as defaultPreVendedores } from './mockData';

// Mapeia etapas da planilha para as etapas padrão
const etapaMapping: Record<string, string> = {
  'lead': 'Lead',
  'qualificação': 'Qualificação',
  'qualificacao': 'Qualificação',
  'visita': 'Visita Técnica',
  'visita técnica': 'Visita Técnica',
  'proposta': 'Proposta Enviada',
  'proposta enviada': 'Proposta Enviada',
  'negociação': 'Negociação',
  'negociacao': 'Negociação',
  'fechamento': 'Fechamento',
  'ganho': 'Fechamento',
};

// Mapeia status da planilha
const statusMapping: Record<string, 'Aberto' | 'Ganho' | 'Perdido'> = {
  'aberto': 'Aberto',
  'em andamento': 'Aberto',
  'ativo': 'Aberto',
  'ganho': 'Ganho',
  'fechado': 'Ganho',
  'vencido': 'Ganho',
  'perdido': 'Perdido',
  'cancelado': 'Perdido',
};

function normalizeString(str: string): string {
  return str.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function mapEtapa(etapa: string): string {
  const normalized = normalizeString(etapa);
  for (const [key, value] of Object.entries(etapaMapping)) {
    if (normalized.includes(normalizeString(key))) {
      return value;
    }
  }
  return etapas[0]; // Default to first stage
}

function mapStatus(status: string, etapa: string): 'Aberto' | 'Ganho' | 'Perdido' {
  const normalized = normalizeString(status);
  for (const [key, value] of Object.entries(statusMapping)) {
    if (normalized.includes(normalizeString(key))) {
      return value;
    }
  }
  // Infer from etapa if status not recognized
  if (normalizeString(etapa).includes('fechamento') || normalizeString(etapa).includes('ganho')) {
    return 'Ganho';
  }
  return 'Aberto';
}

function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  // Try different date formats
  const formats = [
    /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
    /(\d{4})-(\d{2})-(\d{2})/,   // YYYY-MM-DD
    /(\d{2})-(\d{2})-(\d{4})/,   // DD-MM-YYYY
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0] || format === formats[2]) {
        return `${match[3]}-${match[2]}-${match[1]}`;
      }
      return dateStr;
    }
  }
  
  return new Date().toISOString().split('T')[0];
}

export function adaptSheetData(sheetData: SheetProposal[]): Proposal[] {
  return sheetData.map((item, index) => {
    const status = mapStatus(item.status, item.etapa);
    const etapa = status === 'Ganho' ? 'Fechamento' : mapEtapa(item.etapa);
    
    return {
      id: item.projeto_id || `PROP-${String(index).padStart(4, '0')}`,
      etapa,
      projetoId: item.projeto_id || `PROJ-${String(index).padStart(4, '0')}`,
      nomeCliente: item.nome_cliente || 'Cliente Desconhecido',
      clienteTelefone: item.cliente_telefone || '',
      clienteEmail: item.cliente_email || '',
      status,
      responsavel: item.representante || defaultVendedores[0], // vendedor
      representante: item.responsavel || defaultPreVendedores[0], // pré-vendedor
      valorProposta: item.valor_proposta || 0,
      potenciaSistema: parseFloat(item.potencia_sistema) || 0,
      nomeProposta: item.nome_proposta || 'Proposta',
      dataCriacaoProjeto: parseDate(item.data_criacao_projeto),
      dataCriacaoProposta: parseDate(item.data_criacao_proposta),
      slaProposta: parseInt(item.sla_proposta) || 48,
      ultimaAtualizacao: parseDate(item.ultima_atualizacao),
      motivoPerda: status === 'Perdido' ? defaultMotivosPerda[Math.floor(Math.random() * defaultMotivosPerda.length)] : undefined,
      numAtividades: Math.floor(Math.random() * 10) + 1
    };
  });
}

export function extractVendedores(proposals: Proposal[]): string[] {
  const vendedoresSet = new Set(proposals.map(p => p.responsavel).filter(Boolean));
  return Array.from(vendedoresSet);
}

export function extractPreVendedores(proposals: Proposal[]): string[] {
  const preVendedoresSet = new Set(proposals.map(p => p.representante).filter(Boolean));
  return Array.from(preVendedoresSet);
}
