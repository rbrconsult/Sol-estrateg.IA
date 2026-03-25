import { useState, useMemo } from 'react';
import { useMediaPerformance, useMetaAds, useWhatsApp, sumField, formatCurrency, formatNumber, formatPct } from '@/hooks/useCampaignObs';
import { usePeriodo } from '@/hooks/usePeriodo';
import { CampanhaFilters } from '@/components/campanhas/CampanhaFilters';
import { SyncBadge } from '@/components/campanhas/SyncBadge';
import { KPICard } from '@/components/campanhas/KPICard';
import { EmptyState } from '@/components/campanhas/EmptyState';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ArrowRight, DollarSign, Users, Target, TrendingUp } from 'lucide-react';

const FRANQUIA = 'evolve_olimpia';

interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

function FunnelBar({ step, maxValue, prevValue }: { step: FunnelStep; maxValue: number; prevValue?: number }) {
  const pct = maxValue > 0 ? (step.value / maxValue) * 100 : 0;
  const convRate = prevValue && prevValue > 0 ? ((step.value / prevValue) * 100).toFixed(1) : null;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-xs font-medium text-right">{step.label}</div>
      <div className="flex-1 relative">
        <div className="h-10 rounded" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: step.color, transition: 'width 0.6s ease' }}>
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white">
            {formatNumber(step.value)}
          </span>
        </div>
      </div>
      {convRate && (
        <div className="w-16 text-xs text-muted-foreground text-right">{convRate}%</div>
      )}
    </div>
  );
}

export default function FunilConsolidado() {
  const { periodo, setPeriodo, range } = usePeriodo();
  const [campanha, setCampanha] = useState('all');
  const { data: mediaRows, isLoading: l1 } = useMediaPerformance(FRANQUIA, range);
  const { data: metaRows, isLoading: l2 } = useMetaAds(FRANQUIA, range);
  const { data: waRows, isLoading: l3 } = useWhatsApp(FRANQUIA, range);

  const isLoading = l1 || l2 || l3;

  const campanhas = useMemo(() => {
    if (!mediaRows) return [];
    return [...new Set(mediaRows.map((r: any) => r.campaign_name).filter(Boolean))] as string[];
  }, [mediaRows]);

  const funnel = useMemo(() => {
    const mf = campanha === 'all' ? (mediaRows || []) : (mediaRows || []).filter((r: any) => r.campaign_name === campanha);
    const meta = campanha === 'all' ? (metaRows || []) : (metaRows || []).filter((r: any) => r.campaign_name === campanha);
    const wa = campanha === 'all' ? (waRows || []) : (waRows || []).filter((r: any) => r.campaign_name === campanha);

    const impressions = sumField(meta, 'impressions') || sumField(mf, 'impressions');
    const clicks = sumField(meta, 'clicks') || sumField(mf, 'clicks');
    const sessions = sumField(mf, 'sessions');
    const leads = sumField(mf, 'leads') || sumField(wa, 'leads');
    const qual = sumField(mf, 'leads_qualificados') || sumField(wa, 'leads_qualificados');
    const agend = sumField(mf, 'leads_agendados') || sumField(wa, 'leads_agendados');
    const fechados = sumField(mf, 'leads_fechados') || sumField(wa, 'leads_fechados');
    const revenue = sumField(mf, 'revenue') || sumField(meta, 'receita_gerada');
    const spend = sumField(mf, 'spend') || sumField(meta, 'spend');

    return { impressions, clicks, sessions, leads, qual, agend, fechados, revenue, spend };
  }, [mediaRows, metaRows, waRows, campanha]);

  const steps: FunnelStep[] = [
    { label: 'Impressões', value: funnel.impressions, color: 'hsl(220, 70%, 55%)' },
    { label: 'Cliques', value: funnel.clicks, color: 'hsl(200, 70%, 50%)' },
    { label: 'Sessões', value: funnel.sessions, color: 'hsl(35, 90%, 55%)' },
    { label: 'Leads', value: funnel.leads, color: 'hsl(142, 70%, 45%)' },
    { label: 'Qualificados', value: funnel.qual, color: 'hsl(142, 76%, 36%)' },
    { label: 'Agendados', value: funnel.agend, color: 'hsl(var(--primary))' },
    { label: 'Fechados', value: funnel.fechados, color: 'hsl(120, 60%, 35%)' },
    { label: 'Receita', value: funnel.revenue, color: 'hsl(45, 90%, 50%)' },
  ];

  const maxVal = Math.max(...steps.map(s => s.value), 1);

  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-64 mb-4" /><div className="space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div></div>;
  if (!mediaRows?.length && !metaRows?.length && !waRows?.length) return <div className="p-6"><div className="flex justify-between items-center mb-4"><h1 className="text-xl font-bold">Funil Consolidado</h1><SyncBadge franquiaId={FRANQUIA} /></div><EmptyState /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold">Funil Consolidado</h1>
        <div className="flex items-center gap-3">
          <SyncBadge franquiaId={FRANQUIA} />
          <CampanhaFilters periodo={periodo} setPeriodo={setPeriodo} campanha={campanha} setCampanha={setCampanha} campanhas={campanhas} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard label="CPL" value={funnel.leads > 0 ? formatCurrency(funnel.spend / funnel.leads) : '—'} icon={<DollarSign className="h-4 w-4" />} />
        <KPICard label="CPA" value={funnel.agend > 0 ? formatCurrency(funnel.spend / funnel.agend) : '—'} />
        <KPICard label="CAC" value={funnel.fechados > 0 ? formatCurrency(funnel.spend / funnel.fechados) : '—'} icon={<Users className="h-4 w-4" />} />
        <KPICard label="ROAS" value={funnel.spend > 0 ? `${(funnel.revenue / funnel.spend).toFixed(2)}×` : '—'} icon={<TrendingUp className="h-4 w-4" />} />
        <KPICard label="Ticket Médio" value={funnel.fechados > 0 ? formatCurrency(funnel.revenue / funnel.fechados) : '—'} icon={<Target className="h-4 w-4" />} />
      </div>

      {/* Visual Funnel */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-6">META → SITE → WHATSAPP → VENDA</h3>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <FunnelBar key={step.label} step={step} maxValue={maxVal} prevValue={i > 0 ? steps[i - 1].value : undefined} />
          ))}
        </div>
      </Card>

      {/* Conversion rates between stages */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-4">Taxas de Conversão entre Etapas</h3>
        <div className="flex flex-wrap gap-2 items-center justify-center">
          {steps.slice(0, -1).map((step, i) => {
            const next = steps[i + 1];
            const rate = step.value > 0 ? ((next.value / step.value) * 100).toFixed(1) : '0';
            return (
              <div key={step.label} className="flex items-center gap-1">
                <span className="text-xs font-medium px-2 py-1 rounded bg-muted">{step.label}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-bold text-primary">{rate}%</span>
                {i < steps.length - 2 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
