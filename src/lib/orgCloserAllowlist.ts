import type { Proposal } from "@/data/dataAdapter";

/** Chave em `organization_configs` — JSON array de strings (IDs SM do closer em `sol_propostas`). */
export const COMMERCIAL_CLOSER_SM_IDS_CONFIG_KEY = "comercial_closer_sm_ids";

/**
 * Legado: mapa por slug até todas as filiais terem `comercial_closer_sm_ids` no banco.
 */
export const ORG_CLOSER_SM_IDS: Record<string, readonly string[]> = {
  "evolve-olimpia": ["19422", "4938", "17170", "23012", "3766", "19015"],
};

const setCache = new Map<string, Set<string>>();

/** Chave em `ORG_CLOSER_SM_IDS` a partir do slug da org (hífen ou underscore). */
function resolveAllowlistKey(slug: string): string | null {
  const t = slug.trim();
  if (!t) return null;
  if (ORG_CLOSER_SM_IDS[t]) return t;
  const hyphenated = t.replace(/_/g, "-");
  if (ORG_CLOSER_SM_IDS[hyphenated]) return hyphenated;
  const underscored = t.replace(/-/g, "_");
  if (ORG_CLOSER_SM_IDS[underscored]) return underscored;
  return null;
}

/** Conjunto permitido só a partir do legado em código (por slug). */
export function legacyCloserAllowSetForSlug(slug: string | null | undefined): Set<string> | null {
  if (!slug?.trim()) return null;
  const key = resolveAllowlistKey(slug);
  if (!key) return null;
  const ids = ORG_CLOSER_SM_IDS[key];
  if (!ids?.length) return null;
  if (!setCache.has(key)) {
    setCache.set(key, new Set(ids.map((x) => String(x).trim())));
  }
  return setCache.get(key) ?? null;
}

export function normalizeCloserSmId(id: string | undefined | null): string {
  return String(id ?? "").trim();
}

/**
 * `null` = não filtrar por closer (só franquia / RLS).
 * `Set` vazio = nenhum responsável autorizado → nenhuma proposta.
 */
export function filterProposalsByAllowedCloserIds(
  proposals: Proposal[],
  allowedIds: Set<string> | null,
): Proposal[] {
  if (allowedIds === null) return proposals;
  return proposals.filter((p) => {
    const id = normalizeCloserSmId(p.responsavelId);
    return id !== "" && allowedIds.has(id);
  });
}

export function closerAllowlistCount(allowedIds: Set<string> | null): number {
  return allowedIds?.size ?? 0;
}

export function hasCloserAllowlist(allowedIds: Set<string> | null): boolean {
  return allowedIds !== null;
}
