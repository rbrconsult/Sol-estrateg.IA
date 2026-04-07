import { Timer, AlertTriangle, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMinutes } from "@/lib/leads-utils";

interface LeadsSLAMonitorProps {
  slaData: {
    etapaSLA: Array<{
      label: string;
      maxDias: number;
      quantidade: number;
      media: number;
      foraDoSLA: number;
      semData: number;
      comDados: number;
    }>;
    totalForaSLA: number;
    mediaRoboMin: number;
    mediaAtendMin: number;
    taxaSLA24h: number;
    dentroSLA24h: number;
    temposAtendCount: number;
    dadosInsuficientes: boolean;
    totalComEntrada: number;
    totalLeads: number;
  };
  responderamKpi: number;
}

export function LeadsSLAMonitor({ slaData, responderamKpi }: LeadsSLAMonitorProps) {
  return (
    <section className="mt-6 rounded-xl border border-primary/20 bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Timer className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-tight">SLA de Atendimento</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tempos em minutos (cadastro → interação / limites por etapa)</p>
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
        {slaData.dadosInsuficientes && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground">Dados insuficientes para SLA de 1º Atendimento</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                O 1º atendimento usa <code className="bg-muted px-1 rounded text-[10px]">ts_cadastro</code> →{" "}
                <code className="bg-muted px-1 rounded text-[10px]">ts_ultima_interacao</code> (minutos).
                {slaData.totalLeads - slaData.totalComEntrada > 0 && (
                  <> <strong>{slaData.totalLeads - slaData.totalComEntrada}</strong> lead(s) sem data.</>
                )}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            {
              label: "Tempo Médio 1º Atendimento",
              value: slaData.temposAtendCount > 0 ? formatMinutes(slaData.mediaAtendMin) : "—",
              sub: slaData.temposAtendCount > 0 ? `${slaData.temposAtendCount} leads · cadastro → 1ª interação` : "Sem par de datas",
              status: slaData.temposAtendCount === 0 ? "nodata" : slaData.mediaAtendMin <= 24 * 60 ? "ok" : slaData.mediaAtendMin <= 3 * 24 * 60 ? "warning" : "overdue" as const,
            },
            {
              label: "Dentro SLA 24h",
              value: slaData.temposAtendCount > 0 ? `${slaData.taxaSLA24h.toFixed(0)}%` : "—",
              sub: slaData.temposAtendCount > 0 ? `${slaData.dentroSLA24h} de ${slaData.temposAtendCount} ≤ 1440 min` : "Sem par de datas",
              status: slaData.temposAtendCount === 0 ? "nodata" : slaData.taxaSLA24h >= 80 ? "ok" : slaData.taxaSLA24h >= 50 ? "warning" : "overdue" as const,
            },
            {
              label: "SLA Robôs (1ª resposta)",
              value: slaData.mediaRoboMin > 0 ? formatMinutes(slaData.mediaRoboMin) : "—",
              sub: responderamKpi > 0 ? `${responderamKpi} com «respondeu» no recorte` : "Sem par de datas",
              status: slaData.mediaRoboMin === 0 ? "nodata" : slaData.mediaRoboMin <= 4 * 60 ? "ok" : slaData.mediaRoboMin <= 12 * 60 ? "warning" : "overdue" as const,
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
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-medium">SLA por Etapa do Funil</p>
            <p className="text-[9px] text-muted-foreground/80 mb-3">
              Média em <span className="font-medium text-foreground">minutos</span> desde <code className="text-[9px]">ts_cadastro</code>
            </p>
            <div className="space-y-2">
              {slaData.etapaSLA.map((e, i) => {
                const hasData = e.comDados > 0;
                const status = !hasData ? "nodata" : e.media <= e.maxDias * 0.6 ? "ok" : e.media <= e.maxDias ? "warning" : "overdue";
                const pct = hasData ? Math.min((e.media / e.maxDias) * 100, 150) : 0;
                const mediaMin = e.media * 24 * 60;
                const maxMin = e.maxDias * 24 * 60;
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
                    <span className={cn("text-xs font-bold w-[4.5rem] text-right tabular-nums",
                      !hasData ? "text-muted-foreground" :
                      status === "ok" ? "text-primary" : status === "warning" ? "text-warning" : "text-destructive")}>
                      {hasData ? formatMinutes(mediaMin) : "—"}
                    </span>
                    <span className="text-[10px] text-muted-foreground w-[5.5rem] text-right">≤{Math.round(maxMin)} min</span>
                    {e.foraDoSLA > 0 && <span className="text-[10px] font-semibold text-destructive w-12 text-right">{e.foraDoSLA} fora</span>}
                    {e.semData > 0 && <span className="text-[10px] text-muted-foreground w-20 text-right">⚠ {e.semData} s/ data</span>}
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
