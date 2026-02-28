import { useState, useEffect } from "react";
import { AlertTriangle, RefreshCw, BarChart3, List, Settings, CheckCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMakeErrors } from "@/hooks/useMakeErrors";
import { ErrorDashboard } from "@/components/make-errors/ErrorDashboard";
import { ErrorList } from "@/components/make-errors/ErrorList";
import { ErrorDetail } from "@/components/make-errors/ErrorDetail";
import { MakeError } from "@/hooks/useMakeErrors";

export default function MakeErrors() {
  const { errorsQuery, syncMutation, resolveAllMutation } = useMakeErrors();
  const [showResolveAll, setShowResolveAll] = useState(false);
  const [selectedError, setSelectedError] = useState<MakeError | null>(null);

  // Auto-sync on mount
  useEffect(() => {
    syncMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const errors = errorsQuery.data ?? [];
  const pendingCount = errors.filter((e) => e.status !== "resolved").length;
  const pendingStopped = errors.filter(
    (e) => e.status === "pending" && e.execution_status === "stopped"
  ).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Erros Make
          </h1>
          <p className="text-sm text-muted-foreground">
            Evolve Energia Solar — Gerenciamento de erros Make.com
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
            Sincronizar Agora
          </Button>
          {pendingCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResolveAll(true)}
              className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Resolver Todos ({pendingCount})
            </Button>
          )}
        </div>
      </div>

      {/* Resolve All Dialog */}
      <Dialog open={showResolveAll} onOpenChange={setShowResolveAll}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver todos os erros?</DialogTitle>
            <DialogDescription>
              Isso marcará {pendingCount} erro(s) pendentes/em análise como resolvidos. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveAll(false)}>Cancelar</Button>
            <Button
              onClick={() => { resolveAllMutation.mutate(); setShowResolveAll(false); }}
              disabled={resolveAllMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {resolveAllMutation.isPending ? "Resolvendo..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard" className="gap-1">
            <BarChart3 className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="errors" className="gap-1 relative">
            <List className="h-4 w-4" /> Erros
            {pendingStopped > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
                {pendingStopped}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ErrorDashboard errors={errors} isLoading={errorsQuery.isLoading} />
        </TabsContent>

        <TabsContent value="errors">
          <ErrorList
            errors={errors}
            isLoading={errorsQuery.isLoading}
            onSelectError={setSelectedError}
          />
        </TabsContent>
      </Tabs>

      <ErrorDetail
        error={selectedError}
        onClose={() => setSelectedError(null)}
      />
    </div>
  );
}
