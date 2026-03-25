import { useState, useMemo } from 'react';
import { useGA4, sumField, groupByDate, formatNumber } from '@/hooks/useCampaignObs';
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
import { Globe, Users, Target } from 'lucide-react';

const FRANQUIA = 'evolve_olimpia';
const COLORS = ['hsl(210,80%,55%)', 'hsl(35,90%,55%)', 'hsl(140,60%,45%)', 'hsl(0,70%,55%)', 'hsl(270,60%,55%)', 'hsl(180,60%,45%)', 'hsl(45,90%,50%)', 'hsl(320,60%,55%)'];

export default function SiteGA4Page() {
  const { periodo, setPeriodo, range } = usePeriodo();
  const [campanha, setCampanha] = useState('all');
  const [source, setSource] = useState('all');
  const [medium, setMedium] = useState('all');
  const [landingPage, setLandingPage] = useState('all');
  const { data: rows, isLoading } = useGA4(FRANQUIA, range);

  const filtered = useMemo(() => {
    if (!rows) return [];
    let r = rows;
    if (campanha !== 'all') r = r.filter((x: any) => x.campaign === campanha);
    if (source !== 'all') r = r.filter((x: any) => x.source === source);
    if (medium !== 'all') r = r.filter((x: any) => x.medium === medium);
    if (landingPage !== 'all') r = r.filter((x: any) => x.landing_page === landingPage);
    return r;
  }, [rows, campanha, source, medium, landingPage]);

  const campanhas = useMemo(() => [...new Set((rows || []).map((r: any) => r.campaign).filter(Boolean))] as string[], [rows]);
  const sources = useMemo(() => [...new Set((rows || []).map((r: any) => r.source).filter(Boolean))] as string[], [rows]);
  const mediums = useMemo(() => [...new Set((rows || []).map((r: any) => r.medium).filter(Boolean))] as string[], [rows]);
  const landingPages = useMemo(() => [...new Set((rows || []).map((r: any) => r.landing_page).filter(Boolean))] as string[], [rows]);

  const kpis = useMemo(() => ({
    sessions: sumField(filtered, 'sessions'),
    users: sumField(filtered, 'users'),
    newUsers: sumField(filtered, 'new_users'),
    engaged: sumField(filtered, 'engaged_sessions'),
    conversions: sumField(filtered, 'conversions'),
    revenue: sumField(filtered, 'revenue'),
  }), [filtered]);

  // Chart: sessions per day grouped by source/medium
  const { chartData, chartKeys } = useMemo(() => {
    const dateMap = new Map<string, Record<string, number>>();
    const keysSet = new Set<string>();
    for (const r of filtered) {
      const key = `${r.source || '(direct)'}/${r.medium || '(none)'}`;
      keysSet.add(key);
      const date = typeof r.date === 'string' ? r.date.slice(0, 10) : r.date;
      if (!dateMap.has(date)) dateMap.set(date, {});
      const entry = dateMap.get(date)!;
      entry[key] = (entry[key] || 0) + (Number(r.sessions) || 0);
    }
    const keys = [...keysSet].slice(0, 8); // limit to 8 series
    const data = [...dateMap.entries()]
      .map(([date, vals]) => ({ date, ...vals }))
      .sort((a, b) => a.date.localeCompare(b.date));
    return { chartData: data, chartKeys: keys };
  }, [filtered]);

  const tableData = useMemo(() => {
    const map = new Map<string, any>();
    for (const r of filtered) {
      const key = `${r.source || ''}||${r.medium || ''}||${r.campaign || ''}||${r.landing_page || ''}`;
      if (!map.has(key)) map.set(key, { source: r.source, medium: r.medium, campaign: r.campaign, landing_page: r.landing_page, sessions: 0, users: 0, conversions: 0, revenue: 0 });
      const m = map.get(key);
      m.sessions += Number(r.sessions) || 0;
      m.users += Number(r.users) || 0;
      m.conversions += Number(r.conversions) || 0;
      m.revenue += Number(r.revenue) || 0;
    }
    return [...map.values()].sort((a, b) => b.sessions - a.sessions);
  }, [filtered]);

  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-64 mb-4" /><div className="grid grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div></div>;
  if (!rows?.length) return <div className="p-6"><div className="flex justify-between items-center mb-4"><h1 className="text-xl font-bold">Site (GA4)</h1><SyncBadge franquiaId={FRANQUIA} /></div><EmptyState /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold flex items-center gap-2"><Globe className="h-5 w-5" /> Site (GA4)</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <SyncBadge franquiaId={FRANQUIA} />
          <CampanhaFilters periodo={periodo} setPeriodo={setPeriodo} campanha={campanha} setCampanha={setCampanha} campanhas={campanhas}
            extraFilters={
              <>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Source" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todos</SelectItem>{sources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={medium} onValueChange={setMedium}>
                  <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Medium" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todos</SelectItem>{mediums.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={landingPage} onValueChange={setLandingPage}>
                  <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue placeholder="Landing Page" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todas</SelectItem>{landingPages.map(lp => <SelectItem key={lp} value={lp}>{lp}</SelectItem>)}</SelectContent>
                </Select>
              </>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="Sessões" value={formatNumber(kpis.sessions)} icon={<Globe className="h-4 w-4" />} />
        <KPICard label="Usuários" value={formatNumber(kpis.users)} icon={<Users className="h-4 w-4" />} />
        <KPICard label="Novos Usuários" value={formatNumber(kpis.newUsers)} />
        <KPICard label="Engaged Sessions" value={formatNumber(kpis.engaged)} />
        <KPICard label="Conversões" value={formatNumber(kpis.conversions)} icon={<Target className="h-4 w-4" />} />
        <KPICard label="Receita" value={`R$ ${kpis.revenue.toFixed(2)}`} />
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4">Sessões por Dia — por Source/Medium</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {chartKeys.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} name={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4">Detalhamento por Source / Medium</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Source</TableHead>
                <TableHead className="text-xs">Medium</TableHead>
                <TableHead className="text-xs">Campanha</TableHead>
                <TableHead className="text-xs">Landing Page</TableHead>
                <TableHead className="text-xs text-right">Sessões</TableHead>
                <TableHead className="text-xs text-right">Usuários</TableHead>
                <TableHead className="text-xs text-right">Conversões</TableHead>
                <TableHead className="text-xs text-right">Receita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.slice(0, 50).map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs">{row.source || '(direct)'}</TableCell>
                  <TableCell className="text-xs">{row.medium || '(none)'}</TableCell>
                  <TableCell className="text-xs max-w-[150px] truncate">{row.campaign || '—'}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{row.landing_page || '—'}</TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(row.sessions)}</TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(row.users)}</TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(row.conversions)}</TableCell>
                  <TableCell className="text-xs text-right">R$ {row.revenue.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
