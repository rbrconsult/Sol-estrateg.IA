import { useMemo, useState } from "react";
import { useForceSync } from "@/hooks/useForceSync";
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
import { adaptComercialData } from "@/data/dataAdapter";
import type { Proposal } from "@/data/dataAdapter";
import { useMakeComercialData } from "@/hooks/useMakeComercialData";

const PIPELINE_STAGES = [
  'TRAFEGO PAGO', 'PROSPECÇÃO', 'FOLLOW UP', 'QUALIFICAÇÃO',
  'QUALIFICADO', 'CONTATO REALIZADO', 'PROPOSTA', 'NEGOCIAÇÃO', 'CONTRATO ASSINADO',
];

const CONTRATO_AGRUPADOS = new Set([
  'CONTRATO ASSINADO', 'COBRANÇA', 'COBRANCA', 'ANÁLISE DOCUMENTOS', 'ANALISE DOCUMENTOS',
  'APROVAÇÃO DE FINANCIAMENTO', 'APROVACAO DE FINANCIAMENTO',
  'ELABORAÇÃO DE CONTRATO', 'ELABORACAO DE CONTRATO',
  'CONTRATO ENVIADO', 'AGUARDANDO DOCUMENTOS', 'RECEBIMENTO DO CLIENTE (F)',
]);

const THREAD_STAGES = new Set([
  'TRAFEGO PAGO', 'PROSPECÇÃO', 'FOLLOW UP', 'QUALIFICAÇÃO', 'QUALIFICADO', 'CONTATO REALIZADO',
]);

// Status que excluem o lead do pipeline ativo
const STATUS_EXCLUIR = new Set([
  'DESQUALIFICADO', 'DECLINIO', 'DECLÍNIO', 'CANCELADO',
]);

type StatusView = 'abertos' | 'ganhos' | 'perdidos';

const Pipeline = () => {
  const { proposals: allProposals, lastUpdate, isLoading, error, refetch, isFetching, orgFilterActive } = useOrgFilteredProposals();
  const { data: makeRecords, isLoading: makeLoading } = useMakeDataStore();
  const { data: comercialRecords, isLoading: comercialLoading } = useMakeComercialData();
  const { selectedOrgName } = useOrgFilter();
  const gf = useGlobalFilters();
  const [statusView, setStatusView] = useState<StatusView>('abertos');

  const loading = isLoading || makeLoading || comercialLoading;

  // Proposals do DS Comercial (adaptadas para Proposal com status mapeado)
  const comercialProposals = useMemo(() => {
    if (!comercialRecords?.length) return allProposals;
    return adaptComercialData(comercialRecords);
  }, [comercialRecords, allProposals]);

  const filteredProposals = useMemo(
    () => gf.filterProposals(comercialProposals),
    [comercialProposals, gf.filterProposals]
  );

  // Proposals filtradas por status view (para o KanbanBoard)
  const proposalsByStatus = useMemo(() => {
    if (statusView === 'abertos') return filteredProposals.filter(p => p.status === 'Aberto');
    if (statusView === 'ganhos') return filteredProposals.filter(p => p.status === 'Ganho');
    return filteredProposals.filter(p => p.status === 'Perdido');
  }, [filteredProposals, statusView]);

  // Leads ativos do DS Thread (sem desqualificados)
  const threadLeads = useMemo(() => {
    if (!makeRecords?.length) return [];
    return makeRecords.filter(r => {
      const statusUp = (r.makeStatus || '').toUpperCase();
      if (STATUS_EXCLUIR.has(statusUp)) return false;
      const etapa = (r.etapaFunil || '').toUpperCase();
      if (etapa === 'DECLINIO' || etapa === 'DECLÍNIO') return false;
      return true;
    });
  }, [makeRecords]);

  // Contagens por status
  const counts = useMemo(() => ({
    abertos: filteredProposals.filter(p => p.status === 'Aberto').length + threadLeads.length,
    ganhos: filteredProposals.filter(p => p.status === 'Ganho').length,
    perdidos: filteredProposals.filter(p => p.status === 'Perdido').length,
  }), [filteredProposals, threadLeads]);

  // Para a view "abertos", o KanbanBoard precisa incluir os leads do DS Thread
  // como Proposals sintéticas nas etapas pré-venda
  const proposalsForKanban = useMemo(() => {
    if (statusView !== 'abertos') return proposalsByStatus;

    // Cria Proposals sintéticas para leads do DS Thread
    const threadAsProposals: Proposal[] = threadLeads.map((r, idx) => {
      let etapa = (r.etapaFunil || 'TRAFEGO PAGO').toUpperCase();
      if (etapa === 'PROSPECAO') etapa = 'PROSPECÇÃO';
      if (etapa === 'QUALIFICACAO') etapa = 'QUALIFICAÇÃO';
      if (etapa === 'SOL SDR') etapa = 'TRAFEGO PAGO';
      if (!THREAD_STAGES.has(etapa)) etapa = 'TRAFEGO PAGO';

      return {
        id: `thread-${r.telefone}-${idx}`,
        etapa,
        projetoId: r.projectId || '',
        nomeCliente: r.nome || r.telefone || 'Lead',
        clienteTelefone: r.telefone || '',
        clienteEmail: r.email || '',
        status: 'Aberto' as const,
        responsavel: r.closerAtribuido && r.closerAtribuido !== 'SOL SDR' ? r.closerAtribuido : '',
        responsavelId: '',
        representante: r.closerAtribuido && r.closerAtribuido !== 'SOL SDR' ? r.closerAtribuido : '',
        valorProposta: 0,
        potenciaSistema: 0,
        nomeProposta: r.nome || r.telefone || 'Lead',
        dataCriacaoProjeto: r.data_envio || '',
        dataCriacaoProposta: r.data_envio || '',
        slaProposta: 0,
        ultimaAtualizacao: r.data_envio || '',
        solQualificado: false,
        solScore: parseFloat(r.makeScore || '0') || 0,
        temperatura: (r.makeTemperatura as any) || '',
        dataQualificacaoSol: '',
        notaCompleta: '',
        tempoNaEtapa: 0,
        solSdr: false,
        tempoSolSdr: 0,
        etiquetas: '',
        origemLead: '',
        probabilidade: 50,
        motivoPerda: '',
        makeStatus: r.makeStatus,
        makeTemperatura: r.makeTemperatura,
        makeScore: r.makeScore,
        makeRobo: r.robo,
        makeStatusResposta: r.status_resposta,
        makeCidade: r.cidade,
        makeValorConta: r.valorConta,
      };
    });

    // Filtra propostas comerciais para só mostrar etapas comerciais na view abertos
    const comercialAbertos = proposalsByStatus.filter(p => {
      const etapa = (p.etapa || '').toUpperCase();
      return !THREAD_STAGES.has(etapa);
    });

    return [...threadAsProposals, ...comercialAbertos];
  }, [statusView, proposalsByStatus, threadLeads]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pipeline</h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Visão Kanban · Jornada completa · Atualizado: {lastUpdate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {orgFilterActive && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
              🏢 {selectedOrgName}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">{proposalsForKanban.length} itens</Badge>
          <HelpButton moduleId="pipeline" label="Ajuda do Pipeline" />
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="text-muted-foreground hover:text-foreground">
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs value={statusView} onValueChange={(v) => setStatusView(v as StatusView)}>
        <TabsList>
          <TabsTrigger value="abertos">Abertos ({counts.abertos})</TabsTrigger>
          <TabsTrigger value="ganhos">Ganhos ({counts.ganhos})</TabsTrigger>
          <TabsTrigger value="perdidos">Perdidos ({counts.perdidos})</TabsTrigger>
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

      {!loading && proposalsForKanban.length === 0 && !error && (
        <Alert className="border-warning/50 bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription>Nenhum dado encontrado para a visualização selecionada.</AlertDescription>
        </Alert>
      )}

      {/* KanbanBoard — drawer lateral funciona para todos os cards */}
      {!loading && proposalsForKanban.length > 0 && (
        <KanbanBoard proposals={proposalsForKanban} />
      )}
    </div>
  );
};

export default Pipeline;
