import { useMemo, useState } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { HelpButton } from "@/components/HelpButton";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { PageFloatingFilter } from "@/components/filters/PageFloatingFilter";
import { useSolLeads, type SolLead } from "@/hooks/useSolData";
import type { Proposal } from "@/data/dataAdapter";

// Mapeamento status v2 → coluna Kanban
const STATUS_TO_KANBAN: Record<string, string> = {
  'TRAFEGO_PAGO': 'TRAFEGO PAGO',
  'EM_QUALIFICACAO': 'QUALIFICAÇÃO',
  'QUALIFICADO': 'QUALIFICADO',
  'FOLLOW_UP': 'FOLLOW UP',
  'CONTRATO': 'CONTRATO ASSINADO',
};

const STATUS_EXCLUIR = new Set(['DESQUALIFICADO']);

type StatusView = 'abertos' | 'ganhos' | 'perdidos';

function mapStatus(s: string | null): 'Aberto' | 'Ganho' | 'Perdido' {
  const up = (s || '').toUpperCase();
  if (up === 'GANHO') return 'Ganho';
  if (up === 'PERDIDO') return 'Perdido';
  return 'Aberto';
}

function leadToProposal(lead: SolLead, idx: number): Proposal {
  const status = mapStatus(lead.status);
  const statusUp = (lead.status || 'TRAFEGO_PAGO').toUpperCase();
  const etapa = STATUS_TO_KANBAN[statusUp] || 'TRAFEGO PAGO';

  return {
    id: `sol-${lead.telefone}-${idx}`,
    etapa,
    projetoId: lead.project_id || '',
    nomeCliente: lead.nome || lead.telefone || 'Lead',
    clienteTelefone: lead.telefone || '',
    clienteEmail: lead.email || '',
    status,
    responsavel: lead.closer_nome || '',
    responsavelId: '',
    representante: lead.closer_nome || '',
    valorProposta: 0,
    potenciaSistema: 0,
    nomeProposta: lead.nome || lead.telefone || 'Lead',
    dataCriacaoProjeto: lead.ts_cadastro || '',
    dataCriacaoProposta: lead.ts_cadastro || '',
    slaProposta: 0,
    ultimaAtualizacao: lead.ts_ultima_interacao || lead.ts_cadastro || '',
    solQualificado: statusUp === 'QUALIFICADO',
    solScore: parseFloat(lead.score || '0') || 0,
    temperatura: (lead.temperatura as any) || '',
    dataQualificacaoSol: lead.ts_qualificado || '',
    notaCompleta: lead.resumo_conversa || '',
    tempoNaEtapa: 0,
    solSdr: false,
    tempoSolSdr: 0,
    etiquetas: '',
    origemLead: lead.canal_origem || '',
    probabilidade: 50,
    motivoPerda: '',
    faseSM: '',
    makeStatus: lead.status || undefined,
    makeTemperatura: lead.temperatura || undefined,
    makeScore: lead.score || undefined,
    makeCidade: lead.cidade || undefined,
    makeValorConta: lead.valor_conta || undefined,
  };
}

const Pipeline = () => {
  const { data: leads, isLoading, error } = useSolLeads();
  const gf = useGlobalFilters();
  const [statusView, setStatusView] = useState<StatusView>('abertos');

  // Filtra leads com filtros globais
  const filteredLeads = useMemo(() => {
    if (!leads?.length) return [];
    const search = gf.filters.searchTerm.trim().toLowerCase();
    const { from, to } = gf.effectiveDateRange;

    return leads.filter((l) => {
      const statusUp = (l.status || '').toUpperCase();
      if (STATUS_EXCLUIR.has(statusUp)) return false;

      // Filtro de período
      if (from || to) {
        const dateStr = l.ts_cadastro;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return false;
        if (from && d < new Date(new Date(from).setHours(0, 0, 0, 0))) return false;
        if (to && d > new Date(new Date(to).setHours(23, 59, 59, 999))) return false;
      }

      if (gf.filters.temperatura !== 'todas' && (l.temperatura || '').toUpperCase() !== gf.filters.temperatura) return false;
      if (gf.filters.status !== 'todos' && statusUp !== gf.filters.status.toUpperCase()) return false;
      if (search && !(l.nome || '').toLowerCase().includes(search) && !l.telefone.includes(search)) return false;

      return true;
    });
  }, [leads, gf.effectiveDateRange, gf.filters]);

  // Converte pra Proposals
  const allProposals = useMemo(
    () => filteredLeads.map((l, i) => leadToProposal(l, i)),
    [filteredLeads]
  );

  // Contagens
  const counts = useMemo(() => ({
    abertos: allProposals.filter(p => p.status === 'Aberto').length,
    ganhos: allProposals.filter(p => p.status === 'Ganho').length,
    perdidos: allProposals.filter(p => p.status === 'Perdido').length,
  }), [allProposals]);

  // Filtra por aba
  const proposalsForKanban = useMemo(() => {
    if (statusView === 'abertos') return allProposals.filter(p => p.status === 'Aberto');
    if (statusView === 'ganhos') return allProposals.filter(p => p.status === 'Ganho');
    return allProposals.filter(p => p.status === 'Perdido');
  }, [allProposals, statusView]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pipeline</h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Visão Kanban · Jornada completa · Fonte: sol_leads_sync
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{proposalsForKanban.length} itens</Badge>
          <HelpButton moduleId="pipeline" label="Ajuda do Pipeline" />
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
        setTemperatura={gf.setTemperatura} setSearchTerm={gf.setSearchTerm} setEtapa={gf.setEtapa} setStatus={gf.setStatus}
        config={{ showPeriodo: true, showTemperatura: true, showSearch: true, showEtapa: false, showStatus: true, searchPlaceholder: "Buscar lead..." }}
      />

      {error && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription>Erro ao carregar dados: {(error as Error).message}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-8">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Carregando dados...
        </div>
      )}

      {!isLoading && proposalsForKanban.length === 0 && !error && (
        <Alert className="border-muted bg-muted/30">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <AlertDescription>
            {!leads?.length
              ? "Aguardando sincronização — as tabelas _sync serão populadas pelo cron-sync."
              : "Nenhum lead encontrado para a visualização selecionada."}
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && proposalsForKanban.length > 0 && (
        <KanbanBoard proposals={proposalsForKanban} />
      )}
    </div>
  );
};

export default Pipeline;
