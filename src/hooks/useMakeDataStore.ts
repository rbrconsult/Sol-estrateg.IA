import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCallback } from 'react';

export interface MakeInteraction {
  tipo: 'enviada' | 'recebida';
  mensagem: string;
  data: string;
}

export interface MakeRecord {
  telefone: string;
  robo: 'sol' | 'fup_frio' | string;
  ultima_mensagem: string;
  data_envio: string;
  status_resposta: 'respondeu' | 'ignorou' | 'aguardando' | string;
  data_resposta?: string;
  historico: MakeInteraction[];
  makeStatus?: string;
  makeTemperatura?: string;
  makeScore?: string;
  nome?: string;
  cidade?: string;
  valorConta?: string;
  imovel?: string;
  email?: string;
  projectId?: string;
  followupCount?: number;
  lastFollowupDate?: string;
  codigoStatus?: string;
  etapaFunil?: string;
  closerAtribuido?: string;
  canalOrigem?: string;
  franquiaId?: string;
  campanhaNome?: string;
  etapaSm?: string;
  statusProposta?: string;
  potenciaSistema?: number;
  representante?: string;
  dataProposta?: string;
  dataFechamento?: string;
}

/** Normalize phone: keep only digits, strip leading country code 55 if 12+ digits */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 12 && digits.startsWith('55')) {
    return digits.slice(2);
  }
  return digits;
}

/** Map a leads_consolidados row to MakeRecord */
function rowToMakeRecord(r: any): MakeRecord {
  const fupCount = r.followup_count ?? 0;
  const robo = r.robo || (fupCount >= 1 ? 'fup_frio' : 'sol');

  let statusResposta: string;
  if (r.respondeu) {
    statusResposta = 'respondeu';
  } else if (r.codigo_status === 'NAO_RESPONDEU') {
    statusResposta = 'ignorou';
  } else {
    statusResposta = 'aguardando';
  }

  // Build minimal historico from DB fields
  const historico: MakeInteraction[] = [];
  if (r.data_entrada) {
    historico.push({ tipo: 'enviada', mensagem: 'Mensagem inicial enviada', data: r.data_entrada });
  }
  if (fupCount > 0 && r.last_followup_date) {
    for (let i = 0; i < Math.min(fupCount, 3); i++) {
      historico.push({ tipo: 'enviada', mensagem: `FUP Frio #${i + 1}`, data: r.last_followup_date });
    }
  }
  if (r.respondeu && r.data_qualificacao) {
    historico.push({ tipo: 'recebida', mensagem: 'Resposta do lead', data: r.data_qualificacao });
  }

  return {
    telefone: r.telefone || '',
    robo,
    ultima_mensagem: '',
    data_envio: r.data_entrada || r.last_followup_date || r.data_qualificacao || r.data_proposta || r.data_fechamento || '',
    status_resposta: statusResposta as any,
    data_resposta: r.respondeu ? (r.data_qualificacao || undefined) : undefined,
    historico,
    makeStatus: r.status || undefined,
    makeTemperatura: r.temperatura || undefined,
    makeScore: r.score ? String(r.score) : undefined,
    nome: r.nome || '',
    cidade: r.cidade || '',
    valorConta: r.valor_conta || '',
    imovel: r.imovel || '',
    email: r.email || '',
    projectId: r.project_id || '',
    followupCount: fupCount,
    lastFollowupDate: r.last_followup_date || '',
    codigoStatus: r.codigo_status || '',
    etapaFunil: r.etapa || undefined,
    closerAtribuido: r.closer_atribuido || r.responsavel || undefined,
    canalOrigem: r.canal_origem || undefined,
    franquiaId: undefined,
    campanhaNome: r.campanha || undefined,
    etapaSm: r.etapa_sm || undefined,
    statusProposta: r.status_proposta || undefined,
    potenciaSistema: r.potencia_sistema ? Number(r.potencia_sistema) : undefined,
    representante: r.representante || undefined,
    dataProposta: r.data_proposta || undefined,
    dataFechamento: r.data_fechamento || undefined,
  };
}

/** Fetch leads from leads_consolidados table */
async function fetchLeadsFromDB(): Promise<MakeRecord[]> {
  // Fetch all records (paginate beyond 1000 limit)
  const allRows: any[] = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('leads_consolidados')
      .select('*')
      .range(from, from + pageSize - 1)
      .order('data_entrada', { ascending: false });

    if (error) {
      console.error('Error fetching leads_consolidados:', error);
      throw new Error(error.message);
    }

    if (data && data.length > 0) {
      allRows.push(...data);
      hasMore = data.length === pageSize;
      from += pageSize;
    } else {
      hasMore = false;
    }
  }

  return allRows.map(rowToMakeRecord);
}

/** Trigger cron-sync edge function to pull fresh data from Make DS */
async function triggerCronSync(): Promise<void> {
  const { error } = await supabase.functions.invoke('cron-sync', {
    body: { time: new Date().toISOString() },
  });
  if (error) {
    console.error('Error triggering cron-sync:', error);
    throw error;
  }
}

export function useMakeDataStore() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['make-data-store'],
    queryFn: fetchLeadsFromDB,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchInterval: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !!user,
  });

  /** Force sync: calls cron-sync then refetches from DB */
  const forceSync = useCallback(async () => {
    await triggerCronSync();
    await queryClient.invalidateQueries({ queryKey: ['make-data-store'] });
  }, [queryClient]);

  return {
    ...query,
    forceSync,
  };
}

/** Build a map keyed by normalized phone for O(1) lookup */
export function buildMakeMap(records: MakeRecord[]): Map<string, MakeRecord[]> {
  const map = new Map<string, MakeRecord[]>();
  for (const r of records) {
    if (!r.telefone) continue;
    const existing = map.get(r.telefone) || [];
    existing.push(r);
    map.set(r.telefone, existing);
  }
  return map;
}
