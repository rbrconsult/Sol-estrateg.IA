import { useMemo } from "react";
import { RefreshCw, AlertCircle, Users, MessageSquare, UserCheck, UserX, Trophy, Repeat, Bot, Zap } from "lucide-react";
import { useSolLeadsSync } from "@/hooks/useSolLeadsSync";
import { useSolMetricasSync } from "@/hooks/useSolSyncTables";
import { getStatusLabel, STATUS_LABELS } from "@/lib/leadClassification";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HelpButton } from "@/components/HelpButton";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { PageFloatingFilter } from "@/components/filters/PageFloatingFilter";
import { ExecutiveSummary } from "@/components/dashboard/ExecutiveSummary";
import { GoalProgress } from "@/components/dashboard/GoalProgress";
import { Skeleton } from "@/components/ui/skeleton";

// ── Funil visual baseado nos status do DS ──
const FUNNEL_STAGES = [
  { key: 'TRAFEGO_PAGO', color: 'bg-blue-500', icon: Users, desc: 'Preencheram formulário — SOL ainda não iniciou conversa' },
  { key: 'EM_QUALIFICACAO', color: 'bg-amber-500', icon: MessageSquare, desc: 'SOL iniciou conversa e está qualificando' },
  { key: 'FOLLOW_UP', color: 'bg-violet-500', icon: Repeat, desc: 'Em acompanhamento pela SOL' },
  { key: 'QUALIFICADO', color: 'bg-emerald-500', icon: UserCheck, desc: 'SOL qualificou e transferiu pro closer' },
  { key: 'DESQUALIFICADO', color: 'bg-red-500', icon: UserX, desc: 'Não atende critérios de qualificação' },
  { key: 'GANHO', color: 'bg-green-600', icon: Trophy, desc: 'Negócio fechado' },
  { key: 'CONTRATO', color: 'bg-primary', icon: Trophy, desc: 'Contrato assinado' },
];

const Index = () => {
  const { data: leads, isLoading, error } = useSolLeadsSync();
  const { data: metricas } = useSolMetricasSync();
  const { selectedOrgName } = useOrgFilter();
  const gf = useGlobalFilters();

  const lastUpdate = useMemo(() => new Date().toLocaleString('pt-BR'), []);

  // ── Filtragem por período ──
  const filtered = useMemo(() => {
    if (!leads?.length) return [];
    const { from, to } = gf.effectiveDateRange;
    if (!from && !to) return leads;
    return leads.filter(l => {
      const d = new Date(l.ts_cadastro || l.synced_at || '');
      if (isNaN(d.getTime())) return true; // keep if no date
      if (from) { const f = new Date(from); f.setHours(0,0,0,0); if (d < f) return false; }
      if (to) { const t = new Date(to); t.setHours(23,59,59,999); if (d > t) return false; }
      return true;
    });
  }, [leads, gf.effectiveDateRange]);

  // ── Contagens por status ──
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    FUNNEL_STAGES.forEach(s => counts[s.key] = 0);
    counts['PERDIDO'] = 0;
    filtered.forEach(l => {
      const s = (l.status || 'TRAFEGO_PAGO').toUpperCase();
      if (counts[s] !== undefined) counts[s]++;
      else counts['TRAFEGO_PAGO']++; // unknown status → tráfego
    });
    return counts;
  }, [filtered]);

  // ── KPIs derivados ──
  const kpis = useMemo(() => {
    const total = filtered.length;
    const qualificados = statusCounts['QUALIFICADO'] + statusCounts['GANHO'] + statusCounts['CONTRATO'];
    const taxaQualificacao = total > 0 ? (qualificados / total) * 100 : 0;

    // FUP Frio: leads com fup_followup_count > 0
    const fupFrioTotal = filtered.filter(l => (l.fup_followup_count || 0) > 0).length;
    const fupResgatados = filtered.filter(l => 
      (l.fup_followup_count || 0) > 0 && 
      ['EM_QUALIFICACAO', 'QUALIFICADO', 'GANHO'].includes(l.status || '')
    ).length;

    // SOL metrics
    const totalMensagensIA = filtered.reduce((a, l) => a + (l.total_mensagens_ia || 0), 0);
    const totalAudios = filtered.reduce((a, l) => a + (l.total_audios_enviados || 0), 0);
    const custoTotal = filtered.reduce((a, l) => a + (l.custo_total_usd || 0), 0);

    // Score médio
    const scores = filtered.filter(l => l.score && parseFloat(l.score) > 0).map(l => parseFloat(l.score!));
    const scoreMedio = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // Valor pipeline
    const valorPipeline = filtered.reduce((a, l) => a + (parseFloat(l.valor_conta || '0') || 0), 0);

    // Ganhos valor
    const ganhos = filtered.filter(l => l.status === 'GANHO' || l.status === 'CONTRATO');
    const valorGanho = ganhos.reduce((a, l) => a + (parseFloat(l.valor_conta || '0') || 0), 0);

    return {
      total, qualificados, taxaQualificacao,
      fupFrioTotal, fupResgatados,
      totalMensagensIA, totalAudios, custoTotal,
      scoreMedio, valorPipeline, valorGanho,
      ganhos: ganhos.length,
      desqualificados: statusCounts['DESQUALIFICADO'],
    };
  }, [filtered, statusCounts]);

  // ── Funil data ──
  const funnelData = useMemo(() => {
    return FUNNEL_STAGES
      .map(s => ({ ...s, count: statusCounts[s.key] || 0 }))
      .filter(s => s.count > 0 || ['TRAFEGO_PAGO', 'EM_QUALIFICACAO', 'QUALIFICADO', 'GANHO'].includes(s.key));
  }, [statusCounts]);

  const maxFunnel = Math.max(...funnelData.map(d => d.count), 1);

  // ── Metricas aggregated ──
  const metricasAgg = useMemo(() => {
    if (!metricas?.length) return null;
    const agg = { leads_novos: 0, leads_qualificados: 0, leads_transferidos: 0, custo_total: 0 };
    metricas.forEach(m => {
      agg.leads_novos += m.leads_novos || 0;
      agg.leads_qualificados += m.leads_qualificados || 0;
      agg.leads_transferidos += m.leads_transferidos || 0;
      agg.custo_total += Number(m.custo_total) || 0;
    });
    return agg;
  }, [metricas]);

  const hasData = (leads?.length ?? 0) > 0;
  const isEmpty = !isLoading && !hasData && !error;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Inteligência SOL v2 • Atualizado em {lastUpdate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedOrgName && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
              🏢 {selectedOrgName}
            </Badge>
          )}
          <HelpButton moduleId="bi-estrategico" label="Ajuda do Dashboard" />
        </div>
      </div>

      <PageFloatingFilter
        filters={gf.filters} hasFilters={gf.hasFilters} clearFilters={gf.clearFilters}
        setPeriodo={gf.setPeriodo} setDateFrom={gf.setDateFrom} setDateTo={gf.setDateTo}
        setTemperatura={gf.setTemperatura} setSearchTerm={gf.setSearchTerm} setEtapa={gf.setEtapa} setStatus={gf.setStatus}
        config={{ showPeriodo: true, showTemperatura: true, showSearch: true, showEtapa: false, showStatus: true, searchPlaceholder: "Buscar lead..." }}
      />

      {error && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription>Erro ao carregar dados: {error.message}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      )}

      {isEmpty && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription>
            Aguardando sincronização — as tabelas serão populadas automaticamente pelo cron-sync.
          </AlertDescription>
        </Alert>
      )}

      {hasData && !isLoading && (
        <>
          {/* ── Badge de status ── */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              {filtered.length} leads na base
            </span>
          </div>

          {/* ── KPIs principais — 4 colunas ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Recebidos", value: kpis.total, icon: Users, color: "text-blue-400", sub: "Leads que entraram" },
              { label: getStatusLabel('TRAFEGO_PAGO'), value: statusCounts['TRAFEGO_PAGO'], icon: Users, color: "text-blue-500", sub: "Formulário — SOL não entrou" },
              { label: getStatusLabel('EM_QUALIFICACAO'), value: statusCounts['EM_QUALIFICACAO'], icon: MessageSquare, color: "text-amber-500", sub: "SOL em conversa ativa" },
              { label: getStatusLabel('QUALIFICADO'), value: statusCounts['QUALIFICADO'], icon: UserCheck, color: "text-emerald-500", sub: "Qualificados pela SOL" },
              { label: "Desqualificados", value: kpis.desqualificados, icon: UserX, color: "text-destructive", sub: "Não atendem critérios" },
              { label: getStatusLabel('GANHO'), value: kpis.ganhos, icon: Trophy, color: "text-green-500", sub: "Negócios fechados" },
              { label: "Taxa Qualificação", value: `${kpis.taxaQualificacao.toFixed(1)}%`, icon: Zap, color: "text-primary", sub: "Qualificados / Total" },
              { label: "Score Médio", value: kpis.scoreMedio.toFixed(1), icon: Bot, color: "text-primary", sub: "Nota média SOL" },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-border bg-card p-4 space-y-1 shadow-sm">
                <div className="flex items-center gap-2">
                  <k.icon className={`h-4 w-4 ${k.color}`} />
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                </div>
                <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-[10px] text-muted-foreground">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Funil Visual ── */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold mb-1">Funil Lead → Venda</h3>
            <p className="text-xs text-muted-foreground mb-6">Jornada completa baseada no status do Data Store</p>
            <div className="space-y-3">
              {funnelData.map((stage, i) => {
                const pct = Math.max((stage.count / maxFunnel) * 100, 5);
                const prevCount = i > 0 ? funnelData[i - 1].count : null;
                const convRate = prevCount && prevCount > 0 ? ((stage.count / prevCount) * 100).toFixed(1) : null;
                const Icon = stage.icon;
                return (
                  <div key={stage.key} className="flex items-center gap-3">
                    <div className="w-28 flex items-center gap-1.5 justify-end">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-right">{getStatusLabel(stage.key)}</span>
                    </div>
                    <div className="flex-1 relative">
                      <div
                        className={`h-10 rounded-lg ${stage.color} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      >
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white drop-shadow-sm">
                          {stage.count}
                        </span>
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      {convRate && <span className="text-xs text-muted-foreground">{convRate}%</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* ── FUP Frio + Métricas SOL ── */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* FUP Frio */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Repeat className="h-4 w-4 text-violet-500" />
                <h3 className="text-sm font-semibold">Follow-Up Frio</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Leads que ficaram inativos e foram reengajados pela SOL
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-violet-500">{kpis.fupFrioTotal}</p>
                  <p className="text-xs text-muted-foreground">Total em FUP Frio</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-500">{kpis.fupResgatados}</p>
                  <p className="text-xs text-muted-foreground">Resgatados (voltaram ao funil)</p>
                </div>
              </div>
              {kpis.fupFrioTotal > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Taxa de resgate: <span className="font-bold text-foreground">
                      {((kpis.fupResgatados / kpis.fupFrioTotal) * 100).toFixed(1)}%
                    </span>
                  </p>
                </div>
              )}
            </Card>

            {/* Métricas SOL */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Performance SOL</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-primary">{kpis.totalMensagensIA.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground">Mensagens IA enviadas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{kpis.totalAudios.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground">Áudios enviados</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-500">${kpis.custoTotal.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Custo total USD</p>
                </div>
                {metricasAgg && (
                  <div>
                    <p className="text-2xl font-bold text-emerald-500">{metricasAgg.leads_transferidos}</p>
                    <p className="text-xs text-muted-foreground">Transferidos ao Comercial</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ── Meta vs Realizado ── */}
          <GoalProgress valorFechado={kpis.valorGanho} receitaPrevista={kpis.valorPipeline} />

          {/* ── Resumo Executivo IA ── */}
          <ExecutiveSummary
            kpis={{
              receitaPrevista: kpis.valorPipeline,
              valorGanho: kpis.valorGanho,
              taxaConversao: kpis.taxaQualificacao,
              ticketMedio: kpis.ganhos > 0 ? kpis.valorGanho / kpis.ganhos : 0,
              totalNegocios: kpis.total,
              negociosGanhos: kpis.ganhos,
              negociosPerdidos: kpis.desqualificados,
              negociosAbertos: statusCounts['EM_QUALIFICACAO'] + statusCounts['FOLLOW_UP'] + statusCounts['QUALIFICADO'],
              valorPipeline: kpis.valorPipeline,
              cicloProposta: 0,
            }}
            healthScore={Math.min(Math.round(kpis.taxaQualificacao * 4), 100)}
            alertCount={0}
            topVendedor="SOL Agent"
            funnelBottleneck={
              statusCounts['TRAFEGO_PAGO'] > 0 && statusCounts['EM_QUALIFICACAO'] > 0
                ? `Leads Recebidos → MQL (${((statusCounts['EM_QUALIFICACAO'] / statusCounts['TRAFEGO_PAGO']) * 100).toFixed(0)}%)`
                : "Dados insuficientes"
            }
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
