import { RefreshCcw } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageFloatingFilter } from "@/components/filters/PageFloatingFilter";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { useForceSync } from "@/hooks/useSolData";

const HIDE_SYNC_ROUTES = ["/reports", "/chamados"];
const HIDE_FILTER_ROUTES = ["/reports", "/chamados"];

export function GlobalPageControls() {
  const gf = useGlobalFilters();
  const { forceSync, isSyncing } = useForceSync();
  const { pathname } = useLocation();

  const showSync = !HIDE_SYNC_ROUTES.some(r => pathname.startsWith(r));
  const showFilter = !HIDE_FILTER_ROUTES.some(r => pathname.startsWith(r));

  return (
    <>
      {showSync && (
        <Button
          type="button"
          onClick={forceSync}
          disabled={isSyncing}
          size="sm"
          className="fixed top-4 right-4 z-[9991] gap-2 shadow-lg"
        >
          <RefreshCcw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Atualizando..." : "Atualizar página"}
        </Button>
      )}

      {showFilter && (
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
      )}
    </>
  );
}
