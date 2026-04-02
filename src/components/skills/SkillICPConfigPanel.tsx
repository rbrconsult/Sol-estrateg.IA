import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, RotateCcw, Thermometer, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFranquiaId } from "@/hooks/useFranquiaId";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ICPCriteria {
  key: string;
  label: string;
  emoji: string;
  weight: number;
  description: string;
}

interface ICPThreshold {
  label: string;
  emoji: string;
  color: string;
  min: number;
  max: number;
  action: string;
}

const DEFAULT_CRITERIA: ICPCriteria[] = [
  { key: "valor_conta", label: "Valor da Conta de Luz", emoji: "⚡", weight: 30, description: "Peso do valor mensal de energia" },
  { key: "cidade", label: "Cidade / Região", emoji: "📍", weight: 15, description: "Proximidade ou região atendida" },
  { key: "tipo_imovel", label: "Tipo de Imóvel", emoji: "🏠", weight: 15, description: "Residencial, comercial, rural" },
  { key: "canal_origem", label: "Canal de Origem", emoji: "📢", weight: 10, description: "Qualidade do canal (orgânico > pago)" },
  { key: "tempo_resposta", label: "Tempo de Resposta", emoji: "⏱️", weight: 15, description: "Velocidade de engajamento do lead" },
  { key: "completude", label: "Completude de Dados", emoji: "📋", weight: 15, description: "% de campos preenchidos" },
];

const DEFAULT_THRESHOLDS: ICPThreshold[] = [
  { label: "Quente", emoji: "🔥", color: "bg-red-500/10 text-red-400 border-red-500/20", min: 80, max: 100, action: "Transferir imediatamente ao closer" },
  { label: "Morno", emoji: "🌤️", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", min: 50, max: 79, action: "Continuar qualificação via IA" },
  { label: "Frio", emoji: "❄️", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", min: 0, max: 49, action: "Nutrir com follow-up automático" },
];

interface ICPConfig {
  criteria: ICPCriteria[];
  thresholds: ICPThreshold[];
}

export function SkillICPConfigPanel() {
  const franquiaId = useFranquiaId();
  const queryClient = useQueryClient();

  const { data: savedConfig, isLoading } = useQuery({
    queryKey: ["icp-config", franquiaId],
    queryFn: async () => {
      const { data } = await supabase
        .from("organization_configs")
        .select("config_value")
        .eq("config_key", "icp_score_config")
        .eq("config_category", "skills")
        .maybeSingle();
      if (data?.config_value) {
        try { return JSON.parse(data.config_value) as ICPConfig; } catch { /* noop */ }
      }
      return null;
    },
    staleTime: 60_000,
  });

  const [criteria, setCriteria] = useState<ICPCriteria[]>(DEFAULT_CRITERIA);
  const [thresholds, setThresholds] = useState<ICPThreshold[]>(DEFAULT_THRESHOLDS);

  useEffect(() => {
    if (savedConfig) {
      setCriteria(savedConfig.criteria || DEFAULT_CRITERIA);
      setThresholds(savedConfig.thresholds || DEFAULT_THRESHOLDS);
    }
  }, [savedConfig]);

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const isValid = totalWeight === 100;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!isValid) throw new Error("Soma dos pesos deve ser 100%");
      const config: ICPConfig = { criteria, thresholds };
      const { data: existing } = await supabase
        .from("organization_configs")
        .select("id")
        .eq("config_key", "icp_score_config")
        .eq("config_category", "skills")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("organization_configs")
          .update({ config_value: JSON.stringify(config) })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const orgId = "00000000-0000-0000-0000-000000000001";
        const { error } = await supabase
          .from("organization_configs")
          .insert({
            organization_id: orgId,
            config_key: "icp_score_config",
            config_category: "skills",
            config_value: JSON.stringify(config),
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icp-config", franquiaId] });
      toast.success("Configuração ICP salva!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateWeight = (idx: number, value: number) => {
    setCriteria(prev => prev.map((c, i) => i === idx ? { ...c, weight: value } : c));
  };

  const updateThresholdMin = (idx: number, value: number) => {
    setThresholds(prev => prev.map((t, i) => i === idx ? { ...t, min: value } : t));
  };

  const updateThresholdAction = (idx: number, action: string) => {
    setThresholds(prev => prev.map((t, i) => i === idx ? { ...t, action } : t));
  };

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      {/* Critérios ICP */}
      <Card className="border-border/40">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-primary" />
            Critérios ICP — Pesos
            <Badge variant="outline" className={`ml-auto text-[10px] ${isValid ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
              {totalWeight}% / 100%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-3">
          {criteria.map((c, idx) => (
            <div key={c.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1.5">
                  <span>{c.emoji}</span> {c.label}
                </Label>
                <span className="text-xs font-bold text-primary">{c.weight}%</span>
              </div>
              <Slider
                value={[c.weight]}
                onValueChange={([v]) => updateWeight(idx, v)}
                min={0}
                max={50}
                step={5}
                className="w-full"
              />
              <p className="text-[10px] text-muted-foreground">{c.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Faixas de Temperatura */}
      <Card className="border-border/40">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs flex items-center gap-2">
            <Thermometer className="h-3.5 w-3.5 text-primary" />
            Faixas de Temperatura
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-3">
          {thresholds.map((t, idx) => (
            <div key={t.label} className="rounded-lg border border-border/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={`${t.color} text-xs`}>
                  {t.emoji} {t.label}
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">
                  {t.min} — {t.max}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-[10px] shrink-0">Min:</Label>
                <Input
                  type="number"
                  value={t.min}
                  onChange={e => updateThresholdMin(idx, Number(e.target.value))}
                  className="h-7 text-xs w-16"
                  min={0}
                  max={100}
                />
                <Label className="text-[10px] shrink-0">Ação:</Label>
                <Input
                  value={t.action}
                  onChange={e => updateThresholdAction(idx, e.target.value)}
                  className="h-7 text-xs flex-1"
                  placeholder="Ação automática..."
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => {
          setCriteria(DEFAULT_CRITERIA);
          setThresholds(DEFAULT_THRESHOLDS);
        }}>
          <RotateCcw className="h-3 w-3" /> Reset
        </Button>
        <Button size="sm" className="gap-1 text-xs" onClick={() => saveMutation.mutate()} disabled={!isValid || saveMutation.isPending}>
          <Save className="h-3 w-3" /> {saveMutation.isPending ? "Salvando..." : "Salvar Configuração"}
        </Button>
      </div>
    </div>
  );
}
