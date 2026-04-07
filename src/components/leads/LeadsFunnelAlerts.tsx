import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SolLead } from "@/hooks/useSolData";

interface LeadsFunnelAlertsProps {
  funnelData: Array<{ etapa: string; quantidade: number }>;
  maxFunnel: number;
  funnelSum: number;
  filteredLength: number;
  alerts: Array<{
    id: string;
    type: "alert" | "info" | "success";
    title: string;
    desc: string;
    leads: SolLead[];
  }>;
  onLeadClick: (lead: SolLead) => void;
}

export function LeadsFunnelAlerts({ funnelData, maxFunnel, funnelSum, filteredLength, alerts, onLeadClick }: LeadsFunnelAlertsProps) {
  const [funnelVisible, setFunnelVisible] = useState(false);
  const funnelRef = useRef<HTMLDivElement>(null);
  const [openAlertIds, setOpenAlertIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const el = funnelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setFunnelVisible(true); }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <div ref={funnelRef} className="rounded-lg border border-border/50 bg-card p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Funil por Etapa (Jornada)</h3>
          <p className="text-[10px] text-muted-foreground/90 leading-snug mb-3">
            Cada lead conta <span className="font-medium text-foreground">uma vez</span> na etapa atual{" "}
            (<span className="font-medium text-foreground">etapa_funil</span>). Se vier vazio, usamos{" "}
            <span className="font-medium text-foreground">TRAFEGO PAGO</span> como entrada — por isso muitos leads podem aparecer nessa faixa.
            Soma das barras = <span className="font-semibold tabular-nums">{funnelSum}</span> (igual a {filteredLength} no recorte filtrado).
          </p>
          <div className="space-y-2.5">
            {funnelData.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-40 text-[11px] text-muted-foreground truncate">{f.etapa}</span>
                <div className="flex-1 h-6 rounded bg-secondary/50 overflow-hidden">
                  <div
                    className="h-full rounded bg-primary/70 flex items-center justify-end pr-2 transition-all duration-1000 ease-out"
                    style={{
                      width: funnelVisible ? `${(f.quantidade / maxFunnel) * 100}%` : "0%",
                      transitionDelay: `${i * 80}ms`,
                    }}
                  >
                    <span className="text-[10px] font-semibold text-primary-foreground">{f.quantidade}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Alertas & Insights</h3>
        {alerts.map((ins) => {
          const borderCls = ins.type === "alert" ? "border-l-destructive/60" : ins.type === "info" ? "border-l-warning/60" : "border-l-emerald-500/60";
          const labelCls = ins.type === "alert" ? "text-destructive" : ins.type === "info" ? "text-warning" : "text-emerald-500";
          return (
            <Collapsible
              key={ins.id}
              open={!!openAlertIds[ins.id]}
              onOpenChange={(o) => setOpenAlertIds(s => ({ ...s, [ins.id]: o }))}
            >
              <div className={`rounded-lg border border-border/50 bg-card border-l-2 ${borderCls} overflow-hidden`}>
                <CollapsibleTrigger className="w-full text-left p-4 hover:bg-muted/40 transition-colors flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${labelCls}`}>
                      {ins.type === "alert" ? "Atenção" : ins.type === "info" ? "Info" : "Positivo"}
                    </p>
                    <p className="text-sm font-medium text-foreground">{ins.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">{ins.desc}</p>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", openAlertIds[ins.id] && "rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-0 border-t border-border/40 max-h-[220px] overflow-y-auto">
                    <p className="text-[10px] text-muted-foreground py-2">
                      {ins.leads.length} lead(s) — clique para abrir o painel
                    </p>
                    <ul className="space-y-1">
                      {ins.leads.slice(0, 80).map((r, i) => (
                        <li key={r.telefone ? r.telefone + i : i}>
                          <button
                            type="button"
                            className="w-full text-left rounded-md px-2 py-1.5 text-xs hover:bg-secondary/80 flex justify-between gap-2"
                            onClick={() => onLeadClick(r)}
                          >
                            <span className="font-medium truncate">{r.nome || r.telefone}</span>
                            <span className="text-muted-foreground font-mono shrink-0">{r.telefone?.slice(-8)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    {ins.leads.length > 80 && (
                      <p className="text-[10px] text-muted-foreground pt-2">Mostrando 80 de {ins.leads.length}. Use filtros para reduzir.</p>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    </section>
  );
}
