import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMakeComercialData } from "@/hooks/useMakeComercialData";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adaptSheetData, extractVendedores } from "@/data/dataAdapter";

interface CheckItem {
  label: string;
  completed: boolean;
}

export function SetupChecklist() {
  const { organizationId } = useAuth();
  const { data: sheetsData } = useGoogleSheetsData();

  const { data: orgMembers } = useQuery({
    queryKey: ["org-members-count", organizationId],
    queryFn: async () => {
      if (!organizationId) return 0;
      const { count } = await supabase
        .from("organization_members")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId);
      return count || 0;
    },
    enabled: !!organizationId,
  });

  const { data: statusUrl } = useQuery({
    queryKey: ["org-status-checklist", organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data } = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", organizationId)
        .single();
      return (data?.settings as any)?.status_url || null;
    },
    enabled: !!organizationId,
  });

  const items: CheckItem[] = useMemo(() => {
    const hasSheetData = !!(sheetsData?.data && sheetsData.data.length > 0);
    const proposals = hasSheetData ? adaptSheetData(sheetsData!.data) : [];
    const vendedores = hasSheetData ? extractVendedores(proposals) : [];

    return [
      {
        label: "Google Sheet configurado",
        completed: hasSheetData,
      },
      {
        label: "Vendedores cadastrados",
        completed: vendedores.length > 0,
      },
      {
        label: "Primeira proposta inserida",
        completed: proposals.length > 0,
      },
      {
        label: "Usuários criados",
        completed: (orgMembers || 0) > 1,
      },
      {
        label: "Monitoramento configurado",
        completed: !!statusUrl,
      },
    ];
  }, [sheetsData, orgMembers, statusUrl]);

  const allDone = items.every((i) => i.completed);
  const completedCount = items.filter((i) => i.completed).length;

  if (allDone) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5 text-primary" />
          Configuração Inicial
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {completedCount}/{items.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {items.map((item) => (
            <div
              key={item.label}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg text-sm transition-colors",
                item.completed
                  ? "bg-primary/10 text-foreground"
                  : "bg-secondary/50 text-muted-foreground"
              )}
            >
              {item.completed ? (
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Circle className="h-4 w-4 shrink-0" />
              )}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
