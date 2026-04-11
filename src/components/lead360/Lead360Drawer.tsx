import { useEffect, useMemo, useState } from "react";
import { useLead360 } from "@/contexts/Lead360Context";
import { normalizePhone, type SolLead, type SolQualificacao } from "@/hooks/useSolData";
import { useFranquiaId } from "@/hooks/useFranquiaId";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import type { Proposal } from "@/data/dataAdapter";
import {
  User, Phone, Mail, Calendar, Clock, Zap, DollarSign,
  Briefcase, MessageSquare, Bot, TrendingUp, ThermometerSun,
  Target, ArrowRight, CheckCircle2, XCircle, AlertTriangle,
  Activity, FileText
} from "lucide-react";

type Lead360Input = Partial<Proposal> & {
  nome?: string;
  telefone?: string;
  project_id?: string;
  valor?: string | number;
  origem?: string;
  score?: string | number;
};

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value !== "string") return fallback;

  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\.(?=.*\.)/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(toNumber(value));
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  try { return new Date(dateStr).toLocaleDateString("pt-BR"); } catch { return dateStr; }
}

function formatPhone(phone?: string | null) {
  const digits = normalizePhone(phone || "");
  if (!digits) return "";
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return phone || digits;
}

function normalizeStatus(status: unknown): Proposal["status"] {
  return status === "Ganho" || status === "Perdido" ? status : "Aberto";
}

function normalizeTemperature(temp: unknown): Proposal["temperatura"] {
  const normalized = typeof temp === "string" ? temp.toUpperCase() : "";
  return normalized === "QUENTE" || normalized === "MORNO" || normalized === "FRIO" ? normalized : "";
}

function buildBaseProposal(raw: Lead360Input): Proposal {
  return {
    id: raw.id || raw.projetoId || raw.project_id || raw.clienteTelefone || raw.telefone || crypto.randomUUID(),
    franquiaId: raw.franquiaId || "",
    etapa: raw.etapa || "Novo",
    projetoId: raw.projetoId || "",
    nomeCliente: raw.nomeCliente || raw.nome || "Lead sem nome",
    clienteTelefone: raw.clienteTelefone || raw.telefone || "",
    clienteEmail: raw.clienteEmail || raw.makeEmail || "",
    status: normalizeStatus(raw.status),
    responsavel: raw.responsavel || "",
    responsavelId: raw.responsavelId || "",
    representante: raw.representante || "",
    valorProposta: toNumber(raw.valorProposta ?? raw.valor),
    potenciaSistema: toNumber(raw.potenciaSistema),
    nomeProposta: raw.nomeProposta || raw.nomeCliente || raw.nome || "",
    dataCriacaoProjeto: raw.dataCriacaoProjeto || "",
    dataCriacaoProposta: raw.dataCriacaoProposta || "",
    slaProposta: toNumber(raw.slaProposta, 0),
    ultimaAtualizacao: raw.ultimaAtualizacao || "",
    solQualificado: Boolean(raw.solQualificado),
    solScore: toNumber(raw.solScore ?? raw.score),
    temperatura: normalizeTemperature(raw.temperatura || raw.makeTemperatura),
    dataQualificacaoSol: raw.dataQualificacaoSol || "",
    notaCompleta: raw.notaCompleta || "",
    tempoNaEtapa: toNumber(raw.tempoNaEtapa, 0),
    solSdr: Boolean(raw.solSdr),
    tempoSolSdr: toNumber(raw.tempoSolSdr, 0),
    etiquetas: raw.etiquetas || "",
    origemLead: raw.origemLead || raw.origem || "",
    probabilidade: toNumber(raw.probabilidade, 0),
    motivoPerda: raw.motivoPerda || "",
    faseSM: raw.faseSM || "",
    makeStatus: raw.makeStatus,
    makeTemperatura: raw.makeTemperatura,
    makeScore: raw.makeScore,
    makeRobo: raw.makeRobo,
    makeNome: raw.makeNome,
    makeCidade: raw.makeCidade,
    makeEmail: raw.makeEmail,
    makeValorConta: raw.makeValorConta,
    makeImovel: raw.makeImovel,
    makeSentimento: raw.makeSentimento,
    makeInteresse: raw.makeInteresse,
    makeUltimaMensagem: raw.makeUltimaMensagem,
    makeHistorico: raw.makeHistorico || [],
    makeStatusResposta: raw.makeStatusResposta,
    makeRespondeu: Boolean(raw.makeRespondeu),
    makeTotalMensagens: toNumber(raw.makeTotalMensagens, 0),
    makeMensagensRecebidas: toNumber(raw.makeMensagensRecebidas, 0),
    makeDataResposta: raw.makeDataResposta,
  };
}

function pickBestPhoneMatch<T extends { telefone: string | null }>(rows: T[] | null | undefined, phone: string) {
  if (!rows?.length || !phone) return null;

  const exact = rows.find((row) => normalizePhone(row.telefone || "") === phone);
  if (exact) return exact;

  const last8 = phone.slice(-8);
  return rows.find((row) => normalizePhone(row.telefone || "").endsWith(last8)) || rows[0] || null;
}

function buildEnrichedProposal(base: Proposal, syncLead: SolLead | null, qualData: SolQualificacao | null): Proposal {
  const enriched = { ...base };

  if (syncLead) {
    if (syncLead.franquia_id) enriched.franquiaId = syncLead.franquia_id;
    if (syncLead.nome && syncLead.nome.length > 3) enriched.nomeCliente = syncLead.nome;
    if (syncLead.telefone) enriched.clienteTelefone = syncLead.telefone;
    if (syncLead.email) enriched.clienteEmail = syncLead.email;
    if (syncLead.temperatura) enriched.makeTemperatura = syncLead.temperatura;
    if (syncLead.score) enriched.makeScore = syncLead.score;
    if (syncLead.status) enriched.makeStatus = syncLead.status;
    if (syncLead.etapa_funil) enriched.etapa = syncLead.etapa_funil;
    if (syncLead.canal_origem) enriched.origemLead = syncLead.canal_origem;
    if (syncLead.closer_nome) enriched.representante = syncLead.closer_nome;
    if (syncLead.closer_nome && !enriched.responsavel) enriched.responsavel = syncLead.closer_nome;
    if (syncLead.cidade) enriched.makeCidade = syncLead.cidade;
    if (syncLead.valor_conta) enriched.makeValorConta = syncLead.valor_conta;
    if (syncLead.resumo_conversa) enriched.notaCompleta = syncLead.resumo_conversa;
    if (syncLead.total_mensagens_ia) enriched.makeTotalMensagens = syncLead.total_mensagens_ia;
    if (syncLead.total_audios_enviados) enriched.makeMensagensRecebidas = syncLead.total_audios_enviados;
    if (syncLead.resumo_qualificacao) enriched.notaCompleta = syncLead.resumo_qualificacao;
    if (syncLead.ts_ultima_interacao) enriched.ultimaAtualizacao = syncLead.ts_ultima_interacao;
    if (syncLead.ts_qualificado) enriched.dataQualificacaoSol = syncLead.ts_qualificado;
    enriched.makeRobo = (syncLead.fup_followup_count || 0) >= 1 ? "fup_frio" : "sol";
    enriched.makeRespondeu = (syncLead.total_mensagens_ia || 0) > 0;
    enriched.solScore = toNumber(syncLead.score, enriched.solScore);
    enriched.temperatura = normalizeTemperature(syncLead.temperatura) || enriched.temperatura;
    enriched.solQualificado = enriched.solQualificado || syncLead.status === "QUALIFICADO" || syncLead.transferido_comercial === true;
  }

  if (qualData) {
    enriched.solScore = toNumber(qualData.score, enriched.solScore);
    enriched.temperatura = normalizeTemperature(qualData.temperatura) || enriched.temperatura;
    enriched.dataQualificacaoSol = qualData.ts_primeira_qualificacao || enriched.dataQualificacaoSol;
    enriched.notaCompleta = qualData.resumo_qualificacao || enriched.notaCompleta;
    enriched.solQualificado = true;
  }

  return enriched;
}

function TempBadge({ temp }: { temp: string }) {
  const map: Record<string, string> = {
    QUENTE: "border-destructive/30 bg-destructive/10 text-destructive",
    MORNO: "border-warning/30 bg-warning/10 text-warning",
    FRIO: "border-info/30 bg-info/10 text-info",
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
    Aberto: "bg-info/10 text-info",
    Ganho: "bg-success/10 text-success",
    Perdido: "bg-destructive/10 text-destructive",
  };
  return <Badge className={map[status] || "bg-muted"}>{status}</Badge>;
}

function SLABadge({ sla }: { sla: number }) {
  const color = sla <= 24 ? "text-success" : sla <= 48 ? "text-warning" : "text-destructive";
  return <span className={`text-sm font-semibold ${color}`}>{sla}h</span>;
}

// ─── Hook to enrich proposal with real sync data ───
function useEnrichedProposal() {
  const { proposal, isOpen } = useLead360();
  const franquiaId = useFranquiaId();
  const [syncLead, setSyncLead] = useState<SolLead | null>(null);
  const [qualData, setQualData] = useState<SolQualificacao | null>(null);

  const baseProposal = useMemo(() => (proposal ? buildBaseProposal(proposal as Lead360Input) : null), [proposal]);
  const phone = useMemo(() => normalizePhone(baseProposal?.clienteTelefone || ""), [baseProposal?.clienteTelefone]);

  useEffect(() => {
    if (!isOpen || !phone) {
      setSyncLead(null);
      setQualData(null);
      return;
    }

    let active = true;
    const phoneCandidates = Array.from(new Set([
      phone,
      phone.startsWith("55") ? phone.slice(2) : `55${phone}`,
      phone.slice(-11),
      phone.slice(-10),
      phone.slice(-8),
    ].filter((candidate) => candidate && candidate.length >= 8)));

    const orFilter = phoneCandidates.map((candidate) => `telefone.eq.${candidate}`).join(",");

    const load = async () => {
      try {
        const [leadResponse, qualResponse] = await Promise.all([
          supabase
            .from("sol_leads_sync")
            .select("*")
            .eq("franquia_id", franquiaId)
            .or(orFilter)
            .limit(10),
          supabase
            .from("sol_qualificacao_sync")
            .select("*")
            .eq("franquia_id", franquiaId)
            .or(orFilter)
            .limit(10),
        ]);

        if (!active) return;

        setSyncLead(pickBestPhoneMatch(leadResponse.data as unknown as SolLead[] | null, phone));
        setQualData(pickBestPhoneMatch(qualResponse.data as SolQualificacao[] | null, phone));
      } catch (error) {
        console.error("Lead360 enrichment failed", error);
        if (active) {
          setSyncLead(null);
          setQualData(null);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [franquiaId, isOpen, phone]);

  const enriched = useMemo(() => {
    if (!baseProposal) return null;
    return buildEnrichedProposal(baseProposal, syncLead, qualData);
  }, [baseProposal, qualData, syncLead]);

  return { enriched, qualData };
}

// ─── CRM Tab ───
function CRMSection({ proposal: p }: { proposal: Proposal }) {
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
          <span className={`text-sm font-semibold ${p.tempoNaEtapa > 7 ? "text-destructive" : "text-foreground"}`}>
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
            <a href={`tel:${p.clienteTelefone}`} className="text-primary hover:underline">{formatPhone(p.clienteTelefone)}</a>
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
function RobosSection({ proposal: p }: { proposal: Proposal }) {

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
                <Badge className="bg-success/10 text-success"><CheckCircle2 className="h-3 w-3 mr-1" /> Sim</Badge>
              ) : (
                <Badge className="bg-destructive/10 text-destructive"><XCircle className="h-3 w-3 mr-1" /> Não</Badge>
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
                <Badge className="bg-success/10 text-success">Sim</Badge>
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
function TimelineSection({ proposal: p }: { proposal: Proposal }) {
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
    info: "border-info/50 text-info",
    success: "border-success/50 text-success",
    warning: "border-warning/50 text-warning",
    danger: "border-destructive/50 text-destructive",
  };

  const dotColors = {
    info: "bg-info",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-destructive",
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
function PerformanceSection({ proposal: p }: { proposal: Proposal }) {
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
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Lead parado há {p.tempoNaEtapa} dias na etapa "{p.etapa}"
          </div>
        )}
        {p.slaProposta > 48 && (
          <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
            <Clock className="h-4 w-4 shrink-0" />
            SLA acima de 48h ({p.slaProposta}h)
          </div>
        )}
        {p.temperatura === "QUENTE" && p.status === "Aberto" && p.tempoNaEtapa > 7 && (
          <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
            <ThermometerSun className="h-4 w-4 shrink-0" />
            Lead quente parado — risco de esfriar
          </div>
        )}
        {p.makeRespondeu && p.status === "Aberto" && (
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
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

// ─── Qualificação Section ───
function QualificacaoSection({ proposal: p, qualData }: { proposal: Proposal; qualData: SolQualificacao | null }) {
  return (
    <div className="space-y-4">
      {/* Performance section first */}
      <PerformanceSection proposal={p} />

      <Separator />

      {/* Qualification Summary */}
      <div className="rounded-lg border border-border p-3 space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Resumo de Qualificação SOL
        </h4>

        {qualData ? (
          <div className="space-y-2">
            {/* Score & Temp */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md bg-primary/10 p-2 text-center">
                <p className="text-lg font-bold text-foreground">{qualData.score || 0}</p>
                <p className="text-[9px] text-muted-foreground">Score</p>
              </div>
              <div className="rounded-md bg-accent/10 p-2 text-center">
                <TempBadge temp={qualData.temperatura || ''} />
                <p className="text-[9px] text-muted-foreground mt-0.5">Temperatura</p>
              </div>
              <div className="rounded-md bg-muted p-2 text-center">
                <Badge variant="outline" className="text-[10px]">{qualData.acao || '—'}</Badge>
                <p className="text-[9px] text-muted-foreground mt-0.5">Ação</p>
              </div>
            </div>

            {/* Model */}
            {qualData.modelo_negocio && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Modelo</span>
                <Badge variant="secondary" className="text-[10px]">{qualData.modelo_negocio}</Badge>
              </div>
            )}

            {/* Resumo text */}
            {qualData.resumo_qualificacao && (
              <div className="rounded-md bg-muted/50 p-2.5 max-h-[200px] overflow-y-auto">
                <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                  {qualData.resumo_qualificacao}
                </p>
              </div>
            )}

            {/* Dados detalhados */}
            {qualData.dados_qualificacao && typeof qualData.dados_qualificacao === 'object' && (
              <div className="space-y-1">
                <h5 className="text-[10px] text-muted-foreground font-semibold">Dados Coletados</h5>
                {Object.entries(qualData.dados_qualificacao as Record<string, any>)
                  .filter(([, v]) => v && v !== '')
                  .map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</span>
                      <span className="text-foreground font-medium max-w-[180px] truncate text-right">{String(v)}</span>
                    </div>
                  ))
                }
              </div>
            )}

            {/* Timestamps */}
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground border-t border-border/30 pt-2 mt-2">
              {qualData.ts_primeira_qualificacao && (
                <span>1ª Qual: {formatDate(qualData.ts_primeira_qualificacao)}</span>
              )}
              {qualData.ts_ultima_atualizacao && (
                <span>Últ. Atual: {formatDate(qualData.ts_ultima_atualizacao)}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
            <FileText className="h-6 w-6 mb-1 opacity-30" />
            <p className="text-xs">Sem dados de qualificação para este lead</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Drawer ───
export function Lead360Drawer() {
  const { isOpen, closeLead360 } = useLead360();
  const { enriched: proposal, qualData } = useEnrichedProposal();

  if (!isOpen || !proposal) return null;

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
                {formatPhone(proposal.clienteTelefone)}{proposal.origemLead || proposal.etapa ? ` • ${proposal.origemLead || proposal.etapa}` : ""}
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
              <TrendingUp className="h-3 w-3" /> Perf & Qual
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4">
              <TabsContent value="crm" className="mt-0"><CRMSection proposal={proposal} /></TabsContent>
              <TabsContent value="robos" className="mt-0"><RobosSection proposal={proposal} /></TabsContent>
              <TabsContent value="timeline" className="mt-0"><TimelineSection proposal={proposal} /></TabsContent>
              <TabsContent value="performance" className="mt-0"><QualificacaoSection proposal={proposal} qualData={qualData} /></TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
