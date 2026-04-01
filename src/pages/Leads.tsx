import { useMemo, useState, useEffect, useRef } from "react";
import { Loader2, AlertCircle, RefreshCw, Search, ChevronDown, ChevronUp, MessageSquare, Timer, Bot, Zap, TrendingUp, CheckCircle2, Clock, AlertTriangle, Send, Users, Flame, CheckCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useMakeDataStore, type MakeRecord } from "@/hooks/useMakeDataStore";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { PageFloatingFilter } from "@/components/filters/PageFloatingFilter";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CanalOrigemBadge } from "@/components/sol/CanalOrigemBadge";
import { TemperatureBadge } from "@/components/sol/TemperatureBadge";
import { LeadDetailDrawer } from "@/components/sol/LeadDetailDrawer";
import { useSolActions } from "@/hooks/useSolActions";

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

/* ───────── helpers ───────── */
/** Normalize temperature, filtering out junk like "XXXX" */
function normalizeTemp(t: string | undefined): string {
  if (!t) return "";
  const upper = t.toUpperCase().trim();
  if (["QUENTE", "MORNO", "FRIO"].includes(upper)) return upper;
  return "";
}

/** Normalize closer name for consistent grouping */
function normalizeCloser(c: string | undefined): string {
  if (!c) return "";
  return c.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

/** Get etapa label — treat empty as "Sem Etapa" */
function getEtapaLabel(r: MakeRecord): string {
  return r.etapaFunil?.trim() || "SEM ETAPA";
}

function safeDate(str: string | undefined): Date | null {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function hoursSince(dateStr: string): number {
  const d = safeDate(dateStr);
  if (!d) return 0;
  return Math.max(0, (Date.now() - d.getTime()) / (1000 * 60 * 60));
}

/* ═══════════════════ ETAPAS DO FUNIL ═══════════════════ */
const JOURNEY_ORDER = [
  'TRAFEGO PAGO',
  'SOL SDR',
  'PROSPECÇÃO',
  'FOLLOW UP',
  'QUALIFICAÇÃO',
  'QUALIFICADO',
  'CONTATO REALIZADO',
  'PROPOSTA',
  'NEGOCIAÇÃO',
  'REMARKETING',
  'DECLÍNIO',
  'SEM ETAPA',
];

/* ═══════════════════ MAIN ═══════════════════ */
export default function Leads() {
  const queryClient = useQueryClient();
  const { data: makeRecords, isLoading, error, forceSync } = useMakeDataStore();
  const { selectedOrgName } = useOrgFilter();
  const solActions = useSolActions();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEtapa, setFilterEtapa] = useState("todas");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterCloser, setFilterCloser] = useState("todos");
  const [filterCanal, setFilterCanal] = useState("todos");
  const [filterDsSource, setFilterDsSource] = useState("todos");
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [drawerLead, setDrawerLead] = useState<MakeRecord | null>(null);
  const [tableLimit, setTableLimit] = useState(50);
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

  /* ── Period filter ── */
  const periodFiltered = useMemo(() => {
    const records = makeRecords || [];
    return pf.filterRecords ? pf.filterRecords(records) : records;
  }, [makeRecords, pf.filterRecords]);

  /* ── Extract unique values for filters (normalized) ── */
  const etapas = useMemo(() => {
    const set = new Set<string>();
    periodFiltered.forEach(r => set.add(getEtapaLabel(r)));
    return Array.from(set).sort();
  }, [periodFiltered]);

  const closers = useMemo(() => {
    const set = new Set<string>();
    periodFiltered.forEach(r => {
      const c = normalizeCloser(r.closerAtribuido);
      if (c && c.toUpperCase() !== "SOL SDR") set.add(c);
    });
    return Array.from(set).sort();
  }, [periodFiltered]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    periodFiltered.forEach(r => { if (r.makeStatus) set.add(r.makeStatus); });
    return Array.from(set).sort();
  }, [periodFiltered]);

  /* ── Filtered records ── */
  const filtered = useMemo(() => {
    return periodFiltered.filter(r => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const match = (r.nome || "").toLowerCase().includes(term) ||
          (r.telefone || "").includes(term) ||
          (r.cidade || "").toLowerCase().includes(term);
        if (!match) return false;
      }
      if (filterEtapa !== "todas" && getEtapaLabel(r) !== filterEtapa) return false;
      if (filterStatus !== "todos" && r.makeStatus !== filterStatus) return false;
      if (filterCloser !== "todos" && normalizeCloser(r.closerAtribuido) !== filterCloser) return false;
      if (filterCanal !== "todos" && (r.canalOrigem || "").toUpperCase() !== filterCanal) return false;
      if (filterDsSource !== "todos" && (r.dsSource || "sol_leads") !== filterDsSource) return false;
      return true;
    });
  }, [periodFiltered, searchTerm, filterEtapa, filterStatus, filterCloser, filterCanal, filterDsSource]);

  /* ── KPIs ── */
  const kpis = useMemo(() => {
    const total = filtered.length;
    const quentes = filtered.filter(r => normalizeTemp(r.makeTemperatura) === "QUENTE").length;
    const mornos = filtered.filter(r => normalizeTemp(r.makeTemperatura) === "MORNO").length;
    const frios = filtered.filter(r => normalizeTemp(r.makeTemperatura) === "FRIO").length;
    const semTemp = total - quentes - mornos - frios;
    const responderam = filtered.filter(r => r.status_resposta === "respondeu").length;
    const taxaResposta = total > 0 ? (responderam / total) * 100 : 0;
    const scores = filtered.filter(r => r.makeScore).map(r => parseFloat(r.makeScore!) || 0).filter(s => s > 0);
    const scoreMedio = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return { total, quentes, mornos, frios, semTemp, responderam, taxaResposta, scoreMedio };
  }, [filtered]);

  /* ── Funil por Etapa ── */
  const funnelData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of filtered) {
      const etapa = getEtapaLabel(r);
      counts[etapa] = (counts[etapa] || 0) + 1;
    }
    // Include only stages that have data, in journey order
    return JOURNEY_ORDER
      .filter(etapa => (counts[etapa] || 0) > 0)
      .map(etapa => ({ etapa, quantidade: counts[etapa] || 0 }));
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

  /* ── SLA Metrics (MakeRecord only) ── */
  const slaData = useMemo(() => {
    const SLA_ETAPA: Record<string, { label: string; maxDias: number }> = {
      "TRAFEGO PAGO": { label: "Tráfego Pago", maxDias: 1 },
      "SOL SDR": { label: "Sol SDR", maxDias: 2 },
      "PROSPECÇÃO": { label: "Prospecção", maxDias: 2 },
      "QUALIFICAÇÃO": { label: "Qualificação", maxDias: 3 },
      "QUALIFICADO": { label: "Qualificado", maxDias: 5 },
      "CONTATO REALIZADO": { label: "Contato Realizado", maxDias: 3 },
      "PROPOSTA": { label: "Proposta", maxDias: 5 },
      "NEGOCIAÇÃO": { label: "Negociação", maxDias: 7 },
    };

    // SLA por etapa: usa SOMENTE dataEntrada (sem fallback para evitar distorções)
    const ativos = filtered.filter(r => r.makeStatus && !["PERDIDO", "DESQUALIFICADO", "GANHO"].includes(r.makeStatus.toUpperCase()));
    const etapaSLA = Object.entries(SLA_ETAPA).map(([etapa, config]) => {
      const leads = ativos.filter(r => getEtapaLabel(r) === etapa);
      const comData = leads.filter(r => !!r.dataEntrada);
      const tempos = comData.map(r => {
        const d = safeDate(r.dataEntrada);
        if (!d) return 0;
        return Math.max(0, (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
      }).filter(t => t > 0 && t < 365);
      const media = tempos.length > 0 ? tempos.reduce((a, b) => a + b, 0) / tempos.length : 0;
      const foraDoSLA = tempos.filter(t => t > config.maxDias).length;
      const semData = leads.length - comData.length;
      return { etapa, ...config, quantidade: leads.length, media: Math.round(media * 10) / 10, foraDoSLA, semData, comDados: tempos.length };
    }).filter(e => e.quantidade > 0);

    const totalForaSLA = etapaSLA.reduce((a, e) => a + e.foraDoSLA, 0);

    // SLA robôs: usa dataEntrada → data_resposta (ambos devem existir)
    const comResposta = filtered.filter(r => r.dataEntrada && r.data_resposta);
    const temposRobo = comResposta.map(r => {
      const envio = safeDate(r.dataEntrada);
      const resp = safeDate(r.data_resposta);
      if (!envio || !resp) return -1;
      return Math.max(0, (resp.getTime() - envio.getTime()) / (1000 * 60 * 60));
    }).filter(h => h >= 0 && h < 720);
    const mediaRoboHoras = temposRobo.length > 0 ? temposRobo.reduce((a, b) => a + b, 0) / temposRobo.length : 0;

    // SLA 1º atendimento (data_entrada → data_resposta)
    const comQualif = filtered.filter(r => r.dataEntrada && r.data_resposta);
    const temposAtend = comQualif.map(r => {
      const entrada = safeDate(r.dataEntrada);
      const resp = safeDate(r.data_resposta);
      if (!entrada || !resp) return -1;
      return Math.max(0, (resp.getTime() - entrada.getTime()) / (1000 * 60 * 60 * 24));
    }).filter(d => d >= 0 && d < 365);
    const mediaAtend = temposAtend.length > 0 ? temposAtend.reduce((a, b) => a + b, 0) / temposAtend.length : 0;
    const dentroSLA24h = temposAtend.filter(d => d <= 1).length;
    const taxaSLA24h = temposAtend.length > 0 ? (dentroSLA24h / temposAtend.length) * 100 : 0;

    // Flag: dados insuficientes
    const totalComEntrada = filtered.filter(r => !!r.dataEntrada).length;
    const dadosInsuficientes = temposAtend.length === 0;

    return { etapaSLA, totalForaSLA, mediaRoboHoras, mediaAtend, taxaSLA24h, dentroSLA24h, temposAtendCount: temposAtend.length, dadosInsuficientes, totalComEntrada, totalLeads: filtered.length };
  }, [filtered]);

  /* ── Robot Insights (MakeRecord only) ── */
  const robotData = useMemo(() => {
    const solRecords = filtered.filter(r => r.robo === "sol");
    const fupRecords = filtered.filter(r => r.robo !== "sol");

    const solResp = solRecords.filter(r => r.status_resposta === "respondeu").length;
    const fupResp = fupRecords.filter(r => r.status_resposta === "respondeu").length;
    const solTaxa = solRecords.length > 0 ? (solResp / solRecords.length) * 100 : 0;
    const fupTaxa = fupRecords.length > 0 ? (fupResp / fupRecords.length) * 100 : 0;

    const calcTempoMedio = (records: MakeRecord[]) => {
      const tempos = records
        .filter(r => r.data_envio && r.data_resposta)
        .map(r => {
          const envio = safeDate(r.data_envio);
          const resp = safeDate(r.data_resposta);
          if (!envio || !resp) return -1;
          return (resp.getTime() - envio.getTime()) / (1000 * 60 * 60);
        })
        .filter(h => h >= 0 && h < 720);
      return tempos.length > 0 ? tempos.reduce((a, b) => a + b, 0) / tempos.length : 0;
    };

    const robots = [
      { name: "Sol (Qualificação)", icon: "🤖", total: solRecords.length, responderam: solResp, taxa: solTaxa, tempoMedio: calcTempoMedio(solRecords) },
      { name: "FUP Frio (Follow-up)", icon: "❄️", total: fupRecords.length, responderam: fupResp, taxa: fupTaxa, tempoMedio: calcTempoMedio(fupRecords) },
    ];

    // Follow-up count
    const phoneMap = new Map<string, { count: number; responded: boolean }>();
    for (const r of filtered) {
      if (!r.telefone) continue;
      const fc = r.followupCount || 1;
      const existing = phoneMap.get(r.telefone);
      if (existing) {
        existing.count = Math.max(existing.count, fc);
        if (r.status_resposta === "respondeu") existing.responded = true;
      } else {
        phoneMap.set(r.telefone, { count: fc, responded: r.status_resposta === "respondeu" });
      }
    }
    const fupEntries = Array.from(phoneMap.values());
    const mediaFups = fupEntries.length > 0 ? fupEntries.reduce((a, e) => a + e.count, 0) / fupEntries.length : 0;
    const respondidos = fupEntries.filter(e => e.responded);
    const mediaFupsAteResp = respondidos.length > 0 ? respondidos.reduce((a, e) => a + e.count, 0) / respondidos.length : 0;
    const excessoFups = fupEntries.filter(e => e.count >= 5 && !e.responded).length;

    // Funnel
    const totalEnviados = filtered.filter(r => r.data_envio).length;
    const totalResponderam = filtered.filter(r => r.status_resposta === "respondeu").length;
    const qualificados = filtered.filter(r => getEtapaLabel(r) === "QUALIFICADO").length;

    // Alertas
    const ignorando3d = filtered.filter(r => r.status_resposta !== "respondeu" && hoursSince(r.data_envio) > 72).length;
    const quentesSemResp = filtered.filter(r => normalizeTemp(r.makeTemperatura) === "QUENTE" && r.status_resposta !== "respondeu").length;

    return { robots, mediaFups, mediaFupsAteResp, excessoFups, fupEntries: fupEntries.length, respondidosCount: respondidos.length, totalEnviados, totalResponderam, qualificados, ignorando3d, quentesSemResp };
  }, [filtered]);

  /* ── Alerts ── */
  const alerts = useMemo(() => {
    const result: { type: "alert" | "info" | "success"; title: string; desc: string }[] = [];
    if (robotData.ignorando3d > 0) {
      result.push({ type: "alert", title: `${robotData.ignorando3d} leads sem resposta há +3 dias`, desc: "Leads que não responderam ao follow-up." });
    }
    if (robotData.quentesSemResp > 0) {
      result.push({ type: "alert", title: `${robotData.quentesSemResp} leads quentes sem resposta`, desc: "Priorizar contato direto com esses leads." });
    }
    if (kpis.total > 0) {
      result.push({ type: "info", title: `Taxa de resposta: ${kpis.taxaResposta.toFixed(0)}%`, desc: `${kpis.responderam} de ${kpis.total} leads responderam.` });
    }
    if (kpis.quentes > 0) {
      result.push({ type: "success", title: `${kpis.quentes} leads quentes`, desc: `${kpis.mornos} mornos · ${kpis.frios} frios · ${kpis.semTemp} sem classificação` });
    }
    return result;
  }, [kpis, robotData]);

  /* ── Table data ── */
  const tableLeads = useMemo(() => filtered.slice(0, tableLimit), [filtered, tableLimit]);

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
        <Button onClick={() => forceSync()} variant="outline">Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-6 pb-16">

        <PageFloatingFilter
          filters={pf.filters} hasFilters={pf.hasFilters} clearFilters={pf.clearFilters}
          setPeriodo={pf.setPeriodo} setDateFrom={pf.setDateFrom} setDateTo={pf.setDateTo}
          setTemperatura={pf.setTemperatura} setSearchTerm={pf.setSearchTerm} setEtapa={pf.setEtapa} setStatus={pf.setStatus}
          config={{ showPeriodo: true, showTemperatura: true, showSearch: false, showEtapa: true, showStatus: true }}
        />

        <header className="sticky top-0 z-50 py-5 flex items-center justify-between bg-background/95 backdrop-blur-sm border-b border-border/40">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">Leads</h1>
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
          <Select value={filterCanal} onValueChange={setFilterCanal}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Canal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Canais</SelectItem>
              <SelectItem value="META_ADS">Meta Ads</SelectItem>
              <SelectItem value="GOOGLE_ADS">Google Ads</SelectItem>
              <SelectItem value="SITE_ORGANICO">Site</SelectItem>
              <SelectItem value="INBOUND_WHATSAPP">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterDsSource} onValueChange={setFilterDsSource}>
            <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Origem" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="sol_leads">SOL Leads</SelectItem>
            </SelectContent>
          </Select>
        </section>

        {/* ══════ KPIs ══════ */}
        <section className="grid grid-cols-2 lg:grid-cols-7 gap-3 mt-4">
          <KPICard label="Leads Recebidos" value={kpis.total} />
          <KPICard label="Quentes" value={kpis.quentes} />
          <KPICard label="Mornos" value={kpis.mornos} />
          <KPICard label="Frios" value={kpis.frios} />
          <KPICard label="S/ Classificação" value={kpis.semTemp} />
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
                    <span className="w-40 text-[11px] text-muted-foreground truncate">{f.etapa}</span>
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

        {/* ══════ SLA de Atendimento ══════ */}
        <section className="mt-6 rounded-xl border border-primary/20 bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Timer className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-tight">SLA de Atendimento</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tempo de resposta e permanência por etapa</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Fora do SLA</p>
              <p className={cn("text-sm font-bold tabular-nums", slaData.totalForaSLA > 0 ? "text-destructive" : "text-primary")}>
                {slaData.totalForaSLA} leads
              </p>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {/* Aviso de dados insuficientes */}
            {slaData.dadosInsuficientes && (
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Dados insuficientes para SLA de 1º Atendimento</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    O DS Thread não possui o campo <code className="bg-muted px-1 rounded text-[10px]">data_qualificacao</code> preenchido junto com <code className="bg-muted px-1 rounded text-[10px]">respondeu = true</code>.
                    {slaData.totalLeads - slaData.totalComEntrada > 0 && (
                      <> Além disso, <strong>{slaData.totalLeads - slaData.totalComEntrada}</strong> leads estão sem <code className="bg-muted px-1 rounded text-[10px]">data_entrada</code>.</>
                    )}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                {
                  label: "Tempo Médio 1º Atendimento",
                  value: slaData.temposAtendCount > 0 ? `${slaData.mediaAtend.toFixed(1)}d` : "—",
                  sub: slaData.temposAtendCount > 0 ? `${slaData.temposAtendCount} leads` : "Sem dados no DS",
                  status: slaData.temposAtendCount === 0 ? "nodata" : slaData.mediaAtend <= 1 ? "ok" : slaData.mediaAtend <= 3 ? "warning" : "overdue" as const,
                },
                {
                  label: "Dentro SLA 24h",
                  value: slaData.temposAtendCount > 0 ? `${slaData.taxaSLA24h.toFixed(0)}%` : "—",
                  sub: slaData.temposAtendCount > 0 ? `${slaData.dentroSLA24h} de ${slaData.temposAtendCount}` : "Sem dados no DS",
                  status: slaData.temposAtendCount === 0 ? "nodata" : slaData.taxaSLA24h >= 80 ? "ok" : slaData.taxaSLA24h >= 50 ? "warning" : "overdue" as const,
                },
                {
                  label: "SLA Robôs (resp.)",
                  value: slaData.mediaRoboHoras > 0 ? `${slaData.mediaRoboHoras.toFixed(1)}h` : "—",
                  sub: kpis.responderam > 0 ? `${kpis.responderam} responderam` : "Sem dados no DS",
                  status: slaData.mediaRoboHoras === 0 ? "nodata" : slaData.mediaRoboHoras <= 4 ? "ok" : slaData.mediaRoboHoras <= 12 ? "warning" : "overdue" as const,
                },
              ].map((kpi, i) => (
                <div key={i} className={cn(
                  "rounded-lg p-3 border",
                  kpi.status === "nodata" ? "border-border/50 bg-muted/30" :
                  kpi.status === "ok" ? "border-primary/20 bg-primary/5" :
                  kpi.status === "warning" ? "border-warning/30 bg-warning/5" :
                  "border-destructive/30 bg-destructive/5"
                )}>
                  <div className="flex items-center gap-1.5 mb-2">
                    {kpi.status === "nodata" ? <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" /> :
                     kpi.status === "ok" ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> :
                     kpi.status === "warning" ? <Clock className="h-3.5 w-3.5 text-warning" /> :
                     <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{kpi.label}</span>
                  </div>
                  <p className={cn("text-2xl font-bold tabular-nums", kpi.status === "nodata" ? "text-muted-foreground" : "text-foreground")}>{kpi.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{kpi.sub}</p>
                </div>
              ))}
            </div>

            {slaData.etapaSLA.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-medium">SLA por Etapa do Funil</p>
                <div className="space-y-2">
                  {slaData.etapaSLA.map((e, i) => {
                    const hasData = e.comDados > 0;
                    const status = !hasData ? "nodata" : e.media <= e.maxDias * 0.6 ? "ok" : e.media <= e.maxDias ? "warning" : "overdue";
                    const pct = hasData ? Math.min((e.media / e.maxDias) * 100, 150) : 0;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-32 text-[11px] text-muted-foreground truncate">{e.label}</span>
                        <div className="flex-1 h-5 rounded bg-secondary/50 overflow-hidden relative">
                          {hasData && (
                            <div
                              className={cn(
                                "h-full rounded transition-all duration-700",
                                status === "ok" ? "bg-primary/60" : status === "warning" ? "bg-warning/60" : "bg-destructive/60"
                              )}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          )}
                          <div className="absolute top-0 h-full w-px bg-foreground/30" style={{ left: `${Math.min((e.maxDias / (e.maxDias * 1.5)) * 100, 100)}%` }} />
                        </div>
                        <span className={cn("text-xs font-bold w-12 text-right tabular-nums",
                          !hasData ? "text-muted-foreground" :
                          status === "ok" ? "text-primary" : status === "warning" ? "text-warning" : "text-destructive")}>
                          {hasData ? `${e.media}d` : "—"}
                        </span>
                        <span className="text-[10px] text-muted-foreground w-16 text-right">SLA: {e.maxDias}d</span>
                        {e.foraDoSLA > 0 && <span className="text-[10px] font-semibold text-destructive w-12 text-right">{e.foraDoSLA} fora</span>}
                        {e.semData > 0 && <span className="text-[10px] text-muted-foreground w-20 text-right" title="Leads sem data_entrada no DS">⚠ {e.semData} s/ data</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ══════ Robôs & Follow-up ══════ */}
        <section className="mt-6 rounded-xl border border-primary/20 bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border/40 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground tracking-tight">Robôs & Follow-up</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sol · FUP Frio · Conversão</p>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {/* Comparativo de Robôs */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-medium flex items-center gap-1.5">
                <Zap className="h-3 w-3" /> Comparativo de Robôs
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {robotData.robots.map((robot, i) => (
                  <div key={i} className="rounded-lg border border-border/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base">{robot.icon}</span>
                      <span className="text-xs font-semibold text-foreground">{robot.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Contatos</p>
                        <p className="text-xl font-bold text-foreground tabular-nums">{robot.total}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Taxa Resp.</p>
                        <p className={cn("text-xl font-bold tabular-nums", robot.taxa >= 30 ? "text-primary" : robot.taxa >= 15 ? "text-warning" : robot.total === 0 ? "text-muted-foreground" : "text-destructive")}>
                          {robot.total > 0 ? `${robot.taxa.toFixed(0)}%` : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Tempo Méd.</p>
                        <p className="text-xl font-bold text-foreground tabular-nums">
                          {robot.tempoMedio > 0 ? `${robot.tempoMedio.toFixed(1)}h` : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                      <div className="h-full rounded-full bg-primary/60 transition-all duration-700" style={{ width: `${Math.min(robot.taxa, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Acompanhamento */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-medium flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3" /> Acompanhamento Ativo
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase">Média FUPs/Lead</p>
                  <p className="text-2xl font-bold text-foreground tabular-nums">{robotData.mediaFups.toFixed(1)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{robotData.fupEntries} leads</p>
                </div>
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase">FUPs até Resposta</p>
                  <p className="text-2xl font-bold text-primary tabular-nums">{robotData.mediaFupsAteResp.toFixed(1)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{robotData.respondidosCount} responderam</p>
                </div>
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase">Excesso (+5 FUPs)</p>
                  <p className={cn("text-2xl font-bold tabular-nums", robotData.excessoFups === 0 ? "text-primary" : "text-warning")}>
                    {robotData.excessoFups === 0 ? "✓" : robotData.excessoFups}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">{robotData.excessoFups === 0 ? "Nenhum excesso" : "sem resposta"}</p>
                </div>
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase">Taxa Conversão FUP</p>
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {robotData.fupEntries > 0 ? ((robotData.respondidosCount / robotData.fupEntries) * 100).toFixed(0) : 0}%
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">leads que responderam</p>
                </div>
              </div>
            </div>

            {/* Funil de Conversão dos Robôs */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-medium flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" /> Funil de Conversão dos Robôs
              </p>
              <div className="space-y-2">
                {[
                  { label: "Enviados", value: robotData.totalEnviados, color: "bg-primary/40" },
                  { label: "Responderam", value: robotData.totalResponderam, color: "bg-primary/60" },
                  { label: "Qualificados", value: robotData.qualificados, color: "bg-primary/80" },
                ].map((step, i, arr) => {
                  const max = Math.max(...arr.map(s => s.value), 1);
                  const pct = (step.value / max) * 100;
                  const prevValue = i > 0 ? arr[i - 1].value : step.value;
                  const convRate = prevValue > 0 && i > 0 ? ((step.value / prevValue) * 100).toFixed(0) : null;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-24 text-[11px] text-muted-foreground">{step.label}</span>
                      <div className="flex-1 h-6 rounded bg-secondary/40 overflow-hidden">
                        <div className={cn("h-full rounded transition-all duration-700", step.color)} style={{ width: `${Math.max(pct, 2)}%` }} />
                      </div>
                      <span className="text-xs font-bold text-foreground w-10 text-right tabular-nums">{step.value}</span>
                      {convRate && <span className="text-[10px] text-muted-foreground w-14 text-right">{convRate}%</span>}
                    </div>
                  );
                })}
              </div>
            </div>
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
                  {["Nome", "Telefone", "Canal", "Etapa", "Status", "Temp.", "Score", "Msgs IA", "Closer", "FUP", "Data"].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableLeads.map((r, i) => {
                  const isExpanded = expandedLead === (r.telefone + i);
                  const closer = normalizeCloser(r.closerAtribuido);
                  return (
                    <>
                      <tr
                        key={r.telefone + i}
                        className="border-b border-border/20 transition-colors hover:bg-secondary/30 cursor-pointer"
                        onClick={() => setDrawerLead(r)}
                      >
                        <td className="px-3 py-2.5 font-medium text-foreground text-xs">
                          <div className="flex items-center gap-1.5">
                            {r.nome || '—'}
                            {r.dsSource === 'sol_leads' && <span className="text-[9px] bg-primary/10 text-primary px-1 rounded">v2</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground text-xs font-mono">{r.telefone || '—'}</td>
                        <td className="px-3 py-2.5"><CanalOrigemBadge canal={r.canalOrigem} /></td>
                        <td className="px-3 py-2.5">
                          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded", getEtapaLabel(r) === "SEM ETAPA" ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary")}>
                            {getEtapaLabel(r)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.makeStatus || '—'}</td>
                        <td className="px-3 py-2.5"><TemperatureBadge temperatura={r.makeTemperatura} /></td>
                        <td className="px-3 py-2.5 text-xs font-semibold text-foreground tabular-nums">
                          {r.makeScore && parseFloat(r.makeScore) > 0 ? parseFloat(r.makeScore).toFixed(1) : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground tabular-nums">{r.totalMensagensIa || '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">{closer || '—'}</td>
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
                          <td colSpan={11} className="px-6 py-4 bg-secondary/20">
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
          {filtered.length > tableLimit && (
            <div className="px-5 py-3 border-t border-border/40 text-center">
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setTableLimit(prev => prev + 50)}>
                Carregar mais ({filtered.length - tableLimit} restantes)
              </Button>
            </div>
          )}
        </section>

        {/* ══════ Temperatura por Etapa ══════ */}
        <section className="mt-6">
          <div className="rounded-lg border border-border/50 bg-card p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Temperatura por Etapa</h3>
            <div className="space-y-3">
              {JOURNEY_ORDER.map((etapa) => {
                const etapaRecords = filtered.filter(r => getEtapaLabel(r) === etapa);
                const quente = etapaRecords.filter(r => normalizeTemp(r.makeTemperatura) === "QUENTE").length;
                const morno = etapaRecords.filter(r => normalizeTemp(r.makeTemperatura) === "MORNO").length;
                const frio = etapaRecords.filter(r => normalizeTemp(r.makeTemperatura) === "FRIO").length;
                const total = etapaRecords.length;
                if (total === 0) return null;
                return (
                  <div key={etapa}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-muted-foreground truncate w-40">{etapa}</span>
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
            Sol Estrateg.IA × Leads
          </p>
        </footer>

        {/* ══════ Lead Detail Drawer ══════ */}
        <LeadDetailDrawer
          lead={drawerLead as any}
          open={!!drawerLead}
          onClose={() => setDrawerLead(null)}
          onQualificar={(l: any) => {
            solActions.qualificar.mutate({
              telefone: l.telefone,
              chat_id: l.chat_id || "",
              contact_id: l.contact_id || "",
              nome: l.nome,
              score: l.score || undefined,
              valor_conta: l.valor_conta,
            });
          }}
          onDesqualificar={(l: any) => {
            solActions.desqualificar.mutate({
              telefone: l.telefone,
              chatId: l.chatId || l.chat_id || "",
              nome: l.nome,
            });
          }}
          onReprocessar={(l: any) => {
            solActions.reprocessar.mutate({ telefone: l.telefone });
          }}
          actionsLoading={solActions.isLoading}
        />
      </div>
    </div>
  );
}
