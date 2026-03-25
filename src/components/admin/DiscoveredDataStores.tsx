import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Loader2, HardDrive } from "lucide-react";

interface DataStoreInfo {
  id: number;
  name: string;
  records: number;
  size: number;
}

export default function DiscoveredDataStores() {
  const { data: stores, isLoading } = useQuery({
    queryKey: ["make-data-stores-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "make_data_stores")
        .single();
      if (error) throw error;
      return JSON.parse(data.value) as DataStoreInfo[];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-5 w-5 text-primary" />
          Data Stores Descobertos
        </CardTitle>
        <CardDescription>
          Detectados automaticamente do Make.com a cada sincronização do Heartbeat.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!stores || stores.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum Data Store detectado. Sincronize o Heartbeat primeiro.
          </p>
        ) : (
          <div className="space-y-2">
            {stores.map((ds) => (
              <div
                key={ds.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
              >
                <HardDrive className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground font-mono w-16 shrink-0">
                  #{ds.id}
                </span>
                <span className="text-sm flex-1 truncate font-medium">{ds.name}</span>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {ds.records} registros
                </Badge>
                <Badge variant="outline" className="text-[10px] shrink-0">
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
