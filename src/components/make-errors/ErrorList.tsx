import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MoreVertical, Search, AlertTriangle } from "lucide-react";
import { MakeError, useMakeErrors } from "@/hooks/useMakeErrors";
import { toast } from "sonner";

const categoryColors: Record<string, string> = {
  "SDR / Qualificação": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "Financeiro": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  "Mensageria": "bg-purple-500/10 text-purple-500 border-purple-500/20",
  "Integração CRM": "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  "Geral Evolve": "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

const statusBadge = (status: string) => {
  switch (status) {
    case "pending": return <Badge variant="destructive" className="text-[10px]">Pendente</Badge>;
    case "reviewing": return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">Em Análise</Badge>;
    case "resolved": return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">Resolvido</Badge>;
    default: return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
};

const executionBadge = (status: string) => {
  switch (status) {
    case "stopped":
      return <Badge className="bg-destructive text-destructive-foreground animate-pulse text-[10px]">🔴 FLUXO PARADO</Badge>;
    case "error_continued":
      return <Badge className="bg-amber-500 text-white text-[10px]">🟠 ERRO (continuou)</Badge>;
    case "warning":
      return <Badge className="bg-yellow-500 text-black text-[10px]">🟡 AVISO</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
};

interface Props {
  errors: MakeError[];
  isLoading: boolean;
  onSelectError: (e: MakeError) => void;
}

export function ErrorList({ errors, isLoading, onSelectError }: Props) {
  const { actionMutation, updateStatusMutation } = useMakeErrors();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [execFilter, setExecFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [confirmAction, setConfirmAction] = useState<{ action: "retry" | "discard"; error: MakeError } | null>(null);

  const categories = useMemo(() => [...new Set(errors.map((e) => e.flow_category).filter(Boolean))], [errors]);

  const filtered = useMemo(() => {
    return errors.filter((e) => {
      if (search && !(e.scenario_name?.toLowerCase().includes(search.toLowerCase()) || e.error_message?.toLowerCase().includes(search.toLowerCase()))) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (execFilter !== "all" && e.execution_status !== execFilter) return false;
      if (categoryFilter !== "all" && e.flow_category !== categoryFilter) return false;
      return true;
    });
  }, [errors, search, statusFilter, execFilter, categoryFilter]);

  if (isLoading) {
    return <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>;
  }

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    actionMutation.mutate({
      action: confirmAction.action,
      executionId: confirmAction.error.execution_id,
      recordId: confirmAction.error.id,
    });
    setConfirmAction(null);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar cenário ou erro..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="reviewing">Em Análise</SelectItem>
            <SelectItem value="resolved">Resolvido</SelectItem>
          </SelectContent>
        </Select>
        <Select value={execFilter} onValueChange={setExecFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="stopped">Fluxo Parado</SelectItem>
            <SelectItem value="error_continued">Erro c/ Continuidade</SelectItem>
            <SelectItem value="warning">Aviso</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg">Nenhum erro encontrado</h3>
          <p className="text-sm text-muted-foreground">Todos os fluxos parecem estar funcionando normalmente.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium text-muted-foreground">Data/Hora</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Categoria</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Cenário</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status Fluxo</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Módulo com Falha</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Tipo</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Tent.</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Resolução</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((err) => {
                const progress = err.total_modules && err.total_modules > 0
                  ? ((err.failed_module_index ?? 0) / err.total_modules) * 100
                  : 0;
                return (
                  <tr
                    key={err.id}
                    className="border-t border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => onSelectError(err)}
                  >
                    <td className="p-3 whitespace-nowrap">
                      {err.occurred_at
                        ? new Date(err.occurred_at).toLocaleDateString("pt-BR") +
                          " " +
                          new Date(err.occurred_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={categoryColors[err.flow_category ?? ""] ?? "text-[10px]"}>
                        {err.flow_category ?? "—"}
                      </Badge>
                    </td>
                    <td className="p-3 max-w-[200px] truncate">{err.scenario_name ?? "—"}</td>
                    <td className="p-3">{executionBadge(err.execution_status)}</td>
                    <td className="p-3">
                      <div className="text-xs">
                        <span className="text-muted-foreground">[{err.module_app}]</span>{" "}
                        {err.module_name}
                      </div>
                      {err.total_modules && err.total_modules > 0 && (
                        <div className="mt-1 h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-destructive rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={
                        err.error_type === "RuntimeError" ? "border-destructive text-destructive" :
                        err.error_type === "ConnectionError" ? "border-amber-500 text-amber-500" :
                        ""
                      }>
                        {err.error_type ?? "—"}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="secondary">{err.attempts ?? 0}</Badge>
                    </td>
                    <td className="p-3">{statusBadge(err.status)}</td>
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onSelectError(err)}>
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: err.id, status: "reviewing" })}>
                            Marcar como Em Análise
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={err.execution_status !== "stopped"}
                            onClick={() => setConfirmAction({ action: "retry", error: err })}
                          >
                            Retry Execução
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={err.execution_status !== "stopped"}
                            onClick={() => setConfirmAction({ action: "discard", error: err })}
                          >
                            Descartar Erro
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info("Alerta na fila ✓")}>
                            Enviar Alerta WhatsApp
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.action === "retry" ? "Retry Execução?" : "Descartar Erro?"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.action === "retry"
                ? "Isso irá re-executar o fluxo parado no Make.com. Tem certeza?"
                : "Isso irá descartar permanentemente a execução incompleta. Tem certeza?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancelar</Button>
            <Button
              variant={confirmAction?.action === "discard" ? "destructive" : "default"}
              onClick={handleConfirmAction}
              disabled={actionMutation.isPending}
            >
              {actionMutation.isPending ? "Processando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
