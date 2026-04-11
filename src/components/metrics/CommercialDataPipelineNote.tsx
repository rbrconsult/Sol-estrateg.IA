import { useMemo } from "react";
import { useCommercialProposals } from "@/hooks/useCommercialProposals";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { useFranquiaId } from "@/hooks/useFranquiaId";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { filterProposalsToSelectedFranquia } from "@/lib/franquiaSync";
import { filterProposalsByAllowedCloserIds, hasCloserAllowlist } from "@/lib/orgCloserAllowlist";
import { useComercialCloserAllowlist } from "@/hooks/useComercialCloserAllowlist";

const PERIODO_LABEL: Record<string, string> = {
  all: "tudo",
  hoje: "hoje",
  "3d": "3 dias",
  "7d": "7 dias",
  "30d": "30 dias",
  "90d": "90 dias",
  mes: "mês atual",
  mesAnterior: "mês anterior",
  ano: "ano",
  ytd: "ano",
  custom: "datas customizadas",
};

/**
 * Shows a compact data pipeline summary for commercial pages.
 */
export function CommercialDataPipelineNote() {
  const { proposals, rawCount, isLoading, error, franchiseQuerySkipped, apiReturnedRows } =
    useCommercialProposals();
  const gf = useGlobalFilters();
  const { isGlobal } = useOrgFilter();
  const franquiaSlug = useFranquiaId();
  const { allowedCloserIds, source: closerSource } = useComercialCloserAllowlist();

  const audit = useMemo(() => {
    const afterFranquia = filterProposalsToSelectedFranquia(
      proposals,
      isGlobal,
      isGlobal ? "" : franquiaSlug,
    );
    const afterGlobalFilters = gf.filterProposals(afterFranquia);
    const onScreen = !isGlobal
      ? filterProposalsByAllowedCloserIds(afterGlobalFilters, allowedCloserIds)
      : afterGlobalFilters;
    return {
      afterFranquia: afterFranquia.length,
      afterGlobalFilters: afterGlobalFilters.length,
      onScreen: onScreen.length,
      allowlistCuts: hasCloserAllowlist(allowedCloserIds) && !isGlobal,
      closerSource,
    };
  }, [proposals, isGlobal, franquiaSlug, gf.filterProposals, allowedCloserIds, closerSource]);

  const periodoKey = gf.filters.periodo;
  const periodoLabel = PERIODO_LABEL[periodoKey] ?? periodoKey;

  if (isLoading) return null;

  const zeroFromApi = apiReturnedRows && rawCount === 0 && !franchiseQuerySkipped && !error;

  return (
    <div className="rounded-lg border border-border bg-muted/25 px-3 py-2.5 text-[11px] sm:text-xs text-muted-foreground leading-relaxed space-y-1.5">
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertTitle className="text-sm">Erro ao buscar projetos</AlertTitle>
          <AlertDescription className="text-xs">{(error as Error).message}</AlertDescription>
        </Alert>
      )}
      {franchiseQuerySkipped && (
        <Alert className="py-2 border-warning/40 bg-warning/10">
          <AlertTitle className="text-sm text-foreground">Filial sem identificador</AlertTitle>
          <AlertDescription className="text-xs">
            A consulta comercial está desativada até que a filial selecionada tenha um identificador configurado.
          </AlertDescription>
        </Alert>
      )}
      {zeroFromApi && (
        <Alert className="py-2">
          <AlertTitle className="text-sm text-foreground">Nenhum projeto encontrado</AlertTitle>
          <AlertDescription className="text-xs">
            Não há dados comerciais disponíveis para o seu perfil. Verifique se a filial e permissões estão configuradas corretamente.
          </AlertDescription>
        </Alert>
      )}
      <p>
        <span className="font-medium text-foreground">Resumo:</span>{" "}
        <span className="tabular-nums">{rawCount}</span> registros →{" "}
        <span className="tabular-nums">{proposals.length}</span> projetos únicos →{" "}
        <span className="tabular-nums">{audit.afterFranquia}</span> na filial →{" "}
        <span className="tabular-nums">{audit.afterGlobalFilters}</span> no período (
        <span className="text-foreground/90">{periodoLabel}</span>) →{" "}
        <span className="tabular-nums font-medium text-foreground">{audit.onScreen}</span> exibidos
        {audit.allowlistCuts ? ` (filtrado por responsáveis autorizados)` : ""}.
      </p>
    </div>
  );
}
