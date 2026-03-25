import { useState, useEffect, useMemo, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Save, Phone, Database, X, Settings2 } from "lucide-react";
import { VariableBank } from "./VariableBank";
import type { ReportTemplate } from "@/hooks/useReportTemplates";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
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
  const [showPreview, setShowPreview] = useState(false);
  const [showConfig, setShowConfig] = useState(true);
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
      setShowConfig(false);
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
      setShowConfig(true);
    }
    setShowPreview(false);
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95vh] p-0 flex flex-col rounded-t-xl">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setForm(f => {
                const idx = ICONS.indexOf(f.icon);
                return { ...f, icon: ICONS[(idx + 1) % ICONS.length] };
              })}
              className="text-2xl hover:scale-110 transition-transform cursor-pointer"
              title="Clique para trocar ícone"
            >
              {form.icon}
            </button>
            <Input
              value={form.titulo}
              onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Nome do relatório..."
              className="text-lg font-bold border-none shadow-none bg-transparent px-0 h-auto focus-visible:ring-0 max-w-[400px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfig(v => !v)}
              className={`gap-1.5 text-xs ${showConfig ? 'text-primary' : ''}`}
            >
              <Settings2 className="h-3.5 w-3.5" />
              Config
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(v => !v)}
              className={`gap-1.5 text-xs ${showPreview ? 'text-primary' : ''}`}
            >
              {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              Preview
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button onClick={handleSave} disabled={!form.titulo.trim() || !form.conteudo.trim() || isSaving} size="sm" className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>

        {/* Config panel (collapsible) */}
        {showConfig && (
          <div className="px-4 py-3 border-b bg-muted/10 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px]">Destinatário</Label>
                <Input
                  value={form.destinatario}
                  onChange={(e) => setForm(f => ({ ...f, destinatario: e.target.value }))}
                  placeholder="Nome/cargo"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Telefone
                </Label>
                <Input
                  value={form.destinatario_telefone}
                  onChange={(e) => setForm(f => ({ ...f, destinatario_telefone: e.target.value }))}
                  placeholder="5511999999999"
                  type="tel"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Frequência</Label>
                <Select value={parsed.freq} onValueChange={(v) => updatePeriod("freq", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCIAS.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(parsed.freq === "Semanal" || parsed.freq === "Quinzenal") && (
                <div className="space-y-1">
                  <Label className="text-[11px]">Dia</Label>
                  <Select value={parsed.dia} onValueChange={(v) => updatePeriod("dia", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIAS_SEMANA.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {parsed.freq === "Mensal" && (
                <div className="space-y-1">
                  <Label className="text-[11px]">Dia do Mês</Label>
                  <Select value={parsed.dia} onValueChange={(v) => updatePeriod("dia", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIAS_MES.map((d) => (
                        <SelectItem key={d} value={String(d)}>Dia {d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-[11px]">Horário</Label>
                <Select value={parsed.horario} onValueChange={(v) => updatePeriod("horario", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HORARIOS.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Canal</Label>
                <Select value={form.canal} onValueChange={(v) => setForm(f => ({ ...f, canal: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Slack">Slack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[11px] text-muted-foreground font-medium">Enviar para:</span>
              {DESTINATARIO_ROLES.map((r) => (
                <label key={r.value} className="flex items-center gap-1.5 cursor-pointer">
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
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-xs">{r.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Main content area: editor + variables + optional preview */}
        <div className="flex-1 min-h-0 flex">
          {/* Variable bank sidebar */}
          <div className="w-[260px] border-r bg-muted/20 flex flex-col min-h-0 shrink-0">
            <div className="px-3 py-2 border-b">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-primary" />
                Banco de Variáveis
              </p>
            </div>
            <div className="flex-1 min-h-0 p-2">
              <VariableBank onInsert={handleInsertVariable} />
            </div>
          </div>

          {/* Editor area */}
          <div className="flex-1 min-h-0 flex flex-col">
            {/* Detected variables bar */}
            {uniqueVars.length > 0 && (
              <div className="px-4 py-2 border-b bg-muted/10 flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  {dataVars.length} variáveis
                </span>
                {calcVars.length > 0 && (
                  <Badge variant="outline" className="text-[9px] gap-1">
                    🧮 {calcVars.length} cálculo(s)
                  </Badge>
                )}
                <Separator orientation="vertical" className="h-3" />
                <div className="flex flex-wrap gap-1">
                  {dataVars.slice(0, 8).map((v) => (
                    <Badge key={v} variant="secondary" className="text-[9px] font-mono">{v}</Badge>
                  ))}
                  {dataVars.length > 8 && (
                    <Badge variant="secondary" className="text-[9px]">+{dataVars.length - 8}</Badge>
                  )}
                </div>
              </div>
            )}

            <div className="flex-1 min-h-0 flex">
              {/* Textarea */}
              <div className="flex-1 min-h-0 p-0">
                <Textarea
                  ref={textareaRef}
                  value={form.conteudo}
                  onChange={(e) => setForm(f => ({ ...f, conteudo: e.target.value }))}
                  placeholder="Escreva o template da mensagem aqui...&#10;&#10;Use {{variável}} para inserir dados dinâmicos.&#10;Clique nas variáveis à esquerda para inseri-las."
                  className="h-full w-full resize-none rounded-none border-0 font-mono text-xs leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 p-4"
                />
              </div>

              {/* Live preview panel */}
              {showPreview && (
                <div className="w-[380px] border-l bg-muted/10 flex flex-col min-h-0 shrink-0">
                  <div className="px-3 py-2 border-b flex items-center justify-between">
                    <p className="text-xs font-semibold flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-primary" />
                      Preview WhatsApp
                    </p>
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px]">
                      Com variáveis
                    </Badge>
                  </div>
                  <ScrollArea className="flex-1 min-h-0 p-3">
                    <div className="rounded-xl bg-[#0b141a] border border-border/30 p-3">
                      <div className="bg-[#005c4b] rounded-lg p-3 max-w-[95%] ml-auto">
                        <pre className="text-[11px] text-white/90 whitespace-pre-wrap font-sans leading-relaxed">
                          {form.conteudo || "Sem conteúdo para preview"}
                        </pre>
                        <div className="text-right mt-1">
                          <span className="text-[9px] text-white/50">07:00 ✓✓</span>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
