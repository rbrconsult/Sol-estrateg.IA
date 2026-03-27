import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const MODULE_DEFINITIONS = [
  // Pré-venda
  { key: 'conferencia', label: 'Dashboard SOL', description: 'Painel SOL SDR', path: '/conferencia' },
  { key: 'leads', label: 'Leads', description: 'Captação & Robô', path: '/leads' },
  { key: 'robo-sol', label: 'Robô SOL', description: 'IA de Qualificação', path: '/robo-sol' },
  { key: 'robo-fup-frio', label: 'FUP Frio', description: 'Follow-up Automático', path: '/robo-fup-frio' },
  // Comercial
  { key: 'pipeline', label: 'Pipeline', description: 'Kanban Visual', path: '/pipeline' },
  { key: 'painel-comercial', label: 'Painel Comercial', description: 'Visão Comercial', path: '/painel-comercial' },
  { key: 'forecast', label: 'Forecast', description: 'Previsão de Receita', path: '/forecast' },
  { key: 'vendedores', label: 'Vendedores', description: 'Performance', path: '/vendedores' },
  { key: 'comissoes', label: 'Comissões', description: 'Gestão de Comissões', path: '/comissoes' },
  // Inteligência
  { key: 'bi', label: 'BI', description: 'Centro de Inteligência', path: '/bi' },
  { key: 'followup', label: 'Analista Follow-up', description: 'Análise de Cadência', path: '/followup' },
  { key: 'jornada-lead', label: 'Jornada Lead', description: 'Timeline do Lead', path: '/jornada-lead' },
  { key: 'sla-monitor', label: 'Monitor de SLA', description: 'Tempo de Resposta', path: '/sla' },
  { key: 'ads-performance', label: 'Ads Performance', description: 'Meta & Google Ads', path: '/ads-performance' },
  { key: 'midia-receita', label: 'Mídia × Receita', description: 'ROI por Canal', path: '/midia' },
  // Insights
  { key: 'reports', label: 'Reports', description: 'Relatórios Estratégicos', path: '/reports' },
  // Operacional
  { key: 'chamados', label: 'Chamados', description: 'Suporte & SLA', path: '/chamados' },
  { key: 'monitoramento', label: 'Monitor', description: 'Status do Sistema', path: '/operacoes' },
  { key: 'reprocessamento', label: 'Reprocessar', description: 'Reprocessar Dados', path: '/reprocessamento' },
  { key: 'qualificacao', label: 'Qualificação', description: 'Qualificação Manual', path: '/qualificacao' },
  { key: 'sanitizacao', label: 'Sanitização', description: 'Limpeza de Dados', path: '/sanitizacao' },
  { key: 'ajuda', label: 'Ajuda', description: 'Central de Ajuda', path: '/ajuda' },
  // Admin
  { key: 'time-comercial', label: 'Time Comercial', description: 'Gestão do Time', path: '/admin' },
  { key: 'admin', label: 'Admin', description: 'Painel Administrativo', path: '/admin' },
] as const;

export type ModuleKey = typeof MODULE_DEFINITIONS[number]['key'];

export function useModulePermissions() {
  const { user, userRole } = useAuth();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['module-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return {};
      const { data, error } = await supabase
        .from('user_module_permissions' as any)
        .select('module_key, enabled')
        .eq('user_id', user.id);
      if (error) throw error;
      const map: Record<string, boolean> = {};
      (data as any[])?.forEach((row: any) => {
        map[row.module_key] = row.enabled;
      });
      return map;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30, // 30s — garante que mudanças reflitam rápido
  });

  const hasAccess = (moduleKey: string): boolean => {
    // If no permissions set for this module, default to true (all access)
    if (!permissions || permissions[moduleKey] === undefined) return true;
    return permissions[moduleKey];
  };

  return { permissions, isLoading, hasAccess };
}
