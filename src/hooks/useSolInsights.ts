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
  const { selectedOrgId, orgs } = useOrgFilter();
  const selectedOrg = orgs.find(o => o.id === selectedOrgId);
  const franquiaId = (selectedOrg as any)?.slug || "evolve_olimpia";
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["sol-insights", franquiaId],
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
