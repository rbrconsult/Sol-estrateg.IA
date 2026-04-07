import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const MATRIZ_ORG_ID = "00000000-0000-0000-0000-000000000001";

export type AdminOrgOption = { id: string; name: string; slug: string };

/** Lista de filiais para selects no Admin (exclui matriz sistema). */
export function useOrganizationsForAdmin() {
  return useQuery({
    queryKey: ["admin-organizations-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("id, name, slug").order("name");
      if (error) throw error;
      return ((data || []) as AdminOrgOption[]).filter((o) => o.id !== MATRIZ_ORG_ID);
    },
    staleTime: 60_000,
  });
}
