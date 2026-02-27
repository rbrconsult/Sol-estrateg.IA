import { ScenarioHealth } from "@/hooks/useMakeHeartbeat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, XCircle, AlertTriangle, Clock, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  scenarios: ScenarioHealth[];
  isLoading: boolean;
}

function statusColor(uptime: number) {
  if (uptime >= 99) return "text-emerald-500";
  if (uptime >= 90) return "text-amber-500";
  return "text-destructive";
}

function statusBg(uptime: number) {
  if (uptime >= 99) return "bg-emerald-500/10 border-emerald-500/30";
  if (uptime >= 90) return "bg-amber-500/10 border-amber-500/30";
  return "bg-destructive/10 border-destructive/30";
}

function timelineBlockColor(status: string) {
  switch (status) {
    case "success": return "bg-emerald-500";
    case "error": return "bg-destructive";
    case "warning": return "bg-amber-500";
    default: return "bg-muted";
  }
}

function timelineBlockTooltip(status: string, time: string) {
  const label = status === "success" ? "OK" : status === "error" ? "Erro" : status === "warning" ? "Aviso" : "Sem execução";
  const t = new Date(time);
  return `${label} — ${t.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

export function HeartbeatGrid({ scenarios, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2"><div className="h-5 w-40 bg-muted rounded" /></CardHeader>
            <CardContent><div className="h-20 bg-muted rounded" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (scenarios.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Zap className="h-10 w-10 mb-3" />
          <p className="text-sm">Nenhum dado de heartbeat ainda. Clique em "Sincronizar" para buscar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {scenarios.map((s) => (
        <Card key={s.scenario_id} className={`border ${statusBg(s.uptime)} transition-colors`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="truncate mr-2">{s.scenario_name}</span>
              <span className={`text-lg font-bold ${statusColor(s.uptime)}`}>
                {s.uptime.toFixed(1)}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* KPI row */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>{s.success}</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5 text-destructive" />
                <span>{s.errors}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span>{s.warnings}</span>
              </div>
            </div>

            {/* Timeline bar */}
            <TooltipProvider delayDuration={100}>
              <div className="flex gap-[1px] h-6 rounded overflow-hidden">
                {s.timeline.map((b, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div
                        className={`flex-1 ${timelineBlockColor(b.status)} hover:opacity-80 transition-opacity cursor-default min-w-[2px]`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {timelineBlockTooltip(b.status, b.time)}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>24h atrás</span>
                <span>agora</span>
              </div>
            </TooltipProvider>

            {/* Last events */}
            <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {s.lastSuccess ? (
                  <span>
                    OK {formatDistanceToNow(new Date(s.lastSuccess), { addSuffix: true, locale: ptBR })}
                  </span>
                ) : (
                  <span>Sem sucesso</span>
                )}
              </div>
              {s.avgDuration != null && (
                <span>⌀ {s.avgDuration.toFixed(0)}s</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
