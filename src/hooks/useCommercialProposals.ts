import { useMemo } from 'react';
import { useSolProjetos } from '@/hooks/useSolData';
import { dedupeProjetosLatest, projetosToProposals, type Proposal } from '@/data/dataAdapter';
import { useOrgFilter } from '@/contexts/OrgFilterContext';
import { useFranquiaId } from '@/hooks/useFranquiaId';

/**
 * Fonte única para telas comerciais: sol_propostas → Proposal[] (1 linha por project_id).
 * Mesmo shape que useOrgFilteredProposals, com valores de proposta e etapas do SM.
 */
export function useCommercialProposals() {
  const { selectedOrgId } = useOrgFilter();
  const franquiaSlug = useFranquiaId();
  /** Filial selecionada sem slug → query desligada, 0 linhas até corrigir organizations.slug */
  const franchiseQuerySkipped = Boolean(selectedOrgId && !franquiaSlug.trim());

  const { data, isLoading, error, isFetching, refetch, dataUpdatedAt, isSuccess } = useSolProjetos();

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
    franchiseQuerySkipped,
    /** Query rodou com sucesso (pode ser array vazio = RLS ou tabela vazia). */
    apiReturnedRows: isSuccess && !franchiseQuerySkipped,
  };
}
