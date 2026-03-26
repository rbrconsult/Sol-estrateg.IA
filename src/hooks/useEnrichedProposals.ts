import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMakeComercialData, ComercialRecord } from '@/hooks/useMakeComercialData';
import { useMakeDataStore } from '@/hooks/useMakeDataStore';
import { adaptComercialData, enrichProposalsWithMake, Proposal } from '@/data/dataAdapter';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface EnrichedData {
  proposals: Proposal[];
  lastUpdate: string;
  isLoading: boolean;
  error: Error | null;
  isFetching: boolean;
  refetch: () => void;
  /** Number of proposals enriched with Make data */
  enrichedCount: number;
  /** Total Make records available */
  makeRecordsCount: number;
}

/**
 * Fetches won leads from leads_consolidados that may not exist in the Make DS.
 * These are merged into the proposals list as a fallback.
 */
async function fetchGanhosFallback(): Promise<ComercialRecord[]> {
  const { data, error } = await supabase
    .from('leads_consolidados')
    .select('project_id, telefone, etapa_sm, responsavel, representante, nome, valor_proposta, potencia_sistema, status_proposta, data_proposta')
    .eq('status_proposta', '5');

  if (error || !data) return [];

  return data.map((r) => ({
    projetoId: r.project_id || '',
    telefone: r.telefone || '',
    etapaSM: r.etapa_sm || '',
    faseSM: 'OPERACIONAL',
    responsavel: r.responsavel || '',
    responsavelId: '',
    representante: r.representante || '',
    etiquetas: '',
    nomeProposta: r.nome || '',
    valorProposta: Number(r.valor_proposta) || 0,
    potenciaSistema: Number(r.potencia_sistema) || 0,
    tsProposta: r.data_proposta || '',
    statusProposta: '5',
    status: 'Ganho' as const,
    tsSync: '',
  }));
}

export function useEnrichedProposals(): EnrichedData {
  const { user } = useAuth();
  const {
    data: comercialRecords,
    isLoading: comercialLoading,
    error: comercialError,
    refetch,
    isFetching,
  } = useMakeComercialData();

  const {
    data: makeRecords,
    isLoading: makeLoading,
    error: makeError,
  } = useMakeDataStore();

  const { data: ganhosFallback } = useQuery({
    queryKey: ['ganhos-fallback'],
    queryFn: fetchGanhosFallback,
    staleTime: 1000 * 60 * 10,
    enabled: !!user,
  });

  const result = useMemo(() => {
    if (!comercialRecords || comercialRecords.length === 0) {
      return { proposals: [], enrichedCount: 0 };
    }

    // Merge fallback ganhos that are NOT already in Make DS (by projetoId)
    const makeProjectIds = new Set(comercialRecords.map(r => r.projetoId));
    const missingGanhos = (ganhosFallback || []).filter(g => g.projetoId && !makeProjectIds.has(g.projetoId));
    const allRecords = missingGanhos.length > 0 ? [...comercialRecords, ...missingGanhos] : comercialRecords;

    const adapted = adaptComercialData(allRecords);
    const enriched = enrichProposalsWithMake(adapted, makeRecords || []);
    const enrichedCount = enriched.filter(p => p.makeStatus || p.makeRobo).length;

    return { proposals: enriched, enrichedCount };
  }, [comercialRecords, makeRecords, ganhosFallback]);

  return {
    proposals: result.proposals,
    lastUpdate: new Date().toLocaleString('pt-BR'),
    isLoading: comercialLoading,
    error: comercialError as Error | null,
    isFetching,
    refetch,
    enrichedCount: result.enrichedCount,
    makeRecordsCount: makeRecords?.length || 0,
  };
}
