import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  FolderOpen,
  Plus,
  Trash2,
  Shield,
  Activity,
  RefreshCw,
  Send,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface MonitoredScenario {
  id: number;
  name: string;
}

export function SkillAutoFixPanel() {
  const queryClient = useQueryClient();
  const [newExclusion, setNewExclusion] = useState("");
  const [newFolderPrefix, setNewFolderPrefix] = useState("");

  // Fetch current config from app_settings
  const { data: config, isLoading } = useQuery({
    queryKey: ["autofix-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings" as any)
        .select("key, value")
        .in("key", [
          "monitored_scenario_ids",
          "autofix_excluded_scenarios",
          "autofix_folder_prefix",
          "autofix_agent_last_run",
          "autofix_cooldown_minutes",
        ]);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const row of (data as any[]) ?? []) {
        map[row.key] = row.value;
      }
      return map;
    },
    staleTime: 30_000,
  });

  const monitoredScenarios: MonitoredScenario[] = (() => {
    try {
      return JSON.parse(config?.monitored_scenario_ids || "[]");
    } catch {
      return [];
    }
  })();

  const excludedScenarios: string[] = (() => {
    try {
      return JSON.parse(config?.autofix_excluded_scenarios || '["SOL Remarketing"]');
    } catch {
      return ["SOL Remarketing"];
    }
  })();

  const folderPrefix = config?.autofix_folder_prefix || "solestrategia";
  const lastRun = config?.autofix_agent_last_run || null;
  const cooldownMinutes = Number(config?.autofix_cooldown_minutes || "10");

  // Filter out excluded scenarios from the monitored list
  const activeScenarios = monitoredScenarios.filter(
    (s) => !excludedScenarios.some((ex) => s.name.includes(ex))
  );

  // Save a single app_setting
  const upsertSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("app_settings" as any)
        .upsert({ key, value, updated_at: new Date().toISOString() } as any, {
          onConflict: "key",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["autofix-config"] });
    },
  });

  const handleAddExclusion = () => {
    const name = newExclusion.trim();
    if (!name) return;
    if (excludedScenarios.includes(name)) {
      toast.error("Cenário já está na lista de exclusão");
      return;
    }
    const updated = [...excludedScenarios, name];
    upsertSetting.mutate(
      { key: "autofix_excluded_scenarios", value: JSON.stringify(updated) },
      { onSuccess: () => { toast.success(`"${name}" adicionado às exclusões`); setNewExclusion(""); } }
    );
  };

  const handleRemoveExclusion = (name: string) => {
    const updated = excludedScenarios.filter((n) => n !== name);
    upsertSetting.mutate(
      { key: "autofix_excluded_scenarios", value: JSON.stringify(updated) },
      { onSuccess: () => toast.success(`"${name}" removido das exclusões`) }
    );
  };

  const handleSaveFolderPrefix = () => {
    const prefix = newFolderPrefix.trim() || folderPrefix;
    upsertSetting.mutate(
      { key: "autofix_folder_prefix", value: prefix },
      { onSuccess: () => toast.success(`Prefixo de pasta atualizado para "${prefix}"`) }
    );
  };

  const handleSaveCooldown = (minutes: number) => {
    upsertSetting.mutate(
      { key: "autofix_cooldown_minutes", value: String(minutes) },
      { onSuccess: () => toast.success(`Cooldown atualizado para ${minutes} minutos`) }
    );
  };

  const handleForceRun = async () => {
    try {
      // Reset cooldown
      await supabase
        .from("app_settings" as any)
        .upsert({ key: "autofix_agent_last_run", value: "2000-01-01T00:00:00Z", updated_at: new Date().toISOString() } as any, {
          onConflict: "key",
        });

      toast.info("Disparando varredura AutoFix...");
      const { data, error } = await supabase.functions.invoke("autofix-agent", {
        body: {},
      });
      if (error) throw error;
      if (data?.skipped) {
        toast.warning("AutoFix pulado: " + (data.reason || "desconhecido"));
      } else {
        toast.success(
          `AutoFix concluído: ${data?.activated || 0} reativado(s), ${data?.failed || 0} falha(s)`
        );
      }
      queryClient.invalidateQueries({ queryKey: ["autofix-config"] });
    } catch (err: any) {
      toast.error("Erro ao executar AutoFix: " + err.message);
    }
  };

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5" /> Configuração AutoFix
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={handleForceRun}
          className="gap-1.5 text-xs"
        >
          <Send className="h-3 w-3" /> Forçar Varredura
        </Button>
      </div>

      {/* Last run info */}
      {lastRun && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Activity className="h-3 w-3" />
          Última varredura:{" "}
          {new Date(lastRun).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
        </div>
      )}

      {/* Folder Prefix */}
      <Card className="border-border/40">
        <CardContent className="p-3 space-y-2">
          <Label className="text-xs font-semibold flex items-center gap-1.5">
            <FolderOpen className="h-3.5 w-3.5 text-primary" /> Pasta monitorada no Make
          </Label>
          <p className="text-[10px] text-muted-foreground">
            Todos os cenários dentro de pastas que começam com este prefixo serão monitorados automaticamente.
          </p>
          <div className="flex gap-2">
            <Input
              className="h-8 text-xs flex-1"
              placeholder={folderPrefix}
              defaultValue={folderPrefix}
              onChange={(e) => setNewFolderPrefix(e.target.value)}
            />
            <Button size="sm" className="h-8 text-xs" onClick={handleSaveFolderPrefix}>
              Salvar
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Atual: <Badge variant="outline" className="text-[10px] font-mono">{folderPrefix}</Badge>
          </p>
        </CardContent>
      </Card>

      {/* Cooldown */}
      <Card className="border-border/40">
        <CardContent className="p-3 space-y-2">
          <Label className="text-xs font-semibold flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5 text-primary" /> Cooldown entre varreduras
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              className="h-8 text-xs w-20"
              defaultValue={cooldownMinutes}
              min={1}
              max={60}
              onBlur={(e) => handleSaveCooldown(Number(e.target.value) || 10)}
            />
            <span className="text-xs text-muted-foreground">minutos</span>
          </div>
        </CardContent>
      </Card>

      {/* Monitored Scenarios */}
      <Card className="border-border/40">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Cenários monitorados ({activeScenarios.length})
          </CardTitle>
          <p className="text-[10px] text-muted-foreground">
            Clique no <X className="h-2.5 w-2.5 inline" /> para mover o cenário para a lista de exclusão.
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          {activeScenarios.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-3">
              Nenhum cenário ativo detectado. A próxima varredura irá autodescobrir os cenários da pasta.
            </p>
          ) : (
            <ScrollArea className="h-[180px]">
              <div className="space-y-1">
                {activeScenarios.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-2 py-1 px-2 rounded text-[11px] hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Activity className="h-3 w-3 text-emerald-500 shrink-0" />
                      <span className="truncate">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className="text-[9px] font-mono">
                        {s.id}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleExcludeScenario(s.name)}
                        title="Excluir do monitoramento"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Excluded Scenarios */}
      <Card className="border-border/40">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            Cenários excluídos do AutoFix
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          <p className="text-[10px] text-muted-foreground">
            Cenários inativos propositalmente — não serão reativados automaticamente.
          </p>

          {excludedScenarios.length > 0 && (
            <div className="space-y-1">
              {excludedScenarios.map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between gap-2 py-1 px-2 rounded bg-amber-500/5 border border-amber-500/10"
                >
                  <span className="text-[11px]">{name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveExclusion(name)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              className="h-8 text-xs flex-1"
              placeholder="Nome do cenário (ex: SOL Remarketing)"
              value={newExclusion}
              onChange={(e) => setNewExclusion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddExclusion()}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1"
              onClick={handleAddExclusion}
            >
              <Plus className="h-3 w-3" /> Excluir
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
