import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrgFilter } from '@/contexts/OrgFilterContext';

export interface ComercialRecord {
  projetoId: string;
  telefone: string;
  etapaSM: string;
  responsavel: string;
  responsavelId: string;
  representante: string;
  etiquetas: string;
  nomeProposta: string;
  valorProposta: number;
  potenciaSistema: number;
  tsProposta: string;
  statusProposta: string;
  tsSync: string;
}

interface MakeResponse {
  data: any[];
  count: number;
  lastUpdate: string;
  error?: string;
}

function parseRecords(raw: any[]): ComercialRecord[] {
  return raw.map((r) => {
    const d = r.data || r;
    return {
      projetoId: String(d.projeto_id || r.key || ''),
      telefone: String(d.telefone || ''),
      etapaSM: String(d.etapa_sm || ''),
      responsavel: String(d.responsavel || ''),
      responsavelId: String(d.responsavel_id || ''),
      representante: String(d.representante || ''),
      etiquetas: String(d.etiquetas || ''),
      nomeProposta: String(d.nome_proposta || ''),
      valorProposta: Number(d.valor_proposta) || 0,
      potenciaSistema: parseFloat(String(d.potencia_sistema || '0').replace(',', '.')) || 0,
      tsProposta: String(d.ts_proposta || ''),
      statusProposta: String(d.status_proposta || ''),
      tsSync: String(d.ts_sync || ''),
    };
  });
}

async function fetchComercialData(orgOverride?: string | null): Promise<ComercialRecord[]> {
  const body: Record<string, string> = {};
  if (orgOverride) {
    body.org_id = orgOverride;
  }

  const { data, error } = await supabase.functions.invoke<MakeResponse>('fetch-make-comercial', {
    body: Object.keys(body).length > 0 ? body : undefined,
  });

  if (error) {
    console.error('Error fetching comercial data:', error);
    throw new Error(error.message || 'Failed to fetch comercial data');
  }

  if (!data || data.error) {
    throw new Error(data?.error || 'No data returned');
  }

  return parseRecords(data.data);
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
    queryFn: () => fetchComercialData(selectedOrgId),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 10,
    retry: 1,
    enabled: !!user,
  });
}
