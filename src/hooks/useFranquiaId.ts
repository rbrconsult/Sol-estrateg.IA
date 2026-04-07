import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgFilter } from "@/contexts/OrgFilterContext";

/**
 * Slug da organização selecionada = chave de filtro nas tabelas `sol_*_sync` (campo `franquia_id`).
 * Pré-requisito no banco: `organizations.slug` preenchido e coerente com o que o sync grava em `franquia_id`.
 */
export function useFranquiaId() {
  const { selectedOrgId } = useOrgFilter();

  const { data: franquiaId = "evolve_olimpia" } = useQuery({
    queryKey: ["franquia-slug", selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return "evolve_olimpia";
      const { data, error } = await supabase
        .from("organizations")
        .select("slug")
        .eq("id", selectedOrgId)
        .single();
      if (error) throw error;
      const slug = data?.slug?.trim();
      if (!slug) {
        console.warn(
          "[useFranquiaId] organizations.slug vazio para org",
          selectedOrgId,
          "— hooks comerciais não consultam até o banco tiver slug alinhado a franquia_id.",
        );
        return "";
      }
      return slug;
    },
    staleTime: 30 * 60 * 1000,
  });

  return franquiaId;
}
