import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Proposal {
  etapa: string;
  projeto_id: string;
  nome_cliente: string;
  cliente_telefone: string;
  cliente_email: string;
  status: string;
  responsavel: string;
  representante: string;
  valor_proposta: number;
  potencia_sistema: string;
  nome_proposta: string;
  data_criacao_projeto: string;
  data_criacao_proposta: string;
  sla_proposta: string;
  ultima_atualizacao: string;
  dados_projeto: string;
  sol_qualificado: string;
  sol_score: string;
  temperatura: string;
  data_qualificacao_sol: string;
  nota_completa: string;
  tempo_na_etapa: string;
  sol_sdr: string;
  tempo_sol_sdr: string;
  etiquetas: string;
}

interface SheetsResponse {
  data: Proposal[];
  count: number;
  lastUpdate: string;
  error?: string;
  message?: string;
}

async function fetchSheetsData(organizationId: string | null): Promise<SheetsResponse> {
  const { data, error } = await supabase.functions.invoke<SheetsResponse>('fetch-sheets', {
    body: { organization_id: organizationId },
  });
  
  if (error) {
    console.error('Error fetching sheets data:', error);
    throw new Error(error.message || 'Failed to fetch data');
  }
  
  if (!data) {
    throw new Error('No data returned from edge function');
  }

  if (data.error) {
    throw new Error(data.message || data.error);
  }
  
  return data;
}

export function useGoogleSheetsData() {
  const { organizationId, user } = useAuth();

  return useQuery({
    queryKey: ['google-sheets-data', organizationId],
    queryFn: () => fetchSheetsData(organizationId),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 10,
    retry: 2,
    enabled: !!organizationId && !!user,
  });
}
