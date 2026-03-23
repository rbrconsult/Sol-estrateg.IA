import { useMemo } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { ExecutiveKPIs } from "@/components/dashboard/ExecutiveKPIs";
import { ExecutiveSummary } from "@/components/dashboard/ExecutiveSummary";
import { GoalProgress } from "@/components/dashboard/GoalProgress";
import { HealthScore } from "@/components/dashboard/HealthScore";
import { StrategicAlerts } from "@/components/dashboard/StrategicAlerts";
import { StrategicFunnel } from "@/components/dashboard/StrategicFunnel";
import { useOrgFilteredProposals } from "@/hooks/useOrgFilteredProposals";
import { useMakeDataStore } from "@/hooks/useMakeDataStore";
import { useMakeComercialData } from "@/hooks/useMakeComercialData";
import {
  getKPIs,
  getFunnelData,
  getVendedorPerformance,
} from "@/data/dataAdapter";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HelpButton } from "@/components/HelpButton";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { Badge } from "@/components/ui/badge";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { PageFloatingFilter } from "@/components/filters/PageFloatingFilter";

const STORAGE_KEY = "sol_insights_meta";

// Etapas DS Thread que classificam como MQL (qualificado pelo robô)
const MQL_ETAPAS = ['SOL SDR', 'FOLLOW UP', 'QUALIFICAÇÃO'];
// Etapas DS Thread que classificam como SQL (qualificado para closer)
const SQL_ETAPAS = ['QUALIFICADO', 'CONTATO REALIZADO'];
// Etapas DS Comercial que são pós-venda (Ganho)
const FECHADOS_ETAPAS_SM = [
  'CONTRATO ASSINADO', 'COBRANÇA', 'COBRANCA',
  'ANÁLISE DOCUMENTOS', 'ANALISE DOCUMENTOS',
  'APROVAÇÃO DE FINANCIAMENTO', 'APROVACAO DE FINANCIAMENTO',
  'ELABORAÇÃO DE CONTRATO', 'ELABORACAO DE CONTRATO',
  'CONTRATO ENVIADO', 'AGUARDANDO DOCUMENTOS',
  'RECEBIMENTO DO CLIENTE (F)',
];

const Index = () => {
  const { proposals: allProposals, isLoading, error, refetch, isFetching, enrichedCount, orgFilterActive } = useOrgFilteredProposals();
  const { data: makeRecords } = useMakeDataStore();
  const { data: comercialRecords } = useMakeComercialData();
  const { selectedOrgName } = useOrgFilter();
  const gf = useGlobalFilters();

  const filteredProposals = useMemo(() => gf.filterProposals(allProposals), [allProposals, gf.filterProposals]);

  const lastUpdate = useMemo(() => new Date().toLocaleString('pt-BR'), []);

  const kpis = useMemo(() => getKPIs(filteredProposals), [filteredProposals]);
  const funnelData = useMemo(() => getFunnelData(filteredProposals), [filteredProposals]);
  const vendedorPerformance = useMemo(() => getVendedorPerformance(filteredProposals), [filteredProposals]);

  // ── KPIs do DS Thread (MQL, SQL) ──
  const threadKpis = useMemo(() => {
    const records = makeRecords || [];
    const mql = records.filter(r => r.etapaFunil && MQL_ETAPAS.includes(r.etapaFunil)).length;
    const sql = records.filter(r => r.etapaFunil && SQL_ETAPAS.includes(r.etapaFunil)).length;
    return { mql, sql, total: records.length };
  }, [makeRecords]);

  // ── KPIs do DS Comercial (Agendamentos, Fechados) ──
  const comercialKpis = useMemo(() => {
    const records = comercialRecords || [];
    const agendamentos = records.filter(r =>
      ['CONTATO REALIZADO', 'NEGOCIAÇÃO', 'NEGOCIACAO', 'PROPOSTA'].includes(r.etapaSM?.toUpperCase())
    ).length;
    const fechados = records.filter(r =>
      r.status === 'Ganho' ||
      FECHADOS_ETAPAS_SM.includes(r.etapaSM?.toUpperCase()) ||
      r.faseSM?.toUpperCase() === 'OPERACIONAL'
    ).length;
    const valorFechado = records
      .filter(r => r.status === 'Ganho' || r.faseSM?.toUpperCase() === 'OPERACIONAL')
      .reduce((acc, r) => acc + r.valorProposta, 0);
    return { agendamentos, fechados, valorFechado };
  }, [comercialRecords]);

  const meta = useMemo(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : 5_000_000;
  }, []);

  const hasData = allProposals.length > 0 || (makeRecords?.length ?? 0) > 0;

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
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Inteligência Comercial • Atualizado em {lastUpdate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {orgFilterActive && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
              🏢 {selectedOrgName}
            </Badge>
          )}
          <HelpButton moduleId="bi-estrategico" label="Ajuda do Dashboard" />
        </div>
      </div>

      <PageFloatingFilter
        filters={gf.filters} hasFilters={gf.hasFilters} clearFilters={gf.clearFilters}
        setPeriodo={gf.setPeriodo} setDateFrom={gf.setDateFrom} setDateTo={gf.setDateTo}
        setTemperatura={gf.setTemperatura} setSearchTerm={gf.setSearchTerm} setEtapa={gf.setEtapa}
        config={{ showPeriodo: true, showTemperatura: true, showSearch: true, showEtapa: true, searchPlaceholder: "Buscar vendedor ou cliente..." }}
      />

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
            {threadKpis.total} leads DS Thread • {comercialRecords?.length || 0} DS Comercial
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

      {/* ── KPIs principais ── */}
      {hasData && (
        <>
          {/* KPIs do robô (DS Thread) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "MQL", value: threadKpis.mql, sub: "SOL SDR + FUP + Qualificação", color: "text-blue-400" },
              { label: "SQL", value: threadKpis.sql, sub: "Qualificado + Contato Realizado", color: "text-emerald-400" },
              { label: "Agendamentos", value: comercialKpis.agendamentos, sub: "Contato / Proposta / Neg.", color: "text-amber-400" },
              { label: "Fechados", value: comercialKpis.fechados, sub: "Contratos + Pós-venda", color: "text-primary" },
            ].map((k) => (
              <div key={k.label} className="rounded-lg border border-border bg-card p-4 space-y-1">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.sub}</p>
              </div>
            ))}
          </div>

          <ExecutiveKPIs
            receitaPrevista={kpis.receitaPrevista}
            valorGanho={comercialKpis.valorFechado || kpis.valorGanho}
            taxaConversao={kpis.taxaConversao}
            ticketMedio={kpis.ticketMedio}
            totalPropostas={kpis.totalNegocios}
            negociosAbertos={kpis.negociosAbertos}
            valorPipeline={kpis.valorPipeline}
            negociosGanhos={comercialKpis.fechados || kpis.negociosGanhos}
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <ExecutiveSummary
                kpis={kpis}
                healthScore={healthScore}
                alertCount={0}
                topVendedor={topVendedor}
                funnelBottleneck={funnelBottleneck}
              />
              <GoalProgress valorFechado={comercialKpis.valorFechado || kpis.valorGanho} receitaPrevista={kpis.receitaPrevista} />
            </div>
            <HealthScore proposals={filteredProposals} kpis={kpis} vendedorPerformance={vendedorPerformance} />
          </div>

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
            © 2026 Sol Estrateg.IA — Inteligência Comercial
          </footer>
        </>
      )}

      {!isLoading && !hasData && !error && (
        <Alert className="border-warning/50 bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription>
            Nenhum dado encontrado. Verifique a conexão com os Data Stores.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default Index;
