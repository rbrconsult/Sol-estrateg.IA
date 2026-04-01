import { useState, useMemo } from 'react';
import { useMetaAds, sumField, avgField, groupByDate, formatCurrency, formatNumber, formatPct } from '@/hooks/useCampaignObs';
import { usePeriodo } from '@/hooks/usePeriodo';
import { useFranquiaId } from '@/hooks/useFranquiaId';
import { CampanhaFilters } from '@/components/campanhas/CampanhaFilters';
import { SyncBadge } from '@/components/campanhas/SyncBadge';
import { KPICard } from '@/components/campanhas/KPICard';
import { EmptyState } from '@/components/campanhas/EmptyState';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { DollarSign, Eye, MousePointer, Users, Target, Video, Award } from 'lucide-react';

const PIE_COLORS = ['hsl(210,80%,55%)', 'hsl(35,90%,55%)', 'hsl(142,70%,45%)', 'hsl(0,70%,55%)', 'hsl(270,60%,55%)', 'hsl(180,60%,45%)'];

function groupBy(rows: any[], field: string) {
  const map: Record<string, any[]> = {};
  rows.forEach(r => {
    const k = r[field] || 'N/A';
    if (!map[k]) map[k] = [];
    map[k].push(r);
  });
  return Object.entries(map).map(([label, items]) => ({
    label,
    spend: sumField(items, 'spend'),
    impressions: sumField(items, 'impressions'),
    clicks: sumField(items, 'clicks'),
    leads: sumField(items, 'leads'),
    reach: sumField(items, 'reach'),
    cpl: sumField(items, 'leads') > 0 ? sumField(items, 'spend') / sumField(items, 'leads') : 0,
    ctr: sumField(items, 'impressions') > 0 ? (sumField(items, 'clicks') / sumField(items, 'impressions')) * 100 : 0,
  })).sort((a, b) => b.spend - a.spend);
}

export default function MetaAdsPage() {
  const franquiaId = useFranquiaId();
  const { periodo, setPeriodo, range } = usePeriodo();
  const [campanha, setCampanha] = useState('all');
  const [adset, setAdset] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: rows, isLoading } = useMetaAds(franquiaId, range);

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
        date, spend: sumField(dayRows, 'spend'), leads: sumField(dayRows, 'leads'),
        clicks: sumField(dayRows, 'clicks'), impressions: sumField(dayRows, 'impressions'),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  // Breakdowns
  const byPlatform = useMemo(() => groupBy(filtered, 'publisher_platform'), [filtered]);
  const byPosition = useMemo(() => groupBy(filtered, 'platform_position'), [filtered]);

  // Quality rankings summary
  const qualitySummary = useMemo(() => {
    const rankings = { above: 0, average: 0, below: 0, unknown: 0 };
    filtered.forEach((r: any) => {
      const q = (r.quality_ranking || '').toUpperCase();
      if (q.includes('ABOVE')) rankings.above++;
      else if (q.includes('BELOW')) rankings.below++;
      else if (q.includes('AVERAGE')) rankings.average++;
      else rankings.unknown++;
    });
    return rankings;
  }, [filtered]);

  // Video metrics
  const videoMetrics = useMemo(() => ({
    views3s: sumField(filtered, 'video_views_3s'),
    p25: sumField(filtered, 'video_p25'),
    p50: sumField(filtered, 'video_p50'),
    p75: sumField(filtered, 'video_p75'),
    p100: sumField(filtered, 'video_p100'),
  }), [filtered]);
  const hasVideo = videoMetrics.views3s > 0;

  // Drill-down table
  const drillDown = useMemo(() => {
    const map = new Map<string, any>();
    for (const r of filtered) {
      const key = `${r.campaign_name}||${r.adset_name || ''}||${r.ad_name || ''}`;
      if (!map.has(key)) {
        map.set(key, { campaign: r.campaign_name, adset: r.adset_name, ad: r.ad_name, spend: 0, impressions: 0, clicks: 0, leads: 0, receita: 0, quality: r.quality_ranking, engagement: r.engagement_ranking, conversion: r.conversion_ranking });
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
  if (!rows?.length) return <div className="p-6"><div className="flex justify-between items-center mb-4"><h1 className="text-xl font-bold">Meta Ads</h1><SyncBadge franquiaId={franquiaId} /></div><EmptyState /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold">Meta Ads</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <SyncBadge franquiaId={franquiaId} />
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <KPICard label="Investimento" value={formatCurrency(kpis.spend)} icon={<DollarSign className="h-4 w-4" />} />
        <KPICard label="Impressões" value={formatNumber(kpis.impressions)} icon={<Eye className="h-4 w-4" />} />
        <KPICard label="Alcance" value={formatNumber(kpis.reach)} detail={`Freq: ${kpis.frequency.toFixed(1)}`} />
        <KPICard label="Cliques" value={formatNumber(kpis.clicks)} detail={`CTR: ${formatPct(kpis.ctr)}`} icon={<MousePointer className="h-4 w-4" />} />
        <KPICard label="CPM / CPC" value={formatCurrency(kpis.cpm)} detail={`CPC: ${formatCurrency(kpis.cpc)}`} />
        <KPICard label="Leads" value={formatNumber(kpis.leads)} detail={`CPL: ${formatCurrency(kpis.cpl)}`} icon={<Users className="h-4 w-4" />} />
        <KPICard label="Receita" value={formatCurrency(kpis.receita)} detail={`ROAS: ${kpis.roas.toFixed(2)}×`} icon={<Target className="h-4 w-4" />} />
        <KPICard label="Quality" value={`${qualitySummary.above} ✅`} detail={`${qualitySummary.average} avg / ${qualitySummary.below} ⚠️`} icon={<Award className="h-4 w-4" />} />
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

      {/* Tabs: Breakdowns + Video + Table */}
      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">Detalhamento</TabsTrigger>
          <TabsTrigger value="breakdowns">Breakdowns</TabsTrigger>
          {hasVideo && <TabsTrigger value="video">Vídeo</TabsTrigger>}
        </TabsList>

        <TabsContent value="table">
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-4">Campanha → Adset → Anúncio</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Campanha</TableHead>
                    <TableHead className="text-xs">Adset</TableHead>
                    <TableHead className="text-xs">Anúncio</TableHead>
                    <TableHead className="text-xs text-right">Spend</TableHead>
                    <TableHead className="text-xs text-right">Impr.</TableHead>
                    <TableHead className="text-xs text-right">Cliques</TableHead>
                    <TableHead className="text-xs text-right">CTR</TableHead>
                    <TableHead className="text-xs text-right">CPC</TableHead>
                    <TableHead className="text-xs text-right">Leads</TableHead>
                    <TableHead className="text-xs text-right">CPL</TableHead>
                    <TableHead className="text-xs">Quality</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drillDown.slice(0, 50).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs max-w-[140px] truncate">{row.campaign || '—'}</TableCell>
                      <TableCell className="text-xs max-w-[120px] truncate">{row.adset || '—'}</TableCell>
                      <TableCell className="text-xs max-w-[120px] truncate">{row.ad || '—'}</TableCell>
                      <TableCell className="text-xs text-right">{formatCurrency(row.spend)}</TableCell>
                      <TableCell className="text-xs text-right">{formatNumber(row.impressions)}</TableCell>
                      <TableCell className="text-xs text-right">{formatNumber(row.clicks)}</TableCell>
                      <TableCell className="text-xs text-right">{formatPct(row.ctr)}</TableCell>
                      <TableCell className="text-xs text-right">{formatCurrency(row.cpc)}</TableCell>
                      <TableCell className="text-xs text-right">{formatNumber(row.leads)}</TableCell>
                      <TableCell className="text-xs text-right">{formatCurrency(row.cpl)}</TableCell>
                      <TableCell className="text-xs">
                        {row.quality && <Badge variant="outline" className="text-[9px]">{row.quality}</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="breakdowns">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Platform breakdown */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-4">Por Plataforma (Facebook vs Instagram)</h3>
              {byPlatform.filter(b => b.label !== 'N/A').length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={byPlatform.filter(b => b.label !== 'N/A')} dataKey="spend" nameKey="label" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {byPlatform.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 space-y-1">
                    {byPlatform.filter(b => b.label !== 'N/A').map(b => (
                      <div key={b.label} className="flex justify-between text-xs">
                        <span>{b.label}</span>
                        <span>CPL: {formatCurrency(b.cpl)} | {formatNumber(b.leads)} leads</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-xs text-muted-foreground">Dados de breakdown ainda não sincronizados</p>}
            </Card>

            {/* Position breakdown */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-4">Por Posição (Feed vs Stories vs Reels)</h3>
              {byPosition.filter(b => b.label !== 'N/A').length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={byPosition.filter(b => b.label !== 'N/A')} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={100} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Bar dataKey="spend" name="Investimento" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-2 space-y-1">
                    {byPosition.filter(b => b.label !== 'N/A').map(b => (
                      <div key={b.label} className="flex justify-between text-xs">
                        <span>{b.label}</span>
                        <span>CPL: {formatCurrency(b.cpl)} | CTR: {formatPct(b.ctr)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-xs text-muted-foreground">Dados de breakdown ainda não sincronizados</p>}
            </Card>
          </div>
        </TabsContent>

        {hasVideo && (
          <TabsContent value="video">
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Video className="h-4 w-4" /> Performance de Vídeo</h3>
              <div className="grid grid-cols-5 gap-4">
                <KPICard label="Views 3s" value={formatNumber(videoMetrics.views3s)} />
                <KPICard label="25% assistido" value={formatNumber(videoMetrics.p25)} detail={videoMetrics.views3s > 0 ? `${((videoMetrics.p25 / videoMetrics.views3s) * 100).toFixed(0)}% retenção` : ''} />
                <KPICard label="50% assistido" value={formatNumber(videoMetrics.p50)} detail={videoMetrics.views3s > 0 ? `${((videoMetrics.p50 / videoMetrics.views3s) * 100).toFixed(0)}% retenção` : ''} />
                <KPICard label="75% assistido" value={formatNumber(videoMetrics.p75)} detail={videoMetrics.views3s > 0 ? `${((videoMetrics.p75 / videoMetrics.views3s) * 100).toFixed(0)}% retenção` : ''} />
                <KPICard label="100% assistido" value={formatNumber(videoMetrics.p100)} detail={videoMetrics.views3s > 0 ? `${((videoMetrics.p100 / videoMetrics.views3s) * 100).toFixed(0)}% retenção` : ''} />
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
