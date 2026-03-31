import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgFilter } from "@/contexts/OrgFilterContext";

/**
 * Resolves the current org UUID to its slug (franquia_id).
 * Used by all sync-table hooks to filter by franchise.
 */
export function useFranquiaId() {
  const { selectedOrgId } = useOrgFilter();

  const { data: franquiaId = "evolve_olimpia" } = useQuery({
    queryKey: ["franquia-slug", selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return "evolve_olimpia";
      const { data } = await supabase
        .from("organizations")
        .select("slug")
        .eq("id", selectedOrgId)
        .single();
      return data?.slug || "evolve_olimpia";
    },
    staleTime: 30 * 60 * 1000,
  });

  return franquiaId;
}
