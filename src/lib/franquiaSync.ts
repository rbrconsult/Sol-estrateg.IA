import type { Proposal } from "@/data/dataAdapter";

/**
 * Variantes de `franquia_id` no BD para um mesmo slug (hífen vs underscore).
 * O alinhamento definitivo é responsabilidade dos dados no banco; aqui só cobrimos spellings comuns na query e no filtro cliente.
 */
export function franquiaColumnValuesForSlug(slug: string): string[] {
  const t = (slug || "").trim();
  if (!t) return [];
  const underscored = t.replace(/-/g, "_");
  const hyphenated = t.replace(/_/g, "-");
  return [...new Set([t, underscored, hyphenated].filter(Boolean))];
}

/**
 * Com filial selecionada, mantém só propostas cujo `franquia_id` da linha bate com o slug da org (ou variantes hífen/_).
 * Camada extra enquanto o BD não estiver 100% consistente.
 */
export function filterProposalsToSelectedFranquia(
  proposals: Proposal[],
  isGlobal: boolean,
  orgSlug: string,
): Proposal[] {
  if (isGlobal) return proposals;
  const allowed = new Set(franquiaColumnValuesForSlug(orgSlug));
  if (allowed.size === 0) return [];
  return proposals.filter((p) => {
    const fid = p.franquiaId;
    return typeof fid === "string" && fid.length > 0 && allowed.has(fid);
  });
}
