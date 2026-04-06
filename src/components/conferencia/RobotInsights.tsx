import { cn } from "@/lib/utils";
import { Bot, Send, Users, Flame, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import type { PipelineStage } from "@/hooks/useConferenciaData";

const iconMap = {
  bot: Bot,
  send: Send,
  users: Users,
  flame: Flame,
} as const;

interface RobotData {
  destaques: { label: string; value: number; icon: keyof typeof iconMap; color: string }[];
  comparacao: {
    sol: { nome: string; taxaResposta: number; tempoMedioResposta: string; leadsProcessados: number };
    fup: { nome: string; taxaResposta: number; tempoMedioResposta: string; leadsProcessados: number };
  };
  funilMensagens: { etapa: string; valor: number }[];
  alertasUrgentes: { tipo: "danger" | "warning" | "success" | "info"; titulo: string; desc: string }[];
}

type Props = { data: RobotData; pipelineStages: PipelineStage[] };

export function RobotInsights({ data, pipelineStages }: Props) {
  const maxFunil = data.funilMensagens[0]?.valor || 1;
  const maxPipe = Math.max(1, ...pipelineStages.map((s) => s.valor));
  const baseJornada = pipelineStages[0]?.valor ?? 0;

  return (
    <section className="mt-4 rounded-lg border border-border/50 bg-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="h-4 w-4 text-primary" />
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Robôs & Follow-up — Insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Mesmos números do funil cumulativo (dashboard) */}
        <div className="space-y-3">
          <p className="text-[9px] text-success uppercase tracking-wider font-semibold">Funil cumulativo da jornada</p>
          <p className="text-[8px] text-muted-foreground/90 leading-snug -mt-1">
            Totais alinhados ao bloco <span className="font-medium text-foreground">Funil da Jornada</span> — cada estágio conta leads
            que já alcançaram <span className="font-medium text-foreground">≥</span> aquele ponto (pré-venda → comercial,{" "}
            <span className="font-medium text-foreground">etapa_funil</span> / handover / ganho). Base:{" "}
            <span className="font-semibold tabular-nums text-foreground">{baseJornada.toLocaleString("pt-BR")}</span> recebidos.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {pipelineStages.length === 0 ? (
              <p className="text-[10px] text-muted-foreground col-span-2 py-2">Sem dados de funil no período.</p>
            ) : (
              pipelineStages.map((s) => {
                const pctBar = (s.valor / maxPipe) * 100;
                return (
                  <div key={s.etapa} className="rounded-lg border border-border/30 p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base leading-none" aria-hidden>
                        {s.icon}
                      </span>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wide font-medium truncate">{s.etapa}</p>
                    </div>
                    <p className="text-lg font-extrabold tabular-nums leading-none text-foreground">{s.valor.toLocaleString("pt-BR")}</p>
                    <p className="text-[8px] text-muted-foreground/80 mt-1 line-clamp-2">{s.desc}</p>
                    <div className="mt-2 h-1 bg-secondary/50 rounded overflow-hidden">
                      <div className="h-full bg-primary/50 rounded transition-all duration-700" style={{ width: `${pctBar}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="rounded-lg border border-border/30 p-3">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">SOL vs FUP Frio</p>
            <div className="grid grid-cols-2 gap-3 text-center">
              {[data.comparacao.sol, data.comparacao.fup].map((r) => (
                <div key={r.nome}>
                  <p className="text-[9px] text-muted-foreground mb-1 truncate">{r.nome}</p>
                  <p className="text-lg font-extrabold text-foreground tabular-nums">{r.taxaResposta}%</p>
                  <p className="text-[9px] text-muted-foreground">taxa resposta</p>
                  <p className="text-[10px] text-primary font-semibold mt-1 tabular-nums">{r.tempoMedioResposta}</p>
                  <p className="text-[9px] text-muted-foreground">{r.leadsProcessados} leads</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Funil de Mensagens */}
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">Funil de Mensagens</p>
          <div className="space-y-2">
            {data.funilMensagens.map((f, i) => {
              const pct = (f.valor / maxFunil) * 100;
              const convPct = i > 0 ? ((f.valor / data.funilMensagens[i - 1].valor) * 100).toFixed(0) : null;
              return (
                <div key={f.etapa}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-muted-foreground">{f.etapa}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-foreground tabular-nums">{f.valor.toLocaleString("pt-BR")}</span>
                      {convPct && <span className="text-[9px] text-muted-foreground/60 tabular-nums">({convPct}%)</span>}
                    </div>
                  </div>
                  <div className="h-4 bg-secondary/50 rounded overflow-hidden">
                    <div
                      className="h-full bg-primary/50 rounded transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alertas urgentes */}
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">📋 Alertas & Status</p>
          <div className="space-y-2">
            {data.alertasUrgentes.map((a, i) => {
              const icon =
                a.tipo === "danger" ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                ) : a.tipo === "success" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                ) : (
                  <Info className="h-3.5 w-3.5 text-warning shrink-0" />
                );
              const border =
                a.tipo === "danger"
                  ? "border-destructive/30 bg-destructive/5"
                  : a.tipo === "success"
                    ? "border-success/30 bg-success/5"
                    : "border-warning/30 bg-warning/5";
              return (
                <div key={i} className={cn("rounded-md border p-2.5 flex items-start gap-2", border)}>
                  {icon}
                  <div>
                    <p className="text-[11px] font-semibold text-foreground leading-tight">{a.titulo}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{a.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
