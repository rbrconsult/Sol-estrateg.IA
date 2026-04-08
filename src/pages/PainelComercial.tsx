import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrencyAbbrev } from "@/lib/formatters";
import {
  AlertTriangle,
  Users,
  TrendingUp,
  Flame,
  Thermometer,
  CalendarCheck,
  Send,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { useLead360 } from "@/contexts/Lead360Context";
import { useSolLeads, type SolLead } from '@/hooks/useSolData';
import { useCommercialProposals } from "@/hooks/useCommercialProposals";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { getForecastData } from "@/data/dataAdapter";
import { PageFloatingFilter } from "@/components/filters/PageFloatingFilter";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { DataTrustFooter } from "@/components/metrics/DataTrustFooter";
import { JOURNEY_ORDER } from "@/lib/leads-utils";

/* ── helpers ───────────────────────────────────────────── */

type Severity = "critical" | "warning" | "info";

interface Alert {
  id: string;
  tipo: string;
  label: string;
  desc: string;
  severity: Severity;
  time: string;
  leadData?: { nome: string; telefone: string; score: number; temp: string; etapa: string; valor: string };
}

const severityStyles: Record<Severity, string> = {
  critical: "border-destructive/25 bg-destructive/5 text-foreground",
  warning: "border-warning/25 bg-warning/5 text-foreground",
  info: "border-info/25 bg-info/5 text-foreground",
};
const severityBadge: Record<Severity, "destructive" | "secondary" | "outline"> = {
  critical: "destructive",
  warning: "secondary",
  info: "outline",
};

const panelCardClass = "overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-sm";
const metricTileClass = "rounded-xl border border-border/50 bg-background/60 p-3";

const tempColor = (t: string) =>
  t === "QUENTE" ? "text-destructive" : t === "MORNO" ? "text-warning" : "text-info";

const prioridadeBadge = (p: string): "destructive" | "secondary" | "outline" =>
  p === "alta" ? "destructive" : p === "media" ? "secondary" : "outline";

function getPrioridade(r: SolLead): string {
  const score = parseInt(r.score || "0") || 0;
  if (score >= 70 || r.temperatura === "QUENTE") return "alta";
  if (score >= 40 || r.temperatura === "MORNO") return "media";
  return "baixa";
}

function getEtapa(r: SolLead): string {
  const etapa = (r.etapa_funil || "").toUpperCase().trim();
  const s = (r.status || "").toUpperCase();
  if (etapa === 'QUALIFICADO') return "Qualificado";
  if (etapa === 'SOL SDR') return "Em Qualificação";
  if (etapa.includes('DECL')) return "Declínio";
  if (etapa === 'CONTATO REALIZADO') return "Contato Realizado";
  if (etapa === 'PROPOSTA') return "Proposta Enviada";
  if (etapa.includes('NEGOCI')) return "Negociação";
  if (etapa === 'TRAFEGO PAGO') return "Tráfego Pago";
  if (etapa === 'FOLLOW UP') return "Follow Up";
  return etapa || s || "Novo";
}

const INACTIVITY_RISK_MINUTES = 10;
const ACTIVE_FUNNEL_STAGES = JOURNEY_ORDER.filter((stage) => stage !== "DECLÍNIO");

function isInactive(dateStr: string | null | undefined): boolean {
  if (!dateStr) return true;
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff > INACTIVITY_RISK_MINUTES * 60 * 1000;
}

function inactivityMinutes(dateStr: string | null | undefined): number {
  if (!dateStr) return 9999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

function timeSince(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `há ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  return `há ${Math.floor(hrs / 24)}d`;
}

/* ── derive alerts from Make data ─────────────────────── */

function deriveAlerts(records: SolLead[]): Alert[] {
  const alerts: Alert[] = [];
  let id = 0;

  // Detect duplicates by phone
  const phoneCount = new Map<string, SolLead[]>();
  records.forEach((r) => {
    if (!r.telefone) return;
    const arr = phoneCount.get(r.telefone) || [];
    arr.push(r);
    phoneCount.set(r.telefone, arr);
  });
  phoneCount.forEach((recs, phone) => {
    if (recs.length >= 2) {
      alerts.push({
        id: `dup-${id++}`,
        tipo: "dup",
        label: "Duplicata",
        desc: `${phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")} aparece em ${recs.length} registros`,
        severity: "warning",
        time: "",
      });
    }
  });

  // Hot leads without recent activity
  records.forEach((r) => {
    const score = parseInt(r.score || "0") || 0;
    const temp = (r.temperatura || "").toUpperCase();
    const status = (r.status || "").toUpperCase();

    // ⚠️ Inactivity risk: any lead inactive >10min that is still in-progress
    if (ACTIVE_FUNNEL_STAGES.includes((r.etapa_funil || '').toUpperCase().trim()) && isInactive(r.ts_ultima_interacao)) {
      const mins = inactivityMinutes(r.ts_ultima_interacao);
      const label = mins >= 60 ? `${Math.floor(mins / 60)}h${mins % 60}min inativo` : `${mins}min inativo`;
      alerts.push({
        id: `inativo-${id++}`,
        tipo: "inativo",
        label: "⏰ Risco Inatividade",
        desc: `${r.nome || r.telefone} — ${label} sem interação`,
        severity: mins >= 60 ? "critical" : "warning",
        time: timeSince(r.ts_ultima_interacao || r.ts_cadastro || ""),
        leadData: {
          nome: r.nome || `Lead ...${r.telefone.slice(-4)}`,
          telefone: r.telefone,
          score,
          temp: temp || "MORNO",
          etapa: getEtapa(r),
          valor: r.valor_conta ? `R$ ${r.valor_conta}` : "—",
        },
      });
    }

    if ((score >= 70 || temp === "QUENTE") && status !== "QUALIFICADO" && status !== "AGENDAMENTO") {
      alerts.push({
        id: `quente-${id++}`,
        tipo: "quente",
        label: "Lead Quente s/ Agend.",
        desc: `${r.nome || r.telefone} — Score ${score}, ${temp}`,
        severity: "warning",
        time: timeSince(r.ts_cadastro),
        leadData: {
          nome: r.nome || `Lead ...${r.telefone.slice(-4)}`,
          telefone: r.telefone,
          score,
          temp: temp || "MORNO",
          etapa: getEtapa(r),
          valor: r.valor_conta ? `R$ ${r.valor_conta}` : "—",
        },
      });
    }

    // FUP reactivated
    if (r.fup_followup_count && r.fup_followup_count >= 1 && ((r as any)._status_resposta || '') === "respondeu") {
      alerts.push({
        id: `fup-${id++}`,
        tipo: "fup",
        label: "FUP Reativado",
        desc: `${r.nome || r.telefone} respondeu no FUP #${r.fup_followup_count}`,
        severity: "info",
        time: timeSince(r.ts_ultima_interacao || r.ts_cadastro),
        leadData: {
          nome: r.nome || `Lead ...${r.telefone.slice(-4)}`,
          telefone: r.telefone,
          score: parseInt(r.score || "0") || 0,
          temp: (r.temperatura || "MORNO").toUpperCase(),
          etapa: getEtapa(r),
          valor: r.valor_conta ? `R$ ${r.valor_conta}` : "—",
        },
      });
    }
  });

  // Sort: critical first, then warning, then info
  const order: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => order[a.severity] - order[b.severity]);
  return alerts.slice(0, 20);
}

/* ── derive closer queue (group by status for now) ────── */

interface CloserLead {
  nome: string;
  score: number;
  temp: string;
  etapa: string;
  valor: string;
  prioridade: string;
  telefone: string;
  tsUltimaInteracao: string | null;
  tsTransferido: string | null;
}

interface CloserGroup {
  nome: string;
  leads: CloserLead[];
  stats: { count: number; avgScore: number };
}

function deriveCloserQueue(records: SolLead[]): CloserGroup[] {
  // Group qualified/engaged leads by temperature bucket
  const qualified = records.filter((r) => {
    const s = (r.status || "").toUpperCase();
    return s === "QUALIFICADO" || s === "WHATSAPP" || s === "AGENDAMENTO" || s === "PROPOSTA" || s === "NEGOCIACAO";
  });

  const groups: Record<string, CloserLead[]> = { "Quentes": [], "Mornos": [], "Frios": [] };
  qualified.forEach((r) => {
    const temp = (r.temperatura || "").toUpperCase();
    const score = parseInt(r.score || "0") || 0;
    const lead: CloserLead = {
      nome: r.nome || `Lead ...${r.telefone.slice(-4)}`,
      score,
      temp: temp || "MORNO",
      etapa: getEtapa(r),
      valor: r.valor_conta ? `R$ ${r.valor_conta}` : "—",
      prioridade: getPrioridade(r),
      telefone: r.telefone,
      tsUltimaInteracao: r.ts_ultima_interacao || null,
      tsTransferido: r.ts_transferido || null,
    };
    if (temp === "QUENTE") groups["Quentes"].push(lead);
    else if (temp === "FRIO") groups["Frios"].push(lead);
    else groups["Mornos"].push(lead);
  });

  // Sort each group by score desc
  Object.values(groups).forEach((g) => g.sort((a, b) => b.score - a.score));

  return Object.entries(groups)
    .filter(([, leads]) => leads.length > 0)
    .map(([nome, leads]) => ({
      nome,
      leads: leads.slice(0, 8),
      stats: {
        count: leads.length,
        avgScore: leads.length ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) : 0,
      },
    }));
}

/* ── derive daily summary ─────────────────────────────── */

function deriveSummary(records: SolLead[]) {
  const total = records.length;
  const qualificados = records.filter((r) => (r.status || "").toUpperCase() === "QUALIFICADO").length;
  const responderam = records.filter((r) => ((r as any)._status_resposta || '') === "respondeu").length;
  const fupAtivos = records.filter((r) => (r.fup_followup_count || 0) >= 1).length;
  const scores = records.map((r) => parseInt(r.score || "0") || 0).filter((s) => s > 0);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const quentes = records.filter((r) => (r.temperatura || "").toUpperCase() === "QUENTE").length;
  const mornos = records.filter((r) => (r.temperatura || "").toUpperCase() === "MORNO").length;
  const frios = records.filter((r) => (r.temperatura || "").toUpperCase() === "FRIO").length;
  const emRiscoInatividade = records.filter((r) => {
    const etapa = (r.etapa_funil || "").toUpperCase().trim();
    return ACTIVE_FUNNEL_STAGES.includes(etapa) && isInactive(r.ts_ultima_interacao);
  }).length;

  return { total, qualificados, responderam, fupAtivos, avgScore, quentes, mornos, frios, emRiscoInatividade };
}


/* ── component ─────────────────────────────────────────── */

export default function PainelComercial() {
  const [tab, setTab] = useState("painel");
  const navigate = useNavigate();
  const { openLead360 } = useLead360();
  const { data: solLeads, isLoading, dataUpdatedAt: leadsDataUpdatedAt } = useSolLeads();

  const { proposals, dataUpdatedAt: projetosDataUpdatedAt } = useCommercialProposals();
  const { selectedOrgName, isGlobal } = useOrgFilter();
  const orgFilterActive = !isGlobal;

  const gf = useGlobalFilters();
  const records = useMemo(() => gf.filterRecords(solLeads || []), [solLeads, gf.filterRecords]);
  const filteredProposals = useMemo(() => gf.filterProposals(proposals || []), [proposals, gf.filterProposals]);

  const alerts = useMemo(() => deriveAlerts(records), [records]);
  const closerQueue = useMemo(() => deriveCloserQueue(records), [records]);
  const summary = useMemo(() => deriveSummary(records), [records]);
  const forecastData = useMemo(() => filteredProposals.length > 0 ? getForecastData(filteredProposals) : null, [filteredProposals]);

  const handleOpenLead = (lead: CloserLead) => {
    openLead360({
      nome: lead.nome,
      telefone: lead.telefone,
      etapa: lead.etapa,
      valor: lead.valor,
      responsavel: "",
      origem: "",
      temperatura: lead.temp,
      score: lead.score,
    } as any);
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/30 p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="w-fit border-primary/20 bg-primary/10 text-[10px] uppercase tracking-[0.18em] text-primary">
              Operação comercial
            </Badge>

            <div>
              <h1 className="flex items-center gap-3 text-2xl font-black tracking-tight text-foreground">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-warning/20 bg-warning/10 text-warning shadow-sm">
                  <Zap className="h-5 w-5" />
                </span>
                Painel Comercial
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Fila do closer, riscos de inatividade e oportunidades concentradas em uma visão mais limpa e objetiva.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/qualificacao")} className="gap-1.5 rounded-xl text-xs">
              <Sparkles className="h-3.5 w-3.5" /> Qualificar
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/reprocessamento")} className="gap-1.5 rounded-xl text-xs">
              <RotateCcw className="h-3.5 w-3.5" /> Reprocessar
            </Button>
            {orgFilterActive && (
              <Badge variant="outline" className="border-primary/20 bg-primary/10 text-xs text-primary">
                🏢 {selectedOrgName}
              </Badge>
            )}
            {summary.emRiscoInatividade > 0 && (
              <Badge variant="destructive" className="gap-1 text-xs animate-pulse">
                <Clock className="h-3 w-3" /> {summary.emRiscoInatividade} inativos
              </Badge>
            )}
            <Badge variant="outline" className="gap-1.5 text-xs">
              <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
              {records.length} leads carregados
            </Badge>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            { label: "Leads na base", value: summary.total, icon: Flame, tone: "text-primary bg-primary/10 border-primary/15" },
            { label: "SQL", value: summary.qualificados, icon: Thermometer, tone: "text-success bg-success/10 border-success/15" },
            { label: "FUP ativos", value: summary.fupAtivos, icon: Send, tone: "text-info bg-info/10 border-info/15" },
            { label: "Em risco", value: summary.emRiscoInatividade, icon: AlertTriangle, tone: "text-destructive bg-destructive/10 border-destructive/15" },
          ].map((item) => (
            <div key={item.label} className={`${metricTileClass} flex items-start gap-3`}>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.tone}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-2xl font-black leading-none text-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <PageFloatingFilter
        filters={gf.filters} hasFilters={gf.hasFilters} clearFilters={gf.clearFilters}
        setPeriodo={gf.setPeriodo} setDateFrom={gf.setDateFrom} setDateTo={gf.setDateTo}
        setTemperatura={gf.setTemperatura} setSearchTerm={gf.setSearchTerm} setEtapa={gf.setEtapa} setStatus={gf.setStatus}
        config={{ showPeriodo: true, showTemperatura: true, showSearch: true, showEtapa: true, showStatus: true }}
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-5">
        <TabsList className="grid h-auto w-full max-w-md grid-cols-2 rounded-2xl border border-border/60 bg-muted/40 p-1">
          <TabsTrigger value="painel" className="gap-2 rounded-xl px-3 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Zap className="h-3.5 w-3.5" /> Painel
          </TabsTrigger>
          <TabsTrigger value="oportunidades" className="gap-2 rounded-xl px-3 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <TrendingUp className="h-3.5 w-3.5" /> Oportunidades
          </TabsTrigger>
        </TabsList>

        {/* ── PAINEL ──────────────────────────────── */}
        <TabsContent value="painel" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className={panelCardClass}><CardContent className="p-6"><Skeleton className="h-[500px] w-full rounded-xl" /></CardContent></Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_1.2fr_0.9fr]">
              {/* Col 1 — Alertas Urgentes */}
              <Card className={panelCardClass}>
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Prioridade imediata</p>
                      <CardTitle className="mt-1 flex items-center gap-2 text-base">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Alertas Urgentes
                      </CardTitle>
                    </div>
                    <Badge variant="destructive">{alerts.length}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Leads e situações que pedem ação rápida da operação.</p>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[560px]">
                    <div className="space-y-3 px-4 pb-4">
                      {alerts.length === 0 && (
                        <div className="rounded-xl border border-border/50 bg-background/40 px-4 py-10 text-center text-xs text-muted-foreground">
                          Nenhum alerta no momento ✅
                        </div>
                      )}
                      {alerts.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => {
                            if (a.leadData) {
                              openLead360({
                                nome: a.leadData.nome,
                                telefone: a.leadData.telefone,
                                etapa: a.leadData.etapa,
                                valor: a.leadData.valor,
                                responsavel: "",
                                origem: "",
                                temperatura: a.leadData.temp,
                                score: a.leadData.score,
                              } as any);
                            }
                          }}
                          className={`w-full rounded-xl border px-3 py-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${severityStyles[a.severity]} ${a.leadData ? "cursor-pointer" : ""}`}
                        >
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <Badge variant={severityBadge[a.severity]} className="text-[10px]">{a.label}</Badge>
                            {a.time && <span className="text-[10px] text-muted-foreground">{a.time}</span>}
                          </div>
                          <p className="text-xs font-medium leading-relaxed text-foreground">{a.desc}</p>
                          {a.leadData && (
                            <div className="mt-2 flex items-center justify-between gap-3 border-t border-border/40 pt-2">
                              <span className="text-[10px] font-mono text-muted-foreground">{a.leadData.telefone.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4')}</span>
                              <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">Abrir lead</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Col 2 — Fila do Closer */}
              <Card className={panelCardClass}>
                <CardHeader className="space-y-3 pb-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Execução comercial</p>
                    <CardTitle className="mt-1 flex items-center gap-2 text-base">
                      <Users className="h-5 w-5 text-primary" />
                      Fila do Closer
                    </CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground">Agrupamento dos leads mais quentes para abordagem e fechamento.</p>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[560px]">
                    <div className="space-y-4 px-4 pb-4">
                      {closerQueue.length === 0 && (
                        <div className="rounded-xl border border-border/50 bg-background/40 px-4 py-10 text-center text-xs text-muted-foreground">
                          Nenhum lead qualificado na fila
                        </div>
                      )}
                      {closerQueue.map((c) => (
                        <div key={c.nome} className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-foreground">{c.nome}</span>
                            <div className="flex gap-2 text-[10px] text-muted-foreground">
                              <span>{c.stats.count} leads</span>
                              <span>Score ∅ {c.stats.avgScore}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {c.leads.map((l, i) => (
                              <button
                                key={`${l.telefone}-${i}`}
                                onClick={() => handleOpenLead(l)}
                                className={`w-full rounded-xl border px-3 py-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                                  isInactive(l.tsUltimaInteracao) ? "border-destructive/25 bg-destructive/5" : "border-border/50 bg-background/60"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm font-semibold truncate text-foreground">{l.nome}</span>
                                      <Badge variant={prioridadeBadge(l.prioridade)} className="text-[9px] h-4 px-1">{l.prioridade}</Badge>
                                      {isInactive(l.tsUltimaInteracao) && (
                                        <Badge variant="destructive" className="text-[8px] h-3.5 px-1 gap-0.5 animate-pulse">
                                          <Clock className="h-2.5 w-2.5" /> {inactivityMinutes(l.tsUltimaInteracao) >= 60 ? `${Math.floor(inactivityMinutes(l.tsUltimaInteracao) / 60)}h` : `${inactivityMinutes(l.tsUltimaInteracao)}m`}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
                                      <span className="font-mono">{l.telefone.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4')}</span>
                                      <span className={`${tempColor(l.temp)} font-semibold`}>{l.temp}</span>
                                      <span>Score {l.score}</span>
                                      <span className="truncate">{l.etapa}</span>
                                    </div>
                                  </div>
                                  <span className="whitespace-nowrap text-sm font-bold text-foreground">{l.valor}</span>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/40 pt-2 text-[9px] text-muted-foreground">
                                  <span className={isInactive(l.tsUltimaInteracao) ? "text-destructive font-semibold" : ""}>📩 Últ. interação: {l.tsUltimaInteracao ? new Date(l.tsUltimaInteracao).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                                  <span>📤 Transferido: {l.tsTransferido ? new Date(l.tsTransferido).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Col 3 — Resumo do Dia */}
              <Card className={panelCardClass}>
                <CardHeader className="space-y-3 pb-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Leitura rápida</p>
                    <CardTitle className="mt-1 flex items-center gap-2 text-base">
                      <TrendingUp className="h-5 w-5 text-success" />
                      Resumo Geral
                    </CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground">Indicadores rápidos para bater o olho e entender o momento da operação.</p>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[560px]">
                    <div className="px-4 pb-4 space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Leads Recebidos", value: summary.total, icon: Flame },
                          { label: "SQL", value: summary.qualificados, icon: Thermometer },
                          { label: "Responderam", value: summary.responderam, icon: CalendarCheck },
                          { label: "FUP Ativos", value: summary.fupAtivos, icon: Send },
                          { label: "Score ∅", value: summary.avgScore, icon: Zap },
                          { label: "⚠️ Em Risco", value: summary.emRiscoInatividade, icon: Clock },
                        ].map((k) => (
                          <div key={k.label} className="rounded-xl border border-border/50 bg-background/60 p-2.5 text-center">
                            <k.icon className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-0.5" />
                            <div className="text-lg font-bold text-foreground">{k.value}</div>
                            <div className="text-[10px] text-muted-foreground">{k.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Temperature breakdown */}
                      <div className="rounded-xl border border-border/50 bg-background/40 p-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Distribuição de Temperatura</p>
                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
                            <span className="text-xs text-foreground">{summary.quentes} Quentes</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                            <span className="text-xs text-foreground">{summary.mornos} Mornos</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-info" />
                            <span className="text-xs text-foreground">{summary.frios} Frios</span>
                          </div>
                        </div>
                        {summary.total > 0 && (
                          <div className="flex h-2 rounded-full overflow-hidden mt-2 bg-secondary">
                            <div className="bg-destructive" style={{ width: `${(summary.quentes / summary.total) * 100}%` }} />
                            <div className="bg-warning" style={{ width: `${(summary.mornos / summary.total) * 100}%` }} />
                            <div className="bg-info" style={{ width: `${(summary.frios / summary.total) * 100}%` }} />
                          </div>
                        )}
                      </div>

                      {/* Status breakdown */}
                      <div className="rounded-xl border border-border/50 bg-background/40 p-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Engajamento</p>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Responderam</span>
                            <span className="text-foreground font-medium">
                              {summary.responderam} ({summary.total ? Math.round((summary.responderam / summary.total) * 100) : 0}%)
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">SQL</span>
                            <span className="text-foreground font-medium">
                              {summary.qualificados} ({summary.total ? Math.round((summary.qualificados / summary.total) * 100) : 0}%)
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Em FUP</span>
                            <span className="text-foreground font-medium">{summary.fupAtivos}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ── OPORTUNIDADES ─────────────────────── */}
        <TabsContent value="oportunidades" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alta Probabilidade */}
            <Card className={panelCardClass}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-success/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-success" />
                  </div>
                  Alta Probabilidade
                  {forecastData && forecastData.altaProbabilidade.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{forecastData.altaProbabilidade.length}</Badge>
                  )}
                </CardTitle>
                <p className="text-[10px] text-muted-foreground">Etapas avançadas com ≥70% de chance de fechamento</p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[360px]">
                  <div className="space-y-2">
                    {!forecastData || forecastData.altaProbabilidade.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="h-12 w-12 rounded-full bg-success/5 flex items-center justify-center mb-3">
                          <TrendingUp className="h-6 w-6 text-success/30" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Sem propostas de alta probabilidade</p>
                        <p className="text-[11px] text-muted-foreground/70 mt-1 max-w-[200px]">Propostas em Negociação ou Proposta Enviada aparecerão aqui</p>
                      </div>
                    ) : (
                      forecastData.altaProbabilidade.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border/30 hover:border-success/30 hover:bg-success/5 transition-all cursor-pointer group">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground text-sm truncate group-hover:text-success transition-colors">{p.nomeCliente}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge variant="outline" className="text-[9px] h-4 px-1">{p.etapa}</Badge>
                              <span className="text-[10px] text-muted-foreground">{p.responsavel || p.representante || '—'}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <p className="font-bold text-success text-sm">{formatCurrencyAbbrev(p.valorProposta)}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{p.probabilidade}%</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Em Risco */}
            <Card className={panelCardClass}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </div>
                  Propostas em Risco
                  {forecastData && forecastData.emRisco.length > 0 && (
                    <Badge variant="destructive" className="text-[10px] h-4 px-1.5">{forecastData.emRisco.length}</Badge>
                  )}
                </CardTitle>
                <p className="text-[10px] text-muted-foreground">Paradas há +30 dias ou probabilidade abaixo de 30%</p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[360px]">
                  <div className="space-y-2">
                    {!forecastData || forecastData.emRisco.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="h-12 w-12 rounded-full bg-success/5 flex items-center justify-center mb-3">
                          <CheckCircle2 className="h-6 w-6 text-success/30" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Nenhuma proposta em risco</p>
                        <p className="text-[11px] text-muted-foreground/70 mt-1 max-w-[200px]">Pipeline saudável — sem negócios estagnados</p>
                      </div>
                    ) : (
                      forecastData.emRisco.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-all cursor-pointer group">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground text-sm truncate">{p.nomeCliente}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge variant="outline" className="text-[9px] h-4 px-1 border-destructive/20 text-destructive">{p.etapa}</Badge>
                              <span className="text-[10px] text-destructive/70 font-mono">{p.tempoNaEtapa}d parado</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <p className="font-bold text-destructive text-sm">{formatCurrencyAbbrev(p.valorProposta)}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{p.probabilidade}%</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>

      <DataTrustFooter
        lines={[
          {
            label: "Pré-venda / fila",
            source: "sol_projetos",
            fetchedAt: leadsDataUpdatedAt,
            extra: `${records.length} leads no filtro global`,
          },
          {
            label: "Oportunidades (SM)",
            source: "sol_propostas (dedupe)",
            fetchedAt: projetosDataUpdatedAt,
            extra: `${filteredProposals.length} projetos no filtro global`,
          },
        ]}
      />
    </div>
  );
}
