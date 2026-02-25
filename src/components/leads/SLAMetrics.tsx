import { Clock, AlertTriangle, CheckCircle2, Timer, Bot, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Proposal } from "@/data/dataAdapter";
import type { MakeRecord } from "@/hooks/useMakeDataStore";

interface SLAConfig {
  label: string;
  maxDias: number;
}

const SLA_ETAPA: Record<string, SLAConfig> = {
  "TRAFEGO PAGO": { label: "Tráfego Pago", maxDias: 1 },
  "PROSPECÇÃO": { label: "Prospecção", maxDias: 2 },
  "QUALIFICAÇÃO": { label: "Qualificação", maxDias: 3 },
  "QUALIFICADO": { label: "Qualificado", maxDias: 5 },
  "CONTATO REALIZADO": { label: "Contato Realizado", maxDias: 3 },
  "PROPOSTA": { label: "Proposta", maxDias: 5 },
  "NEGOCIAÇÃO": { label: "Negociação", maxDias: 7 },
};

function getSLAStatus(dias: number, maxDias: number): "ok" | "warning" | "overdue" {
  if (dias <= maxDias * 0.6) return "ok";
  if (dias <= maxDias) return "warning";
  return "overdue";
}

interface Props {
  proposals: Proposal[];
  makeRecords: MakeRecord[];
}

export function SLAMetrics({ proposals, makeRecords }: Props) {
  const abertos = proposals.filter(p => p.status === "Aberto");

  // 1. SLA Primeiro Atendimento (criação → qualificação) with fallbacks
  const comQualificacao = abertos.filter(p => {
    const criacao = p.dataCriacaoProjeto || p.dataCriacaoProposta;
    const qualif = p.dataQualificacaoSol || (p.solQualificado ? p.ultimaAtualizacao : null);
    return criacao && qualif;
  });
  const temposAtendimento = comQualificacao.map(p => {
    const criacao = new Date(p.dataCriacaoProjeto || p.dataCriacaoProposta);
    const qualif = new Date(p.dataQualificacaoSol || p.ultimaAtualizacao);
    if (isNaN(criacao.getTime()) || isNaN(qualif.getTime())) return -1;
    return Math.max(0, (qualif.getTime() - criacao.getTime()) / (1000 * 60 * 60 * 24));
  }).filter(d => d >= 0 && d < 365);

  const mediaAtendimento = temposAtendimento.length > 0
    ? temposAtendimento.reduce((a, b) => a + b, 0) / temposAtendimento.length
    : 0;
  const dentroSLA24h = temposAtendimento.filter(d => d <= 1).length;
  const taxaSLA24h = temposAtendimento.length > 0 ? (dentroSLA24h / temposAtendimento.length) * 100 : 0;

  // 2. SLA por Etapa
  const etapaSLA = Object.entries(SLA_ETAPA).map(([etapa, config]) => {
    const leads = abertos.filter(p => p.etapa === etapa);
    const tempos = leads.map(p => p.tempoNaEtapa);
    const media = tempos.length > 0 ? tempos.reduce((a, b) => a + b, 0) / tempos.length : 0;
    const foraDoSLA = leads.filter(p => p.tempoNaEtapa > config.maxDias).length;
    return { etapa, ...config, quantidade: leads.length, media: Math.round(media * 10) / 10, foraDoSLA };
  }).filter(e => e.quantidade > 0);

  const totalForaSLA = etapaSLA.reduce((a, e) => a + e.foraDoSLA, 0);
  const totalAbertos = etapaSLA.reduce((a, e) => a + e.quantidade, 0);

  // 3. SLA dos Robôs (with fallback: use ultima_mensagem or time since data_envio for aguardando)
  const comResposta = makeRecords.filter(r => r.data_envio && r.data_resposta);
  const temposRoboExatos = comResposta.map(r => {
    const envio = new Date(r.data_envio);
    const resp = new Date(r.data_resposta!);
    if (isNaN(envio.getTime()) || isNaN(resp.getTime())) return -1;
    return Math.max(0, (resp.getTime() - envio.getTime()) / (1000 * 60 * 60));
  }).filter(h => h >= 0 && h < 720);

  // Fallback: for "aguardando" records, use time since data_envio as proxy
  const aguardando = makeRecords.filter(r => r.data_envio && !r.data_resposta && r.status_resposta === "aguardando");
  const temposAguardando = aguardando.map(r => {
    const envio = new Date(r.data_envio);
    if (isNaN(envio.getTime())) return -1;
    return Math.max(0, (Date.now() - envio.getTime()) / (1000 * 60 * 60));
  }).filter(h => h >= 0 && h < 720);

  const allTemposRobo = [...temposRoboExatos, ...temposAguardando];
  const mediaRoboHoras = allTemposRobo.length > 0
    ? allTemposRobo.reduce((a, b) => a + b, 0) / allTemposRobo.length
    : 0;
  const responderam = makeRecords.filter(r => r.status_resposta === "respondeu").length;
  const taxaResposta = makeRecords.length > 0 ? (responderam / makeRecords.length) * 100 : 0;

  // 4. SLA Geral da Proposta
  const slaPropostas = abertos.filter(p => p.slaProposta > 0);
  const mediaSLAProposta = slaPropostas.length > 0
    ? slaPropostas.reduce((a, p) => a + p.slaProposta, 0) / slaPropostas.length
    : 0;

  return (
    <section className="mt-6 rounded-xl border border-primary/20 bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Timer className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-tight">SLA de Atendimento</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tempo de resposta, permanência e follow-up</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Fora do SLA</p>
          <p className={cn("text-sm font-bold tabular-nums", totalForaSLA > 0 ? "text-destructive" : "text-primary")}>
            {totalForaSLA} leads
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Row 1: KPIs Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Tempo Médio 1º Atendimento",
              value: mediaAtendimento > 0 ? `${mediaAtendimento.toFixed(1)}d` : "—",
              sub: `${comQualificacao.length} leads`,
              status: mediaAtendimento <= 1 ? "ok" : mediaAtendimento <= 3 ? "warning" : "overdue",
            },
            {
              label: "Dentro SLA 24h",
              value: `${taxaSLA24h.toFixed(0)}%`,
              sub: `${dentroSLA24h} de ${temposAtendimento.length}`,
              status: taxaSLA24h >= 80 ? "ok" : taxaSLA24h >= 50 ? "warning" : "overdue",
            },
            {
              label: "SLA Robôs (resp.)",
              value: mediaRoboHoras > 0 ? `${mediaRoboHoras.toFixed(1)}h` : "—",
              sub: `${taxaResposta.toFixed(0)}% responderam`,
              status: mediaRoboHoras <= 4 ? "ok" : mediaRoboHoras <= 12 ? "warning" : "overdue",
            },
            {
              label: "SLA Médio Proposta",
              value: mediaSLAProposta > 0 ? `${mediaSLAProposta.toFixed(0)}h` : "—",
              sub: `${slaPropostas.length} propostas`,
              status: mediaSLAProposta <= 24 ? "ok" : mediaSLAProposta <= 48 ? "warning" : "overdue",
            },
          ].map((kpi, i) => (
            <div key={i} className={cn(
              "rounded-lg p-3 border",
              kpi.status === "ok" ? "border-primary/20 bg-primary/5" :
              kpi.status === "warning" ? "border-warning/30 bg-warning/5" :
              "border-destructive/30 bg-destructive/5"
            )}>
              <div className="flex items-center gap-1.5 mb-2">
                {kpi.status === "ok" ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> :
                 kpi.status === "warning" ? <Clock className="h-3.5 w-3.5 text-warning" /> :
                 <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Row 2: SLA por Etapa */}
        {etapaSLA.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-medium">SLA por Etapa do Funil</p>
            <div className="space-y-2">
              {etapaSLA.map((e, i) => {
                const status = getSLAStatus(e.media, e.maxDias);
                const pct = Math.min((e.media / e.maxDias) * 100, 150);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-32 text-[11px] text-muted-foreground truncate">{e.label}</span>
                    <div className="flex-1 h-5 rounded bg-secondary/50 overflow-hidden relative">
                      <div
                        className={cn(
                          "h-full rounded transition-all duration-700",
                          status === "ok" ? "bg-primary/60" :
                          status === "warning" ? "bg-warning/60" :
                          "bg-destructive/60"
                        )}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                      {/* SLA limit marker */}
                      <div
                        className="absolute top-0 h-full w-px bg-foreground/30"
                        style={{ left: `${Math.min((e.maxDias / (e.maxDias * 1.5)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className={cn(
                      "text-xs font-bold w-12 text-right tabular-nums",
                      status === "ok" ? "text-primary" :
                      status === "warning" ? "text-warning" :
                      "text-destructive"
                    )}>
                      {e.media}d
                    </span>
                    <span className="text-[10px] text-muted-foreground w-16 text-right">
                      SLA: {e.maxDias}d
                    </span>
                    {e.foraDoSLA > 0 && (
                      <span className="text-[10px] font-semibold text-destructive w-12 text-right">
                        {e.foraDoSLA} fora
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
