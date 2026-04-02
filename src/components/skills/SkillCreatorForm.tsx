import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, CheckCircle2, Copy, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { verticalConfig, type Vertical } from "@/data/skillsMap";

interface SkillDefinition {
  id: string;
  name: string;
  desc: string;
  category: string;
  verticals: string[];
  fonte: string;
  output: string;
  trigger: string;
  logic_summary: string;
  sql_hint: string;
  alert_channel: string;
}

export function SkillCreatorForm({ onSkillCreated }: { onSkillCreated?: (skill: SkillDefinition) => void }) {
  const [description, setDescription] = useState("");
  const [vertical, setVertical] = useState<string>("universal");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<SkillDefinition | null>(null);
  const [provider, setProvider] = useState<string>("");

  const handleGenerate = async () => {
    if (description.length < 10) {
      toast.error("Descreva a skill com pelo menos 10 caracteres.");
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-skill", {
        body: { description, vertical },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data.skill);
      setProvider(data.provider || "");
      toast.success("Skill gerada com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar skill");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      toast.success("Copiado para clipboard!");
    }
  };

  const triggerLabels: Record<string, string> = {
    cron_5m: "⏱ A cada 5 min",
    cron_15m: "⏱ A cada 15 min",
    cron_1h: "⏱ A cada 1 hora",
    cron_daily: "📅 Diário",
    webhook: "🔗 Webhook",
    manual: "👆 Manual",
  };

  const channelLabels: Record<string, string> = {
    whatsapp: "📱 WhatsApp",
    insight: "💡 Insight na plataforma",
    dashboard: "📊 Dashboard",
    none: "— Sem alerta",
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Criar Nova Skill com IA
          {provider && (
            <Badge variant="outline" className="text-[9px] ml-auto">
              via {provider === "openai" ? "OpenAI" : "Lovable AI"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Descreva a automação que deseja
          </label>
          <Textarea
            placeholder="Ex: Quero uma skill que detecte leads que responderam 'não tenho interesse' e automaticamente marque como desqualificado, notificando o closer via WhatsApp..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="mt-1 text-sm min-h-[80px]"
            maxLength={2000}
          />
          <p className="text-[10px] text-muted-foreground mt-1">{description.length}/2000</p>
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Vertical</label>
          <Select value={vertical} onValueChange={setVertical}>
            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.entries(verticalConfig) as [Vertical, typeof verticalConfig[Vertical]][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleGenerate} disabled={isGenerating || description.length < 10} className="w-full gap-2">
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isGenerating ? "Gerando com IA..." : "Gerar Skill"}
        </Button>

        {result && (
          <Card className="bg-card/80 border-border/40">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-semibold">{result.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCopy}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  {onSkillCreated && (
                    <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1"
                      onClick={() => onSkillCreated(result)}>
                      <Plus className="h-3 w-3" /> Adicionar ao mapa
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">{result.desc}</p>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-muted-foreground">Categoria:</span>
                  <Badge variant="outline" className="ml-1 text-[9px]">{result.category}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Trigger:</span>
                  <span className="ml-1">{triggerLabels[result.trigger] || result.trigger}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fonte:</span>
                  <span className="ml-1 font-mono">{result.fonte}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Alerta:</span>
                  <span className="ml-1">{channelLabels[result.alert_channel] || result.alert_channel}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground font-semibold">Output:</span>
                <p className="text-xs mt-0.5">{result.output}</p>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground font-semibold">Lógica:</span>
                <p className="text-xs mt-0.5 text-muted-foreground">{result.logic_summary}</p>
              </div>

              {result.sql_hint && (
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold">SQL hint:</span>
                  <pre className="text-[10px] mt-0.5 bg-muted/30 rounded p-2 overflow-x-auto font-mono">{result.sql_hint}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
