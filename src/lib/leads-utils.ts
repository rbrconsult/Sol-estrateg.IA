import { SolLead } from "@/hooks/useSolData";

export const JOURNEY_ORDER = [
  'TRAFEGO PAGO',
  'SOL SDR',
  'PROSPECÇÃO',
  'FOLLOW UP',
  'QUALIFICAÇÃO',
  'QUALIFICADO',
  'CONTATO REALIZADO',
  'PROPOSTA',
  'NEGOCIAÇÃO',
  'REMARKETING',
  'DECLÍNIO',
];

export function normalizeTemp(t: string | undefined): string {
  if (!t) return "";
  const upper = t.toUpperCase().trim();
  if (["QUENTE", "MORNO", "FRIO"].includes(upper)) return upper;
  return "";
}

export function normalizeCloser(c: string | undefined): string {
  if (!c) return "";
  return c.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

export function getEtapaLabel(r: SolLead): string {
  return r.etapa_funil?.trim() || "TRAFEGO PAGO";
}

export function safeDate(str: string | undefined): Date | null {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function hoursSince(dateStr: string): number {
  const d = safeDate(dateStr);
  if (!d) return 0;
  return Math.max(0, (Date.now() - d.getTime()) / (1000 * 60 * 60));
}

export function formatMinutes(mins: number): string {
  if (!Number.isFinite(mins) || mins <= 0) return "—";
  if (mins < 1) return "<1 min";
  if (mins < 60) return `${Math.round(mins)} min`;
  const h = Math.floor(mins / 60);
  const r = Math.round(mins % 60);
  return r > 0 ? `${h}h ${r}min` : `${h}h`;
}

export function isLeadQualificadoMql(r: SolLead): boolean {
  const e = (r.etapa_funil || "").toUpperCase().trim();
  const s = (r.status || "").toUpperCase();
  return e === "QUALIFICADO" || (s.includes("QUALIFICADO") && !s.includes("DES") && !s.includes("DES_QUAL"));
}
