import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Activity, Plus, Trash2, Save, Loader2, GripVertical } from "lucide-react";

interface MonitoredScenario {
  id: number;
  name: string;
}

export default function MonitoredScenariosSettings() {
  const [scenarios, setScenarios] = useState<MonitoredScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "monitored_scenario_ids")
        .single();
      if (error) throw error;
      setScenarios(JSON.parse(data.value) as MonitoredScenario[]);
    } catch {
      setScenarios([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("app_settings" as any)
        .update({ value: JSON.stringify(scenarios), updated_at: new Date().toISOString() })
        .eq("key", "monitored_scenario_ids");
      if (error) throw error;
      toast.success("Cenários monitorados atualizados!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const addScenario = () => {
    const id = parseInt(newId);
    if (!id || !newName.trim()) {
      toast.error("Preencha o ID e o nome do cenário");
      return;
    }
    if (scenarios.some((s) => s.id === id)) {
      toast.error("Cenário já existe na lista");
      return;
    }
    setScenarios([...scenarios, { id, name: newName.trim() }]);
    setNewId("");
    setNewName("");
  };

  const removeScenario = (id: number) => {
    setScenarios(scenarios.filter((s) => s.id !== id));
  };

  if (loading) {
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-5 w-5 text-primary" />
          Cenários Monitorados (Heartbeat)
        </CardTitle>
        <CardDescription>
          Gerencie os fluxos do Make.com que aparecem na página de Monitoramento. A ordem define a exibição.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing scenarios */}
        <div className="space-y-2">
          {scenarios.map((s, index) => (
            <div
              key={s.id}
              className="flex items-center gap-2 p-2 rounded-md border border-border bg-muted/30"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground font-mono w-20 shrink-0">
                #{s.id}
              </span>
              <span className="text-sm flex-1 truncate">{s.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => removeScenario(s.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {scenarios.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum cenário configurado. Adicione abaixo.
            </p>
          )}
        </div>

        {/* Add new */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
          <div className="space-y-1 sm:w-32">
            <Label className="text-xs">Scenario ID</Label>
            <Input
              placeholder="3716678"
              value={newId}
              onChange={(e) => setNewId(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className="space-y-1 flex-1">
            <Label className="text-xs">Nome do cenário</Label>
            <Input
              placeholder="Ex: Robô Sol"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addScenario()}
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" size="sm" onClick={addScenario} className="gap-1">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
        </div>

        {/* Save */}
        <Button onClick={handleSave} disabled={saving} className="gap-2 w-full sm:w-auto">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Cenários
        </Button>
      </CardContent>
    </Card>
  );
}
