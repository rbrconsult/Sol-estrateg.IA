import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { useOrgFilter } from "@/contexts/OrgFilterContext";

export type CampaignMetric = Database["public"]["Tables"]["ads_meta_campaigns_daily"]["Row"];
export type GA4Metric = Database["public"]["Tables"]["analytics_ga4_daily"]["Row"];

async function resolveFranquiaSlug(selectedOrgId: string | null): Promise<string | null> {
  if (!selectedOrgId) return null;
  const { data, error } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", selectedOrgId)
    .single();
  if (error) throw new Error(error.message);
  const slug = data?.slug?.trim();
  return slug || null;
}

async function fetchCampaignMetrics(selectedOrgId: string | null): Promise<CampaignMetric[]> {
  const franquiaSlug = await resolveFranquiaSlug(selectedOrgId);
  let query = supabase
    .from("ads_meta_campaigns_daily")
    .select("*")
    .order("date", { ascending: false });
  if (franquiaSlug) {
    query = query.eq("franquia_id", franquiaSlug);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

async function fetchGA4Metrics(selectedOrgId: string | null): Promise<GA4Metric[]> {
  const franquiaSlug = await resolveFranquiaSlug(selectedOrgId);
  let query = supabase
    .from("analytics_ga4_daily")
    .select("*")
    .order("date", { ascending: false });
  if (franquiaSlug) {
    query = query.eq("franquia_id", franquiaSlug);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export function useCampaignMetrics() {
  const { user } = useAuth();
  const { selectedOrgId } = useOrgFilter();
  return useQuery({
    queryKey: ["campaign-metrics", selectedOrgId],
    queryFn: () => fetchCampaignMetrics(selectedOrgId),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    enabled: !!user,
  });
}

export function useGA4Metrics() {
  const { user } = useAuth();
  const { selectedOrgId } = useOrgFilter();
  return useQuery({
    queryKey: ["ga4-metrics", selectedOrgId],
    queryFn: () => fetchGA4Metrics(selectedOrgId),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    enabled: !!user,
  });
}
