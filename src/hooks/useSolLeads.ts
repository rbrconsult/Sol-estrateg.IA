import { useSolLeadsSync, SolLeadSync } from "@/hooks/useSolLeadsSync";

// Re-export for backward compatibility — all consumers should use sol_leads_sync
export type SolLead = SolLeadSync;

export function useSolLeads() {
  return useSolLeadsSync();
}
