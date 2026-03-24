import { useMemo, useState, useEffect, useRef } from "react";
import { Loader2, AlertCircle, RefreshCw, Search, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useMakeDataStore, type MakeRecord } from "@/hooks/useMakeDataStore";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { PageFloatingFilter } from "@/components/filters/PageFloatingFilter";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { formatCurrencyAbbrev } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SLAMetrics } from "@/components/leads/SLAMetrics";
import { RobotInsights } from "@/components/leads/RobotInsights";

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
  const cls = temp === "QUENTE" ? "bg-destructive/80" : temp === "FRIO" ? "bg-blue-500/80" : "bg-warning/80";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${cls}`} />
      <span className="capitalize">{temp.toLowerCase()}</span>
    </span>
  );
}

/* ───────── KPI card ───────── */
function KPICard({ label, value, suffix, isDecimal }: { label: string; value: number; suffix?: string; isDecimal?: boolean }) {
  const { value: animVal, ref } = useAnimatedNumber(value, 1400, isDecimal);
  return (
    <div ref={ref} className="rounded-lg border border-border/50 bg-card p-4 transition-all duration-200 hover:border-border">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">{label}</p>
      <p className="text-2xl font-bold text-foreground tabular-nums">{animVal}{suffix || ""}</p>
    </div>
  );
}

/* ═══════════════════ MAIN ═══════════════════ */
export default function Leads() {
  const queryClient = useQueryClient();
  const { data: makeRecords, isLoading, error, forceSync } = useMakeDataStore();
  const { orgFilterActive } = { orgFilterActive: false };
  const { selectedOrgName } = useOrgFilter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEtapa, setFilterEtapa] = useState("todas");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterCloser, setFilterCloser] = useState("todos");
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const pf = useGlobalFilters();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['make-data-store'] });
  };

  /* ── clock ── */
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* ── All records from DS Thread (905) — apply period filter from global filters ── */
  const periodFiltered = useMemo(() => {
    const records = makeRecords || [];
    return pf.filterRecords ? pf.filterRecords(records) : records;
  }, [makeRecords, pf.filterRecords]);

  /* ── Extract unique values for filters ── */
  const etapas = useMemo(() => {
    const set = new Set<string>();
    periodFiltered.forEach(r => { if (r.etapaFunil) set.add(r.etapaFunil); });
    return Array.from(set).sort();
  }, [periodFiltered]);

  const closers = useMemo(() => {
    const set = new Set<string>();
    periodFiltered.forEach(r => { if (r.closerAtribuido) set.add(r.closerAtribuido); });
    return Array.from(set).sort();
  }, [periodFiltered]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    periodFiltered.forEach(r => { if (r.makeStatus) set.add(r.makeStatus); });
    return Array.from(set).sort();
  }, [periodFiltered]);

  /* ── Filtered records (search + inline filters on top of period) ── */
  const filtered = useMemo(() => {
    return periodFiltered.filter(r => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const match = (r.nome || "").toLowerCase().includes(term) ||
          (r.telefone || "").includes(term) ||
          (r.cidade || "").toLowerCase().includes(term);
        if (!match) return false;
      }
      if (filterEtapa !== "todas" && r.etapaFunil !== filterEtapa) return false;
      if (filterStatus !== "todos" && r.makeStatus !== filterStatus) return false;
      if (filterCloser !== "todos" && r.closerAtribuido !== filterCloser) return false;
      return true;
    });
  }, [periodFiltered, searchTerm, filterEtapa, filterStatus, filterCloser]);

  /* ── KPIs ── */
  const kpis = useMemo(() => {
    const total = filtered.length;
    const quentes = filtered.filter(r => (r.makeTemperatura || "").toUpperCase() === "QUENTE").length;
    const mornos = filtered.filter(r => (r.makeTemperatura || "").toUpperCase() === "MORNO").length;
    const frios = filtered.filter(r => (r.makeTemperatura || "").toUpperCase() === "FRIO").length;
    const responderam = filtered.filter(r => r.status_resposta === "respondeu").length;
    const taxaResposta = total > 0 ? (responderam / total) * 100 : 0;
    const scores = filtered.filter(r => r.makeScore).map(r => parseFloat(r.makeScore!) || 0).filter(s => s > 0);
    const scoreMedio = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return { total, quentes, mornos, frios, responderam, taxaResposta, scoreMedio };
  }, [filtered]);

  /* ── Funil por Etapa (journey order) ── */
  const JOURNEY_ORDER = ['TRAFEGO PAGO', 'PROSPECÇÃO', 'FOLLOW UP', 'QUALIFICAÇÃO', 'QUALIFICADO', 'CONTATO REALIZADO'];
  const funnelData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of filtered) {
      const etapa = r.etapaFunil || 'TRAFEGO PAGO';
      counts[etapa] = (counts[etapa] || 0) + 1;
    }
    return JOURNEY_ORDER.map(etapa => ({
      etapa,
      quantidade: counts[etapa] || 0,
    }));
  }, [filtered]);

  const maxFunnel = useMemo(() => Math.max(...funnelData.map(f => f.quantidade), 1), [funnelData]);

  /* ── Funnel animation ── */
  const [funnelVisible, setFunnelVisible] = useState(false);
  const funnelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = funnelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setFunnelVisible(true); }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* ── Alerts ── */
  const alerts = useMemo(() => {
    const result: { type: "alert" | "info" | "success"; title: string; desc: string }[] = [];
    const ignored3d = filtered.filter(r => {
      if (r.status_resposta !== 'ignorou') return false;
      if (!r.data_envio) return false;
      const sent = new Date(r.data_envio);
      return (Date.now() - sent.getTime()) / (1000 * 60 * 60 * 24) > 3;
    });
    if (ignored3d.length > 0) {
      result.push({ type: "alert", title: `${ignored3d.length} leads ignoraram FUP há +3 dias`, desc: "Leads sem resposta ao follow-up." });
    }
    if (kpis.total > 0) {
      result.push({ type: "info", title: `Taxa de resposta: ${kpis.taxaResposta.toFixed(0)}%`, desc: `${kpis.responderam} de ${kpis.total} leads responderam.` });
    }
    if (kpis.quentes > 0) {
      result.push({ type: "success", title: `${kpis.quentes} leads quentes`, desc: `${kpis.mornos} mornos · ${kpis.frios} frios` });
    }
    return result;
  }, [filtered, kpis]);

  /* ── Table pagination ── */
  const tableLeads = useMemo(() => filtered.slice(0, 50), [filtered]);

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-6 pb-16">

        <PageFloatingFilter
          filters={pf.filters} hasFilters={pf.hasFilters} clearFilters={pf.clearFilters}
          setPeriodo={pf.setPeriodo} setDateFrom={pf.setDateFrom} setDateTo={pf.setDateTo}
          setTemperatura={pf.setTemperatura} setSearchTerm={pf.setSearchTerm} setEtapa={pf.setEtapa}
          config={{ showPeriodo: true, showTemperatura: true, showSearch: false, showEtapa: false }}
        />

        <header className="sticky top-0 z-50 py-5 flex items-center justify-between bg-background/95 backdrop-blur-sm border-b border-border/40">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">Dashboard de Leads</h1>
            <p className="text-xs text-muted-foreground mt-0.5">DS Thread · {filtered.length} de {(makeRecords || []).length} leads</p>
          </div>
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Dados reais
            </span>
            <span className="text-xs text-muted-foreground font-mono tabular-nums">
              {time.toLocaleTimeString("pt-BR")}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh} title="Atualizar dados">
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </header>

        {/* ══════ FILTROS INLINE ══════ */}
        <section className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar nome, telefone, cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Select value={filterEtapa} onValueChange={setFilterEtapa}>
            <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Etapa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas Etapas</SelectItem>
              {etapas.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCloser} onValueChange={setFilterCloser}>
            <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Closer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Closers</SelectItem>
              {closers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </section>

        {/* ══════ KPIs ══════ */}
        <section className="grid grid-cols-2 lg:grid-cols-6 gap-3 mt-4">
          <KPICard label="Total Leads" value={kpis.total} />
          <KPICard label="Quentes" value={kpis.quentes} />
          <KPICard label="Mornos" value={kpis.mornos} />
          <KPICard label="Frios" value={kpis.frios} />
          <KPICard label="Taxa Resposta" value={kpis.taxaResposta} suffix="%" isDecimal />
          <KPICard label="Score Médio" value={kpis.scoreMedio} isDecimal />
        </section>

        {/* ══════ Grid: Funil + Alerts ══════ */}
        <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div ref={funnelRef} className="rounded-lg border border-border/50 bg-card p-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Funil por Etapa (Jornada)</h3>
              <div className="space-y-2.5">
                {funnelData.map((f, i) => (
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
          </div>

          {/* Alerts */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Alertas & Insights</h3>
            {alerts.map((ins, i) => {
              const borderCls = ins.type === "alert" ? "border-l-destructive/60" : ins.type === "info" ? "border-l-warning/60" : "border-l-emerald-500/60";
              const labelCls = ins.type === "alert" ? "text-destructive" : ins.type === "info" ? "text-warning" : "text-emerald-500";
              return (
                <div key={i} className={`rounded-lg border border-border/50 bg-card p-4 border-l-2 ${borderCls}`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${labelCls}`}>
                    {ins.type === "alert" ? "Atenção" : ins.type === "info" ? "Info" : "Positivo"}
                  </p>
                  <p className="text-sm font-medium text-foreground mb-1">{ins.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{ins.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ══════ Tabela ══════ */}
        <section className="mt-6 rounded-lg border border-border/50 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Leads Detalhados · {filtered.length} registros
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  {["Nome", "Telefone", "Etapa Funil", "Status", "Cidade", "Temperatura", "Score", "Closer", "Status FUP", "Data"].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableLeads.map((r, i) => {
                  const isExpanded = expandedLead === (r.telefone + i);
                  return (
                    <>
                      <tr
                        key={r.telefone + i}
                        className={cn(
                          "border-b border-border/20 transition-colors hover:bg-secondary/30 cursor-pointer"
                        )}
                        onClick={() => setExpandedLead(isExpanded ? null : r.telefone + i)}
                      >
                        <td className="px-3 py-2.5 font-medium text-foreground text-xs">
                          <div className="flex items-center gap-1.5">
                            {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                            {r.nome || '—'}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground text-xs font-mono">{r.telefone || '—'}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                            {r.etapaFunil || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.makeStatus || '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.cidade || '—'}</td>
                        <td className="px-3 py-2.5">
                          {r.makeTemperatura ? <TempDot temp={r.makeTemperatura} /> : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-xs font-semibold text-foreground tabular-nums">
                          {r.makeScore && parseFloat(r.makeScore) > 0 ? parseFloat(r.makeScore).toFixed(1) : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.closerAtribuido || '—'}</td>
                        <td className="px-3 py-2.5">
                          <span className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded",
                            r.status_resposta === 'respondeu' ? "bg-primary/10 text-primary" :
                            r.status_resposta === 'ignorou' ? "bg-destructive/10 text-destructive" :
                            "bg-secondary text-muted-foreground"
                          )}>
                            {r.status_resposta === 'respondeu' ? 'Respondeu' :
                             r.status_resposta === 'ignorou' ? 'Ignorou' : 'Aguardando'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-[10px] text-muted-foreground">
                          {(() => { try { const d = new Date(r.data_envio); return !isNaN(d.getTime()) ? format(d, "dd/MM HH:mm", { locale: ptBR }) : "—"; } catch { return "—"; } })()}
                        </td>
                      </tr>
                      {isExpanded && r.historico.length > 0 && (
                        <tr key={`${r.telefone}${i}-timeline`}>
                          <td colSpan={10} className="px-6 py-4 bg-secondary/20">
                            <div className="space-y-2">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <MessageSquare className="h-3 w-3" /> Histórico de interações
                              </p>
                              {r.historico.slice(0, 10).map((h, idx) => (
                                <div key={idx} className={cn(
                                  "flex items-start gap-3 rounded-lg p-2.5",
                                  h.tipo === 'recebida' ? "bg-primary/5" : "bg-card"
                                )}>
                                  <span className="text-[10px] mt-0.5">{r.robo === 'sol' ? '🤖' : '❄️'}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                                        {h.tipo === 'recebida' ? 'Resposta do lead' : `Robô ${r.robo === 'sol' ? 'Sol' : 'FUP Frio'}`}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground/60">
                                        {(() => { try { const d = new Date(h.data); return !isNaN(d.getTime()) ? format(d, "dd/MM/yy HH:mm", { locale: ptBR }) : ""; } catch { return ""; } })()}
                                      </span>
                                    </div>
                                    <p className="text-xs text-foreground leading-relaxed truncate">{h.mensagem || "—"}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > 50 && (
            <div className="px-5 py-3 border-t border-border/40 text-center">
              <p className="text-xs text-muted-foreground">Exibindo 50 de {filtered.length} leads. Use os filtros para refinar.</p>
            </div>
          )}
        </section>

        {/* ══════ Temperatura por Etapa ══════ */}
        <section className="mt-6">
          <div className="rounded-lg border border-border/50 bg-card p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Temperatura por Etapa</h3>
            <div className="space-y-3">
              {JOURNEY_ORDER.map((etapa) => {
                const etapaRecords = filtered.filter(r => (r.etapaFunil || 'TRAFEGO PAGO') === etapa);
                const quente = etapaRecords.filter(r => (r.makeTemperatura || "").toUpperCase() === "QUENTE").length;
                const morno = etapaRecords.filter(r => (r.makeTemperatura || "").toUpperCase() === "MORNO").length;
                const frio = etapaRecords.filter(r => (r.makeTemperatura || "").toUpperCase() === "FRIO").length;
                const total = etapaRecords.length;
                if (total === 0) return null;
                return (
                  <div key={etapa}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-muted-foreground truncate w-36">{etapa}</span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">{total}</span>
                    </div>
                    <div className="flex h-3 rounded overflow-hidden bg-secondary/50">
                      {quente > 0 && <div className="bg-destructive/60 h-full" style={{ width: `${(quente / total) * 100}%` }} />}
                      {morno > 0 && <div className="bg-warning/60 h-full" style={{ width: `${(morno / total) * 100}%` }} />}
                      {frio > 0 && <div className="bg-blue-500/60 h-full" style={{ width: `${(frio / total) * 100}%` }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <footer className="mt-12 mb-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/40 font-medium">
            RBR Consult × Dashboard de Leads
          </p>
        </footer>
      </div>
    </div>
  );
}
