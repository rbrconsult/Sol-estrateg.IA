import { useState, useEffect, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Save, Phone, Database } from "lucide-react";
import { VariableBank } from "./VariableBank";
import type { ReportTemplate } from "@/hooks/useReportTemplates";

const ICONS = ["☀️", "📊", "🤖", "📣", "📈", "🎯", "💰", "🔔", "📋", "⚡"];
const DESTINATARIO_ROLES = [
  { value: "diretor", label: "Diretor" },
  { value: "gerente", label: "Gerente" },
  { value: "closer", label: "Closer" },
] as const;

const FREQUENCIAS = ["Diária", "Semanal", "Quinzenal", "Mensal"] as const;
const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const DIAS_MES = Array.from({ length: 28 }, (_, i) => i + 1);
const HORARIOS = ["06:00", "06:30", "07:00", "07:05", "07:10", "07:30", "08:00", "08:30", "09:00", "10:00", "12:00", "14:00", "17:00", "18:00"];

function parsePeriodicidade(p: string) {
  const parts = p.split(" — ");
  const freq = parts[0] || "Diária";
  const rest = parts[1] || "07:00";

  if (freq === "Semanal" || freq === "Quinzenal") {
    const match = rest.match(/^(\S+)\s+(.+)$/);
    return { freq, dia: match?.[1] || "Segunda", horario: match?.[2] || "08:00" };
  }
  if (freq === "Mensal") {
    const match = rest.match(/^Dia\s+(\d+)\s+(.+)$/);
    return { freq, dia: match?.[1] || "1", horario: match?.[2] || "08:00" };
  }
  return { freq: "Diária", dia: "", horario: rest };
}

function buildPeriodicidade(freq: string, dia: string, horario: string) {
  if (freq === "Semanal" || freq === "Quinzenal") return `${freq} — ${dia} ${horario}`;
  if (freq === "Mensal") return `${freq} — Dia ${dia} ${horario}`;
  return `Diária — ${horario}`;
}

interface ReportEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ReportTemplate | null;
  onSave: (data: Partial<ReportTemplate>) => void;
  isSaving: boolean;
}

export function ReportEditorDialog({ open, onOpenChange, template, onSave, isSaving }: ReportEditorDialogProps) {
  const [form, setForm] = useState({
    titulo: "",
    icon: "📊",
    destinatario: "",
    destinatario_telefone: "",
    copia_telefone: "",
    periodicidade: "Diária — 07:00",
    canal: "WhatsApp",
    conteudo: "",
    destinatario_roles: [] as string[],
  });
  const [tab, setTab] = useState("editor");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const parsed = useMemo(() => parsePeriodicidade(form.periodicidade), [form.periodicidade]);

  const updatePeriod = (field: "freq" | "dia" | "horario", value: string) => {
    const next = { ...parsed, [field]: value };
    if (field === "freq") {
      if (value === "Semanal" || value === "Quinzenal") next.dia = next.dia || "Segunda";
      if (value === "Mensal") next.dia = next.dia || "1";
      if (!next.horario) next.horario = "08:00";
    }
    setForm(f => ({ ...f, periodicidade: buildPeriodicidade(next.freq, next.dia, next.horario) }));
  };

  useEffect(() => {
    if (template) {
      setForm({
        titulo: template.titulo,
        icon: template.icon,
        destinatario: template.destinatario,
        destinatario_telefone: template.destinatario_telefone || "",
        copia_telefone: (template as any).copia_telefone || "5511974426112",
        periodicidade: template.periodicidade,
        canal: template.canal,
        conteudo: template.conteudo,
        destinatario_roles: (template as any).destinatario_roles || [],
      });
    } else {
      setForm({
        titulo: "",
        icon: "📊",
        destinatario: "",
        destinatario_telefone: "",
        copia_telefone: "5511974426112",
        periodicidade: "Diária — 07:00",
        canal: "WhatsApp",
        conteudo: "",
        destinatario_roles: [],
      });
    }
    setTab("editor");
  }, [template, open]);

  const handleSave = () => {
    onSave({
      ...(template ? { id: template.id } : {}),
      ...form,
      ordem: template?.ordem ?? 99,
    });
  };

  const handleInsertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = form.conteudo.slice(0, start) + variable + form.conteudo.slice(end);
      setForm(f => ({ ...f, conteudo: newContent }));
      // Restore cursor position after insert
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + variable.length;
      }, 0);
    } else {
      setForm(f => ({ ...f, conteudo: f.conteudo + variable }));
    }
  };

  const variables = form.conteudo.match(/\{\{[a-z_\s:+\-*/0-9.]+\}\}/gi) || [];
  const uniqueVars = [...new Set(variables)];
  const calcVars = uniqueVars.filter(v => v.includes("calc:"));
  const dataVars = uniqueVars.filter(v => !v.includes("calc:"));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{template ? "Editar Template" : "Novo Template"}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 min-h-0">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="editor">Configurar</TabsTrigger>
            <TabsTrigger value="variables" className="gap-1">
              <Database className="h-3 w-3" /> Variáveis
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1">
              <Eye className="h-3 w-3" /> Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={form.titulo} onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Nome do relatório" />
              </div>
              <div className="space-y-2">
                <Label>Ícone</Label>
                <div className="flex gap-1 flex-wrap">
                  {ICONS.map((ic) => (
                    <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))} className={`text-lg p-1.5 rounded-md border transition-all ${form.icon === ic ? "border-primary bg-primary/10 scale-110" : "border-transparent hover:bg-muted"}`}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Destinatário (nome/cargo)</Label>
                <Input value={form.destinatario} onChange={(e) => setForm(f => ({ ...f, destinatario: e.target.value }))} placeholder="Ex: João Silva — Diretor" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Telefone do Destinatário
                </Label>
                <Input
                  value={form.destinatario_telefone}
                  onChange={(e) => setForm(f => ({ ...f, destinatario_telefone: e.target.value }))}
                  placeholder="5511999999999"
                  type="tel"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Enviar para (por cargo)</Label>
              <div className="flex gap-4">
                {DESTINATARIO_ROLES.map((r) => (
                  <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={form.destinatario_roles.includes(r.value)}
                      onCheckedChange={(checked) => {
                        setForm(f => ({
                          ...f,
                          destinatario_roles: checked
                            ? [...f.destinatario_roles, r.value]
                            : f.destinatario_roles.filter(v => v !== r.value),
                        }));
                      }}
                    />
                    <span className="text-sm">{r.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">Selecione quais cargos devem receber este report automaticamente</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select value={parsed.freq} onValueChange={(v) => updatePeriod("freq", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCIAS.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(parsed.freq === "Semanal" || parsed.freq === "Quinzenal") && (
                <div className="space-y-2">
                  <Label>Dia da Semana</Label>
                  <Select value={parsed.dia} onValueChange={(v) => updatePeriod("dia", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIAS_SEMANA.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {parsed.freq === "Mensal" && (
                <div className="space-y-2">
                  <Label>Dia do Mês</Label>
                  <Select value={parsed.dia} onValueChange={(v) => updatePeriod("dia", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIAS_MES.map((d) => (
                        <SelectItem key={d} value={String(d)}>Dia {d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Horário</Label>
                <Select value={parsed.horario} onValueChange={(v) => updatePeriod("horario", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HORARIOS.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Canal</Label>
                <Select value={form.canal} onValueChange={(v) => setForm(f => ({ ...f, canal: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Slack">Slack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Conteúdo do Template</Label>
                  <p className="text-[10px] text-muted-foreground">
                    Clique nas variáveis ao lado para inserir →
                  </p>
                </div>
                <Textarea
                  ref={textareaRef}
                  value={form.conteudo}
                  onChange={(e) => setForm(f => ({ ...f, conteudo: e.target.value }))}
                  placeholder="Escreva o template da mensagem..."
                  className="min-h-[260px] font-mono text-xs"
                />
                {uniqueVars.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Variáveis detectadas ({dataVars.length})</Label>
                      {calcVars.length > 0 && (
                        <Badge variant="outline" className="text-[9px] gap-1">
                          <span>🧮</span> {calcVars.length} cálculo(s)
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {dataVars.map((v) => (
                        <Badge key={v} variant="secondary" className="text-xs font-mono">{v}</Badge>
                      ))}
                      {calcVars.map((v) => (
                        <Badge key={v} variant="outline" className="text-xs font-mono border-primary/30 text-primary">{v}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Inline variable bank */}
              <div className="border rounded-lg p-3 bg-muted/30">
                <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-primary" />
                  Banco de Variáveis
                </p>
                <VariableBank onInsert={handleInsertVariable} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="variables" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold mb-3">📌 Variáveis Disponíveis</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Todas as variáveis são preenchidas automaticamente com dados reais do banco de dados e dos Data Stores do Make.
                  Clique em qualquer variável para copiá-la.
                </p>
                <VariableBank onInsert={handleInsertVariable} />
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-3">🧮 Operações Matemáticas</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Use <code className="bg-muted px-1 rounded font-mono">{"{{calc: expressão}}"}</code> para cálculos entre variáveis.
                  </p>
                  <div className="space-y-2">
                    {[
                      { expr: "{{calc: vendas / propostas * 100}}", desc: "Taxa de conversão (%)" },
                      { expr: "{{calc: faturamento_num / vendas_num}}", desc: "Ticket médio" },
                      { expr: "{{calc: faturamento_num - investimento_num}}", desc: "Lucro bruto" },
                      { expr: "{{calc: investimento_num / vendas_num}}", desc: "CAC dinâmico" },
                      { expr: "{{calc: faturamento_num / investimento_num}}", desc: "ROAS dinâmico" },
                      { expr: "{{calc: leads_qualificados_num / leads_gerados_num * 100}}", desc: "Taxa qualificação (%)" },
                    ].map((ex) => (
                      <button
                        key={ex.expr}
                        onClick={() => handleInsertVariable(ex.expr)}
                        className="w-full text-left p-2 rounded border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                      >
                        <code className="text-[10px] font-mono text-primary block">{ex.expr}</code>
                        <span className="text-[10px] text-muted-foreground">{ex.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <h4 className="text-xs font-semibold mb-2">💡 Variáveis numéricas para cálculo</h4>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Para cálculos, use as variáveis com sufixo <code className="font-mono">_num</code> (valores numéricos puros):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {[
                      "vendas_num", "propostas_num", "leads_gerados_num", "leads_qualificados_num",
                      "faturamento_num", "investimento_num", "cliques_num", "impressoes_num",
                      "ga4_sessoes_num", "ga4_conversoes_num", "ga4_usuarios_num",
                    ].map(v => (
                      <Badge key={v} variant="outline" className="text-[9px] font-mono cursor-pointer hover:bg-primary/10"
                        onClick={() => handleInsertVariable(v)}
                      >
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <ScrollArea className="h-[450px]">
              <div className="rounded-xl bg-[#0b141a] border border-border/30 p-4">
                <div className="bg-[#005c4b] rounded-lg p-3 max-w-[90%] ml-auto">
                  <pre className="text-xs text-white/90 whitespace-pre-wrap font-sans leading-relaxed">
                    {form.conteudo || "Sem conteúdo para preview"}
                  </pre>
                  <div className="text-right mt-1">
                    <span className="text-[9px] text-white/50">07:00 ✓✓</span>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!form.titulo.trim() || !form.conteudo.trim() || isSaving}>
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
