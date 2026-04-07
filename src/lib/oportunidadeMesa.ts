import type { Proposal } from "@/data/dataAdapter";

/**
 * Etapas iniciais do funil: muitas linhas “Abertas” na sync são cadastros ou pré-venda,
 * não necessariamente oportunidade comercial que o CEO contaria como “na mesa”.
 */
const ETAPAS_PRE_COMERCIAL = new Set([
  "TRAFEGO PAGO",
  "SOL SDR",
  "FOLLOW UP",
  "QUALIFICAÇÃO",
]);

/**
 * Etapas em que já há trabalho comercial típico de proposta/fechamento mesmo sem valor preenchido na sync.
 */
const ETAPAS_MESA_COMERCIAL = new Set([
  "CONTATO REALIZADO",
  "QUALIFICADO",
  "PROPOSTA",
  "NEGOCIAÇÃO",
]);

/**
 * Oportunidade “na mesa” para leitura de diretoria: não é o mesmo que `status === Aberto` na sync.
 *
 * Regra:
 * - Aberto na sync **e**
 * - (valor ou potência preenchidos) **ou** etapa já saiu do bloco pré-comercial (qualificado / contato / proposta / negociação).
 *
 * Linhas abertas só em tráfego/SDR/FUP/qualificação **sem** R$ nem kWp **não** entram — evita inflar o pipeline executivo.
 */
export function isOportunidadeNaMesaDiretoria(p: Proposal): boolean {
  if (p.status !== "Aberto") return false;
  const temNumeroComercial = p.valorProposta > 0 || p.potenciaSistema > 0;
  if (temNumeroComercial) return true;
  const e = (p.etapa || "").toUpperCase();
  if (ETAPAS_PRE_COMERCIAL.has(e)) return false;
  if (!e) return false;
  return ETAPAS_MESA_COMERCIAL.has(e);
}

/** Aberto na sync com valor ou potência preenchidos (proxy de proposta/número no SM). */
export function isAbertoComValorOuPotencia(p: Proposal): boolean {
  return p.status === "Aberto" && (p.valorProposta > 0 || p.potenciaSistema > 0);
}
