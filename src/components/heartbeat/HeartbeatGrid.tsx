import { useState, useMemo } from "react";
import { ScenarioHealth } from "@/hooks/useMakeHeartbeat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle2, XCircle, AlertTriangle, Clock, Zap, ChevronDown, FolderOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { HeartbeatErrorSheet } from "./HeartbeatErrorSheet";

interface Props {
  scenarios: ScenarioHealth[];
  isLoading: boolean;
}

/** Map scenario names to operational categories */
function detectFolder(name: string): string {
  const n = name.toLowerCase();
  // Fluxo de Segurança (check first - specific names)
  if (n.includes("qualificar") || n.includes("desqualificar") || n.includes("reprocessar")) return "🛡️ Fluxo de Segurança";
  // Sync (check before others to catch "webhook solar", "sync sm")
  if (n.includes("sync") || n.includes("transfer") || n.includes("webhook") || n.includes("timer transfer")) return "🔄 Sync / Integrações";
  // Canal de Aquisição (captures + whatsapp inbound)
  if (n.includes("capture") || n.includes("captura") || n.includes("inbound") || n.includes("fluxo 1") || n.includes("fluxo 2")) return "📥 Canal de Aquisição";
  // Agente (previously Robô)
  if (n.includes("agent") || n.includes("robo") || n.includes("sdr") || n.includes("fup") || n.includes("reativacao")) return "🤖 Agente";
  // Auth
  if (n.includes("auth") || n.includes("grap") || n.includes("solarmarket")) return "🔐 Auth";
  // OCR
  if (n.includes("ocr")) return "📄 OCR";
  return "⚙️ Outros";
}

const FOLDER_ORDER = [
  "📥 Canal de Aquisição",
  "🤖 Agente",
  "🔐 Auth",
  "🛡️ Fluxo de Segurança",
  "🔄 Sync / Integrações",
  "📄 OCR",
  "⚙️ Outros",
];

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
    default: return "bg-blue-400";
  }
}

function timelineBlockTooltip(status: string, time: string) {
  const label = status === "success" ? "OK" : status === "error" ? "Erro" : status === "warning" ? "Aviso" : "Idle (sem disparo)";
  const t = new Date(time);
  return `${label} — ${t.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

function folderSummary(items: ScenarioHealth[]) {
  const total = items.length;
  const healthy = items.filter(s => s.uptime >= 99).length;
  const errors = items.reduce((a, s) => a + s.errors, 0);
  const avgUptime = total > 0 ? items.reduce((a, s) => a + s.uptime, 0) / total : 100;
  return { total, healthy, errors, avgUptime };
}

function ScenarioCard({ s, onClick }: { s: ScenarioHealth; onClick: () => void }) {
  return (
    <Card
      className={`border ${statusBg(s.uptime)} transition-colors cursor-pointer hover:ring-2 hover:ring-primary/30`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="truncate mr-2">{s.scenario_name}</span>
          <span className={`text-lg font-bold ${statusColor(s.uptime)}`}>
            {s.uptime.toFixed(1)}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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

        <TooltipProvider delayDuration={100}>
          <div className="flex gap-[1px] h-5 rounded overflow-hidden">
            {s.timeline.map((b, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div
                    className={`flex-1 ${timelineBlockColor(b.status)} hover:opacity-80 transition-opacity cursor-default min-w-[2px]`}
                    onClick={(e) => e.stopPropagation()}
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
  );
}

export function HeartbeatGrid({ scenarios, isLoading }: Props) {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioHealth | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const map = new Map<string, ScenarioHealth[]>();
    for (const s of scenarios) {
      const folder = detectFolder(s.scenario_name);
      const arr = map.get(folder) || [];
      arr.push(s);
      map.set(folder, arr);
    }
    return FOLDER_ORDER
      .filter(f => map.has(f))
      .map(f => ({ folder: f, items: map.get(f)! }));
  }, [scenarios]);

  const toggleFolder = (folder: string) => {
    setCollapsedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

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
    <>
      <div className="space-y-4">
        {grouped.map(({ folder, items }) => {
          const summary = folderSummary(items);
          const isOpen = !collapsedFolders.has(folder);

          return (
            <Collapsible key={folder} open={isOpen} onOpenChange={() => toggleFolder(folder)}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">{folder}</span>
                    <span className="text-xs text-muted-foreground">({summary.total} cenários)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 text-xs">
                      <span className={`font-medium ${summary.avgUptime >= 99 ? "text-emerald-500" : summary.avgUptime >= 90 ? "text-amber-500" : "text-destructive"}`}>
                        {summary.avgUptime.toFixed(1)}%
                      </span>
                      <span className="text-muted-foreground">
                        {summary.healthy}/{summary.total} OK
                      </span>
                      {summary.errors > 0 && (
                        <span className="text-destructive font-medium">{summary.errors} erros</span>
                      )}
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 pt-3">
                  {items.map((s) => (
                    <ScenarioCard key={s.scenario_id} s={s} onClick={() => setSelectedScenario(s)} />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      <HeartbeatErrorSheet
        scenario={selectedScenario}
        onClose={() => setSelectedScenario(null)}
      />
    </>
  );
}
