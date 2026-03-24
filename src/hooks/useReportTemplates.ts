import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgFilter } from '@/contexts/OrgFilterContext';
import { toast } from 'sonner';

export interface ReportTemplate {
  id: string;
  organization_id?: string | null;
  titulo: string;
  icon: string;
  destinatario: string;
  destinatario_telefone: string;
  copia_telefone: string;
  periodicidade: string;
  canal: string;
  conteudo: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
  destinatario_roles?: string[];
}

export function useReportTemplates() {
  const queryClient = useQueryClient();
  const { selectedOrgId } = useOrgFilter();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['report-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_templates' as any)
        .select('*')
        .order('ordem');
      if (error) throw error;
      return (data as any[]) as ReportTemplate[];
    },
  });

  const upsertTemplate = useMutation({
    mutationFn: async (template: Partial<ReportTemplate> & { titulo: string; conteudo: string }) => {
      const { data, error } = await supabase
        .from('report_templates' as any)
        .upsert(template as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      toast.success('Template salvo com sucesso');
    },
    onError: () => toast.error('Erro ao salvar template'),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('report_templates' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      toast.success('Template excluído');
    },
    onError: () => toast.error('Erro ao excluir template'),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('report_templates' as any)
        .update({ ativo } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
    },
  });

  const generateReport = useMutation({
    mutationFn: async (template: ReportTemplate) => {
      // Usa apenas o filtro global ativo; se estiver em Global, envia undefined
      // para o backend decidir (super_admin = consolidado, demais = própria filial)
      const organizationId = selectedOrgId ?? undefined;
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { templateContent: template.conteudo, templateTitle: template.titulo, organizationId },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Falha ao gerar relatório');
      return data.content as string;
    },
  });

  const sendNow = useMutation({
    mutationFn: async ({ phones, message }: { phones: string[]; message: string }) => {
      const results = [];
      for (const phone of phones) {
        if (!phone.trim()) continue;
        const { data, error } = await supabase.functions.invoke('send-whatsapp-alert', {
          body: { phone: phone.trim(), message },
        });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Falha no envio');
        results.push(data);
      }
      return results;
    },
    onSuccess: () => toast.success('Relatório enviado via WhatsApp!'),
    onError: (err: Error) => toast.error(`Erro ao enviar: ${err.message}`),
  });

  return { templates, isLoading, upsertTemplate, deleteTemplate, toggleActive, generateReport, sendNow };
}
