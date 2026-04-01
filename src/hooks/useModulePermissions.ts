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
  // Removed: reprocessamento, qualificacao, ajuda (dead pages)
  // Admin
  { key: 'time-comercial', label: 'Time Comercial', description: 'Gestão do Time', path: '/admin' },
  { key: 'admin-pessoas', label: 'Gestão de Pessoas', description: 'Criar e gerir usuários', path: '/admin' },
  { key: 'admin', label: 'Admin', description: 'Painel Administrativo', path: '/admin' },
  // Admin — Sub-módulos
  { key: 'admin-filiais', label: 'Filiais', description: 'Gestão de Organizações', path: '/admin' },
  { key: 'admin-usuarios', label: 'Usuários', description: 'CRUD de Usuários', path: '/admin' },
  { key: 'admin-modulos', label: 'Módulos', description: 'Permissões por Módulo', path: '/admin' },
  { key: 'admin-seguranca', label: 'Segurança & Logs', description: 'Auditoria e Acessos', path: '/admin' },
  { key: 'admin-sessoes', label: 'Sessões Ativas', description: 'Controle de Sessões', path: '/admin' },
  { key: 'admin-whatsapp', label: 'WhatsApp Config', description: 'Configurações WhatsApp', path: '/admin' },
  { key: 'admin-skills', label: 'Skills / Edges', description: 'Edge Functions & DS', path: '/admin' },
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
