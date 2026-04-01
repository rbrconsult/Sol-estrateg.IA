import { Bot, AlertTriangle, TrendingUp, CheckCircle, Send, Users, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Proposal } from "@/data/dataAdapter";

interface Props { proposals: Proposal[]; }

export function RobotInsights({ proposals }: Props) {
  const abertos = proposals.filter(p => p.status === "Aberto");
  const qualificados = proposals.filter(p => p.solQualificado).length;
  const leadsQuentes = abertos.filter(p => p.temperatura === "QUENTE").length;

  const destaques = [
    { label: "Qualificados pela Sol", value: qualificados, icon: CheckCircle, color: "text-primary" },
    { label: "Total Leads", value: proposals.length, icon: Send, color: "text-primary" },
    { label: "Leads Abertos", value: abertos.length, icon: Users, color: "text-primary" },
    { label: "Leads Quentes", value: leadsQuentes, icon: Flame, color: "text-warning" },
  ];

  return (
    <section className="mt-6 rounded-xl border border-primary/20 bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border/40 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><Bot className="h-5 w-5 text-primary" /></div>
        <div><h3 className="text-sm font-bold text-foreground">Robôs & Follow-up</h3><p className="text-[10px] text-muted-foreground uppercase">Resumo de performance</p></div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {destaques.map((d, i) => (
            <div key={i} className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <d.icon className={cn("h-3.5 w-3.5", d.color)} />
                <p className="text-[10px] text-muted-foreground uppercase">{d.label}</p>
              </div>
              <p className={cn("text-2xl font-bold tabular-nums", d.color)}>{d.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
