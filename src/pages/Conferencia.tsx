import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X, AlertTriangle, Zap, TrendingUp, Clock, DollarSign, Users, Target, Shield, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  kpis, roiData, funnelData, weeklyLeads, insights, problemData, solucaoData, antesDepois,
  leadsTable, origemLeads, solPerformance, atividadeRecente,
} from "@/data/conferenciaMockData";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip,
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

/* ───────── temp indicator ───────── */
function TempDot({ temp }: { temp: string }) {
  const cls = temp === "QUENTE"
    ? "bg-destructive/80"
    : temp === "FRIO"
      ? "bg-info/80"
      : "bg-warning/80";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${cls}`} />
      <span className="capitalize">{temp.toLowerCase()}</span>
    </span>
  );
}

/* ───────── section divider ───────── */
function SectionHeader({ number, title, subtitle, icon: Icon }: { number: string; title: string; subtitle: string; icon: any }) {
  return (
    <div className="flex items-center gap-4 mt-10 mb-5">
      <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold">{number}</p>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
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
  const [etapa, setEtapa] = useState("todas");
  const [temperatura, setTemperatura] = useState("todas");
  const [responsavel, setResponsavel] = useState("todos");

  const responsaveis = [...new Set(leadsTable.map((l) => l.responsavel))];
  const etapas = [...new Set(funnelData.map((f) => f.etapa))];

  const hasFilters = periodo !== "30d" || etapa !== "todas" || temperatura !== "todas" || responsavel !== "todos" || dateFrom || dateTo;
  const clearFilters = () => {
    setPeriodo("30d");
    setDateFrom(undefined);
    setDateTo(undefined);
    setEtapa("todas");
    setTemperatura("todas");
    setResponsavel("todos");
  };

  const [funnelVisible, setFunnelVisible] = useState(false);
  const funnelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = funnelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setFunnelVisible(true); }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const maxFunnel = Math.max(...funnelData.map((f) => f.valor));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-6 pb-16">

        {/* ══════ HEADER ══════ */}
        <header className="sticky top-0 z-50 py-5 flex items-center justify-between bg-background/95 backdrop-blur-sm border-b border-border/40">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              SOL Insights
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Painel Estratégico · Evolve Energia Solar</p>
          </div>
          <div className="flex items-center gap-5">
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Powered by RBR Consult</span>
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
        <section className="mt-4 flex flex-wrap items-center gap-2">
          <Select value={periodo} onValueChange={(v) => { setPeriodo(v); setDateFrom(undefined); setDateTo(undefined); }}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
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

          <Select value={etapa} onValueChange={setEtapa}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue placeholder="Etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as etapas</SelectItem>
              {etapas.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={temperatura} onValueChange={setTemperatura}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Temperatura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="QUENTE">Quente</SelectItem>
              <SelectItem value="MORNO">Morno</SelectItem>
              <SelectItem value="FRIO">Frio</SelectItem>
            </SelectContent>
          </Select>

          <Select value={responsavel} onValueChange={setResponsavel}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {responsaveis.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground gap-1" onClick={clearFilters}>
              <X className="h-3 w-3" /> Limpar
            </Button>
          )}
        </section>

        {/* ══════ SEÇÃO 1: O PROBLEMA ══════ */}
        <SectionHeader
          number="01 · O PROBLEMA"
          title="A Lacuna de Experiência do Cliente"
          subtitle="Quem responde primeiro, vende. Quem qualifica melhor, escala."
          icon={AlertTriangle}
        />

        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-4 w-4 text-destructive" />
              <p className="text-[11px] text-destructive font-semibold uppercase tracking-wider">Sem Resposta</p>
            </div>
            <p className="text-4xl font-bold text-foreground tabular-nums">{problemData.semResposta}%</p>
            <p className="text-xs text-muted-foreground mt-1.5">das empresas <strong>nunca</strong> respondem seus leads</p>
          </div>
          <div className="rounded-lg border border-warning/20 bg-warning/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-warning" />
              <p className="text-[11px] text-warning font-semibold uppercase tracking-wider">Tempo de Espera</p>
            </div>
            <p className="text-4xl font-bold text-foreground tabular-nums">{problemData.tempoMedioResposta}h</p>
            <p className="text-xs text-muted-foreground mt-1.5">média de resposta do mercado</p>
          </div>
          <div className="rounded-lg border border-success/20 bg-success/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-success" />
              <p className="text-[11px] text-success font-semibold uppercase tracking-wider">Quem Responde Primeiro</p>
            </div>
            <p className="text-4xl font-bold text-foreground tabular-nums">{problemData.compraPrimeiro}%</p>
            <p className="text-xs text-muted-foreground mt-1.5">fecham com quem <strong>atende primeiro</strong></p>
          </div>
        </section>

        <div className="mt-3 rounded-lg border border-border/50 bg-card p-4 flex items-center gap-3">
          <DollarSign className="h-5 w-5 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Custo da ineficiência:</strong> SDRs humanos gastam de {problemData.custoTriagemHumana.min} a {problemData.custoTriagemHumana.max} horas por lead em triagem manual, 
            custando de R$ {problemData.custoLeadHumano.min} a R$ {problemData.custoLeadHumano.max} por lead qualificado — muitas vezes focando em "curiosos" em vez de compradores reais.
          </p>
        </div>

        {/* ══════ SEÇÃO 2: A SOLUÇÃO SOL ══════ */}
        <SectionHeader
          number="02 · A SOLUÇÃO"
          title="SOL — IA SDR Exclusiva para a Evolve"
          subtitle="Velocidade extrema. Qualificação BANT 24/7. Foco no fechamento."
          icon={Zap}
        />

        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
            <p className="text-[11px] text-primary font-semibold uppercase tracking-wider mb-2">Velocidade Extrema</p>
            <p className="text-4xl font-bold text-foreground tabular-nums">{solucaoData.tempoResposta}s</p>
            <p className="text-xs text-muted-foreground mt-1.5">de resposta → <strong>+{solucaoData.aumentoConversao}%</strong> de conversão</p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
            <p className="text-[11px] text-primary font-semibold uppercase tracking-wider mb-2">Qualificação BANT</p>
            <p className="text-4xl font-bold text-foreground">{solucaoData.velocidadeQualif}</p>
            <p className="text-xs text-muted-foreground mt-1.5">mais rápido que humano · <strong>{solucaoData.disponibilidade}</strong></p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
            <p className="text-[11px] text-primary font-semibold uppercase tracking-wider mb-2">Custo por Lead Qualificado</p>
            <p className="text-4xl font-bold text-foreground">R$ {solucaoData.custoLeadSol.min}-{solucaoData.custoLeadSol.max}</p>
            <p className="text-xs text-muted-foreground mt-1.5">vs R$ {problemData.custoLeadHumano.min}-{problemData.custoLeadHumano.max} com SDR humano</p>
          </div>
        </section>

        {/* Fluxo visual */}
        <div className="mt-4 rounded-lg border border-border/50 bg-card p-5">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-4 font-medium">Fluxo de Atendimento</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {[
              { label: "Lead Inbound", sub: "Site · Ads · Redes" },
              { label: "SOL IA", sub: "10s · BANT · 24/7" },
              { label: "CRM Atualizado", sub: "100% dados" },
              { label: "Consultor Fecha", sub: "Lead pronto" },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="rounded-lg border border-border/50 bg-secondary/30 px-4 py-3 text-center min-w-[130px]">
                  <p className="text-sm font-semibold text-foreground">{step.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{step.sub}</p>
                </div>
                {i < 3 && <ArrowRight className="h-4 w-4 text-primary shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {/* ══════ SEÇÃO 3: O IMPACTO & ROI ══════ */}
        <SectionHeader
          number="03 · O IMPACTO"
          title="Performance Comercial → Previsibilidade Financeira"
          subtitle="Dados reais da operação Evolve com a Sol."
          icon={TrendingUp}
        />

        {/* KPIs Reais */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {kpis.map((k, i) => {
            const { value: animVal, ref } = useAnimatedNumber(k.value, 1400, k.isDecimal);
            return (
              <div key={i} ref={ref}
                className="rounded-lg border border-border/50 bg-card p-4 transition-all duration-200 hover:border-border">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">{k.label}</p>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {animVal}{k.suffix || ""}
                </p>
                {k.trend && (
                  <span className="text-[11px] font-medium text-success mt-1 inline-block">
                    +{k.trend}%
                  </span>
                )}
              </div>
            );
          })}
        </section>

        {/* ROI Resumo */}
        <section className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "Custo por Lead Qualificado", value: `R$ ${roiData.custoLeadSol}`, sub: `vs R$ ${roiData.custoSDRHumano} SDR humano`, highlight: true },
            { label: "Faturamento Potencial", value: "R$ 1.8M", sub: `${kpis[1].value} leads × ticket médio R$ 28k` },
            { label: "Economia Mensal", value: `R$ ${(roiData.economiaMensal / 1000).toFixed(1)}k`, sub: "Escala sem aumentar time" },
          ].map((item, i) => (
            <div key={i} className="rounded-lg border border-border/50 bg-card p-5">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">{item.label}</p>
              <p className="text-3xl font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-1.5">{item.sub}</p>
            </div>
          ))}
        </section>

        {/* ══════ COMPARATIVO ANTES × DEPOIS ══════ */}
        <section className="mt-6 rounded-lg border border-border/50 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Antes × Depois da Sol</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  {["Métrica", "Antes (SDR Humano)", "Depois (Sol IA)", "Impacto"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {antesDepois.map((row, i) => (
                  <tr key={i} className="border-b border-border/20 transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium text-foreground">{row.metrica}</td>
                    <td className="px-4 py-3 text-destructive/80 font-mono text-xs">{row.antes}</td>
                    <td className="px-4 py-3 text-success font-mono text-xs font-semibold">{row.depois}</td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">{row.impacto}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ══════ SEÇÃO 4 — Grid (Funil + Insights) ══════ */}
        <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Funil + Barras semanais */}
          <div className="lg:col-span-2 space-y-4">
            <div ref={funnelRef} className="rounded-lg border border-border/50 bg-card p-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Funil de Leads</h3>
              <div className="space-y-2.5">
                {funnelData.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-36 text-[11px] text-muted-foreground truncate">{f.etapa}</span>
                    <div className="flex-1 h-6 rounded bg-secondary/50 overflow-hidden">
                      <div
                        className="h-full rounded bg-primary/70 flex items-center justify-end pr-2 transition-all duration-1000 ease-out"
                        style={{
                          width: funnelVisible ? `${(f.valor / maxFunnel) * 100}%` : "0%",
                          transitionDelay: `${i * 80}ms`,
                        }}
                      >
                        <span className="text-[10px] font-semibold text-primary-foreground">{f.valor}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border/50 bg-card p-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Leads por Semana</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weeklyLeads} barCategoryGap="25%">
                  <XAxis dataKey="semana" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
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
                  />
                  <Bar dataKey="leads" radius={[4, 4, 0, 0]}>
                    {weeklyLeads.map((_, i) => (
                      <Cell key={i} fill={i === weeklyLeads.length - 1 ? "hsl(var(--success))" : "hsl(var(--primary) / 0.5)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insights */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Alertas & Insights</h3>
            {insights.map((ins, i) => {
              const borderCls = ins.type === "alert" ? "border-l-destructive/60" : ins.type === "info" ? "border-l-warning/60" : "border-l-success/60";
              const labelCls = ins.type === "alert" ? "text-destructive" : ins.type === "info" ? "text-warning" : "text-success";
              return (
                <div key={i}
                  className={`rounded-lg border border-border/50 bg-card p-4 border-l-2 ${borderCls} transition-colors hover:border-border`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${labelCls}`}>
                    {ins.type === "alert" ? "Atenção" : ins.type === "info" ? "Info" : "Positivo"}
                  </p>
                  <p className="text-sm font-medium text-foreground mb-1">{ins.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{ins.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ══════ SEÇÃO 5 — Tabela de Leads Qualificados ══════ */}
        <section className="mt-6 rounded-lg border border-border/50 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leads Qualificados pela Sol</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  {["Cliente", "Cidade", "Valor Conta", "Score", "Temperatura", "Etapa", "Responsável", "Data"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leadsTable.map((l, i) => (
                  <tr key={i} className="border-b border-border/20 transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium text-foreground">{l.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{l.cidade}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{l.valorConta}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-foreground tabular-nums">{l.score}</span>
                    </td>
                    <td className="px-4 py-3"><TempDot temp={l.temperatura} /></td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] text-muted-foreground">{l.etapa}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{l.responsavel}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs tabular-nums">{l.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ══════ SEÇÃO 6 — Bottom Grid ══════ */}
        <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Origem */}
          <div className="rounded-lg border border-border/50 bg-card p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Origem dos Leads</h3>
            <div className="space-y-3">
              {origemLeads.map((o, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-24 text-[11px] text-muted-foreground">{o.origem}</span>
                  <div className="flex-1 h-4 rounded bg-secondary/50 overflow-hidden">
                    <div className="h-full rounded bg-primary/60" style={{ width: `${o.pct * 3}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-8 text-right tabular-nums">{o.valor}</span>
                  <span className="text-[11px] text-muted-foreground w-10 text-right tabular-nums">{o.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Sol */}
          <div className="rounded-lg border border-border/50 bg-card p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Performance Sol</h3>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: "Score Médio", val: solPerformance.scoreMedio },
                { label: "Taxa Qualif.", val: `${solPerformance.taxaQualificacao}%` },
                { label: "Resp. Médio", val: `${solPerformance.respostMedia}s` },
                { label: "Agendados", val: solPerformance.agendados },
              ].map((m, i) => (
                <div key={i} className="rounded-md bg-secondary/40 p-3">
                  <p className="text-[10px] text-muted-foreground mb-0.5">{m.label}</p>
                  <p className="text-lg font-bold text-foreground tabular-nums">{m.val}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {solPerformance.temperaturas.map((t, i) => {
                const cls = t.label === "QUENTE" ? "bg-destructive/60" : t.label === "FRIO" ? "bg-info/60" : "bg-warning/60";
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-16 text-[11px] text-muted-foreground capitalize">{t.label.toLowerCase()}</span>
                    <div className="flex-1 h-3 rounded bg-secondary/50 overflow-hidden">
                      <div className={`h-full rounded ${cls}`} style={{ width: `${t.pct}%` }} />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground w-12 text-right tabular-nums">{t.pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Atividade Recente */}
          <div className="rounded-lg border border-border/50 bg-card p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Atividade Recente</h3>
            <div className="space-y-4">
              {atividadeRecente.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-md bg-secondary/60 flex items-center justify-center text-sm shrink-0">
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.nome}</p>
                    <p className="text-[11px] text-muted-foreground">{a.detalhe}</p>
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded whitespace-nowrap">
                    {a.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ RODAPÉ ══════ */}
        <footer className="mt-12 mb-6 text-center">
          <p className="text-xs text-muted-foreground/60 font-medium">
            Desenvolvido por <strong className="text-foreground/70">RBR Consult</strong> para Evolve Energia Solar
          </p>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/30 font-medium mt-1">
            Inteligência Comercial · IA · Automação
          </p>
        </footer>
      </div>
    </div>
  );
}
