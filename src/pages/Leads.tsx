import { useMemo, useState, useEffect, useRef } from "react";
import { Loader2, AlertCircle, CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useGoogleSheetsData } from "@/hooks/useGoogleSheetsData";
import {
  adaptSheetData,
  getLeadsKPIs,
  getLeadsByEtapa,
  getTemperaturaPorEtapa,
  getSolPerformance,
  getScorePorOrigem,
  getSolSDRMetrics,
  getGargalosData,
  getLeadsQuentesAbandonados,
  getROIPorOrigem,
} from "@/data/dataAdapter";
import { formatCurrencyAbbrev } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip,
} from "recharts";
import type { Proposal } from "@/data/dataAdapter";

/* ───────── animated counter ───────── */
function useAnimatedNumber(target: number, duration = 1200, isDecimal = false) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    started.current = false;
    setValue(0);
  }, [target]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(isDecimal ? +(target * eased).toFixed(1) : Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, isDecimal]);

  return { value, ref };
}

/* ───────── temp dot ───────── */
function TempDot({ temp }: { temp: string }) {
  const cls = temp === "QUENTE"
    ? "bg-destructive/80"
    : temp === "FRIO"
      ? "bg-blue-500/80"
      : "bg-warning/80";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${cls}`} />
      <span className="capitalize">{temp.toLowerCase()}</span>
    </span>
  );
}

/* ───────── KPI card inline ───────── */
function KPICard({ label, value, suffix, isDecimal }: { label: string; value: number; suffix?: string; isDecimal?: boolean }) {
  const { value: animVal, ref } = useAnimatedNumber(value, 1400, isDecimal);
  return (
    <div ref={ref} className="rounded-lg border border-border/50 bg-card p-4 transition-all duration-200 hover:border-border">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">{label}</p>
      <p className="text-2xl font-bold text-foreground tabular-nums">
        {animVal}{suffix || ""}
      </p>
    </div>
  );
}

/* ═══════════════════ MAIN ═══════════════════ */
export default function Leads() {
  const { data: sheetsData, isLoading, error, refetch } = useGoogleSheetsData();

  const proposals = useMemo(() => {
    if (!sheetsData?.data) return [];
    return adaptSheetData(sheetsData.data);
  }, [sheetsData]);

  /* ── filters ── */
  const [periodo, setPeriodo] = useState("30d");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [etapaFilter, setEtapaFilter] = useState("todas");
  const [temperaturaFilter, setTemperaturaFilter] = useState("todas");
  const [responsavelFilter, setResponsavelFilter] = useState("todos");

  const etapas = useMemo(() => [...new Set(proposals.map(p => p.etapa))].filter(Boolean).sort(), [proposals]);
  const responsaveis = useMemo(() => [...new Set(proposals.map(p => p.responsavel))].filter(Boolean).sort(), [proposals]);

  const hasFilters = periodo !== "30d" || etapaFilter !== "todas" || temperaturaFilter !== "todas" || responsavelFilter !== "todos" || dateFrom || dateTo;
  const clearFilters = () => {
    setPeriodo("30d");
    setDateFrom(undefined);
    setDateTo(undefined);
    setEtapaFilter("todas");
    setTemperaturaFilter("todas");
    setResponsavelFilter("todos");
  };

  /* ── filtered data ── */
  const filtered = useMemo(() => {
    let data = [...proposals];

    // Period
    if (periodo !== "custom") {
      const days = periodo === "7d" ? 7 : periodo === "90d" ? 90 : 30;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      data = data.filter(p => {
        if (!p.dataCriacaoProposta) return true;
        return new Date(p.dataCriacaoProposta) >= cutoff;
      });
    } else if (dateFrom || dateTo) {
      data = data.filter(p => {
        if (!p.dataCriacaoProposta) return true;
        const d = new Date(p.dataCriacaoProposta);
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
        return true;
      });
    }

    if (etapaFilter !== "todas") data = data.filter(p => p.etapa === etapaFilter);
    if (temperaturaFilter !== "todas") data = data.filter(p => p.temperatura === temperaturaFilter);
    if (responsavelFilter !== "todos") data = data.filter(p => p.responsavel === responsavelFilter);

    return data;
  }, [proposals, periodo, dateFrom, dateTo, etapaFilter, temperaturaFilter, responsavelFilter]);

  /* ── computed data ── */
  const kpis = useMemo(() => getLeadsKPIs(filtered), [filtered]);
  const etapaData = useMemo(() => getLeadsByEtapa(filtered), [filtered]);
  const tempPorEtapa = useMemo(() => getTemperaturaPorEtapa(filtered), [filtered]);
  const solPerf = useMemo(() => getSolPerformance(filtered), [filtered]);
  const origensExcluidas = ["sem etiqueta", "presencial", "orgânico", "organico", "indicação", "indicacao"];
  const scorePorOrigem = useMemo(() => getScorePorOrigem(filtered).filter(o => !origensExcluidas.includes(o.origem.toLowerCase())), [filtered]);
  const solSdr = useMemo(() => getSolSDRMetrics(filtered), [filtered]);
  const gargalos = useMemo(() => getGargalosData(filtered), [filtered]);
  const quentesAband = useMemo(() => getLeadsQuentesAbandonados(filtered), [filtered]);
  const roiOrigem = useMemo(() => getROIPorOrigem(filtered).filter(o => !origensExcluidas.includes(o.origem.toLowerCase())), [filtered]);

  const valorTotal = useMemo(() => filtered.reduce((a, p) => a + p.valorProposta, 0), [filtered]);
  const ticketMedio = useMemo(() => filtered.length > 0 ? valorTotal / filtered.length : 0, [valorTotal, filtered]);

  /* ── Sol daily activity (last 7 days) ── */
  const solDailyActivity = useMemo(() => {
    const today = new Date();
    const days: { date: string; label: string; qualificados: number; scores: number; quentes: number; mornos: number; frios: number; valorPipeline: number }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const label = i === 0 ? "Hoje" : i === 1 ? "Ontem" : format(d, "dd/MM", { locale: ptBR });

      const qualificadosNoDia = proposals.filter(p => {
        if (!p.dataQualificacaoSol) return false;
        return p.dataQualificacaoSol.startsWith(dateStr);
      });

      const atualizadosNoDia = proposals.filter(p => {
        if (!p.ultimaAtualizacao) return false;
        return p.ultimaAtualizacao.startsWith(dateStr);
      });

      const leadsAtivos = [...new Set([...qualificadosNoDia, ...atualizadosNoDia])];

      days.push({
        date: dateStr,
        label,
        qualificados: qualificadosNoDia.length,
        scores: qualificadosNoDia.filter(p => p.solScore > 0).length,
        quentes: qualificadosNoDia.filter(p => p.temperatura === "QUENTE").length,
        mornos: qualificadosNoDia.filter(p => p.temperatura === "MORNO").length,
        frios: qualificadosNoDia.filter(p => p.temperatura === "FRIO").length,
        valorPipeline: leadsAtivos.reduce((a, p) => a + p.valorProposta, 0),
      });
    }
    return days;
  }, [proposals]);

  const solHoje = solDailyActivity[0];
  const solSemana = useMemo(() => ({
    qualificados: solDailyActivity.reduce((a, d) => a + d.qualificados, 0),
    scores: solDailyActivity.reduce((a, d) => a + d.scores, 0),
    quentes: solDailyActivity.reduce((a, d) => a + d.quentes, 0),
    valor: solDailyActivity.reduce((a, d) => a + d.valorPipeline, 0),
  }), [solDailyActivity]);

  const maxDailyQual = useMemo(() => Math.max(...solDailyActivity.map(d => d.qualificados), 1), [solDailyActivity]);

  /* ── funnel animation ── */
  const [funnelVisible, setFunnelVisible] = useState(false);
  const funnelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = funnelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setFunnelVisible(true); }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const maxFunnel = useMemo(() => Math.max(...etapaData.map(e => e.quantidade), 1), [etapaData]);

  /* ── clock ── */
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* ── loading / error ── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">Erro ao carregar dados</p>
        <Button onClick={() => refetch()} variant="outline">Tentar novamente</Button>
      </div>
    );
  }

  /* ── insights (alerts) ── */
  const alerts: { type: "alert" | "info" | "success"; title: string; desc: string }[] = [];
  if (quentesAband.length > 0) {
    alerts.push({ type: "alert", title: `${quentesAband.length} leads quentes parados`, desc: `Leads quentes sem movimentação há mais de 7 dias.` });
  }
  if (kpis.taxaQualificacao > 50) {
    alerts.push({ type: "success", title: `Taxa de qualificação ${kpis.taxaQualificacao.toFixed(0)}%`, desc: "Performance acima da média de mercado." });
  }
  if (gargalos.length > 0) {
    const pior = gargalos[0];
    alerts.push({ type: "info", title: `Gargalo: ${pior.etapa}`, desc: `${pior.quantidade} leads com média de ${pior.tempoMedio} dias na etapa.` });
  }
  if (solPerf.conversaoSolFechamento > 0) {
    alerts.push({ type: "success", title: `Conversão Sol → Fechamento: ${solPerf.conversaoSolFechamento.toFixed(1)}%`, desc: `De ${solPerf.totalQualificados} qualificados pela Sol.` });
  }
  // Leads não qualificados parados
  const naoQualStale = filtered.filter(p => !p.solQualificado && p.tempoNaEtapa > 5);
  if (naoQualStale.length > 0) {
    alerts.push({ type: "alert", title: `${naoQualStale.length} leads sem qualificação há +5 dias`, desc: "Leads aguardando análise da Sol há mais de 5 dias." });
  }
  // Sol today activity
  if (solHoje.qualificados > 0) {
    alerts.push({ type: "success", title: `Sol qualificou ${solHoje.qualificados} leads hoje`, desc: `${solHoje.quentes} quentes · ${solHoje.mornos} mornos · ${solHoje.frios} frios` });
  } else {
    alerts.push({ type: "info", title: "Nenhuma qualificação hoje", desc: "A Sol ainda não processou leads hoje." });
  }

  /* ── top leads for table ── */
  const tableLeads = filtered.slice(0, 15);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-6 pb-16">

        {/* ══════ HEADER ══════ */}
        <header className="sticky top-0 z-50 py-5 flex items-center justify-between bg-background/95 backdrop-blur-sm border-b border-border/40">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">Dashboard de Leads</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Qualificação, jornada e performance · {filtered.length} leads</p>
          </div>
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Dados reais
            </span>
            <span className="text-xs text-muted-foreground font-mono tabular-nums">
              {time.toLocaleTimeString("pt-BR")}
            </span>
          </div>
        </header>

        {/* ══════ FILTROS ══════ */}
        <section className="mt-4 flex flex-wrap items-center gap-2">
          <Select value={periodo} onValueChange={(v) => { setPeriodo(v); setDateFrom(undefined); setDateTo(undefined); }}>
            <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {periodo === "custom" && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1.5", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dateFrom ? format(dateFrom, "dd/MM/yy") : "Início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={ptBR} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1.5", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dateTo ? format(dateTo, "dd/MM/yy") : "Fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={ptBR} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </>
          )}

          <div className="h-4 w-px bg-border/50 mx-1" />

          <Select value={etapaFilter} onValueChange={setEtapaFilter}>
            <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Etapa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as etapas</SelectItem>
              {etapas.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={temperaturaFilter} onValueChange={setTemperaturaFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Temperatura" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="QUENTE">Quente</SelectItem>
              <SelectItem value="MORNO">Morno</SelectItem>
              <SelectItem value="FRIO">Frio</SelectItem>
            </SelectContent>
          </Select>

          <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
            <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Responsável" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {responsaveis.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground gap-1" onClick={clearFilters}>
              <X className="h-3 w-3" /> Limpar
            </Button>
          )}
        </section>

        {/* ══════ KPIs ══════ */}
        <section className="grid grid-cols-2 lg:grid-cols-6 gap-3 mt-4">
          <KPICard label="Total Leads" value={kpis.total} />
          <KPICard label="Qualificados Sol" value={kpis.qualificados} />
          <KPICard label="Aguardando Qualif." value={kpis.naoQualificados} />
          <KPICard label="Taxa Qualificação" value={kpis.taxaQualificacao} suffix="%" isDecimal />
          <KPICard label="Score Médio" value={kpis.scoreMedio} isDecimal />
          <KPICard label="Pipeline" value={Math.round(valorTotal / 1000)} suffix="K" />
        </section>

        {/* ══════ SOL HOJE — ATIVIDADE DIÁRIA ══════ */}
        <section className="mt-6 rounded-xl border border-primary/20 bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-lg">🤖</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-tight">Sol Hoje</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Atividade diária da inteligência artificial</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Última 7 dias</p>
              <p className="text-sm font-bold text-foreground tabular-nums">{solSemana.qualificados} qualificações</p>
            </div>
          </div>

          <div className="p-6">
            {/* Today's highlight */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {[
                { label: "Qualificados Hoje", value: solHoje.qualificados, highlight: true },
                { label: "Scores Atribuídos", value: solHoje.scores },
                { label: "Leads Quentes", value: solHoje.quentes },
                { label: "Leads Mornos", value: solHoje.mornos },
                { label: "Leads Frios", value: solHoje.frios },
              ].map((m, i) => (
                <div key={i} className={cn(
                  "rounded-lg p-3 text-center transition-all",
                  m.highlight ? "bg-primary/10 border border-primary/20" : "bg-secondary/40"
                )}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{m.label}</p>
                  <p className={cn("text-2xl font-bold tabular-nums", m.highlight ? "text-primary" : "text-foreground")}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* 7-day timeline */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-medium">Movimento dos últimos 7 dias</p>
              <div className="flex items-end gap-2 h-24">
                {[...solDailyActivity].reverse().map((day, i) => {
                  const heightPct = maxDailyQual > 0 ? (day.qualificados / maxDailyQual) * 100 : 0;
                  const isToday = i === solDailyActivity.length - 1;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-foreground tabular-nums">{day.qualificados > 0 ? day.qualificados : ""}</span>
                      <div className="w-full rounded-t-sm overflow-hidden bg-secondary/30" style={{ height: "64px" }}>
                        <div
                          className={cn(
                            "w-full rounded-t-sm transition-all duration-700 ease-out",
                            isToday ? "bg-primary" : "bg-primary/40"
                          )}
                          style={{
                            height: `${Math.max(heightPct, 4)}%`,
                            marginTop: `${100 - Math.max(heightPct, 4)}%`,
                          }}
                        />
                      </div>
                      <span className={cn("text-[9px] tabular-nums", isToday ? "text-foreground font-bold" : "text-muted-foreground")}>{day.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekly summary */}
            <div className="mt-5 pt-4 border-t border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-[10px] text-muted-foreground">
                  Semana: <strong className="text-foreground">{solSemana.qualificados}</strong> qualificações ·{" "}
                  <strong className="text-foreground">{solSemana.quentes}</strong> quentes ·{" "}
                  <strong className="text-foreground">{solSemana.scores}</strong> scores
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Pipeline movimentado: <strong className="text-foreground">{formatCurrencyAbbrev(solSemana.valor)}</strong>
              </span>
            </div>
          </div>
        </section>

        {/* ══════ ROI Summary ══════ */}
        <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "Receita em Pipeline", value: formatCurrencyAbbrev(valorTotal), sub: `${filtered.length} leads ativos` },
            { label: "Ticket Médio", value: formatCurrencyAbbrev(ticketMedio), sub: `por proposta` },
            { label: "Leads Quentes", value: `${kpis.quentes}`, sub: `${kpis.mornos} mornos · ${kpis.frios} frios` },
          ].map((item, i) => (
            <div key={i} className="rounded-lg border border-border/50 bg-card p-5">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">{item.label}</p>
              <p className="text-3xl font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-1.5">{item.sub}</p>
            </div>
          ))}
        </section>

        {/* ══════ Grid: Funil + Alerts ══════ */}
        {/* ══════ Alertas & Insights (full width) ══════ */}
        <section className="mt-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Alertas & Insights</h3>
          {alerts.length === 0 ? (
            <div className="rounded-lg border border-border/50 bg-card p-4">
              <p className="text-xs text-muted-foreground">Nenhum alerta no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {alerts.map((ins, i) => {
                const borderCls = ins.type === "alert" ? "border-l-destructive/60" : ins.type === "info" ? "border-l-warning/60" : "border-l-emerald-500/60";
                const labelCls = ins.type === "alert" ? "text-destructive" : ins.type === "info" ? "text-warning" : "text-emerald-500";
                return (
                  <div key={i} className={`rounded-lg border border-border/50 bg-card p-4 border-l-2 ${borderCls} transition-colors hover:border-border`}>
                    <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${labelCls}`}>
                      {ins.type === "alert" ? "Atenção" : ins.type === "info" ? "Info" : "Positivo"}
                    </p>
                    <p className="text-sm font-medium text-foreground mb-1">{ins.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{ins.desc}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ══════ Grid: Funil + Score ══════ */}
        <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Funil por Etapa */}
          <div ref={funnelRef} className="rounded-lg border border-border/50 bg-card p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Funil por Etapa</h3>
            <div className="space-y-2.5">
              {etapaData.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-36 text-[11px] text-muted-foreground truncate">{f.etapa}</span>
                  <div className="flex-1 h-6 rounded bg-secondary/50 overflow-hidden">
                    <div
                      className="h-full rounded bg-primary/70 flex items-center justify-end pr-2 transition-all duration-1000 ease-out"
                      style={{
                        width: funnelVisible ? `${(f.quantidade / maxFunnel) * 100}%` : "0%",
                        transitionDelay: `${i * 80}ms`,
                      }}
                    >
                      <span className="text-[10px] font-semibold text-primary-foreground">{f.quantidade}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Score por Origem chart */}
          <div className="rounded-lg border border-border/50 bg-card p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Score Médio por Origem</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scorePorOrigem.slice(0, 8)} barCategoryGap="25%">
                <XAxis dataKey="origem" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-15} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 6,
                    color: "hsl(var(--foreground))",
                    fontSize: 12,
                  }}
                  cursor={{ fill: "hsl(var(--secondary) / 0.3)" }}
                  formatter={(v: number) => v.toFixed(1)}
                />
                <Bar dataKey="scoreMedio" name="Score" radius={[4, 4, 0, 0]}>
                  {scorePorOrigem.slice(0, 8).map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.5)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ══════ Tabela ══════ */}
        <section className="mt-6 rounded-lg border border-border/50 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leads Detalhados</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  {["Cliente", "Etapa", "Qualificado", "Status", "Temperatura", "Score", "SLA (dias)", "Valor"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableLeads.map((l, i) => (
                  <tr key={l.id || i} className="border-b border-border/20 transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium text-foreground">{l.nomeCliente}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{l.etapa}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded",
                        l.solQualificado
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-secondary text-muted-foreground"
                      )}>
                        {l.solQualificado ? "Sim" : "Pendente"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "text-[11px] font-medium px-2 py-0.5 rounded",
                        l.status === "Ganho" ? "bg-emerald-500/10 text-emerald-500" :
                        l.status === "Perdido" ? "bg-destructive/10 text-destructive" :
                        "bg-secondary text-muted-foreground"
                      )}>{l.status}</span>
                    </td>
                    <td className="px-4 py-3">{l.temperatura ? <TempDot temp={l.temperatura} /> : "—"}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-foreground tabular-nums">{l.solScore > 0 ? l.solScore.toFixed(1) : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs tabular-nums">{l.tempoNaEtapa}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{formatCurrencyAbbrev(l.valorProposta)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ══════ Bottom Grid ══════ */}
        <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Temperatura por etapa */}
          <div className="rounded-lg border border-border/50 bg-card p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Temperatura por Etapa</h3>
            <div className="space-y-3">
              {tempPorEtapa.slice(0, 6).map((t, i) => {
                const total = t.quente + t.morno + t.frio + t.sem;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-muted-foreground truncate w-28">{t.etapa}</span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">{total}</span>
                    </div>
                    <div className="flex h-3 rounded overflow-hidden bg-secondary/50">
                      {t.quente > 0 && <div className="bg-destructive/60 h-full" style={{ width: `${(t.quente / total) * 100}%` }} />}
                      {t.morno > 0 && <div className="bg-warning/60 h-full" style={{ width: `${(t.morno / total) * 100}%` }} />}
                      {t.frio > 0 && <div className="bg-blue-500/60 h-full" style={{ width: `${(t.frio / total) * 100}%` }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance Sol */}
          <div className="rounded-lg border border-border/50 bg-card p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Performance Sol</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Qualificados", val: solPerf.totalQualificados },
                { label: "Score Médio", val: solPerf.scoreMedio.toFixed(1) },
                { label: "Sol → Proposta", val: `${solPerf.conversaoSolProposta.toFixed(0)}%` },
                { label: "Sol → Fechamento", val: `${solPerf.conversaoSolFechamento.toFixed(0)}%` },
              ].map((m, i) => (
                <div key={i} className="rounded-md bg-secondary/40 p-3">
                  <p className="text-[10px] text-muted-foreground mb-0.5">{m.label}</p>
                  <p className="text-lg font-bold text-foreground tabular-nums">{m.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ROI por Origem (top 5) */}
          <div className="rounded-lg border border-border/50 bg-card p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">ROI por Origem</h3>
            <div className="space-y-3">
              {roiOrigem.slice(0, 5).map((o, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-24 text-[11px] text-muted-foreground truncate">{o.origem}</span>
                  <div className="flex-1 h-4 rounded bg-secondary/50 overflow-hidden">
                    <div className="h-full rounded bg-primary/60" style={{ width: `${Math.min((o.totalLeads / (roiOrigem[0]?.totalLeads || 1)) * 100, 100)}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-8 text-right tabular-nums">{o.totalLeads}</span>
                  <span className="text-[11px] text-muted-foreground w-12 text-right tabular-nums">{o.taxaConversao.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ RODAPÉ ══════ */}
        <footer className="mt-12 mb-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/40 font-medium">
            RBR Consult × Dashboard de Leads
          </p>
        </footer>
      </div>
    </div>
  );
}
