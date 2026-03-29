import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgFilter } from "@/contexts/OrgFilterContext";

export interface SolMetrica {
  id: string;
  data: string;
  robo: string;
  franquia_id: string;
  leads_novos: number;
  leads_qualificados: number;
  leads_desqualificados: number;
  total_mensagens: number;
  total_audios: number;
  custo_openai_usd: number;
  custo_elevenlabs_usd: number;
  custo_make_usd: number;
  custo_total_usd: number;
  synced_at: string;
}

export function useSolMetricas(days = 7) {
  const { selectedOrgId } = useOrgFilter();

  // First get the slug for the org
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

  return useQuery({
    queryKey: ["sol-metricas", franquiaId, days],
    enabled: !!slugQuery.data,
    queryFn: async (): Promise<SolMetrica[]> => {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const { data, error } = await supabase
        .from("sol_metricas")
        .select("*")
        .eq("franquia_id", franquiaId)
        .gte("data", fromDate.toISOString().split("T")[0])
        .order("data", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as SolMetrica[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
