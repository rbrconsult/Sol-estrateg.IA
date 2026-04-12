import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, Plus, Pencil, Trash2, Clock, Users, Send, Phone } from "lucide-react";
import { useReportTemplates, type ReportTemplate } from "@/hooks/useReportTemplates";
import { ReportEditorDialog } from "@/components/reports/ReportEditorDialog";
import { toast } from "sonner";

export default function Reports() {
  const { templates, isLoading, upsertTemplate, deleteTemplate, toggleActive, generateReport, sendNow } = useReportTemplates();
  const [editorOpen, setEditorOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const selected = templates.find(t => t.id === selectedId) || templates[0] || null;

  const handleEdit = (tmpl: ReportTemplate) => {
    setEditingTemplate(tmpl);
    setEditorOpen(true);
  };

  const handleNew = () => {
    setEditingTemplate(null);
    setEditorOpen(true);
  };

  const handleSave = (data: Partial<ReportTemplate>) => {
    upsertTemplate.mutate(data as any, {
      onSuccess: () => setEditorOpen(false),
    });
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteTemplate.mutate(deleteId, {
        onSuccess: () => {
          setDeleteId(null);
          if (selectedId === deleteId) setSelectedId(null);
        },
      });
    }
  };

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
    if (phones.length === 0) {
      toast.error("Nenhum telefone válido configurado.");
      return;
    }
    setIsSending(true);
    try {
      toast.info("Gerando relatório com dados reais e IA...");
      const filledContent = await generateReport.mutateAsync(tmpl);
      toast.info(`Enviando para ${phones.length} número(s)...`);
      await sendNow.mutateAsync({ phones, message: filledContent });
    } catch (err: any) {
      // errors already handled by mutation callbacks
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Reports Programados
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure e gerencie os templates de relatórios automáticos
          </p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        {/* Sidebar */}
        <div className="space-y-2">
          {templates.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => setSelectedId(tmpl.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                selected?.id === tmpl.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border/50 hover:border-border hover:bg-muted/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg shrink-0">{tmpl.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{tmpl.titulo}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {tmpl.periodicidade}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge
                  variant={tmpl.ativo ? "default" : "secondary"}
                  className={`text-[9px] px-1.5 shrink-0 ${tmpl.ativo ? "bg-green-500/20 text-green-500 border-green-500/30" : ""}`}
                >
                  {tmpl.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </button>
          ))}

          {templates.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum template criado</p>
              <Button variant="link" onClick={handleNew} className="mt-1 text-xs">
                Criar primeiro template
              </Button>
            </div>
          )}
        </div>

        {/* Detail */}
        {selected ? (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-xl">{selected.icon}</span>
                    {selected.titulo}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={selected.ativo}
                      onCheckedChange={(ativo) => toggleActive.mutate({ id: selected.id, ativo })}
                    />
                    <Button variant="outline" size="sm" onClick={() => handleEdit(selected)}>
                      <Pencil className="h-3 w-3 mr-1" /> Editar
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() => handleSendNow(selected)}
                      disabled={isSending}
                    >
                      <Send className="h-3 w-3" />
                      {isSending ? "Gerando..." : "Enviar Agora"}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(selected.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Destinatário</p>
                    <p className="text-sm text-foreground flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      {selected.destinatario || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Telefone</p>
                    <p className="text-sm text-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {selected.destinatario_telefone || <span className="text-amber-500 text-xs">Não configurado</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Periodicidade</p>
                    <p className="text-sm text-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {selected.periodicidade}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Canal</p>
                    <Badge variant="outline" className="text-xs">{selected.canal}</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Cargos</p>
                    <div className="flex flex-wrap gap-1">
                      {((selected as any).destinatario_roles || []).length > 0
                        ? ((selected as any).destinatario_roles as string[]).map((r: string) => (
                            <Badge key={r} variant="secondary" className="text-[10px] capitalize">{r}</Badge>
                          ))
                        : <span className="text-xs text-muted-foreground">Manual</span>
                      }
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Envio</p>
                    <Badge variant="secondary" className="text-xs flex items-center gap-1 w-fit">
                      <Send className="h-3 w-3" /> Make (Schedule)
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Preview da Mensagem</CardTitle>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                    Com variáveis
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="rounded-xl bg-[#0b141a] border border-border/30 p-4">
                    <div className="bg-[#005c4b] rounded-lg p-3 max-w-[90%] ml-auto">
                      <pre className="text-xs text-white/90 whitespace-pre-wrap font-sans leading-relaxed">
                        {selected.conteudo}
                      </pre>
                      <div className="text-right mt-1">
                        <span className="text-[9px] text-white/50">07:00 ✓✓</span>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="flex items-center justify-center min-h-[400px]">
            <div className="text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Selecione um template para visualizar</p>
            </div>
          </Card>
        )}
      </div>

      <ReportEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editingTemplate}
        onSave={handleSave}
        isSaving={upsertTemplate.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O template será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
