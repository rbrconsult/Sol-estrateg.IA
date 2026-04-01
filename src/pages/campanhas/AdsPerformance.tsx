import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { Megaphone, AlertTriangle, DollarSign, MousePointer, Target, Eye } from 'lucide-react';
import { useMetaAds, useGoogleAds, sumField, groupByDate, formatCurrency, formatNumber, formatPct } from '@/hooks/useCampaignObs';
import { usePeriodo } from '@/hooks/usePeriodo';
import { CampanhaFilters } from '@/components/campanhas/CampanhaFilters';
import { SyncBadge } from '@/components/campanhas/SyncBadge';
import { KPICard } from '@/components/campanhas/KPICard';
import { EmptyState } from '@/components/campanhas/EmptyState';

const FRANQUIA = 'evolve_olimpia';
const META_COLOR = 'hsl(210,80%,55%)';
const GOOGLE_COLOR = 'hsl(140,60%,45%)';
const COLORS = [META_COLOR, GOOGLE_COLOR, 'hsl(35,90%,55%)', 'hsl(0,70%,55%)', 'hsl(270,60%,55%)'];
const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 };

export default function CampanhasAdsPerformance() {
  const { periodo, setPeriodo, range } = usePeriodo();
  const [campanha, setCampanha] = useState('all');
  const [canalFilter, setCanalFilter] = useState('all');

  const { data: metaRows, isLoading: loadingMeta } = useMetaAds(FRANQUIA, range);
  const { data: googleRows, isLoading: loadingGoogle } = useGoogleAds(FRANQUIA, range);

  // Normalize both sources into a unified format
  const unified = useMemo(() => {
    const rows: any[] = [];
    for (const r of metaRows || []) {
      rows.push({
        canal: 'Meta Ads',
        date: r.date,
        campaign_name: r.campaign_name || 'Sem campanha',
        spend: Number(r.spend) || 0,
        impressions: Number(r.impressions) || 0,
        clicks: Number(r.clicks) || 0,
        leads: Number(r.leads) || 0,
        conversions: Number(r.leads) || 0,
        reach: Number(r.reach) || 0,
        ctr: Number(r.ctr) || 0,
      });
    }
    for (const r of googleRows || []) {
      rows.push({
        canal: 'Google Ads',
        date: r.date,
        campaign_name: r.campaign_name || 'Sem campanha',
        spend: Number(r.cost) || 0,
        impressions: Number(r.impressions) || 0,
        clicks: Number(r.clicks) || 0,
        leads: Number(r.conversions) || 0,
        conversions: Number(r.conversions) || 0,
        reach: 0,
        ctr: Number(r.ctr) || 0,
      });
    }
    return rows;
  }, [metaRows, googleRows]);

  // Apply filters
  const filtered = useMemo(() => {
    let r = unified;
    if (canalFilter !== 'all') r = r.filter(x => x.canal === canalFilter);
    if (campanha !== 'all') r = r.filter(x => x.campaign_name === campanha);
    return r;
  }, [unified, canalFilter, campanha]);

  const campanhas = useMemo(() => [...new Set(unified.map(r => r.campaign_name).filter(Boolean))] as string[], [unified]);

  // KPIs
  const kpis = useMemo(() => {
    const spend = filtered.reduce((s, r) => s + r.spend, 0);
    const impressions = filtered.reduce((s, r) => s + r.impressions, 0);
    const clicks = filtered.reduce((s, r) => s + r.clicks, 0);
    const leads = filtered.reduce((s, r) => s + r.leads, 0);
    const reach = filtered.reduce((s, r) => s + r.reach, 0);
    return {
      spend, impressions, clicks, leads, reach,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      cpl: leads > 0 ? spend / leads : 0,
    };
  }, [filtered]);

  // By campaign aggregation
  const byCampaign = useMemo(() => {
    const map = new Map<string, any>();
    for (const r of filtered) {
      const key = `${r.canal}||${r.campaign_name}`;
      if (!map.has(key)) map.set(key, { canal: r.canal, campanha: r.campaign_name, spend: 0, impressions: 0, clicks: 0, leads: 0 });
      const m = map.get(key)!;
      m.spend += r.spend;
      m.impressions += r.impressions;
      m.clicks += r.clicks;
      m.leads += r.leads;
    }
    return [...map.values()].map(m => ({
      ...m,
      ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
      cpc: m.clicks > 0 ? m.spend / m.clicks : 0,
      cpl: m.leads > 0 ? m.spend / m.leads : 0,
    })).sort((a, b) => b.spend - a.spend);
  }, [filtered]);

  // Daily chart
  const dailyChart = useMemo(() => {
    const map = new Map<string, { spend: number; clicks: number; leads: number }>();
    for (const r of filtered) {
      if (!map.has(r.date)) map.set(r.date, { spend: 0, clicks: 0, leads: 0 });
      const m = map.get(r.date)!;
      m.spend += r.spend;
      m.clicks += r.clicks;
      m.leads += r.leads;
    }
    return [...map.entries()].map(([date, d]) => ({ date, ...d })).sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  // Pie data by canal
  const pieData = useMemo(() => {
    const byCanal = new Map<string, number>();
    for (const r of filtered) {
      byCanal.set(r.canal, (byCanal.get(r.canal) || 0) + r.spend);
    }
    return [...byCanal.entries()].map(([name, value]) => ({
      name,
      value: Math.round(value),
      fill: name === 'Meta Ads' ? META_COLOR : GOOGLE_COLOR,
    }));
  }, [filtered]);

  const isLoading = loadingMeta || loadingGoogle;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      </div>
    );
  }

  if (!unified.length) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" /> Ads Performance
          </h1>
          <SyncBadge franquiaId={FRANQUIA} />
        </div>
        <EmptyState message="Nenhum dado de mídia paga sincronizado ainda" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" /> Ads Performance
          </h1>
          <p className="text-sm text-muted-foreground">
            Performance consolidada — Google Ads + Meta Ads
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SyncBadge franquiaId={FRANQUIA} />
          <Select value={canalFilter} onValueChange={setCanalFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos canais</SelectItem>
              <SelectItem value="Meta Ads">Meta Ads</SelectItem>
              <SelectItem value="Google Ads">Google Ads</SelectItem>
            </SelectContent>
          </Select>
          <CampanhaFilters periodo={periodo} setPeriodo={setPeriodo} campanha={campanha} setCampanha={setCampanha} campanhas={campanhas} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <KPICard label="Investimento" value={formatCurrency(kpis.spend)} icon={<DollarSign className="h-4 w-4" />} />
        <KPICard label="Impressões" value={formatNumber(kpis.impressions)} icon={<Eye className="h-4 w-4" />} />
        <KPICard label="Cliques" value={formatNumber(kpis.clicks)} icon={<MousePointer className="h-4 w-4" />} />
        <KPICard label="CTR" value={formatPct(kpis.ctr)} />
        <KPICard label="CPC" value={formatCurrency(kpis.cpc)} />
        <KPICard label="Leads" value={formatNumber(kpis.leads)} icon={<Target className="h-4 w-4" />} />
        <KPICard label="CPL" value={formatCurrency(kpis.cpl)} />
      </div>

      {/* Daily chart */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4">Investimento × Leads por Dia</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={dailyChart}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="spend" name="Investimento (R$)" stroke={META_COLOR} strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="leads" name="Leads" stroke={GOOGLE_COLOR} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Table + Pie */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-4">
          <h3 className="text-sm font-semibold mb-4">Performance por Campanha</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Canal</TableHead>
                  <TableHead className="text-xs">Campanha</TableHead>
                  <TableHead className="text-xs text-right">Invest.</TableHead>
                  <TableHead className="text-xs text-right">Impr.</TableHead>
                  <TableHead className="text-xs text-right">Cliques</TableHead>
                  <TableHead className="text-xs text-right">CTR</TableHead>
                  <TableHead className="text-xs text-right">CPC</TableHead>
                  <TableHead className="text-xs text-right">Leads</TableHead>
                  <TableHead className="text-xs text-right">CPL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byCampaign.slice(0, 30).map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px]" style={{ borderColor: c.canal === 'Meta Ads' ? META_COLOR : GOOGLE_COLOR }}>
                        {c.canal}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">{c.campanha}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{formatCurrency(c.spend)}</TableCell>
                    <TableCell className="text-xs text-right">{formatNumber(c.impressions)}</TableCell>
                    <TableCell className="text-xs text-right">{formatNumber(c.clicks)}</TableCell>
                    <TableCell className="text-xs text-right">{formatPct(c.ctr)}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{formatCurrency(c.cpc)}</TableCell>
                    <TableCell className="text-xs text-right font-semibold">{c.leads}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{c.cpl > 0 ? formatCurrency(c.cpl) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {pieData.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-4">Investimento por Canal</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Invest vs Leads bar */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4">Investimento vs Leads por Campanha</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={byCampaign.slice(0, 10)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis dataKey="campanha" type="category" tick={{ fontSize: 9 }} width={140} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="spend" name="Investimento" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            <Bar dataKey="leads" name="Leads" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
