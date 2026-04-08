import type { SolProjeto } from "@/hooks/useSolData";

/**
 * Status comerciais válidos de projeto (SM / operação).
 * No código, usamos chaves estáveis no singular; rótulos de UI = plural onde fizer sentido.
 */
export const PROJETO_STATUS_KEYS = ["Aberto", "Ganho", "Perdido", "Excluido"] as const;

export type ProjetoStatus = (typeof PROJETO_STATUS_KEYS)[number];

/** Rótulos alinhados ao vocabulário do projeto (Aberto, Ganhos, Perdidos, Excluídos). */
export const PROJETO_STATUS_LABEL: Record<ProjetoStatus, string> = {
  Aberto: "Aberto",
  Ganho: "Ganhos",
  Perdido: "Perdidos",
  Excluido: "Excluidos",
};

export function projetoStatusLabel(status: ProjetoStatus): string {
  return PROJETO_STATUS_LABEL[status];
}

/** Valores explícitos aceitos em `status` / `status_projeto` (Make ou SM). */
function matchExplicitStatus(raw: string | null | undefined): ProjetoStatus | null {
  const s = (raw || "").trim().toUpperCase();
  if (!s) return null;
  if (s === "EXCLUIDO" || s === "EXCLUIDOS" || s === "EXCLUÍDO" || s === "EXCLUÍDOS") return "Excluido";
  if (s === "PERDIDO" || s === "PERDIDOS" || s === "PERDA") return "Perdido";
  if (s === "GANHO" || s === "GANHOS" || s === "VENDA") return "Ganho";
  if (s === "ABERTO" || s === "ABERTOS") return "Aberto";
  return null;
}

/**
 * Deriva o status normalizado a partir da linha de projeto (evento + campos SM).
 * Ordem: Excluídos → Perdidos → Ganhos → Aberto (evita classificar perda como ganho).
 * Não usa substring genérica "FECH" (ambígua entre vitória e outros textos).
 */
export function mapProjetoRowToStatus(row: SolProjeto): ProjetoStatus {
  const direct =
    matchExplicitStatus(row.status_projeto) ||
    matchExplicitStatus(row.evento) ||
    matchExplicitStatus(row.proposta_ativa != null ? String(row.proposta_ativa) : null);
  if (direct) return direct;

  const su = `${row.status_projeto || ""} ${row.evento || ""} ${row.proposta_ativa != null ? String(row.proposta_ativa) : ""}`.toUpperCase();

  if (su.includes("EXCLU") || su.includes("EXCLUÍ")) return "Excluido";
  if (
    su.includes("PERD") ||
    su.includes("LOST") ||
    su.includes("DESCART") ||
    su.includes("DECL") ||
    su.includes("PERDA")
  ) {
    return "Perdido";
  }
  if (
    su.includes("GANH") ||
    su.includes("WON") ||
    su.includes("VENDA") ||
    su.includes("ASSIN") ||
    su.includes("ACEIT") ||
    su.includes("NEGOCIO GANHO") ||
    su.includes("NEGÓCIO GANHO")
  ) {
    return "Ganho";
  }

  /**
   * Fallback: sem sinal explícito de ganho/perda/exclusão na sync → Aberto.
   * Isso infla “abertos” vs o que a diretoria chama de oportunidade na mesa; ver `isOportunidadeNaMesaDiretoria`.
   */
  return "Aberto";
}

/** Status vindo de `sol_leads_sync.status` (pré-venda / legado). */
export function mapLeadStatusToProjetoStatus(status: string | null | undefined): ProjetoStatus {
  const direct = matchExplicitStatus(status);
  if (direct) return direct;
  const s = (status || "").toUpperCase();
  if (s.includes("EXCLU")) return "Excluido";
  if (s.includes("PERD")) return "Perdido";
  if (s.includes("GANH") || s.includes("VENDA")) return "Ganho";
  return "Aberto";
}

export function isProjetoGanho(s: ProjetoStatus): boolean {
  return s === "Ganho";
}

export function isProjetoPerdidoOuExcluido(s: ProjetoStatus): boolean {
  return s === "Perdido" || s === "Excluido";
}
