/**
 * Unified lead classification utilities.
 * A2: getLeadStage — single source of truth for lead classification.
 * C3: getLeadOrigin — always use canal_origem.
 * M2: safeAvgScore — NaN-safe score calculation.
 * L1: STATUS_LABELS — official label map for sol_leads_sync statuses.
 */

import type { MakeRecord } from '@/hooks/useMakeDataStore';

/**
 * L1 — Official status → label map.
 * Used across all pages that display funnel stages.
 */
export const STATUS_LABELS: Record<string, string> = {
  TRAFEGO_PAGO: 'Leads Recebidos',
  EM_QUALIFICACAO: 'MQL',
  FOLLOW_UP: 'Follow Up',
  QUALIFICADO: 'SQL',
  GANHO: 'Ganho',
  PERDIDO: 'Perdido',
  DESQUALIFICADO: 'Desqualificado',
  CONTRATO: 'Contrato',
};

/** Get the display label for a sol_leads_sync status */
export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status.replace(/_/g, ' ');
}

/**
 * A2 — Unified lead stage classification.
 * Priority: etapaSm > makeStatus > etapaFunil
 */
export function getLeadStage(record: {
  etapaSm?: string;
  makeStatus?: string;
  etapaFunil?: string;
  status_resposta?: string;
}): string {
  const etapaSm = (record.etapaSm || '').toUpperCase().trim();
  if (etapaSm) {
    if (etapaSm.includes('CONTRATO') || etapaSm.includes('ASSINADO') || etapaSm.includes('COBRANÇA') || etapaSm.includes('GANHO')) return 'Fechado';
    if (etapaSm.includes('PROPOSTA') || etapaSm.includes('NEGOCI')) return 'Proposta';
    if (etapaSm.includes('AGEND') || etapaSm.includes('CONTATO') || etapaSm.includes('CLOSER')) return 'Closer';
    if (etapaSm.includes('QUALIFICADO')) return 'Qualificado';
  }

  const status = (record.makeStatus || '').toUpperCase().trim();
  if (status === 'QUALIFICADO') return 'Qualificado';
  if (status === 'DESQUALIFICADO') return 'Desqualificado';
  if (status.includes('GANHO') || status.includes('FECHADO') || status.includes('VENDA')) return 'Fechado';
  if (status.includes('PROPOSTA') || status.includes('NEGOCI')) return 'Proposta';
  if (status.includes('CONTATO') || status.includes('AGEND')) return 'Closer';

  const etapa = (record.etapaFunil || '').toUpperCase().trim();
  if (etapa === 'QUALIFICADO' || etapa === 'QUALIFICAÇÃO') return 'Qualificação';
  if (etapa === 'FOLLOW UP') return 'Qualificação';
  if (etapa === 'SOL SDR' || etapa === 'TRAFEGO PAGO' || etapa === 'PROSPECÇÃO') return 'Robô SOL';

  if (record.status_resposta === 'respondeu') return 'Qualificação';

  return 'Robô SOL';
}

/**
 * C3 — Get lead origin exclusively from canal_origem field.
 * If empty → "Direto / Não identificado"
 */
export function getLeadOrigin(record: { canalOrigem?: string }): string {
  const canal = (record.canalOrigem || '').trim();
  if (!canal) return 'Direto / Não identificado';

  // Normalize common values
  const lower = canal.toLowerCase();
  if (lower === 'meta_ads' || lower.includes('facebook') || lower.includes('instagram') || lower.includes('meta')) return 'Meta Ads';
  if (lower === 'google_ads' || lower.includes('google')) return 'Google Ads';
  if (lower === 'site' || lower.includes('landing') || lower.includes('site')) return 'Site';
  if (lower === 'whatsapp' || lower.includes('whatsapp')) return 'WhatsApp';
  if (lower === 'indicação' || lower.includes('indicacao') || lower.includes('indicação')) return 'Indicação';

  return canal; // Return raw value if no normalization match
}

/**
 * M2 — Safe average score computation (no NaN).
 */
export function safeAvgScore(records: { makeScore?: string }[]): number {
  const scores = records
    .filter(r => r.makeScore && parseFloat(r.makeScore) > 0)
    .map(r => parseFloat(r.makeScore!));
  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
}
