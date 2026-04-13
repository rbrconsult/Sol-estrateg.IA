import { SolLead } from "@/hooks/useSolData";

export const JOURNEY_ORDER = [
  'TRAFEGO PAGO',
  'SOL SDR',
  'FOLLOW UP',
  'QUALIFICADO',
  'CONTATO REALIZADO',
  'PROPOSTA',
  'NEGOCIAÇÃO',
  'CONTRATO ASSINADO',
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
  const raw = String(str).trim();
  if (!raw) return null;
  // DD/MM/YYYY or DD-MM-YYYY first to avoid US-style misinterpretation
  const br = raw.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (br) {
    const [, dd, mm, yyyy, hh = '00', min = '00', ss = '00'] = br;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min), Number(ss));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(raw);
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
