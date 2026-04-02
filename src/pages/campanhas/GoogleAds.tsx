import { useState, useMemo } from 'react';
import { useGoogleAds, sumField, avgField, groupByDate, formatCurrency, formatNumber, formatPct } from '@/hooks/useCampaignObs';
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
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { DollarSign, MousePointer, Target, TrendingUp, AlertTriangle, Search } from 'lucide-react';

export default function GoogleAdsPage() {
  const franquiaId = useFranquiaId();
  const { periodo, setPeriodo, range } = usePeriodo();
  const [selectedCampanhas, setSelectedCampanhas] = useState<string[]>([]);
  const [dispositivo, setDispositivo] = useState('all');
  const [rede, setRede] = useState('all');
  const { data: rows, isLoading } = useGoogleAds(franquiaId, range);

  const filtered = useMemo(() => {
    if (!rows) return [];
    let r = rows;
    if (selectedCampanhas.length > 0) r = r.filter((x: any) => selectedCampanhas.includes(x.campaign_name));
    if (dispositivo !== 'all') r = r.filter((x: any) => x.dispositivo === dispositivo);
    if (rede !== 'all') r = r.filter((x: any) => x.rede === rede);
    return r;
  }, [rows, campanha, dispositivo, rede]);

  const campanhas = useMemo(() => [...new Set((rows || []).map((r: any) => r.campaign_name).filter(Boolean))] as string[], [rows]);
  const dispositivos = useMemo(() => [...new Set((rows || []).map((r: any) => r.dispositivo).filter(Boolean))] as string[], [rows]);
  const redes = useMemo(() => [...new Set((rows || []).map((r: any) => r.rede).filter(Boolean))] as string[], [rows]);

  const kpis = useMemo(() => {
    const cost = sumField(filtered, 'cost');
    const impressions = sumField(filtered, 'impressions');
    const clicks = sumField(filtered, 'clicks');
    const conversions = sumField(filtered, 'conversions');
    const convValue = sumField(filtered, 'conversion_value');
    return {
      cost, impressions, clicks, conversions, convValue,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpc: clicks > 0 ? cost / clicks : 0,
      cpm: impressions > 0 ? (cost / impressions) * 1000 : 0,
      cpa: conversions > 0 ? cost / conversions : 0,
      roas: cost > 0 ? convValue / cost : 0,
    };
  }, [filtered]);

  // Market intelligence
  const marketIntel = useMemo(() => {
    const avgIS = avgField(filtered.filter((r: any) => r.search_impression_share != null), 'search_impression_share');
    const avgTop = avgField(filtered.filter((r: any) => r.search_top_impression_pct != null), 'search_top_impression_pct');
    const avgAbsTop = avgField(filtered.filter((r: any) => r.search_abs_top_impression_pct != null), 'search_abs_top_impression_pct');
    const avgBudgetLost = avgField(filtered.filter((r: any) => r.search_budget_lost_share != null), 'search_budget_lost_share');
    const avgRankLost = avgField(filtered.filter((r: any) => r.search_rank_lost_share != null), 'search_rank_lost_share');
    const hasData = filtered.some((r: any) => r.search_impression_share != null);
    return { avgIS, avgTop, avgAbsTop, avgBudgetLost, avgRankLost, hasData };
  }, [filtered]);

  // By hour
  const byHour = useMemo(() => {
    const map: Record<number, { clicks: number; cost: number; conversions: number }> = {};
    filtered.forEach((r: any) => {
      const h = r.hora ?? -1;
      if (h < 0) return;
      if (!map[h]) map[h] = { clicks: 0, cost: 0, conversions: 0 };
      map[h].clicks += Number(r.clicks) || 0;
      map[h].cost += Number(r.cost) || 0;
      map[h].conversions += Number(r.conversions) || 0;
    });
    return Object.entries(map).map(([h, d]) => ({ hora: `${h}h`, ...d })).sort((a, b) => parseInt(a.hora) - parseInt(b.hora));
  }, [filtered]);

  // By day of week
  const byDow = useMemo(() => {
    const map: Record<string, { clicks: number; cost: number; conversions: number }> = {};
    filtered.forEach((r: any) => {
      const d = r.dia_semana || '';
      if (!d) return;
      if (!map[d]) map[d] = { clicks: 0, cost: 0, conversions: 0 };
      map[d].clicks += Number(r.clicks) || 0;
      map[d].cost += Number(r.cost) || 0;
      map[d].conversions += Number(r.conversions) || 0;
    });
    const order = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const labels: Record<string, string> = { MONDAY: 'Seg', TUESDAY: 'Ter', WEDNESDAY: 'Qua', THURSDAY: 'Qui', FRIDAY: 'Sex', SATURDAY: 'Sáb', SUNDAY: 'Dom' };
    return order.filter(d => map[d]).map(d => ({ dia: labels[d] || d, ...map[d] }));
  }, [filtered]);

  const dailyChart = useMemo(() => {
    const byDate = groupByDate(filtered);
    return Object.entries(byDate)
      .map(([date, dayRows]) => ({ date, cost: sumField(dayRows, 'cost'), conversions: sumField(dayRows, 'conversions'), clicks: sumField(dayRows, 'clicks') }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  const drillDown = useMemo(() => {
    const map = new Map<string, any>();
    for (const r of filtered) {
      const key = `${r.campaign_name}||${r.ad_group_name || ''}||${r.dispositivo || ''}`;
      if (!map.has(key)) map.set(key, { campaign: r.campaign_name, adGroup: r.ad_group_name, dispositivo: r.dispositivo, cost: 0, impressions: 0, clicks: 0, conversions: 0, convValue: 0, qualityScore: r.quality_score });
      const m = map.get(key);
      m.cost += Number(r.cost) || 0;
      m.impressions += Number(r.impressions) || 0;
      m.clicks += Number(r.clicks) || 0;
      m.conversions += Number(r.conversions) || 0;
      m.convValue += Number(r.conversion_value) || 0;
    }
    return [...map.values()].map(m => ({
      ...m,
      ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
      cpc: m.clicks > 0 ? m.cost / m.clicks : 0,
      roas: m.cost > 0 ? m.convValue / m.cost : 0,
    })).sort((a, b) => b.cost - a.cost);
  }, [filtered]);

  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-64 mb-4" /><div className="grid grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div></div>;
  if (!rows?.length) return <div className="p-6"><div className="flex justify-between items-center mb-4"><h1 className="text-xl font-bold">Google Ads</h1><SyncBadge franquiaId={franquiaId} /></div><EmptyState /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold">Google Ads</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <SyncBadge franquiaId={franquiaId} />
          <CampanhaFilters periodo={periodo} setPeriodo={setPeriodo} campanha={campanha} setCampanha={setCampanha} campanhas={campanhas}
            extraFilters={
              <>
                <Select value={dispositivo} onValueChange={setDispositivo}>
                  <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="Dispositivo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {dispositivos.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={rede} onValueChange={setRede}>
                  <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Rede" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {redes.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </>
            }
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="Investimento" value={formatCurrency(kpis.cost)} icon={<DollarSign className="h-4 w-4" />} />
        <KPICard label="Impressões" value={formatNumber(kpis.impressions)} />
        <KPICard label="Cliques" value={formatNumber(kpis.clicks)} detail={`CTR: ${formatPct(kpis.ctr)}`} icon={<MousePointer className="h-4 w-4" />} />
        <KPICard label="CPC / CPM" value={formatCurrency(kpis.cpc)} detail={`CPM: ${formatCurrency(kpis.cpm)}`} />
        <KPICard label="Conversões" value={formatNumber(kpis.conversions)} detail={`CPA: ${formatCurrency(kpis.cpa)}`} icon={<Target className="h-4 w-4" />} />
        <KPICard label="ROAS" value={`${kpis.roas.toFixed(2)}×`} detail={`Receita: ${formatCurrency(kpis.convValue)}`} icon={<TrendingUp className="h-4 w-4" />} />
      </div>

      {/* Market Intelligence */}
      {marketIntel.hasData && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Search className="h-4 w-4" /> Market Intelligence</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KPICard label="Impression Share" value={formatPct(marketIntel.avgIS * 100)} detail="% das buscas que apareceu" />
            <KPICard label="Topo da Página" value={formatPct(marketIntel.avgTop * 100)} detail="% no topo" />
            <KPICard label="1º Resultado" value={formatPct(marketIntel.avgAbsTop * 100)} detail="% primeiro" />
            <KPICard label="Perdido (Orçamento)" value={formatPct(marketIntel.avgBudgetLost * 100)} detail="Aumentar budget" icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} />
            <KPICard label="Perdido (Ranking)" value={formatPct(marketIntel.avgRankLost * 100)} detail="Melhorar Quality Score" icon={<AlertTriangle className="h-4 w-4 text-red-500" />} />
          </div>
        </Card>
      )}

      {/* Chart */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4">Custo × Conversões por Dia</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={dailyChart}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="cost" name="Custo (R$)" stroke="hsl(35, 90%, 55%)" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="clicks" name="Cliques" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">Detalhamento</TabsTrigger>
          <TabsTrigger value="tempo">Por Hora / Dia</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <Card className="p-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Campanha</TableHead>
                    <TableHead className="text-xs">Grupo</TableHead>
                    <TableHead className="text-xs">Dispositivo</TableHead>
                    <TableHead className="text-xs text-right">Custo</TableHead>
                    <TableHead className="text-xs text-right">Cliques</TableHead>
                    <TableHead className="text-xs text-right">Impr.</TableHead>
                    <TableHead className="text-xs text-right">CTR</TableHead>
                    <TableHead className="text-xs text-right">CPC</TableHead>
                    <TableHead className="text-xs text-right">Conv.</TableHead>
                    <TableHead className="text-xs text-right">ROAS</TableHead>
                    <TableHead className="text-xs text-right">QS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drillDown.slice(0, 50).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs max-w-[150px] truncate">{row.campaign || '—'}</TableCell>
                      <TableCell className="text-xs max-w-[120px] truncate">{row.adGroup || '—'}</TableCell>
                      <TableCell className="text-xs">{row.dispositivo || '—'}</TableCell>
                      <TableCell className="text-xs text-right">{formatCurrency(row.cost)}</TableCell>
                      <TableCell className="text-xs text-right">{formatNumber(row.clicks)}</TableCell>
                      <TableCell className="text-xs text-right">{formatNumber(row.impressions)}</TableCell>
                      <TableCell className="text-xs text-right">{formatPct(row.ctr)}</TableCell>
                      <TableCell className="text-xs text-right">{formatCurrency(row.cpc)}</TableCell>
                      <TableCell className="text-xs text-right">{formatNumber(row.conversions)}</TableCell>
                      <TableCell className="text-xs text-right">{row.roas.toFixed(2)}×</TableCell>
                      <TableCell className="text-xs text-right">{row.qualityScore || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tempo">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {byHour.length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-semibold mb-4">Cliques por Hora do Dia</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={byHour}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="hora" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="clicks" name="Cliques" fill="hsl(35, 90%, 55%)" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
            {byDow.length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-semibold mb-4">Cliques por Dia da Semana</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={byDow}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="clicks" name="Cliques" fill="hsl(var(--primary))" />
                    <Bar dataKey="cost" name="Custo (R$)" fill="hsl(35, 90%, 55%)" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
