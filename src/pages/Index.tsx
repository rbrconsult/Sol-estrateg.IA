import { useMemo } from "react";
import { useForceSync } from "@/hooks/useForceSync";
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
import { adaptComercialData, getKPIs, getVendedorPerformance } from "@/data/dataAdapter";
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


// Etapas do DS Comercial que agrupam como CONTRATO ASSINADO
const CONTRATO_AGRUPADOS = new Set([
  'CONTRATO ASSINADO', 'COBRANÇA', 'COBRANCA',
  'ANÁLISE DOCUMENTOS', 'ANALISE DOCUMENTOS',
  'APROVAÇÃO DE FINANCIAMENTO', 'APROVACAO DE FINANCIAMENTO',
  'ELABORAÇÃO DE CONTRATO', 'ELABORACAO DE CONTRATO',
  'CONTRATO ENVIADO', 'AGUARDANDO DOCUMENTOS',
  'RECEBIMENTO DO CLIENTE (F)',
]);

const FUNNEL_JOURNEY = [
  'TRAFEGO PAGO', 'PROSPECÇÃO', 'FOLLOW UP', 'QUALIFICAÇÃO',
  'QUALIFICADO', 'CONTATO REALIZADO', 'PROPOSTA', 'NEGOCIAÇÃO', 'CONTRATO ASSINADO',
];

const Index = () => {
  const { proposals: allProposals, isLoading, error, isFetching, enrichedCount, orgFilterActive } = useOrgFilteredProposals();
  const { forceSync, isSyncing } = useForceSync();
  const { data: makeRecords } = useMakeDataStore();
  const { data: comercialRecords } = useMakeComercialData();
  const { selectedOrgName } = useOrgFilter();
  const gf = useGlobalFilters();

  const filteredProposals = useMemo(() => gf.filterProposals(allProposals), [allProposals, gf.filterProposals]);

  const lastUpdate = useMemo(() => new Date().toLocaleString('pt-BR'), []);

  const kpis = useMemo(() => getKPIs(filteredProposals), [filteredProposals]);
  const vendedorPerformance = useMemo(() => getVendedorPerformance(filteredProposals), [filteredProposals]);

  // Funil combinado DS Thread + DS Comercial
  const combinedFunnelData = useMemo(() => {
    const threadCounts: Record<string, number> = {};
    for (const r of makeRecords || []) {
      let etapa = (r.etapaFunil || 'TRAFEGO PAGO').toUpperCase();
      if (etapa === 'PROSPECAO') etapa = 'PROSPECÇÃO';
      if (etapa === 'QUALIFICACAO') etapa = 'QUALIFICAÇÃO';
      if (etapa === 'SOL SDR') etapa = 'TRAFEGO PAGO';
      threadCounts[etapa] = (threadCounts[etapa] || 0) + 1;
    }
    const comercialCounts: Record<string, { qty: number; valor: number }> = {};
    for (const r of comercialRecords || []) {
      let etapa = (r.etapaSM || '').toUpperCase();
      if (CONTRATO_AGRUPADOS.has(etapa)) etapa = 'CONTRATO ASSINADO';
      if (!etapa) etapa = 'PROPOSTA';
      if (!comercialCounts[etapa]) comercialCounts[etapa] = { qty: 0, valor: 0 };
      comercialCounts[etapa].qty++;
      comercialCounts[etapa].valor += r.valorProposta || 0;
    }
    const threadStages = new Set(['TRAFEGO PAGO','PROSPECÇÃO','FOLLOW UP','QUALIFICAÇÃO','QUALIFICADO','CONTATO REALIZADO']);
    return FUNNEL_JOURNEY.map(etapa => ({
      etapa,
      quantidade: threadStages.has(etapa) ? (threadCounts[etapa] || 0) : (comercialCounts[etapa]?.qty || 0),
      valor: threadStages.has(etapa) ? 0 : (comercialCounts[etapa]?.valor || 0),
      taxaConversao: 0,
    })).filter(d => d.quantidade > 0);
  }, [makeRecords, comercialRecords]);

  // C1: Apply global date filter to makeRecords
  const filteredMakeRecords = useMemo(() => gf.filterRecords(makeRecords || []), [makeRecords, gf.filterRecords]);

  // ── KPIs do DS Thread (MQL, SQL) — now filtered by period ──
  const threadKpis = useMemo(() => {
    const records = filteredMakeRecords;
    const mql = records.filter(r => r.etapaFunil && MQL_ETAPAS.includes(r.etapaFunil)).length;
    const sql = records.filter(r => r.etapaFunil && SQL_ETAPAS.includes(r.etapaFunil)).length;
    const contatados = records.filter(r => r.status_resposta === 'respondeu').length;
    const now = new Date();
    const hojeISO = now.toISOString().slice(0, 10);
    const criadosHoje = records.filter(r => {
      const d = r.data_envio || '';
      if (!d) return false;
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10) === hojeISO;
      }
      const brMatch = d.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
      if (brMatch) {
        return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}` === hojeISO;
      }
      return false;
    }).length;
    return { mql, sql, total: records.length, contatados, criadosHoje };
  }, [filteredMakeRecords]);

  // ── KPIs do DS Comercial (Agendamentos, Fechados) — also filtered ──
  const comercialKpis = useMemo(() => {
    const records = comercialRecords || [];
    // TODO: apply date filtering to comercial records when dataCriacaoProposta is available
    const agendamentos = records.filter(r =>
      ['CONTATO REALIZADO', 'NEGOCIAÇÃO', 'NEGOCIACAO', 'PROPOSTA'].includes(r.etapaSM?.toUpperCase())
    ).length;
    const ganhos = records.filter(r =>
      r.status === 'Ganho' ||
      FECHADOS_ETAPAS_SM.includes(r.etapaSM?.toUpperCase())
    );
    const emInstalacao = records.filter(r => r.faseSM?.toUpperCase() === 'OPERACIONAL' && !ganhos.includes(r));
    const fechados = ganhos.length;
    const valorFechado = ganhos.reduce((acc, r) => acc + r.valorProposta, 0);
    return { agendamentos, fechados, valorFechado, emInstalacao: emInstalacao.length };
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

  // M3: Adjusted health score thresholds for solar sales cycle
  const healthScore = useMemo(() => {
    let conv = kpis.taxaConversao >= 15 ? 25 : kpis.taxaConversao >= 10 ? 18 : kpis.taxaConversao >= 5 ? 10 : 0;
    let ciclo = kpis.cicloProposta <= 15 ? 25 : kpis.cicloProposta <= 30 ? 18 : kpis.cicloProposta <= 60 ? 10 : 0;
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
    if (combinedFunnelData.length < 2) return "Dados insuficientes";
    let worstIdx = 0;
    let worstConv = 100;
    for (let i = 1; i < combinedFunnelData.length; i++) {
      const prev = combinedFunnelData[i - 1].quantidade;
      const curr = combinedFunnelData[i].quantidade;
      const conv = prev > 0 ? (curr / prev) * 100 : 100;
      if (conv < worstConv) { worstConv = conv; worstIdx = i; }
    }
    return `${combinedFunnelData[worstIdx - 1]?.etapa || ""} → ${combinedFunnelData[worstIdx]?.etapa || ""} (${worstConv.toFixed(0)}%)`;
  }, [combinedFunnelData]);

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
        setTemperatura={gf.setTemperatura} setSearchTerm={gf.setSearchTerm} setEtapa={gf.setEtapa} setStatus={gf.setStatus}
        config={{ showPeriodo: true, showTemperatura: true, showSearch: true, showEtapa: true, showStatus: true, searchPlaceholder: "Buscar vendedor ou cliente..." }}
      />

      {error && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="flex items-center justify-between">
            <span>Erro ao carregar dados: {error.message}</span>
            <Button variant="ghost" size="sm" onClick={() => forceSync()} disabled={isSyncing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
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
          <Button variant="ghost" size="sm" onClick={() => forceSync()} disabled={isSyncing} className="text-muted-foreground hover:text-foreground">
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Criados Hoje", value: threadKpis.criadosHoje, sub: "Leads novos hoje", color: "text-purple-400" },
              { label: "Contatados", value: threadKpis.contatados, sub: "Responderam ao robô", color: "text-cyan-400" },
              { label: "MQL", value: threadKpis.mql, sub: "SOL SDR + FUP + Qualif.", color: "text-blue-400" },
              { label: "SQL", value: threadKpis.sql, sub: "Qualificado + Contato", color: "text-emerald-400" },
              { label: "Agendamentos", value: comercialKpis.agendamentos, sub: "Contato / Proposta / Neg.", color: "text-amber-400" },
              { label: "Fechados", value: comercialKpis.fechados, sub: "Contratos + Pós-venda", color: "text-primary" },
            ].map((k) => (
              <div key={k.label} className="rounded-lg border border-border bg-card p-4 space-y-1">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-[10px] text-muted-foreground">{k.sub}</p>
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
            <StrategicFunnel data={combinedFunnelData} proposals={filteredProposals} />
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
