import { cn } from "@/lib/utils";
import { Clock, CheckCircle2, AlertTriangle, Timer, Building2, Bot } from "lucide-react";

interface SLAData {
  primeiroAtendimento: { media: number; pctDentro24h: number; total: number };
  porEtapa: {
    etapa: string;
    slaDias: number;
    mediaDias: number;
    status: "ok" | "warning" | "overdue" | "comercial";
    leadsNaEtapa?: number;
    solNaJornadaCount?: number;
    solNaJornadaPct?: number;
  }[];
  robos: { tempoResposta: string; leadsAguardando: number; taxaResposta: number };
  geralProposta: { mediaDias: number };
}

export function SLAMetrics({ data }: { data: SLAData }) {
  const pa = data.primeiroAtendimento ?? { media: 0, pctDentro24h: 0, total: 0 };
  const porEtapa = data.porEtapa ?? [];
  const robos = data.robos ?? { tempoResposta: "—", leadsAguardando: 0, taxaResposta: 0 };
  const geralProposta = data.geralProposta ?? { mediaDias: 0 };

  const statusIcon = (s: string) =>
    s === "ok" ? (
      <CheckCircle2 className="h-3 w-3 text-success" />
    ) : s === "warning" ? (
      <Clock className="h-3 w-3 text-warning" />
    ) : s === "comercial" ? (
      <Building2 className="h-3 w-3 text-muted-foreground" />
    ) : (
      <AlertTriangle className="h-3 w-3 text-destructive" />
    );

  const statusColor = (s: string) =>
    s === "ok"
      ? "text-success"
      : s === "warning"
        ? "text-warning"
        : s === "comercial"
          ? "text-muted-foreground"
          : "text-destructive";

  const barClass = (s: string) =>
    s === "ok"
      ? "bg-success/60"
      : s === "warning"
        ? "bg-warning/60"
        : s === "comercial"
          ? "bg-muted-foreground/35"
          : "bg-destructive/60";

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
            {pa.media < 1
              ? `${Math.round(pa.media * 60)}min`
              : `${pa.media}h`}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">tempo médio</p>
          <div className="mt-2 flex items-center justify-center gap-1">
            <span
              className={cn(
                "text-sm font-bold tabular-nums",
                pa.pctDentro24h >= 80 ? "text-success" : "text-warning"
              )}
            >
              {pa.pctDentro24h}%
            </span>
            <span className="text-[9px] text-muted-foreground">em &lt;24h</span>
          </div>
        </div>

        {/* SLA por Etapa */}
        <div className="md:col-span-2 rounded-lg border border-border/30 p-3">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-2">SLA por Etapa</p>
          <p className="text-[8px] text-muted-foreground/80 mb-2 leading-snug">
            Após handover (Closer / Proposta), o SLA é do comercial; a barra é só referência de tempo médio na etapa.{" "}
            <span className="font-medium text-foreground">SOL na jornada</span> indica se o robô/IA atuou no lead antes.
          </p>
          <div className="space-y-2">
            {porEtapa.map((e) => {
              const leads = e.leadsNaEtapa ?? 0;
              const solN = e.solNaJornadaCount ?? 0;
              const solPct = e.solNaJornadaPct ?? 0;
              const widthPct =
                e.slaDias > 0 ? Math.min((e.mediaDias / e.slaDias) * 100, 100) : 0;
              return (
                <div key={e.etapa} className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {statusIcon(e.status)}
                    <span className="text-[10px] text-muted-foreground w-24 shrink-0 truncate">{e.etapa}</span>
                    <div className="flex-1 h-4 bg-secondary/50 rounded overflow-hidden relative">
                      <div className={cn("h-full rounded transition-all duration-700", barClass(e.status))} style={{ width: `${widthPct}%` }} />
                      <div className="absolute top-0 bottom-0 w-px bg-foreground/30" style={{ left: "100%" }} />
                    </div>
                    <span className={cn("text-[10px] font-semibold tabular-nums w-[4.5rem] text-right shrink-0", statusColor(e.status))}>
                      {e.status === "comercial" ? (
                        <>
                          {e.mediaDias}d <span className="text-[8px] font-normal opacity-80">ref.</span>
                        </>
                      ) : (
                        <>
                          {e.mediaDias}d / {e.slaDias}d
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 pl-7 text-[8px] text-muted-foreground">
                    <Bot className="h-2.5 w-2.5 shrink-0 opacity-70" />
                    <span>
                      SOL na jornada: <span className="font-semibold text-foreground tabular-nums">{solPct}%</span>
                      {leads > 0 && (
                        <span className="tabular-nums">
                          {" "}
                          ({solN}/{leads})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SLA Robôs + Geral */}
        <div className="rounded-lg border border-border/30 p-3 space-y-3">
          <div className="text-center">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Robô SOL</p>
            <p className="text-xl font-extrabold text-success tabular-nums">{robos.tempoResposta}</p>
            <p className="text-[9px] text-muted-foreground">tempo resposta</p>
          </div>
          <div className="text-center border-t border-border/30 pt-2">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Aguardando</p>
            <p className="text-lg font-bold text-warning tabular-nums">{robos.leadsAguardando}</p>
            <p className="text-[9px] text-muted-foreground">leads sem resposta</p>
          </div>
          <div className="text-center border-t border-border/30 pt-2">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">SLA Proposta</p>
            <p className="text-lg font-bold text-foreground tabular-nums">{geralProposta.mediaDias}d</p>
            <p className="text-[9px] text-muted-foreground">média geral</p>
          </div>
        </div>
      </div>
    </section>
  );
}
