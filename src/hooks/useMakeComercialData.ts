import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrgFilter } from '@/contexts/OrgFilterContext';

export interface ComercialRecord {
  projetoId: string;
  telefone: string;
  etapaSM: string;
  faseSM: string;
  responsavel: string;
  responsavelId: string;
  representante: string;
  etiquetas: string;
  nomeProposta: string;
  valorProposta: number;
  potenciaSistema: number;
  tsProposta: string;
  statusProposta: string;
  /** Status mapeado: 'Aberto' | 'Ganho' | 'Perdido' */
  status: 'Aberto' | 'Ganho' | 'Perdido';
  tsSync: string;
}

/** Mapeia status_proposta numérico para status legível */
export function mapStatusProposta(statusProposta: string, _faseSM?: string): 'Aberto' | 'Ganho' | 'Perdido' {
  if (statusProposta === '5') return 'Ganho';
  if (statusProposta === '3' || statusProposta === '4') return 'Perdido';
  return 'Aberto';
}

/** Read comercial data from leads_consolidados (local DB) instead of Make API */
async function fetchComercialFromDB(orgId?: string | null): Promise<ComercialRecord[]> {
  const allRows: any[] = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from('leads_consolidados')
      .select('*')
      .not('etapa_sm', 'is', null)
      .range(from, from + pageSize - 1)
      .order('data_proposta', { ascending: false });

    if (orgId) {
      query = query.eq('organization_id', orgId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching comercial from leads_consolidados:', error);
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

  return allRows.map((r) => {
    const statusProposta = String(r.status_proposta || '');
    const faseSM = String(r.etapa_sm || '');
    return {
      projetoId: String(r.project_id || ''),
      telefone: String(r.telefone || ''),
      etapaSM: String(r.etapa_sm || ''),
      faseSM,
      responsavel: String(r.responsavel || r.closer_atribuido || ''),
      responsavelId: '',
      representante: String(r.representante || ''),
      etiquetas: '',
      nomeProposta: String(r.nome || ''),
      valorProposta: Number(r.valor_proposta) || 0,
      potenciaSistema: r.potencia_sistema ? Number(r.potencia_sistema) : 0,
      tsProposta: String(r.data_proposta || ''),
      statusProposta,
      status: mapStatusProposta(statusProposta, faseSM),
      tsSync: String(r.synced_at || r.updated_at || ''),
    };
  });
}

export function useMakeComercialData() {
  const { user } = useAuth();
  let selectedOrgId: string | null = null;
  try {
    const orgFilter = useOrgFilter();
    selectedOrgId = orgFilter.selectedOrgId;
  } catch {}

  return useQuery({
    queryKey: ['make-comercial-data', selectedOrgId],
    queryFn: () => fetchComercialFromDB(selectedOrgId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !!user,
  });
}
