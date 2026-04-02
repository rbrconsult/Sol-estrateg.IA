import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, RotateCcw, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type SkillConfigSchema, type ConfigField } from "@/data/skillConfigSchemas";

interface Props {
  schema: SkillConfigSchema;
  onSaved?: () => void;
}

export function SkillConfigPanel({ schema }: Props) {
  const queryClient = useQueryClient();
  const configKey = `skill_config_${schema.skillId}`;

  const { data: savedValues, isLoading } = useQuery({
    queryKey: ["skill-config", schema.skillId],
    queryFn: async () => {
      const { data } = await supabase
        .from("organization_configs")
        .select("config_value")
        .eq("config_key", configKey)
        .eq("config_category", "skills")
        .maybeSingle();
      if (data?.config_value) {
        try { return JSON.parse(data.config_value) as Record<string, any>; } catch { /* noop */ }
      }
      return null;
    },
    staleTime: 60_000,
  });

  const defaults = Object.fromEntries(schema.fields.map(f => [f.key, f.defaultValue]));
  const [values, setValues] = useState<Record<string, any>>(defaults);

  useEffect(() => {
    if (savedValues) {
      setValues({ ...defaults, ...savedValues });
    }
  }, [savedValues]);

  const setValue = (key: string, value: any) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: existing } = await supabase
        .from("organization_configs")
        .select("id")
        .eq("config_key", configKey)
        .eq("config_category", "skills")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("organization_configs")
          .update({ config_value: JSON.stringify(values) })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("organization_configs")
          .insert({
            organization_id: "00000000-0000-0000-0000-000000000001",
            config_key: configKey,
            config_category: "skills",
            config_value: JSON.stringify(values),
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skill-config", schema.skillId] });
      toast.success("Configuração salva!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  const renderField = (field: ConfigField) => {
    const val = values[field.key] ?? field.defaultValue;

    switch (field.type) {
      case "slider":
        return (
          <div className="space-y-1" key={field.key}>
            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-1.5">
                {field.emoji && <span>{field.emoji}</span>} {field.label}
              </Label>
              <span className="text-xs font-bold text-primary">
                {val}{field.unit || ""}
              </span>
            </div>
            <Slider
              value={[Number(val)]}
              onValueChange={([v]) => setValue(field.key, v)}
              min={field.min ?? 0}
              max={field.max ?? 100}
              step={field.step ?? 1}
            />
            {field.description && <p className="text-[10px] text-muted-foreground">{field.description}</p>}
          </div>
        );

      case "number":
        return (
          <div className="space-y-1" key={field.key}>
            <Label className="text-xs flex items-center gap-1.5">
              {field.emoji && <span>{field.emoji}</span>} {field.label}
              {field.unit && <span className="text-muted-foreground">({field.unit})</span>}
            </Label>
            <Input
              type="number"
              value={val}
              onChange={e => setValue(field.key, Number(e.target.value))}
              className="h-8 text-xs"
              min={field.min}
              max={field.max}
              step={field.step}
            />
            {field.description && <p className="text-[10px] text-muted-foreground">{field.description}</p>}
          </div>
        );

      case "text":
      case "phone":
        return (
          <div className="space-y-1" key={field.key}>
            <Label className="text-xs flex items-center gap-1.5">
              {field.emoji && <span>{field.emoji}</span>} {field.label}
            </Label>
            <Input
              value={val}
              onChange={e => setValue(field.key, e.target.value)}
              className="h-8 text-xs"
              placeholder={field.placeholder}
              type={field.type === "phone" ? "tel" : "text"}
            />
            {field.description && <p className="text-[10px] text-muted-foreground">{field.description}</p>}
          </div>
        );

      case "textarea":
        return (
          <div className="space-y-1" key={field.key}>
            <Label className="text-xs flex items-center gap-1.5">
              {field.emoji && <span>{field.emoji}</span>} {field.label}
            </Label>
            <Textarea
              value={val}
              onChange={e => setValue(field.key, e.target.value)}
              className="text-xs min-h-[60px]"
              placeholder={field.placeholder}
            />
          </div>
        );

      case "select":
        return (
          <div className="space-y-1" key={field.key}>
            <Label className="text-xs flex items-center gap-1.5">
              {field.emoji && <span>{field.emoji}</span>} {field.label}
            </Label>
            <Select value={String(val)} onValueChange={v => setValue(field.key, v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.description && <p className="text-[10px] text-muted-foreground">{field.description}</p>}
          </div>
        );

      case "toggle":
        return (
          <div className="flex items-center justify-between gap-2" key={field.key}>
            <div>
              <Label className="text-xs flex items-center gap-1.5">
                {field.emoji && <span>{field.emoji}</span>} {field.label}
              </Label>
              {field.description && <p className="text-[10px] text-muted-foreground">{field.description}</p>}
            </div>
            <Switch
              checked={!!val}
              onCheckedChange={v => setValue(field.key, v)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Settings2 className="h-3.5 w-3.5 text-primary" />
        <p className="text-xs font-semibold">{schema.title}</p>
      </div>
      {schema.description && (
        <p className="text-[10px] text-muted-foreground -mt-2">{schema.description}</p>
      )}

      <div className="space-y-3">
        {schema.fields.map(renderField)}
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={() => setValues(defaults)}>
          <RotateCcw className="h-3 w-3" /> Reset
        </Button>
        <Button size="sm" className="gap-1 text-xs h-7" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="h-3 w-3" /> {saveMutation.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
