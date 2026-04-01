import { useLocation } from "react-router-dom";
import { PageFloatingFilter } from "@/components/filters/PageFloatingFilter";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";

const HIDE_FILTER_ROUTES = ["/reports", "/chamados"];

export function GlobalPageControls() {
  const gf = useGlobalFilters();
  const { pathname } = useLocation();

  const showFilter = !HIDE_FILTER_ROUTES.some(r => pathname.startsWith(r));

  if (!showFilter) return null;

  return (
    <PageFloatingFilter
      filters={gf.filters}
      hasFilters={gf.hasFilters}
      clearFilters={gf.clearFilters}
      setPeriodo={gf.setPeriodo}
      setDateFrom={gf.setDateFrom}
      setDateTo={gf.setDateTo}
      setTemperatura={gf.setTemperatura}
      setSearchTerm={gf.setSearchTerm}
      setEtapa={gf.setEtapa}
      setStatus={gf.setStatus}
      config={{
        showPeriodo: true,
        showTemperatura: true,
        showSearch: true,
        showEtapa: true,
        showStatus: true,
      }}
    />
  );
}
