import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Activity, Plus, Trash2, Save, Loader2, Search, AlertTriangle, CheckCircle2 } from "lucide-react";

interface MonitoredScenario {
  id: number;
  name: string;
  isActive?: boolean;
}

export default function MonitoredScenariosSettings() {
  const [scenarios, setScenarios] = useState<MonitoredScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newId, setNewId] = useState("");
  const [searching, setSearching] = useState(false);

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

  const addScenario = async () => {
    const id = parseInt(newId);
    if (!id) { toast.error("Preencha o ID do cenário"); return; }
    if (scenarios.some((s) => s.id === id)) { toast.error("Cenário já existe"); return; }

    setSearching(true);
    try {
      const { data } = await supabase
        .from("make_heartbeat" as any)
        .select("scenario_name")
        .eq("scenario_id", id)
        .limit(1);
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

  const activeCount = scenarios.filter(s => s.isActive !== false).length;
  const inactiveCount = scenarios.filter(s => s.isActive === false).length;

  // Sort: active first, then inactive
  const sorted = [...scenarios].sort((a, b) => {
    if ((a.isActive !== false) && (b.isActive === false)) return -1;
    if ((a.isActive === false) && (b.isActive !== false)) return 1;
    return a.name.localeCompare(b.name);
  });

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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          Cenários Monitorados
          <Badge variant="outline" className="text-[10px] ml-1">{activeCount} ativos</Badge>
          {inactiveCount > 0 && (
            <Badge variant="secondary" className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">
              {inactiveCount} inativos
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-xs">
          Auto-discovery da pasta SOL v2 (folder 224162). Novos cenários são adicionados automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {sorted.map((s) => {
            const isActive = s.isActive !== false;
            return (
              <div
                key={s.id}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-sm ${
                  isActive
                    ? 'border-border bg-muted/30'
                    : 'border-amber-500/30 bg-amber-500/5'
                }`}
              >
                {isActive ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                )}
                <span className="text-[10px] text-muted-foreground font-mono w-16 shrink-0">
                  #{s.id}
                </span>
                <span className="flex-1 truncate text-xs">{s.name}</span>
                {!isActive && (
                  <Badge variant="secondary" className="text-[9px] bg-amber-500/20 text-amber-400 h-5">
                    Inativo
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive shrink-0"
                  onClick={() => removeScenario(s.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
          {scenarios.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum cenário detectado. Execute o Heartbeat para popular automaticamente.
            </p>
          )}
        </div>

        {/* Manual add */}
        <div className="flex gap-2 pt-2 border-t border-border">
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
          <div className="flex-1" />
          <Button onClick={handleSave} disabled={saving} size="sm" className="h-8 text-xs gap-1">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
