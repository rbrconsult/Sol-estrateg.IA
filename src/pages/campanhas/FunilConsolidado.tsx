import { useState, useMemo } from 'react';
import { useSolLeads, useSolEquipe, useSolProjetos, useSolConversions, useSolFunis } from '@/hooks/useSolData';
import { usePeriodo } from '@/hooks/usePeriodo';
import { CampanhaFilters } from '@/components/campanhas/CampanhaFilters';
import { SyncBadge } from '@/components/campanhas/SyncBadge';
import { KPICard } from '@/components/campanhas/KPICard';
import { EmptyState } from '@/components/campanhas/EmptyState';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, DollarSign, Users, Target, TrendingUp, Clock } from 'lucide-react';
import { formatCurrency, formatNumber, formatPct } from '@/hooks/useCampaignObs';
import { useFranquiaId } from '@/hooks/useFranquiaId';
import { getStatusLabel } from '@/lib/leadClassification';

const FUNNEL_STAGES = ['TRAFEGO PAGO', 'SOL SDR', 'FOLLOW UP', 'QUALIFICADO', 'CONTATO REALIZADO', 'PROPOSTA'];
const STAGE_COLORS: Record<string, string> = {
  'TRAFEGO PAGO': 'hsl(210,70%,55%)',
  'SOL SDR': 'hsl(35,90%,55%)',
  'FOLLOW UP': 'hsl(270,60%,55%)',
  'QUALIFICADO': 'hsl(142,70%,45%)',
  'CONTATO REALIZADO': 'hsl(200,70%,50%)',
  'PROPOSTA': 'hsl(250,60%,55%)',
};

function FunnelBar({ label, value, maxValue, prevValue, color }: { label: string; value: number; maxValue: number; prevValue?: number; color: string }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const convRate = prevValue && prevValue > 0 ? ((value / prevValue) * 100).toFixed(1) : null;
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 text-xs font-medium text-right">{getStatusLabel(label)}</div>
      <div className="flex-1 relative">
        <div className="h-10 rounded" style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: color, transition: 'width 0.6s ease' }}>
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white">
            {formatNumber(value)}
          </span>
        </div>
      </div>
      {convRate && <div className="w-16 text-xs text-muted-foreground text-right">{convRate}%</div>}
    </div>
  );
}

export default function FunilConsolidado() {
  const { periodo, setPeriodo, range } = usePeriodo();
  const franquiaId = useFranquiaId();
  const { data: leads, isLoading: l1 } = useSolLeads();
  const { data: equipe, isLoading: l2 } = useSolEquipe();
  const { data: projetos, isLoading: l3 } = useSolProjetos();
  const { data: conversions, isLoading: l4 } = useSolConversions();
  const [closerFilter, setCloserFilter] = useState('all');

  const isLoading = l1 || l2 || l3 || l4;

  const closers = useMemo(() => {
    if (!equipe) return [];
    return equipe.filter(e => e.ativo).map(e => e.nome || '').filter(Boolean);
  }, [equipe]);

  const filtered = useMemo(() => {
    if (!leads) return [];
    if (closerFilter === 'all') return leads;
    return leads.filter(l => l.closer_nome === closerFilter);
  }, [leads, closerFilter]);

  // Funnel counts
  const funnelData = useMemo(() => {
    const counts: Record<string, number> = {};
    FUNNEL_STAGES.forEach(s => counts[s] = 0);
    filtered.forEach(l => {
      const s = (l.etapa_funil || 'TRAFEGO PAGO').toUpperCase().trim();
      if (counts[s] !== undefined) counts[s]++;
    });
    return FUNNEL_STAGES.map(s => ({ label: s, value: counts[s], color: STAGE_COLORS[s] || 'hsl(210,50%,50%)' }));
  }, [filtered]);

  const maxFunnel = Math.max(...funnelData.map(d => d.value), 1);

  // Rates
  const rates = useMemo(() => {
    const total = filtered.length || 1;
    const qualificados = filtered.filter(l => (l.etapa_funil || '').toUpperCase().trim() === 'QUALIFICADO').length;
    const ganhos = filtered.filter(l => l.status === 'GANHO').length;
    const closerPool = filtered.filter(l => ['GANHO', 'PERDIDO'].includes(l.status || '') || (l.etapa_funil || '').toUpperCase().trim() === 'QUALIFICADO').length;
    const taxaQual = (qualificados / total) * 100;
    const taxaFech = closerPool > 0 ? (ganhos / closerPool) * 100 : 0;
    const pipelineValor = filtered.reduce((a, l) => a + (parseFloat(l.valor_conta || '0') || 0), 0);
    return { total, taxaQual, taxaFech, pipelineValor };
  }, [filtered]);

  // Closer performance
  const closerPerf = useMemo(() => {
    if (!filtered) return [];
    const map: Record<string, { total: number; qualificados: number; ganhos: number; perdidos: number; valor: number }> = {};
    filtered.filter(l => l.closer_nome).forEach(l => {
      const c = l.closer_nome!;
      if (!map[c]) map[c] = { total: 0, qualificados: 0, ganhos: 0, perdidos: 0, valor: 0 };
      map[c].total++;
      if (l.status === 'QUALIFICADO') map[c].qualificados++;
      if (l.status === 'GANHO') map[c].ganhos++;
      if (l.status === 'PERDIDO') map[c].perdidos++;
      map[c].valor += parseFloat(l.valor_conta || '0') || 0;
    });
    return Object.entries(map).map(([nome, d]) => ({
      nome, ...d,
      taxaFechamento: (d.ganhos + d.perdidos) > 0 ? (d.ganhos / (d.ganhos + d.perdidos)) * 100 : 0,
    })).sort((a, b) => b.total - a.total);
  }, [filtered]);

  // Conversions summary
  const convSummary = useMemo(() => {
    if (!conversions) return [];
    const map: Record<string, { total: number; capi: number; google: number; receita: number }> = {};
    conversions.forEach(c => {
      const ev = c.event_name || 'Unknown';
      if (!map[ev]) map[ev] = { total: 0, capi: 0, google: 0, receita: 0 };
      map[ev].total++;
      if (c.capi_sent) map[ev].capi++;
      if (c.google_sent) map[ev].google++;
      map[ev].receita += c.value || 0;
    });
    return Object.entries(map).map(([event, d]) => ({ event, ...d }));
  }, [conversions]);

  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-64 mb-4" /><div className="space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div></div>;
  if (!leads?.length) return <div className="p-6"><div className="flex justify-between items-center mb-4"><h1 className="text-xl font-bold">Funil Lead → Venda</h1><SyncBadge franquiaId={franquiaId} /></div><EmptyState /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold">Funil Lead → Venda</h1>
        <div className="flex items-center gap-3">
          <SyncBadge franquiaId={franquiaId} />
          <Select value={closerFilter} onValueChange={setCloserFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Closer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Closers</SelectItem>
              {closers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <CampanhaFilters periodo={periodo} setPeriodo={setPeriodo} selectedCampanhas={[]} setSelectedCampanhas={() => {}} campanhas={[]} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPICard label="Leads Recebidos" value={formatNumber(rates.total)} icon={<Users className="h-4 w-4" />} />
        <KPICard label="Taxa Qualif." value={formatPct(rates.taxaQual)} icon={<Target className="h-4 w-4" />} />
        <KPICard label="Taxa Fecham." value={formatPct(rates.taxaFech)} icon={<TrendingUp className="h-4 w-4" />} />
        <KPICard label="Pipeline Valor" value={formatCurrency(rates.pipelineValor)} icon={<DollarSign className="h-4 w-4" />} />
        <KPICard label="Closers Ativos" value={formatNumber(closers.length)} />
      </div>

      {/* Visual Funnel */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-6">Funil Visual</h3>
        <div className="space-y-3">
          {funnelData.map((step, i) => (
            <FunnelBar key={step.label} label={step.label} value={step.value} maxValue={maxFunnel} color={step.color} prevValue={i > 0 ? funnelData[i - 1].value : undefined} />
          ))}
        </div>
      </Card>

      {/* Closer performance table */}
      {closerPerf.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">Performance por Closer</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Closer</TableHead>
                  <TableHead className="text-xs text-right">Total</TableHead>
                  <TableHead className="text-xs text-right">Qualificados</TableHead>
                  <TableHead className="text-xs text-right">Ganhos</TableHead>
                  <TableHead className="text-xs text-right">Perdidos</TableHead>
                  <TableHead className="text-xs text-right">Taxa Fechamento</TableHead>
                  <TableHead className="text-xs text-right">Pipeline R$</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closerPerf.map(c => (
                  <TableRow key={c.nome}>
                    <TableCell className="text-xs font-medium">{c.nome}</TableCell>
                    <TableCell className="text-xs text-right">{c.total}</TableCell>
                    <TableCell className="text-xs text-right">{c.qualificados}</TableCell>
                    <TableCell className="text-xs text-right">{c.ganhos}</TableCell>
                    <TableCell className="text-xs text-right">{c.perdidos}</TableCell>
                    <TableCell className="text-xs text-right">{c.taxaFechamento.toFixed(1)}%</TableCell>
                    <TableCell className="text-xs text-right">{formatCurrency(c.valor)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Bottom: Conversions + Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {convSummary.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Conversions CAPI/Google</h3>
            <div className="space-y-2">
              {convSummary.map(c => (
                <div key={c.event} className="flex items-center justify-between text-xs border-b border-border pb-1">
                  <span className="font-medium">{c.event}</span>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[10px]">Total: {c.total}</Badge>
                    <Badge variant="outline" className="text-[10px] text-green-500 border-green-500/30">CAPI: {c.capi}</Badge>
                    <Badge variant="outline" className="text-[10px] text-blue-500 border-blue-500/30">Google: {c.google}</Badge>
                    <span className="text-muted-foreground">{formatCurrency(c.receita)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {projetos && projetos.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Timeline Eventos SM</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {projetos.slice(0, 20).map(p => (
                <div key={p.key} className="flex items-center justify-between text-xs border-b border-border pb-1">
                  <div>
                    <span className="font-medium">{p.identificador || p.project_id}</span>
                    <span className="text-muted-foreground ml-2">{p.etapa}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{p.evento}</Badge>
                    <span className="text-muted-foreground">{p.ts_evento ? new Date(p.ts_evento).toLocaleDateString('pt-BR') : '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
