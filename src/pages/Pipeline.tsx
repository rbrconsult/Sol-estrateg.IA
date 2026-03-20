import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useOrgFilteredProposals } from "@/hooks/useOrgFilteredProposals";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { HelpButton } from "@/components/HelpButton";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { PageFloatingFilter } from "@/components/filters/PageFloatingFilter";
import { useMemo } from "react";

const Pipeline = () => {
  const { proposals: allProposals, lastUpdate, isLoading, error, refetch, isFetching, enrichedCount, orgFilterActive } = useOrgFilteredProposals();
  const { selectedOrgName } = useOrgFilter();
  const gf = useGlobalFilters();

  const proposals = useMemo(() => gf.filterProposals(allProposals), [allProposals, gf.filterProposals]);

  const hasData = proposals.length > 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pipeline</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Visão Kanban • Atualizado: {lastUpdate}</p>
          </div>
          <div className="flex items-center gap-2">
            {orgFilterActive && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                🏢 {selectedOrgName}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {proposals.length} propostas
            </Badge>
            <HelpButton moduleId="pipeline" label="Ajuda do Pipeline" />
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="text-muted-foreground hover:text-foreground">
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      <PageFloatingFilter
        filters={gf.filters} hasFilters={gf.hasFilters} clearFilters={gf.clearFilters}
        setPeriodo={gf.setPeriodo} setDateFrom={gf.setDateFrom} setDateTo={gf.setDateTo}
        setTemperatura={gf.setTemperatura} setSearchTerm={gf.setSearchTerm} setEtapa={gf.setEtapa}
        config={{ showPeriodo: true, showTemperatura: true, showSearch: true, showEtapa: true, searchPlaceholder: "Buscar lead..." }}
      />

      {error && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="flex items-center justify-between">
            <span>Erro ao carregar dados: {error.message}</span>
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} className="ml-4">
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {hasData && !error && (
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-chart-2/20 px-3 py-1 text-sm text-chart-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-chart-2" />
            {proposals.length} propostas carregadas
          </span>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Carregando dados...
        </div>
      )}

      {hasData && <KanbanBoard proposals={proposals} />}

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
