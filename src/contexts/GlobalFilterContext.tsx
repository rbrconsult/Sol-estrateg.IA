import { createContext, useContext, ReactNode } from "react";
import { usePageFilters } from "@/components/filters/PageFloatingFilter";

type GlobalFilterContextType = ReturnType<typeof usePageFilters>;

const GlobalFilterContext = createContext<GlobalFilterContextType | undefined>(undefined);

export function GlobalFilterProvider({ children }: { children: ReactNode }) {
  const pf = usePageFilters({ showPeriodo: true, showTemperatura: true, showSearch: true, showEtapa: true, showStatus: true }, "30d");

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
