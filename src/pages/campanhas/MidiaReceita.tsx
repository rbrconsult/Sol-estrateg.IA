import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, ZAxis, Legend,
} from 'recharts';
import { DollarSign, AlertTriangle, Lightbulb } from 'lucide-react';
import { useCampaignMetrics } from '@/hooks/useCampaignData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { useGlobalFilters } from '@/contexts/GlobalFilterContext';
import { useFranquiaId } from '@/hooks/useFranquiaId';
import { KPICard } from '@/components/campanhas/KPICard';
import { EmptyState } from '@/components/campanhas/EmptyState';
import { formatCurrencyAbbrev, formatCurrencyFull, formatNumber, formatPercent } from '@/lib/formatters';

const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 };

function useLeadsForReceita() {
  const { user } = useAuth();
  const franquiaId = useFranquiaId();

  return useQuery({
    queryKey: ['sol-leads-receita', franquiaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sol_projetos')
        .select('canal_origem, status, temperatura, closer_nome, etapa_funil, valor_conta')
        .eq('franquia_id', franquiaId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}

export default function CampanhasMidiaReceita() {
  const { data: campaignData, isLoading: loadingCampaigns } = useCampaignMetrics();
  const { data: leads, isLoading: loadingLeads } = useLeadsForReceita();
  const gf = useGlobalFilters();
  const [canalFilter, setCanalFilter] = useState('all');

  const filteredCampaigns = useMemo(() => {
    let rows = campaignData || [];
    if (gf.effectiveDateRange?.from) {
      const from = gf.effectiveDateRange.from.toISOString().slice(0, 10);
      rows = rows.filter(r => r.date >= from);
    }
    if (gf.effectiveDateRange?.to) {
      const to = gf.effectiveDateRange.to.toISOString().slice(0, 10);
      rows = rows.filter(r => r.date <= to);
    }
    if (canalFilter !== 'all') rows = rows.filter(r => r.objetivo === canalFilter);
    return rows;
  }, [campaignData, gf.effectiveDateRange, canalFilter]);

  const byCampaign = useMemo(() => {
    const invMap = new Map<string, { canal: string; campanha: string; investimento: number; leadsMedia: number }>();
    for (const r of filteredCampaigns) {
      const key = `${r.objetivo || 'Meta'}||${r.campaign_name || 'Sem campanha'}`;
      if (!invMap.has(key)) invMap.set(key, { canal: r.objetivo || 'Meta', campanha: r.campaign_name || 'Sem campanha', investimento: 0, leadsMedia: 0 });
      const m = invMap.get(key)!;
      m.investimento += Number(r.spend) || 0;
      m.leadsMedia += Number(r.leads) || 0;
    }

    const leadsArr = leads || [];
    return [...invMap.values()].map(c => {
      const matchingLeads = leadsArr.filter(l => l.canal_origem === c.campanha);
      const isFechado = (l: any) =>
        l.status?.toUpperCase() === 'GANHO';
      const isPipeline = (l: any) => !isFechado(l) && ['SOL SDR','QUALIFICADO','FOLLOW UP'].includes((l.etapa_funil || '').toUpperCase().trim());

      const vendas = matchingLeads.filter(isFechado).length;
      // valor_conta é conta de luz, NÃO receita — usar apenas contagem
      const receita = 0;
      const pipelineAtivo = matchingLeads.filter(isPipeline).length;
      const oportunidades = matchingLeads.filter((l: any) => ['SOL SDR','QUALIFICADO','FOLLOW UP'].includes((l.etapa_funil || '').toUpperCase().trim()) || l.status?.toUpperCase() === 'GANHO').length;
      const ticketMedio = 0;
      const cac = vendas > 0 ? c.investimento / vendas : 0;
      const roas = c.investimento > 0 ? receita / c.investimento : 0;
      const roi = c.investimento > 0 ? ((receita - c.investimento) / c.investimento) * 100 : 0;

      return { ...c, vendas, receita, pipelineAtivo, oportunidades, ticketMedio, cac, roas, roi };
    }).sort((a, b) => b.receita - a.receita);
  }, [filteredCampaigns, leads]);

  const kpis = useMemo(() => {
    const inv = byCampaign.reduce((s, c) => s + c.investimento, 0);
    const vendas = byCampaign.reduce((s, c) => s + c.vendas, 0);
    const receita = byCampaign.reduce((s, c) => s + c.receita, 0);
    const pipeline = byCampaign.reduce((s, c) => s + c.pipelineAtivo, 0);
    const ticketMedio = vendas > 0 ? receita / vendas : 0;
    const cac = vendas > 0 ? inv / vendas : 0;
    const roas = inv > 0 ? receita / inv : 0;
    const roi = inv > 0 ? ((receita - inv) / inv) * 100 : 0;
    return { inv, vendas, receita, pipeline, ticketMedio, cac, roas, roi };
  }, [byCampaign]);

  // Insight
  const insight = useMemo(() => {
    if (byCampaign.length === 0) return null;
    const best = [...byCampaign].sort((a, b) => b.roas - a.roas)[0];
    const worst = [...byCampaign].filter(c => c.investimento > 0 && c.roas < 1).sort((a, b) => a.roas - b.roas)[0];
    let text = '';
    if (best && best.roas > 0) text += `A campanha "${best.campanha}" gerou o maior ROAS com ${best.roas.toFixed(1)}x.`;
    if (worst) text += ` A campanha "${worst.campanha}" tem ROAS de ${worst.roas.toFixed(1)}x — revisar.`;
    return text || null;
  }, [byCampaign]);

  // Chart: invest vs receita
  const invVsReceita = useMemo(() => byCampaign.filter(c => c.investimento > 0 || c.receita > 0).slice(0, 10).map(c => ({
    campanha: c.campanha.length > 18 ? c.campanha.slice(0, 18) + '…' : c.campanha,
    Investimento: Math.round(c.investimento),
    Receita: Math.round(c.receita),
  })), [byCampaign]);

  // Scatter: CAC vs ROAS
  const scatterData = useMemo(() => byCampaign.filter(c => c.cac > 0 && c.roas > 0).map(c => ({
    campanha: c.campanha,
    cac: Math.round(c.cac),
    roas: Number(c.roas.toFixed(2)),
    vendas: c.vendas,
  })), [byCampaign]);

  // ROAS ranking
  const roasRanking = useMemo(() => byCampaign.filter(c => c.investimento > 0).sort((a, b) => b.roas - a.roas).slice(0, 10).map(c => ({
    campanha: c.campanha.length > 20 ? c.campanha.slice(0, 20) + '…' : c.campanha,
    ROAS: Number(c.roas.toFixed(2)),
    fill: c.roas >= 3 ? 'hsl(140,60%,45%)' : c.roas >= 1 ? 'hsl(45,90%,50%)' : 'hsl(0,70%,55%)',
  })), [byCampaign]);

  if (loadingCampaigns || loadingLeads) {
    return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><div className="grid grid-cols-4 gap-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div></div>;
  }

  if (byCampaign.length === 0) {
    return (
      <div className="space-y-6 pb-10">
        <h1 className="text-xl font-bold flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /> Mídia vs Receita</h1>
        <EmptyState message="Nenhum dado de campanha encontrado" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" /> Mídia vs Receita
          </h1>
          <p className="text-sm text-muted-foreground">Retorno financeiro real das campanhas</p>
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

      {/* Insight */}
      {insight && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm">{insight}</p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <KPICard label="Investimento" value={formatCurrencyAbbrev(kpis.inv)} />
        <KPICard label="Vendas" value={formatNumber(kpis.vendas)} />
        <KPICard label="Receita Gerada" value={formatCurrencyAbbrev(kpis.receita)} />
        <KPICard label="Ticket Médio" value={formatCurrencyAbbrev(kpis.ticketMedio)} />
        <KPICard label="CAC" value={formatCurrencyAbbrev(kpis.cac)} />
        <KPICard label="ROAS" value={`${kpis.roas.toFixed(1)}x`} />
        <KPICard label="ROI" value={formatPercent(kpis.roi)} />
        <KPICard label="Pipeline Ativo" value={formatCurrencyAbbrev(kpis.pipeline)} />
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Detalhamento por Campanha</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Canal</TableHead>
                  <TableHead className="text-xs">Campanha</TableHead>
                  <TableHead className="text-xs text-right">Invest.</TableHead>
                  <TableHead className="text-xs text-right">Leads</TableHead>
                  <TableHead className="text-xs text-right">Oport.</TableHead>
                  <TableHead className="text-xs text-right">Vendas</TableHead>
                  <TableHead className="text-xs text-right">Receita</TableHead>
                  <TableHead className="text-xs text-right">Ticket</TableHead>
                  <TableHead className="text-xs text-right">CAC</TableHead>
                  <TableHead className="text-xs text-right">ROAS</TableHead>
                  <TableHead className="text-xs text-right">ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byCampaign.slice(0, 30).map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs"><Badge variant="outline" className="text-[10px]">{c.canal}</Badge></TableCell>
                    <TableCell className="text-xs max-w-[180px] truncate">{c.campanha}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{formatCurrencyAbbrev(c.investimento)}</TableCell>
                    <TableCell className="text-xs text-right">{c.leadsMedia}</TableCell>
                    <TableCell className="text-xs text-right">{c.oportunidades}</TableCell>
                    <TableCell className="text-xs text-right font-semibold">{c.vendas}</TableCell>
                    <TableCell className="text-xs text-right font-mono font-semibold">{formatCurrencyAbbrev(c.receita)}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{formatCurrencyAbbrev(c.ticketMedio)}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{c.cac > 0 ? formatCurrencyAbbrev(c.cac) : '—'}</TableCell>
                    <TableCell className="text-xs text-right">
                      <Badge className={`text-[10px] ${c.roas >= 3 ? 'bg-green-500/20 text-green-400' : c.roas >= 1 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                        {c.roas.toFixed(1)}x
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-right">{formatPercent(c.roi)}</TableCell>
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
          <h3 className="text-sm font-semibold mb-4">Investimento vs Receita</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={invVsReceita}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="campanha" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="Investimento" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">ROAS Ranking</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roasRanking} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="campanha" type="category" tick={{ fontSize: 9 }} width={130} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="ROAS" radius={[0, 4, 4, 0]}>
                {roasRanking.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {scatterData.length > 2 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">CAC vs ROAS — Quadrante de Eficiência</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="cac" name="CAC (R$)" tick={{ fontSize: 10 }} />
              <YAxis dataKey="roas" name="ROAS" tick={{ fontSize: 10 }} />
              <ZAxis dataKey="vendas" range={[40, 400]} name="Vendas" />
              <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={scatterData} fill="hsl(var(--primary))" />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
