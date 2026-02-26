import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MakeError, useMakeErrors } from "@/hooks/useMakeErrors";
import { toast } from "sonner";

interface Props {
  error: MakeError | null;
  onClose: () => void;
}

export function ErrorDetail({ error, onClose }: Props) {
  const { updateStatusMutation, actionMutation } = useMakeErrors();
  const [status, setStatus] = useState(error?.status ?? "pending");
  const [notes, setNotes] = useState(error?.resolution_notes ?? "");

  useEffect(() => {
    if (error) {
      setStatus(error.status);
      setNotes(error.resolution_notes ?? "");
    }
  }, [error]);

  if (!error) return null;

  const progress = error.total_modules && error.total_modules > 0
    ? ((error.failed_module_index ?? 0) / error.total_modules) * 100
    : 0;

  const handleSave = () => {
    updateStatusMutation.mutate({ id: error.id, status, resolution_notes: notes });
  };

  const isStopped = error.execution_status === "stopped";

  return (
    <Sheet open={!!error} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">Diagnóstico do Fluxo</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Flow Diagnosis */}
          <div className="rounded-lg border border-border p-4 space-y-4 bg-muted/20">
            <div>
              <p className="text-xs text-muted-foreground">Fluxo</p>
              <p className="font-semibold">{error.scenario_name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Categoria</p>
              <p className="font-medium">{error.flow_category ?? "—"}</p>
            </div>

            {/* Progress */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Progresso no fluxo</p>
              <div className="relative h-2 w-full bg-muted rounded-full">
                <div className="absolute h-full bg-primary/30 rounded-full" style={{ width: `${progress}%` }} />
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-destructive border-2 border-background"
                  style={{ left: `calc(${progress}% - 6px)` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Módulo {error.failed_module_index ?? "?"} de {error.total_modules ?? "?"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">App do módulo</p>
                <p className="font-medium">{error.module_app ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Módulo com falha</p>
                <p className="font-medium">{error.module_name ?? "—"}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Status do fluxo</p>
              {isStopped ? (
                <Badge className="bg-destructive text-destructive-foreground">
                  🔴 FLUXO PARADO — aguardando ação
                </Badge>
              ) : (
                <Badge className="bg-amber-500 text-white">
                  🟠 ERRO — fluxo continuou
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Duração até a falha</p>
                <p className="font-medium">{error.execution_duration_seconds ? `${error.execution_duration_seconds}s` : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tentativas</p>
                <p className="font-medium">{error.attempts ?? 0}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Error Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Detalhes do Erro</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <Badge variant="outline">{error.error_type ?? "—"}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Código</p>
                <p className="font-mono text-sm">{error.error_code ?? "—"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Mensagem completa</p>
              <div className="bg-muted rounded-lg p-3 max-h-40 overflow-y-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                  {error.error_message ?? "—"}
                </pre>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ocorreu em</p>
              <p className="text-sm">
                {error.occurred_at
                  ? new Date(error.occurred_at).toLocaleString("pt-BR")
                  : "—"}
              </p>
            </div>
          </div>

          <Separator />

          {/* Resolution */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Resolução</h3>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="reviewing">Em Análise</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Notas de resolução</p>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Descreva a causa e solução..." rows={3} />
            </div>
            <Button onClick={handleSave} disabled={updateStatusMutation.isPending} className="w-full">
              {updateStatusMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              disabled={!isStopped || actionMutation.isPending}
              onClick={() => actionMutation.mutate({ action: "retry", executionId: error.execution_id, recordId: error.id })}
            >
              {actionMutation.isPending ? "Processando..." : "🔄 Retry Execução"}
            </Button>
            <Button
              variant="destructive"
              disabled={!isStopped || actionMutation.isPending}
              onClick={() => actionMutation.mutate({ action: "discard", executionId: error.execution_id, recordId: error.id })}
            >
              🗑 Descartar Erro
            </Button>
            <Button
              variant="secondary"
              onClick={() => toast.info("Alerta na fila ✓")}
            >
              📲 Enviar Alerta WhatsApp
            </Button>
            {!isStopped && (
              <p className="text-xs text-muted-foreground text-center">
                Retry e Descartar só estão disponíveis para fluxos parados (execuções incompletas).
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
