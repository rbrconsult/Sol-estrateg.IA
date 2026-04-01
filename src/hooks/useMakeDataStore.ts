/**
 * COMPAT SHIM — Maps sol_leads_sync (v2) to the old MakeRecord interface.
 * Pages that still use useMakeDataStore() will work via this bridge.
 * TODO: Migrate each page to useSolLeads() directly and delete this file.
 */
import { useSolLeads, useForceSync, normalizePhone, type SolLead } from '@/hooks/useSolData';

export { normalizePhone };

export interface MakeRecord {
  telefone: string;
  nome: string;
  cidade: string;
  email: string;
  canalOrigem: string;
  makeStatus: string;
  makeTemperatura: string;
  makeScore: string;
  makeNome: string;
  etapaFunil: string;
  robo: string;
  valorConta: string;
  status_resposta: string;
  data_envio: string;
  data_resposta: string;
  codigoStatus: string;
  projectId: string;
  historico: { data: string; tipo: string; mensagem: string }[];
  followupCount: number;
  lastFollowupDate: string;
  dataEntrada: string;
  dataProposta: string;
  dataFechamento: string;
  etapaSm: string;
  closerAtribuido: string;
  statusProposta: string;
  respondeu: boolean;
  imovel: string;
  sentimento: string;
  interesse: string;
  ultimaMensagem: string;
  dsSource: string;
  totalMensagensIa: number;
  representante: string;
  chatId: string;
  contactId: string;
}

function solLeadToMakeRecord(l: SolLead): MakeRecord {
  return {
    telefone: l.telefone || '',
    nome: l.nome || '',
    cidade: l.cidade || '',
    email: l.email || '',
    canalOrigem: l.canal_origem || '',
    makeStatus: l.status || '',
    makeTemperatura: l.temperatura || '',
    makeScore: l.score || '',
    makeNome: l.nome || '',
    etapaFunil: l.etapa_funil || '',
    robo: 'sol',
    valorConta: l.valor_conta || '',
    status_resposta: l.transferido_comercial ? 'respondeu' : (l.status === 'FOLLOW_UP' ? 'aguardando' : ''),
    data_envio: l.ts_cadastro || '',
    data_resposta: l.ts_ultima_interacao || '',
    codigoStatus: l.status || '',
    projectId: l.project_id || '',
    historico: [],
    followupCount: l.fup_followup_count || 0,
    lastFollowupDate: l.ts_ultimo_fup || '',
    dataEntrada: l.ts_cadastro || '',
    dataProposta: l.ts_qualificado || '',
    dataFechamento: '',
    etapaSm: l.etapa_funil || '',
    closerAtribuido: l.closer_nome || '',
    statusProposta: '',
    respondeu: l.transferido_comercial || false,
    imovel: l.tipo_imovel || '',
    sentimento: '',
    interesse: '',
    ultimaMensagem: l.resumo_conversa || '',
  };
}

export function buildMakeMap(records: MakeRecord[]): Map<string, MakeRecord> {
  const map = new Map<string, MakeRecord>();
  for (const r of records) {
    if (r.telefone) map.set(normalizePhone(r.telefone), r);
  }
  return map;
}

export function useMakeDataStore() {
  const { data: leads, isLoading, isFetching, error, refetch } = useSolLeads();
  const { forceSync, isSyncing } = useForceSync();

  const records = (leads || []).map(solLeadToMakeRecord);

  return {
    data: records,
    isLoading,
    isFetching,
    error,
    refetch,
    forceSync: () => { forceSync(); },
    isSyncing,
  };
}
