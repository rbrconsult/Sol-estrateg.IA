import { useMemo } from "react";
import { useEnrichedProposals, EnrichedData } from "@/hooks/useEnrichedProposals";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

/**
 * Fetches the list of responsável names configured for a given organization.
 * These are stored in organization_configs with config_category = 'responsavel'.
 */
async function fetchOrgResponsaveis(orgId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("organization_configs")
    .select("config_value")
    .eq("organization_id", orgId)
    .eq("config_category", "responsavel");

  if (error) {
    console.error("Error fetching org responsaveis:", error);
    return [];
  }
  return (data || []).map((r) => r.config_value.trim().toLowerCase());
}

/**
 * Hook that wraps useEnrichedProposals and filters proposals by the selected
 * organization's configured responsáveis. Super Admins with "Global" see all.
 */
export function useOrgFilteredProposals(): EnrichedData & { orgFilterActive: boolean } {
  const enriched = useEnrichedProposals();
  const { selectedOrgId, isGlobal } = useOrgFilter();
  const { userRole } = useAuth();
  const isSuperAdmin = userRole === "super_admin";

  const { data: orgResponsaveis } = useQuery({
    queryKey: ["org-responsaveis", selectedOrgId],
    queryFn: () => fetchOrgResponsaveis(selectedOrgId!),
    enabled: !!selectedOrgId && isSuperAdmin,
    staleTime: 1000 * 60 * 5,
  });

  const orgFilterActive = isSuperAdmin && !isGlobal && !!selectedOrgId;

  const filteredProposals = useMemo(() => {
    if (!orgFilterActive || !orgResponsaveis?.length) {
      return enriched.proposals;
    }

    return enriched.proposals.filter((p) => {
      const respId = (p.responsavelId || "").trim();
      // Primary: match by SM numeric ID
      if (respId && orgResponsaveis.includes(respId)) return true;
      // Fallback: match by name (backward compat)
      const rep = (p.representante || "").trim().toLowerCase();
      const resp = (p.responsavel || "").trim().toLowerCase();
      return orgResponsaveis.some(
        (name) => rep.includes(name) || name.includes(rep) || resp.includes(name) || name.includes(resp)
      );
    });
  }, [enriched.proposals, orgResponsaveis, orgFilterActive]);

  return {
    ...enriched,
    proposals: filteredProposals,
    enrichedCount: orgFilterActive
      ? filteredProposals.filter((p) => p.makeStatus || p.makeRobo).length
      : enriched.enrichedCount,
    orgFilterActive,
  };
}
