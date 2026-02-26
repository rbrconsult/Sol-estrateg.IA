import { useState, useEffect, useRef, useMemo } from "react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X, ArrowRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  kpiCards, pipelineStages, origemLeads, fupFrio, desqualMotivos,
  mensagens, sla, heatmap, taxaPorTentativa,
} from "@/data/conferenciaMockData";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
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

/* ═══════════════════ MAIN PAGE ═══════════════════ */
export default function Conferencia() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* filters */
  const [periodo, setPeriodo] = useState("30d");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const hasFilters = periodo !== "30d" || dateFrom || dateTo;
  const clearFilters = () => { setPeriodo("30d"); setDateFrom(undefined); setDateTo(undefined); };

  /* ── multiplier logic ── */
  const multiplier = useMemo(() => {
    if (periodo === "7d") return 0.25;
    if (periodo === "30d") return 1;
    if (periodo === "90d") return 2.8;
    if (periodo === "custom" && dateFrom && dateTo) {
      const days = Math.max(differenceInDays(dateTo, dateFrom), 1);
      return days / 30;
    }
    return 1;
  }, [periodo, dateFrom, dateTo]);

  const scale = (v: number) => Math.round(v * multiplier);

  /* ── filtered data ── */
  const filteredKpis = useMemo(() => kpiCards.map(k => {
    if (k.suffix === "%") return k;
    const newVal = scale(k.value);
    let detail = k.detail;
    if (k.label === "Leads Recebidos") detail = "100%";
    else if (k.label === "Taxa Resposta") {
      detail = `${scale(198)}/${scale(342)}`;
    } else if (k.label === "Resgatados FUP") {
      detail = `R$ ${Math.round(186 * multiplier)}k`;
    }
    return { ...k, value: newVal, detail };
  }), [multiplier]);

  const filteredPipeline = useMemo(() => pipelineStages.map(s => ({
    ...s, valor: scale(s.valor)
  })), [multiplier]);

  const filteredFup = useMemo(() => ({
    ...fupFrio,
    entraram: scale(fupFrio.entraram),
    reativados: scale(fupFrio.reativados),
    valorRecuperado: `R$ ${Math.round(186 * multiplier)}.000`,
  }), [multiplier]);

  const filteredMensagens = useMemo(() => ({
    ...mensagens,
    enviadas: scale(mensagens.enviadas),
    recebidas: scale(mensagens.recebidas),
  }), [multiplier]);

  const filteredHeatmap = useMemo(() => ({
    ...heatmap,
    valores: heatmap.valores.map(row => row.map(v => Math.min(100, Math.round(v * multiplier)))),
  }), [multiplier]);

  const maxPipeline = Math.max(...filteredPipeline.map((s) => s.valor));
  const maxShare = Math.max(...origemLeads.map((o) => o.share));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-4 pb-12">

        {/* ══════ HEADER ══════ */}
        <header className="sticky top-0 z-50 py-4 flex items-center justify-between bg-background/95 backdrop-blur-sm border-b border-border/40">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight text-foreground">SOL Insights</h1>
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
          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground gap-1" onClick={clearFilters}>
              <X className="h-3 w-3" /> Limpar
            </Button>
          )}
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

        {/* ══════ ROW 3 — FUP Frio ROI + Origem ══════ */}
        <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
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

        {/* ══════ ROW 6 — Taxa por Tentativa ══════ */}
        <section className="mt-4 rounded-lg border border-border/50 bg-card p-4">
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
        </section>

        {/* ══════ RODAPÉ ══════ */}
        <footer className="mt-8 text-center">
          <p className="text-[10px] text-muted-foreground/50">
            SOL Insights · RBR Consult
          </p>
        </footer>
      </div>
    </div>
  );
}
