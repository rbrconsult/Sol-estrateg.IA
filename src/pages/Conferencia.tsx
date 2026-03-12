import { useState, useEffect, useRef, useMemo } from "react";
import { format, differenceInDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X, ArrowRight, RotateCcw, ChevronDown, ChevronUp, AlertTriangle, Info, CheckCircle2, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  kpiCards as mockKpiCards, pipelineStages as mockPipeline, origemLeads as mockOrigem,
  fupFrio as mockFupFrio, desqualMotivos as mockDesqual,
  mensagens as mockMensagens, sla as mockSla, heatmap as mockHeatmap, taxaPorTentativa as mockTaxa,
  solHojeMock, alertasMock, temperaturaPorEtapaMock, tabelaLeadsMock,
  slaMock as mockSlaMock, robotInsightsMock as mockRobotInsights, scorePorOrigemMock as mockScoreOrigem,
} from "@/data/conferenciaMockData";
import { useConferenciaData, type KPICard } from "@/hooks/useConferenciaData";
import { SLAMetricsMock } from "@/components/conferencia/SLAMetricsMock";
import { RobotInsightsMock } from "@/components/conferencia/RobotInsightsMock";
import { ScorePorOrigem } from "@/components/conferencia/ScorePorOrigem";
import { MonthlyEvolution } from "@/components/conferencia/MonthlyEvolution";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";

/* ───────── animated counter hook ───────── */
function useAnimatedNumber(target: number, duration = 1200, isDecimal = false) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const prevTarget = useRef(target);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const from = prevTarget.current !== target ? prevTarget.current : 0;
    prevTarget.current = target;

    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (target - from) * eased;
      setValue(isDecimal ? +current.toFixed(1) : Math.round(current));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, isDecimal]);

  return { value, ref };
}

/* ───────── KPI Card ───────── */
function KPI({ label, target, suffix = "", detail, tooltip, highlight }: {
  label: string; target: number; suffix?: string; detail?: string; tooltip?: string; highlight?: boolean;
}) {
  const isDecimal = suffix === "%" || target % 1 !== 0;
  const { value, ref } = useAnimatedNumber(target, 1200, isDecimal);
  return (
    <div ref={ref} className={cn(
      "rounded-lg border bg-card p-4 flex flex-col items-center justify-center transition-all group relative min-h-[88px]",
      highlight
        ? "border-success/50 bg-success/5 hover:border-success/70"
        : "border-border/50 hover:border-primary/40"
    )}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2 text-center leading-tight">
        {label}
        {tooltip && (
          <span className="ml-1 inline-block opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-primary/70 normal-case tracking-normal">
            ({tooltip})
          </span>
        )}
      </p>
      <p className={cn(
        "text-3xl font-extrabold tabular-nums leading-none",
        highlight ? "text-success" : "text-foreground"
      )}>
        {value}{suffix}
      </p>
      {detail && (
        <p className="text-[11px] text-muted-foreground/60 mt-1.5 tabular-nums text-center">{detail}</p>
      )}
    </div>
  );
}

/* ───────── SLA Gauge ───────── */
function SLAGauge({ pct }: { pct: number }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 90 ? "hsl(var(--success))" : pct >= 70 ? "hsl(var(--warning))" : "hsl(var(--destructive))";
  return (
    <div className="flex flex-col items-center justify-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="40" fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className="transition-all duration-1000"
        />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
          className="fill-foreground text-lg font-bold" style={{ fontSize: 18 }}>
          {pct}%
        </text>
      </svg>
      <p className="text-[10px] text-muted-foreground mt-1">abordados em ≤ 5min</p>
    </div>
  );
}

/* ───────── TempDot ───────── */
function TempDot({ t }: { t: string }) {
  const color = t === "QUENTE" ? "bg-orange-500" : t === "FRIO" ? "bg-blue-400" : "bg-amber-400";
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      <span className="text-[10px]">{t}</span>
    </span>
  );
}

/* ═══════════════════ MAIN PAGE ═══════════════════ */
export default function Conferencia() {
  const { data: realData, isLoading: dataLoading, hasData } = useConferenciaData();

  // Use real data when available, fallback to mock
  const kpiCards = realData?.kpiCards ?? mockKpiCards;
  const pipelineStages = realData?.pipelineStages ?? mockPipeline;
  const origemLeads = realData?.origemLeads ?? mockOrigem;
  const fupFrio = realData?.fupFrio ?? mockFupFrio;
  const desqualMotivos = realData?.desqualMotivos ?? mockDesqual;
  const mensagens = realData?.mensagens ?? mockMensagens;
  const sla = realData?.sla ?? mockSla;
  const heatmap = realData?.heatmap ?? mockHeatmap;
  const taxaPorTentativa = realData?.taxaPorTentativa ?? mockTaxa;
  const solHojeData = realData?.solHoje ?? solHojeMock;
  const alertasData = realData?.alertas ?? alertasMock;
  const temperaturaPorEtapa = realData?.temperaturaPorEtapa ?? temperaturaPorEtapaMock;
  const tabelaLeads = realData?.tabelaLeads ?? tabelaLeadsMock;
  const slaMockData = realData?.slaMock ?? mockSlaMock;
  const robotInsightsData = realData?.robotInsights ?? mockRobotInsights;
  const scorePorOrigemData = realData?.scorePorOrigem ?? mockScoreOrigem;
  const monthlyEvolution = realData?.monthlyEvolution ?? [];

  const [expandedLead, setExpandedLead] = useState<number | null>(null);
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* filters */
  const [periodo, setPeriodo] = useState("30d");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [filterEtapa, setFilterEtapa] = useState("todas");
  const [filterTemp, setFilterTemp] = useState("todas");
  const [filterResp, setFilterResp] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");

  const hasFilters = periodo !== "30d" || dateFrom || dateTo || filterEtapa !== "todas" || filterTemp !== "todas" || filterResp !== "todos" || searchTerm;
  const clearFilters = () => { setPeriodo("30d"); setDateFrom(undefined); setDateTo(undefined); setFilterEtapa("todas"); setFilterTemp("todas"); setFilterResp("todos"); setSearchTerm(""); };

  const effectiveDateRange = useMemo(() => {
    const today = new Date();
    if (periodo === "custom") return { from: dateFrom, to: dateTo };
    if (periodo === "hoje") return { from: today, to: today };
    if (periodo === "3d") return { from: subDays(today, 3), to: today };
    if (periodo === "7d") return { from: subDays(today, 7), to: today };
    if (periodo === "30d") return { from: subDays(today, 30), to: today };
    if (periodo === "90d") return { from: subDays(today, 90), to: today };
    // "all" — no date filter
    return { from: undefined as Date | undefined, to: undefined as Date | undefined };
  }, [periodo, dateFrom, dateTo]);

  /** Filter leads by date range */
  const isInDateRange = (dateStr?: string) => {
    const { from: effFrom, to: effTo } = effectiveDateRange;
    if (!effFrom && !effTo) return true;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    if (effFrom && d < effFrom) return false;
    if (effTo) {
      const end = new Date(effTo);
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  };

  /** Date-filtered leads (base for ALL metrics) */
  const filteredLeads = useMemo(() => {
    return tabelaLeads
      .filter(l => isInDateRange((l as any).dataCriacao))
      .filter(l => filterEtapa === "todas" || l.etapa === filterEtapa)
      .filter(l => filterTemp === "todas" || l.temperatura === filterTemp)
      .filter(l => !searchTerm || l.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [filterEtapa, filterTemp, searchTerm, tabelaLeads, effectiveDateRange]);

  /** Derive KPIs: use original when no date filter, derive from filteredLeads when filtering */
  const hasDateFilter = !!(effectiveDateRange.from || effectiveDateRange.to);

  const filteredKpis = useMemo(() => {
    // When no date filter active (30d default), use the original computed KPIs from all proposals
    if (!hasDateFilter && filterEtapa === "todas" && filterTemp === "todas" && !searchTerm) {
      return kpiCards;
    }

    // When filtering, derive from filteredLeads
    const total = filteredLeads.length;
    const qualificados = filteredLeads.filter(l => l.etapa !== 'Robô SOL');
    const mqlCount = qualificados.length;
    const fechados = filteredLeads.filter(l => l.etapa === 'Fechado');
    const comProposta = filteredLeads.filter(l => ['Proposta', 'Fechado'].includes(l.etapa));
    const agendamentos = filteredLeads.filter(l => ['Closer', 'Proposta', 'Fechado'].includes(l.etapa));
    const taxaResp = kpiCards.find(k => k.label === 'Taxa Resposta');
    const fupCard = kpiCards.find(k => k.label === 'Resgatados FUP');

    return [
      { label: 'Leads Recebidos', value: total, suffix: '', detail: `${total} leads no período` },
      taxaResp || { label: 'Taxa Resposta', value: 0, suffix: '%', detail: '—' },
      { label: 'MQL', value: mqlCount, suffix: '', detail: `${total > 0 ? ((mqlCount / total) * 100).toFixed(0) : 0}%`, tooltip: 'Marketing Qualified Leads' },
      { label: 'SQL', value: comProposta.length, suffix: '', detail: `${mqlCount > 0 ? ((comProposta.length / mqlCount) * 100).toFixed(0) : 0}%`, tooltip: 'Sales Qualified Leads' },
      { label: 'Agendamentos', value: agendamentos.length, suffix: '', detail: `${comProposta.length > 0 ? ((agendamentos.length / comProposta.length) * 100).toFixed(0) : 0}%` },
      { label: 'Fechados', value: fechados.length, suffix: '', detail: `${total > 0 ? ((fechados.length / total) * 100).toFixed(0) : 0}%`, tooltip: 'Taxa de conversão geral' },
      fupCard ? { ...fupCard } : { label: 'Resgatados FUP', value: 0, suffix: '', detail: 'R$ 0' },
    ] as KPICard[];
  }, [filteredLeads, kpiCards, hasDateFilter, filterEtapa, filterTemp, searchTerm]);

  const filteredPipeline = useMemo(() => {
    if (!hasDateFilter && filterEtapa === "todas" && filterTemp === "todas" && !searchTerm) {
      return pipelineStages;
    }
    const stageOrder = ['Robô SOL', 'Qualificação', 'Qualificado', 'Closer', 'Proposta', 'Fechado'];
    const icons = ['🤖', '🎯', '✅', '📞', '📋', '🏆'];
    return stageOrder.map((etapa, i) => {
      const laterStages = stageOrder.slice(i);
      const count = filteredLeads.filter(l => laterStages.includes(l.etapa)).length;
      return { etapa, valor: count, icon: icons[i], desc: `${count} leads` };
    });
  }, [filteredLeads, pipelineStages, hasDateFilter, filterEtapa, filterTemp, searchTerm]);

  const filteredFup = useMemo(() => {
    // Keep original FUP data (not filtered by date for now)
    return fupFrio;
  }, [fupFrio]);

  const filteredMensagens = useMemo(() => mensagens, [mensagens]);

  const filteredHeatmap = useMemo(() => heatmap, [heatmap]);

  const filteredSolHoje = useMemo(() => solHojeData, [solHojeData]);

  const filteredTemperatura = useMemo(() => {
    if (!hasDateFilter && filterEtapa === "todas" && filterTemp === "todas" && !searchTerm) {
      return temperaturaPorEtapa;
    }
    const stageOrder = ['Robô SOL', 'Qualificação', 'Qualificado', 'Closer', 'Proposta'];
    return stageOrder.map(etapa => {
      const inStage = filteredLeads.filter(l => l.etapa === etapa);
      return {
        etapa,
        quente: inStage.filter(l => l.temperatura === 'QUENTE').length,
        morno: inStage.filter(l => l.temperatura === 'MORNO').length,
        frio: inStage.filter(l => l.temperatura === 'FRIO').length,
      };
    });
  }, [filteredLeads, temperaturaPorEtapa, hasDateFilter, filterEtapa, filterTemp, searchTerm]);

  const etapasUnicas = [...new Set(tabelaLeads.map(l => l.etapa))];

  const maxPipeline = Math.max(...filteredPipeline.map((s) => s.valor));
  const maxShare = Math.max(...origemLeads.map((o) => o.share));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-3 md:px-4 pb-12">

        {/* ══════ HEADER ══════ */}
        <header className="sticky top-0 z-50 py-4 flex items-center justify-between bg-background/95 backdrop-blur-sm border-b border-border/40">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight text-foreground">Sol Estrateg.IA</h1>
            {hasData && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-success/50 text-success">
                Dados reais
              </Badge>
            )}
            {dataLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Tempo real
            </span>
            <span className="text-xs text-muted-foreground font-mono tabular-nums">
              {time.toLocaleTimeString("pt-BR")}
            </span>
          </div>
        </header>

        {/* ══════ FILTROS ══════ */}
        <section className="mt-3 flex flex-wrap items-center gap-2 mb-5">
          <Select value={periodo} onValueChange={(v) => { setPeriodo(v); setDateFrom(undefined); setDateTo(undefined); }}>
            <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="3d">3 dias</SelectItem>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
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
          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground gap-1" onClick={clearFilters}>
              <X className="h-3 w-3" /> Limpar
            </Button>
          )}
          </section>

          {/* ══════ FILTROS OPERACIONAIS ══════ */}
          <section className="flex flex-wrap items-center gap-2 mb-5">
            <Select value={filterEtapa} onValueChange={setFilterEtapa}>
              <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Etapa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas Etapas</SelectItem>
                {etapasUnicas.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterTemp} onValueChange={setFilterTemp}>
              <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Temperatura" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas Temps</SelectItem>
                <SelectItem value="QUENTE">Quente</SelectItem>
                <SelectItem value="MORNO">Morno</SelectItem>
                <SelectItem value="FRIO">Frio</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar lead..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 w-[180px] pl-7 text-xs"
              />
            </div>
          </section>
        {/* ══════ ROW 1.5 — SOL HOJE (7 dias) ══════ */}
        <section className="mt-4 rounded-lg border border-border/50 bg-card p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">🤖 Sol Hoje — Atividade Diária</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
            {(() => {
              const mqlCard = filteredKpis.find(k => k.label === "MQL");
              const leadsCard = filteredKpis.find(k => k.label === "Leads Recebidos");
              const fupCard = filteredKpis.find(k => k.label === "Resgatados FUP");
              const taxaResp = filteredKpis.find(k => k.label === "Taxa Resposta");
              const mqlVal = mqlCard?.value ?? 0;
              const leadsVal = leadsCard?.value ?? 0;
              const fupVal = fupCard?.value ?? 0;
              const taxaVal = taxaResp?.value ?? 0;

              // Use real temperature distribution from filteredTemperatura
              const totalTemp = filteredTemperatura.reduce((s, t) => s + t.quente + t.morno + t.frio, 0);
              const totalQuentes = filteredTemperatura.reduce((s, t) => s + t.quente, 0);
              const totalMornos = filteredTemperatura.reduce((s, t) => s + t.morno, 0);
              const totalFrios = filteredTemperatura.reduce((s, t) => s + t.frio, 0);

              // Abandono = leads that didn't respond (total - responderam)
              const abandono = Math.max(0, leadsVal - mqlVal - fupVal);
              const qualifFup = fupVal;

              return [
                { label: "Qualificados", value: mqlVal, color: "text-primary" },
                { label: "Abandono", value: abandono, color: "text-destructive" },
                { label: "Qualif. FUP", value: qualifFup, color: "text-success" },
                { label: "Quentes", value: totalQuentes, color: "text-orange-500" },
                { label: "Mornos", value: totalMornos, color: "text-amber-400" },
                { label: "Frios", value: totalFrios, color: "text-blue-400" },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <p className={cn("text-2xl font-extrabold tabular-nums", item.color)}>{item.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
                </div>
              ));
            })()}
          </div>
          <div className="flex items-end gap-1 h-16">
            {filteredSolHoje.map((d, i) => {
              const maxQ = Math.max(...filteredSolHoje.map(x => x.qualificados));
              const h = (d.qualificados / maxQ) * 100;
              return (
                <div key={d.dia} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex flex-col justify-end" style={{ height: 48 }}>
                    <div
                      className={cn("w-full rounded-t transition-all duration-500", i === 2 ? "bg-primary" : "bg-primary/40")}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground">{d.dia}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ══════ ROW 1 — KPIs (7 cards, último é repescagem destacado) ══════ */}
        <section className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {filteredKpis.map((k) => (
            <KPI
              key={k.label}
              label={k.label}
              target={k.value}
              suffix={k.suffix}
              detail={k.detail}
              tooltip={(k as any).tooltip}
              highlight={k.label === "Resgatados FUP"}
            />
          ))}
        </section>

        {/* ══════ ROW 2 — Pipeline Visual ══════ */}
        <section className="mt-4 rounded-lg border border-border/50 bg-card p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-4">Pipeline Real — Fluxo do Lead</p>

          {/* Pipeline horizontal */}
          <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
            {filteredPipeline.map((s, i) => {
              const pct = ((s.valor / maxPipeline) * 100);
              return (
                <div key={s.etapa} className="flex items-center min-w-0">
                  <div className="flex flex-col items-center text-center min-w-[80px] md:min-w-[100px]">
                    <span className="text-lg mb-1">{s.icon}</span>
                    <p className="text-2xl font-extrabold text-foreground tabular-nums leading-none">{s.valor}</p>
                    <p className="text-[10px] font-semibold text-foreground mt-1">{s.etapa}</p>
                    <div className="w-full mt-2 h-1.5 bg-secondary/50 rounded overflow-hidden">
                      <div
                        className="h-full bg-primary/70 rounded transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {i < filteredPipeline.length - 1 && (
                      <p className="text-[9px] text-muted-foreground/70 mt-1 tabular-nums">
                        ↓ {((filteredPipeline[i + 1].valor / s.valor) * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                  {i < filteredPipeline.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 mx-1 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── MICRO FUNIL DA JORNADA ── */}
          <div className="mt-4 pt-3 border-t border-border/30">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-2">Funil da Jornada — % acumulada</p>
            <div className="flex items-end gap-1">
              {filteredPipeline.map((s, i) => {
                const pctJornada = filteredPipeline[0].valor > 0
                  ? (s.valor / filteredPipeline[0].valor * 100)
                  : 0;
                const colors = [
                  "bg-primary",
                  "bg-primary/80",
                  "bg-primary/60",
                  "bg-primary/40",
                  "bg-accent-foreground/50",
                  "bg-success",
                ];
                return (
                  <div key={i} className="flex flex-col items-center" style={{ width: `${pctJornada}%`, minWidth: 40 }}>
                    <div className={cn("h-3 w-full rounded-sm transition-all duration-700", colors[i] || "bg-primary/30")} />
                    <p className="text-[10px] font-bold tabular-nums mt-1 text-foreground">{pctJornada.toFixed(1)}%</p>
                    <p className="text-[9px] text-muted-foreground/70 leading-tight text-center">{s.etapa}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FUP Frio rescue loop indicator */}
          <div className="mt-3 pt-3 border-t border-dashed border-success/30 flex items-center gap-2">
            <RotateCcw className="h-3.5 w-3.5 text-success" />
            <span className="text-[10px] text-success font-semibold uppercase tracking-wider">Repescagem FUP Frio</span>
            <span className="text-[10px] text-muted-foreground">
              — {filteredFup.reativados} leads resgatados voltam para
            </span>
            <span className="text-[10px] font-semibold text-foreground">Closer</span>
            <ArrowRight className="h-3 w-3 text-success/60" />
            <span className="text-[10px] font-semibold text-foreground">Proposta</span>
            <ArrowRight className="h-3 w-3 text-success/60" />
            <span className="text-[10px] font-semibold text-foreground">Fechamento</span>
          </div>
        </section>

        {/* ══════ ROW 3 — FUP Frio ROI + Origem + Alertas ══════ */}
        <section className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* FUP Frio — Repescagem com ROI */}
          <div className="rounded-lg border border-success/30 bg-success/5 p-4">
            <div className="flex items-center gap-2 mb-4">
              <RotateCcw className="h-4 w-4 text-success" />
              <p className="text-[10px] text-success uppercase tracking-wider font-bold">FUP Frio — Dinheiro na Mesa</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-3xl font-extrabold text-success tabular-nums">{filteredFup.reativados}</p>
                <p className="text-[10px] text-muted-foreground mt-1">leads resgatados</p>
                <p className="text-[10px] text-success/70 tabular-nums">de {filteredFup.entraram} que esfriaram</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-extrabold text-success tabular-nums">{filteredFup.valorRecuperado}</p>
                <p className="text-[10px] text-muted-foreground mt-1">valor recuperado</p>
                <p className="text-[10px] text-success/70 tabular-nums">ticket médio {fupFrio.ticketMedio}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold text-foreground tabular-nums">{fupFrio.conversaoPosResgate}%</p>
                <p className="text-[10px] text-muted-foreground mt-1">conversão pós-resgate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold text-foreground tabular-nums">{fupFrio.diasAteReativar}d</p>
                <p className="text-[10px] text-muted-foreground mt-1">tempo médio reativação</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-success/20 text-center">
              <p className="text-[10px] text-muted-foreground">
                <span className="font-bold text-success">{fupFrio.pctReceitaViaFup}%</span> da receita total veio da repescagem
              </p>
            </div>
          </div>

          {/* Origem */}
          <div className="rounded-lg border border-border/50 bg-card p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">Origem dos Leads</p>
            <div className="space-y-3">
              {origemLeads.map((o) => (
                <div key={o.origem} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-16 shrink-0 truncate">{o.origem}</span>
                  <div className="flex-1 h-5 bg-secondary/50 rounded overflow-hidden">
                    <div
                      className="h-full bg-primary/60 rounded transition-all duration-700"
                      style={{ width: `${(o.share / maxShare) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-foreground tabular-nums w-9 text-right">{o.share}%</span>
                  <span className="text-[10px] text-success font-medium tabular-nums w-16 text-right">{o.conversao}% conv</span>
                </div>
              ))}
            </div>
          </div>

          {/* Alertas & Insights */}
          <div className="rounded-lg border border-border/50 bg-card p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">Alertas & Insights</p>
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {alertasData.map((a, i) => {
                const icon = a.type === "danger" ? <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" /> :
                             a.type === "warning" ? <Info className="h-3.5 w-3.5 text-warning shrink-0" /> :
                             <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />;
                const border = a.type === "danger" ? "border-destructive/30 bg-destructive/5" :
                               a.type === "warning" ? "border-warning/30 bg-warning/5" :
                               "border-success/30 bg-success/5";
                return (
                  <div key={i} className={cn("rounded-md border p-2.5 flex items-start gap-2", border)}>
                    {icon}
                    <div>
                      <p className="text-[11px] font-semibold text-foreground leading-tight">{a.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{a.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════ ROW 4 — Desqualificação + Mensagens ══════ */}
        <section className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Desqualificação Donut */}
          <div className="rounded-lg border border-border/50 bg-card p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Motivos de Desqualificação</p>
            <div className="flex items-center gap-3">
              <div className="w-28 h-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={desqualMotivos}
                      dataKey="pct"
                      nameKey="motivo"
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={48}
                      strokeWidth={1}
                      stroke="hsl(var(--background))"
                    >
                      {desqualMotivos.map((d, i) => (
                        <Cell key={i} fill={d.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `${value}%`}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 flex-1">
                {desqualMotivos.map((d) => (
                  <div key={d.motivo} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                    <span className="text-[10px] text-muted-foreground flex-1 truncate">{d.motivo}</span>
                    <span className="text-[10px] font-semibold text-foreground tabular-nums">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mensagens */}
          <div className="rounded-lg border border-border/50 bg-card p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">Mensagens</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xl font-extrabold text-foreground tabular-nums">{filteredMensagens.enviadas.toLocaleString("pt-BR")}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">enviadas</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-foreground tabular-nums">{filteredMensagens.recebidas.toLocaleString("pt-BR")}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">recebidas</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-primary tabular-nums">{mensagens.interacoesPorConv}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">interações/conv</p>
              </div>
            </div>
          </div>

          {/* SLA + Tempo */}
          <div className="rounded-lg border border-border/50 bg-card p-4 flex items-center justify-around">
            <SLAGauge pct={sla.pctAbordados5min} />
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Tempo Médio</p>
              <p className="text-2xl font-extrabold text-foreground">{sla.tempoMedioRespostaLead}</p>
              <p className="text-[10px] text-muted-foreground mt-1">resposta do lead</p>
            </div>
          </div>
        </section>

        {/* ══════ ROW 5 — Mapa de Calor ══════ */}
        <section className="mt-4 rounded-lg border border-border/50 bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Mapa de Calor — Respostas</p>
            <span className="text-[10px] text-primary font-medium">Pico: {filteredHeatmap.pico}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-16" />
                  {filteredHeatmap.dias.map((d) => (
                    <th key={d} className="text-[10px] text-muted-foreground font-medium text-center pb-1.5 px-1">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredHeatmap.periodos.map((p, pi) => (
                  <tr key={p}>
                    <td className="text-[10px] text-muted-foreground font-medium pr-2 py-0.5">{p}</td>
                    {filteredHeatmap.valores[pi].map((v, di) => {
                      const intensity = v / 100;
                      return (
                        <td key={di} className="p-0.5">
                          <div
                            className="rounded h-8 flex items-center justify-center text-[10px] font-semibold transition-all"
                            style={{
                              backgroundColor: `hsl(var(--success) / ${0.1 + intensity * 0.7})`,
                              color: intensity > 0.6 ? "hsl(var(--success-foreground, var(--background)))" : "hsl(var(--foreground))",
                            }}
                          >
                            {v}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ══════ ROW 6 — Taxa por Tentativa + Temperatura por Etapa ══════ */}
        <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-border/50 bg-card p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">Taxa de Resposta por Tentativa</p>
            <div className="space-y-2">
              {taxaPorTentativa.map((t) => (
                <div key={t.tentativa} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-14 shrink-0">{t.tentativa}</span>
                  <div className="flex-1 h-5 bg-secondary/50 rounded overflow-hidden">
                    <div
                      className="h-full bg-primary/60 rounded transition-all duration-700"
                      style={{ width: `${(t.pct / 42) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-foreground tabular-nums w-8 text-right">{t.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Temperatura por Etapa */}
          <div className="rounded-lg border border-border/50 bg-card p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">Temperatura por Etapa</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={filteredTemperatura}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="etapa" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={45} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="quente" name="Quente" fill="#f97316" stackId="a" />
                <Bar dataKey="morno" name="Morno" fill="#fbbf24" stackId="a" />
                <Bar dataKey="frio" name="Frio" fill="#60a5fa" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ══════ ROW 7 — Tabela de Leads Detalhados ══════ */}
        <section className="mt-4 rounded-lg border border-border/50 bg-card p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">Tabela de Leads Detalhados</p>
          <div className="overflow-auto max-h-[500px]">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-center py-2 px-2 text-[10px] text-muted-foreground font-medium w-10">#</th>
                  <th className="text-left py-2 px-2 text-[10px] text-muted-foreground font-medium">Cliente</th>
                  <th className="text-left py-2 px-2 text-[10px] text-muted-foreground font-medium">Etapa</th>
                  <th className="text-left py-2 px-2 text-[10px] text-muted-foreground font-medium">Temp</th>
                  <th className="text-right py-2 px-2 text-[10px] text-muted-foreground font-medium">Score</th>
                  <th className="text-right py-2 px-2 text-[10px] text-muted-foreground font-medium">SLA (dias)</th>
                  <th className="text-left py-2 px-2 text-[10px] text-muted-foreground font-medium">FUP</th>
                  <th className="text-right py-2 px-2 text-[10px] text-muted-foreground font-medium">Valor</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, idx) => (
                  <>
                    <tr
                      key={lead.id}
                      className={cn(
                        "border-b border-border/30 hover:bg-muted/30 cursor-pointer transition-colors",
                        expandedLead === lead.id && "bg-muted/20"
                      )}
                      onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                    >
                      <td className="py-2 px-2 text-center text-muted-foreground tabular-nums">{idx + 1}</td>
                      <td className="py-2 px-2 font-medium text-foreground">{lead.nome}</td>
                      <td className="py-2 px-2 text-muted-foreground">{lead.etapa}</td>
                      <td className="py-2 px-2"><TempDot t={lead.temperatura} /></td>
                      <td className="py-2 px-2 text-right tabular-nums font-semibold">{lead.score}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-muted-foreground">{lead.sla}</td>
                      <td className="py-2 px-2">
                        <Badge
                          variant={
                            lead.statusFup === "Concluído" ? "default" :
                            lead.statusFup === "Novo" ? "outline" :
                            "secondary"
                          }
                          className={cn(
                            "text-[9px] px-1.5 py-0",
                            lead.statusFup === "FUP Frio" && "bg-blue-500/15 text-blue-500 border-blue-500/30",
                            lead.statusFup === "Qualificação" && "bg-primary/15 text-primary border-primary/30",
                            lead.statusFup === "Aguardando" && "bg-warning/15 text-warning border-warning/30",
                            lead.statusFup === "Concluído" && "bg-success/15 text-success border-success/30",
                          )}
                        >
                          {lead.statusFup}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums text-foreground">
                        {lead.valor > 0 ? `R$ ${(lead.valor / 1000).toFixed(0)}k` : "—"}
                      </td>
                      <td className="py-2 px-1">
                        {expandedLead === lead.id ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                      </td>
                    </tr>
                    {expandedLead === lead.id && (
                      <tr key={`${lead.id}-detail`}>
                        <td colSpan={8} className="px-4 py-2 bg-muted/10">
                          <div className="space-y-1.5 pl-4 border-l-2 border-primary/30">
                            {lead.historico.map((h, hi) => (
                              <div key={hi} className="flex items-start gap-2">
                                <Badge variant="secondary" className="text-[8px] px-1 py-0 shrink-0">{h.tipo}</Badge>
                                <span className="text-[10px] text-muted-foreground shrink-0">{h.data}</span>
                                <span className="text-[10px] text-foreground">{h.msg}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ══════ ROW 8 — SLA Metrics ══════ */}
        <SLAMetricsMock data={slaMockData} />

        {/* ══════ ROW 9 — Robot Insights ══════ */}
        <RobotInsightsMock data={robotInsightsData} />

        {/* ══════ ROW 10 — Score por Origem ══════ */}
        <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <ScorePorOrigem data={scorePorOrigemData} />
          <div className="rounded-lg border border-border/50 bg-card p-4 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Resumo Operacional</p>
              <p className="text-3xl font-extrabold text-foreground tabular-nums">{filteredLeads.length}</p>
              <p className="text-[10px] text-muted-foreground mt-1">leads filtrados</p>
              <div className="flex gap-3 mt-3 justify-center">
                <span className="text-[10px] text-orange-500 font-semibold">{filteredLeads.filter(l => l.temperatura === "QUENTE").length} quentes</span>
                <span className="text-[10px] text-amber-400 font-semibold">{filteredLeads.filter(l => l.temperatura === "MORNO").length} mornos</span>
                <span className="text-[10px] text-blue-400 font-semibold">{filteredLeads.filter(l => l.temperatura === "FRIO").length} frios</span>
              </div>
            </div>
          </div>
        </section>

        {/* ══════ ROW 11 — Monthly Evolution ══════ */}
        <div className="mt-6">
          <MonthlyEvolution data={monthlyEvolution} />
        </div>

        {/* ══════ RODAPÉ ══════ */}
        <footer className="mt-8 text-center">
          <p className="text-[10px] text-muted-foreground/50">
            Sol Estrateg.IA · RBR Consult
          </p>
        </footer>
      </div>
    </div>
  );
}
