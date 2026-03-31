import { useState, useEffect, useRef, useMemo } from "react";
import { format, differenceInDays, subDays, startOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight, RotateCcw, ChevronDown, ChevronUp, AlertTriangle, Info, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useConferenciaData, type KPICard } from "@/hooks/useConferenciaData";
import { RobotInsights } from "@/components/conferencia/RobotInsights";
import { ScorePorOrigem } from "@/components/conferencia/ScorePorOrigem";
import { MonthlyEvolution } from "@/components/conferencia/MonthlyEvolution";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
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
  const [expandedLead, setExpandedLead] = useState<number | null>(null);
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const gf = useGlobalFilters();
  const { periodo, etapa: filterEtapa, temperatura: filterTemp, searchTerm } = gf.filters;
  const effectiveDateRange = gf.effectiveDateRange;

  // Hook receives global filter — ALL data is already filtered by period
  const { data: realData, isLoading: dataLoading, hasData } = useConferenciaData(effectiveDateRange);

  // All data comes pre-filtered from the hook
  const kpiCards = realData?.kpiCards ?? [];
  const pipelineStages = realData?.pipelineStages ?? [];
  const origemLeads = realData?.origemLeads ?? [];
  const fupFrio = realData?.fupFrio ?? { entraram: 0, reativados: 0, pctReativados: 0, diasAteReativar: 0, valorRecuperado: 'R$ 0', ticketMedio: 'R$ 0', conversaoPosResgate: 0, receitaTotal: 'R$ 0', pctReceitaViaFup: 0 };
  const desqualMotivos = realData?.desqualMotivos ?? [];
  const mensagens = realData?.mensagens ?? { enviadas: 0, recebidas: 0, interacoesPorConv: 0 };
  const sla = realData?.sla ?? { pctAbordados5min: 0, tempoMedioRespostaLead: '—' };
  const heatmap = realData?.heatmap ?? { dias: [], periodos: [], valores: [], pico: '—' };
  const taxaPorTentativa = realData?.taxaPorTentativa ?? [];
  const solHojeData = realData?.solHoje ?? [];
  const alertasData = realData?.alertas ?? [];
  const temperaturaPorEtapa = realData?.temperaturaPorEtapa ?? [];
  const tabelaLeads = realData?.tabelaLeads ?? [];
  const slaMockData = realData?.slaMock ?? { primeiroAtendimento: { media: 0, pctDentro24h: 0, total: 0 }, porEtapa: [], robos: { tempoResposta: '—', leadsAguardando: 0, taxaResposta: 0 }, geralProposta: { mediaDias: 0 } };
  const robotInsightsData = realData?.robotInsights ?? { destaques: [], comparacao: { sol: { nome: 'SOL', taxaResposta: 0, tempoMedioResposta: '—', leadsProcessados: 0 }, fup: { nome: 'FUP', taxaResposta: 0, tempoMedioResposta: '—', leadsProcessados: 0 } }, funilMensagens: [], alertasUrgentes: [] };
  const scorePorOrigemData = realData?.scorePorOrigem ?? [];
  const monthlyEvolution = realData?.monthlyEvolution ?? [];

  // Secondary filters (etapa, temp, search) applied on top of pre-filtered data
  const filteredLeads = useMemo(() => {
    return tabelaLeads
      .filter(l => filterEtapa === "todas" || l.etapa === filterEtapa)
      .filter(l => filterTemp === "todas" || l.temperatura === filterTemp)
      .filter(l => !searchTerm || l.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [filterEtapa, filterTemp, searchTerm, tabelaLeads]);

  const etapasUnicas = [...new Set(tabelaLeads.map(l => l.etapa))];

  const primeiroAtendimentoLabel = useMemo(() => {
    const mins = slaMockData.primeiroAtendimento.media;
    if (!mins || mins <= 0) return "—";
    if (mins < 60) return `${Math.round(mins)}min`;
    if (mins < 1440) return `${(mins / 60).toFixed(1)}h`;
    return `${(mins / 1440).toFixed(1)}d`;
  }, [slaMockData.primeiroAtendimento.media]);

  const maxPipeline = Math.max(...pipelineStages.map((s) => s.valor), 1);
  const maxShare = Math.max(...origemLeads.map((o) => o.share), 1);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-3 md:px-4 pb-12">

        {/* ══════ HEADER ══════ */}
        <header className="sticky top-0 z-50 py-4 flex items-center justify-between bg-background/95 backdrop-blur-sm border-b border-border/40">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight text-foreground">Dashboard</h1>
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






        {/* ══════ KPIs GERAIS (período filtrado) ══════ */}
        <section className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {kpiCards.map((k) => (
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
            {pipelineStages.map((s, i) => {
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
                    {i < pipelineStages.length - 1 && (
                      <p className="text-[9px] text-muted-foreground/70 mt-1 tabular-nums">
                        ↓ {((pipelineStages[i + 1].valor / s.valor) * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                  {i < pipelineStages.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 mx-1 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── MICRO FUNIL DA JORNADA ── */}
          <div className="mt-4 pt-3 border-t border-border/30">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-2">Funil da Jornada — % acumulada</p>
            <div className="flex flex-col gap-1.5">
              {pipelineStages.map((s, i) => {
                const pctJornada = pipelineStages[0].valor > 0
                  ? (s.valor / pipelineStages[0].valor * 100)
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
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground w-20 text-right truncate shrink-0">{s.etapa}</span>
                    <div className="flex-1 h-4 bg-muted/30 rounded-sm overflow-hidden">
                      <div
                        className={cn("h-full rounded-sm transition-all duration-700", colors[i] || "bg-primary/30")}
                        style={{ width: `${Math.max(pctJornada, 2)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold tabular-nums w-12 shrink-0">{pctJornada.toFixed(1)}%</span>
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
              — {fupFrio.reativados} leads resgatados voltam para
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
                <p className="text-3xl font-extrabold text-success tabular-nums">{fupFrio.reativados}</p>
                <p className="text-[10px] text-muted-foreground mt-1">leads resgatados</p>
                <p className="text-[10px] text-success/70 tabular-nums">de {fupFrio.entraram} que esfriaram</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-extrabold text-success tabular-nums">{fupFrio.valorRecuperado}</p>
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

          {/* Resumo Operacional Quick */}
          <div className="rounded-lg border border-border/50 bg-card p-4 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-foreground tabular-nums">{filteredLeads.length}</p>
              <p className="text-[10px] text-muted-foreground mt-1">leads filtrados</p>
              <div className="flex gap-2 mt-2 justify-center">
                <span className="text-[10px] text-destructive font-semibold">{filteredLeads.filter(l => l.temperatura === "QUENTE").length} 🔥</span>
                <span className="text-[10px] text-warning font-semibold">{filteredLeads.filter(l => l.temperatura === "MORNO").length} 🌡️</span>
                <span className="text-[10px] text-primary font-semibold">{filteredLeads.filter(l => l.temperatura === "FRIO").length} ❄️</span>
              </div>
            </div>
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
              <BarChart data={temperaturaPorEtapa}>
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

        {/* ══════ ROW 7 — SLA Consolidado ══════ */}
        <section className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-border/50 bg-card p-4 flex flex-col items-center justify-center">
            <SLAGauge pct={sla.pctAbordados5min} />
            <p className="text-[10px] text-muted-foreground mt-2">Abordados em &lt;5min</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-card p-4 space-y-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Tempo Médio de Resposta</p>
            <p className="text-3xl font-extrabold text-foreground text-center">{sla.tempoMedioRespostaLead}</p>
            <p className="text-[10px] text-muted-foreground text-center">resposta do lead</p>
            <div className="pt-2 border-t border-border/30 space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">1º Atendimento</span>
                <span className="font-semibold text-foreground">{primeiroAtendimentoLabel}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Dentro 24h</span>
                <span className="font-semibold text-foreground">{slaMockData.primeiroAtendimento.pctDentro24h}%</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Proposta (média)</span>
                <span className="font-semibold text-foreground">{slaMockData.geralProposta.mediaDias}d</span>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border/50 bg-card p-4 space-y-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">SLA por Etapa</p>
            <div className="space-y-2">
              {slaMockData.porEtapa.slice(0, 5).map((e: any) => {
                const pct = e.slaDias > 0 ? Math.min((e.mediaDias / e.slaDias) * 100, 100) : 0;
                const status = pct <= 60 ? "bg-success" : pct <= 85 ? "bg-warning" : "bg-destructive";
                return (
                  <div key={e.etapa}>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-muted-foreground truncate">{e.etapa}</span>
                      <span className="font-semibold text-foreground tabular-nums">{e.mediaDias}d / {e.slaDias}d</span>
                    </div>
                    <div className="h-1.5 bg-secondary/50 rounded overflow-hidden">
                      <div className={cn("h-full rounded transition-all", status)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>


        {/* ══════ ROW 9 — Robot Insights ══════ */}
        <RobotInsightsMock data={robotInsightsData} />

        {/* ══════ ROW 10 — Score por Origem ══════ */}
        <section className="mt-4">
          <ScorePorOrigem data={scorePorOrigemData} />
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
