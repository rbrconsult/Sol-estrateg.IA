import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  Clock,
  Users,
  TrendingUp,
  MessageSquare,
  Flame,
  Thermometer,
  CalendarCheck,
  Phone,
  Eye,
  ChevronRight,
  Send,
  RefreshCcw,
  Zap,
} from "lucide-react";
import { useLead360 } from "@/contexts/Lead360Context";

/* ── mock data ─────────────────────────────────────────── */

const alertasUrgentes = [
  { id: 1, tipo: "sla", label: "SLA Estourado", desc: "Lead João Silva — Proposta há 12 dias (meta 7d)", severity: "critical" as const, time: "há 2h" },
  { id: 2, tipo: "sla", label: "SLA Estourado", desc: "Lead Maria Santos — Closer sem contato há 3h (meta 1h)", severity: "critical" as const, time: "há 45min" },
  { id: 3, tipo: "dup", label: "Duplicata", desc: "(19) 99812-3456 aparece em 3 projetos diferentes", severity: "warning" as const, time: "há 1h" },
  { id: 4, tipo: "quente", label: "Lead Quente s/ Agend.", desc: "Carlos Oliveira — Score 87, sem agendamento há 2 dias", severity: "warning" as const, time: "há 3h" },
  { id: 5, tipo: "fup", label: "FUP Reativado", desc: "Ana Costa reativou no D+7 — Encaminhar ao closer", severity: "info" as const, time: "há 30min" },
  { id: 6, tipo: "sla", label: "SLA Estourado", desc: "Lead Pedro Souza — Reunião → Proposta há 6h (meta 3h)", severity: "critical" as const, time: "há 1h" },
];

const closers = [
  {
    nome: "Ricardo Lima",
    leads: [
      { nome: "João Silva", score: 87, temp: "QUENTE", etapa: "Proposta Enviada", valor: "R$ 18.400", prioridade: "alta" },
      { nome: "Ana Costa", score: 72, temp: "MORNO", etapa: "Agendamento", valor: "R$ 12.300", prioridade: "media" },
      { nome: "Pedro Alves", score: 45, temp: "FRIO", etapa: "Qualificado", valor: "R$ 8.900", prioridade: "baixa" },
    ],
    stats: { conversao: 34, ticketMedio: "R$ 14.200", sla: "47min" },
  },
  {
    nome: "Fernanda Dias",
    leads: [
      { nome: "Maria Santos", score: 91, temp: "QUENTE", etapa: "Negociação", valor: "R$ 22.100", prioridade: "alta" },
      { nome: "Carlos Oliveira", score: 68, temp: "MORNO", etapa: "Reunião Marcada", valor: "R$ 15.600", prioridade: "media" },
    ],
    stats: { conversao: 41, ticketMedio: "R$ 18.800", sla: "32min" },
  },
  {
    nome: "Bruno Costa",
    leads: [
      { nome: "Lucia Ferreira", score: 55, temp: "MORNO", etapa: "Qualificado", valor: "R$ 9.700", prioridade: "media" },
      { nome: "Roberto Nunes", score: 38, temp: "FRIO", etapa: "Qualificado", valor: "R$ 7.200", prioridade: "baixa" },
      { nome: "Patrícia Lima", score: 82, temp: "QUENTE", etapa: "Proposta Enviada", valor: "R$ 19.500", prioridade: "alta" },
      { nome: "Marcos Souza", score: 61, temp: "MORNO", etapa: "Agendamento", valor: "R$ 11.400", prioridade: "media" },
    ],
    stats: { conversao: 28, ticketMedio: "R$ 11.900", sla: "58min" },
  },
];

const resumoDia = {
  leadsHoje: 14,
  qualificados: 5,
  agendamentos: 3,
  propostasEnviadas: 2,
  vendasFechadas: 1,
  faturamento: "R$ 18.400",
  taxaConversao: "29,6%",
  scoreMedia: 62,
  tempMedia: "MORNO",
  acoes: [
    { hora: "16:42", desc: "João Silva recebeu proposta — R$ 18.400", tipo: "proposta" },
    { hora: "15:18", desc: "Ana Costa reativou via FUP D+7", tipo: "fup" },
    { hora: "14:05", desc: "Maria Santos agendou reunião para 18/03", tipo: "agendamento" },
    { hora: "11:30", desc: "Carlos Oliveira qualificado — Score 87", tipo: "qualificacao" },
    { hora: "10:15", desc: "3 leads novos entraram via Meta Ads", tipo: "lead" },
    { hora: "09:02", desc: "Robô Sol iniciou 8 conversas", tipo: "robo" },
  ],
};

const mensagensReports = [
  { id: 1, tipo: "executivo", titulo: "Relatório Executivo Diário", enviadoPara: "Diretoria", data: "16/03/2026 07:00", status: "enviado" },
  { id: 2, tipo: "closer", titulo: "Performance por Closer", enviadoPara: "Gerente Comercial", data: "16/03/2026 07:05", status: "enviado" },
  { id: 3, tipo: "robos", titulo: "Relatório dos Robôs", enviadoPara: "Gerente + Diretor", data: "16/03/2026 07:10", status: "enviado" },
  { id: 4, tipo: "campanha", titulo: "Campanha + Insights", enviadoPara: "Diretoria + MKT", data: "10/03/2026 08:00", status: "enviado" },
  { id: 5, tipo: "executivo", titulo: "Relatório Executivo Diário", enviadoPara: "Diretoria", data: "15/03/2026 07:00", status: "enviado" },
  { id: 6, tipo: "robos", titulo: "Relatório dos Robôs", enviadoPara: "Gerente + Diretor", data: "15/03/2026 07:10", status: "falhou" },
];

/* ── helpers ───────────────────────────────────────────── */

const severityStyles = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  info: "bg-primary/15 text-primary border-primary/30",
};

const severityBadge = {
  critical: "destructive" as const,
  warning: "secondary" as const,
  info: "outline" as const,
};

const tempColor = (t: string) =>
  t === "QUENTE" ? "text-red-400" : t === "MORNO" ? "text-yellow-400" : "text-blue-400";

const prioridadeBadge = (p: string) =>
  p === "alta" ? "destructive" as const : p === "media" ? "secondary" as const : "outline" as const;

const reportIcon = (tipo: string) => {
  switch (tipo) {
    case "executivo": return "☀️";
    case "closer": return "📊";
    case "robos": return "🤖";
    case "campanha": return "📣";
    default: return "📄";
  }
};

/* ── component ─────────────────────────────────────────── */

export default function PainelComercial() {
  const [tab, setTab] = useState("painel");
  const { openLead360 } = useLead360();

  const handleOpenLead = (lead: { nome: string; score: number; temp: string; etapa: string; valor: string }) => {
    openLead360({
      nome: lead.nome,
      telefone: "",
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
          <Badge variant="outline" className="text-xs">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5 animate-pulse inline-block" />
            Atualizado agora
          </Badge>
          <Button variant="outline" size="sm">
            <RefreshCcw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="painel">Painel</TabsTrigger>
          <TabsTrigger value="mensagens">
            <MessageSquare className="h-4 w-4 mr-1" /> Central de Mensagens
          </TabsTrigger>
        </TabsList>

        {/* ── PAINEL ──────────────────────────────── */}
        <TabsContent value="painel" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Col 1 — Alertas Urgentes */}
            <Card className="border-destructive/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Alertas Urgentes
                  <Badge variant="destructive" className="ml-auto">{alertasUrgentes.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[520px]">
                  <div className="space-y-2 px-4 pb-4">
                    {alertasUrgentes.map((a) => (
                      <div
                        key={a.id}
                        className={`rounded-lg border p-3 ${severityStyles[a.severity]} transition-colors`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant={severityBadge[a.severity]} className="text-[10px]">{a.label}</Badge>
                          <span className="text-[10px] opacity-70">{a.time}</span>
                        </div>
                        <p className="text-xs leading-relaxed">{a.desc}</p>
                      </div>
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
                    {closers.map((c) => (
                      <div key={c.nome} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">{c.nome}</span>
                          <div className="flex gap-2 text-[10px] text-muted-foreground">
                            <span>Conv: {c.stats.conversao}%</span>
                            <span>TM: {c.stats.ticketMedio}</span>
                            <span>SLA: {c.stats.sla}</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {c.leads.map((l) => (
                            <button
                              key={l.nome}
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
                  Resumo do Dia
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[520px]">
                  <div className="px-4 pb-4 space-y-4">
                    {/* KPIs grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Leads", value: resumoDia.leadsHoje, icon: Flame },
                        { label: "Qualificados", value: resumoDia.qualificados, icon: Thermometer },
                        { label: "Agendamentos", value: resumoDia.agendamentos, icon: CalendarCheck },
                        { label: "Propostas", value: resumoDia.propostasEnviadas, icon: Send },
                        { label: "Vendas", value: resumoDia.vendasFechadas, icon: TrendingUp },
                        { label: "Score ∅", value: resumoDia.scoreMedia, icon: Zap },
                      ].map((k) => (
                        <div key={k.label} className="rounded-lg border border-border/50 bg-secondary/30 p-2 text-center">
                          <k.icon className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-0.5" />
                          <div className="text-lg font-bold text-foreground">{k.value}</div>
                          <div className="text-[10px] text-muted-foreground">{k.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Faturamento */}
                    <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-center">
                      <div className="text-xs text-muted-foreground">Faturamento Hoje</div>
                      <div className="text-xl font-black text-green-400">{resumoDia.faturamento}</div>
                      <div className="text-[10px] text-muted-foreground">Conversão {resumoDia.taxaConversao}</div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Últimas Ações</p>
                      <div className="space-y-2">
                        {resumoDia.acoes.map((a, i) => (
                          <div key={i} className="flex gap-2 text-xs">
                            <span className="text-muted-foreground whitespace-nowrap font-mono">{a.hora}</span>
                            <span className="text-foreground">{a.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
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
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-secondary/30 transition-colors"
                  >
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
