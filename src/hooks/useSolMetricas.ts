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
  const { selectedOrgId, orgs } = useOrgFilter();
  const selectedOrg = orgs.find(o => o.id === selectedOrgId);
  const franquiaId = (selectedOrg as any)?.slug || "evolve_olimpia";

  return useQuery({
    queryKey: ["sol-metricas", franquiaId, days],
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
