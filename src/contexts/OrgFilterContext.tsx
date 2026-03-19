import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface OrgOption {
  id: string;
  name: string;
  slug: string;
}

interface OrgFilterContextType {
  selectedOrgId: string | null; // null = "Global" (all orgs)
  selectedOrgName: string;
  orgs: OrgOption[];
  setSelectedOrgId: (id: string | null) => void;
  isGlobal: boolean;
  loading: boolean;
}

const OrgFilterContext = createContext<OrgFilterContextType | undefined>(undefined);

const STORAGE_KEY = "sol_selected_org";
const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

export function OrgFilterProvider({ children }: { children: ReactNode }) {
  const { userRole } = useAuth();
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [selectedOrgId, setSelectedOrgIdState] = useState<string | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "global" ? null : saved;
  });
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = userRole === "super_admin";

  useEffect(() => {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }

    supabase
      .from("organizations")
      .select("id, name, slug")
      .neq("id", DEFAULT_ORG_ID)
      .order("name")
      .then(({ data }) => {
        setOrgs(data || []);
        setLoading(false);
      });
  }, [isSuperAdmin]);

  const setSelectedOrgId = (id: string | null) => {
    setSelectedOrgIdState(id);
    localStorage.setItem(STORAGE_KEY, id || "global");
  };

  const selectedOrgName = selectedOrgId
    ? orgs.find((o) => o.id === selectedOrgId)?.name || "Filial"
    : "Global";

  return (
    <OrgFilterContext.Provider
      value={{
        selectedOrgId,
        selectedOrgName,
        orgs,
        setSelectedOrgId,
        isGlobal: !selectedOrgId,
        loading,
      }}
    >
      {children}
    </OrgFilterContext.Provider>
  );
}

export function useOrgFilter() {
  const ctx = useContext(OrgFilterContext);
  if (!ctx) throw new Error("useOrgFilter must be used within OrgFilterProvider");
  return ctx;
}
