import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgFilter } from "@/contexts/OrgFilterContext";

export interface SolInsight {
  id: string;
  franquia_id: string;
  robo: string | null;
  tipo: string;
  categoria: string | null;
  titulo: string;
  descricao: string;
  dados: any;
  severidade: string;
  acao_sugerida: string | null;
  visualizado: boolean;
  created_at: string;
  expires_at: string | null;
}

export function useSolInsights() {
  const { selectedOrgId } = useOrgFilter();
  const queryClient = useQueryClient();

  // Get the slug for the org
  const slugQuery = useQuery({
    queryKey: ["org-slug", selectedOrgId],
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

  const franquiaId = slugQuery.data || "evolve_olimpia";

  const query = useQuery({
    queryKey: ["sol-insights", franquiaId],
    enabled: !!slugQuery.data,
    queryFn: async (): Promise<SolInsight[]> => {
      const { data, error } = await supabase
        .from("sol_insights")
        .select("*")
        .eq("franquia_id", franquiaId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as unknown as SolInsight[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sol_insights")
        .update({ visualizado: true } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sol-insights"] });
    },
  });

  return { ...query, markAsRead };
}
