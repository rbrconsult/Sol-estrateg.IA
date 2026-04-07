import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CampaignMetric {
  id: string;
  organization_id: string;
  plataforma: string;
  campaign_id: string;
  campaign_name: string;
  adset_name: string;
  ad_name: string;
  data_referencia: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  leads: number;
  ctr: number;
  cpc: number;
  cpl: number;
  roas: number;
  receita: number;
  synced_at: string;
}

export interface GA4Metric {
  id: string;
  organization_id: string;
  data_referencia: string;
  source: string;
  medium: string;
  campaign: string;
  landing_page: string;
  sessions: number;
  users_count: number;
  new_users: number;
  bounce_rate: number;
  avg_session_duration: number;
  pages_per_session: number;
  conversions: number;
  conversion_rate: number;
  events: Record<string, any>;
  synced_at: string;
}

async function fetchCampaignMetrics(): Promise<CampaignMetric[]> {
  const { data, error } = await supabase
    .from("ads_meta_campaigns_daily")
    .select("*")
    .order("data_referencia", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as CampaignMetric[];
}

async function fetchGA4Metrics(): Promise<GA4Metric[]> {
  const { data, error } = await supabase
    .from("analytics_ga4_daily")
    .select("*")
    .order("data_referencia", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as GA4Metric[];
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
