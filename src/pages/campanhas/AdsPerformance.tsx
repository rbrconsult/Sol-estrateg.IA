import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Megaphone, AlertTriangle } from 'lucide-react';
import { useCampaignMetrics } from '@/hooks/useCampaignData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { useGlobalFilters } from '@/contexts/GlobalFilterContext';
import { useFranquiaId } from '@/hooks/useFranquiaId';
import { KPICard } from '@/components/campanhas/KPICard';
import { EmptyState } from '@/components/campanhas/EmptyState';
import { formatCurrencyAbbrev, formatNumber, formatPercent } from '@/lib/formatters';

const COLORS = ['hsl(210,80%,55%)', 'hsl(35,90%,55%)', 'hsl(140,60%,45%)', 'hsl(0,70%,55%)', 'hsl(270,60%,55%)'];
const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 };

function useLeadsSolSync() {
  const { user } = useAuth();
  const franquiaId = useFranquiaId();

  return useQuery({
    queryKey: ['sol-leads-campanhas', franquiaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sol_leads_sync')
        .select('canal_origem, status, temperatura, score, closer_nome, etapa_funil, valor_conta')
        .eq('franquia_id', franquiaId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}

export default function CampanhasAdsPerformance() {
  const { data: campaignData, isLoading: loadingCampaigns } = useCampaignMetrics();
  const { data: leads, isLoading: loadingLeads } = useLeadsConsolidados();
  const gf = useGlobalFilters();
  const [canalFilter, setCanalFilter] = useState('all');

  const hasCampaignData = (campaignData || []).length > 0;

  // Filter campaign_metrics by period and canal
  const filteredCampaigns = useMemo(() => {
    let rows = campaignData || [];
    if (gf.effectiveDateRange?.from) {
      const from = gf.effectiveDateRange.from.toISOString().slice(0, 10);
      rows = rows.filter(r => r.data_referencia >= from);
    }
    if (gf.effectiveDateRange?.to) {
      const to = gf.effectiveDateRange.to.toISOString().slice(0, 10);
      rows = rows.filter(r => r.data_referencia <= to);
    }
    if (canalFilter !== 'all') {
      rows = rows.filter(r => r.plataforma === canalFilter);
    }
    return rows;
  }, [campaignData, gf.effectiveDateRange, canalFilter]);

  // Aggregate by campaign
  const byCampaign = useMemo(() => {
    const map = new Map<string, {
      canal: string; campanha: string; investimento: number; impressoes: number;
      cliques: number; leads: number; ctr_sum: number; count: number;
    }>();
    for (const r of filteredCampaigns) {
      const key = `${r.plataforma}||${r.campaign_name || 'Sem campanha'}`;
      if (!map.has(key)) map.set(key, {
        canal: r.plataforma, campanha: r.campaign_name || 'Sem campanha',
        investimento: 0, impressoes: 0, cliques: 0, leads: 0, ctr_sum: 0, count: 0,
      });
      const m = map.get(key)!;
      m.investimento += Number(r.spend) || 0;
      m.impressoes += Number(r.impressions) || 0;
      m.cliques += Number(r.clicks) || 0;
      m.leads += Number(r.leads) || 0;
      m.ctr_sum += Number(r.ctr) || 0;
      m.count += 1;
    }

    // Cross with leads_consolidados for qualificados
    const leadsArr = leads || [];
    return [...map.values()].map(c => {
      const qualificados = leadsArr.filter(l =>
        l.campanha === c.campanha &&
        (l.status?.toUpperCase() === 'QUALIFICADO' || l.etapa?.toUpperCase()?.includes('QUALIFICADO'))
      ).length;
      const cpc = c.cliques > 0 ? c.investimento / c.cliques : 0;
      const cpl = c.leads > 0 ? c.investimento / c.leads : 0;
      const custoQualif = qualificados > 0 ? c.investimento / qualificados : 0;
      const taxaQualif = c.leads > 0 ? (qualificados / c.leads) * 100 : 0;
      return { ...c, qualificados, cpc, cpl, custoQualif, taxaQualif };
    }).sort((a, b) => b.investimento - a.investimento);
  }, [filteredCampaigns, leads]);

  // KPIs
  const kpis = useMemo(() => {
    const inv = byCampaign.reduce((s, c) => s + c.investimento, 0);
    const cliques = byCampaign.reduce((s, c) => s + c.cliques, 0);
    const impressoes = byCampaign.reduce((s, c) => s + c.impressoes, 0);
    const leadsTotal = byCampaign.reduce((s, c) => s + c.leads, 0);
    const qualif = byCampaign.reduce((s, c) => s + c.qualificados, 0);
    const ctr = impressoes > 0 ? (cliques / impressoes) * 100 : 0;
    const cpc = cliques > 0 ? inv / cliques : 0;
    const cpl = leadsTotal > 0 ? inv / leadsTotal : 0;
    const custoQualif = qualif > 0 ? inv / qualif : 0;
    return { inv, cliques, impressoes, leadsTotal, qualif, ctr, cpc, cpl, custoQualif };
  }, [byCampaign]);

  // Rankings
  const topByQualif = useMemo(() => [...byCampaign].sort((a, b) => b.qualificados - a.qualificados).slice(0, 5), [byCampaign]);
  const topByTaxaQualif = useMemo(() => [...byCampaign].filter(c => c.leads >= 3).sort((a, b) => b.taxaQualif - a.taxaQualif).slice(0, 5), [byCampaign]);
  const alertCampaigns = useMemo(() => byCampaign.filter(c => c.leads >= 5 && c.taxaQualif < 10).slice(0, 5), [byCampaign]);

  // Chart data
  const investVsLeads = useMemo(() => byCampaign.slice(0, 10).map(c => ({
    campanha: c.campanha.length > 20 ? c.campanha.slice(0, 20) + '…' : c.campanha,
    Investimento: Math.round(c.investimento),
    Leads: c.leads,
  })), [byCampaign]);

  const leadsVsQualif = useMemo(() => byCampaign.slice(0, 10).map(c => ({
    campanha: c.campanha.length > 20 ? c.campanha.slice(0, 20) + '…' : c.campanha,
    Leads: c.leads,
    Qualificados: c.qualificados,
  })), [byCampaign]);

  const pieData = useMemo(() => {
    const byCanal = new Map<string, number>();
    for (const c of byCampaign) {
      byCanal.set(c.canal, (byCanal.get(c.canal) || 0) + c.leads);
    }
    return [...byCanal.entries()].map(([name, value]) => ({ name, value }));
  }, [byCampaign]);

  if (loadingCampaigns || loadingLeads) {
    return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><div className="grid grid-cols-4 gap-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div></div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" /> Ads Performance
          </h1>
          <p className="text-sm text-muted-foreground">
            Performance de mídia paga — Google Ads + Meta Ads
          </p>
        </div>
        <Select value={canalFilter} onValueChange={setCanalFilter}>
          <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos canais</SelectItem>
            <SelectItem value="meta">Meta Ads</SelectItem>
            <SelectItem value="google">Google Ads</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!hasCampaignData && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <div>
            <p className="text-sm font-medium text-warning">Dados estimados — sem integração de mídia ativa</p>
            <p className="text-xs text-muted-foreground">Configure o webhook de campanhas para dados reais de investimento, impressões e cliques.</p>
          </div>
        </div>
      )}

      {byCampaign.length === 0 ? (
        <EmptyState message="Nenhum dado de campanha encontrado para o período selecionado" />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <KPICard label="Investimento" value={formatCurrencyAbbrev(kpis.inv)} />
            <KPICard label="Cliques" value={formatNumber(kpis.cliques)} />
            <KPICard label="CTR" value={formatPercent(kpis.ctr)} />
            <KPICard label="CPC" value={formatCurrencyAbbrev(kpis.cpc)} />
            <KPICard label="Leads" value={formatNumber(kpis.leadsTotal)} />
            <KPICard label="CPL" value={formatCurrencyAbbrev(kpis.cpl)} />
            <KPICard label="Leads Qualif." value={formatNumber(kpis.qualif)} />
            <KPICard label="Custo/Qualif." value={formatCurrencyAbbrev(kpis.custoQualif)} />
          </div>

          {/* Main Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Performance por Campanha</CardTitle>
            </CardHeader>
            <CardContent>
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
                      <TableHead className="text-xs text-right">Qualif.</TableHead>
                      <TableHead className="text-xs text-right">Custo/Q</TableHead>
                      <TableHead className="text-xs text-right">Taxa Q</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byCampaign.slice(0, 30).map((c, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-[10px]">{c.canal}</Badge>
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{c.campanha}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{formatCurrencyAbbrev(c.investimento)}</TableCell>
                        <TableCell className="text-xs text-right">{formatNumber(c.impressoes)}</TableCell>
                        <TableCell className="text-xs text-right">{formatNumber(c.cliques)}</TableCell>
                        <TableCell className="text-xs text-right">{c.impressoes > 0 ? formatPercent((c.cliques / c.impressoes) * 100) : '—'}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{formatCurrencyAbbrev(c.cpc)}</TableCell>
                        <TableCell className="text-xs text-right font-semibold">{c.leads}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{formatCurrencyAbbrev(c.cpl)}</TableCell>
                        <TableCell className="text-xs text-right font-semibold text-primary">{c.qualificados}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{c.custoQualif > 0 ? formatCurrencyAbbrev(c.custoQualif) : '—'}</TableCell>
                        <TableCell className="text-xs text-right">{formatPercent(c.taxaQualif)}</TableCell>
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
              <h3 className="text-sm font-semibold mb-4">Investimento vs Leads por Campanha</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={investVsLeads} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="campanha" type="category" tick={{ fontSize: 9 }} width={120} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="Investimento" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Leads" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-4">Leads vs Qualificados</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leadsVsQualif}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="campanha" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="Leads" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Qualificados" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Donut Google vs Meta */}
          {pieData.length > 1 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-4">Distribuição de Leads por Canal</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Rankings */}
          <div className="grid lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs">Top 5 — Leads Qualificados</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {topByQualif.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="truncate max-w-[150px]">{c.campanha}</span>
                    <Badge variant="default" className="text-[10px]">{c.qualificados}</Badge>
                  </div>
                ))}
                {topByQualif.length === 0 && <p className="text-xs text-muted-foreground">Sem dados</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs">Top 5 — Taxa Qualificação</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {topByTaxaQualif.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="truncate max-w-[150px]">{c.campanha}</span>
                    <Badge variant="secondary" className="text-[10px]">{formatPercent(c.taxaQualif)}</Badge>
                  </div>
                ))}
                {topByTaxaQualif.length === 0 && <p className="text-xs text-muted-foreground">Sem dados</p>}
              </CardContent>
            </Card>
            <Card className={alertCampaigns.length > 0 ? 'border-warning/30' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-1">
                  {alertCampaigns.length > 0 && <AlertTriangle className="h-3 w-3 text-warning" />}
                  Alto Volume, Baixa Qualificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {alertCampaigns.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="truncate max-w-[120px]">{c.campanha}</span>
                    <span className="text-warning font-mono">{c.leads} leads · {formatPercent(c.taxaQualif)}</span>
                  </div>
                ))}
                {alertCampaigns.length === 0 && <p className="text-xs text-muted-foreground">Nenhum alerta</p>}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
