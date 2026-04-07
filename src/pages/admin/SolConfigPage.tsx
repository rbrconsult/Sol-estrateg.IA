import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Settings, ArrowLeft } from "lucide-react";
import { useSolConfig, useSolConfigUpdate } from "@/hooks/useSolData";

const PROMPT_KEYS = [
  { key: "system_prompt_sdr", label: "Prompt Agent SDR", icon: "📝" },
  { key: "prompt_pre_qualificacao", label: "Regras Pré-Qualificação", icon: "📝" },
  { key: "prompt_fup_frio", label: "Prompt FUP Frio", icon: "📝" },
  { key: "prompt_newsletter", label: "Prompt Newsletter", icon: "📝" },
];

const FUP_KEYS = Array.from({ length: 9 }, (_, i) => `fup_frio_${i}`);

export default function SolConfigPage() {
  const { data: configs, isLoading } = useSolConfig();
  const updateConfig = useSolConfigUpdate();
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const getVal = (key: string) => editValues[key] ?? configs?.find(c => c.key === key)?.valor_text ?? "";

  const handleSave = async (key: string) => {
    setSavingKey(key);
    await updateConfig.mutateAsync({ key, valor_text: getVal(key) });
    setEditValues(prev => { const n = { ...prev }; delete n[key]; return n; });
    setSavingKey(null);
  };

  const variaveisConfig = useMemo(() => {
    return configs?.find(c => c.key === "variaveis_globais");
  }, [configs]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6" /> Configurações SOL v2
        </h1>
        <p className="text-sm text-muted-foreground">Prompts, templates e variáveis do Agent IA</p>
      </div>

      {/* Prompts */}
      {PROMPT_KEYS.map(({ key, label, icon }) => (
        <Card key={key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">{icon} {label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={getVal(key)}
              onChange={e => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
              className="min-h-[120px] font-mono text-xs"
              placeholder={`Conteúdo de ${label}...`}
            />
            <Button
              size="sm"
              onClick={() => handleSave(key)}
              disabled={savingKey === key || !editValues[key]}
            >
              {savingKey === key ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* FUP Templates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">📨 Templates FUP Frio (9 etapas)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {FUP_KEYS.map((key, i) => (
            <div key={key} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">FUP #{i + 1} ({i % 2 === 0 ? "Áudio" : "Texto"})</label>
              <Textarea
                value={getVal(key)}
                onChange={e => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
                className="min-h-[60px] font-mono text-xs"
              />
            </div>
          ))}
          <Button
            size="sm"
            onClick={async () => {
              for (const key of FUP_KEYS) {
                if (editValues[key]) await updateConfig.mutateAsync({ key, valor_text: editValues[key] });
              }
              setEditValues(prev => {
                const n = { ...prev };
                FUP_KEYS.forEach(k => delete n[k]);
                return n;
              });
            }}
            disabled={!FUP_KEYS.some(k => editValues[k])}
          >
            <Save className="h-4 w-4 mr-2" /> Salvar Templates
          </Button>
        </CardContent>
      </Card>

      {/* Variáveis Globais */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">🤖 Variáveis Globais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={getVal("variaveis_globais")}
            onChange={e => setEditValues(prev => ({ ...prev, variaveis_globais: e.target.value }))}
            className="min-h-[200px] font-mono text-xs"
            placeholder='{"modelo_sdr": "gpt-5.4-mini", "temperatura_sdr": 0.1, ...}'
          />
          <Button
            size="sm"
            onClick={() => handleSave("variaveis_globais")}
            disabled={savingKey === "variaveis_globais" || !editValues["variaveis_globais"]}
          >
            {savingKey === "variaveis_globais" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Variáveis
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
