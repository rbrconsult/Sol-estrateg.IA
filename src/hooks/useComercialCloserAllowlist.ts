import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { useFranquiaId } from "@/hooks/useFranquiaId";
import {
  COMMERCIAL_CLOSER_SM_IDS_CONFIG_KEY,
  legacyCloserAllowSetForSlug,
} from "@/lib/orgCloserAllowlist";

export type ComercialCloserAllowlistSource = "none" | "legacy_code" | "database";

/**
 * Com filial selecionada, o recorte comercial mandatório é por responsável (SM): `responsavelId` ∈ lista.
 * 1) `organization_configs` · `comercial_closer_sm_ids` = JSON `["19422","4938",...]` (por organization_id)
 * 2) Senão, legado em código por slug (`ORG_CLOSER_SM_IDS`)
 * 3) Senão, sem filtro por closer (só escopo de franquia + RLS)
 *
 * O slug da org você altera em Admin → Filiais; deve coincidir com `franquia_id` no sync para o Postgres entregar as linhas.
 */
export function useComercialCloserAllowlist() {
  const { selectedOrgId, isGlobal } = useOrgFilter();
  const franquiaSlug = useFranquiaId();

  const legacy = useMemo(() => {
    if (!selectedOrgId || isGlobal) return null;
    return legacyCloserAllowSetForSlug(franquiaSlug);
  }, [selectedOrgId, isGlobal, franquiaSlug]);

  const { data: dbRaw, isFetched } = useQuery({
    queryKey: ["comercial-closer-allowlist", selectedOrgId],
    queryFn: async (): Promise<string | null> => {
      if (!selectedOrgId) return null;
      const { data, error } = await supabase
        .from("organization_configs")
        .select("config_value")
        .eq("organization_id", selectedOrgId)
        .eq("config_key", COMMERCIAL_CLOSER_SM_IDS_CONFIG_KEY)
        .maybeSingle();
      if (error) throw error;
      return data?.config_value ?? null;
    },
    enabled: !!selectedOrgId && !isGlobal,
    staleTime: 60_000,
  });

  return useMemo(() => {
    if (!selectedOrgId || isGlobal) {
      return {
        allowedCloserIds: null as Set<string> | null,
        source: "none" as ComercialCloserAllowlistSource,
        isReady: true,
      };
    }

    if (!isFetched) {
      return {
        allowedCloserIds: legacy,
        source: (legacy ? "legacy_code" : "none") as ComercialCloserAllowlistSource,
        isReady: false,
      };
    }

    if (dbRaw != null && String(dbRaw).trim() !== "") {
      try {
        const arr = JSON.parse(dbRaw) as unknown;
        if (Array.isArray(arr)) {
          const set = new Set(arr.map((x) => String(x).trim()).filter(Boolean));
          return {
            allowedCloserIds: set,
            source: "database" as ComercialCloserAllowlistSource,
            isReady: true,
          };
        }
      } catch {
        /* JSON inválido → legado */
      }
    }

    return {
      allowedCloserIds: legacy,
      source: (legacy ? "legacy_code" : "none") as ComercialCloserAllowlistSource,
      isReady: true,
    };
  }, [selectedOrgId, isGlobal, isFetched, dbRaw, legacy]);
}
