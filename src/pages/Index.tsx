import { useMemo } from "react";
import { useSolLeads, useSolEquipe, useSolMetricas, type SolLead } from "@/hooks/useSolData";
import { getStatusLabel } from "@/lib/leadClassification";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpButton } from "@/components/HelpButton";
import { ExecutiveSummary } from "@/components/dashboard/ExecutiveSummary";
import { GoalProgress } from "@/components/dashboard/GoalProgress";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { PageFloatingFilter } from "@/components/filters/PageFloatingFilter";
import {
  AlertCircle, Users, MessageSquare, UserCheck, UserX, Trophy, Repeat,
  Bot, Zap, Headphones, DollarSign, TrendingDown, Clock, FileWarning,
  BarChart3,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

// ── Status colors & icons ──
const STATUS_META: Record<string, { color: string; icon: typeof Users; desc: string }> = {
  TRAFEGO_PAGO:    { color: "text-muted-foreground", icon: Users,          desc: "Preencheu formulário — SOL não falou" },
  EM_QUALIFICACAO: { color: "text-amber-500",        icon: MessageSquare,  desc: "SOL está conversando" },
  QUALIFICADO:     { color: "text-emerald-500",      icon: UserCheck,      desc: "Qualificado, transferido pro closer" },
  DESQUALIFICADO:  { color: "text-destructive",      icon: UserX,          desc: "Descartado pela SOL" },
  FOLLOW_UP:       { color: "text-orange-500",       icon: Repeat,         desc: "FUP Frio ativo" },
  GANHO:           { color: "text-green-600",         icon: Trophy,         desc: "Negócio fechado" },
  PERDIDO:         { color: "text-red-700",           icon: TrendingDown,   desc: "Negócio perdido" },
  CONTRATO:        { color: "text-primary",           icon: Trophy,         desc: "Contrato assinado" },
};

const FUNNEL_ORDER = ['TRAFEGO_PAGO','EM_QUALIFICACAO','FOLLOW_UP','QUALIFICADO','DESQUALIFICADO','GANHO','PERDIDO','CONTRATO'];
const FUNNEL_BAR_COLORS: Record<string, string> = {
  TRAFEGO_PAGO: 'hsl(210,50%,55%)', EM_QUALIFICACAO: 'hsl(40,90%,55%)', FOLLOW_UP: 'hsl(25,85%,55%)',
  QUALIFICADO: 'hsl(142,60%,45%)', DESQUALIFICADO: 'hsl(0,70%,55%)', GANHO: 'hsl(130,60%,35%)',
  PERDIDO: 'hsl(0,50%,40%)', CONTRATO: 'hsl(220,70%,55%)',
};

const PIE_COLORS = ['#3b82f6','#1e40af','#22c55e','#6b7280','#f59e0b','#ef4444'];

const tempBadge = (t: string | null) => {
  if (!t) return <Badge variant="secondary" className="text-[10px]">—</Badge>;
  const u = t.toUpperCase();
  if (u === 'QUENTE') return <Badge className="bg-red-500/20 text-red-500 border-red-500/30 text-[10px]">🔴 Quente</Badge>;
  if (u === 'MORNO')  return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[10px]">🟡 Morno</Badge>;
  return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 text-[10px]">🔵 Frio</Badge>;
};

const fmt = (n: number) => n.toLocaleString('pt-BR');
const fmtUSD = (n: number) => `$${n.toFixed(2)}`;

const Index = () => {
  const { data: leads, isLoading: l1, error } = useSolLeads();
  const { data: equipe, isLoading: l2 } = useSolEquipe();
  const { data: metricas, isLoading: l3 } = useSolMetricas(30);
  const { selectedOrgName } = useOrgFilter();
  const gf = useGlobalFilters();

  const isLoading = l1 || l2 || l3;
  const lastUpdate = useMemo(() => new Date().toLocaleString('pt-BR'), []);

  // ── Period filter ──
  const filtered = useMemo(() => {
    if (!leads?.length) return [];
    const { from, to } = gf.effectiveDateRange;
    if (!from && !to) return leads;
    return leads.filter(l => {
      const d = new Date(l.ts_cadastro || l.synced_at || '');
      if (isNaN(d.getTime())) return true;
      if (from) { const f = new Date(from); f.setHours(0,0,0,0); if (d < f) return false; }
      if (to) { const t = new Date(to); t.setHours(23,59,59,999); if (d > t) return false; }
      return true;
    });
  }, [leads, gf.effectiveDateRange]);

  // ══════════════════════════════════════════════════════════════
  // SEÇÃO 1: FUNIL GERAL
  // ══════════════════════════════════════════════════════════════
  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    FUNNEL_ORDER.forEach(s => c[s] = 0);
    filtered.forEach(l => {
      const s = (l.status || 'TRAFEGO_PAGO').toUpperCase();
      if (c[s] !== undefined) c[s]++; else c['TRAFEGO_PAGO']++;
    });
    return c;
  }, [filtered]);

  const funnelData = useMemo(() =>
    FUNNEL_ORDER.map(k => ({ key: k, count: statusCounts[k] || 0 })).filter(d => d.count > 0 || ['TRAFEGO_PAGO','EM_QUALIFICACAO','QUALIFICADO','GANHO'].includes(d.key)),
  [statusCounts]);
  const maxFunnel = Math.max(...funnelData.map(d => d.count), 1);

  // ══════════════════════════════════════════════════════════════
  // SEÇÃO 2: PERFORMANCE SOL
  // ══════════════════════════════════════════════════════════════
  const solPerf = useMemo(() => {
    const withConvo = filtered.filter(l => (l.total_mensagens_ia || 0) > 0);
    const totalMsgs = filtered.reduce((a, l) => a + (l.total_mensagens_ia || 0), 0);
    const totalAudios = filtered.reduce((a, l) => a + (l.total_audios_enviados || 0), 0);
    const custoOAI = filtered.reduce((a, l) => a + (l.custo_openai || 0), 0);
    const custoEL = filtered.reduce((a, l) => a + (l.custo_elevenlabs || 0), 0);
    const custoTotal = filtered.reduce((a, l) => a + (l.custo_total_usd || 0), 0);
    const mediaMsgs = withConvo.length > 0 ? totalMsgs / withConvo.length : 0;
    const scores = filtered.filter(l => l.score && parseFloat(l.score) > 0).map(l => parseFloat(l.score!));
    const scoreMedio = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return { withConvo: withConvo.length, total: filtered.length, totalMsgs, totalAudios, custoOAI, custoEL, custoTotal, mediaMsgs, scoreMedio };
  }, [filtered]);

  // ══════════════════════════════════════════════════════════════
  // SEÇÃO 3: DETALHAMENTO QUALIFICAÇÃO
  // ══════════════════════════════════════════════════════════════
  const qualificados = useMemo(() => filtered.filter(l => l.status === 'QUALIFICADO').sort((a, b) => (b.ts_qualificado || '').localeCompare(a.ts_qualificado || '')), [filtered]);
  const emQualificacao = useMemo(() => filtered.filter(l => l.status === 'EM_QUALIFICACAO').sort((a, b) => (b.ts_ultima_interacao || '').localeCompare(a.ts_ultima_interacao || '')), [filtered]);

  // ══════════════════════════════════════════════════════════════
  // SEÇÃO 4: FUP FRIO
  // ══════════════════════════════════════════════════════════════
  const fup = useMemo(() => {
    const comFup = filtered.filter(l => (l.fup_followup_count || 0) > 0);
    const emFupAtivo = filtered.filter(l => l.status === 'FOLLOW_UP').length;
    const totalFups = comFup.reduce((a, l) => a + (l.fup_followup_count || 0), 0);
    const mediaFups = comFup.length > 0 ? totalFups / comFup.length : 0;
    const resgatadosQual = comFup.filter(l => l.status === 'QUALIFICADO').length;
    const resgatadosConv = comFup.filter(l => l.status === 'EM_QUALIFICACAO').length;
    const esgotados = comFup.filter(l => (l.fup_followup_count || 0) >= 9 && !['QUALIFICADO','GANHO'].includes(l.status || '')).length;
    return { comFup: comFup.length, emFupAtivo, totalFups, mediaFups, resgatadosQual, resgatadosConv, esgotados };
  }, [filtered]);

  // ══════════════════════════════════════════════════════════════
  // SEÇÃO 5: POR CANAL DE ORIGEM
  // ══════════════════════════════════════════════════════════════
  const porCanal = useMemo(() => {
    const map: Record<string, { total: number; qualificados: number; ganhos: number; custoIA: number }> = {};
    filtered.forEach(l => {
      const c = l.canal_origem || 'Desconhecido';
      if (!map[c]) map[c] = { total: 0, qualificados: 0, ganhos: 0, custoIA: 0 };
      map[c].total++;
      if (l.status === 'QUALIFICADO') map[c].qualificados++;
      if (l.status === 'GANHO') map[c].ganhos++;
      map[c].custoIA += l.custo_total_usd || 0;
    });
    return Object.entries(map).map(([canal, d]) => ({ canal, ...d })).sort((a, b) => b.total - a.total);
  }, [filtered]);

  // ══════════════════════════════════════════════════════════════
  // SEÇÃO 6: POR CLOSER
  // ══════════════════════════════════════════════════════════════
  const closerPerf = useMemo(() => {
    if (!equipe?.length) return [];
    const map: Record<string, { cargo: string; leads: number; ganhos: number; perdidos: number }> = {};
    equipe.filter(e => e.ativo).forEach(e => {
      map[e.nome || ''] = { cargo: e.cargo || '', leads: 0, ganhos: 0, perdidos: 0 };
    });
    filtered.filter(l => l.closer_nome).forEach(l => {
      const c = l.closer_nome!;
      if (!map[c]) map[c] = { cargo: 'closer', leads: 0, ganhos: 0, perdidos: 0 };
      map[c].leads++;
      if (l.status === 'GANHO') map[c].ganhos++;
      if (l.status === 'PERDIDO') map[c].perdidos++;
    });
    return Object.entries(map).map(([nome, d]) => ({ nome, ...d })).sort((a, b) => b.leads - a.leads);
  }, [filtered, equipe]);

  // ══════════════════════════════════════════════════════════════
  // SEÇÃO 7: MÉTRICAS DIÁRIAS
  // ══════════════════════════════════════════════════════════════
  const chartData = useMemo(() => {
    if (!metricas?.length) return [];
    return [...metricas].reverse().map(m => ({
      data: m.data || '',
      leads_novos: m.leads_novos || 0,
      leads_qualificados: m.leads_qualificados || 0,
      custo: Number(m.custo_total) || 0,
    }));
  }, [metricas]);

  // ══════════════════════════════════════════════════════════════
  // SEÇÃO 8: ALERTAS
  // ══════════════════════════════════════════════════════════════
  const alertas = useMemo(() => {
    const now = Date.now();
    const semAtividade = filtered.filter(l => {
      if (!['EM_QUALIFICACAO','TRAFEGO_PAGO'].includes(l.status || '')) return false;
      if (!l.ts_ultima_interacao) return true;
      return (now - new Date(l.ts_ultima_interacao).getTime()) > 24 * 60 * 60 * 1000;
    });
    const aguardandoCL = filtered.filter(l => l.aguardando_conta_luz === true);
    const lixo = filtered.filter(l => !l.nome || l.nome === '' || (l.telefone || '').length < 10);
    return { semAtividade, aguardandoCL, lixo };
  }, [filtered]);

  // ── Contagens para GoalProgress (sem valor_conta — valor_conta é conta de luz, NÃO receita) ──
  const countGanho = useMemo(() =>
    filtered.filter(l => l.status === 'GANHO' || l.status === 'CONTRATO').length,
  [filtered]);
  const countPipeline = useMemo(() =>
    filtered.filter(l => ['EM_QUALIFICACAO','QUALIFICADO','FOLLOW_UP'].includes(l.status || '')).length,
  [filtered]);

  const hasData = (leads?.length ?? 0) > 0;
  const isEmpty = !isLoading && !hasData && !error;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Inteligência SOL v2 • {lastUpdate}</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedOrgName && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">🏢 {selectedOrgName}</Badge>
          )}
          <HelpButton moduleId="bi-estrategico" label="Ajuda" />
        </div>
      </div>

      <PageFloatingFilter
        filters={gf.filters} hasFilters={gf.hasFilters} clearFilters={gf.clearFilters}
        setPeriodo={gf.setPeriodo} setDateFrom={gf.setDateFrom} setDateTo={gf.setDateTo}
        setTemperatura={gf.setTemperatura} setSearchTerm={gf.setSearchTerm} setEtapa={gf.setEtapa} setStatus={gf.setStatus}
        config={{ showPeriodo: true, showTemperatura: false, showSearch: false, showEtapa: false, showStatus: false, searchPlaceholder: "" }}
      />

      {error && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription>Erro: {error.message}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      )}

      {isEmpty && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription>Aguardando sincronização — cron-sync popula a cada 5 min.</AlertDescription>
        </Alert>
      )}

      {hasData && !isLoading && (
        <>
          {/* Badge */}
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            {filtered.length} leads na base
          </span>

          {/* ═══════════════════════════════════════════════ */}
          {/* SEÇÃO 1: FUNIL GERAL — Cards + Visual */}
          {/* ═══════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'TOTAL', label: 'Total Leads', value: filtered.length, color: 'text-blue-400', icon: Users, desc: 'Todos os leads' },
              ...FUNNEL_ORDER.filter(k => statusCounts[k] > 0 || ['TRAFEGO_PAGO','EM_QUALIFICACAO','QUALIFICADO','GANHO'].includes(k)).map(k => ({
                key: k, label: getStatusLabel(k), value: statusCounts[k],
                color: STATUS_META[k]?.color || 'text-muted-foreground',
                icon: STATUS_META[k]?.icon || Users,
                desc: STATUS_META[k]?.desc || '',
              })),
            ].map(c => {
              const Icon = c.icon;
              return (
                <div key={c.key} className="rounded-xl border border-border bg-card p-4 space-y-1 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${c.color}`} />
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                  </div>
                  <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
                  <p className="text-[10px] text-muted-foreground">{c.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Funil visual */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold mb-1">Funil Lead → Venda</h3>
            <p className="text-xs text-muted-foreground mb-4">Taxas de conversão entre etapas</p>
            <div className="space-y-2">
              {funnelData.map((d, i) => {
                const pct = Math.max((d.count / maxFunnel) * 100, 4);
                const prev = i > 0 ? funnelData[i - 1].count : null;
                const conv = prev && prev > 0 ? ((d.count / prev) * 100).toFixed(1) : null;
                const meta = STATUS_META[d.key];
                const Icon = meta?.icon || Users;
                return (
                  <div key={d.key} className="flex items-center gap-3">
                    <div className="w-32 flex items-center gap-1.5 justify-end">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium">{getStatusLabel(d.key)}</span>
                    </div>
                    <div className="flex-1 relative h-9">
                      <div className="h-9 rounded-lg transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: FUNNEL_BAR_COLORS[d.key] || 'hsl(210,50%,50%)' }}>
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white drop-shadow-sm">{d.count}</span>
                      </div>
                    </div>
                    <div className="w-14 text-right">{conv && <span className="text-xs text-muted-foreground">{conv}%</span>}</div>
                  </div>
                );
              })}
            </div>
            {/* Taxas calculadas */}
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {statusCounts['TRAFEGO_PAGO'] > 0 && (
                <span>Recebidos → Qualificação: <b className="text-foreground">{((statusCounts['EM_QUALIFICACAO'] / statusCounts['TRAFEGO_PAGO']) * 100).toFixed(1)}%</b></span>
              )}
              {(statusCounts['EM_QUALIFICACAO'] + statusCounts['QUALIFICADO']) > 0 && (
                <span>Qualificação → Qualificados: <b className="text-foreground">{((statusCounts['QUALIFICADO'] / (statusCounts['EM_QUALIFICACAO'] + statusCounts['QUALIFICADO'])) * 100).toFixed(1)}%</b></span>
              )}
              {(statusCounts['QUALIFICADO'] + statusCounts['GANHO'] + statusCounts['PERDIDO']) > 0 && (
                <span>Qualificados → Ganho: <b className="text-foreground">{((statusCounts['GANHO'] / (statusCounts['QUALIFICADO'] + statusCounts['GANHO'] + statusCounts['PERDIDO'])) * 100).toFixed(1)}%</b></span>
              )}
            </div>
          </Card>

          {/* ═══════════════════════════════════════════════ */}
          {/* SEÇÃO 2: PERFORMANCE SOL */}
          {/* ═══════════════════════════════════════════════ */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Performance SOL (Agent IA)</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Leads com conversa', value: `${solPerf.withConvo} de ${solPerf.total}`, icon: MessageSquare, color: 'text-primary' },
                { label: 'Total mensagens IA', value: fmt(solPerf.totalMsgs), icon: MessageSquare, color: 'text-blue-400' },
                { label: 'Total áudios', value: fmt(solPerf.totalAudios), icon: Headphones, color: 'text-violet-500' },
                { label: 'Média msgs/lead', value: `${solPerf.mediaMsgs.toFixed(1)} msgs`, icon: BarChart3, color: 'text-muted-foreground' },
                { label: 'Custo OpenAI', value: fmtUSD(solPerf.custoOAI), icon: DollarSign, color: 'text-amber-500' },
                { label: 'Custo ElevenLabs', value: fmtUSD(solPerf.custoEL), icon: DollarSign, color: 'text-amber-500' },
                { label: 'Custo Total IA', value: fmtUSD(solPerf.custoTotal), icon: DollarSign, color: 'text-red-500' },
                { label: 'Score médio', value: solPerf.scoreMedio.toFixed(0), icon: Zap, color: 'text-emerald-500' },
              ].map(m => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`h-3.5 w-3.5 ${m.color}`} />
                      <span className="text-xs text-muted-foreground">{m.label}</span>
                    </div>
                    <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* ═══════════════════════════════════════════════ */}
          {/* SEÇÃO 3: DETALHAMENTO QUALIFICAÇÃO */}
          {/* ═══════════════════════════════════════════════ */}
          {qualificados.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-1">Qualificados pela SOL</h3>
              <p className="text-xs text-muted-foreground mb-3">{qualificados.length} leads prontos pro closer</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Nome</TableHead>
                      <TableHead className="text-xs">Score</TableHead>
                      <TableHead className="text-xs">Temp.</TableHead>
                      <TableHead className="text-xs">Conta Luz</TableHead>
                      <TableHead className="text-xs">Closer</TableHead>
                      <TableHead className="text-xs text-right">Msgs IA</TableHead>
                      <TableHead className="text-xs text-right">Custo</TableHead>
                      <TableHead className="text-xs">Qualificado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qualificados.map(l => (
                      <TableRow key={l.telefone}>
                        <TableCell className="text-xs font-medium">{l.nome || l.telefone}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{l.score || '—'}</Badge></TableCell>
                        <TableCell>{tempBadge(l.temperatura)}</TableCell>
                        <TableCell className="text-xs">{l.valor_conta || '—'}</TableCell>
                        <TableCell className="text-xs">{l.closer_nome || '—'}</TableCell>
                        <TableCell className="text-xs text-right">{l.total_mensagens_ia || 0}</TableCell>
                        <TableCell className="text-xs text-right">{fmtUSD(l.custo_total_usd || 0)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{l.ts_qualificado ? new Date(l.ts_qualificado).toLocaleDateString('pt-BR') : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {emQualificacao.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-1">Em Qualificação (SOL conversando)</h3>
              <p className="text-xs text-muted-foreground mb-3">{emQualificacao.length} leads em conversa ativa</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Nome</TableHead>
                      <TableHead className="text-xs">Score</TableHead>
                      <TableHead className="text-xs">Temp.</TableHead>
                      <TableHead className="text-xs">Conta Luz</TableHead>
                      <TableHead className="text-xs text-right">Msgs IA</TableHead>
                      <TableHead className="text-xs">Última interação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emQualificacao.map(l => (
                      <TableRow key={l.telefone}>
                        <TableCell className="text-xs font-medium">{l.nome || l.telefone}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{l.score || '—'}</Badge></TableCell>
                        <TableCell>{tempBadge(l.temperatura)}</TableCell>
                        <TableCell className="text-xs">{l.valor_conta || '—'}</TableCell>
                        <TableCell className="text-xs text-right">{l.total_mensagens_ia || 0}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{l.ts_ultima_interacao ? new Date(l.ts_ultima_interacao).toLocaleDateString('pt-BR') : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* SEÇÃO 4: FUP FRIO */}
          {/* ═══════════════════════════════════════════════ */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Repeat className="h-4 w-4 text-orange-500" />
              <h3 className="text-sm font-semibold">Follow-Up Frio</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Leads com FUP', value: fup.comFup, desc: 'Receberam ≥1 follow-up' },
                { label: 'Em FUP ativo', value: fup.emFupAtivo, desc: 'No fluxo FOLLOW_UP agora' },
                { label: 'Total FUPs enviados', value: fup.totalFups, desc: 'Soma de msgs FUP' },
                { label: 'Média FUPs/lead', value: fup.mediaFups.toFixed(1), desc: 'FUPs por lead' },
                { label: 'Resgatados (qual.)', value: fup.resgatadosQual, desc: 'Frios → Qualificados' },
                { label: 'Resgatados (conv.)', value: fup.resgatadosConv, desc: 'Voltaram a conversar' },
                { label: 'FUP esgotado', value: fup.esgotados, desc: '≥9 FUPs sem resultado' },
              ].map(m => (
                <div key={m.label} className="space-y-1">
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-xl font-bold text-foreground">{m.value}</p>
                  <p className="text-[10px] text-muted-foreground">{m.desc}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* ═══════════════════════════════════════════════ */}
          {/* SEÇÃO 5: POR CANAL + SEÇÃO 6: POR CLOSER */}
          {/* ═══════════════════════════════════════════════ */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Canal de Origem */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Por Canal de Origem</h3>
              {porCanal.length > 0 ? (
                <>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={porCanal} dataKey="total" nameKey="canal" cx="50%" cy="50%" outerRadius={70} label={({ canal, total }) => `${canal}: ${total}`}>
                          {porCanal.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 space-y-1">
                    {porCanal.map(c => (
                      <div key={c.canal} className="flex justify-between text-xs border-b border-border pb-1">
                        <span className="font-medium">{c.canal}</span>
                        <span className="text-muted-foreground">{c.total} leads • {c.qualificados} qual. • {fmtUSD(c.custoIA)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-xs text-muted-foreground">Sem dados</p>}
            </Card>

            {/* Closer */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Performance Closers</h3>
              {closerPerf.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Closer</TableHead>
                        <TableHead className="text-xs">Cargo</TableHead>
                        <TableHead className="text-xs text-right">Leads</TableHead>
                        <TableHead className="text-xs text-right">Ganhos</TableHead>
                        <TableHead className="text-xs text-right">Perdidos</TableHead>
                        <TableHead className="text-xs text-right">Conversão</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {closerPerf.map(c => (
                        <TableRow key={c.nome}>
                          <TableCell className="text-xs font-medium">{c.nome}</TableCell>
                          <TableCell className="text-xs">{c.cargo}</TableCell>
                          <TableCell className="text-xs text-right">{c.leads}</TableCell>
                          <TableCell className="text-xs text-right">{c.ganhos}</TableCell>
                          <TableCell className="text-xs text-right">{c.perdidos}</TableCell>
                          <TableCell className="text-xs text-right">{c.leads > 0 ? `${((c.ganhos / c.leads) * 100).toFixed(0)}%` : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : <p className="text-xs text-muted-foreground">Sem closers ativos</p>}
            </Card>
          </div>

          {/* ═══════════════════════════════════════════════ */}
          {/* SEÇÃO 7: MÉTRICAS DIÁRIAS */}
          {/* ═══════════════════════════════════════════════ */}
          {chartData.length > 0 && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-4">Evolução Diária (sol_metricas_sync)</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="data" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="leads_novos" name="Leads Novos" stroke="hsl(210,70%,55%)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="leads_qualificados" name="Qualificados" stroke="hsl(142,60%,45%)" strokeWidth={2} dot={false} />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* SEÇÃO 8: ALERTAS */}
          {/* ═══════════════════════════════════════════════ */}
          {(alertas.semAtividade.length > 0 || alertas.aguardandoCL.length > 0 || alertas.lixo.length > 0) && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold">Alertas & Atenção</h3>
              </div>
              <div className="space-y-3">
                {alertas.semAtividade.length > 0 && (
                  <div className="flex items-start gap-2 text-xs">
                    <Clock className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">{alertas.semAtividade.length} leads sem atividade há +24h</p>
                      <p className="text-muted-foreground">{alertas.semAtividade.slice(0, 3).map(l => l.nome || l.telefone).join(', ')}{alertas.semAtividade.length > 3 ? ` +${alertas.semAtividade.length - 3}` : ''}</p>
                    </div>
                  </div>
                )}
                {alertas.aguardandoCL.length > 0 && (
                  <div className="flex items-start gap-2 text-xs">
                    <FileWarning className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">{alertas.aguardandoCL.length} leads aguardando conta de luz</p>
                      <p className="text-muted-foreground">{alertas.aguardandoCL.map(l => l.nome || l.telefone).join(', ')}</p>
                    </div>
                  </div>
                )}
                {alertas.lixo.length > 0 && (
                  <div className="flex items-start gap-2 text-xs">
                    <UserX className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">{alertas.lixo.length} registros com dados incompletos</p>
                      <p className="text-muted-foreground">Sem nome ou telefone inválido</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Meta vs Realizado + Resumo IA */}
          <GoalProgress valorFechado={valorGanho} receitaPrevista={valorPipeline} />

          <ExecutiveSummary
            kpis={{
              receitaPrevista: valorPipeline, valorGanho, taxaConversao: solPerf.total > 0 ? (statusCounts['QUALIFICADO'] / solPerf.total) * 100 : 0,
              ticketMedio: statusCounts['GANHO'] > 0 ? valorGanho / statusCounts['GANHO'] : 0,
              totalNegocios: filtered.length, negociosGanhos: statusCounts['GANHO'],
              negociosPerdidos: statusCounts['PERDIDO'] + statusCounts['DESQUALIFICADO'],
              negociosAbertos: statusCounts['EM_QUALIFICACAO'] + statusCounts['FOLLOW_UP'] + statusCounts['QUALIFICADO'],
              valorPipeline, cicloProposta: 0,
            }}
            healthScore={Math.min(Math.round((solPerf.total > 0 ? (statusCounts['QUALIFICADO'] / solPerf.total) * 100 : 0) * 4), 100)}
            alertCount={alertas.semAtividade.length + alertas.aguardandoCL.length}
            topVendedor="SOL Agent"
            funnelBottleneck={statusCounts['TRAFEGO_PAGO'] > 0 ? `Leads Recebidos → MQL (${((statusCounts['EM_QUALIFICACAO'] / statusCounts['TRAFEGO_PAGO']) * 100).toFixed(0)}%)` : "Dados insuficientes"}
          />

          <footer className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
            © 2026 Sol Estrateg.IA — Inteligência Comercial
          </footer>
        </>
      )}
    </div>
  );
};

export default Index;
