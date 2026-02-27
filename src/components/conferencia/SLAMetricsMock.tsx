import { cn } from "@/lib/utils";
import { Clock, CheckCircle2, AlertTriangle, Timer } from "lucide-react";

interface SLAData {
  primeiroAtendimento: { media: number; pctDentro24h: number; total: number };
  porEtapa: { etapa: string; slaDias: number; mediaDias: number; status: "ok" | "warning" | "overdue" }[];
  robos: { tempoResposta: string; leadsAguardando: number; taxaResposta: number };
  geralProposta: { mediaDias: number };
}

export function SLAMetricsMock({ data }: { data: SLAData }) {
  const statusIcon = (s: string) =>
    s === "ok" ? <CheckCircle2 className="h-3 w-3 text-success" /> :
    s === "warning" ? <Clock className="h-3 w-3 text-warning" /> :
    <AlertTriangle className="h-3 w-3 text-destructive" />;

  const statusColor = (s: string) =>
    s === "ok" ? "text-success" : s === "warning" ? "text-warning" : "text-destructive";

  return (
    <section className="mt-4 rounded-lg border border-border/50 bg-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Timer className="h-4 w-4 text-primary" />
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">SLA & Tempos de Resposta</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Primeiro Atendimento */}
        <div className="rounded-lg border border-border/30 p-3 text-center">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-2">1º Atendimento</p>
          <p className="text-2xl font-extrabold text-foreground tabular-nums">
            {data.primeiroAtendimento.media < 1
              ? `${Math.round(data.primeiroAtendimento.media * 60)}min`
              : `${data.primeiroAtendimento.media}h`}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">tempo médio</p>
          <div className="mt-2 flex items-center justify-center gap-1">
            <span className={cn("text-sm font-bold tabular-nums", data.primeiroAtendimento.pctDentro24h >= 80 ? "text-success" : "text-warning")}>
              {data.primeiroAtendimento.pctDentro24h}%
            </span>
            <span className="text-[9px] text-muted-foreground">em &lt;24h</span>
          </div>
        </div>

        {/* SLA por Etapa */}
        <div className="md:col-span-2 rounded-lg border border-border/30 p-3">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-2">SLA por Etapa</p>
          <div className="space-y-1.5">
            {data.porEtapa.map((e) => (
              <div key={e.etapa} className="flex items-center gap-2">
                {statusIcon(e.status)}
                <span className="text-[10px] text-muted-foreground w-24 shrink-0 truncate">{e.etapa}</span>
                <div className="flex-1 h-4 bg-secondary/50 rounded overflow-hidden relative">
                  <div
                    className={cn("h-full rounded transition-all duration-700",
                      e.status === "ok" ? "bg-success/60" : e.status === "warning" ? "bg-warning/60" : "bg-destructive/60"
                    )}
                    style={{ width: `${Math.min((e.mediaDias / e.slaDias) * 100, 100)}%` }}
                  />
                  {/* SLA limit marker */}
                  <div className="absolute top-0 bottom-0 w-px bg-foreground/30" style={{ left: "100%" }} />
                </div>
                <span className={cn("text-[10px] font-semibold tabular-nums w-14 text-right", statusColor(e.status))}>
                  {e.mediaDias}d / {e.slaDias}d
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SLA Robôs + Geral */}
        <div className="rounded-lg border border-border/30 p-3 space-y-3">
          <div className="text-center">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Robô SOL</p>
            <p className="text-xl font-extrabold text-success tabular-nums">{data.robos.tempoResposta}</p>
            <p className="text-[9px] text-muted-foreground">tempo resposta</p>
          </div>
          <div className="text-center border-t border-border/30 pt-2">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Aguardando</p>
            <p className="text-lg font-bold text-warning tabular-nums">{data.robos.leadsAguardando}</p>
            <p className="text-[9px] text-muted-foreground">leads sem resposta</p>
          </div>
          <div className="text-center border-t border-border/30 pt-2">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">SLA Proposta</p>
            <p className="text-lg font-bold text-foreground tabular-nums">{data.geralProposta.mediaDias}d</p>
            <p className="text-[9px] text-muted-foreground">média geral</p>
          </div>
        </div>
      </div>
    </section>
  );
}
