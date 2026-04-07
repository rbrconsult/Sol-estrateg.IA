import { useMemo, useState } from "react";
import { RefreshCw, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { HelpButton } from "@/components/HelpButton";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { PageFloatingFilter } from "@/components/filters/PageFloatingFilter";
import { useCommercialProposals } from "@/hooks/useCommercialProposals";
import { DataTrustFooter } from "@/components/metrics/DataTrustFooter";
import { isOportunidadeNaMesaDiretoria } from "@/lib/oportunidadeMesa";

type StatusView = "abertos" | "ganhos" | "perdidos" | "excluidos";

const Pipeline = () => {
  const { proposals: commercialProposals, isLoading, error, projectCount, dataUpdatedAt } = useCommercialProposals();
  const gf = useGlobalFilters();
  const [statusView, setStatusView] = useState<StatusView>("abertos");

  const allProposals = useMemo(
    () => gf.filterProposals(commercialProposals),
    [commercialProposals, gf.filterProposals],
  );

  const counts = useMemo(
    () => ({
      abertos: allProposals.filter((p) => p.status === "Aberto").length,
      ganhos: allProposals.filter((p) => p.status === "Ganho").length,
      perdidos: allProposals.filter((p) => p.status === "Perdido").length,
      excluidos: allProposals.filter((p) => p.status === "Excluido").length,
    }),
    [allProposals],
  );

  const proposalsForKanban = useMemo(() => {
    if (statusView === "abertos") return allProposals.filter((p) => p.status === "Aberto");
    if (statusView === "ganhos") return allProposals.filter((p) => p.status === "Ganho");
    if (statusView === "excluidos") return allProposals.filter((p) => p.status === "Excluido");
    return allProposals.filter((p) => p.status === "Perdido");
  }, [allProposals, statusView]);

  const mesaDiretoriaCount = useMemo(
    () => allProposals.filter(isOportunidadeNaMesaDiretoria).length,
    [allProposals],
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pipeline</h1>
          <p className="text-xs md:text-sm text-muted-foreground max-w-2xl">
            Visão Kanban · Solar Market · <span className="font-medium text-foreground">sol_projetos_sync</span> (1 card por{" "}
            <span className="font-medium text-foreground">project_id</span>). A aba «Abertos» usa o status da sync: sem
            ganho/perda/exclusão explícitos no SM, o registro cai em Aberto — o número pode ser maior que as oportunidades
            reais «na mesa».
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {proposalsForKanban.length} itens
          </Badge>
          <HelpButton moduleId="pipeline" label="Ajuda do Pipeline" />
        </div>
      </div>

      <Tabs value={statusView} onValueChange={(v) => setStatusView(v as StatusView)}>
        <TabsList>
          <TabsTrigger value="abertos">Abertos ({counts.abertos})</TabsTrigger>
          <TabsTrigger value="ganhos">Ganhos ({counts.ganhos})</TabsTrigger>
          <TabsTrigger value="perdidos">Perdidos ({counts.perdidos})</TabsTrigger>
          <TabsTrigger value="excluidos">Excluidos ({counts.excluidos})</TabsTrigger>
        </TabsList>
      </Tabs>

      {statusView === "abertos" && counts.abertos > 0 && (
        <Alert className="border-primary/20 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">{counts.abertos} abertos (sync)</span> — inclui cadastros que o SM
            ainda não fechou como ganho ou perda. Para leitura de diretoria,{" "}
            <span className="font-medium text-foreground">{mesaDiretoriaCount} na mesa</span> (regra: valor ou kWp preenchidos,
            ou etapa a partir de qualificado/contato/proposta/negociação). Detalhe em{" "}
            <span className="font-medium text-foreground">Contratos fechados</span>.
          </AlertDescription>
        </Alert>
      )}

      <PageFloatingFilter
        filters={gf.filters}
        hasFilters={gf.hasFilters}
        clearFilters={gf.clearFilters}
        setPeriodo={gf.setPeriodo}
        setDateFrom={gf.setDateFrom}
        setDateTo={gf.setDateTo}
        setTemperatura={gf.setTemperatura}
        setSearchTerm={gf.setSearchTerm}
        setEtapa={gf.setEtapa}
        setStatus={gf.setStatus}
        config={{
          showPeriodo: true,
          showTemperatura: true,
          showSearch: true,
          showEtapa: false,
          showStatus: true,
          searchPlaceholder: "Buscar cliente ou vendedor...",
        }}
      />

      {error && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription>Erro ao carregar dados: {(error as Error).message}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-8">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Carregando dados...
        </div>
      )}

      {!isLoading && proposalsForKanban.length === 0 && !error && (
        <Alert className="border-muted bg-muted/30">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <AlertDescription>
            {projectCount === 0
              ? "Aguardando sincronização — sol_projetos_sync será populada pelo cron-sync."
              : "Nenhum projeto encontrado para a visualização e filtros selecionados."}
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && proposalsForKanban.length > 0 && <KanbanBoard proposals={proposalsForKanban} />}

      <DataTrustFooter
        lines={[
          {
            label: "Comercial",
            source: "sol_projetos_sync (1 card por project_id)",
            fetchedAt: dataUpdatedAt,
            extra: `${allProposals.length} projetos após filtros globais`,
          },
        ]}
      />
    </div>
  );
};

export default Pipeline;
