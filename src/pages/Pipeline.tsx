import { useMemo, useState } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useMakeDataStore } from "@/hooks/useMakeDataStore";
import { useMakeComercialData } from "@/hooks/useMakeComercialData";
import { HelpButton } from "@/components/HelpButton";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { PageFloatingFilter } from "@/components/filters/PageFloatingFilter";

const PIPELINE_STAGES = [
  'TRAFEGO PAGO', 'PROSPECÇÃO', 'FOLLOW UP', 'QUALIFICAÇÃO',
  'QUALIFICADO', 'CONTATO REALIZADO', 'PROPOSTA', 'NEGOCIAÇÃO', 'CONTRATO ASSINADO',
];

// Status do DS Thread que excluem o lead do pipeline ativo
const STATUS_EXCLUIR = new Set([
  'DESQUALIFICADO', 'DECLINIO', 'DECLÍNIO', 'CANCELADO',
  'NAO_INTERESSADO', 'NÃO_INTERESSADO',
]);

const CONTRATO_AGRUPADOS = new Set([
  'COBRANÇA', 'COBRANCA', 'ANÁLISE DOCUMENTOS', 'ANALISE DOCUMENTOS',
  'APROVAÇÃO DE FINANCIAMENTO', 'APROVACAO DE FINANCIAMENTO',
  'ELABORAÇÃO DE CONTRATO', 'ELABORACAO DE CONTRATO',
  'CONTRATO ENVIADO', 'AGUARDANDO DOCUMENTOS',
  'RECEBIMENTO DO CLIENTE (F)', 'CONTRATO ASSINADO',
]);

const columnColors: Record<string, string> = {
  'TRAFEGO PAGO': 'border-t-blue-500',
  'PROSPECÇÃO': 'border-t-indigo-500',
  'FOLLOW UP': 'border-t-violet-500',
  'QUALIFICAÇÃO': 'border-t-cyan-500',
  'QUALIFICADO': 'border-t-teal-500',
  'CONTATO REALIZADO': 'border-t-emerald-500',
  'PROPOSTA': 'border-t-green-500',
  'NEGOCIAÇÃO': 'border-t-lime-500',
  'CONTRATO ASSINADO': 'border-t-amber-500',
};

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
}

type StatusView = 'abertos' | 'ganhos' | 'perdidos';

const Pipeline = () => {
  const { data: makeRecords, isLoading: threadLoading, error: threadError, refetch: refetchThread } = useMakeDataStore();
  const { data: comercialRecords, isLoading: comercialLoading, refetch: refetchComercial } = useMakeComercialData();
  const { selectedOrgName, selectedOrgId } = useOrgFilter();
  const gf = useGlobalFilters();
  const [statusView, setStatusView] = useState<StatusView>('abertos');

  const isLoading = threadLoading || comercialLoading;
  const orgFilterActive = !!selectedOrgId;
  const refetch = () => { refetchThread(); refetchComercial(); };

  const unifiedItems = useMemo<UnifiedItem[]>(() => {
    const items: UnifiedItem[] = [];

    // DS Thread — apenas leads ATIVOS (não desqualificados)
    for (const r of makeRecords || []) {
      const makeStatusUp = (r.makeStatus || '').toUpperCase();

      // Exclui desqualificados e declínios
      if (STATUS_EXCLUIR.has(makeStatusUp)) continue;

      let stage = (r.etapaFunil || 'TRAFEGO PAGO').toUpperCase();
      if (stage === 'PROSPECAO') stage = 'PROSPECÇÃO';
      if (stage === 'QUALIFICACAO') stage = 'QUALIFICAÇÃO';
      if (stage === 'NEGOCIACAO') stage = 'NEGOCIAÇÃO';
      if (stage === 'SOL SDR') stage = 'TRAFEGO PAGO';
      if (stage === 'DECLINIO' || stage === 'DECLÍNIO') continue;
      if (!PIPELINE_STAGES.includes(stage)) stage = 'TRAFEGO PAGO';

      items.push({
        id: `thread-${r.telefone}`,
        stage,
        name: r.nome || r.telefone || 'Lead',
        value: 0,
        power: 0,
        status: 'Aberto',
        responsavel: r.closerAtribuido || '',
        temperatura: r.makeTemperatura || '',
        source: 'thread',
      });
    }

    // DS Comercial — propostas (todas: abertas, ganhas, perdidas)
    for (const r of comercialRecords || []) {
      const etapaUpper = (r.etapaSM || '').toUpperCase().trim();
      let stage = etapaUpper;

      if (CONTRATO_AGRUPADOS.has(etapaUpper)) stage = 'CONTRATO ASSINADO';
      else if (etapaUpper === 'NEGOCIAÇÃO' || etapaUpper === 'NEGOCIACAO') stage = 'NEGOCIAÇÃO';
      else if (etapaUpper === 'PROPOSTA') stage = 'PROPOSTA';
      else stage = 'PROPOSTA'; // fallback

      items.push({
        id: `comercial-${r.projetoId}`,
        stage,
        name: r.nomeProposta || r.responsavel || 'Proposta',
        value: r.valorProposta,
        power: r.potenciaSistema,
        status: r.status,
        responsavel: r.responsavel || r.representante || '',
        temperatura: '',
        source: 'comercial',
      });
    }

    return items;
  }, [makeRecords, comercialRecords]);

  const filteredItems = useMemo(() => {
    if (statusView === 'abertos') return unifiedItems.filter(i => i.status === 'Aberto');
    if (statusView === 'ganhos') return unifiedItems.filter(i => i.status === 'Ganho');
    return unifiedItems.filter(i => i.status === 'Perdido');
  }, [unifiedItems, statusView]);

  const stageGroups = useMemo(() => {
    const groups: Record<string, UnifiedItem[]> = {};
    PIPELINE_STAGES.forEach(s => { groups[s] = []; });
    for (const item of filteredItems) {
      if (groups[item.stage]) groups[item.stage].push(item);
      else groups['TRAFEGO PAGO'].push(item);
    }
    return groups;
  }, [filteredItems]);

  const counts = useMemo(() => ({
    abertos: unifiedItems.filter(i => i.status === 'Aberto').length,
    ganhos: unifiedItems.filter(i => i.status === 'Ganho').length,
    perdidos: unifiedItems.filter(i => i.status === 'Perdido').length,
  }), [unifiedItems]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(v);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pipeline</h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Jornada completa · {counts.abertos} ativos · {counts.ganhos} ganhos · {counts.perdidos} perdidos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {orgFilterActive && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
              🏢 {selectedOrgName}
            </Badge>
          )}
          <HelpButton moduleId="pipeline" label="Ajuda do Pipeline" />
          <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading} className="text-muted-foreground hover:text-foreground">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <PageFloatingFilter
        filters={gf.filters} hasFilters={gf.hasFilters} clearFilters={gf.clearFilters}
        setPeriodo={gf.setPeriodo} setDateFrom={gf.setDateFrom} setDateTo={gf.setDateTo}
        setTemperatura={gf.setTemperatura} setSearchTerm={gf.setSearchTerm} setEtapa={gf.setEtapa}
        config={{ showPeriodo: true, showTemperatura: true, showSearch: true, showEtapa: true, searchPlaceholder: "Buscar lead..." }}
      />

      <Tabs value={statusView} onValueChange={(v) => setStatusView(v as StatusView)}>
        <TabsList>
          <TabsTrigger value="abertos">Abertos ({counts.abertos})</TabsTrigger>
          <TabsTrigger value="ganhos">Ganhos ({counts.ganhos})</TabsTrigger>
          <TabsTrigger value="perdidos">Perdidos ({counts.perdidos})</TabsTrigger>
        </TabsList>
      </Tabs>

      {threadError && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="flex items-center justify-between">
            <span>Erro ao carregar dados</span>
            <Button variant="ghost" size="sm" onClick={refetch} disabled={isLoading} className="ml-4">
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-8">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Carregando dados...
        </div>
      )}

      {!isLoading && (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-3 pb-4">
            {PIPELINE_STAGES.map((stage) => {
              const items = stageGroups[stage] || [];
              const totalValue = items.reduce((acc, i) => acc + i.value, 0);
              const totalPower = items.reduce((acc, i) => acc + i.power, 0);

              return (
                <div key={stage} className="flex-shrink-0 w-[220px]">
                  <div className={`rounded-t-lg border-t-4 ${columnColors[stage]} bg-card p-2.5`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground text-xs truncate">{stage}</h3>
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground ml-1 flex-shrink-0">
                        {items.length}
                      </span>
                    </div>
                    {(totalValue > 0 || totalPower > 0) && (
                      <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                        {totalValue > 0 && <span>{formatCurrency(totalValue)}</span>}
                        {totalPower > 0 && <span>{totalPower.toFixed(1)} kWp</span>}
                      </div>
                    )}
                  </div>

                  <div className="rounded-b-lg border border-t-0 border-border bg-muted/20 p-1.5 min-h-[400px] max-h-[calc(100vh-320px)] overflow-y-auto space-y-1.5">
                    {items.map((item) => (
                      <div key={item.id} className="rounded-md border border-border bg-card p-2 cursor-pointer hover:border-primary/50 transition-colors">
                        <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {item.value > 0 && <span className="text-xs text-emerald-400">{formatCurrency(item.value)}</span>}
                          {item.temperatura && (
                            <span className={`text-xs px-1 rounded ${
                              item.temperatura === 'QUENTE' ? 'bg-red-500/20 text-red-400' :
                              item.temperatura === 'MORNO' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>{item.temperatura}</span>
                          )}
                        </div>
                        {item.responsavel && <p className="text-xs text-muted-foreground truncate mt-0.5">{item.responsavel}</p>}
                        <span className={`text-xs px-1 rounded mt-1 inline-block ${
                          item.source === 'thread' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>{item.source === 'thread' ? 'SDR' : 'Comercial'}</span>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">Nenhum item</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
};

export default Pipeline;
