import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, Pencil, Trash2, Clock, Users, Send, Phone } from "lucide-react";
import { useReportTemplates, type ReportTemplate } from "@/hooks/useReportTemplates";
import { ReportEditorDialog } from "@/components/reports/ReportEditorDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import { toast } from "sonner";

export function SkillReportsPanel() {
  const { templates, isLoading, upsertTemplate, deleteTemplate, toggleActive, generateReport, sendNow } = useReportTemplates();
  const [editorOpen, setEditorOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const selected = templates.find(t => t.id === selectedId) || templates[0] || null;

  const handleSendNow = async (tmpl: ReportTemplate) => {
    // Centralizado: tudo sai pelo RBR
    const RBR_CENTRAL = "5511974426112";
    const phoneSet = new Set<string>();
    phoneSet.add(RBR_CENTRAL);

    // Adiciona destinatário do template se diferente do central
    if (tmpl.destinatario_telefone) {
      const clean = tmpl.destinatario_telefone.replace(/\D/g, '');
      if (clean.length >= 10) phoneSet.add(clean);
    }

    const phones = [...phoneSet];
    if (!phones.length) { toast.error("Nenhum telefone válido."); return; }

    setIsSending(true);
    try {
      toast.info("Gerando relatório com dados reais e IA...");
      const filledContent = await generateReport.mutateAsync(tmpl);
      toast.info(`Enviando para ${phones.length} número(s)...`);
      await sendNow.mutateAsync({ phones, message: filledContent });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Templates de Relatório</p>
        <Button size="sm" variant="outline" onClick={() => { setEditingTemplate(null); setEditorOpen(true); }} className="gap-1 text-xs">
          <Plus className="h-3 w-3" /> Novo
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <FileText className="h-6 w-6 mx-auto mb-2 opacity-50" />
          Nenhum template criado
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map(tmpl => (
            <Card key={tmpl.id} className={`border transition-colors cursor-pointer ${selected?.id === tmpl.id ? "border-primary/40 bg-primary/5" : "border-border/40 hover:border-border"}`}
              onClick={() => setSelectedId(tmpl.id)}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{tmpl.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{tmpl.titulo}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" /> {tmpl.periodicidade}
                        {tmpl.destinatario_telefone && <><Phone className="h-2.5 w-2.5 ml-1" /> {tmpl.destinatario_telefone}</>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Switch
                      checked={tmpl.ativo}
                      onCheckedChange={(ativo) => { toggleActive.mutate({ id: tmpl.id, ativo }); }}
                      onClick={e => e.stopPropagation()}
                    />
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={e => { e.stopPropagation(); setEditingTemplate(tmpl); setEditorOpen(true); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                      onClick={e => { e.stopPropagation(); handleSendNow(tmpl); }} disabled={isSending}>
                      <Send className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={e => { e.stopPropagation(); setDeleteId(tmpl.id); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview selected */}
      {selected && selectedId && (
        <Card className="border-border/40">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs">Preview: {selected.titulo}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <ScrollArea className="h-[200px]">
              <div className="rounded-lg bg-[#0b141a] border border-border/30 p-3">
                <div className="bg-[#005c4b] rounded-lg p-2.5 max-w-[95%] ml-auto">
                  <pre className="text-[10px] text-white/90 whitespace-pre-wrap font-sans leading-relaxed">
                    {selected.conteudo}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <ReportEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editingTemplate}
        onSave={(data) => upsertTemplate.mutate(data as any, { onSuccess: () => setEditorOpen(false) })}
        isSaving={upsertTemplate.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) deleteTemplate.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
