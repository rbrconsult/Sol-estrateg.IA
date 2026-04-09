import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Save, Settings, ArrowLeft, Sparkles, Send, Bot, FileText, MessageSquare, Mail, Zap, HelpCircle, Radio } from "lucide-react";
import { useSolConfig, useSolConfigUpdate } from "@/hooks/useSolData";
import { toast } from "sonner";

const PROMPT_KEYS = [
  { key: "system_prompt_sdr", label: "Prompt Agent SDR", icon: Bot, description: "Prompt principal do robô de qualificação via WhatsApp", color: "from-blue-500/10 to-blue-600/5 border-blue-500/20" },
  { key: "prompt_pre_qualificacao", label: "Regras Pré-Qualificação", icon: FileText, description: "Critérios de scoring e classificação de leads", color: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20" },
  { key: "prompt_fup_frio", label: "Prompt FUP Frio", icon: MessageSquare, description: "Template de follow-up para leads frios", color: "from-amber-500/10 to-amber-600/5 border-amber-500/20" },
  { key: "prompt_newsletter", label: "Prompt Newsletter", icon: Mail, description: "Conteúdo automatizado de newsletter", color: "from-purple-500/10 to-purple-600/5 border-purple-500/20" },
];

const FUP_KEYS = Array.from({ length: 9 }, (_, i) => `fup_frio_${i}`);

const PERGUNTA_KEYS = Array.from({ length: 10 }, (_, i) => `pergunta_${i + 1}`);

const MSG_AUTO_KEYS = [
  { key: "msg_boas_vindas", label: "Mensagem de Boas-Vindas", placeholder: "Olá {NOME}! Bem-vindo à Evolve Energia Solar..." },
  { key: "msg_transferencia", label: "Mensagem de Transferência", placeholder: "{NOME}, parabéns! Você está sendo direcionado..." },
];

const CANAIS_OPTIONS = ["TODOS", "INBOUND_WHATSAPP"];

// Parse pergunta config from valor_text JSON
function parsePergunta(valorText: string | null | undefined) {
  if (!valorText) return { campo: "", texto: "", obrigatorio: true, canais: ["TODOS"], descricao: "" };
  try {
    const parsed = JSON.parse(valorText);
    return {
      campo: parsed.campo ?? "",
      texto: parsed.texto ?? "",
      obrigatorio: parsed.obrigatorio ?? true,
      canais: parsed.canais ?? ["TODOS"],
      descricao: parsed.descricao ?? "",
    };
  } catch {
    return { campo: "", texto: valorText, obrigatorio: true, canais: ["TODOS"], descricao: "" };
  }
}

// Parse msg auto from valor_text JSON
function parseMsgAuto(valorText: string | null | undefined) {
  if (!valorText) return { texto: "", descricao: "" };
  try {
    const parsed = JSON.parse(valorText);
    return { texto: parsed.texto ?? "", descricao: parsed.descricao ?? "" };
  } catch {
    return { texto: valorText, descricao: "" };
  }
}

export default function SolConfigPage() {
  const navigate = useNavigate();
  const { data: configs, isLoading } = useSolConfig();
  const updateConfig = useSolConfigUpdate();
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Perguntas local state
  const [perguntaEdits, setPerguntaEdits] = useState<Record<string, { texto?: string; obrigatorio?: boolean; canais?: string[] }>>({});
  const [savingPerguntas, setSavingPerguntas] = useState(false);

  // Dialog state
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  // AI assistant state
  const [aiInstruction, setAiInstruction] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFupTarget, setAiFupTarget] = useState<string | null>(null);

  const getVal = (key: string) => editValues[key] ?? configs?.find(c => c.key === key)?.valor_text ?? "";
  const getOriginal = (key: string) => configs?.find(c => c.key === key)?.valor_text ?? "";

  const getPerguntaVal = (key: string) => {
    const original = parsePergunta(configs?.find(c => c.key === key)?.valor_text);
    const edits = perguntaEdits[key];
    return {
      campo: original.campo,
      descricao: original.descricao,
      texto: edits?.texto ?? original.texto,
      obrigatorio: edits?.obrigatorio ?? original.obrigatorio,
      canais: edits?.canais ?? original.canais,
    };
  };

  const getMsgAutoVal = (key: string) => {
    const original = parseMsgAuto(configs?.find(c => c.key === key)?.valor_text);
    const edits = perguntaEdits[key];
    return {
      descricao: original.descricao,
      texto: edits?.texto ?? original.texto,
    };
  };

  const handleSave = async (key: string) => {
    setSavingKey(key);
    try {
      await updateConfig.mutateAsync({ key, valor_text: getVal(key) });
      setEditValues(prev => { const n = { ...prev }; delete n[key]; return n; });
    } finally {
      setSavingKey(null);
    }
  };

  const handleSavePergunta = async (key: string) => {
    setSavingKey(key);
    try {
      const val = getPerguntaVal(key);
      const original = parsePergunta(configs?.find(c => c.key === key)?.valor_text);
      const toSave = { ...original, texto: val.texto, obrigatorio: val.obrigatorio, canais: val.canais };
      await updateConfig.mutateAsync({ key, valor_text: JSON.stringify(toSave) });
      setPerguntaEdits(prev => { const n = { ...prev }; delete n[key]; return n; });
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveAllPerguntas = async () => {
    setSavingPerguntas(true);
    try {
      for (const key of PERGUNTA_KEYS) {
        if (perguntaEdits[key]) {
          const val = getPerguntaVal(key);
          const original = parsePergunta(configs?.find(c => c.key === key)?.valor_text);
          const toSave = { ...original, texto: val.texto, obrigatorio: val.obrigatorio, canais: val.canais };
          await updateConfig.mutateAsync({ key, valor_text: JSON.stringify(toSave) });
        }
      }
      setPerguntaEdits({});
    } finally {
      setSavingPerguntas(false);
    }
  };

  const handleSaveMsgAuto = async (key: string) => {
    setSavingKey(key);
    try {
      const val = getMsgAutoVal(key);
      const original = parseMsgAuto(configs?.find(c => c.key === key)?.valor_text);
      const toSave = { ...original, texto: val.texto };
      await updateConfig.mutateAsync({ key, valor_text: JSON.stringify(toSave) });
      setPerguntaEdits(prev => { const n = { ...prev }; delete n[key]; return n; });
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

  const hasPerguntaEdits = PERGUNTA_KEYS.some(key => perguntaEdits[key]);

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header with breadcrumb */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
            <span className="cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate('/admin')}>Admin</span>
            <span>›</span>
            <span className="text-foreground font-medium">Configurações SOL</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Configurações SOL v2</h1>
        </div>
      </div>

      {/* Section: Prompts */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Prompts do Agent</h2>
        </div>
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
      </section>

      {/* Section: Perguntas do Robô */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-5 w-1 rounded-full bg-cyan-500" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">Perguntas do Robô</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4 ml-3">Configure o texto de cada pergunta enviada pelo Agent durante a qualificação</p>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {PERGUNTA_KEYS.map((key, i) => {
            const val = getPerguntaVal(key);
            const isEdited = !!perguntaEdits[key];
            return (
              <Card key={key} className="border bg-gradient-to-br from-cyan-500/5 to-cyan-600/5 border-cyan-500/15">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-primary">#{i + 1}</span>
                    {val.campo && <Badge variant="secondary" className="text-[10px] font-mono">{val.campo}</Badge>}
                    <Badge variant={val.obrigatorio ? "default" : "outline"} className="text-[9px]">
                      {val.obrigatorio ? "Obrigatório" : "Opcional"}
                    </Badge>
                    {isEdited && <Badge variant="outline" className="text-[9px] ml-auto border-amber-500/40 text-amber-500">editado</Badge>}
                  </CardTitle>
                  {val.descricao && <p className="text-[11px] text-muted-foreground">{val.descricao}</p>}
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge variant="outline" className="text-[9px]">
                      {val.canais.includes("TODOS") ? "📡 Todos os Canais" : "💬 Somente WhatsApp"}
                    </Badge>
                  </div>
                  <Textarea
                    value={val.texto}
                    onChange={e => setPerguntaEdits(prev => ({
                      ...prev,
                      [key]: { ...prev[key], texto: e.target.value }
                    }))}
                    className="min-h-[80px] text-sm"
                    placeholder={`Texto da pergunta #${i + 1}...`}
                  />
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={val.obrigatorio}
                          onCheckedChange={checked => setPerguntaEdits(prev => ({
                            ...prev,
                            [key]: { ...prev[key], obrigatorio: checked }
                          }))}
                        />
                        <span className="text-xs text-muted-foreground">Obrigatório</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {CANAIS_OPTIONS.map(canal => (
                          <Badge
                            key={canal}
                            variant={val.canais.includes(canal) ? "default" : "outline"}
                            className="text-[9px] cursor-pointer"
                            onClick={() => {
                              const newCanais = val.canais.includes(canal)
                                ? val.canais.filter(c => c !== canal)
                                : [...val.canais, canal];
                              setPerguntaEdits(prev => ({
                                ...prev,
                                [key]: { ...prev[key], canais: newCanais.length ? newCanais : ["TODOS"] }
                              }));
                            }}
                          >
                            {canal === "TODOS" ? "📡 Todos" : "💬 WhatsApp"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSavePergunta(key)}
                      disabled={savingKey === key || !isEdited}
                    >
                      {savingKey === key ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Salvar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {hasPerguntaEdits && (
          <div className="flex justify-end mt-4">
            <Button onClick={handleSaveAllPerguntas} disabled={savingPerguntas}>
              {savingPerguntas ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar todas as perguntas
            </Button>
          </div>
        )}
      </section>

      {/* Section: Mensagens Automáticas */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-5 w-1 rounded-full bg-violet-500" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Mensagens Automáticas</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4 ml-3">Mensagens enviadas automaticamente pelo robô em momentos-chave</p>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {MSG_AUTO_KEYS.map(({ key, label, placeholder }) => {
            const val = getMsgAutoVal(key);
            const isEdited = !!perguntaEdits[key];
            return (
              <Card key={key} className="border bg-gradient-to-br from-violet-500/5 to-violet-600/5 border-violet-500/15">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    {label}
                    {isEdited && <Badge variant="outline" className="text-[9px] ml-auto border-amber-500/40 text-amber-500">editado</Badge>}
                  </CardTitle>
                  {val.descricao && <p className="text-[11px] text-muted-foreground">{val.descricao}</p>}
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <Textarea
                    value={val.texto}
                    onChange={e => setPerguntaEdits(prev => ({
                      ...prev,
                      [key]: { ...prev[key], texto: e.target.value }
                    }))}
                    className="min-h-[120px] text-sm"
                    placeholder={placeholder}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Use <code className="bg-muted px-1 rounded text-[9px]">{"{NOME}"}</code> para o nome do lead</span>
                    <Button
                      size="sm"
                      onClick={() => handleSaveMsgAuto(key)}
                      disabled={savingKey === key || !isEdited}
                    >
                      {savingKey === key ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Salvar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Section: Templates & Variáveis */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-1 rounded-full bg-orange-500" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Templates & Variáveis</h2>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
      </section>

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
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Templates FUP Frio (9 etapas)
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Sequência alternada de áudio e texto para follow-up de leads frios</p>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            {/* Left: Templates */}
            <div className="lg:col-span-2 space-y-5">
              {FUP_KEYS.map((key, i) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px]">#{i + 1}</Badge>
                    {i % 2 === 0 ? "🎙 Áudio" : "💬 Texto"}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto h-5 px-2 text-[9px] gap-1 text-primary"
                      onClick={() => { setAiFupTarget(key); setAiInstruction(""); setAiResponse(""); }}
                    >
                      <Sparkles className="h-3 w-3" /> IA
                    </Button>
                  </label>
                  <Textarea
                    value={getVal(key)}
                    onChange={e => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
                    className="min-h-[100px] font-mono text-sm leading-relaxed"
                    placeholder={`Template FUP #${i + 1}...`}
                  />
                </div>
              ))}
            </div>

            {/* Right: AI Assistant */}
            <div className="space-y-3 border-l border-border/40 pl-4 sticky top-0">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Assistente IA
              </label>
              {aiFupTarget ? (
                <>
                  <p className="text-[11px] text-muted-foreground">
                    Editando: <span className="font-semibold text-foreground">FUP #{FUP_KEYS.indexOf(aiFupTarget) + 1}</span>
                  </p>
                  <Textarea
                    value={aiInstruction}
                    onChange={e => setAiInstruction(e.target.value)}
                    className="min-h-[80px] text-sm"
                    placeholder="Ex: Torne mais persuasivo, adicione urgência..."
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => handleAIAssist(aiFupTarget)}
                    disabled={aiLoading || !aiInstruction.trim()}
                  >
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {aiLoading ? "Gerando..." : "Pedir sugestão"}
                  </Button>

                  {aiResponse && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sugestão</label>
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 max-h-[300px] overflow-y-auto">
                        <pre className="text-xs font-mono whitespace-pre-wrap break-words text-foreground/80 leading-relaxed">
                          {aiResponse}
                        </pre>
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        className="w-full gap-2"
                        onClick={() => {
                          if (aiFupTarget) {
                            setEditValues(prev => ({ ...prev, [aiFupTarget]: aiResponse }));
                          }
                          setAiResponse("");
                          setAiInstruction("");
                          toast.success("Sugestão aplicada no template.");
                        }}
                      >
                        <Sparkles className="h-4 w-4" /> Aplicar
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Clique no botão <span className="text-primary font-semibold">IA</span> ao lado de qualquer template para usar o assistente.</p>
              )}
            </div>
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