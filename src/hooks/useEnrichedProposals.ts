import { useMemo } from 'react';
import { useGoogleSheetsData } from '@/hooks/useGoogleSheetsData';
import { useMakeDataStore } from '@/hooks/useMakeDataStore';
import { adaptSheetData, enrichProposalsWithMake, Proposal } from '@/data/dataAdapter';

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

export function useEnrichedProposals(): EnrichedData {
  const {
    data: sheetsData,
    isLoading: sheetsLoading,
    error: sheetsError,
    refetch,
    isFetching,
  } = useGoogleSheetsData();

  const {
    data: makeRecords,
    isLoading: makeLoading,
    error: makeError,
  } = useMakeDataStore();

  const result = useMemo(() => {
    if (!sheetsData?.data || sheetsData.data.length === 0) {
      return { proposals: [], enrichedCount: 0 };
    }

    const adapted = adaptSheetData(sheetsData.data);
    const enriched = enrichProposalsWithMake(adapted, makeRecords || []);
    const enrichedCount = enriched.filter(p => p.makeStatus || p.makeRobo).length;

    return { proposals: enriched, enrichedCount };
  }, [sheetsData, makeRecords]);

  return {
    proposals: result.proposals,
    lastUpdate: sheetsData?.lastUpdate
      ? new Date(sheetsData.lastUpdate).toLocaleString('pt-BR')
      : new Date().toLocaleString('pt-BR'),
    isLoading: sheetsLoading,
    error: sheetsError as Error | null,
    isFetching,
    refetch,
    enrichedCount: result.enrichedCount,
    makeRecordsCount: makeRecords?.length || 0,
  };
}
