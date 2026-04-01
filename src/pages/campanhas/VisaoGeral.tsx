import { useState, useMemo } from 'react';
import { useMetaAds, useGoogleAds, useGA4, useLastSync, sumField, groupByDate, formatCurrency, formatNumber, formatPct } from '@/hooks/useCampaignObs';
import { useSolLeads } from '@/hooks/useSolData';
import { useFranquiaId } from '@/hooks/useFranquiaId';
import { usePeriodo } from '@/hooks/usePeriodo';
import { CampanhaFilters } from '@/components/campanhas/CampanhaFilters';
import { SyncBadge } from '@/components/campanhas/SyncBadge';
import { KPICard } from '@/components/campanhas/KPICard';
import { EmptyState } from '@/components/campanhas/EmptyState';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Users, Target, TrendingUp, MousePointer, Globe, Eye, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

const CHANNEL_COLORS: Record<string, string> = {
  meta: 'hsl(210, 80%, 55%)',
  google: 'hsl(35, 90%, 55%)',
  ga4: 'hsl(142, 70%, 45%)',
};
const CHANNEL_LABELS: Record<string, string> = {
  meta: 'Meta Ads',
  google: 'Google Ads',
  ga4: 'Site (GA4)',
};

export default function CampanhasVisaoGeral() {
  const { periodo, setPeriodo, range } = usePeriodo();
  const franquiaId = useFranquiaId();
  const { data: metaRows, isLoading: l1 } = useMetaAds(franquiaId, range);
  const { data: googleRows, isLoading: l2 } = useGoogleAds(franquiaId, range);
  const { data: ga4Rows, isLoading: l3 } = useGA4(franquiaId, range);
  const { data: leads, isLoading: l4 } = useSolLeads();
  const isLoading = l1 || l2 || l3 || l4;

  // ── Meta KPIs ──
  const meta = useMemo(() => {
    if (!metaRows?.length) return { spend: 0, impressions: 0, clicks: 0, leads: 0, reach: 0, ctr: 0, cpc: 0, cpl: 0 };
    const spend = sumField(metaRows, 'spend');
    const impressions = sumField(metaRows, 'impressions');
    const clicks = sumField(metaRows, 'clicks');
    const ld = sumField(metaRows, 'leads');
    const reach = sumField(metaRows, 'reach');
    return {
      spend, impressions, clicks, leads: ld, reach,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      cpl: ld > 0 ? spend / ld : 0,
    };
  }, [metaRows]);

  // ── Google KPIs ──
  const google = useMemo(() => {
    if (!googleRows?.length) return { spend: 0, impressions: 0, clicks: 0, conversions: 0, ctr: 0, cpc: 0, cpa: 0 };
    const spend = sumField(googleRows, 'cost');
    const impressions = sumField(googleRows, 'impressions');
    const clicks = sumField(googleRows, 'clicks');
    const conversions = sumField(googleRows, 'conversions');
    return {
      spend, impressions, clicks, conversions,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      cpa: conversions > 0 ? spend / conversions : 0,
    };
  }, [googleRows]);

  // ── GA4 KPIs ──
  const ga4 = useMemo(() => {
    if (!ga4Rows?.length) return { sessions: 0, users: 0, newUsers: 0, conversions: 0, engaged: 0 };
    return {
      sessions: sumField(ga4Rows, 'sessions'),
      users: sumField(ga4Rows, 'users'),
      newUsers: sumField(ga4Rows, 'new_users'),
      conversions: sumField(ga4Rows, 'conversions'),
      engaged: sumField(ga4Rows, 'engaged_sessions'),
    };
  }, [ga4Rows]);

  // ── Totais consolidados ──
  const totals = useMemo(() => {
    const totalSpend = meta.spend + google.spend;
    const totalClicks = meta.clicks + google.clicks;
    const totalImpressions = meta.impressions + google.impressions;
    const totalLeadsAds = meta.leads + google.conversions;
    return {
      totalSpend, totalClicks, totalImpressions, totalLeadsAds,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      cpl: totalLeadsAds > 0 ? totalSpend / totalLeadsAds : 0,
    };
  }, [meta, google]);

  // ── Cruzamento Leads SOL × Canal ──
  const crossRef = useMemo(() => {
    if (!leads?.length) return [];
    const channels: Record<string, { total: number; qualificados: number; ganhos: number; custoIA: number }> = {};
    leads.forEach(l => {
      const canal = l.canal_origem || 'Desconhecido';
      if (!channels[canal]) channels[canal] = { total: 0, qualificados: 0, ganhos: 0, custoIA: 0 };
      channels[canal].total++;
      if (['QUALIFICADO', 'GANHO'].includes(l.status || '')) channels[canal].qualificados++;
      if (l.status === 'GANHO') channels[canal].ganhos++;
      channels[canal].custoIA += l.custo_total_usd || 0;
    });
    return Object.entries(channels)
      .map(([canal, d]) => {
        const adSpend = canal.toLowerCase().includes('meta') ? meta.spend
          : canal.toLowerCase().includes('google') ? google.spend : 0;
        return {
          canal, ...d,
          adSpend,
          cplTotal: d.total > 0 ? (adSpend + d.custoIA * 5) / d.total : 0,
          cplQualificado: d.qualificados > 0 ? (adSpend + d.custoIA * 5) / d.qualificados : 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [leads, meta.spend, google.spend]);

  // ── Daily spend chart ──
  const dailyChart = useMemo(() => {
    const dateMap = new Map<string, { meta: number; google: number; ga4Sessions: number }>();
    (metaRows || []).forEach((r: any) => {
      const d = String(r.date).slice(0, 10);
      if (!dateMap.has(d)) dateMap.set(d, { meta: 0, google: 0, ga4Sessions: 0 });
      dateMap.get(d)!.meta += Number(r.spend) || 0;
    });
    (googleRows || []).forEach((r: any) => {
      const d = String(r.date).slice(0, 10);
      if (!dateMap.has(d)) dateMap.set(d, { meta: 0, google: 0, ga4Sessions: 0 });
      dateMap.get(d)!.google += Number(r.cost) || 0;
    });
    (ga4Rows || []).forEach((r: any) => {
      const d = String(r.date).slice(0, 10);
      if (!dateMap.has(d)) dateMap.set(d, { meta: 0, google: 0, ga4Sessions: 0 });
      dateMap.get(d)!.ga4Sessions += Number(r.sessions) || 0;
    });
    return [...dateMap.entries()]
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [metaRows, googleRows, ga4Rows]);

  // ── Spend distribution pie ──
  const spendPie = useMemo(() => [
    { name: 'Meta Ads', value: meta.spend, color: CHANNEL_COLORS.meta },
    { name: 'Google Ads', value: google.spend, color: CHANNEL_COLORS.google },
  ].filter(s => s.value > 0), [meta.spend, google.spend]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const hasData = (metaRows?.length || 0) + (googleRows?.length || 0) + (ga4Rows?.length || 0) > 0;

  if (!hasData) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Campanhas — Visão Geral</h1>
          <SyncBadge franquiaId={franquiaId} />
        </div>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold">Campanhas — Visão Geral</h1>
        <div className="flex items-center gap-3">
          <SyncBadge franquiaId={franquiaId} />
          <CampanhaFilters periodo={periodo} setPeriodo={setPeriodo} campanha="all" setCampanha={() => {}} campanhas={[]} />
        </div>
      </div>

      {/* ── Consolidado Total ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <KPICard label="Investimento Total" value={formatCurrency(totals.totalSpend)} icon={<DollarSign className="h-4 w-4" />} />
        <KPICard label="Impressões" value={formatNumber(totals.totalImpressions)} icon={<Eye className="h-4 w-4" />} />
        <KPICard label="Cliques" value={formatNumber(totals.totalClicks)} detail={`CTR: ${formatPct(totals.ctr)}`} icon={<MousePointer className="h-4 w-4" />} />
        <KPICard label="CPC Médio" value={formatCurrency(totals.cpc)} />
        <KPICard label="Leads (Ads)" value={formatNumber(totals.totalLeadsAds)} detail={`CPL: ${formatCurrency(totals.cpl)}`} icon={<Users className="h-4 w-4" />} />
        <KPICard label="Sessões Site" value={formatNumber(ga4.sessions)} detail={`${formatNumber(ga4.users)} usuários`} icon={<Globe className="h-4 w-4" />} />
        <KPICard label="Leads SOL" value={formatNumber(leads?.length || 0)} detail={`${crossRef.reduce((a, c) => a + c.qualificados, 0)} qualificados`} icon={<Target className="h-4 w-4" />} />
      </div>

      {/* ── Cards por Plataforma ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Meta */}
        <Card className="p-4 border-l-4" style={{ borderLeftColor: CHANNEL_COLORS.meta }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHANNEL_COLORS.meta }} />
            Meta Ads
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <span className="text-muted-foreground">Investimento</span><span className="font-medium text-right">{formatCurrency(meta.spend)}</span>
            <span className="text-muted-foreground">Impressões</span><span className="font-medium text-right">{formatNumber(meta.impressions)}</span>
            <span className="text-muted-foreground">Alcance</span><span className="font-medium text-right">{formatNumber(meta.reach)}</span>
            <span className="text-muted-foreground">Cliques</span><span className="font-medium text-right">{formatNumber(meta.clicks)}</span>
            <span className="text-muted-foreground">CTR</span><span className="font-medium text-right">{formatPct(meta.ctr)}</span>
            <span className="text-muted-foreground">CPC</span><span className="font-medium text-right">{formatCurrency(meta.cpc)}</span>
            <span className="text-muted-foreground">Leads</span><span className="font-medium text-right">{formatNumber(meta.leads)}</span>
            <span className="text-muted-foreground">CPL</span><span className="font-medium text-right">{formatCurrency(meta.cpl)}</span>
          </div>
        </Card>

        {/* Google */}
        <Card className="p-4 border-l-4" style={{ borderLeftColor: CHANNEL_COLORS.google }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHANNEL_COLORS.google }} />
            Google Ads
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <span className="text-muted-foreground">Investimento</span><span className="font-medium text-right">{formatCurrency(google.spend)}</span>
            <span className="text-muted-foreground">Impressões</span><span className="font-medium text-right">{formatNumber(google.impressions)}</span>
            <span className="text-muted-foreground">Cliques</span><span className="font-medium text-right">{formatNumber(google.clicks)}</span>
            <span className="text-muted-foreground">CTR</span><span className="font-medium text-right">{formatPct(google.ctr)}</span>
            <span className="text-muted-foreground">CPC</span><span className="font-medium text-right">{formatCurrency(google.cpc)}</span>
            <span className="text-muted-foreground">Conversões</span><span className="font-medium text-right">{formatNumber(google.conversions)}</span>
            <span className="text-muted-foreground">CPA</span><span className="font-medium text-right">{formatCurrency(google.cpa)}</span>
            <span className="text-muted-foreground">—</span><span className="text-right">—</span>
          </div>
        </Card>

        {/* GA4 */}
        <Card className="p-4 border-l-4" style={{ borderLeftColor: CHANNEL_COLORS.ga4 }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHANNEL_COLORS.ga4 }} />
            Site (GA4)
            <Badge variant="outline" className="text-[9px] ml-auto">Rastreamento</Badge>
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <span className="text-muted-foreground">Sessões</span><span className="font-medium text-right">{formatNumber(ga4.sessions)}</span>
            <span className="text-muted-foreground">Usuários</span><span className="font-medium text-right">{formatNumber(ga4.users)}</span>
            <span className="text-muted-foreground">Novos Usuários</span><span className="font-medium text-right">{formatNumber(ga4.newUsers)}</span>
            <span className="text-muted-foreground">Sessões Engajadas</span><span className="font-medium text-right">{formatNumber(ga4.engaged)}</span>
            <span className="text-muted-foreground">Conversões</span><span className="font-medium text-right">{formatNumber(ga4.conversions)}</span>
            <span className="text-muted-foreground">Taxa Engaj.</span><span className="font-medium text-right">{ga4.sessions > 0 ? formatPct((ga4.engaged / ga4.sessions) * 100) : '0%'}</span>
            <span className="text-muted-foreground">—</span><span className="text-right">—</span>
            <span className="text-muted-foreground">—</span><span className="text-right">—</span>
          </div>
        </Card>
      </div>

      {/* ── Gráficos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily spend + sessions */}
        <Card className="p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Investimento + Sessões por Dia</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyChart}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="meta" name="Meta (R$)" stroke={CHANNEL_COLORS.meta} strokeWidth={2} dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="google" name="Google (R$)" stroke={CHANNEL_COLORS.google} strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="ga4Sessions" name="Sessões GA4" stroke={CHANNEL_COLORS.ga4} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie chart */}
        <Card className="p-4 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold mb-4">Distribuição de Investimento</h3>
          {spendPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={spendPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {spendPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground">Sem dados de investimento</p>
          )}
        </Card>
      </div>

      {/* ── Cruzamento Custo × Resultado SOL ── */}
      {crossRef.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-1">Cruzamento: Custo (Ads) × Resultado (SOL)</h3>
          <p className="text-[11px] text-muted-foreground mb-4">CPL Total = (Investimento Ads + Custo IA em R$) ÷ Leads</p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Canal</TableHead>
                  <TableHead className="text-xs text-right">Leads</TableHead>
                  <TableHead className="text-xs text-right">Qualificados</TableHead>
                  <TableHead className="text-xs text-right">Ganhos</TableHead>
                  <TableHead className="text-xs text-right">Invest. Ads</TableHead>
                  <TableHead className="text-xs text-right">Custo IA</TableHead>
                  <TableHead className="text-xs text-right">CPL Total</TableHead>
                  <TableHead className="text-xs text-right">CPL Qualif.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crossRef.map(c => (
                  <TableRow key={c.canal}>
                    <TableCell className="text-xs font-medium">{c.canal}</TableCell>
                    <TableCell className="text-xs text-right">{c.total}</TableCell>
                    <TableCell className="text-xs text-right">{c.qualificados}</TableCell>
                    <TableCell className="text-xs text-right">{c.ganhos}</TableCell>
                    <TableCell className="text-xs text-right">{formatCurrency(c.adSpend)}</TableCell>
                    <TableCell className="text-xs text-right">{formatCurrency(c.custoIA * 5)}</TableCell>
                    <TableCell className="text-xs text-right font-semibold">{formatCurrency(c.cplTotal)}</TableCell>
                    <TableCell className="text-xs text-right font-semibold">{c.cplQualificado > 0 ? formatCurrency(c.cplQualificado) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
