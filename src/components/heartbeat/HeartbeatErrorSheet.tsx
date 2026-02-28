import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScenarioHealth } from "@/hooks/useMakeHeartbeat";
import { MakeError, useMakeErrors } from "@/hooks/useMakeErrors";
import { ErrorDetail } from "@/components/make-errors/ErrorDetail";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle2, Copy, ExternalLink, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  scenario: ScenarioHealth | null;
  onClose: () => void;
}

function statusBadge(status: string) {
  switch (status) {
    case "stopped":
      return <Badge className="bg-destructive text-destructive-foreground text-[10px]">Parado</Badge>;
    case "error_continued":
      return <Badge className="bg-amber-500 text-white text-[10px]">Erro</Badge>;
    case "warning":
      return <Badge className="bg-amber-400 text-black text-[10px]">Aviso</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
}

export function HeartbeatErrorSheet({ scenario, onClose }: Props) {
  const navigate = useNavigate();
  const { errorsQuery } = useMakeErrors();
  const [selectedError, setSelectedError] = useState<MakeError | null>(null);

  if (!scenario) return null;

  const allErrors = errorsQuery.data ?? [];
  const scenarioErrors = allErrors
    .filter((e) => e.scenario_id === scenario.scenario_id)
    .slice(0, 20); // Show last 20

  const pendingCount = scenarioErrors.filter((e) => e.status === "pending").length;
  const stoppedCount = scenarioErrors.filter((e) => e.execution_status === "stopped").length;

  const goToMakeErrors = () => {
    onClose();
    navigate("/make-errors");
  };

  return (
    <>
      <Sheet open={!!scenario} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-left flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {scenario.scenario_name}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-5 mt-5">
            {/* Summary KPIs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border p-3 text-center bg-muted/20">
                <CheckCircle2 className="h-4 w-4 mx-auto text-emerald-500 mb-1" />
                <p className="text-lg font-bold">{scenario.success}</p>
                <p className="text-[10px] text-muted-foreground">Sucesso</p>
              </div>
              <div className="rounded-lg border border-border p-3 text-center bg-muted/20">
                <XCircle className="h-4 w-4 mx-auto text-destructive mb-1" />
                <p className="text-lg font-bold">{scenario.errors}</p>
                <p className="text-[10px] text-muted-foreground">Erros</p>
              </div>
              <div className="rounded-lg border border-border p-3 text-center bg-muted/20">
                <AlertTriangle className="h-4 w-4 mx-auto text-amber-500 mb-1" />
                <p className="text-lg font-bold">{scenario.warnings}</p>
                <p className="text-[10px] text-muted-foreground">Avisos</p>
              </div>
            </div>

            {/* Uptime + metadata */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Uptime 24h</span>
              <span className={`font-bold ${scenario.uptime >= 99 ? "text-emerald-500" : scenario.uptime >= 90 ? "text-amber-500" : "text-destructive"}`}>
                {scenario.uptime.toFixed(1)}%
              </span>
            </div>

            {stoppedCount > 0 && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm">
                <span className="font-semibold text-destructive">⚠ {stoppedCount} execução(ões) parada(s)</span>
                <span className="text-muted-foreground"> — requerem ação manual</span>
              </div>
            )}

            <Separator />

            {/* Recent Errors */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">
                  Erros Recentes
                  {pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-2 text-[10px]">{pendingCount} pendentes</Badge>
                  )}
                </h3>
              </div>

              {scenarioErrors.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum erro registrado para este cenário.
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {scenarioErrors.map((err) => (
                    <button
                      key={err.id}
                      onClick={() => setSelectedError(err)}
                      className="w-full text-left rounded-lg border border-border p-3 hover:bg-muted/40 transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {statusBadge(err.execution_status)}
                          <span className="text-xs font-mono text-muted-foreground truncate max-w-[140px]">
                            {err.execution_id}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {err.occurred_at ? new Date(err.occurred_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {err.module_name && err.module_name !== "Unknown"
                          ? `${err.module_name} — ${err.error_message ?? ""}`
                          : err.error_message ?? "Erro na execução"
                        }
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Go to full page */}
            <Button variant="outline" className="w-full" onClick={goToMakeErrors}>
              Ver todos os erros <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Nested ErrorDetail sheet */}
      <ErrorDetail error={selectedError} onClose={() => setSelectedError(null)} />
    </>
  );
}
