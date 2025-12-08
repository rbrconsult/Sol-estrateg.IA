import { useState, useMemo } from "react";
import { 
  Briefcase, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { Header } from "@/components/dashboard/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { SalesFunnel } from "@/components/dashboard/SalesFunnel";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { LossAnalysis } from "@/components/dashboard/LossAnalysis";
import { TrendsChart } from "@/components/dashboard/TrendsChart";
import { VendedorTable } from "@/components/dashboard/VendedorTable";
import { useGoogleSheetsData } from "@/hooks/useGoogleSheetsData";
import { 
  adaptSheetData, 
  extractVendedores, 
  extractPreVendedores,
  getKPIs,
  getFunnelData,
  getVendedorPerformance,
  getPreVendedorPerformance,
  getMotivosPerda,
  getMonthlyData
} from "@/data/dataAdapter";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Index = () => {
  const [selectedVendedor, setSelectedVendedor] = useState("todos");
  const [selectedPreVendedor, setSelectedPreVendedor] = useState("todos");
  
  const { data: sheetsData, isLoading, error, refetch, isFetching } = useGoogleSheetsData();

  // Processa dados do Google Sheets
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
    return {
      proposals: [],
      vendedores: [],
      preVendedores: [],
      lastUpdate: new Date().toLocaleString('pt-BR')
    };
  }, [sheetsData]);

  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      if (selectedVendedor !== "todos" && p.representante !== selectedVendedor) return false;
      if (selectedPreVendedor !== "todos" && p.responsavel !== selectedPreVendedor) return false;
      return true;
    });
  }, [proposals, selectedVendedor, selectedPreVendedor]);

  const kpis = useMemo(() => getKPIs(filteredProposals), [filteredProposals]);
  const funnelData = useMemo(() => getFunnelData(filteredProposals), [filteredProposals]);
  const vendedorPerformance = useMemo(() => getVendedorPerformance(filteredProposals), [filteredProposals]);
  const preVendedorPerformance = useMemo(() => getPreVendedorPerformance(filteredProposals), [filteredProposals]);
  const motivosPerda = useMemo(() => getMotivosPerda(filteredProposals), [filteredProposals]);
  const monthlyData = useMemo(() => getMonthlyData(filteredProposals), [filteredProposals]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const hasData = proposals.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header
        lastUpdate={lastUpdate}
        selectedVendedor={selectedVendedor}
        selectedPreVendedor={selectedPreVendedor}
        onVendedorChange={setSelectedVendedor}
        onPreVendedorChange={setSelectedPreVendedor}
        vendedores={vendedores}
        preVendedores={preVendedores}
      />

      <main className="mx-auto max-w-[1600px] px-6 py-8">
        {/* Error State */}
        {error && (
          <Alert className="mb-6 border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="flex items-center justify-between text-red-200">
              <span>
                Erro ao carregar dados: {error.message}
              </span>
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

        {/* Empty State */}
        {!isLoading && !hasData && !error && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="flex items-center justify-between text-amber-200">
              <span>
                Nenhum dado encontrado. Verifique se a planilha contém dados.
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="ml-4 text-amber-200 hover:text-amber-100 hover:bg-amber-500/20"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* KPIs Section */}
        <section className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KPICard
              title="Total de Negócios"
              value={kpis.totalNegocios}
              subtitle={`${kpis.negociosAbertos} em andamento`}
              icon={Briefcase}
              delay={100}
            />
            <KPICard
              title="Pipeline Ativo"
              value={formatCurrency(kpis.valorPipeline)}
              subtitle={`${kpis.negociosAbertos} propostas`}
              icon={TrendingUp}
              variant="default"
              delay={150}
            />
            <KPICard
              title="Taxa de Conversão"
              value={`${kpis.taxaConversao.toFixed(1)}%`}
              subtitle={`${kpis.negociosGanhos} ganhos`}
              icon={Target}
              variant="success"
              delay={200}
            />
            <KPICard
              title="Ticket Médio"
              value={formatCurrency(kpis.ticketMedio)}
              subtitle="Por venda fechada"
              icon={DollarSign}
              variant="success"
              delay={250}
            />
            <KPICard
              title="Ciclo de Vendas"
              value={`${kpis.cicloMedioVendas} dias`}
              subtitle="Média de fechamento"
              icon={Clock}
              delay={300}
            />
            <KPICard
              title="Valor Perdido"
              value={formatCurrency(kpis.valorPerdido)}
              subtitle={`${kpis.negociosPerdidos} propostas`}
              icon={AlertTriangle}
              variant="danger"
              delay={350}
            />
          </div>
        </section>

        {/* Funnel and Performance */}
        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          <SalesFunnel data={funnelData} />
          <PerformanceChart
            data={preVendedorPerformance}
            title="Pré-Vendedores"
            subtitle="Taxa de conversão por pré-vendedor"
            dataKey="taxaConversao"
          />
        </section>

        {/* Vendedor Table */}
        <section className="mb-8">
          <VendedorTable data={vendedorPerformance} />
        </section>

        {/* Loss Analysis and Trends */}
        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          <LossAnalysis data={motivosPerda} />
          <TrendsChart data={monthlyData} />
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>© 2024 EVOLVE - Dashboard Comercial. Todos os direitos reservados.</p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
