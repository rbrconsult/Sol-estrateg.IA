import { useMemo } from 'react';
import { Globe, TrendingUp, Users, MousePointer, Clock, ArrowUpRight, Target, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGA4Metrics } from '@/hooks/useCampaignData';
import { useGlobalFilters } from '@/contexts/GlobalFilterContext';
import { KPICard } from '@/components/campanhas/KPICard';
import { EmptyState } from '@/components/campanhas/EmptyState';
import { formatNumber, formatPercent } from '@/lib/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 };

export default function GA4Campanhas() {
  const { data: ga4Data, isLoading } = useGA4Metrics();
  const gf = useGlobalFilters();

  const filtered = useMemo(() => {
    if (!ga4Data) return [];
    let records = ga4Data;
    if (gf.effectiveDateRange?.from) {
      const from = gf.effectiveDateRange.from.toISOString().slice(0, 10);
      records = records.filter(r => r.date >= from);
    }
    if (gf.effectiveDateRange?.to) {
      const to = gf.effectiveDateRange.to.toISOString().slice(0, 10);
      records = records.filter(r => r.date <= to);
    }
    return records;
  }, [ga4Data, gf.effectiveDateRange]);

  const kpis = useMemo(() => {
    const sessions = filtered.reduce((s, r) => s + (r.sessions || 0), 0);
    const users = filtered.reduce((s, r) => s + (r.users || 0), 0);
    const engaged = filtered.reduce((s, r) => s + ((r as any).engaged_sessions || 0), 0);
    const conversions = filtered.reduce((s, r) => s + (r.conversions || 0), 0);
    const newUsers = filtered.reduce((s, r) => s + (r.new_users || 0), 0);
    const avgBounce = filtered.length > 0 ? filtered.reduce((s, r) => s + (r.bounce_rate || 0), 0) / filtered.length : 0;
    const avgDuration = filtered.length > 0 ? filtered.reduce((s, r) => s + (r.avg_session_duration || 0), 0) / filtered.length : 0;
    const engagementRate = sessions > 0 ? (engaged / sessions) * 100 : 0;
    const conversionRate = sessions > 0 ? (conversions / sessions) * 100 : 0;
    return { sessions, users, engaged, conversions, newUsers, avgBounce, avgDuration, engagementRate, conversionRate };
  }, [filtered]);

  // Table 1: by source/medium/campaign
  const sourceMediumData = useMemo(() => {
    const map = new Map<string, { source: string; medium: string; campaign: string; sessions: number; users: number; engaged: number; conversions: number }>();
    for (const r of filtered) {
      const key = `${r.source || '(direct)'}||${r.medium || '(none)'}||${r.campaign || '(not set)'}`;
      if (!map.has(key)) map.set(key, { source: r.source || '(direct)', medium: r.medium || '(none)', campaign: r.campaign || '(not set)', sessions: 0, users: 0, engaged: 0, conversions: 0 });
      const m = map.get(key)!;
      m.sessions += r.sessions || 0;
      m.users += r.users || 0;
      m.engaged += (r as any).engaged_sessions || 0;
      m.conversions += r.conversions || 0;
    }
    return [...map.values()].sort((a, b) => b.sessions - a.sessions);
  }, [filtered]);

  // Table 2: by landing page
  const landingData = useMemo(() => {
    const map = new Map<string, { page: string; sessions: number; engaged: number; conversions: number; bounceSum: number; count: number }>();
    for (const r of filtered) {
      const key = r.landing_page || '/';
      if (!map.has(key)) map.set(key, { page: key, sessions: 0, engaged: 0, conversions: 0, bounceSum: 0, count: 0 });
      const m = map.get(key)!;
      m.sessions += r.sessions || 0;
      m.engaged += (r as any).engaged_sessions || 0;
      m.conversions += r.conversions || 0;
      m.bounceSum += r.bounce_rate || 0;
      m.count += 1;
    }
    return [...map.values()].map(p => ({
      ...p,
      engagementRate: p.sessions > 0 ? (p.engaged / p.sessions) * 100 : 0,
      conversionRate: p.sessions > 0 ? (p.conversions / p.sessions) * 100 : 0,
      bounceRate: p.count > 0 ? p.bounceSum / p.count : 0,
    })).sort((a, b) => b.sessions - a.sessions);
  }, [filtered]);

  // Charts
  const sessionsByCampaign = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      const key = r.campaign || '(not set)';
      map.set(key, (map.get(key) || 0) + (r.sessions || 0));
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([campanha, sessions]) => ({
      campanha: campanha.length > 20 ? campanha.slice(0, 20) + '…' : campanha, sessions,
    }));
  }, [filtered]);

  const topLandingPages = useMemo(() => landingData.filter(p => p.conversions > 0).sort((a, b) => b.conversions - a.conversions).slice(0, 8).map(p => ({
    page: p.page.length > 30 ? '…' + p.page.slice(-28) : p.page, conversions: p.conversions,
  })), [landingData]);

  // Insight
  const insight = useMemo(() => {
    if (landingData.length === 0) return null;
    const avgConv = kpis.conversionRate;
    const best = landingData.filter(p => p.sessions >= 5).sort((a, b) => b.conversionRate - a.conversionRate)[0];
    const worst = landingData.filter(p => p.sessions >= 10 && p.conversionRate < avgConv).sort((a, b) => a.conversionRate - b.conversionRate)[0];
    let text = '';
    if (best) text += `A landing page "${best.page}" tem ${best.conversionRate.toFixed(1)}% de conversão — acima da média.`;
    if (worst) text += ` A página "${worst.page}" recebe ${worst.sessions} sessões mas converte apenas ${worst.conversionRate.toFixed(1)}% — revisar.`;
    return text || null;
  }, [landingData, kpis.conversionRate]);

  if (isLoading) {
    return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><div className="grid grid-cols-4 gap-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div></div>;
  }

  if (!ga4Data || ga4Data.length === 0) {
    return (
      <div className="space-y-6 pb-10">
        <h1 className="text-xl font-bold flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> GA4 — Aquisição & Conversão</h1>
        <EmptyState message="Nenhum dado GA4 encontrado. Configure o webhook para receber dados." />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" /> GA4 — Aquisição & Conversão
        </h1>
        <p className="text-sm text-muted-foreground">Comportamento e conversão no site após o clique</p>
      </div>

      {insight && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm">{insight}</p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <KPICard label="Sessões" value={formatNumber(kpis.sessions)} icon={<Globe className="h-4 w-4" />} />
        <KPICard label="Usuários" value={formatNumber(kpis.users)} icon={<Users className="h-4 w-4" />} />
        <KPICard label="Engajadas" value={formatNumber(kpis.engaged)} />
        <KPICard label="Taxa Engaj." value={formatPercent(kpis.engagementRate)} />
        <KPICard label="Tempo Médio" value={`${Math.round(kpis.avgDuration)}s`} icon={<Clock className="h-4 w-4" />} />
        <KPICard label="Conversões" value={formatNumber(kpis.conversions)} icon={<Target className="h-4 w-4" />} />
        <KPICard label="Taxa Conv." value={formatPercent(kpis.conversionRate)} />
        <KPICard label="Bounce Rate" value={formatPercent(kpis.avgBounce)} icon={<MousePointer className="h-4 w-4" />} />
      </div>

      {/* Table 1: Source/Medium */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Por Source / Medium / Campaign</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Source</TableHead>
                  <TableHead className="text-xs">Medium</TableHead>
                  <TableHead className="text-xs">Campaign</TableHead>
                  <TableHead className="text-xs text-right">Sessões</TableHead>
                  <TableHead className="text-xs text-right">Usuários</TableHead>
                  <TableHead className="text-xs text-right">Engajadas</TableHead>
                  <TableHead className="text-xs text-right">Taxa Eng.</TableHead>
                  <TableHead className="text-xs text-right">Conv.</TableHead>
                  <TableHead className="text-xs text-right">Taxa Conv.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sourceMediumData.slice(0, 30).map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{r.source}</TableCell>
                    <TableCell className="text-xs">{r.medium}</TableCell>
                    <TableCell className="text-xs max-w-[150px] truncate">{r.campaign}</TableCell>
                    <TableCell className="text-xs text-right">{formatNumber(r.sessions)}</TableCell>
                    <TableCell className="text-xs text-right">{formatNumber(r.users)}</TableCell>
                    <TableCell className="text-xs text-right">{formatNumber(r.engaged)}</TableCell>
                    <TableCell className="text-xs text-right">{r.sessions > 0 ? formatPercent((r.engaged / r.sessions) * 100) : '—'}</TableCell>
                    <TableCell className="text-xs text-right font-semibold">{r.conversions}</TableCell>
                    <TableCell className="text-xs text-right">{r.sessions > 0 ? formatPercent((r.conversions / r.sessions) * 100) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Table 2: Landing Pages */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Por Landing Page</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Landing Page</TableHead>
                  <TableHead className="text-xs text-right">Sessões</TableHead>
                  <TableHead className="text-xs text-right">Taxa Eng.</TableHead>
                  <TableHead className="text-xs text-right">Conv.</TableHead>
                  <TableHead className="text-xs text-right">Taxa Conv.</TableHead>
                  <TableHead className="text-xs text-right">Bounce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {landingData.slice(0, 20).map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs font-mono max-w-[250px] truncate">{p.page}</TableCell>
                    <TableCell className="text-xs text-right">{formatNumber(p.sessions)}</TableCell>
                    <TableCell className="text-xs text-right">{formatPercent(p.engagementRate)}</TableCell>
                    <TableCell className="text-xs text-right font-semibold">
                      <Badge variant={p.conversions > 0 ? 'default' : 'secondary'} className="text-[10px]">{p.conversions}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-right">{formatPercent(p.conversionRate)}</TableCell>
                    <TableCell className="text-xs text-right">{formatPercent(p.bounceRate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">Sessões por Campanha</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sessionsByCampaign}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="campanha" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="sessions" name="Sessões" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">Top Landing Pages por Conversão</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topLandingPages} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="page" type="category" tick={{ fontSize: 8 }} width={180} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="conversions" name="Conversões" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Funnel: Sessions → Engaged → Conversions */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4">Funil de Conversão</h3>
        <div className="flex items-center justify-center gap-2">
          {[
            { label: 'Sessões', value: kpis.sessions, pct: '100%' },
            { label: 'Engajadas', value: kpis.engaged, pct: kpis.sessions > 0 ? formatPercent((kpis.engaged / kpis.sessions) * 100) : '0%' },
            { label: 'Conversões', value: kpis.conversions, pct: kpis.sessions > 0 ? formatPercent((kpis.conversions / kpis.sessions) * 100) : '0%' },
          ].map((step, i, arr) => (
            <div key={i} className="flex items-center gap-2">
              <div className="text-center">
                <div className="bg-primary/10 rounded-lg px-6 py-4 min-w-[120px]" style={{ opacity: 1 - i * 0.2 }}>
                  <p className="text-lg font-bold">{formatNumber(step.value)}</p>
                  <p className="text-xs text-muted-foreground">{step.label}</p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{step.pct}</p>
              </div>
              {i < arr.length - 1 && <span className="text-muted-foreground text-lg">→</span>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
