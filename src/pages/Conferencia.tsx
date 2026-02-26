import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  kpiCards, funnelData, origemLeads, fupFrio, desqualMotivos,
  mensagens, sla, heatmap, taxaPorTentativa,
} from "@/data/conferenciaMockData";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";

/* ───────── animated counter hook ───────── */
function useAnimatedNumber(target: number, duration = 1200, isDecimal = false) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

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

/* ───────── KPI Card ───────── */
function KPI({ label, target, suffix = "", detail, tooltip }: { label: string; target: number; suffix?: string; detail?: string; tooltip?: string }) {
  const isDecimal = suffix === "%" || target % 1 !== 0;
  const { value, ref } = useAnimatedNumber(target, 1200, isDecimal);
  return (
    <div ref={ref} className="rounded-lg border border-border/50 bg-card p-3 text-center transition-all hover:border-primary/40 group relative">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">
        {label}
        {tooltip && (
          <span className="ml-1 inline-block opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-primary/70 normal-case tracking-normal">
            ({tooltip})
          </span>
        )}
      </p>
      <p className="text-2xl font-extrabold text-foreground tabular-nums leading-none">
        {value}{suffix}
      </p>
      {detail && (
        <p className="text-[10px] text-muted-foreground/70 mt-1 tabular-nums">{detail}</p>
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

  const maxFunnel = Math.max(...funnelData.map((f) => f.valor));
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

        {/* ══════ ROW 1 — KPIs ══════ */}
        <section className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {kpiCards.map((k) => (
            <KPI key={k.label} label={k.label} target={k.value} suffix={k.suffix} detail={k.detail} tooltip={(k as any).tooltip} />
          ))}
        </section>

        {/* ══════ ROW 2 — Funil + Origem ══════ */}
        <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Funil */}
          <div className="rounded-lg border border-border/50 bg-card p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">Funil de Conversão</p>
            <div className="space-y-2">
              {funnelData.map((f, i) => {
                const pct = ((f.valor / maxFunnel) * 100).toFixed(0);
                const convNext = i < funnelData.length - 1
                  ? ((funnelData[i + 1].valor / f.valor) * 100).toFixed(0)
                  : null;
                return (
                  <div key={f.etapa}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-20 shrink-0 truncate">{f.etapa}</span>
                      <div className="flex-1 h-5 bg-secondary/50 rounded overflow-hidden relative">
                        <div
                          className="h-full bg-primary/70 rounded transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                        <span className="absolute right-1.5 top-0.5 text-[10px] font-bold text-foreground tabular-nums">{f.valor}</span>
                      </div>
                    </div>
                    {convNext && (
                      <p className="text-[9px] text-muted-foreground/70 ml-20 pl-1">↓ {convNext}%</p>
                    )}
                  </div>
                );
              })}
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

        {/* ══════ ROW 3 — FUP Frio + Desqualificação ══════ */}
        <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* FUP Frio */}
          <div className="rounded-lg border border-border/50 bg-card p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-4">FUP Frio</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-extrabold text-foreground tabular-nums">{fupFrio.entraram}</p>
                <p className="text-[10px] text-muted-foreground mt-1">entraram no FUP</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-success tabular-nums">{fupFrio.reativados}</p>
                <p className="text-[10px] text-muted-foreground mt-1">reativados ({fupFrio.pctReativados}%)</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-foreground tabular-nums">{fupFrio.diasAteReativar}</p>
                <p className="text-[10px] text-muted-foreground mt-1">dias até reativar</p>
              </div>
            </div>
          </div>

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
        </section>

        {/* ══════ ROW 4 — Mensagens + SLA ══════ */}
        <section className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Mensagens */}
          <div className="rounded-lg border border-border/50 bg-card p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">Mensagens</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xl font-extrabold text-foreground tabular-nums">{mensagens.enviadas.toLocaleString("pt-BR")}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">enviadas</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-foreground tabular-nums">{mensagens.recebidas.toLocaleString("pt-BR")}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">recebidas</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-primary tabular-nums">{mensagens.interacoesPorConv}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">interações/conv</p>
              </div>
            </div>
          </div>

          {/* SLA Gauge */}
          <div className="rounded-lg border border-border/50 bg-card p-4 flex items-center justify-center">
            <SLAGauge pct={sla.pctAbordados5min} />
          </div>

          {/* Tempo médio */}
          <div className="rounded-lg border border-border/50 bg-card p-4 flex flex-col items-center justify-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Tempo Médio Resposta Lead</p>
            <p className="text-3xl font-extrabold text-foreground">{sla.tempoMedioRespostaLead}</p>
          </div>
        </section>

        {/* ══════ ROW 5 — Mapa de Calor ══════ */}
        <section className="mt-4 rounded-lg border border-border/50 bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Mapa de Calor — Respostas</p>
            <span className="text-[10px] text-primary font-medium">Pico: {heatmap.pico}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-16" />
                  {heatmap.dias.map((d) => (
                    <th key={d} className="text-[10px] text-muted-foreground font-medium text-center pb-1.5 px-1">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmap.periodos.map((p, pi) => (
                  <tr key={p}>
                    <td className="text-[10px] text-muted-foreground font-medium pr-2 py-0.5">{p}</td>
                    {heatmap.valores[pi].map((v, di) => {
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
