/** COMPAT SHIM — useMakeComercialData wraps useSolLeads for backward compatibility */
import { useSolLeads, useSolEquipe, type SolLead } from '@/hooks/useSolData';

export type ComercialRecord = SolLead;

export function useMakeComercialData() {
  const { data: leads, isLoading: l1, error, isFetching } = useSolLeads();
  const { data: equipe, isLoading: l2 } = useSolEquipe();

  return {
    data: leads || [],
    equipe: equipe || [],
    isLoading: l1 || l2,
    error,
    isFetching,
  };
}
