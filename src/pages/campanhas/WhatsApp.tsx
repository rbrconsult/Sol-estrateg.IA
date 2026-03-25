import { useState, useMemo } from 'react';
import { useWhatsApp, sumField, groupByDate, formatNumber, formatCurrency, formatPct } from '@/hooks/useCampaignObs';
import { usePeriodo } from '@/hooks/usePeriodo';
import { CampanhaFilters } from '@/components/campanhas/CampanhaFilters';
import { SyncBadge } from '@/components/campanhas/SyncBadge';
import { KPICard } from '@/components/campanhas/KPICard';
import { EmptyState } from '@/components/campanhas/EmptyState';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { MessageSquare, Users, Target } from 'lucide-react';

const FRANQUIA = 'evolve_olimpia';

export default function WhatsAppPage() {
  const { periodo, setPeriodo, range } = usePeriodo();
  const [campanha, setCampanha] = useState('all');
  const { data: rows, isLoading } = useWhatsApp(FRANQUIA, range);

  const filtered = useMemo(() => {
    if (!rows) return [];
    return campanha === 'all' ? rows : rows.filter((r: any) => r.campaign_name === campanha);
  }, [rows, campanha]);

  const campanhas = useMemo(() => [...new Set((rows || []).map((r: any) => r.campaign_name).filter(Boolean))] as string[], [rows]);

  const kpis = useMemo(() => {
    const conversations = sumField(filtered, 'conversations_started');
    const replied = sumField(filtered, 'conversations_replied');
    const leads = sumField(filtered, 'leads');
    const qual = sumField(filtered, 'leads_qualificados');
    const agend = sumField(filtered, 'leads_agendados');
    const fechados = sumField(filtered, 'leads_fechados');
    return { conversations, replied, leads, qual, agend, fechados, taxaQual: leads > 0 ? (qual / leads) * 100 : 0 };
  }, [filtered]);

  const dailyChart = useMemo(() => {
    const byDate = groupByDate(filtered);
    return Object.entries(byDate)
      .map(([date, dayRows]) => ({
        date,
        leads: sumField(dayRows, 'leads'),
        qualificados: sumField(dayRows, 'leads_qualificados'),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  const tableData = useMemo(() => {
    const map = new Map<string, any>();
    for (const r of filtered) {
      const key = r.campaign_name || '(sem campanha)';
      if (!map.has(key)) map.set(key, { campaign: key, conversations: 0, leads: 0, qual: 0, agend: 0, fechados: 0 });
      const m = map.get(key);
      m.conversations += Number(r.conversations_started) || 0;
      m.leads += Number(r.leads) || 0;
      m.qual += Number(r.leads_qualificados) || 0;
      m.agend += Number(r.leads_agendados) || 0;
      m.fechados += Number(r.leads_fechados) || 0;
    }
    return [...map.values()].sort((a, b) => b.leads - a.leads);
  }, [filtered]);

  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-64 mb-4" /><div className="grid grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div></div>;
  if (!rows?.length) return <div className="p-6"><div className="flex justify-between items-center mb-4"><h1 className="text-xl font-bold">WhatsApp</h1><SyncBadge franquiaId={FRANQUIA} /></div><EmptyState /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold flex items-center gap-2"><MessageSquare className="h-5 w-5" /> WhatsApp</h1>
        <div className="flex items-center gap-3">
          <SyncBadge franquiaId={FRANQUIA} />
          <CampanhaFilters periodo={periodo} setPeriodo={setPeriodo} campanha={campanha} setCampanha={setCampanha} campanhas={campanhas} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <KPICard label="Conversas" value={formatNumber(kpis.conversations)} icon={<MessageSquare className="h-4 w-4" />} />
        <KPICard label="Respondidas" value={formatNumber(kpis.replied)} />
        <KPICard label="Leads" value={formatNumber(kpis.leads)} icon={<Users className="h-4 w-4" />} />
        <KPICard label="Qualificados" value={formatNumber(kpis.qual)} detail={formatPct(kpis.taxaQual)} />
        <KPICard label="Agendados" value={formatNumber(kpis.agend)} />
        <KPICard label="Fechados" value={formatNumber(kpis.fechados)} icon={<Target className="h-4 w-4" />} />
        <KPICard label="CPL" value={filtered.length > 0 ? formatCurrency(sumField(filtered, 'cpl') / filtered.length) : '—'} />
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4">Leads × Qualificados por Dia</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={dailyChart}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="leads" name="Leads" stroke="hsl(142, 70%, 45%)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="qualificados" name="Qualificados" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4">Por Campanha</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Campanha</TableHead>
                <TableHead className="text-xs text-right">Conversas</TableHead>
                <TableHead className="text-xs text-right">Leads</TableHead>
                <TableHead className="text-xs text-right">Qualificados</TableHead>
                <TableHead className="text-xs text-right">Agendados</TableHead>
                <TableHead className="text-xs text-right">Fechados</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.slice(0, 50).map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs">{row.campaign}</TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(row.conversations)}</TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(row.leads)}</TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(row.qual)}</TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(row.agend)}</TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(row.fechados)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
