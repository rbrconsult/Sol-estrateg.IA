import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";

export type CampaignMetric = Database["public"]["Tables"]["ads_meta_campaigns_daily"]["Row"];
export type GA4Metric = Database["public"]["Tables"]["analytics_ga4_daily"]["Row"];

async function fetchCampaignMetrics(): Promise<CampaignMetric[]> {
  const { data, error } = await supabase
    .from("ads_meta_campaigns_daily")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

async function fetchGA4Metrics(): Promise<GA4Metric[]> {
  const { data, error } = await supabase
    .from("analytics_ga4_daily")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export function useCampaignMetrics() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["campaign-metrics"],
    queryFn: fetchCampaignMetrics,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    enabled: !!user,
  });
}

export function useGA4Metrics() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ga4-metrics"],
    queryFn: fetchGA4Metrics,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    enabled: !!user,
  });
}
