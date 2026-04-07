import { useMemo, useState, useEffect } from "react";
import { Loader2, AlertCircle, RefreshCw, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useSolLeads, SolLead } from '@/hooks/useSolData';
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { PageFloatingFilter } from "@/components/filters/PageFloatingFilter";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadDetailDrawer } from "@/components/sol/LeadDetailDrawer";
import { useSolActionsV2 as useSolActions } from '@/hooks/useSolActionsV2';
import { BRAND_FOOTER_TAGLINE } from "@/constants/branding";

import { normalizeCloser, getEtapaLabel, JOURNEY_ORDER } from "@/lib/leads-utils";
import { useLeadsDashboard } from "@/hooks/useLeadsDashboard";

// Importando os novos sub-componentes (Módulos) extraídos
import { LeadsKPIs } from "@/components/leads/LeadsKPIs";
import { LeadsFunnelAlerts } from "@/components/leads/LeadsFunnelAlerts";
import { LeadsSLAMonitor } from "@/components/leads/LeadsSLAMonitor";
import { LeadsRobotics } from "@/components/leads/LeadsRobotics";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadsTemperaturePipeline } from "@/components/leads/LeadsTemperaturePipeline";

const ETAPAS_PRE_VENDA_COMERCIAL = JOURNEY_ORDER;

function normalizeEtapaKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

export default function Leads() {
  const queryClient = useQueryClient();
  const { data: solLeads, isLoading, error } = useSolLeads();
  const { selectedOrgName } = useOrgFilter();
  const solActions = useSolActions();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEtapa, setFilterEtapa] = useState("todas");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterCloser, setFilterCloser] = useState("todos");
  const [filterCanal, setFilterCanal] = useState("todos");
  const [filterDsSource, setFilterDsSource] = useState("todos");
  
  // Controle do Gaveteiro (Drawer) lateral
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [drawerLead, setDrawerLead] = useState<SolLead | null>(null);
  const pf = useGlobalFilters();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['make-data-store'] });
  };

  /* ── clock ── */
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* ── Period filter ── */
  const periodFiltered = useMemo(() => {
    const records = solLeads || [];
    return pf.filterRecords ? pf.filterRecords(records) : records;
  }, [solLeads, pf.filterRecords]);

  const scopedByFunnel = useMemo(() => {
    const allowed = new Set(ETAPAS_PRE_VENDA_COMERCIAL.map(normalizeEtapaKey));
    return periodFiltered.filter((r) => allowed.has(normalizeEtapaKey(getEtapaLabel(r))));
  }, [periodFiltered]);

  /* ── Extract unique values for filters (normalized) ── */
  const etapas = useMemo(() => {
    const set = new Set<string>();
    scopedByFunnel.forEach(r => set.add(getEtapaLabel(r)));
    return Array.from(set).sort();
  }, [scopedByFunnel]);

  const closers = useMemo(() => {
    const set = new Set<string>();
    scopedByFunnel.forEach(r => {
      const c = normalizeCloser(r.closer_nome);
      if (c && c.toUpperCase() !== "SOL SDR") set.add(c);
    });
    return Array.from(set).sort();
  }, [scopedByFunnel]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    scopedByFunnel.forEach(r => { if (r.status) set.add(r.status); });
    return Array.from(set).sort();
  }, [scopedByFunnel]);

  /* ── Filtered records ── */
  const filtered = useMemo(() => {
    return scopedByFunnel.filter(r => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const match = (r.nome || "").toLowerCase().includes(term) ||
          (r.telefone || "").includes(term) ||
          (r.cidade || "").toLowerCase().includes(term);
        if (!match) return false;
      }
      if (filterEtapa !== "todas" && getEtapaLabel(r) !== filterEtapa) return false;
      if (filterStatus !== "todos" && r.status !== filterStatus) return false;
      if (filterCloser !== "todos" && normalizeCloser(r.closer_nome) !== filterCloser) return false;
      if (filterCanal !== "todos" && (r.canal_origem || "").toUpperCase() !== filterCanal) return false;
      if (filterDsSource !== "todos" && (r.franquia_id || "sol_leads") !== filterDsSource) return false;
      return true;
    });
  }, [scopedByFunnel, searchTerm, filterEtapa, filterStatus, filterCloser, filterCanal, filterDsSource]);

  // Hook isolado com o Heavy-Lifting matemático
  const dashboardData = useLeadsDashboard(filtered);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">Erro ao carregar dados</p>
        <Button onClick={() => window.location.reload()} variant="outline">Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-6 pb-16">

        {/* Floating Filter Global */}
        <PageFloatingFilter
          filters={pf.filters} hasFilters={pf.hasFilters} clearFilters={pf.clearFilters}
          setPeriodo={pf.setPeriodo} setDateFrom={pf.setDateFrom} setDateTo={pf.setDateTo}
          setTemperatura={pf.setTemperatura} setSearchTerm={pf.setSearchTerm} setEtapa={pf.setEtapa} setStatus={pf.setStatus}
          config={{ showPeriodo: true, showTemperatura: true, showSearch: false, showEtapa: true, showStatus: true, etapas: ETAPAS_PRE_VENDA_COMERCIAL }}
        />

        {/* Cabeçalho */}
        <header className="sticky top-0 z-50 py-5 flex items-center justify-between bg-background/95 backdrop-blur-sm border-b border-border/40">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">Leads</h1>
            <p className="text-xs text-muted-foreground mt-0.5">DS Thread · {filtered.length} de {(solLeads || []).length} leads</p>
          </div>
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Dados reais
            </span>
            <span className="text-xs text-muted-foreground font-mono tabular-nums">
              {time.toLocaleTimeString("pt-BR")}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh} title="Atualizar dados">
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </header>

        {/* ══════ FILTROS INLINE ══════ */}
        <section className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar nome, telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Select value={filterEtapa} onValueChange={setFilterEtapa}>
            <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Etapa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas Etapas</SelectItem>
              {etapas.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCloser} onValueChange={setFilterCloser}>
            <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Closer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Closers</SelectItem>
              {closers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCanal} onValueChange={setFilterCanal}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Canal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Canais</SelectItem>
              <SelectItem value="META_ADS">Meta Ads</SelectItem>
              <SelectItem value="GOOGLE_ADS">Google Ads</SelectItem>
              <SelectItem value="SITE_ORGANICO">Site</SelectItem>
              <SelectItem value="INBOUND_WHATSAPP">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterDsSource} onValueChange={setFilterDsSource}>
            <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Origem" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="sol_leads">SOL Leads</SelectItem>
            </SelectContent>
          </Select>
        </section>

        {/* ══════ MÓDULOS DE DASHBOARD E RENDERIZAÇÃO ══════ */}

        {/* Cartões Rápidos (KPIs) */}
        <LeadsKPIs kpis={dashboardData.kpis} />

        {/* Funil e Alertas */}
        <LeadsFunnelAlerts 
          funnelData={dashboardData.funnelData} 
          maxFunnel={dashboardData.maxFunnel} 
          funnelSum={dashboardData.funnelSum} 
          filteredLength={filtered.length}
          alerts={dashboardData.alerts}
          onLeadClick={setDrawerLead}
        />

        {/* Módulo de Resumo da Velocidade de Atendimento (SLA) */}
        <LeadsSLAMonitor 
          slaData={dashboardData.slaData} 
          responderamKpi={dashboardData.kpis.responderam}
        />

        {/* Módulo de Inteligência Artificial & Automação dos Robôs */}
        <LeadsRobotics robotData={dashboardData.robotData} />

        {/* Módulo da Tabela Completa (Com seus próprios filtros locais) */}
        <LeadsTable 
          filtered={filtered} 
          onLeadClick={setDrawerLead} 
          expandedLead={expandedLead} 
        />

        {/* Módulo Adicional: Temperatura pelo Caminho do Funil */}
        <LeadsTemperaturePipeline filtered={filtered} />

        <footer className="mt-12 mb-6 text-center">
          <p className="text-[10px] text-muted-foreground/60 font-medium">{BRAND_FOOTER_TAGLINE}</p>
        </footer>

        {/* ══════ GAVETEIRO DIREITO (Detail Drawer) ══════ */}
        <LeadDetailDrawer
          lead={drawerLead as any}
          open={!!drawerLead}
          onClose={() => setDrawerLead(null)}
          onQualificar={(l: any) => {
            solActions.qualificar.mutate({
              telefone: l.telefone,
              chat_id: l.chat_id || "",
              contact_id: l.contact_id || "",
              nome: l.nome,
              score: l.score || undefined,
              valor_conta: l.valor_conta,
            });
          }}
          onDesqualificar={(l: any) => {
            solActions.desqualificar.mutate({
              telefone: l.telefone,
              chat_id: l.chat_id || "",
              contact_id: l.contact_id || "",
              motivo: "Desqualificado via drawer",
            });
          }}
          onReprocessar={(l: any) => {
            solActions.reprocessar.mutate({ telefone: l.telefone });
          }}
          actionsLoading={solActions.isLoading}
        />
      </div>
    </div>
  );
}
