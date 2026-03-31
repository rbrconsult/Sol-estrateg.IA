import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, MessageSquare, Database, Clock, Bot, Send, Shield, ArrowRight, Webhook } from 'lucide-react';

interface EdgeItem {
  name: string;
  description: string;
  category: 'whatsapp' | 'data' | 'ai' | 'auth' | 'cron' | 'webhook';
  status: 'active' | 'scaffold' | 'active-cron';
  dependencies: string[];
  notes?: string;
}

const EDGE_FUNCTIONS: EdgeItem[] = [
  // WhatsApp
  {
    name: 'notify-ticket-whatsapp',
    description: 'Envia notificações de chamados (novo, resolvido, reaberto, devolvido, encaminhado) via WhatsApp',
    category: 'whatsapp',
    status: 'active',
    dependencies: ['Krolic API (app_settings)', 'profiles.phone', 'central_whatsapp_number'],
    notes: 'Usa getClaims (⚠️ pode falhar — migrar para getUser). Lê config de app_settings: krolic_api_url, krolic_api_token, krolic_instance_name',
  },
  {
    name: 'send-whatsapp-alert',
    description: 'Envia mensagens/alertas via WhatsApp usando Krolic API. Usado por Reports e alertas de erro.',
    category: 'whatsapp',
    status: 'active',
    dependencies: ['Krolic API'],
    notes: 'Envia via POST Krolic com forceSend. CC fixo + Super Admin automático.',
  },
  {
    name: 'whatsapp-proxy',
    description: 'Proxy que recebe webhooks da Krolic API e encaminha para whatsapp-webhook. Sempre retorna 200.',
    category: 'webhook',
    status: 'active',
    dependencies: ['whatsapp-webhook (internal)'],
    notes: 'Sem auth. Resiliência máxima — nunca falha para evitar redelivery da Krolic.',
  },
  {
    name: 'whatsapp-webhook',
    description: 'Processa MESSAGES_UPSERT da Krolic: vincula mensagem ao chamado aberto pelo telefone e atualiza status.',
    category: 'webhook',
    status: 'active',
    dependencies: ['support_tickets', 'ticket_messages', 'ticket_status_history'],
    notes: 'Sem auth externo (chamado pelo proxy). Ignora fromMe e status@broadcast.',
  },
  // Data / Make
  {
    name: 'fetch-make-data',
    description: 'Busca dados do Data Store sol_leads (DS 87418) com filtro multi-tenant por org.',
    category: 'data',
    status: 'active',
    dependencies: ['MAKE_API_KEY', 'MAKE_DATASTORE_ID', 'organization_configs', 'time_comercial'],
  },
  {
    name: 'fetch-make-comercial',
    description: 'Busca dados do Data Store sol_qualificacao (DS 87715) com filtro por responsáveis da org.',
    category: 'data',
    status: 'active',
    dependencies: ['MAKE_API_KEY', 'MAKE_COMERCIAL_DATASTORE_ID', 'organization_configs', 'time_comercial'],
  },
  {
    name: 'fetch-make-errors',
    description: 'Busca logs de execução dos cenários Make, sincroniza na tabela make_errors e dispara alertas WhatsApp escalonados (N1/N2/N3) para novos erros.',
    category: 'data',
    status: 'active',
    dependencies: ['MAKE_API_KEY', 'MAKE_TEAM_ID', 'make_errors', 'app_settings (krolic_api_token, central_whatsapp_number)', 'Krolic API'],
    notes: 'Cron pg_cron a cada 5min (sync-make-errors-5min). N1: erros/avisos sem parada (resumo ≤5 individual, >5 agregado). N2: fluxo parado (Scenario ID, Execution ID, módulo, erro, tentativas). N3: fluxos críticos parados (Captura Lead, SDR, Qualif, Sync DS) — alerta urgente agregado. Alertas enviados para central_whatsapp_number (app_settings). Rate limit 1s entre mensagens.',
  },
  {
    name: 'fetch-make-heartbeat',
    description: 'Busca heartbeat (últimas execuções) de todos os cenários monitorados.',
    category: 'data',
    status: 'active',
    dependencies: ['MAKE_API_KEY', 'make_heartbeat', 'app_settings.monitored_scenario_ids'],
  },
  {
    name: 'make-action',
    description: 'Executa ações no Make (start/stop cenários, buscar detalhes de execução).',
    category: 'data',
    status: 'active',
    dependencies: ['MAKE_API_KEY'],
  },
  {
    name: 'sync-time-comercial',
    description: 'Sincroniza time_comercial do Supabase → Data Store 85466 no Make.',
    category: 'data',
    status: 'active',
    dependencies: ['MAKE_API_KEY', 'app_settings.make_ds_time_comercial', 'time_comercial'],
    notes: 'Chave composta: {franquia_id}_{krolik_id}',
  },
  // Cron
  {
    name: 'cron-sync',
    description: 'Sincronização multi-tenant: busca DS do Make → upsert em sol_leads_sync + sol_metricas.',
    category: 'cron',
    status: 'active-cron',
    dependencies: ['MAKE_API_KEY', 'organizations', 'organization_configs', 'sol_leads_sync', 'sol_equipe_sync'],
    notes: 'Executado via pg_cron. Auth por JWT decode manual (role anon/authenticated).',
  },
  // AI
  {
    name: 'executive-summary',
    description: 'Gera resumo executivo RAIO-X do pipeline usando Lovable AI (Gemini).',
    category: 'ai',
    status: 'active',
    dependencies: ['LOVABLE_API_KEY'],
  },
  {
    name: 'generate-report',
    description: 'Gera relatórios com dados reais (DS v2: sol_leads + sol_qualificacao + sol_metricas + sol_equipe) + insights via Lovable AI.',
    category: 'ai',
    status: 'active',
    dependencies: ['LOVABLE_API_KEY', 'MAKE_API_KEY', 'organization_configs (sol_leads, sol_qualificacao, sol_config, sol_equipe, sol_metricas)', 'time_comercial'],
    notes: 'Busca DS v2 em paralelo: sol_leads (87418), sol_qualificacao (87715), sol_config (87419), sol_equipe (87420), sol_metricas (87422). Calcula KPIs de investimento, CPL, CAC, ROI e produção de robôs. Filtra por org/franquia_id.',
  },
  // Auth
  {
    name: 'track-session',
    description: 'Rastreia sessões de login/logout com hash SHA-256 e IP.',
    category: 'auth',
    status: 'active',
    dependencies: ['user_sessions'],
  },
  {
    name: 'turnstile-verify',
    description: 'Verifica token Cloudflare Turnstile no login anti-bot.',
    category: 'auth',
    status: 'active',
    dependencies: ['TURNSTILE_SECRET_KEY'],
  },
  {
    name: 'manage-users',
    description: 'CRUD de usuários (criar, deletar, reset senha). Restrito a super_admin.',
    category: 'auth',
    status: 'active',
    dependencies: ['user_roles', 'profiles', 'organization_members', 'access_logs'],
  },
  {
    name: 'impersonate-user',
    description: 'Permite super_admin assumir sessão de outro usuário.',
    category: 'auth',
    status: 'active',
    dependencies: ['user_roles', 'access_logs'],
  },
  {
    name: 'auth-email-hook',
    description: 'Hook de email customizado para templates de autenticação (signup, recovery, etc).',
    category: 'auth',
    status: 'active',
    dependencies: ['Email templates (_shared/)'],
  },
];

const categoryMeta: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  whatsapp: { label: 'WhatsApp', icon: <MessageSquare className="h-4 w-4" />, color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  data: { label: 'Dados / Make', icon: <Database className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  ai: { label: 'AI', icon: <Bot className="h-4 w-4" />, color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  auth: { label: 'Auth / Segurança', icon: <Shield className="h-4 w-4" />, color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  cron: { label: 'Cron Jobs', icon: <Clock className="h-4 w-4" />, color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  webhook: { label: 'Webhooks', icon: <Webhook className="h-4 w-4" />, color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
};

const statusBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  active: { label: '✅ Ativo', variant: 'default' },
  scaffold: { label: '🔧 Scaffold', variant: 'secondary' },
  'active-cron': { label: '⏰ Cron Ativo', variant: 'outline' },
};

export default function SkillsTab() {
  const categories = ['whatsapp', 'webhook', 'data', 'cron', 'ai', 'auth'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Inventário de Edge Functions
          </CardTitle>
          <CardDescription>
            Todas as {EDGE_FUNCTIONS.length} edge functions do projeto, organizadas por categoria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {categories.map(cat => {
              const meta = categoryMeta[cat];
              const count = EDGE_FUNCTIONS.filter(e => e.category === cat).length;
              return (
                <div key={cat} className={`flex items-center gap-2 rounded-lg border p-3 ${meta.color}`}>
                  {meta.icon}
                  <div>
                    <p className="text-xs font-medium">{meta.label}</p>
                    <p className="text-lg font-bold">{count}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* By category */}
          {categories.map(cat => {
            const meta = categoryMeta[cat];
            const items = EDGE_FUNCTIONS.filter(e => e.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="mb-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
                  {meta.icon} {meta.label}
                </h3>
                <div className="space-y-2">
                  {items.map(edge => {
                    const st = statusBadge[edge.status];
                    return (
                      <div key={edge.name} className="rounded-lg border border-border p-4 hover:bg-secondary/30 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <code className="text-sm font-mono font-semibold">{edge.name}</code>
                              <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{edge.description}</p>
                            {edge.notes && (
                              <p className="text-xs text-muted-foreground/70 italic mt-1">⚙️ {edge.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {edge.dependencies.map(dep => (
                            <Badge key={dep} variant="outline" className="text-xs font-mono">
                              {dep}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

    </div>
  );
}
