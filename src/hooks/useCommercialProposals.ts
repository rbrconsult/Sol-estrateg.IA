import { useMemo } from 'react';
import { useSolProjetos } from '@/hooks/useSolData';
import { dedupeProjetosLatest, projetosToProposals, type Proposal } from '@/data/dataAdapter';

/**
 * Fonte única para telas comerciais: sol_projetos_sync → Proposal[] (1 linha por project_id).
 * Mesmo shape que useOrgFilteredProposals, com valores de proposta e etapas do SM.
 */
export function useCommercialProposals() {
  const { data, isLoading, error, isFetching, refetch, dataUpdatedAt } = useSolProjetos();

  const proposals: Proposal[] = useMemo(() => {
    const rows = dedupeProjetosLatest(data || []);
    return projetosToProposals(rows);
  }, [data]);

  return {
    proposals,
    isLoading,
    error: error as Error | null,
    isFetching,
    refetch,
    dataUpdatedAt,
    rawCount: data?.length ?? 0,
    projectCount: proposals.length,
  };
}
