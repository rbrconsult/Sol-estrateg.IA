import { useEffect } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpButton } from "@/components/HelpButton";
import { useMakeHeartbeat } from "@/hooks/useMakeHeartbeat";
import { HeartbeatSummary } from "@/components/heartbeat/HeartbeatSummary";
import { HeartbeatGrid } from "@/components/heartbeat/HeartbeatGrid";

export default function Monitoramento() {
  const { heartbeatQuery, healthData, syncMutation } = useMakeHeartbeat();

  useEffect(() => {
    syncMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" /> Monitoramento
          </h1>
          <p className="text-sm text-muted-foreground">
            Heartbeat em tempo real dos cenários Make.com
          </p>
        </div>
        <div className="flex items-center gap-3">
          {syncMutation.data?.syncedAt && (
            <span className="text-xs text-muted-foreground">
              Última sync: {new Date(syncMutation.data.syncedAt).toLocaleTimeString("pt-BR")}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            Sincronizar
          </Button>
          <HelpButton moduleId="monitoramento" label="Ajuda" />
        </div>
      </div>

      <HeartbeatSummary scenarios={healthData} isLoading={heartbeatQuery.isLoading} />

      <div>
        <h2 className="text-lg font-semibold mb-3">Fluxos Principais (24h)</h2>
        <HeartbeatGrid scenarios={healthData} isLoading={heartbeatQuery.isLoading} />
      </div>
    </div>
  );
}
