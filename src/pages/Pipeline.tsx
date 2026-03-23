import { useMemo, useState } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrgFilteredProposals } from "@/hooks/useOrgFilteredProposals";
import { useMakeDataStore, type MakeRecord } from "@/hooks/useMakeDataStore";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { HelpButton } from "@/components/HelpButton";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { PageFloatingFilter } from "@/components/filters/PageFloatingFilter";
import type { Proposal } from "@/data/dataAdapter";

/** 
 * Unified Pipeline: merges DS Thread (64798) stages + DS Comercial (84404) stages 
 * CONTRATO ASSINADO groups multiple post-sale stages
 */

const PIPELINE_STAGES = [
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

const CONTRATO_AGRUPADOS = [
  'CONTRATO ASSINADO', 'COBRANÇA', 'COBRANCA', 'ANÁLISE DOCUMENTOS', 'ANALISE DOCUMENTOS',
  'APROVAÇÃO DE FINANCIAMENTO', 'APROVACAO DE FINANCIAMENTO',
  'ELABORAÇÃO DE CONTRATO', 'ELABORACAO DE CONTRATO',
  'CONTRATO ENVIADO', 'AGUARDANDO DOCUMENTOS',
];

/** Thread stages come from DS Thread (etapa_funil) */
const THREAD_STAGES = new Set(['TRAFEGO PAGO', 'PROSPECÇÃO', 'FOLLOW UP', 'QUALIFICAÇÃO', 'QUALIFICADO', 'CONTATO REALIZADO']);

type StatusView = 'abertos' | 'ganhos' | 'perdidos';

interface UnifiedItem {
  id: string;
  stage: string;
  name: string;
  value: number;
  power: number;
  status: 'Aberto' | 'Ganho' | 'Perdido';
  responsavel: string;
  temperatura: string;
  source: 'thread' | 'comercial';
  raw?: Proposal | MakeRecord;
}

const Pipeline = () => {
  const { proposals: allProposals, lastUpdate, isLoading, error, refetch, isFetching, enrichedCount, orgFilterActive } = useOrgFilteredProposals();
  const { data: makeRecords, isLoading: makeLoading } = useMakeDataStore();
  const { selectedOrgName } = useOrgFilter();
  const gf = useGlobalFilters();
  const [statusView, setStatusView] = useState<StatusView>('abertos');

  const proposals = useMemo(() => gf.filterProposals(allProposals), [allProposals, gf.filterProposals]);

  // Build unified items from both data sources
  const unifiedItems = useMemo(() => {
    const items: UnifiedItem[] = [];

    // DS Thread items (stages: TRAFEGO PAGO through CONTATO REALIZADO)
    if (makeRecords?.length) {
      for (const r of makeRecords) {
        const etapa = r.etapaFunil || 'TRAFEGO PAGO';
        if (!THREAD_STAGES.has(etapa)) continue;
        items.push({
          id: `thread-${r.telefone}-${r.data_envio}`,
          stage: etapa,
          name: r.nome || r.telefone || 'Lead',
          value: 0,
          power: 0,
          status: 'Aberto',
          responsavel: r.closerAtribuido || '',
          temperatura: r.makeTemperatura || '',
          source: 'thread',
          raw: r as any,
        });
      }
    }

    // DS Comercial items (stages: PROPOSTA, NEGOCIAÇÃO, CONTRATO ASSINADO)
    for (const p of proposals) {
      const etapaUpper = p.etapa?.toUpperCase() || '';
      let stage = etapaUpper;
      
      // Map to unified stage
      if (CONTRATO_AGRUPADOS.includes(etapaUpper)) {
        stage = 'CONTRATO ASSINADO';
      } else if (THREAD_STAGES.has(etapaUpper)) {
        // Skip — already counted from DS Thread
        continue;
      } else if (!PIPELINE_STAGES.includes(etapaUpper)) {
        // Unmapped comercial stages go to PROPOSTA
        stage = 'PROPOSTA';
      }

      items.push({
        id: p.id,
        stage,
        name: p.nomeCliente,
        value: p.valorProposta,
        power: p.potenciaSistema,
        status: p.status,
        responsavel: p.representante || p.responsavel,
        temperatura: p.temperatura,
        source: 'comercial',
        raw: p as any,
      });
    }

    return items;
  }, [makeRecords, proposals]);

  // Filter by status view
  const filteredItems = useMemo(() => {
    if (statusView === 'abertos') return unifiedItems.filter(i => i.status === 'Aberto');
    if (statusView === 'ganhos') return unifiedItems.filter(i => i.status === 'Ganho');
    return unifiedItems.filter(i => i.status === 'Perdido');
  }, [unifiedItems, statusView]);

  // Group by stage
  const stageGroups = useMemo(() => {
    const groups: Record<string, UnifiedItem[]> = {};
    for (const s of PIPELINE_STAGES) groups[s] = [];
    for (const item of filteredItems) {
      if (groups[item.stage]) groups[item.stage].push(item);
      else groups[PIPELINE_STAGES[0]].push(item);
    }
    return groups;
  }, [filteredItems]);

  const totalItems = filteredItems.length;
  const loading = isLoading || makeLoading;

  const stageColors: Record<string, string> = {
    'TRAFEGO PAGO': 'bg-blue-500/20 border-blue-500/50',
    'PROSPECÇÃO': 'bg-indigo-500/20 border-indigo-500/50',
    'FOLLOW UP': 'bg-violet-500/20 border-violet-500/50',
    'QUALIFICAÇÃO': 'bg-cyan-500/20 border-cyan-500/50',
    'QUALIFICADO': 'bg-teal-500/20 border-teal-500/50',
    'CONTATO REALIZADO': 'bg-emerald-500/20 border-emerald-500/50',
    'PROPOSTA': 'bg-green-500/20 border-green-500/50',
    'NEGOCIAÇÃO': 'bg-lime-500/20 border-lime-500/50',
    'CONTRATO ASSINADO': 'bg-amber-500/20 border-amber-500/50',
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(value);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pipeline</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Visão Kanban · Jornada completa · Atualizado: {lastUpdate}</p>
        </div>
        <div className="flex items-center gap-2">
          {orgFilterActive && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
              🏢 {selectedOrgName}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">{totalItems} itens</Badge>
          <HelpButton moduleId="pipeline" label="Ajuda do Pipeline" />
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="text-muted-foreground hover:text-foreground">
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Status Views */}
      <Tabs value={statusView} onValueChange={(v) => setStatusView(v as StatusView)}>
        <TabsList>
          <TabsTrigger value="abertos">Abertos ({unifiedItems.filter(i => i.status === 'Aberto').length})</TabsTrigger>
          <TabsTrigger value="ganhos">Ganhos ({unifiedItems.filter(i => i.status === 'Ganho').length})</TabsTrigger>
          <TabsTrigger value="perdidos">Perdidos ({unifiedItems.filter(i => i.status === 'Perdido').length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <PageFloatingFilter
        filters={gf.filters} hasFilters={gf.hasFilters} clearFilters={gf.clearFilters}
        setPeriodo={gf.setPeriodo} setDateFrom={gf.setDateFrom} setDateTo={gf.setDateTo}
        setTemperatura={gf.setTemperatura} setSearchTerm={gf.setSearchTerm} setEtapa={gf.setEtapa}
        config={{ showPeriodo: true, showTemperatura: true, showSearch: true, showEtapa: true, searchPlaceholder: "Buscar lead..." }}
      />

      {error && (
        <Alert className="border-destructive/50 bg-destructive/10">
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

      {loading && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-8">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Carregando dados...
        </div>
      )}

      {!loading && totalItems === 0 && !error && (
        <Alert className="border-warning/50 bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription>Nenhum dado encontrado para a visualização selecionada.</AlertDescription>
        </Alert>
      )}

      {/* Kanban Board */}
      {totalItems > 0 && (
        <div className="overflow-x-auto">
          <div className="flex gap-3 pb-4" style={{ minWidth: PIPELINE_STAGES.length * 260 }}>
            {PIPELINE_STAGES.map((stage) => {
              const items = stageGroups[stage] || [];
              const totalValue = items.reduce((acc, i) => acc + i.value, 0);
              const totalPower = items.reduce((acc, i) => acc + i.power, 0);

              return (
                <div key={stage} className="flex-shrink-0" style={{ width: 250 }}>
                  <div className={`rounded-t-lg border-t-4 ${stageColors[stage] || 'bg-muted border-muted'} bg-card p-2.5`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground text-xs">{stage}</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {items.length}
                      </span>
                    </div>
                    {totalValue > 0 && (
                      <div className="mt-1.5 flex gap-2 text-[10px] text-muted-foreground">
                        <span>{formatCurrency(totalValue)}</span>
                        {totalPower > 0 && <><span>•</span><span>{totalPower.toFixed(1)} kWp</span></>}
                      </div>
                    )}
                  </div>

                  <div className="rounded-b-lg border border-t-0 border-border bg-muted/20 p-1.5 min-h-[400px] max-h-[calc(100vh-350px)] overflow-y-auto">
                    <div className="space-y-1.5">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-border/50 bg-card p-2.5 hover:border-border transition-colors cursor-pointer text-xs"
                        >
                          <p className="font-medium text-foreground truncate text-[11px]">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                            {item.value > 0 && <span className="font-semibold text-foreground">{formatCurrency(item.value)}</span>}
                            {item.temperatura && (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                item.temperatura === 'QUENTE' ? 'bg-destructive/10 text-destructive' :
                                item.temperatura === 'MORNO' ? 'bg-warning/10 text-warning' :
                                'bg-blue-500/10 text-blue-500'
                              }`}>
                                {item.temperatura}
                              </span>
                            )}
                          </div>
                          {item.responsavel && (
                            <p className="text-[10px] text-muted-foreground mt-1 truncate">{item.responsavel}</p>
                          )}
                          <div className="mt-1">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                              item.source === 'thread' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'
                            }`}>
                              {item.source === 'thread' ? 'Thread' : 'Comercial'}
                            </span>
                          </div>
                        </div>
                      ))}
                      {items.length === 0 && (
                        <div className="flex items-center justify-center h-20 text-[11px] text-muted-foreground">
                          Nenhum item
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Pipeline;
