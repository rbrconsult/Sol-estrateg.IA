/**
 * Unified lead classification utilities.
 * Works with SolLead type from useSolData.
 */

import type { SolLead } from '@/hooks/useSolData';

export const STATUS_LABELS: Record<string, string> = {
  TRAFEGO_PAGO: 'Leads Recebidos',
  EM_QUALIFICACAO: 'Em Qualificação',
  FOLLOW_UP: 'Follow Up',
  QUALIFICADO: 'Qualificados',
  GANHO: 'Ganho',
  PERDIDO: 'Perdido',
  DESQUALIFICADO: 'Desqualificado',
  CONTRATO: 'Contrato',
};

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status.replace(/_/g, ' ');
}

export function getLeadStage(record: {
  etapa_funil?: string | null;
  status?: string | null;
}): string {
  const status = (record.status || '').toUpperCase().trim();
  if (status === 'QUALIFICADO') return 'Qualificado';
  if (status === 'DESQUALIFICADO') return 'Desqualificado';
  if (status === 'GANHO' || status === 'CONTRATO') return 'Fechado';
  if (status === 'EM_QUALIFICACAO') return 'Qualificação';
  if (status === 'FOLLOW_UP') return 'Follow Up';
  if (status === 'TRAFEGO_PAGO') return 'Robô SOL';
  if (status === 'PERDIDO') return 'Perdido';
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
