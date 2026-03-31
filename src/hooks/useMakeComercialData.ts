import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFranquiaId } from '@/hooks/useFranquiaId';

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
  status: 'Aberto' | 'Ganho' | 'Perdido';
  tsSync: string;
}

/** Mapeia status para status legível */
export function mapStatusProposta(status: string): 'Aberto' | 'Ganho' | 'Perdido' {
  const s = (status || '').toUpperCase();
  if (s === 'GANHO') return 'Ganho';
  if (s === 'PERDIDO' || s === 'DESQUALIFICADO') return 'Perdido';
  return 'Aberto';
}

/** Read comercial data from sol_leads_sync (v2) — leads with closer assigned */
async function fetchComercialFromSync(franquiaId: string): Promise<ComercialRecord[]> {
  const allRows: any[] = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('sol_leads_sync')
      .select('*')
      .eq('franquia_id', franquiaId)
      .not('closer_nome', 'is', null)
      .order('ts_cadastro', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error fetching comercial from sol_leads_sync:', error);
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
    const status = (r.status || '').toUpperCase();
    return {
      projetoId: String(r.project_id || ''),
      telefone: String(r.telefone || ''),
      etapaSM: String(r.etapa_funil || ''),
      faseSM: String(r.etapa_funil || ''),
      responsavel: String(r.closer_nome || ''),
      responsavelId: String(r.closer_sm_id || ''),
      representante: String(r.closer_nome || ''),
      etiquetas: '',
      nomeProposta: String(r.nome || ''),
      valorProposta: parseFloat(r.valor_conta || '0') || 0,
      potenciaSistema: 0,
      tsProposta: String(r.ts_qualificado || ''),
      statusProposta: status,
      status: mapStatusProposta(status),
      tsSync: String(r.synced_at || ''),
    };
  });
}

export function useMakeComercialData() {
  const { user } = useAuth();
  const franquiaId = useFranquiaId();

  return useQuery({
    queryKey: ['make-comercial-data', franquiaId],
    queryFn: () => fetchComercialFromSync(franquiaId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !!user,
  });
}
