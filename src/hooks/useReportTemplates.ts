import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ReportTemplate {
  id: string;
  titulo: string;
  icon: string;
  destinatario: string;
  periodicidade: string;
  canal: string;
  conteudo: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export function useReportTemplates() {
  const queryClient = useQueryClient();

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

  return { templates, isLoading, upsertTemplate, deleteTemplate, toggleActive };
}
