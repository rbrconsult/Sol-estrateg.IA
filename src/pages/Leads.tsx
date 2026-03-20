import { useMemo, useState, useEffect, useRef } from "react";
import { Loader2, AlertCircle, RefreshCw, Bot, MessageSquare, ChevronDown, ChevronUp, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useMakeComercialData } from "@/hooks/useMakeComercialData";
import { useMakeDataStore, buildMakeMap, normalizePhone, type MakeRecord } from "@/hooks/useMakeDataStore";
import { useOrgFilteredProposals } from "@/hooks/useOrgFilteredProposals";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { PageFloatingFilter } from "@/components/filters/PageFloatingFilter";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
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
import { Badge } from "@/components/ui/badge";
import type { Proposal } from "@/data/dataAdapter";
import { SLAMetrics } from "@/components/leads/SLAMetrics";
import { RobotInsights } from "@/components/leads/RobotInsights";
import { Input } from "@/components/ui/input";

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
  const queryClient = useQueryClient();
  const { data: sheetsData, isLoading, error, refetch } = useGoogleSheetsData();
  const { data: makeRecords, isLoading: makeLoading } = useMakeDataStore();
  const { proposals: orgFilteredProposals, orgFilterActive } = useOrgFilteredProposals();
  const { selectedOrgName } = useOrgFilter();
  const [searchTerm, setSearchTerm] = useState("");
  const pf = useGlobalFilters();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['google-sheets-data'] });
    queryClient.invalidateQueries({ queryKey: ['make-data-store'] });
  };

  // Use org-filtered proposals
  const proposals = orgFilteredProposals;

  const makeMap = useMemo(() => buildMakeMap(makeRecords || []), [makeRecords]);

  /** Get Make records for a proposal by phone */
  const getMakeData = (p: Proposal): MakeRecord[] => {
    if (!p.clienteTelefone) return [];
    const phone = normalizePhone(p.clienteTelefone);
    return makeMap.get(phone) || [];
  };

  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  /* ── filtered data (using PageFloatingFilter state including period) ── */
  const filtered = useMemo(() => pf.filterProposals(proposals), [proposals, pf.filterProposals]);

  /* ── filtered Make records (synced with filtered proposals) ── */
  const filteredPhones = useMemo(() => {
    const phones = new Set<string>();
    for (const p of filtered) {
      if (p.clienteTelefone) phones.add(normalizePhone(p.clienteTelefone));
    }
    return phones;
  }, [filtered]);

  const filteredMakeRecords = useMemo(() => {
    if (!makeRecords?.length) return [];
    return makeRecords.filter(r => r.telefone && filteredPhones.has(r.telefone));
  }, [makeRecords, filteredPhones]);

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

  // Make-enriched alerts
  const makeAlerts = useMemo(() => {
    if (!filteredMakeRecords.length) return [];
    const result: { type: "alert" | "info" | "success"; title: string; desc: string }[] = [];
    const ignored3days = filteredMakeRecords.filter(r => {
      if (r.status_resposta !== 'ignorou') return false;
      if (!r.data_envio) return false;
      const sent = new Date(r.data_envio);
      const diffDays = (Date.now() - sent.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays > 3;
    });
    if (ignored3days.length > 0) {
      result.push({ type: "alert", title: `${ignored3days.length} leads ignoraram FUP há +3 dias`, desc: "Leads que não responderam ao follow-up frio há mais de 3 dias." });
    }
    const responderam = filteredMakeRecords.filter(r => r.status_resposta === 'respondeu');
    if (filteredMakeRecords.length > 0) {
      const taxaResp = ((responderam.length / filteredMakeRecords.length) * 100).toFixed(0);
      result.push({ type: "info", title: `Taxa de resposta: ${taxaResp}%`, desc: `${responderam.length} de ${filteredMakeRecords.length} leads responderam aos robôs.` });
    }
    const hotNoFup = filtered.filter(p => {
      if (p.temperatura !== 'QUENTE') return false;
      const records = getMakeData(p);
      return records.length === 0;
    });
    if (hotNoFup.length > 0) {
      result.push({ type: "alert", title: `${hotNoFup.length} leads quentes sem follow-up`, desc: "Leads quentes que ainda não foram contatados pelos robôs." });
    }
    return result;
  }, [filteredMakeRecords, filtered]);

  // Robot activity stats
  const robotStats = useMemo(() => {
    if (!filteredMakeRecords.length) return null;
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = filteredMakeRecords.filter(r => r.data_envio?.startsWith(today));
    const solToday = todayRecords.filter(r => r.robo === 'sol');
    const fupToday = todayRecords.filter(r => r.robo === 'fup_frio');
    const responderam = filteredMakeRecords.filter(r => r.status_resposta === 'respondeu');
    const taxaResposta = filteredMakeRecords.length > 0 ? (responderam.length / filteredMakeRecords.length) * 100 : 0;
    const temposResposta = filteredMakeRecords
      .filter(r => r.data_envio && r.data_resposta)
      .map(r => (new Date(r.data_resposta!).getTime() - new Date(r.data_envio).getTime()) / (1000 * 60 * 60));
    const tempoMedio = temposResposta.length > 0
      ? temposResposta.reduce((a, b) => a + b, 0) / temposResposta.length
      : 0;
    const semResposta3d = filteredMakeRecords.filter(r => {
      if (r.status_resposta === 'respondeu') return false;
      if (!r.data_envio) return false;
      return (Date.now() - new Date(r.data_envio).getTime()) / (1000 * 60 * 60 * 24) > 3;
    });
    return {
      totalMsgsHoje: todayRecords.length,
      solHoje: solToday.length,
      fupHoje: fupToday.length,
      taxaResposta,
      tempoMedioHoras: tempoMedio,
      semResposta3d: semResposta3d.length,
      totalRecords: filteredMakeRecords.length,
    };
  }, [filteredMakeRecords]);

  /* ── top leads for table ── */
  const tableLeads = useMemo(() => {
    let leads = filtered;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      leads = leads.filter(l => l.nomeCliente.toLowerCase().includes(term));
    }
    return leads.slice(0, 30);
  }, [filtered, searchTerm]);

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
  const naoQualStale = filtered.filter(p => !p.solQualificado && p.tempoNaEtapa > 5);
  if (naoQualStale.length > 0) {
    alerts.push({ type: "alert", title: `${naoQualStale.length} leads sem qualificação há +5 dias`, desc: "Leads aguardando análise da Sol há mais de 5 dias." });
  }
  if (solHoje.qualificados > 0) {
    alerts.push({ type: "success", title: `Sol qualificou ${solHoje.qualificados} leads hoje`, desc: `${solHoje.quentes} quentes · ${solHoje.mornos} mornos · ${solHoje.frios} frios` });
  } else {
    alerts.push({ type: "info", title: "Nenhuma qualificação hoje", desc: "A Sol ainda não processou leads hoje." });
  }
  // Append Make alerts
  alerts.push(...makeAlerts);

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
            {orgFilterActive && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                🏢 {selectedOrgName}
              </Badge>
            )}
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

        {/* ══════ FILTRO FLUTUANTE ══════ */}
        <PageFloatingFilter
          filters={pf.filters} hasFilters={pf.hasFilters} clearFilters={pf.clearFilters}
          setPeriodo={pf.setPeriodo} setDateFrom={pf.setDateFrom} setDateTo={pf.setDateTo}
          setTemperatura={pf.setTemperatura} setSearchTerm={pf.setSearchTerm} setEtapa={pf.setEtapa}
          config={{ showPeriodo: true, showTemperatura: true, showSearch: true, showEtapa: true, searchPlaceholder: "Buscar lead..." }}
        />

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

        {/* ══════ SLA DE ATENDIMENTO ══════ */}
        <SLAMetrics proposals={filtered} makeRecords={filteredMakeRecords} />

        {/* ══════ ROBÔS & FOLLOW-UP ══════ */}
        <RobotInsights proposals={filtered} makeRecords={filteredMakeRecords} getMakeData={getMakeData} />

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

        {/* ══════ Grid: Funil + Score + Alerts lateral ══════ */}
        <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
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

            {/* Score por Origem — horizontal bars */}
            <div className="rounded-lg border border-border/50 bg-card p-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Score Médio por Origem</h3>
              <div className="space-y-2.5">
                {scorePorOrigem.slice(0, 8).map((o, i) => {
                  const maxScore = Math.max(...scorePorOrigem.slice(0, 8).map(s => s.scoreMedio), 1);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-32 text-[11px] text-muted-foreground truncate">{o.origem}</span>
                      <div className="flex-1 h-5 rounded bg-secondary/50 overflow-hidden">
                        <div
                          className="h-full rounded bg-primary/60"
                          style={{ width: `${(o.scoreMedio / maxScore) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-foreground w-10 text-right tabular-nums">{o.scoreMedio.toFixed(1)}</span>
                      <span className="text-[10px] text-muted-foreground w-8 text-right tabular-nums">{o.quantidade}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Alerts & Insights — coluna lateral */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Alertas & Insights</h3>
            {alerts.length === 0 && (
              <div className="rounded-lg border border-border/50 bg-card p-4">
                <p className="text-xs text-muted-foreground">Nenhum alerta no momento.</p>
              </div>
            )}
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
        </section>

        {/* ══════ ATIVIDADE DOS ROBÔS ══════ */}
        {robotStats && (
          <section className="mt-6 rounded-xl border border-primary/20 bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground tracking-tight">Atividade dos Robôs</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sol & FUP Frio · {robotStats.totalRecords} registros</p>
                </div>
              </div>
              {makeLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-6 gap-3">
              {[
                { label: "Msgs Hoje", value: robotStats.totalMsgsHoje },
                { label: "Sol Hoje", value: robotStats.solHoje },
                { label: "FUP Frio Hoje", value: robotStats.fupHoje },
                { label: "Taxa Resposta", value: `${robotStats.taxaResposta.toFixed(0)}%` },
                { label: "Tempo Médio (h)", value: robotStats.tempoMedioHoras > 0 ? robotStats.tempoMedioHoras.toFixed(1) : "—" },
                { label: "Sem Resposta +3d", value: robotStats.semResposta3d },
              ].map((m, i) => (
                <div key={i} className="rounded-lg bg-secondary/40 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{m.label}</p>
                  <p className="text-xl font-bold text-foreground tabular-nums">{m.value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══════ Tabela ══════ */}
        <section className="mt-6 rounded-lg border border-border/50 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between gap-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leads Detalhados</h3>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  {["Cliente", "Etapa", "Status", "Temperatura", "Score", "Últ. Contato", "Status FUP", "SLA (dias)", "Valor"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableLeads.map((l, i) => {
                  const makeData = getMakeData(l);
                  const latestMake = makeData.length > 0
                    ? makeData.reduce((a, b) => (a.data_envio > b.data_envio ? a : b))
                    : null;
                  const isExpanded = expandedLead === (l.id || String(i));

                  return (
                    <>
                      <tr
                        key={l.id || i}
                        className={cn(
                          "border-b border-border/20 transition-colors hover:bg-secondary/30",
                          makeData.length > 0 && "cursor-pointer"
                        )}
                        onClick={() => makeData.length > 0 && setExpandedLead(isExpanded ? null : (l.id || String(i)))}
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          <div className="flex items-center gap-1.5">
                            {makeData.length > 0 && (
                              isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            )}
                            {l.nomeCliente}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{l.etapa}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "text-[11px] font-medium px-2 py-0.5 rounded",
                            l.status === "Ganho" ? "bg-primary/10 text-primary" :
                            l.status === "Perdido" ? "bg-destructive/10 text-destructive" :
                            "bg-secondary text-muted-foreground"
                          )}>{l.status}</span>
                        </td>
                        <td className="px-4 py-3">{l.temperatura ? <TempDot temp={l.temperatura} /> : "—"}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-foreground tabular-nums">{l.solScore > 0 ? l.solScore.toFixed(1) : "—"}</td>
                        <td className="px-4 py-3">
                          {latestMake ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px]">{latestMake.robo === 'sol' ? '🤖' : '❄️'}</span>
                              <span className="text-[11px] text-muted-foreground">
                                {(() => { try { const d = new Date(latestMake.data_envio); return !isNaN(d.getTime()) ? format(d, "dd/MM HH:mm", { locale: ptBR }) : "—"; } catch { return "—"; } })()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/50">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {latestMake ? (
                            <span className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded",
                              latestMake.status_resposta === 'respondeu' ? "bg-primary/10 text-primary" :
                              latestMake.status_resposta === 'ignorou' ? "bg-destructive/10 text-destructive" :
                              latestMake.status_resposta === 'aguardando' ? "bg-warning/10 text-warning" :
                              "bg-secondary text-muted-foreground"
                            )}>
                              {latestMake.status_resposta === 'respondeu' ? 'Respondeu' :
                               latestMake.status_resposta === 'ignorou' ? 'Ignorou' :
                               latestMake.status_resposta === 'aguardando' ? 'Aguardando' : latestMake.status_resposta}
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-secondary/50 text-muted-foreground/50">Sem contato</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs tabular-nums">{l.tempoNaEtapa}</td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{formatCurrencyAbbrev(l.valorProposta)}</td>
                      </tr>
                      {/* ── Timeline expandida ── */}
                      {isExpanded && makeData.length > 0 && (
                        <tr key={`${l.id || i}-timeline`}>
                          <td colSpan={9} className="px-6 py-4 bg-secondary/20">
                            <div className="space-y-2">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <MessageSquare className="h-3 w-3" /> Histórico de interações
                              </p>
                              {makeData
                                .flatMap(r => r.historico.length > 0
                                  ? r.historico.map(h => ({ ...h, robo: r.robo }))
                                  : [{ tipo: 'enviada' as const, mensagem: r.ultima_mensagem, data: r.data_envio, robo: r.robo }]
                                )
                                .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                                .slice(0, 10)
                                .map((h, idx) => (
                                  <div key={idx} className={cn(
                                    "flex items-start gap-3 rounded-lg p-2.5",
                                    h.tipo === 'recebida' ? "bg-primary/5" : "bg-card"
                                  )}>
                                    <span className="text-[10px] mt-0.5">{h.robo === 'sol' ? '🤖' : '❄️'}</span>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                                          {h.tipo === 'recebida' ? 'Resposta do lead' : `Robô ${h.robo === 'sol' ? 'Sol' : 'FUP Frio'}`}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground/60">
                                          {(() => { try { const d = new Date(h.data); return !isNaN(d.getTime()) ? format(d, "dd/MM/yy HH:mm", { locale: ptBR }) : ""; } catch { return ""; } })()}
                                        </span>
                                      </div>
                                      <p className="text-xs text-foreground leading-relaxed truncate">{h.mensagem || "—"}</p>
                                    </div>
                                  </div>
                                ))}
                              {makeData.flatMap(r => r.historico).length === 0 && (
                                <p className="text-xs text-muted-foreground">Última mensagem: {makeData[0]?.ultima_mensagem || "—"}</p>
                              )}
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
