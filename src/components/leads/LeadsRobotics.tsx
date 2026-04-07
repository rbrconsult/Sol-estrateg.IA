import { Bot, Zap, MessageSquare, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMinutes } from "@/lib/leads-utils";
import { safeToFixed } from "@/lib/formatters";

interface LeadsRoboticsProps {
  robotData: {
    robots: Array<{
      key: string;
      name: string;
      blurb: string;
      icon: string;
      total: number;
      responderam: number;
      taxa: number;
      tempoMedioMin: number;
    }>;
    mediaFups: number;
    fupEntries: number;
    mediaFupsAteResp: number;
    respondidosCount: number;
    excessoFups: number;
    totalEnviados: number;
    totalResponderam: number;
    qualificados: number;
  };
}

export function LeadsRobotics({ robotData }: LeadsRoboticsProps) {
  return (
    <section className="mt-6 rounded-xl border border-primary/20 bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border/40 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground tracking-tight">Robôs & Follow-up</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sol · FUP Frio · Conversão</p>
        </div>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-medium flex items-center gap-1.5">
            <Zap className="h-3 w-3" /> Comparativo de Robôs
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {robotData.robots.map((robot) => (
              <div key={robot.key} className="rounded-lg border border-border/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{robot.icon}</span>
                  <span className="text-xs font-semibold text-foreground">{robot.name}</span>
                </div>
                <p className="text-[9px] text-muted-foreground leading-snug mb-3">{robot.blurb}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Leads</p>
                    <p className="text-xl font-bold text-foreground tabular-nums">{robot.total}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Taxa Resp.</p>
                    <p className={cn("text-xl font-bold tabular-nums", robot.taxa >= 30 ? "text-primary" : robot.taxa >= 15 ? "text-warning" : robot.total === 0 ? "text-muted-foreground" : "text-destructive")}>
                      {robot.total > 0 ? `${safeToFixed(robot.taxa, 0)}%` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">1ª resp. (méd.)</p>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      {robot.tempoMedioMin > 0 ? formatMinutes(robot.tempoMedioMin) : "—"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                  <div className="h-full rounded-full bg-primary/60 transition-all duration-700" style={{ width: `${Math.min(robot.taxa, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-medium flex items-center gap-1.5">
            <MessageSquare className="h-3 w-3" /> Acompanhamento Ativo
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-border/50 p-3">
              <p className="text-[10px] text-muted-foreground uppercase">Média FUPs/Lead</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">{safeToFixed(robotData.mediaFups, 1)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{robotData.fupEntries} leads</p>
            </div>
            <div className="rounded-lg border border-border/50 p-3">
              <p className="text-[10px] text-muted-foreground uppercase">FUPs até Resposta</p>
              <p className="text-2xl font-bold text-primary tabular-nums">{safeToFixed(robotData.mediaFupsAteResp, 1)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{robotData.respondidosCount} responderam</p>
            </div>
            <div className="rounded-lg border border-border/50 p-3">
              <p className="text-[10px] text-muted-foreground uppercase">Excesso (+5 FUPs)</p>
              <p className={cn("text-2xl font-bold tabular-nums", robotData.excessoFups === 0 ? "text-primary" : "text-warning")}>
                {robotData.excessoFups === 0 ? "✓" : robotData.excessoFups}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">{robotData.excessoFups === 0 ? "Nenhum excesso" : "sem resposta"}</p>
            </div>
            <div className="rounded-lg border border-border/50 p-3">
              <p className="text-[10px] text-muted-foreground uppercase">Taxa resposta FUP</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {robotData.fupEntries > 0 ? safeToFixed((robotData.respondidosCount / robotData.fupEntries) * 100, 0) : 0}%
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Telefones únicos com FUP ≥1</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-medium flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3" /> Funil de Conversão dos Robôs
          </p>
          <p className="text-[9px] text-muted-foreground/85 mb-3 leading-snug">
            «Enviados» = com data de cadastro. «Responderam» = respondeu no status.
            «Qualificados» = etapa/status MQL.
          </p>
          <div className="space-y-2">
            {[
              { label: "Enviados", value: robotData.totalEnviados, color: "bg-primary/40" },
              { label: "Responderam", value: robotData.totalResponderam, color: "bg-primary/60" },
              { label: "Qualificados", value: robotData.qualificados, color: "bg-primary/80" },
            ].map((step, i, arr) => {
              const max = Math.max(...arr.map(s => s.value), 1);
              const pct = (step.value / max) * 100;
              const prevValue = i > 0 ? arr[i - 1].value : step.value;
              const convRate = prevValue > 0 && i > 0 ? ((step.value / prevValue) * 100).toFixed(0) : null;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-24 text-[11px] text-muted-foreground">{step.label}</span>
                  <div className="flex-1 h-6 rounded bg-secondary/40 overflow-hidden">
                    <div className={cn("h-full rounded transition-all duration-700", step.color)} style={{ width: `${Math.max(pct, 2)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-foreground w-10 text-right tabular-nums">{step.value}</span>
                  {convRate && <span className="text-[10px] text-muted-foreground w-14 text-right">{convRate}%</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
