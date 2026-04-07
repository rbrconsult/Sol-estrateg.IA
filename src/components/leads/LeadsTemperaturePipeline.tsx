import { SolLead } from "@/hooks/useSolData";
import { JOURNEY_ORDER, getEtapaLabel, normalizeTemp } from "@/lib/leads-utils";

interface LeadsTemperaturePipelineProps {
  filtered: SolLead[];
}

export function LeadsTemperaturePipeline({ filtered }: LeadsTemperaturePipelineProps) {
  return (
    <section className="mt-6">
      <div className="rounded-lg border border-border/50 bg-card p-5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Temperatura por Etapa</h3>
        <div className="space-y-3">
          {JOURNEY_ORDER.map((etapa) => {
            const etapaRecords = filtered.filter(r => getEtapaLabel(r) === etapa);
            const quente = etapaRecords.filter(r => normalizeTemp(r.temperatura) === "QUENTE").length;
            const morno = etapaRecords.filter(r => normalizeTemp(r.temperatura) === "MORNO").length;
            const frio = etapaRecords.filter(r => normalizeTemp(r.temperatura) === "FRIO").length;
            const total = etapaRecords.length;
            if (total === 0) return null;
            
            return (
              <div key={etapa}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-muted-foreground truncate w-40">{etapa}</span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">{total}</span>
                </div>
                <div className="flex h-3 rounded overflow-hidden bg-secondary/50">
                  {quente > 0 && <div className="bg-destructive/60 h-full" style={{ width: `${(quente / total) * 100}%` }} />}
                  {morno > 0 && <div className="bg-warning/60 h-full" style={{ width: `${(morno / total) * 100}%` }} />}
                  {frio > 0 && <div className="bg-blue-500/60 h-full" style={{ width: `${(frio / total) * 100}%` }} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
