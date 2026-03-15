import { useState, useMemo } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { isWithinInterval, parseISO, isValid } from "date-fns";
import { Header } from "@/components/dashboard/Header";
import { ExecutiveKPIs } from "@/components/dashboard/ExecutiveKPIs";
import { ExecutiveSummary } from "@/components/dashboard/ExecutiveSummary";
import { GoalProgress } from "@/components/dashboard/GoalProgress";
import { HealthScore } from "@/components/dashboard/HealthScore";
import { StrategicAlerts } from "@/components/dashboard/StrategicAlerts";
import { StrategicFunnel } from "@/components/dashboard/StrategicFunnel";
import { useEnrichedProposals } from "@/hooks/useEnrichedProposals";
import {
  extractVendedores,
  extractPreVendedores,
  getKPIs,
  getFunnelData,
  getVendedorPerformance,
  getPreVendedorPerformance,
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

  const { proposals, isLoading, error, refetch, isFetching, enrichedCount } = useEnrichedProposals();

  const handleDateRangeChange = (range: DateRange, preset: DateFilterPreset) => {
    setDateRange(range);
    setDatePreset(preset);
  };

  const { vendedores, preVendedores, lastUpdate } = useMemo(() => ({
    vendedores: extractVendedores(proposals),
    preVendedores: extractPreVendedores(proposals),
    lastUpdate: new Date().toLocaleString('pt-BR')
  }), [proposals]);

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
  const vendedorPerformance = useMemo(() => getVendedorPerformance(filteredProposals), [filteredProposals]);
  const preVendedorPerformance = useMemo(() => getPreVendedorPerformance(filteredProposals), [filteredProposals]);

  const meta = useMemo(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : 5_000_000;
  }, []);

  const hasData = proposals.length > 0;

  // Derived data for AI summary
  const topVendedor = useMemo(() => {
    if (vendedorPerformance.length === 0) return "N/A";
    const sorted = [...vendedorPerformance].sort((a, b) => b.valorTotal - a.valorTotal);
    return sorted[0]?.nome || "N/A";
  }, [vendedorPerformance]);

  const healthScore = useMemo(() => {
    let conv = kpis.taxaConversao >= 15 ? 25 : kpis.taxaConversao >= 10 ? 18 : kpis.taxaConversao >= 5 ? 10 : 0;
    let ciclo = kpis.cicloProposta <= 7 ? 25 : kpis.cicloProposta <= 15 ? 18 : kpis.cicloProposta <= 30 ? 10 : 0;
    const totalVal = vendedorPerformance.reduce((a, v) => a + v.valorTotal, 0);
    let dist = 25;
    if (totalVal > 0) {
      const maxConc = Math.max(...vendedorPerformance.map(v => (v.valorTotal / totalVal) * 100));
      if (maxConc > 70) dist = 0; else if (maxConc > 60) dist = 10; else if (maxConc > 50) dist = 18;
    }
    const abertos = filteredProposals.filter(p => p.status === "Aberto");
    const parados = abertos.filter(p => p.tempoNaEtapa > 15).length;
    const pctParados = abertos.length > 0 ? (parados / abertos.length) * 100 : 0;
    let fluxo = pctParados < 20 ? 25 : pctParados < 40 ? 15 : 0;
    return conv + ciclo + dist + fluxo;
  }, [kpis, vendedorPerformance, filteredProposals]);

  const funnelBottleneck = useMemo(() => {
    if (funnelData.length < 2) return "Dados insuficientes";
    let worstIdx = 0;
    let worstConv = 100;
    for (let i = 1; i < funnelData.length; i++) {
      const prev = funnelData[i - 1].quantidade;
      const curr = funnelData[i].quantidade;
      const conv = prev > 0 ? (curr / prev) * 100 : 100;
      if (conv < worstConv) { worstConv = conv; worstIdx = i; }
    }
    return `${funnelData[worstIdx - 1]?.etapa || ""} → ${funnelData[worstIdx]?.etapa || ""} (${worstConv.toFixed(0)}%)`;
  }, [funnelData]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
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

      {/* Status bar */}
      {error && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="flex items-center justify-between">
            <span>Erro ao carregar dados: {error.message}</span>
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {hasData && !error && (
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            {proposals.length} propostas • {enrichedCount} enriquecidas
          </span>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} className="text-muted-foreground hover:text-foreground">
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-12">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Carregando dados...
        </div>
      )}

      {!isLoading && !hasData && !error && (
        <Alert className="border-warning/50 bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription>
            Nenhum dado encontrado. Verifique se a planilha contém dados.
          </AlertDescription>
        </Alert>
      )}

      {/* RAIO-X EXECUTIVO — Layout compacto */}
      {hasData && (
        <>
          {/* KPIs principais */}
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

          {/* Resumo IA + Meta + Health */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <ExecutiveSummary
                kpis={kpis}
                healthScore={healthScore}
                alertCount={0}
                topVendedor={topVendedor}
                funnelBottleneck={funnelBottleneck}
              />
              <GoalProgress valorFechado={kpis.valorGanho} receitaPrevista={kpis.receitaPrevista} />
            </div>
            <HealthScore proposals={filteredProposals} kpis={kpis} vendedorPerformance={vendedorPerformance} />
          </div>

          {/* Alertas + Funil */}
          <div className="grid gap-6 lg:grid-cols-2">
            <StrategicAlerts
              proposals={filteredProposals}
              kpis={kpis}
              vendedorPerformance={vendedorPerformance}
              meta={meta}
            />
            <StrategicFunnel data={funnelData} proposals={filteredProposals} />
          </div>

          <footer className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
            © 2024 Sol Estrateg.IA — Raio-X Executivo
          </footer>
        </>
      )}
    </div>
  );
};

export default Index;
