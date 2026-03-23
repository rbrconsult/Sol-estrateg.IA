import { useMemo } from "react";
import { useEnrichedProposals, EnrichedData } from "@/hooks/useEnrichedProposals";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

/**
 * Fetches the list of active team members (sm_id + nome) from time_comercial
 * for the given organization's slug.
 */
async function fetchTeamResponsaveis(orgId: string): Promise<{ names: string[]; ids: string[] }> {
  // First get org slug
  const { data: orgData } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", orgId)
    .single();

  if (!orgData?.slug) return { names: [], ids: [] };

  const { data, error } = await supabase
    .from("time_comercial" as any)
    .select("nome, sm_id")
    .eq("franquia_id", orgData.slug)
    .eq("ativo", true);

  if (error) {
    console.error("Error fetching team responsaveis:", error);
    return { names: [], ids: [] };
  }

  const names: string[] = [];
  const ids: string[] = [];
  for (const m of (data as any[]) || []) {
    if (m.nome) names.push(String(m.nome).trim().toLowerCase());
    if (m.sm_id) ids.push(String(m.sm_id));
  }
  return { names, ids };
}

/**
 * Hook that wraps useEnrichedProposals and filters proposals by the selected
 * organization's team members from time_comercial. Super Admins with "Global" see all.
 */
export function useOrgFilteredProposals(): EnrichedData & { orgFilterActive: boolean } {
  const enriched = useEnrichedProposals();
  const { selectedOrgId, isGlobal } = useOrgFilter();
  const { userRole } = useAuth();
  const isSuperAdmin = userRole === "super_admin";

  const { data: teamData } = useQuery({
    queryKey: ["team-responsaveis", selectedOrgId],
    queryFn: () => fetchTeamResponsaveis(selectedOrgId!),
    enabled: !!selectedOrgId && isSuperAdmin,
    staleTime: 1000 * 60 * 5,
  });

  const orgFilterActive = isSuperAdmin && !isGlobal && !!selectedOrgId;

  const filteredProposals = useMemo(() => {
    if (!orgFilterActive || !teamData || (teamData.names.length === 0 && teamData.ids.length === 0)) {
      return enriched.proposals;
    }

    return enriched.proposals.filter((p) => {
      const respId = (p.responsavelId || "").trim();
      // Primary: match by SM numeric ID
      if (respId && teamData.ids.includes(respId)) return true;
      // Fallback: match by name
      const rep = (p.representante || "").trim().toLowerCase();
      const resp = (p.responsavel || "").trim().toLowerCase();
      return teamData.names.some(
        (name) => rep.includes(name) || name.includes(rep) || resp.includes(name) || name.includes(resp)
      );
    });
  }, [enriched.proposals, teamData, orgFilterActive]);

  return {
    ...enriched,
    proposals: filteredProposals,
    enrichedCount: orgFilterActive
      ? filteredProposals.filter((p) => p.makeStatus || p.makeRobo).length
      : enriched.enrichedCount,
    orgFilterActive,
  };
}
