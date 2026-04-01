import { useState, useMemo } from 'react';
import { useSolMetricas, useSolLeads } from '@/hooks/useSolData';
import { usePeriodo } from '@/hooks/usePeriodo';
import { CampanhaFilters } from '@/components/campanhas/CampanhaFilters';
import { SyncBadge } from '@/components/campanhas/SyncBadge';
import { KPICard } from '@/components/campanhas/KPICard';
import { EmptyState } from '@/components/campanhas/EmptyState';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { MessageSquare, Users, Bot, DollarSign, Clock } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/hooks/useCampaignObs';
import { useFranquiaId } from '@/hooks/useFranquiaId';

const COLORS = ['hsl(210,70%,55%)', 'hsl(142,70%,45%)', 'hsl(35,90%,55%)', 'hsl(0,70%,55%)', 'hsl(270,60%,55%)', 'hsl(180,60%,45%)'];

function timeAgo(ts: string | null): string {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '—';
  const diff = Date.now() - d.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return `${Math.floor(diff / (1000 * 60))}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}

export default function WhatsAppPage() {
  const { periodo, setPeriodo, range } = usePeriodo();
  const franquiaId = useFranquiaId();
  const { data: metricas, isLoading: l1 } = useSolMetricasSync(30);
  const { data: leads, isLoading: l2 } = useSolLeadsSync();

  const isLoading = l1 || l2;

  // Aggregate leads by status
  const statusAgg = useMemo(() => {
    if (!leads) return {};
    const agg: Record<string, { qtd: number; msgs: number; custo: number; audios: number; custoOpenai: number; custoEleven: number }> = {};
    leads.forEach(l => {
      const s = l.status || 'UNKNOWN';
      if (!agg[s]) agg[s] = { qtd: 0, msgs: 0, custo: 0, audios: 0, custoOpenai: 0, custoEleven: 0 };
      agg[s].qtd++;
      agg[s].msgs += l.total_mensagens_ia || 0;
      agg[s].custo += l.custo_total_usd || 0;
      agg[s].audios += l.total_audios_enviados || 0;
      agg[s].custoOpenai += l.custo_openai || 0;
      agg[s].custoEleven += l.custo_elevenlabs || 0;
    });
    return agg;
  }, [leads]);

  // KPIs
  const kpis = useMemo(() => {
    if (!leads) return { total: 0, msgs: 0, audios: 0, custo: 0, emConversa: 0 };
    const total = leads.length;
    const msgs = leads.reduce((a, l) => a + (l.total_mensagens_ia || 0), 0);
    const audios = leads.reduce((a, l) => a + (l.total_audios_enviados || 0), 0);
    const custo = leads.reduce((a, l) => a + (l.custo_total_usd || 0), 0);
    const emConversa = leads.filter(l => l.status === 'EM_QUALIFICACAO').length;
    return { total, msgs, audios, custo, emConversa };
  }, [leads]);

  // Daily chart from metricas
  const dailyChart = useMemo(() => {
    if (!metricas) return [];
    return [...metricas]
      .sort((a, b) => (a.data || '').localeCompare(b.data || ''))
      .map(m => ({
        data: m.data || '',
        leads_novos: m.leads_novos || 0,
        leads_qualificados: m.leads_qualificados || 0,
      }));
  }, [metricas]);

  // Active leads (EM_QUALIFICACAO)
  const activeLeads = useMemo(() => {
    if (!leads) return [];
    return leads
      .filter(l => l.status === 'EM_QUALIFICACAO')
      .sort((a, b) => (b.ts_ultima_interacao || '').localeCompare(a.ts_ultima_interacao || ''));
  }, [leads]);

  // Status donut data
  const statusDonut = useMemo(() => {
    return Object.entries(statusAgg).map(([status, agg], i) => ({
      name: status.replace(/_/g, ' '),
      value: agg.qtd,
      fill: COLORS[i % COLORS.length],
    }));
  }, [statusAgg]);

  // Cost breakdown
  const costData = useMemo(() => {
    const openai = leads?.reduce((a, l) => a + (l.custo_openai || 0), 0) || 0;
    const eleven = leads?.reduce((a, l) => a + (l.custo_elevenlabs || 0), 0) || 0;
    return [
      { name: 'OpenAI', value: openai },
      { name: 'ElevenLabs', value: eleven },
    ];
  }, [leads]);

  // Aguardando conta luz
  const aguardandoConta = useMemo(() => {
    if (!leads) return [];
    return leads.filter(l => l.aguardando_conta_luz);
  }, [leads]);

  // FUPs pendentes
  const fupsPendentes = useMemo(() => {
    if (!leads) return [];
    return leads
      .filter(l => ['TRAFEGO_PAGO', 'FOLLOW_UP'].includes(l.status || '') && (l.fup_followup_count || 0) < 9)
      .sort((a, b) => (a.ts_ultima_interacao || '').localeCompare(b.ts_ultima_interacao || ''));
  }, [leads]);

  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-64 mb-4" /><div className="grid grid-cols-3 gap-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div></div>;
  if (!leads?.length && !metricas?.length) return <div className="p-6"><div className="flex justify-between items-center mb-4"><h1 className="text-xl font-bold">WhatsApp / Agent IA</h1><SyncBadge franquiaId={franquiaId} /></div><EmptyState /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold flex items-center gap-2"><MessageSquare className="h-5 w-5" /> WhatsApp / Agent IA</h1>
        <div className="flex items-center gap-3">
          <SyncBadge franquiaId={franquiaId} />
          <CampanhaFilters periodo={periodo} setPeriodo={setPeriodo} campanha="all" setCampanha={() => {}} campanhas={[]} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPICard label="Leads Total" value={formatNumber(kpis.total)} icon={<Users className="h-4 w-4" />} />
        <KPICard label="Msgs IA" value={formatNumber(kpis.msgs)} icon={<Bot className="h-4 w-4" />} />
        <KPICard label="Áudios Enviados" value={formatNumber(kpis.audios)} />
        <KPICard label="Custo IA" value={`$${kpis.custo.toFixed(2)}`} icon={<DollarSign className="h-4 w-4" />} />
        <KPICard label="Em Conversa" value={formatNumber(kpis.emConversa)} icon={<Clock className="h-4 w-4" />} />
      </div>

      {/* Daily chart */}
      {dailyChart.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">Leads Novos / Qualificados por Dia</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailyChart}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="data" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="leads_novos" name="Novos" fill="hsl(210,70%,55%)" stackId="a" />
              <Bar dataKey="leads_qualificados" name="Qualificados" fill="hsl(142,70%,45%)" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Active leads table */}
      {activeLeads.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">Leads em Conversa Ativa ({activeLeads.length})</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Nome</TableHead>
                  <TableHead className="text-xs">Telefone</TableHead>
                  <TableHead className="text-xs">Score</TableHead>
                  <TableHead className="text-xs">Temp</TableHead>
                  <TableHead className="text-xs text-right">Msgs</TableHead>
                  <TableHead className="text-xs text-right">Custo</TableHead>
                  <TableHead className="text-xs">Última Interação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeLeads.slice(0, 30).map((lead, i) => (
                  <TableRow key={lead.telefone}>
                    <TableCell className="text-xs">{lead.nome || '—'}</TableCell>
                    <TableCell className="text-xs">
                      <a href={`https://wa.me/${lead.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {lead.telefone}
                      </a>
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className={`text-[10px] ${parseInt(lead.score || '0') >= 70 ? 'text-red-500 border-red-500/30' : parseInt(lead.score || '0') >= 40 ? 'text-yellow-500 border-yellow-500/30' : 'text-blue-500 border-blue-500/30'}`}>
                        {lead.score || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="secondary" className="text-[10px]">{lead.temperatura || '—'}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-right">{lead.total_mensagens_ia || 0}</TableCell>
                    <TableCell className="text-xs text-right">${(lead.custo_total_usd || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-xs">{timeAgo(lead.ts_ultima_interacao)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status donut */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">Distribuição por Status</h3>
          {statusDonut.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusDonut} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                  {statusDonut.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">Sem dados</p>
          )}
        </Card>

        {/* Cost breakdown */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">Custo por Componente</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={costData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
              <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
              <Bar dataKey="value" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Aguardando conta + FUPs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">⏳ Aguardando Conta de Luz ({aguardandoConta.length})</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {aguardandoConta.length === 0 && <p className="text-xs text-muted-foreground">Nenhum lead aguardando.</p>}
            {aguardandoConta.slice(0, 20).map(l => (
              <div key={l.telefone} className="flex items-center justify-between text-xs border-b border-border pb-1">
                <span className="font-medium">{l.nome || l.telefone}</span>
                <span className="text-muted-foreground">{timeAgo(l.ts_pedido_conta_luz)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">📋 FUPs Pendentes ({fupsPendentes.length})</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {fupsPendentes.length === 0 && <p className="text-xs text-muted-foreground">Nenhum FUP pendente.</p>}
            {fupsPendentes.slice(0, 20).map(l => (
              <div key={l.telefone} className="flex items-center justify-between text-xs border-b border-border pb-1">
                <span className="font-medium">{l.nome || l.telefone}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">FUP #{l.fup_followup_count || 0}/9</Badge>
                  <span className="text-muted-foreground">{timeAgo(l.ts_ultima_interacao)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
