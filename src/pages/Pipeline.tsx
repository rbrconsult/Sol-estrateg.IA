import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, AlertCircle, LayoutDashboard, Kanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGoogleSheetsData } from "@/hooks/useGoogleSheetsData";
import { adaptSheetData } from "@/data/dataAdapter";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";

const Pipeline = () => {
  const { data: sheetsData, isLoading, error, refetch, isFetching } = useGoogleSheetsData();

  const { proposals, lastUpdate } = useMemo(() => {
    if (sheetsData?.data && sheetsData.data.length > 0) {
      const adapted = adaptSheetData(sheetsData.data);
      return {
        proposals: adapted,
        lastUpdate: new Date(sheetsData.lastUpdate).toLocaleString('pt-BR')
      };
    }
    return {
      proposals: [],
      lastUpdate: new Date().toLocaleString('pt-BR')
    };
  }, [sheetsData]);

  const hasData = proposals.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1800px] px-6 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-glow-primary">
                <span className="text-xl font-bold text-primary-foreground">E</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Pipeline
                </h1>
                <p className="text-sm text-muted-foreground">Visão Kanban dos Projetos</p>
              </div>
            </div>

            {/* Navigation and Status */}
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/">
                <Button variant="outline" className="border-border bg-background">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  BI Estratégico
                </Button>
              </Link>
              
              <Button variant="default" disabled>
                <Kanban className="mr-2 h-4 w-4" />
                Pipeline
              </Button>

              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Atualizado: {lastUpdate}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1800px] px-6 py-8">
        {/* Error State */}
        {error && (
          <Alert className="mb-6 border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="flex items-center justify-between text-red-200">
              <span>Erro ao carregar dados: {error.message}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="ml-4 text-red-200 hover:text-red-100 hover:bg-red-500/20"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Success State with Data */}
        {hasData && !error && (
          <div className="mb-6 flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              {proposals.length} propostas carregadas
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mb-6 flex items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Carregando dados do Google Sheets...
          </div>
        )}

        {/* Kanban Board */}
        {hasData && <KanbanBoard proposals={proposals} />}

        {/* Empty State */}
        {!isLoading && !hasData && !error && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-200">
              Nenhum dado encontrado. Verifique se a planilha contém dados.
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  );
};

export default Pipeline;
