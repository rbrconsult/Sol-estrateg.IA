import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, CheckCircle2, Copy, Plus, ChevronRight, Send, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { verticalConfig, type Vertical } from "@/data/skillsMap";

interface SkillReview {
  approved: boolean | null;
  score: number | null;
  notes: string | null;
  reviewer: string;
  error?: boolean;
}

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
  delivery_method?: string;
  frequency?: string;
  _review?: SkillReview;
}

const WIZARD_QUESTIONS = [
  {
    key: "dor",
    label: "Dor operacional / comercial",
    question: "Qual dor operacional ou comercial essa skill resolve?",
    placeholder: "Ex: Leads quentes ficam 3+ dias sem contato do closer, gerando perda de vendas...",
  },
  {
    key: "momento",
    label: "Momento do fluxo",
    question: "Em que momento do fluxo ela entra?",
    placeholder: "Ex: Após qualificação pelo robô SDR, antes da transferência ao comercial...",
  },
  {
    key: "autonomia",
    label: "Autonomia de decisão",
    question: "Que decisão ela toma sozinha e qual ela só recomenda?",
    placeholder: "Ex: Toma sozinha: remarcar follow-up. Só recomenda: desqualificar lead de alto score...",
  },
  {
    key: "sistemas",
    label: "Sistemas (lê / escreve)",
    question: "Que sistemas ela lê e em quais ela escreve?",
    placeholder: "Ex: Lê: sol_leads_sync, sol_equipe_sync. Escreve: sol_insights, notifica via WhatsApp...",
  },
  {
    key: "impacto",
    label: "Impacto esperado",
    question: "Qual é o impacto financeiro ou operacional esperado?",
    placeholder: "Ex: Reduzir tempo médio de primeiro contato de 4h para 15min, aumentando conversão em ~12%...",
  },
  {
    key: "envio",
    label: "Forma de envio e periodicidade",
    question: "Como e com que frequência essa skill deve entregar o resultado?",
    placeholder: "Ex: WhatsApp diário às 7h para o gestor, com insight na plataforma em tempo real...",
  },
];

const STORAGE_KEY = "skill-creator-draft";

export function SkillCreatorForm({ onSkillCreated }: { onSkillCreated?: (skill: SkillDefinition) => void }) {
  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).step ?? 0 : 0;
    } catch { return 0; }
  });
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).answers ?? { dor: "", momento: "", autonomia: "", sistemas: "", impacto: "", envio: "" } : { dor: "", momento: "", autonomia: "", sistemas: "", impacto: "", envio: "" };
    } catch { return { dor: "", momento: "", autonomia: "", sistemas: "", impacto: "", envio: "" }; }
  });
  const [vertical, setVertical] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).vertical ?? "universal" : "universal";
    } catch { return "universal"; }
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<SkillDefinition | null>(null);
  const [pipeline, setPipeline] = useState<{ stage1: string; stage2: string } | null>(null);

  // Auto-save draft to localStorage on every change
  useEffect(() => {
    const hasContent = Object.values(answers).some(v => v.trim().length > 0);
    if (hasContent && !result) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, step: currentStep, vertical }));
    }
  }, [answers, currentStep, vertical, result]);

  const currentQ = WIZARD_QUESTIONS[currentStep];
  const isLastStep = currentStep === WIZARD_QUESTIONS.length - 1;
  const allAnswered = WIZARD_QUESTIONS.every(q => answers[q.key].trim().length >= 5);

  const buildDescription = () => {
    return WIZARD_QUESTIONS.map(q => `**${q.label}**: ${answers[q.key]}`).join("\n\n");
  };

  const handleGenerate = async () => {
    const description = buildDescription();
    if (description.length < 10) {
      toast.error("Preencha todas as perguntas do wizard.");
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
      setPipeline(data.pipeline || null);
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

  const deliveryLabels: Record<string, string> = {
    whatsapp: "📱 WhatsApp",
    email: "📧 Email",
    inbox: "💡 Inbox Lovable",
    dashboard: "📊 Dashboard",
    "whatsapp+inbox": "📱 WhatsApp + 💡 Inbox",
  };

  const frequencyLabels: Record<string, string> = {
    realtime: "⚡ Tempo real",
    "5min": "⏱ A cada 5 min",
    "15min": "⏱ A cada 15 min",
    "1h": "⏱ A cada 1 hora",
    diario: "📅 Diário",
    semanal: "📆 Semanal",
    mensal: "🗓️ Mensal",
    manual: "👆 Manual / On-demand",
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Criar Nova Skill com IA
          {pipeline && (
            <div className="flex items-center gap-1 ml-auto">
              <Badge variant="outline" className="text-[9px]">
                🧠 {pipeline.stage1}
              </Badge>
              {pipeline.stage2 !== "skipped" && (
                <Badge variant="outline" className="text-[9px]">
                  👔 {pipeline.stage2}
                </Badge>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Step indicator */}
        {!result && (
          <div className="flex items-center gap-1">
            {WIZARD_QUESTIONS.map((q, i) => (
              <button
                key={q.key}
                onClick={() => setCurrentStep(i)}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  i === currentStep
                    ? "bg-primary"
                    : answers[q.key].trim().length >= 5
                    ? "bg-primary/40"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
        )}

        {!result && (
          <>
            {/* Current question */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  {currentStep + 1}/{WIZARD_QUESTIONS.length} — {currentQ.label}
                </label>
                {answers[currentQ.key].trim().length >= 5 && (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                )}
              </div>
              <p className="text-xs font-medium mb-1.5">{currentQ.question}</p>
              <Textarea
                placeholder={currentQ.placeholder}
                value={answers[currentQ.key]}
                onChange={e => setAnswers(prev => ({ ...prev, [currentQ.key]: e.target.value }))}
                className="text-sm min-h-[70px]"
                maxLength={500}
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {answers[currentQ.key].length}/500
              </p>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button variant="ghost" size="sm" className="text-xs"
                  onClick={() => setCurrentStep(s => s - 1)}>
                  ← Anterior
                </Button>
              )}
              <div className="flex-1" />
              {!isLastStep ? (
                <Button variant="outline" size="sm" className="text-xs gap-1"
                  disabled={answers[currentQ.key].trim().length < 5}
                  onClick={() => setCurrentStep(s => s + 1)}>
                  Próxima <ChevronRight className="h-3 w-3" />
                </Button>
              ) : null}
            </div>

            {/* Vertical selector + Generate button */}
            {isLastStep && (
              <div className="space-y-2 pt-1 border-t border-border/30">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Vertical
                  </label>
                  <Select value={vertical} onValueChange={setVertical}>
                    <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(verticalConfig) as [Vertical, typeof verticalConfig[Vertical]][]).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleGenerate} disabled={isGenerating || !allAnswered} className="w-full gap-2">
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isGenerating ? "Gerando com IA (GPT-4o + Claude)..." : "Gerar Skill"}
                </Button>

                {!allAnswered && (
                  <p className="text-[10px] text-amber-400 text-center">
                    ⚠️ Preencha todas as {WIZARD_QUESTIONS.length} perguntas para gerar
                  </p>
                )}
              </div>
            )}

            {/* Summary of answered questions */}
            {WIZARD_QUESTIONS.filter((q, i) => i !== currentStep && answers[q.key].trim().length >= 5).length > 0 && (
              <div className="space-y-1 pt-2 border-t border-border/20">
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Respostas</span>
                {WIZARD_QUESTIONS.map((q, i) => {
                  if (i === currentStep || answers[q.key].trim().length < 5) return null;
                  return (
                    <button key={q.key} onClick={() => setCurrentStep(i)}
                      className="w-full text-left rounded px-2 py-1 hover:bg-muted/30 transition-colors">
                      <span className="text-[9px] text-muted-foreground">{q.label}:</span>
                      <p className="text-[10px] line-clamp-1">{answers[q.key]}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

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

              {/* Delivery & Frequency */}
              <div className="grid grid-cols-2 gap-2 text-[10px] p-2 rounded-lg bg-muted/20 border border-border/20">
                <div className="flex items-center gap-1.5">
                  <Send className="h-3 w-3 text-primary" />
                  <div>
                    <span className="text-muted-foreground block">Forma de envio:</span>
                    <span className="font-medium">{result.delivery_method ? (deliveryLabels[result.delivery_method] || result.delivery_method) : "—"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-primary" />
                  <div>
                    <span className="text-muted-foreground block">Periodicidade:</span>
                    <span className="font-medium">{result.frequency ? (frequencyLabels[result.frequency] || result.frequency) : "—"}</span>
                  </div>
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

              {result._review && (
                <div className={`rounded-lg p-2.5 border ${
                  result._review.error ? "bg-destructive/5 border-destructive/20" 
                  : result._review.approved ? "bg-emerald-500/5 border-emerald-500/20" 
                  : "bg-amber-500/5 border-amber-500/20"
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold flex items-center gap-1">
                      👔 Revisão DM — {result._review.reviewer}
                    </span>
                    {result._review.score != null && (
                      <Badge variant="outline" className="text-[9px]">
                        Score: {result._review.score}/10
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    {result._review.approved === true && <Badge className="text-[9px] bg-emerald-500/20 text-emerald-400 border-0">✅ Aprovado</Badge>}
                    {result._review.approved === false && <Badge className="text-[9px] bg-amber-500/20 text-amber-400 border-0">⚠️ Ajustes sugeridos</Badge>}
                    {result._review.error && <Badge className="text-[9px] bg-destructive/20 text-destructive border-0">❌ Revisão falhou</Badge>}
                  </div>
                  {result._review.notes && (
                    <p className="text-xs text-muted-foreground">{result._review.notes}</p>
                  )}
                </div>
              )}

              <Button variant="ghost" size="sm" className="w-full text-xs mt-2"
                onClick={() => {
                  setResult(null);
                  setPipeline(null);
                  setCurrentStep(0);
                  setAnswers({ dor: "", momento: "", autonomia: "", sistemas: "", impacto: "", envio: "" });
                }}>
                + Criar outra skill
              </Button>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
