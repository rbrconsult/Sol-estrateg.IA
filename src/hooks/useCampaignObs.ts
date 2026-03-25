import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DateRange {
  from: Date;
  to: Date;
}

async function fetchTable(table: string, franquiaId: string, range?: DateRange) {
  const allRows: any[] = [];
  let offset = 0;
  const pageSize = 1000;
  let hasMore = true;
  while (hasMore) {
    let q = (supabase as any).from(table).select('*').eq('franquia_id', franquiaId);
    if (range) {
      q = q.gte('date', range.from.toISOString().slice(0, 10))
           .lte('date', range.to.toISOString().slice(0, 10));
    }
    q = q.order('date', { ascending: false }).range(offset, offset + pageSize - 1);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    if (data && data.length > 0) {
      allRows.push(...data);
      hasMore = data.length === pageSize;
      offset += pageSize;
    } else {
      hasMore = false;
    }
  }
  return allRows;
}

async function fetchLastSync(franquiaId: string) {
  const { data } = await (supabase as any)
    .from('integration_runs')
    .select('finished_at, integration_name, status')
    .eq('franquia_id', franquiaId)
    .order('finished_at', { ascending: false })
    .limit(5);
  return (data as any[]) || [];
}

export function useMetaAds(franquiaId: string, range?: DateRange) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['ads-meta', franquiaId, range?.from?.toISOString(), range?.to?.toISOString()],
    queryFn: () => fetchTable('ads_meta_campaigns_daily' as any, franquiaId, range),
    enabled: !!user && !!franquiaId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGoogleAds(franquiaId: string, range?: DateRange) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['ads-google', franquiaId, range?.from?.toISOString(), range?.to?.toISOString()],
    queryFn: () => fetchTable('ads_google_campaigns_daily' as any, franquiaId, range),
    enabled: !!user && !!franquiaId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGA4(franquiaId: string, range?: DateRange) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['ga4-daily', franquiaId, range?.from?.toISOString(), range?.to?.toISOString()],
    queryFn: () => fetchTable('analytics_ga4_daily' as any, franquiaId, range),
    enabled: !!user && !!franquiaId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useWhatsApp(franquiaId: string, range?: DateRange) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['whatsapp-daily', franquiaId, range?.from?.toISOString(), range?.to?.toISOString()],
    queryFn: () => fetchTable('whatsapp_conversations_daily' as any, franquiaId, range),
    enabled: !!user && !!franquiaId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useMediaPerformance(franquiaId: string, range?: DateRange) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['media-perf', franquiaId, range?.from?.toISOString(), range?.to?.toISOString()],
    queryFn: () => fetchTable('media_performance_daily' as any, franquiaId, range),
    enabled: !!user && !!franquiaId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useLastSync(franquiaId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['last-sync', franquiaId],
    queryFn: () => fetchLastSync(franquiaId),
    enabled: !!user && !!franquiaId,
    staleTime: 1000 * 60 * 2,
  });
}

// Aggregation helpers
export function sumField(rows: any[], field: string): number {
  return rows.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
}

export function avgField(rows: any[], field: string): number {
  if (!rows.length) return 0;
  return sumField(rows, field) / rows.length;
}

export function groupByDate(rows: any[]): Record<string, any[]> {
  const map: Record<string, any[]> = {};
  for (const r of rows) {
    const d = r.date;
    if (!map[d]) map[d] = [];
    map[d].push(r);
  }
  return map;
}

export function formatCurrency(v: number): string {
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`;
  return `R$ ${v.toFixed(2)}`;
}

export function formatNumber(v: number): string {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v.toLocaleString('pt-BR');
}

export function formatPct(v: number): string {
  return `${v.toFixed(2)}%`;
}
