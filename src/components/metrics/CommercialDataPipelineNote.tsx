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
 * Explica por que os números na tela podem ser menores que o que existe no SM/Supabase:
 * dedup, filtro de período, filial, allowlist e RLS.
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
        <Alert className="py-2 border-amber-500/40 bg-amber-500/10">
          <AlertTitle className="text-sm text-foreground">Filial sem slug</AlertTitle>
          <AlertDescription className="text-xs">
            A query comercial está desligada até existir <code className="text-[10px]">organizations.slug</code> para a filial
            selecionada.
          </AlertDescription>
        </Alert>
      )}
      {zeroFromApi && (
        <Alert className="py-2">
          <AlertTitle className="text-sm text-foreground">0 eventos em sol_projetos_sync (resposta da API)</AlertTitle>
          <AlertDescription className="text-xs space-y-2">
            <p>
              O app <strong>não recebeu nenhuma linha</strong> do Supabase (antes de filtros de período). Isso costuma ser{" "}
              <strong>RLS</strong>: até recentemente o Postgres exigia <code className="text-[10px]">franquia_id</code>{" "}
              <em>idêntico</em> ao <code className="text-[10px]">slug</code> da org — se o Make usa hífen e o Lovable underscore
              (ou o contrário), vinha tudo vazio. Aplique a migração{" "}
              <code className="text-[10px]">20260407140000_rls_franquia_slug_variants.sql</code> no projeto Supabase, ou alinhe slug
              e <code className="text-[10px]">franquia_id</code> na base.
            </p>
            <p>
              <strong>Comissões:</strong> a tela funciona com <code className="text-[10px]">valor_proposta</code> e status Ganho;
              as colunas <code className="text-[10px]">valor_comissao</code> /{" "}
              <code className="text-[10px]">percentual_comissao</code> são opcionais — é normal não ter nenhuma linha com elas
              preenchidas e ainda assim ver comissão estimada (% da UI).
            </p>
          </AlertDescription>
        </Alert>
      )}
      <p>
        <span className="font-medium text-foreground">Sobre os números:</span>{" "}
        <span className="tabular-nums">{rawCount}</span> eventos brutos na{" "}
        <code className="text-[10px]">sol_projetos_sync</code> →{" "}
        <span className="tabular-nums">{proposals.length}</span> projetos únicos (último evento por{" "}
        <code className="text-[10px]">project_id</code>) → <span className="tabular-nums">{audit.afterFranquia}</span> após
        escopo de filial → <span className="tabular-nums">{audit.afterGlobalFilters}</span> após filtro global (
        <span className="text-foreground/90">período: {periodoLabel}</span>
        ; altere no painel flutuante) →{" "}
        <span className="tabular-nums font-medium text-foreground">{audit.onScreen}</span> exibidos
        {audit.allowlistCuts
          ? ` (só responsáveis autorizados — ${audit.closerSource === "database" ? "lista no BD" : "legado código"})`
          : ""}
        .
      </p>
      <p>
        <span className="font-medium text-foreground">Por que pode faltar dado mesmo com SM atualizado:</span> o app só lê o
        que o Supabase entrega ao seu login — em geral <code className="text-[10px]">franquia_id</code> tem de coincidir com o{" "}
        <code className="text-[10px]">slug</code> da sua organização (RLS). Com filial selecionada, só entram propostas cujo{" "}
        <code className="text-[10px]">responsavelId</code> (SM) está em <code className="text-[10px]">comercial_closer_sm_ids</code>{" "}
        na filial (ou legado em código). Super_admin vê todas as franquias no RLS.
      </p>
    </div>
  );
}
