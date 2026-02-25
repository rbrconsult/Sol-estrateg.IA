import { useState, useEffect, useRef } from "react";
import {
  kpis, roiData, funnelData, weeklyLeads, insights,
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

/* ═══════════════════ MAIN PAGE ═══════════════════ */
export default function Conferencia() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

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
            <p className="text-xs text-muted-foreground mt-0.5">Painel Gerencial · Evolve Energia Solar</p>
          </div>
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Tempo real
            </span>
            <span className="text-xs text-muted-foreground font-mono tabular-nums">
              {time.toLocaleTimeString("pt-BR")}
            </span>
          </div>
        </header>

        {/* ══════ SEÇÃO 1 — KPIs ══════ */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
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

        {/* ══════ SEÇÃO 2 — ROI Resumo ══════ */}
        <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "Custo por Lead Qualificado", value: "R$ 6", sub: "vs R$ 420 SDR humano", highlight: true },
            { label: "Faturamento Potencial", value: "R$ 1.8M", sub: "284 leads × ticket médio R$ 28k" },
            { label: "Economia Mensal", value: "R$ 11.4k", sub: "Escala sem aumentar time" },
          ].map((item, i) => (
            <div key={i} className="rounded-lg border border-border/50 bg-card p-5">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">{item.label}</p>
              <p className="text-3xl font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-1.5">{item.sub}</p>
            </div>
          ))}
        </section>

        {/* ══════ SEÇÃO 3 — Grid (Funil + Insights) ══════ */}
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

        {/* ══════ SEÇÃO 4 — Tabela ══════ */}
        <section className="mt-6 rounded-lg border border-border/50 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leads Qualificados</h3>
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

        {/* ══════ SEÇÃO 5 — Bottom Grid ══════ */}
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
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/40 font-medium">
            RBR Consult × Evolve Energia Solar
          </p>
        </footer>
      </div>
    </div>
  );
}
