import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Activity, Plus, Trash2, Save, Loader2, AlertTriangle, CheckCircle2, Building2 } from "lucide-react";
import { useOrganizationsForAdmin } from "@/hooks/useOrganizationsForAdmin";

interface MonitoredScenario {
  id: number;
  name: string;
  isActive?: boolean;
}

const CONFIG_KEY = "monitored_scenario_ids";
const CONFIG_CATEGORY = "heartbeat";

export default function MonitoredScenariosSettings() {
  const { data: orgs = [], isLoading: orgsLoading } = useOrganizationsForAdmin();
  const [scope, setScope] = useState<string>("global");
  const [scenarios, setScenarios] = useState<MonitoredScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newId, setNewId] = useState("");
  const [searching, setSearching] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      if (scope === "global") {
        const { data, error } = await supabase.from("app_settings").select("value").eq("key", CONFIG_KEY).single();
        if (error) throw error;
        setScenarios(JSON.parse(data.value) as MonitoredScenario[]);
        return;
      }

      const { data: row, error } = await supabase
        .from("organization_configs")
        .select("config_value")
        .eq("organization_id", scope)
        .eq("config_key", CONFIG_KEY)
        .maybeSingle();
      if (error) throw error;

      if (row?.config_value) {
        setScenarios(JSON.parse(row.config_value) as MonitoredScenario[]);
        return;
      }

      const { data: globalRow } = await supabase.from("app_settings").select("value").eq("key", CONFIG_KEY).single();
      if (globalRow?.value) {
        setScenarios(JSON.parse(globalRow.value) as MonitoredScenario[]);
      } else {
        setScenarios([]);
      }
    } catch {
      setScenarios([]);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = JSON.stringify(scenarios);
      if (scope === "global") {
        const { error } = await supabase
          .from("app_settings" as any)
          .update({ value: payload, updated_at: new Date().toISOString() })
          .eq("key", CONFIG_KEY);
        if (error) throw error;
        toast.success("Cenários (padrão global) atualizados!");
        return;
      }

      const { data: existing } = await supabase
        .from("organization_configs")
        .select("id")
        .eq("organization_id", scope)
        .eq("config_key", CONFIG_KEY)
        .maybeSingle();

      if (existing?.id) {
        const { error } = await supabase
          .from("organization_configs")
          .update({ config_value: payload, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("organization_configs").insert({
          organization_id: scope,
          config_key: CONFIG_KEY,
          config_value: payload,
          config_category: CONFIG_CATEGORY,
          is_secret: false,
        });
        if (error) throw error;
      }
      toast.success("Cenários desta filial salvos!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const addScenario = async () => {
    const id = parseInt(newId, 10);
    if (!id) {
      toast.error("Preencha o ID do cenário");
      return;
    }
    if (scenarios.some((s) => s.id === id)) {
      toast.error("Cenário já existe");
      return;
    }

    setSearching(true);
    try {
      const { data } = await supabase.from("make_heartbeat" as any).select("scenario_name").eq("scenario_id", id).limit(1);
      const name = (data as any)?.[0]?.scenario_name || `Cenário #${id}`;
      setScenarios([...scenarios, { id, name, isActive: true }]);
      setNewId("");
      toast.success(`Adicionado: ${name}`);
    } catch {
      setScenarios([...scenarios, { id, name: `Cenário #${id}`, isActive: true }]);
      setNewId("");
    } finally {
      setSearching(false);
    }
  };

  const removeScenario = (id: number) => {
    setScenarios(scenarios.filter((s) => s.id !== id));
  };

  const activeCount = scenarios.filter((s) => s.isActive !== false).length;
  const inactiveCount = scenarios.filter((s) => s.isActive === false).length;

  const sorted = [...scenarios].sort((a, b) => {
    if (a.isActive !== false && b.isActive === false) return -1;
    if (a.isActive === false && b.isActive !== false) return 1;
    return a.name.localeCompare(b.name);
  });

  const scopeLabel = scope === "global" ? "Padrão global (app_settings)" : orgs.find((o) => o.id === scope)?.name || "Filial";

  if (loading || orgsLoading) {
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
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          Cenários monitorados
          <Badge variant="outline" className="text-[10px]">
            {activeCount} ativos
          </Badge>
          {inactiveCount > 0 && (
            <Badge variant="secondary" className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">
              {inactiveCount} inativos
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-xs">
          Padrão global alimenta o sync automático (heartbeat). Por filial, a lista fica em{" "}
          <span className="font-medium text-foreground">organization_configs</span> para quando cada unidade tiver Make próprio.
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
                <SelectItem value="global">Padrão global (todas)</SelectItem>
                {orgs.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Badge variant="secondary" className="text-[10px] mb-0.5">
            {scopeLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {scope !== "global" && (
          <p className="text-[11px] text-muted-foreground rounded-md bg-muted/40 px-2 py-1.5">
            Sem registro próprio nesta filial? A lista abaixo é pré-preenchida com o <strong>padrão global</strong>. Ao salvar, cria-se a
            configuração só desta filial.
          </p>
        )}

        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {sorted.map((s) => {
            const isActive = s.isActive !== false;
            return (
              <div
                key={s.id}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-sm ${
                  isActive ? "border-border bg-muted/30" : "border-amber-500/30 bg-amber-500/5"
                }`}
              >
                {isActive ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                )}
                <span className="text-[10px] text-muted-foreground font-mono w-16 shrink-0">#{s.id}</span>
                <span className="flex-1 truncate text-xs">{s.name}</span>
                {!isActive && (
                  <Badge variant="secondary" className="text-[9px] bg-amber-500/20 text-amber-400 h-5">
                    Inativo
                  </Badge>
                )}
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive shrink-0" onClick={() => removeScenario(s.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
          {scenarios.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum cenário na lista deste escopo.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          <Input
            className="h-8 text-xs w-32"
            placeholder="Scenario ID"
            value={newId}
            onChange={(e) => setNewId(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && addScenario()}
          />
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={addScenario} disabled={searching}>
            {searching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            Adicionar
          </Button>
          <div className="flex-1 min-w-[8px]" />
          <Button onClick={handleSave} disabled={saving} size="sm" className="h-8 text-xs gap-1">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Salvar ({scope === "global" ? "global" : "filial"})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
