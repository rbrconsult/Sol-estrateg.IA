import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Save, Settings, ArrowLeft, Sparkles, Send, Bot, FileText, MessageSquare, Mail, Zap } from "lucide-react";
import { useSolConfig, useSolConfigUpdate } from "@/hooks/useSolData";
import { toast } from "sonner";

const PROMPT_KEYS = [
  { key: "system_prompt_sdr", label: "Prompt Agent SDR", icon: Bot, description: "Prompt principal do robô de qualificação via WhatsApp", color: "from-blue-500/10 to-blue-600/5 border-blue-500/20" },
  { key: "prompt_pre_qualificacao", label: "Regras Pré-Qualificação", icon: FileText, description: "Critérios de scoring e classificação de leads", color: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20" },
  { key: "prompt_fup_frio", label: "Prompt FUP Frio", icon: MessageSquare, description: "Template de follow-up para leads frios", color: "from-amber-500/10 to-amber-600/5 border-amber-500/20" },
  { key: "prompt_newsletter", label: "Prompt Newsletter", icon: Mail, description: "Conteúdo automatizado de newsletter", color: "from-purple-500/10 to-purple-600/5 border-purple-500/20" },
];

const FUP_KEYS = Array.from({ length: 9 }, (_, i) => `fup_frio_${i}`);

export default function SolConfigPage() {
  const navigate = useNavigate();
  const { data: configs, isLoading } = useSolConfig();
  const updateConfig = useSolConfigUpdate();
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Dialog state
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  // AI assistant state
  const [aiInstruction, setAiInstruction] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFupTarget, setAiFupTarget] = useState<string | null>(null);

  const getVal = (key: string) => editValues[key] ?? configs?.find(c => c.key === key)?.valor_text ?? "";
  const getOriginal = (key: string) => configs?.find(c => c.key === key)?.valor_text ?? "";

  const handleSave = async (key: string) => {
    setSavingKey(key);
    try {
      await updateConfig.mutateAsync({ key, valor_text: getVal(key) });
      setEditValues(prev => { const n = { ...prev }; delete n[key]; return n; });
    } finally {
      setSavingKey(null);
    }
  };

  const handleAIAssist = async (promptKey: string) => {
    if (!aiInstruction.trim()) {
      toast.error("Digite uma instrução para o assistente IA.");
      return;
    }

    setAiLoading(true);
    setAiResponse("");

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/prompt-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            prompt_key: promptKey,
            current_content: getVal(promptKey),
            instruction: aiInstruction,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        toast.error(err.error || `Erro ${resp.status}`);
        setAiLoading(false);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setAiResponse(fullText);
            }
          } catch { /* partial */ }
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao chamar assistente IA");
    } finally {
      setAiLoading(false);
    }
  };

  const applyAISuggestion = (key: string) => {
    if (aiResponse) {
      setEditValues(prev => ({ ...prev, [key]: aiResponse }));
      setAiResponse("");
      setAiInstruction("");
      toast.success("Sugestão aplicada no editor. Revise e salve.");
    }
  };

  const openPromptDialog = (key: string) => {
    setOpenDialog(key);
    setAiResponse("");
    setAiInstruction("");
  };

  const closeDialog = () => {
    setOpenDialog(null);
    setAiResponse("");
    setAiInstruction("");
  };

  const currentPrompt = PROMPT_KEYS.find(p => p.key === openDialog);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6" /> Configurações SOL v2
          </h1>
          <p className="text-sm text-muted-foreground">Prompts, templates e variáveis do Agent IA</p>
        </div>
      </div>

      {/* Quadrant Grid — Prompts */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Prompts do Agent</h2>
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-5">
          {PROMPT_KEYS.map(({ key, label, icon: Icon, description, color }) => {
            const content = getVal(key);
            const hasContent = content.trim().length > 0;
            const isEdited = !!editValues[key];
            return (
              <Card
                key={key}
                className={`cursor-pointer hover:shadow-md transition-all border bg-gradient-to-br h-full ${color}`}
                onClick={() => openPromptDialog(key)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    {label}
                    {isEdited && <Badge variant="outline" className="text-[9px] ml-auto border-amber-500/40 text-amber-500">editado</Badge>}
                    {!hasContent && <Badge variant="outline" className="text-[9px] ml-auto border-destructive/40 text-destructive">vazio</Badge>}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="bg-background/60 rounded-md p-4 min-h-[280px] max-h-[46vh] overflow-y-auto">
                    <pre className="text-sm font-mono text-foreground/80 whitespace-pre-wrap break-words leading-7">
                      {hasContent ? content : "Nenhum conteúdo configurado..."}
                    </pre>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {hasContent ? `${content.length} caracteres` : "Clique para configurar"} · Clique para editar
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* FUP Templates + Variáveis — Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* FUP Templates card */}
        <Card
          className="cursor-pointer hover:shadow-md transition-all border bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20"
          onClick={() => setOpenDialog("fup_templates")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Templates FUP Frio
              <Badge variant="outline" className="text-[9px] ml-auto">{FUP_KEYS.filter(k => getVal(k).trim()).length}/9 preenchidos</Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">9 etapas de follow-up automático (áudio + texto alternados)</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-1.5">
              {FUP_KEYS.map((key, i) => (
                <div key={key} className={`rounded px-2 py-1 text-[9px] ${getVal(key).trim() ? "bg-primary/10 text-primary" : "bg-muted/40 text-muted-foreground"}`}>
                  #{i + 1} {i % 2 === 0 ? "🎙" : "💬"}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Variáveis Globais card */}
        <Card
          className="cursor-pointer hover:shadow-md transition-all border bg-gradient-to-br from-slate-500/10 to-slate-600/5 border-slate-500/20"
          onClick={() => setOpenDialog("variaveis_globais")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              Variáveis Globais
            </CardTitle>
            <p className="text-xs text-muted-foreground">Modelos IA, temperaturas e parâmetros do Agent</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="bg-background/60 rounded-md p-4 min-h-[220px] max-h-[38vh] overflow-y-auto">
              <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap break-words leading-6">
                {getVal("variaveis_globais") || "Nenhuma variável configurada..."}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ DIALOG: Prompt Editor + AI ═══ */}
      {currentPrompt && (
        <Dialog open={!!openDialog} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <currentPrompt.icon className="h-5 w-5 text-primary" />
                {currentPrompt.label}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{currentPrompt.description}</p>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              {/* Left: Editor */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Editor do Prompt</label>
                <Textarea
                  value={getVal(currentPrompt.key)}
                  onChange={e => setEditValues(prev => ({ ...prev, [currentPrompt.key]: e.target.value }))}
                  className="min-h-[350px] font-mono text-xs leading-relaxed"
                  placeholder={`Conteúdo de ${currentPrompt.label}...`}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{getVal(currentPrompt.key).length} caracteres</span>
                  <Button
                    size="sm"
                    onClick={() => handleSave(currentPrompt.key)}
                    disabled={savingKey === currentPrompt.key || !editValues[currentPrompt.key]}
                  >
                    {savingKey === currentPrompt.key ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar
                  </Button>
                </div>
              </div>

              {/* Right: AI Assistant */}
              <div className="space-y-3 border-l border-border/40 pl-4">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Assistente IA
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Descreva o que deseja alterar no prompt e a IA vai sugerir uma versão revisada.
                </p>
                <Textarea
                  value={aiInstruction}
                  onChange={e => setAiInstruction(e.target.value)}
                  className="min-h-[80px] text-sm"
                  placeholder="Ex: Torne o tom mais profissional, adicione uma pergunta sobre o telhado..."
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleAIAssist(currentPrompt.key)}
                  disabled={aiLoading || !aiInstruction.trim()}
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {aiLoading ? "Gerando sugestão..." : "Pedir sugestão à IA"}
                </Button>

                {aiResponse && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sugestão da IA</label>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 max-h-[250px] overflow-y-auto">
                      <pre className="text-xs font-mono whitespace-pre-wrap break-words text-foreground/80 leading-relaxed">
                        {aiResponse}
                      </pre>
                    </div>
                    <Button
                      size="sm"
                      variant="default"
                      className="w-full gap-2"
                      onClick={() => applyAISuggestion(currentPrompt.key)}
                    >
                      <Sparkles className="h-4 w-4" /> Aplicar sugestão no editor
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ═══ DIALOG: FUP Templates ═══ */}
      <Dialog open={openDialog === "fup_templates"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Templates FUP Frio (9 etapas)
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Sequência alternada de áudio e texto para follow-up de leads frios</p>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {FUP_KEYS.map((key, i) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px]">#{i + 1}</Badge>
                  {i % 2 === 0 ? "🎙 Áudio" : "💬 Texto"}
                </label>
                <Textarea
                  value={getVal(key)}
                  onChange={e => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
                  className="min-h-[60px] font-mono text-xs"
                  placeholder={`Template FUP #${i + 1}...`}
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
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
              <Save className="h-4 w-4 mr-2" /> Salvar Todos os Templates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DIALOG: Variáveis Globais ═══ */}
      <Dialog open={openDialog === "variaveis_globais"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Variáveis Globais
            </DialogTitle>
            <p className="text-sm text-muted-foreground">JSON com modelos, temperaturas e parâmetros do Agent IA</p>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            <Textarea
              value={getVal("variaveis_globais")}
              onChange={e => setEditValues(prev => ({ ...prev, variaveis_globais: e.target.value }))}
              className="min-h-[300px] font-mono text-xs"
              placeholder='{"modelo_sdr": "gpt-4.1", "temperatura_sdr": 0.1, ...}'
            />
          </div>

          <DialogFooter>
            <Button
              onClick={() => handleSave("variaveis_globais")}
              disabled={savingKey === "variaveis_globais" || !editValues["variaveis_globais"]}
            >
              {savingKey === "variaveis_globais" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Variáveis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
