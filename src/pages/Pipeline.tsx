import { useMemo } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEnrichedProposals } from "@/hooks/useEnrichedProposals";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { HelpButton } from "@/components/HelpButton";

const Pipeline = () => {
  const { proposals, lastUpdate, isLoading, error, refetch, isFetching, enrichedCount } = useEnrichedProposals();

  const hasData = proposals.length > 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pipeline</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Visão Kanban • Atualizado: {lastUpdate}</p>
          </div>
          <div className="flex items-center gap-2">
            <HelpButton moduleId="pipeline" label="Ajuda do Pipeline" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="flex items-center justify-between">
            <span>Erro ao carregar dados: {error.message}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="ml-4"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Success State with Data */}
      {hasData && !error && (
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-chart-2/20 px-3 py-1 text-sm text-chart-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-chart-2" />
            {proposals.length} propostas carregadas
          </span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Carregando dados do Google Sheets...
        </div>
      )}

      {/* Kanban Board */}
      {hasData && <KanbanBoard proposals={proposals} />}

      {/* Empty State */}
      {!isLoading && !hasData && !error && (
        <Alert className="border-warning/50 bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription>
            Nenhum dado encontrado. Verifique se a planilha contém dados.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default Pipeline;
