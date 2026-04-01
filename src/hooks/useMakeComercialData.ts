/** COMPAT SHIM — useMakeComercialData wraps useSolLeads for backward compatibility */
import { useSolLeads, useSolEquipe } from '@/hooks/useSolData';

export function useMakeComercialData() {
  const { data: leads, isLoading: l1 } = useSolLeads();
  const { data: equipe, isLoading: l2 } = useSolEquipe();

  return {
    data: leads || [],
    equipe: equipe || [],
    isLoading: l1 || l2,
  };
}
