import { useMemo, useState } from "react";
import { RefreshCw, AlertCircle, Users, UserCheck, CalendarCheck, Trophy } from "lucide-react";
import { ExecutiveSummary } from "@/components/dashboard/ExecutiveSummary";
import { GoalProgress } from "@/components/dashboard/GoalProgress";
import { HealthScore } from "@/components/dashboard/HealthScore";
import { StrategicAlerts } from "@/components/dashboard/StrategicAlerts";
import { StrategicFunnel } from "@/components/dashboard/StrategicFunnel";
import { useOrgFilteredProposals } from "@/hooks/useOrgFilteredProposals";
import { useMakeDataStore, type MakeRecord } from "@/hooks/useMakeDataStore";
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
import { formatCurrencyAbbrev } from "@/lib/formatters";

const STORAGE_KEY = "sol_insights_meta";

/** Etapas MQL no DS Thread */
const MQL_ETAPAS = ['SOL SDR', 'FOLLOW UP', 'QUALIFICAÇÃO', 'QUALIFICACAO', 'PROSPECÇÃO', 'PROSPECCAO', 'TRAFEGO PAGO'];
/** Etapas SQL no DS Thread */
const SQL_ETAPAS = ['QUALIFICADO', 'CONTATO REALIZADO'];
/** Etapas "Fechados" no DS Comercial */
const FECHADOS_ETAPAS = [
  'CONTRATO ASSINADO', 'COBRANÇA', 'COBRANCA', 'ANÁLISE DOCUMENTOS', 'ANALISE DOCUMENTOS',
  'APROVAÇÃO DE FINANCIAMENTO', 'APROVACAO DE FINANCIAMENTO',
  'ELABORAÇÃO DE CONTRATO', 'ELABORACAO DE CONTRATO',
  'CONTRATO ENVIADO', 'AGUARDANDO DOCUMENTOS',
];

/** Ordem obrigatória do funil por jornada */
const FUNNEL_JOURNEY_ORDER = [
  'TRAFEGO PAGO',
  'PROSPECÇÃO',
  'FOLLOW UP',
  'QUALIFICAÇÃO',
  'QUALIFICADO',
  'CONTATO REALIZADO',
  'PROPOSTA',
  'NEGOCIAÇÃO',
  'CONTRATO ASSINADO',
];

const Index = () => {
  const { proposals: allProposals, isLoading, error, refetch, isFetching, enrichedCount, orgFilterActive } = useOrgFilteredProposals();
  const { data: makeRecords } = useMakeDataStore();
  const { selectedOrgName } = useOrgFilter();
  const gf = useGlobalFilters();

  const filteredProposals = useMemo(() => gf.filterProposals(allProposals), [allProposals, gf.filterProposals]);

  const lastUpdate = useMemo(() => new Date().toLocaleString('pt-BR'), []);

  const kpis = useMemo(() => getKPIs(filteredProposals), [filteredProposals]);
  const vendedorPerformance = useMemo(() => getVendedorPerformance(filteredProposals), [filteredProposals]);

  // ── KPIs from DS Thread (MQL, SQL) ──
  const threadKpis = useMemo(() => {
    if (!makeRecords?.length) return { mql: 0, sql: 0 };
    const mql = makeRecords.filter(r => r.etapaFunil && MQL_ETAPAS.includes(r.etapaFunil)).length;
    const sql = makeRecords.filter(r => r.etapaFunil && SQL_ETAPAS.includes(r.etapaFunil)).length;
    return { mql, sql };
  }, [makeRecords]);

  // ── KPIs from DS Comercial (Agendamentos, Fechados) ──
  const comercialKpis = useMemo(() => {
    const agendamentos = filteredProposals.filter(p => 
      p.etapa?.toUpperCase() === 'CONTATO REALIZADO'
    ).length;
    const fechados = filteredProposals.filter(p => 
      FECHADOS_ETAPAS.includes(p.etapa?.toUpperCase() || '')
    ).length;
    return { agendamentos, fechados };
  }, [filteredProposals]);

  // ── Funnel data in journey order (merge DS Thread + DS Comercial) ──
  const journeyFunnel = useMemo(() => {
    // Count from DS Thread (etapa_funil)
    const threadCounts: Record<string, { quantidade: number; valor: number }> = {};
    if (makeRecords?.length) {
      for (const r of makeRecords) {
        const etapa = r.etapaFunil || 'TRAFEGO PAGO';
        if (!threadCounts[etapa]) threadCounts[etapa] = { quantidade: 0, valor: 0 };
        threadCounts[etapa].quantidade++;
      }
    }

    // Count from DS Comercial (etapa_sm)  
    const comercialCounts: Record<string, { quantidade: number; valor: number }> = {};
    for (const p of filteredProposals) {
      const etapa = p.etapa?.toUpperCase() || '';
      if (!comercialCounts[etapa]) comercialCounts[etapa] = { quantidade: 0, valor: 0 };
      comercialCounts[etapa].quantidade++;
      comercialCounts[etapa].valor += p.valorProposta;
    }

    // Merge: Thread stages use thread data, Comercial stages use comercial data
    const THREAD_STAGES = ['TRAFEGO PAGO', 'PROSPECÇÃO', 'FOLLOW UP', 'QUALIFICAÇÃO', 'QUALIFICADO', 'CONTATO REALIZADO'];
    const COMERCIAL_STAGES = ['PROPOSTA', 'NEGOCIAÇÃO', 'CONTRATO ASSINADO'];

    return FUNNEL_JOURNEY_ORDER.map(etapa => {
      let quantidade = 0;
      let valor = 0;
      
      if (THREAD_STAGES.includes(etapa)) {
        // Also try without accent
        const variants = [etapa, etapa.replace('Ã', 'A').replace('Ç', 'C')];
        for (const v of variants) {
          if (threadCounts[v]) {
            quantidade += threadCounts[v].quantidade;
            valor += threadCounts[v].valor;
          }
        }
      }
      
      if (COMERCIAL_STAGES.includes(etapa)) {
        if (etapa === 'CONTRATO ASSINADO') {
          // Aggregate all "fechados" etapas
          for (const fe of FECHADOS_ETAPAS) {
            if (comercialCounts[fe]) {
              quantidade += comercialCounts[fe].quantidade;
              valor += comercialCounts[fe].valor;
            }
          }
          // Also include exact match
          if (comercialCounts['CONTRATO ASSINADO']) {
            quantidade += comercialCounts['CONTRATO ASSINADO'].quantidade;
            valor += comercialCounts['CONTRATO ASSINADO'].valor;
          }
        } else {
          if (comercialCounts[etapa]) {
            quantidade = comercialCounts[etapa].quantidade;
            valor = comercialCounts[etapa].valor;
          }
        }
      }

      const totalValue = filteredProposals.reduce((acc, p) => acc + p.valorProposta, 0);
      return {
        etapa,
        quantidade,
        valor,
        taxaConversao: totalValue > 0 ? (valor / totalValue) * 100 : 0,
      };
    });
  }, [makeRecords, filteredProposals]);

  const meta = useMemo(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : 5_000_000;
  }, []);

  const hasData = allProposals.length > 0;

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
    if (journeyFunnel.length < 2) return "Dados insuficientes";
    let worstIdx = 0;
    let worstConv = 100;
    for (let i = 1; i < journeyFunnel.length; i++) {
      const prev = journeyFunnel[i - 1].quantidade;
      const curr = journeyFunnel[i].quantidade;
      const conv = prev > 0 ? (curr / prev) * 100 : 100;
      if (conv < worstConv) { worstConv = conv; worstIdx = i; }
    }
    return `${journeyFunnel[worstIdx - 1]?.etapa || ""} → ${journeyFunnel[worstIdx]?.etapa || ""} (${worstConv.toFixed(0)}%)`;
  }, [journeyFunnel]);

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
            {filteredProposals.length} propostas • {enrichedCount} enriquecidas
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

      {hasData && (
        <>
          {/* ── KPIs: MQL, SQL, Agendamentos, Fechados ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
            {[
              { label: "MQL", value: threadKpis.mql, icon: Users, subtitle: "SOL SDR + Follow Up + Qualificação", color: "text-blue-500" },
              { label: "SQL", value: threadKpis.sql, icon: UserCheck, subtitle: "Qualificado + Contato Realizado", color: "text-emerald-500" },
              { label: "Agendamentos", value: comercialKpis.agendamentos, icon: CalendarCheck, subtitle: "Contato Realizado (Comercial)", color: "text-amber-500" },
              { label: "Fechados", value: comercialKpis.fechados, icon: Trophy, subtitle: "Contrato Assinado + Pós-venda", color: "text-primary" },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm opacity-0 animate-fade-up"
                  style={{ animationDelay: `${i * 80}ms`, animationFillMode: "forwards" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-secondary`}>
                      <Icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {card.label}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                </div>
              );
            })}
          </div>

          {/* ── Secondary metrics ── */}
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
              Pipeline: {formatCurrencyAbbrev(kpis.valorPipeline)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
              Conversão: {kpis.taxaConversao.toFixed(1)}%
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
              Ticket Médio: {formatCurrencyAbbrev(kpis.ticketMedio)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
              Receita Fechada: {formatCurrencyAbbrev(kpis.valorGanho)}
            </span>
          </div>

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

          <div className="grid gap-6 lg:grid-cols-2">
            <StrategicAlerts
              proposals={filteredProposals}
              kpis={kpis}
              vendedorPerformance={vendedorPerformance}
              meta={meta}
            />
            <StrategicFunnel data={journeyFunnel} proposals={filteredProposals} />
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
