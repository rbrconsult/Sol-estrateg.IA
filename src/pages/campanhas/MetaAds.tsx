import { useState, useMemo } from 'react';
import { useMetaAds, sumField, groupByDate, formatCurrency, formatNumber, formatPct } from '@/hooks/useCampaignObs';
import { usePeriodo } from '@/hooks/usePeriodo';
import { CampanhaFilters } from '@/components/campanhas/CampanhaFilters';
import { SyncBadge } from '@/components/campanhas/SyncBadge';
import { KPICard } from '@/components/campanhas/KPICard';
import { EmptyState } from '@/components/campanhas/EmptyState';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { DollarSign, Eye, MousePointer, Users, Target } from 'lucide-react';

const FRANQUIA = 'evolve_olimpia';

export default function MetaAdsPage() {
  const { periodo, setPeriodo, range } = usePeriodo();
  const [campanha, setCampanha] = useState('all');
  const [adset, setAdset] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: rows, isLoading } = useMetaAds(FRANQUIA, range);

  const filtered = useMemo(() => {
    if (!rows) return [];
    let r = rows;
    if (campanha !== 'all') r = r.filter((x: any) => x.campaign_name === campanha);
    if (adset !== 'all') r = r.filter((x: any) => x.adset_name === adset);
    if (statusFilter !== 'all') r = r.filter((x: any) => x.campaign_status === statusFilter);
    return r;
  }, [rows, campanha, adset, statusFilter]);

  const campanhas = useMemo(() => [...new Set((rows || []).map((r: any) => r.campaign_name).filter(Boolean))] as string[], [rows]);
  const adsets = useMemo(() => [...new Set((rows || []).map((r: any) => r.adset_name).filter(Boolean))] as string[], [rows]);

  const kpis = useMemo(() => {
    const spend = sumField(filtered, 'spend');
    const impressions = sumField(filtered, 'impressions');
    const reach = sumField(filtered, 'reach');
    const clicks = sumField(filtered, 'clicks');
    const leads = sumField(filtered, 'leads');
    const receita = sumField(filtered, 'receita_gerada');
    return {
      spend, impressions, reach, clicks, leads, receita,
      frequency: reach > 0 ? impressions / reach : 0,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      cpl: leads > 0 ? spend / leads : 0,
      roas: spend > 0 ? receita / spend : 0,
    };
  }, [filtered]);

  const dailyChart = useMemo(() => {
    const byDate = groupByDate(filtered);
    return Object.entries(byDate)
      .map(([date, dayRows]) => ({
        date,
        spend: sumField(dayRows, 'spend'),
        leads: sumField(dayRows, 'leads'),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  // Drill-down: group by campaign → adset → ad
  const drillDown = useMemo(() => {
    const map = new Map<string, any>();
    for (const r of filtered) {
      const key = `${r.campaign_name}||${r.adset_name || ''}||${r.ad_name || ''}`;
      if (!map.has(key)) {
        map.set(key, { campaign: r.campaign_name, adset: r.adset_name, ad: r.ad_name, spend: 0, impressions: 0, clicks: 0, leads: 0, ctr: 0, cpc: 0, cpl: 0, roas: 0, receita: 0 });
      }
      const m = map.get(key);
      m.spend += Number(r.spend) || 0;
      m.impressions += Number(r.impressions) || 0;
      m.clicks += Number(r.clicks) || 0;
      m.leads += Number(r.leads) || 0;
      m.receita += Number(r.receita_gerada) || 0;
    }
    return [...map.values()].map(m => ({
      ...m,
      ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
      cpc: m.clicks > 0 ? m.spend / m.clicks : 0,
      cpl: m.leads > 0 ? m.spend / m.leads : 0,
      roas: m.spend > 0 ? m.receita / m.spend : 0,
    })).sort((a, b) => b.spend - a.spend);
  }, [filtered]);

  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-64 mb-4" /><div className="grid grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div></div>;
  if (!rows?.length) return <div className="p-6"><div className="flex justify-between items-center mb-4"><h1 className="text-xl font-bold">Meta Ads</h1><SyncBadge franquiaId={FRANQUIA} /></div><EmptyState /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold">Meta Ads</h1>
        <div className="flex items-center gap-3">
          <SyncBadge franquiaId={FRANQUIA} />
          <CampanhaFilters periodo={periodo} setPeriodo={setPeriodo} campanha={campanha} setCampanha={setCampanha} campanhas={campanhas}
            extraFilters={
              <>
                <Select value={adset} onValueChange={setAdset}>
                  <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue placeholder="Todos adsets" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos adsets</SelectItem>
                    {adsets.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="PAUSED">Pausado</SelectItem>
                  </SelectContent>
                </Select>
              </>
            }
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <KPICard label="Investimento" value={formatCurrency(kpis.spend)} icon={<DollarSign className="h-4 w-4" />} />
        <KPICard label="Impressões" value={formatNumber(kpis.impressions)} icon={<Eye className="h-4 w-4" />} />
        <KPICard label="Alcance" value={formatNumber(kpis.reach)} detail={`Freq: ${kpis.frequency.toFixed(2)}`} />
        <KPICard label="Cliques" value={formatNumber(kpis.clicks)} detail={`CTR: ${formatPct(kpis.ctr)}`} icon={<MousePointer className="h-4 w-4" />} />
        <KPICard label="CPM" value={formatCurrency(kpis.cpm)} detail={`CPC: ${formatCurrency(kpis.cpc)}`} />
        <KPICard label="Leads" value={formatNumber(kpis.leads)} detail={`CPL: ${formatCurrency(kpis.cpl)}`} icon={<Users className="h-4 w-4" />} />
      </div>

      {/* Chart */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4">Investimento × Leads por Dia</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={dailyChart}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="spend" name="Spend (R$)" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="leads" name="Leads" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Drill-down table */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4">Detalhamento: Campanha → Adset → Anúncio</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Campanha</TableHead>
                <TableHead className="text-xs">Adset</TableHead>
                <TableHead className="text-xs">Anúncio</TableHead>
                <TableHead className="text-xs text-right">Spend</TableHead>
                <TableHead className="text-xs text-right">Impressões</TableHead>
                <TableHead className="text-xs text-right">Cliques</TableHead>
                <TableHead className="text-xs text-right">CTR</TableHead>
                <TableHead className="text-xs text-right">CPC</TableHead>
                <TableHead className="text-xs text-right">Leads</TableHead>
                <TableHead className="text-xs text-right">CPL</TableHead>
                <TableHead className="text-xs text-right">ROAS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drillDown.slice(0, 50).map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs max-w-[150px] truncate">{row.campaign || '—'}</TableCell>
                  <TableCell className="text-xs max-w-[120px] truncate">{row.adset || '—'}</TableCell>
                  <TableCell className="text-xs max-w-[120px] truncate">{row.ad || '—'}</TableCell>
                  <TableCell className="text-xs text-right">{formatCurrency(row.spend)}</TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(row.impressions)}</TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(row.clicks)}</TableCell>
                  <TableCell className="text-xs text-right">{formatPct(row.ctr)}</TableCell>
                  <TableCell className="text-xs text-right">{formatCurrency(row.cpc)}</TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(row.leads)}</TableCell>
                  <TableCell className="text-xs text-right">{formatCurrency(row.cpl)}</TableCell>
                  <TableCell className="text-xs text-right">{row.roas.toFixed(2)}×</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
