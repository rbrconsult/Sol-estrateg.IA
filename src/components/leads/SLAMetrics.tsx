import { Clock, AlertTriangle, CheckCircle2, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Proposal } from "@/data/dataAdapter";

interface SLAConfig { label: string; maxDias: number; }

const SLA_ETAPA: Record<string, SLAConfig> = {
  "TRAFEGO_PAGO": { label: "Tráfego Pago", maxDias: 1 },
  "EM_QUALIFICACAO": { label: "MQL", maxDias: 3 },
  "QUALIFICADO": { label: "SQL", maxDias: 5 },
  "FOLLOW_UP": { label: "Follow Up", maxDias: 7 },
};

function getSLAStatus(dias: number, maxDias: number): "ok" | "warning" | "overdue" {
  if (dias <= maxDias * 0.6) return "ok";
  if (dias <= maxDias) return "warning";
  return "overdue";
}

interface Props { proposals: Proposal[]; }

export function SLAMetrics({ proposals }: Props) {
  const abertos = proposals.filter(p => p.status === "Aberto");

  const etapaSLA = Object.entries(SLA_ETAPA).map(([etapa, config]) => {
    const leads = abertos.filter(p => p.etapa === etapa);
    const tempos = leads.map(p => p.tempoNaEtapa);
    const media = tempos.length > 0 ? tempos.reduce((a, b) => a + b, 0) / tempos.length : 0;
    const foraDoSLA = leads.filter(p => p.tempoNaEtapa > config.maxDias).length;
    return { etapa, ...config, quantidade: leads.length, media: Math.round(media * 10) / 10, foraDoSLA };
  }).filter(e => e.quantidade > 0);

  const totalForaSLA = etapaSLA.reduce((a, e) => a + e.foraDoSLA, 0);

  return (
    <section className="mt-6 rounded-xl border border-primary/20 bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><Timer className="h-5 w-5 text-primary" /></div>
          <div><h3 className="text-sm font-bold text-foreground">SLA de Atendimento</h3><p className="text-[10px] text-muted-foreground uppercase">Tempo por etapa</p></div>
        </div>
        <div className="text-right"><p className="text-[10px] text-muted-foreground">Fora do SLA</p><p className={cn("text-sm font-bold", totalForaSLA > 0 ? "text-destructive" : "text-primary")}>{totalForaSLA} leads</p></div>
      </div>
      <div className="p-6">
        {etapaSLA.length > 0 && (
          <div className="space-y-2">
            {etapaSLA.map((e, i) => {
              const status = getSLAStatus(e.media, e.maxDias);
              const pct = Math.min((e.media / e.maxDias) * 100, 150);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-32 text-[11px] text-muted-foreground truncate">{e.label}</span>
                  <div className="flex-1 h-5 rounded bg-secondary/50 overflow-hidden">
                    <div className={cn("h-full rounded", status === "ok" ? "bg-primary/60" : status === "warning" ? "bg-warning/60" : "bg-destructive/60")} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <span className={cn("text-xs font-bold w-12 text-right", status === "ok" ? "text-primary" : status === "warning" ? "text-warning" : "text-destructive")}>{e.media}d</span>
                  <span className="text-[10px] text-muted-foreground w-16 text-right">SLA: {e.maxDias}d</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
