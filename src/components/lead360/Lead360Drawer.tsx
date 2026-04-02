import { useEffect, useState } from "react";
import { useLead360 } from "@/contexts/Lead360Context";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import {
  User, Phone, Mail, Calendar, Clock, Zap, DollarSign,
  Briefcase, MessageSquare, Bot, TrendingUp, ThermometerSun,
  Target, ArrowRight, CheckCircle2, XCircle, AlertTriangle,
  Activity, FileText
} from "lucide-react";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  try { return new Date(dateStr).toLocaleDateString("pt-BR"); } catch { return dateStr; }
}

function TempBadge({ temp }: { temp: string }) {
  const map: Record<string, string> = {
    QUENTE: "bg-red-500/20 text-red-400 border-red-500/30",
    MORNO: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    FRIO: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  return (
    <Badge variant="outline" className={map[temp] || "bg-muted text-muted-foreground"}>
      <ThermometerSun className="h-3 w-3 mr-1" />
      {temp || "N/A"}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Aberto: "bg-blue-500/20 text-blue-400",
    Ganho: "bg-green-500/20 text-green-400",
    Perdido: "bg-red-500/20 text-red-400",
  };
  return <Badge className={map[status] || "bg-muted"}>{status}</Badge>;
}

function SLABadge({ sla }: { sla: number }) {
  const color = sla <= 24 ? "text-green-400" : sla <= 48 ? "text-yellow-400" : "text-red-400";
  return <span className={`text-sm font-semibold ${color}`}>{sla}h</span>;
}

// ─── CRM Tab ───
function CRMSection() {
  const { proposal: p } = useLead360();
  if (!p) return null;

  return (
    <div className="space-y-4">
      {/* Valores */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-primary/10 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <DollarSign className="h-3.5 w-3.5" /> Valor
          </div>
          <p className="text-lg font-bold text-foreground">{formatCurrency(p.valorProposta || 0)}</p>
        </div>
        <div className="rounded-lg bg-accent/10 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Zap className="h-3.5 w-3.5" /> Potência
          </div>
          <p className="text-lg font-bold text-foreground">{(p.potenciaSistema || 0).toFixed(2)} kWp</p>
        </div>
      </div>

      {/* Etapa & Status */}
      <div className="rounded-lg border border-border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Etapa</span>
          <Badge variant="outline" className="text-xs">{p.etapa}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Status</span>
          <StatusBadge status={p.status} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Temperatura</span>
          <TempBadge temp={p.makeTemperatura || p.temperatura} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">SLA</span>
          <SLABadge sla={p.slaProposta} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Probabilidade</span>
          <span className="text-sm font-semibold text-foreground">{p.probabilidade}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Dias na etapa</span>
          <span className={`text-sm font-semibold ${p.tempoNaEtapa > 7 ? "text-red-400" : "text-foreground"}`}>
            {p.tempoNaEtapa}d
          </span>
        </div>
      </div>

      {/* Contato */}
      <div className="rounded-lg border border-border p-3 space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</h4>
        {p.clienteTelefone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            <a href={`tel:${p.clienteTelefone}`} className="text-primary hover:underline">{p.clienteTelefone}</a>
          </div>
        )}
        {p.clienteEmail && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <a href={`mailto:${p.clienteEmail}`} className="text-primary hover:underline text-xs break-all">{p.clienteEmail}</a>
          </div>
        )}
      </div>

      {/* Responsáveis */}
      <div className="rounded-lg border border-border p-3 space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Responsáveis</h4>
        {p.responsavel && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Comercial:</span>
            <span className="font-medium text-foreground">{p.responsavel}</span>
          </div>
        )}
        {p.representante && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Vendedor:</span>
            <span className="font-medium text-foreground">{p.representante}</span>
          </div>
        )}
      </div>

      {/* Origem & Etiquetas */}
      {(p.origemLead || p.etiquetas) && (
        <div className="rounded-lg border border-border p-3 space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Classificação</h4>
          {p.origemLead && (
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Origem:</span>
              <span className="font-medium text-foreground">{p.origemLead}</span>
            </div>
          )}
          {p.etiquetas && (
            <div className="flex flex-wrap gap-1 mt-1">
              {p.etiquetas.split(",").map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">{tag.trim()}</Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Robôs Tab ───
function RobosSection() {
  const { proposal: p } = useLead360();
  if (!p) return null;

  const hasRobotData = p.makeRobo || p.makeStatus || p.makeStatusResposta;

  return (
    <div className="space-y-4">
      {!hasRobotData ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Bot className="h-10 w-10 mb-2 opacity-40" />
          <p className="text-sm">Sem dados de interação com robôs</p>
        </div>
      ) : (
        <>
          {/* Robot Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground mb-1">Robô</div>
              <Badge variant="outline" className="text-xs">
                <Bot className="h-3 w-3 mr-1" />
                {p.makeRobo === "fup_frio" ? "FUP Frio" : p.makeRobo === "sol" ? "SOL SDR" : p.makeRobo || "—"}
              </Badge>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground mb-1">Status Make</div>
              <Badge variant="outline" className="text-xs">{p.makeStatus || "—"}</Badge>
            </div>
          </div>

          {/* Interaction metrics */}
          <div className="rounded-lg border border-border p-3 space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Métricas de Interação</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Respondeu</span>
              {p.makeRespondeu ? (
                <Badge className="bg-green-500/20 text-green-400"><CheckCircle2 className="h-3 w-3 mr-1" /> Sim</Badge>
              ) : (
                <Badge className="bg-red-500/20 text-red-400"><XCircle className="h-3 w-3 mr-1" /> Não</Badge>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total de mensagens</span>
              <span className="font-semibold">{p.makeTotalMensagens || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Mensagens recebidas</span>
              <span className="font-semibold">{p.makeMensagensRecebidas || 0}</span>
            </div>
            {p.makeDataResposta && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Data resposta</span>
                <span className="font-semibold">{formatDate(p.makeDataResposta)}</span>
              </div>
            )}
          </div>

          {/* Score & Temperatura from Make */}
          <div className="grid grid-cols-2 gap-3">
            {p.makeScore && (
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground mb-1">Score Make</div>
                <p className="text-lg font-bold text-foreground">{p.makeScore}</p>
              </div>
            )}
            {p.makeTemperatura && (
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground mb-1">Temperatura Make</div>
                <TempBadge temp={p.makeTemperatura} />
              </div>
            )}
          </div>

          {/* Sol Qualification */}
          <div className="rounded-lg border border-border p-3 space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qualificação SOL</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Qualificado</span>
              {p.solQualificado ? (
                <Badge className="bg-green-500/20 text-green-400">Sim</Badge>
              ) : (
                <Badge className="bg-muted text-muted-foreground">Não</Badge>
              )}
            </div>
            {p.solScore > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Score SOL</span>
                <span className="font-semibold">{p.solScore}</span>
              </div>
            )}
            {p.dataQualificacaoSol && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Data qualificação</span>
                <span className="font-semibold">{formatDate(p.dataQualificacaoSol)}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Timeline Tab ───
function TimelineSection() {
  const { proposal: p } = useLead360();
  if (!p) return null;

  // Build timeline events from all available data
  const events: { date: string; label: string; icon: React.ReactNode; type: "info" | "success" | "warning" | "danger" }[] = [];

  if (p.dataCriacaoProjeto) {
    events.push({ date: p.dataCriacaoProjeto, label: "Projeto criado", icon: <Briefcase className="h-3.5 w-3.5" />, type: "info" });
  }
  if (p.dataCriacaoProposta && p.dataCriacaoProposta !== p.dataCriacaoProjeto) {
    events.push({ date: p.dataCriacaoProposta, label: "Proposta criada", icon: <DollarSign className="h-3.5 w-3.5" />, type: "info" });
  }
  if (p.dataQualificacaoSol) {
    events.push({ date: p.dataQualificacaoSol, label: "Qualificado pelo SOL", icon: <CheckCircle2 className="h-3.5 w-3.5" />, type: "success" });
  }

  // Make historico events
  if (p.makeHistorico && p.makeHistorico.length > 0) {
    p.makeHistorico.forEach((h) => {
      events.push({
        date: h.data,
        label: h.tipo === "recebida" ? `📩 ${h.mensagem}` : `📤 ${h.mensagem}`,
        icon: <MessageSquare className="h-3.5 w-3.5" />,
        type: h.tipo === "recebida" ? "success" : "info",
      });
    });
  }

  if (p.ultimaAtualizacao) {
    events.push({ date: p.ultimaAtualizacao, label: `Etapa atual: ${p.etapa}`, icon: <ArrowRight className="h-3.5 w-3.5" />, type: "info" });
  }

  if (p.status === "Perdido") {
    events.push({ date: p.ultimaAtualizacao, label: `Perdido: ${p.motivoPerda || "sem motivo"}`, icon: <XCircle className="h-3.5 w-3.5" />, type: "danger" });
  }
  if (p.status === "Ganho") {
    events.push({ date: p.ultimaAtualizacao, label: "Negócio fechado!", icon: <CheckCircle2 className="h-3.5 w-3.5" />, type: "success" });
  }

  // Sort by date
  events.sort((a, b) => {
    const da = new Date(a.date || 0).getTime();
    const db = new Date(b.date || 0).getTime();
    return da - db;
  });

  const typeColors = {
    info: "border-blue-500/50 text-blue-400",
    success: "border-green-500/50 text-green-400",
    warning: "border-yellow-500/50 text-yellow-400",
    danger: "border-red-500/50 text-red-400",
  };

  const dotColors = {
    info: "bg-blue-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
  };

  return (
    <div className="space-y-1">
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Activity className="h-10 w-10 mb-2 opacity-40" />
          <p className="text-sm">Sem eventos na timeline</p>
        </div>
      ) : (
        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
          {events.map((ev, i) => (
            <div key={i} className="relative flex items-start gap-3 pb-4">
              {/* Dot */}
              <div className={`absolute left-[-15px] top-1.5 h-2.5 w-2.5 rounded-full ${dotColors[ev.type]} ring-2 ring-background`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${typeColors[ev.type]}`}>{ev.label}</p>
                <p className="text-[10px] text-muted-foreground">{formatDate(ev.date)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Performance Tab ───
function PerformanceSection() {
  const { proposal: p } = useLead360();
  if (!p) return null;

  return (
    <div className="space-y-4">
      {/* Vendedor info */}
      <div className="rounded-lg border border-border p-3 space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Vendedor Responsável
        </h4>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{p.representante || p.responsavel || "N/A"}</p>
            <p className="text-xs text-muted-foreground">
              {p.responsavel && p.representante ? `Responsável: ${p.responsavel}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Deal metrics */}
      <div className="rounded-lg border border-border p-3 space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Métricas do Negócio</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tempo no pipeline</span>
            <span className="font-semibold text-foreground">{p.tempoNaEtapa}d na etapa atual</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">SLA da proposta</span>
            <SLABadge sla={p.slaProposta} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Probabilidade</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${p.probabilidade}%` }} />
              </div>
              <span className="font-semibold text-foreground text-xs">{p.probabilidade}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Valor ponderado</span>
            <span className="font-semibold text-foreground">
              {formatCurrency(p.valorProposta * (p.probabilidade / 100))}
            </span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-2">
        {p.tempoNaEtapa > 14 && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Lead parado há {p.tempoNaEtapa} dias na etapa "{p.etapa}"
          </div>
        )}
        {p.slaProposta > 48 && (
          <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-400">
            <Clock className="h-4 w-4 shrink-0" />
            SLA acima de 48h ({p.slaProposta}h)
          </div>
        )}
        {p.temperatura === "QUENTE" && p.status === "Aberto" && p.tempoNaEtapa > 7 && (
          <div className="flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 text-sm text-orange-400">
            <ThermometerSun className="h-4 w-4 shrink-0" />
            Lead quente parado — risco de esfriar
          </div>
        )}
        {p.makeRespondeu && p.status === "Aberto" && (
          <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Lead respondeu ao robô — oportunidade de conversão
          </div>
        )}
      </div>

      {/* Nota completa */}
      {p.notaCompleta && (
        <div className="rounded-lg border border-border p-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Nota / Observação</h4>
          <p className="text-sm text-foreground whitespace-pre-wrap">{p.notaCompleta}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Drawer ───
export function Lead360Drawer() {
  const { isOpen, proposal, closeLead360 } = useLead360();

  if (!proposal) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeLead360()}>
      <SheetContent className="w-full sm:max-w-[480px] p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-foreground truncate">{proposal.nomeCliente}</p>
              <p className="text-[10px] text-muted-foreground font-normal truncate">
                {proposal.nomeProposta} • {proposal.projetoId}
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="crm" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-4 mt-2 w-auto flex gap-1 bg-muted/50 p-1 shrink-0">
            <TabsTrigger value="crm" className="text-[11px] gap-1">
              <Briefcase className="h-3 w-3" /> CRM
            </TabsTrigger>
            <TabsTrigger value="robos" className="text-[11px] gap-1">
              <Bot className="h-3 w-3" /> Robôs
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-[11px] gap-1">
              <Activity className="h-3 w-3" /> Timeline
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-[11px] gap-1">
              <TrendingUp className="h-3 w-3" /> Performance
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4">
              <TabsContent value="crm" className="mt-0"><CRMSection /></TabsContent>
              <TabsContent value="robos" className="mt-0"><RobosSection /></TabsContent>
              <TabsContent value="timeline" className="mt-0"><TimelineSection /></TabsContent>
              <TabsContent value="performance" className="mt-0"><PerformanceSection /></TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
