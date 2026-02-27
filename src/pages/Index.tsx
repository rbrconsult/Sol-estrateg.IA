import { useState, useMemo } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { isWithinInterval, parseISO, isValid } from "date-fns";
import { Header } from "@/components/dashboard/Header";
import { ExecutiveKPIs } from "@/components/dashboard/ExecutiveKPIs";
import { GoalProgress } from "@/components/dashboard/GoalProgress";
import { HealthScore } from "@/components/dashboard/HealthScore";
import { StrategicAlerts } from "@/components/dashboard/StrategicAlerts";
import { StrategicFunnel } from "@/components/dashboard/StrategicFunnel";
import { PowerFunnel } from "@/components/dashboard/PowerFunnel";
import { ComercialResponsavelStats } from "@/components/dashboard/ComercialResponsavelStats";
import { VendedorFunnel } from "@/components/dashboard/VendedorFunnel";
import { VendedorRanking } from "@/components/dashboard/VendedorRanking";
import { TrendsChart } from "@/components/dashboard/TrendsChart";
import { useGoogleSheetsData } from "@/hooks/useGoogleSheetsData";
import {
  adaptSheetData,
  extractVendedores,
  extractPreVendedores,
  getKPIs,
  getFunnelData,
  getPowerFunnelData,
  getVendedorPerformance,
  getPreVendedorPerformance,
  getMonthlyData
} from "@/data/dataAdapter";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DateRange, DateFilterPreset } from "@/components/dashboard/DateFilter";
import { HelpButton } from "@/components/HelpButton";

const STORAGE_KEY = "sol_insights_meta";

const Index = () => {
  const [selectedVendedor, setSelectedVendedor] = useState("todos");
  const [selectedPreVendedor, setSelectedPreVendedor] = useState("todos");
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [datePreset, setDatePreset] = useState<DateFilterPreset>("all");

  const { data: sheetsData, isLoading, error, refetch, isFetching } = useGoogleSheetsData();

  const handleDateRangeChange = (range: DateRange, preset: DateFilterPreset) => {
    setDateRange(range);
    setDatePreset(preset);
  };

  const { proposals, vendedores, preVendedores, lastUpdate } = useMemo(() => {
    if (sheetsData?.data && sheetsData.data.length > 0) {
      const adapted = adaptSheetData(sheetsData.data);
      return {
        proposals: adapted,
        vendedores: extractVendedores(adapted),
        preVendedores: extractPreVendedores(adapted),
        lastUpdate: new Date(sheetsData.lastUpdate).toLocaleString('pt-BR')
      };
    }
    return { proposals: [], vendedores: [], preVendedores: [], lastUpdate: new Date().toLocaleString('pt-BR') };
  }, [sheetsData]);

  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      if (selectedVendedor !== "todos" && p.representante !== selectedVendedor) return false;
      if (selectedPreVendedor !== "todos" && p.responsavel !== selectedPreVendedor) return false;
      if (dateRange.from) {
        const proposalDate = p.dataCriacaoProposta ? parseISO(p.dataCriacaoProposta) : null;
        if (!proposalDate || !isValid(proposalDate)) return false;
        const interval = { start: dateRange.from, end: dateRange.to || dateRange.from };
        if (!isWithinInterval(proposalDate, interval)) return false;
      }
      return true;
    });
  }, [proposals, selectedVendedor, selectedPreVendedor, dateRange]);

  const kpis = useMemo(() => getKPIs(filteredProposals), [filteredProposals]);
  const funnelData = useMemo(() => getFunnelData(filteredProposals), [filteredProposals]);
  const powerFunnelData = useMemo(() => getPowerFunnelData(filteredProposals), [filteredProposals]);
  const vendedorPerformance = useMemo(() => getVendedorPerformance(filteredProposals), [filteredProposals]);
  const preVendedorPerformance = useMemo(() => getPreVendedorPerformance(filteredProposals), [filteredProposals]);
  const monthlyData = useMemo(() => getMonthlyData(filteredProposals), [filteredProposals]);

  const meta = useMemo(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : 5_000_000;
  }, []);

  const hasData = proposals.length > 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Header
          lastUpdate={lastUpdate}
          selectedVendedor={selectedVendedor}
          selectedPreVendedor={selectedPreVendedor}
          onVendedorChange={setSelectedVendedor}
          onPreVendedorChange={setSelectedPreVendedor}
          vendedores={vendedores}
          preVendedores={preVendedores}
          dateRange={dateRange}
          datePreset={datePreset}
          onDateRangeChange={handleDateRangeChange}
        />
        <HelpButton moduleId="bi-estrategico" label="Ajuda do Dashboard" />
      </div>

      <div>
        {/* Error State */}
        {error && (
          <Alert className="mb-6 border-destructive/50 bg-destructive/10">
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

        {/* Success badge */}
        {hasData && !error && (
          <div className="mb-6 flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              {proposals.length} propostas carregadas
            </span>
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} className="text-muted-foreground hover:text-foreground">
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="mb-6 flex items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Carregando dados do Google Sheets...
          </div>
        )}

        {/* Empty */}
        {!isLoading && !hasData && !error && (
          <Alert className="mb-6 border-warning/50 bg-warning/10">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertDescription className="flex items-center justify-between">
              <span>Nenhum dado encontrado. Verifique se a planilha contém dados.</span>
              <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} className="ml-4">
                <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* BLOCO 1: Visão Executiva */}
        <section className="mb-8">
          <ExecutiveKPIs
            receitaPrevista={kpis.receitaPrevista}
            valorGanho={kpis.valorGanho}
            taxaConversao={kpis.taxaConversao}
            ticketMedio={kpis.ticketMedio}
            totalPropostas={kpis.totalNegocios}
            negociosAbertos={kpis.negociosAbertos}
            valorPipeline={kpis.valorPipeline}
            negociosGanhos={kpis.negociosGanhos}
          />
        </section>

        {/* BLOCO 2: Meta vs Realizado + Health Score */}
        <section className="mb-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <GoalProgress valorFechado={kpis.valorGanho} receitaPrevista={kpis.receitaPrevista} />
          </div>
          <HealthScore proposals={filteredProposals} kpis={kpis} vendedorPerformance={vendedorPerformance} />
        </section>

        {/* BLOCO 3: Alertas Estratégicos */}
        <section className="mb-8">
          <StrategicAlerts
            proposals={filteredProposals}
            kpis={kpis}
            vendedorPerformance={vendedorPerformance}
            meta={meta}
          />
        </section>

        {/* BLOCO 4: Funil Estratégico R$ e kWh */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Funil de Vendas</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <StrategicFunnel data={funnelData} proposals={filteredProposals} />
            <PowerFunnel data={powerFunnelData} proposals={filteredProposals} />
          </div>
        </section>

        {/* BLOCO 5: Performance Comercial */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Performance Comercial</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <ComercialResponsavelStats data={preVendedorPerformance} />
            <VendedorFunnel data={vendedorPerformance} proposals={filteredProposals} />
          </div>
        </section>

        {/* BLOCO 6: Ranking + Tendências */}
        <section className="mb-8">
          <VendedorRanking data={vendedorPerformance} />
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Tendências Mensais</h2>
          <TrendsChart data={monthlyData} />
        </section>

        <footer className="mt-12 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>© 2024 Sol Estrateg.IA - BI, CRM e Inteligência Comercial. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
