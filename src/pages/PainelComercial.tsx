import { useState, useMemo } from "react";
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
  MessageSquare,
  Flame,
  Thermometer,
  CalendarCheck,
  Eye,
  ChevronRight,
  Send,
  RefreshCcw,
  Zap,
} from "lucide-react";
import { useLead360 } from "@/contexts/Lead360Context";
import { useMakeDataStore, MakeRecord } from "@/hooks/useMakeDataStore";
import { useOrgFilteredProposals } from "@/hooks/useOrgFilteredProposals";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { getForecastData } from "@/data/dataAdapter";
import { usePageFilters, PageFloatingFilter } from "@/components/filters/PageFloatingFilter";

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
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  info: "bg-primary/15 text-primary border-primary/30",
};
const severityBadge: Record<Severity, "destructive" | "secondary" | "outline"> = {
  critical: "destructive",
  warning: "secondary",
  info: "outline",
};

const tempColor = (t: string) =>
  t === "QUENTE" ? "text-red-400" : t === "MORNO" ? "text-yellow-400" : "text-blue-400";

const prioridadeBadge = (p: string): "destructive" | "secondary" | "outline" =>
  p === "alta" ? "destructive" : p === "media" ? "secondary" : "outline";

const reportIcon = (tipo: string) => {
  switch (tipo) { case "executivo": return "☀️"; case "closer": return "📊"; case "robos": return "🤖"; case "campanha": return "📣"; default: return "📄"; }
};

function getPrioridade(r: MakeRecord): string {
  const score = parseInt(r.makeScore || "0") || 0;
  if (score >= 70 || r.makeTemperatura === "QUENTE") return "alta";
  if (score >= 40 || r.makeTemperatura === "MORNO") return "media";
  return "baixa";
}

function getEtapa(r: MakeRecord): string {
  const s = (r.makeStatus || "").toUpperCase();
  if (s === "QUALIFICADO") return "Qualificado";
  if (s === "WHATSAPP") return "Em Qualificação";
  if (s === "DESQUALIFICADO") return "Desqualificado";
  if (s === "AGENDAMENTO" || s === "AGENDADO") return "Agendamento";
  if (s === "PROPOSTA") return "Proposta Enviada";
  if (s === "NEGOCIACAO") return "Negociação";
  return s || "Novo";
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

function deriveAlerts(records: MakeRecord[]): Alert[] {
  const alerts: Alert[] = [];
  let id = 0;

  // Detect duplicates by phone
  const phoneCount = new Map<string, MakeRecord[]>();
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
    const score = parseInt(r.makeScore || "0") || 0;
    const temp = (r.makeTemperatura || "").toUpperCase();
    const status = (r.makeStatus || "").toUpperCase();

    if ((score >= 70 || temp === "QUENTE") && status !== "QUALIFICADO" && status !== "AGENDAMENTO") {
      alerts.push({
        id: `quente-${id++}`,
        tipo: "quente",
        label: "Lead Quente s/ Agend.",
        desc: `${r.nome || r.telefone} — Score ${score}, ${temp}`,
        severity: "warning",
        time: timeSince(r.data_envio),
        leadData: {
          nome: r.nome || `Lead ...${r.telefone.slice(-4)}`,
          telefone: r.telefone,
          score,
          temp: temp || "MORNO",
          etapa: getEtapa(r),
          valor: r.valorConta ? `R$ ${r.valorConta}` : "—",
        },
      });
    }

    // FUP reactivated
    if (r.followupCount && r.followupCount >= 1 && r.status_resposta === "respondeu") {
      alerts.push({
        id: `fup-${id++}`,
        tipo: "fup",
        label: "FUP Reativado",
        desc: `${r.nome || r.telefone} respondeu no FUP #${r.followupCount}`,
        severity: "info",
        time: timeSince(r.data_resposta || r.data_envio),
        leadData: {
          nome: r.nome || `Lead ...${r.telefone.slice(-4)}`,
          telefone: r.telefone,
          score: parseInt(r.makeScore || "0") || 0,
          temp: (r.makeTemperatura || "MORNO").toUpperCase(),
          etapa: getEtapa(r),
          valor: r.valorConta ? `R$ ${r.valorConta}` : "—",
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
}

interface CloserGroup {
  nome: string;
  leads: CloserLead[];
  stats: { count: number; avgScore: number };
}

function deriveCloserQueue(records: MakeRecord[]): CloserGroup[] {
  // Group qualified/engaged leads by temperature bucket
  const qualified = records.filter((r) => {
    const s = (r.makeStatus || "").toUpperCase();
    return s === "QUALIFICADO" || s === "WHATSAPP" || s === "AGENDAMENTO" || s === "PROPOSTA" || s === "NEGOCIACAO";
  });

  const groups: Record<string, CloserLead[]> = { "Quentes": [], "Mornos": [], "Frios": [] };
  qualified.forEach((r) => {
    const temp = (r.makeTemperatura || "").toUpperCase();
    const score = parseInt(r.makeScore || "0") || 0;
    const lead: CloserLead = {
      nome: r.nome || `Lead ...${r.telefone.slice(-4)}`,
      score,
      temp: temp || "MORNO",
      etapa: getEtapa(r),
      valor: r.valorConta ? `R$ ${r.valorConta}` : "—",
      prioridade: getPrioridade(r),
      telefone: r.telefone,
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

function deriveSummary(records: MakeRecord[]) {
  const total = records.length;
  const qualificados = records.filter((r) => (r.makeStatus || "").toUpperCase() === "QUALIFICADO").length;
  const responderam = records.filter((r) => r.status_resposta === "respondeu").length;
  const fupAtivos = records.filter((r) => (r.followupCount || 0) >= 1).length;
  const scores = records.map((r) => parseInt(r.makeScore || "0") || 0).filter((s) => s > 0);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const quentes = records.filter((r) => (r.makeTemperatura || "").toUpperCase() === "QUENTE").length;
  const mornos = records.filter((r) => (r.makeTemperatura || "").toUpperCase() === "MORNO").length;
  const frios = records.filter((r) => (r.makeTemperatura || "").toUpperCase() === "FRIO").length;

  return { total, qualificados, responderam, fupAtivos, avgScore, quentes, mornos, frios };
}

/* ── report history mock (these come from Make, not DS) ── */

const mensagensReports = [
  { id: 1, tipo: "executivo", titulo: "Relatório Executivo Diário", enviadoPara: "Diretoria", data: "16/03/2026 07:00", status: "enviado" },
  { id: 2, tipo: "closer", titulo: "Performance por Closer", enviadoPara: "Gerente Comercial", data: "16/03/2026 07:05", status: "enviado" },
  { id: 3, tipo: "robos", titulo: "Relatório dos Robôs", enviadoPara: "Gerente + Diretor", data: "16/03/2026 07:10", status: "enviado" },
  { id: 4, tipo: "campanha", titulo: "Campanha + Insights", enviadoPara: "Diretoria + MKT", data: "10/03/2026 08:00", status: "enviado" },
  { id: 5, tipo: "executivo", titulo: "Relatório Executivo Diário", enviadoPara: "Diretoria", data: "15/03/2026 07:00", status: "enviado" },
  { id: 6, tipo: "robos", titulo: "Relatório dos Robôs", enviadoPara: "Gerente + Diretor", data: "15/03/2026 07:10", status: "falhou" },
];

/* ── component ─────────────────────────────────────────── */

export default function PainelComercial() {
  const [tab, setTab] = useState("painel");
  const { openLead360 } = useLead360();
  const { data: makeRecords, isLoading, forceSync } = useMakeDataStore();
  const { proposals, orgFilterActive } = useOrgFilteredProposals();
  const { selectedOrgName } = useOrgFilter();

  const allRecords = makeRecords || [];
  const pf = usePageFilters({ showPeriodo: true, showTemperatura: true, showSearch: true });
  const records = useMemo(() => pf.filterRecords(allRecords), [allRecords, pf.filterRecords]);

  const alerts = useMemo(() => deriveAlerts(records), [records]);
  const closerQueue = useMemo(() => deriveCloserQueue(records), [records]);
  const summary = useMemo(() => deriveSummary(records), [records]);
  const forecastData = useMemo(() => proposals.length > 0 ? getForecastData(proposals) : null, [proposals]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Zap className="h-6 w-6 text-warning" />
            Painel Comercial
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Visão operacional em tempo real — alertas, fila e ações</p>
        </div>
        <div className="flex items-center gap-2">
          {orgFilterActive && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
              🏢 {selectedOrgName}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse inline-block" />
            {records.length} leads carregados
          </Badge>
          <Button variant="outline" size="sm" onClick={() => forceSync()}>
            <RefreshCcw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
        </div>
      </div>

      <PageFloatingFilter
        filters={pf.filters} hasFilters={pf.hasFilters} clearFilters={pf.clearFilters}
        setPeriodo={pf.setPeriodo} setDateFrom={pf.setDateFrom} setDateTo={pf.setDateTo}
        setTemperatura={pf.setTemperatura} setSearchTerm={pf.setSearchTerm}
        config={{ showPeriodo: true, showTemperatura: true, showSearch: true }}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="painel">Painel</TabsTrigger>
          <TabsTrigger value="oportunidades">
            <TrendingUp className="h-4 w-4 mr-1" /> Oportunidades
          </TabsTrigger>
          <TabsTrigger value="mensagens">
            <MessageSquare className="h-4 w-4 mr-1" /> Central de Mensagens
          </TabsTrigger>
        </TabsList>

        {/* ── PAINEL ──────────────────────────────── */}
        <TabsContent value="painel" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}><CardContent className="p-6"><Skeleton className="h-[500px] w-full" /></CardContent></Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Col 1 — Alertas Urgentes */}
              <Card className="border-destructive/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Alertas Urgentes
                    <Badge variant="destructive" className="ml-auto">{alerts.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[520px]">
                    <div className="space-y-2 px-4 pb-4">
                      {alerts.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-8">Nenhum alerta no momento ✅</p>
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
                          className={`w-full text-left rounded-lg border p-3 ${severityStyles[a.severity]} transition-colors ${a.leadData ? "cursor-pointer hover:opacity-80" : ""}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant={severityBadge[a.severity]} className="text-[10px]">{a.label}</Badge>
                            {a.time && <span className="text-[10px] opacity-70">{a.time}</span>}
                          </div>
                          <p className="text-xs leading-relaxed">{a.desc}</p>
                          {a.leadData && (
                            <p className="text-[9px] mt-1 opacity-60">Clique para abrir detalhes →</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Col 2 — Fila do Closer */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Fila do Closer
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[520px]">
                    <div className="space-y-4 px-4 pb-4">
                      {closerQueue.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-8">Nenhum lead qualificado na fila</p>
                      )}
                      {closerQueue.map((c) => (
                        <div key={c.nome} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-foreground">{c.nome}</span>
                            <div className="flex gap-2 text-[10px] text-muted-foreground">
                              <span>{c.stats.count} leads</span>
                              <span>Score ∅ {c.stats.avgScore}</span>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            {c.leads.map((l, i) => (
                              <button
                                key={`${l.telefone}-${i}`}
                                onClick={() => handleOpenLead(l)}
                                className="w-full flex items-center gap-2 rounded-md border border-border/50 bg-card p-2 text-left hover:bg-secondary/50 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-medium truncate">{l.nome}</span>
                                    <Badge variant={prioridadeBadge(l.prioridade)} className="text-[9px] h-4 px-1">{l.prioridade}</Badge>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                                    <span className={tempColor(l.temp)}>{l.temp}</span>
                                    <span>Score {l.score}</span>
                                    <span className="truncate">{l.etapa}</span>
                                  </div>
                                </div>
                                <span className="text-xs font-semibold text-foreground whitespace-nowrap">{l.valor}</span>
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Resumo Geral
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[520px]">
                    <div className="px-4 pb-4 space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Total Leads", value: summary.total, icon: Flame },
                          { label: "Qualificados", value: summary.qualificados, icon: Thermometer },
                          { label: "Responderam", value: summary.responderam, icon: CalendarCheck },
                          { label: "FUP Ativos", value: summary.fupAtivos, icon: Send },
                          { label: "Score ∅", value: summary.avgScore, icon: Zap },
                          { label: "Quentes", value: summary.quentes, icon: Flame },
                        ].map((k) => (
                          <div key={k.label} className="rounded-lg border border-border/50 bg-secondary/30 p-2 text-center">
                            <k.icon className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-0.5" />
                            <div className="text-lg font-bold text-foreground">{k.value}</div>
                            <div className="text-[10px] text-muted-foreground">{k.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Temperature breakdown */}
                      <div className="rounded-lg border border-border/50 p-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Distribuição de Temperatura</p>
                        <div className="flex gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                            <span className="text-xs text-foreground">{summary.quentes} Quentes</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                            <span className="text-xs text-foreground">{summary.mornos} Mornos</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                            <span className="text-xs text-foreground">{summary.frios} Frios</span>
                          </div>
                        </div>
                        {summary.total > 0 && (
                          <div className="flex h-2 rounded-full overflow-hidden mt-2 bg-secondary">
                            <div className="bg-red-400" style={{ width: `${(summary.quentes / summary.total) * 100}%` }} />
                            <div className="bg-yellow-400" style={{ width: `${(summary.mornos / summary.total) * 100}%` }} />
                            <div className="bg-blue-400" style={{ width: `${(summary.frios / summary.total) * 100}%` }} />
                          </div>
                        )}
                      </div>

                      {/* Status breakdown */}
                      <div className="rounded-lg border border-border/50 p-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Engajamento</p>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Responderam</span>
                            <span className="text-foreground font-medium">
                              {summary.responderam} ({summary.total ? Math.round((summary.responderam / summary.total) * 100) : 0}%)
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Qualificados</span>
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
            <Card className="border-chart-3/30">
              <CardHeader>
                <CardTitle className="text-chart-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Alta Probabilidade (≥70%)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {!forecastData || forecastData.altaProbabilidade.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8 text-sm">
                        Nenhuma proposta com alta probabilidade
                      </p>
                    ) : (
                      forecastData.altaProbabilidade.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors">
                          <div>
                            <p className="font-medium text-foreground text-sm">{p.nomeCliente}</p>
                            <p className="text-xs text-muted-foreground">{p.etapa} • {p.representante || '—'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-chart-3">{formatCurrencyAbbrev(p.valorProposta)}</p>
                            <p className="text-xs text-muted-foreground">{p.probabilidade}%</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Em Risco */}
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Propostas em Risco
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {!forecastData || forecastData.emRisco.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8 text-sm">
                        Nenhuma proposta em risco identificada
                      </p>
                    ) : (
                      forecastData.emRisco.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20 hover:bg-destructive/15 transition-colors">
                          <div>
                            <p className="font-medium text-foreground text-sm">{p.nomeCliente}</p>
                            <p className="text-xs text-muted-foreground">{p.etapa} • {p.tempoNaEtapa} dias parado</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-destructive">{formatCurrencyAbbrev(p.valorProposta)}</p>
                            <p className="text-xs text-muted-foreground">{p.probabilidade}%</p>
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

        {/* ── CENTRAL DE MENSAGENS ────────────────── */}
        <TabsContent value="mensagens" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Histórico de Reports Enviados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mensagensReports.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-secondary/30 transition-colors">
                    <span className="text-xl">{reportIcon(m.tipo)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{m.titulo}</span>
                        {m.status === "falhou" && <Badge variant="destructive" className="text-[9px]">Falhou</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span>Para: {m.enviadoPara}</span>
                        <span>•</span>
                        <span>{m.data}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0">
                      <Eye className="h-4 w-4 mr-1" /> Ver
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
