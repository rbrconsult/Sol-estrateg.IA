/**
 * Unified lead classification utilities.
 * Works with SolLead type from useSolData.
 * Uses etapa_funil (SM stage names with spaces) for funnel position.
 * Uses status only for ABERTO/GANHO/PERDIDO/EXCLUIDO.
 */

import type { SolLead } from '@/hooks/useSolData';

export const STATUS_LABELS: Record<string, string> = {
  'TRAFEGO PAGO': 'Leads Recebidos',
  'SOL SDR': 'Em Qualificação',
  'FOLLOW UP': 'FUP Frio',
  'QUALIFICADO': 'Qualificados',
  'CONTATO REALIZADO': 'Contato Realizado',
  'PROPOSTA': 'Proposta',
  'NEGOCIAÇÃO': 'Negociação',
  'COBRANÇA': 'Cobrança',
  'DECLÍNIO': 'Declínio',
  'REMARKETING': 'Remarketing',
  'CONTRATO ASSINADO (FN)': 'Contrato',
  // Backward compat for status values
  'GANHO': 'Ganho',
  'PERDIDO': 'Perdido',
};

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status.replace(/_/g, ' ');
}

export function getLeadStage(record: {
  etapa_funil?: string | null;
  status?: string | null;
}): string {
  const etapa = (record.etapa_funil || '').toUpperCase().trim();
  const status = (record.status || '').toUpperCase().trim();

  if (etapa.includes('DECL')) return 'Declínio';
  if (status === 'GANHO') return 'Fechado';
  if (status === 'PERDIDO') return 'Perdido';
  if (etapa === 'SOL SDR') return 'Em Qualificação';
  if (etapa === 'FOLLOW UP') return 'FUP Frio';
  if (etapa === 'TRAFEGO PAGO') return 'Tráfego Pago';
  if (etapa === 'QUALIFICADO') return 'Qualificado';
  if (etapa === 'CONTATO REALIZADO') return 'Contato Realizado';
  if (etapa === 'PROPOSTA') return 'Proposta';
  if (etapa.includes('NEGOCI')) return 'Negociação';
  if (etapa.includes('COBRAN')) return 'Cobrança';
  return 'Robô SOL';
}

export function getLeadOrigin(record: { canal_origem?: string | null }): string {
  const canal = (record.canal_origem || '').trim();
  if (!canal) return 'Direto / Não identificado';
  const lower = canal.toLowerCase();
  if (lower.includes('meta') || lower.includes('facebook') || lower.includes('instagram')) return 'Meta Ads';
  if (lower.includes('google')) return 'Google Ads';
  if (lower.includes('site') || lower.includes('landing')) return 'Site';
  if (lower.includes('whatsapp')) return 'WhatsApp';
  if (lower.includes('indica')) return 'Indicação';
  return canal;
}

export function safeAvgScore(records: { score?: string | null }[]): number {
  const scores = records
    .filter(r => r.score && parseFloat(r.score) > 0)
    .map(r => parseFloat(r.score!));
  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
}
