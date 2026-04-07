import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Loader2, HardDrive, Building2 } from "lucide-react";
import { useOrganizationsForAdmin } from "@/hooks/useOrganizationsForAdmin";

interface DataStoreInfo {
  id: number;
  name: string;
  records: number;
  size: number;
}

const CONFIG_KEY = "make_data_stores";

async function fetchDataStoresForScope(scope: string): Promise<{ stores: DataStoreInfo[]; fromFallback: boolean }> {
  if (scope === "global") {
    const { data, error } = await supabase.from("app_settings").select("value").eq("key", CONFIG_KEY).single();
    if (error) throw error;
    const stores = JSON.parse(data.value) as DataStoreInfo[];
    return { stores, fromFallback: false };
  }

  const { data: row } = await supabase
    .from("organization_configs")
    .select("config_value")
    .eq("organization_id", scope)
    .eq("config_key", CONFIG_KEY)
    .maybeSingle();

  if (row?.config_value) {
    return { stores: JSON.parse(row.config_value) as DataStoreInfo[], fromFallback: false };
  }

  const { data: globalRow } = await supabase.from("app_settings").select("value").eq("key", CONFIG_KEY).single();
  if (globalRow?.value) {
    return { stores: JSON.parse(globalRow.value) as DataStoreInfo[], fromFallback: true };
  }
  return { stores: [], fromFallback: false };
}

export default function DiscoveredDataStores() {
  const { data: orgs = [], isLoading: orgsLoading } = useOrganizationsForAdmin();
  const [scope, setScope] = useState<string>("global");

  const { data, isLoading } = useQuery({
    queryKey: ["make-data-stores-config", scope],
    queryFn: () => fetchDataStoresForScope(scope),
    staleTime: 2 * 60 * 1000,
  });

  const stores = data?.stores ?? [];
  const fromFallback = data?.fromFallback ?? false;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading || orgsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-5 w-5 text-primary" />
          Data stores (snapshot)
        </CardTitle>
        <CardDescription className="text-xs">
          Lista vinda do último sync de heartbeat (global em <span className="font-medium text-foreground">app_settings</span>). Por filial,
          pode existir cópia em <span className="font-medium text-foreground">organization_configs</span> quando o Make for por unidade.
        </CardDescription>
        <div className="flex flex-wrap items-end gap-2 pt-2">
          <div className="space-y-1 min-w-[200px] flex-1 max-w-sm">
            <Label className="text-xs flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              Escopo
            </Label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Padrão global</SelectItem>
                {orgs.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {scope !== "global" && fromFallback && (
          <p className="text-[11px] text-muted-foreground mb-2 rounded-md bg-muted/40 px-2 py-1.5">
            Esta filial ainda não tem snapshot próprio — exibindo o <strong>padrão global</strong>.
          </p>
        )}
        {stores.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum data store neste escopo. Rode o sync de heartbeat.</p>
        ) : (
          <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
            {stores.map((ds) => (
              <div key={ds.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-border bg-muted/20 text-xs">
                <HardDrive className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-[10px] text-muted-foreground font-mono w-14 shrink-0">#{ds.id}</span>
                <span className="flex-1 truncate font-medium">{ds.name}</span>
                <Badge variant="secondary" className="text-[9px] shrink-0">
                  {ds.records} reg.
                </Badge>
                <Badge variant="outline" className="text-[9px] shrink-0">
                  {formatBytes(ds.size)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
