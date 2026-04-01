import { useMemo } from "react";
import { useSolLeads, type SolLead } from "@/hooks/useSolData";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { useAuth } from "@/hooks/useAuth";
import { solLeadsToProposals, type Proposal } from "@/data/dataAdapter";

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

export function useOrgFilteredProposals(): EnrichedData & { orgFilterActive: boolean } {
  const { data: leads, isLoading, error, isFetching, refetch } = useSolLeads();

  const proposals = useMemo(() => {
    if (!leads || leads.length === 0) return [];
    return solLeadsToProposals(leads);
  }, [leads]);

  return {
    proposals,
    lastUpdate: new Date().toLocaleString('pt-BR'),
    isLoading,
    error: error as Error | null,
    isFetching,
    refetch,
    enrichedCount: proposals.length,
    makeRecordsCount: leads?.length || 0,
    orgFilterActive: false,
  };
}
