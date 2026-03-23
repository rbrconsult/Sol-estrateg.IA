import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Eye, Save, Phone } from "lucide-react";
import type { ReportTemplate } from "@/hooks/useReportTemplates";

const ICONS = ["☀️", "📊", "🤖", "📣", "📈", "🎯", "💰", "🔔", "📋", "⚡"];

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
  });
  const [tab, setTab] = useState("editor");

  const parsed = useMemo(() => parsePeriodicidade(form.periodicidade), [form.periodicidade]);

  const updatePeriod = (field: "freq" | "dia" | "horario", value: string) => {
    const next = { ...parsed, [field]: value };
    // Set defaults when switching frequency
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

  const variables = form.conteudo.match(/\{\{[a-z_]+\}\}/g) || [];
  const uniqueVars = [...new Set(variables)];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{template ? "Editar Template" : "Novo Template"}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 min-h-0">
          <TabsList className="grid grid-cols-2 w-full max-w-xs">
            <TabsTrigger value="editor">Configurar</TabsTrigger>
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
                <Input value={form.destinatario} onChange={(e) => setForm(f => ({ ...f, destinatario: e.target.value }))} placeholder="Ex: Diretoria" />
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
                <p className="text-[10px] text-muted-foreground">Número WhatsApp com DDD (usado no envio)</p>
              </div>
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Conteúdo do Template</Label>
                <p className="text-[10px] text-muted-foreground">Use {"{{variavel}}"} para dados dinâmicos</p>
              </div>
              <Textarea
                value={form.conteudo}
                onChange={(e) => setForm(f => ({ ...f, conteudo: e.target.value }))}
                placeholder="Escreva o template da mensagem..."
                className="min-h-[220px] font-mono text-xs"
              />
            </div>

            {uniqueVars.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Variáveis detectadas ({uniqueVars.length})</Label>
                <div className="flex flex-wrap gap-1.5">
                  {uniqueVars.map((v) => (
                    <Badge key={v} variant="secondary" className="text-xs font-mono">{v}</Badge>
                  ))}
                </div>
              </div>
            )}
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
