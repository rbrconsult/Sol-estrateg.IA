import { createContext, useContext, ReactNode } from "react";
import { usePageFilters, FilterState, FilterConfig } from "@/components/filters/PageFloatingFilter";

interface GlobalFilterContextType {
  filters: FilterState;
  hasFilters: boolean;
  clearFilters: () => void;
  setPeriodo: (v: string) => void;
  setDateFrom: (d: Date | undefined) => void;
  setDateTo: (d: Date | undefined) => void;
  setCanal: (v: string) => void;
  setTemperatura: (v: string) => void;
  setSearchTerm: (v: string) => void;
  setEtapa: (v: string) => void;
  effectiveDateRange: { from: Date | undefined; to: Date | undefined };
  filterRecords: <T extends { data_envio?: string; cidade?: string; nome?: string; makeTemperatura?: string }>(records: T[]) => T[];
  filterProposals: <T extends { dataCriacaoProposta?: string; nomeCliente?: string; representante?: string; responsavel?: string; temperatura?: string; etapa?: string }>(proposals: T[]) => T[];
}

const GlobalFilterContext = createContext<GlobalFilterContextType | undefined>(undefined);

export function GlobalFilterProvider({ children }: { children: ReactNode }) {
  const pf = usePageFilters({ showPeriodo: true, showTemperatura: true, showSearch: true, showEtapa: true });

  return (
    <GlobalFilterContext.Provider value={pf}>
      {children}
    </GlobalFilterContext.Provider>
  );
}

export function useGlobalFilters() {
  const ctx = useContext(GlobalFilterContext);
  if (!ctx) throw new Error("useGlobalFilters must be used within GlobalFilterProvider");
  return ctx;
}
