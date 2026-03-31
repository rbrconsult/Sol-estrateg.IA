import { useMemo } from 'react';
import { useMakeComercialData, ComercialRecord } from '@/hooks/useMakeComercialData';
import { useMakeDataStore } from '@/hooks/useMakeDataStore';
import { adaptComercialData, enrichProposalsWithMake, Proposal } from '@/data/dataAdapter';

export interface EnrichedData {
  proposals: Proposal[];
  lastUpdate: string;
  isLoading: boolean;
  error: Error | null;
  isFetching: boolean;
  refetch: () => void;
  enrichedCount: number;
  makeRecordsCount: number;
}

export function useEnrichedProposals(): EnrichedData {
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

  const result = useMemo(() => {
    if (!comercialRecords || comercialRecords.length === 0) {
      return { proposals: [], enrichedCount: 0 };
    }

    const adapted = adaptComercialData(comercialRecords);
    const enriched = enrichProposalsWithMake(adapted, makeRecords || []);
    const enrichedCount = enriched.filter(p => p.makeStatus || p.makeRobo).length;

    return { proposals: enriched, enrichedCount };
  }, [comercialRecords, makeRecords]);

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
