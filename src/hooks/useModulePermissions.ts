import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const MODULE_DEFINITIONS = [
  { key: 'conferencia', label: 'Sol Estrateg.IA', description: 'Painel SOL SDR', path: '/' },
  { key: 'leads', label: 'Leads', description: 'Captação & Robô', path: '/leads' },
  { key: 'dashboard', label: 'Dashboard', description: 'Painel Executivo', path: '/dashboard' },
  { key: 'pipeline', label: 'Pipeline', description: 'Kanban Visual', path: '/pipeline' },
  { key: 'forecast', label: 'Forecast', description: 'Previsão de Receita', path: '/forecast' },
  { key: 'atividades', label: 'Atividades', description: 'Follow-ups', path: '/atividades' },
  { key: 'vendedores', label: 'Vendedores', description: 'Performance', path: '/vendedores' },
  { key: 'perdas', label: 'Perdas', description: 'Análise de Perdas', path: '/perdas' },
  { key: 'origens', label: 'Origens', description: 'Origem dos Leads', path: '/origens' },
  { key: 'chamados', label: 'Chamados', description: 'Suporte & SLA', path: '/chamados' },
  { key: 'monitoramento', label: 'Monitoramento', description: 'Status do Sistema', path: '/monitoramento' },
  { key: 'make-errors', label: 'Erros Make', description: 'Monitor Automações', path: '/make-errors' },
  { key: 'ajuda', label: 'Ajuda', description: 'Central de Ajuda', path: '/ajuda' },
  { key: 'bi', label: 'BI', description: 'Centro de Inteligência', path: '/bi' },
  { key: 'insights', label: 'Insights', description: 'Relatórios Automatizados', path: '/insights' },
  { key: 'reports', label: 'Reports', description: 'Relatórios Estratégicos', path: '/reports' },
  { key: 'time-comercial', label: 'Time Comercial', description: 'Gestão do Time', path: '/admin' },
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
    staleTime: 1000 * 60 * 5,
  });

  const hasAccess = (moduleKey: string): boolean => {
    // Super admins always have full access
    if (userRole === 'super_admin') return true;
    // If no permissions set for this module, default to true (all access)
    if (!permissions || permissions[moduleKey] === undefined) return true;
    return permissions[moduleKey];
  };

  return { permissions, isLoading, hasAccess };
}
