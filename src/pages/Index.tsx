import { useState, useMemo } from "react";
import { 
  Briefcase, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Clock, 
  AlertTriangle 
} from "lucide-react";
import { Header } from "@/components/dashboard/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { SalesFunnel } from "@/components/dashboard/SalesFunnel";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { LossAnalysis } from "@/components/dashboard/LossAnalysis";
import { TrendsChart } from "@/components/dashboard/TrendsChart";
import { VendedorTable } from "@/components/dashboard/VendedorTable";
import {
  mockProposals,
  vendedores,
  preVendedores,
  getKPIs,
  getFunnelData,
  getVendedorPerformance,
  getPreVendedorPerformance,
  getMotivosPerda,
  getMonthlyData
} from "@/data/mockData";

const Index = () => {
  const [selectedVendedor, setSelectedVendedor] = useState("todos");
  const [selectedPreVendedor, setSelectedPreVendedor] = useState("todos");

  const filteredProposals = useMemo(() => {
    return mockProposals.filter(p => {
      if (selectedVendedor !== "todos" && p.responsavel !== selectedVendedor) return false;
      if (selectedPreVendedor !== "todos" && p.representante !== selectedPreVendedor) return false;
      return true;
    });
  }, [selectedVendedor, selectedPreVendedor]);

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

  return (
    <div className="min-h-screen bg-background">
      <Header
        lastUpdate="08/12/2024 14:30"
        selectedVendedor={selectedVendedor}
        selectedPreVendedor={selectedPreVendedor}
        onVendedorChange={setSelectedVendedor}
        onPreVendedorChange={setSelectedPreVendedor}
        vendedores={vendedores}
        preVendedores={preVendedores}
      />

      <main className="mx-auto max-w-[1600px] px-6 py-8">
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
              trend={{ value: 2.5, isPositive: true }}
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
