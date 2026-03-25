import { useState, useMemo } from 'react';
import { useMediaPerformance, sumField, groupByDate, formatCurrency, formatNumber, formatPct } from '@/hooks/useCampaignObs';
import { usePeriodo } from '@/hooks/usePeriodo';
import { CampanhaFilters } from '@/components/campanhas/CampanhaFilters';
import { SyncBadge } from '@/components/campanhas/SyncBadge';
import { KPICard } from '@/components/campanhas/KPICard';
import { EmptyState } from '@/components/campanhas/EmptyState';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Users, Target, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

const FRANQUIA = 'evolve_olimpia';
const CHANNELS = ['meta', 'google', 'site_ga4', 'whatsapp'] as const;
const CHANNEL_COLORS: Record<string, string> = {
  meta: 'hsl(var(--primary))',
  google: 'hsl(220, 80%, 55%)',
  site_ga4: 'hsl(35, 90%, 55%)',
  whatsapp: 'hsl(142, 70%, 45%)',
};
const CHANNEL_LABELS: Record<string, string> = {
  meta: 'Meta', google: 'Google', site_ga4: 'Site (GA4)', whatsapp: 'WhatsApp',
};

export default function CampanhasVisaoGeral() {
  const { periodo, setPeriodo, range } = usePeriodo();
  const [campanha, setCampanha] = useState('all');
  const { data: rows, isLoading } = useMediaPerformance(FRANQUIA, range);

  const filtered = useMemo(() => {
    if (!rows) return [];
    return campanha === 'all' ? rows : rows.filter((r: any) => r.campaign_name === campanha);
  }, [rows, campanha]);

  const campanhas = useMemo(() => {
    if (!rows) return [];
    return [...new Set(rows.map((r: any) => r.campaign_name).filter(Boolean))] as string[];
  }, [rows]);

  const channelData = useMemo(() => {
    return CHANNELS.map(ch => {
      const chRows = filtered.filter((r: any) => r.channel === ch);
      const spend = sumField(chRows, 'spend');
      const leads = sumField(chRows, 'leads');
      const conversions = sumField(chRows, 'conversions');
      const revenue = sumField(chRows, 'revenue');
      return {
        channel: ch,
        label: CHANNEL_LABELS[ch],
        spend, leads, conversions, revenue,
        cpl: leads > 0 ? spend / leads : 0,
        roas: spend > 0 ? revenue / spend : 0,
      };
    });
  }, [filtered]);

  const dailyLeads = useMemo(() => {
    const byDate = groupByDate(filtered);
    return Object.entries(byDate)
      .map(([date, dayRows]) => {
        const entry: any = { date };
        for (const ch of CHANNELS) {
          entry[ch] = sumField(dayRows.filter((r: any) => r.channel === ch), 'leads');
        }
        return entry;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  const dailySpend = useMemo(() => {
    const byDate = groupByDate(filtered);
    return Object.entries(byDate)
      .map(([date, dayRows]) => {
        const entry: any = { date };
        for (const ch of CHANNELS) {
          entry[ch] = sumField(dayRows.filter((r: any) => r.channel === ch), 'spend');
        }
        return entry;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (!rows?.length) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Campanhas — Visão Geral</h1>
          <SyncBadge franquiaId={FRANQUIA} />
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
          <SyncBadge franquiaId={FRANQUIA} />
          <CampanhaFilters periodo={periodo} setPeriodo={setPeriodo} campanha={campanha} setCampanha={setCampanha} campanhas={campanhas} />
        </div>
      </div>

      {/* Channel comparison cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {channelData.map(ch => (
          <Card key={ch.channel} className="p-4 space-y-2 border-l-4" style={{ borderLeftColor: CHANNEL_COLORS[ch.channel] }}>
            <h3 className="text-sm font-semibold">{ch.label}</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-muted-foreground">Investimento</span>
              <span className="font-medium text-right">{formatCurrency(ch.spend)}</span>
              <span className="text-muted-foreground">Leads</span>
              <span className="font-medium text-right">{formatNumber(ch.leads)}</span>
              <span className="text-muted-foreground">CPL</span>
              <span className="font-medium text-right">{formatCurrency(ch.cpl)}</span>
              <span className="text-muted-foreground">Conversões</span>
              <span className="font-medium text-right">{formatNumber(ch.conversions)}</span>
              <span className="text-muted-foreground">ROAS</span>
              <span className="font-medium text-right">{ch.roas.toFixed(2)}×</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Leads per day per channel */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4">Leads por Dia por Canal</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyLeads}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            {CHANNELS.map(ch => (
              <Line key={ch} type="monotone" dataKey={ch} name={CHANNEL_LABELS[ch]} stroke={CHANNEL_COLORS[ch]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Spend per day */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4">Investimento por Dia por Canal</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailySpend}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            {CHANNELS.map(ch => (
              <Bar key={ch} dataKey={ch} name={CHANNEL_LABELS[ch]} fill={CHANNEL_COLORS[ch]} stackId="spend" />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
