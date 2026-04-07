import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useModulePermissions } from '@/hooks/useModulePermissions';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Users, Activity, Shield, Ban, RefreshCw, Loader2, Pencil, Trash2, UserPlus, Key, Eye, Settings, Save, Building2, LayoutGrid, Fingerprint, Zap, Globe, Lock, Server, Bot, ChevronRight } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import OrganizationsTab from '@/components/admin/OrganizationsTab';
import ModulesTab from '@/components/admin/ModulesTab';
import LoginAnalyticsTab from '@/components/admin/LoginAnalyticsTab';
import MonitoredScenariosSettings from '@/components/admin/MonitoredScenariosSettings';
import DiscoveredDataStores from '@/components/admin/DiscoveredDataStores';
import SkillsTab from '@/components/admin/SkillsTab';
import { PessoasTab } from '@/components/admin/PessoasTab';
import { InfrastructureReferenceContent } from '@/components/admin/InfrastructureTab';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: string;
  phone?: string;
}

interface AccessLog {
  id: string;
  user_id: string;
  email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  action: string;
  created_at: string;
}

interface UserSession {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  last_activity: string;
  is_active: boolean;
}

export default function Admin() {
  const { user, userRole, loading: authLoading, startImpersonation } = useAuth();
  const { hasAccess } = useModulePermissions();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // CRUD state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '', role: 'user' as AppRole, organization_id: '00000000-0000-0000-0000-000000000001', phone: '' });
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [impersonateLoading, setImpersonateLoading] = useState<string | null>(null);
  const [impersonateTarget, setImpersonateTarget] = useState<UserWithRole | null>(null);

  // Settings state
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [evolutionKey, setEvolutionKey] = useState('');
  const [evolutionInstance, setEvolutionInstance] = useState('');
  const [centralNumber, setCentralNumber] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const canAccessAdmin = userRole === 'super_admin' || hasAccess('admin') || (userRole === 'diretor' && hasAccess('admin-pessoas'));

  useEffect(() => {
    if (!authLoading && !canAccessAdmin) {
      toast.error('Acesso negado.');
      navigate('/selecao');
    }
  }, [userRole, authLoading, navigate, hasAccess]);

  useEffect(() => {
    if (canAccessAdmin) {
      fetchData();
      fetchSettings();
      fetchOrganizationsList();
    }
  }, [userRole]);

  const fetchOrganizationsList = async () => {
    try {
      const { data, error } = await supabase.from('organizations').select('id, name').order('name');
      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchAccessLogs(), fetchSessions()]);
    setLoading(false);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Dados atualizados');
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase.from('user_roles').select('*');
      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map(profile => ({
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name,
        created_at: profile.created_at,
        phone: profile.phone || '',
        role: roles?.find(r => r.user_id === profile.id)?.role || 'user'
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    }
  };

  const fetchAccessLogs = async () => {
    try {
      const { data, error } = await supabase.from('access_logs').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      setAccessLogs(data || []);
    } catch (error) {
      console.error('Error fetching access logs:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase.from('user_sessions').select('*').order('last_activity', { ascending: false });
      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const invalidateSession = async (sessionId: string, userId: string) => {
    try {
      const { error } = await supabase.from('user_sessions').update({ is_active: false }).eq('id', sessionId);
      if (error) throw error;
      const userEmail = users.find(u => u.id === userId)?.email;
      await supabase.from('access_logs').insert({ user_id: userId, email: userEmail, action: 'session_invalidated', ip_address: 'admin_action' });
      toast.success('Sessão invalidada com sucesso');
      fetchSessions();
    } catch (error) {
      console.error('Error invalidating session:', error);
      toast.error('Erro ao invalidar sessão');
    }
  };

  const invalidateAllUserSessions = async (userId: string) => {
    try {
      const { error } = await supabase.from('user_sessions').update({ is_active: false }).eq('user_id', userId).eq('is_active', true);
      if (error) throw error;
      const userEmail = users.find(u => u.id === userId)?.email;
      await supabase.from('access_logs').insert({ user_id: userId, email: userEmail, action: 'all_sessions_invalidated', ip_address: 'admin_action' });
      toast.success('Todas as sessões do usuário foram invalidadas');
      fetchSessions();
    } catch (error) {
      console.error('Error invalidating sessions:', error);
      toast.error('Erro ao invalidar sessões');
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    setFormLoading(true);
    try {
      const { error: roleError } = await supabase.from('user_roles').update({ role: formData.role }).eq('user_id', selectedUser.id);
      if (roleError) throw roleError;

      const profileUpdates: Record<string, any> = {};
      if (formData.full_name !== selectedUser.full_name) profileUpdates.full_name = formData.full_name;
      if (formData.phone) profileUpdates.phone = formData.phone;
      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase.from('profiles').update(profileUpdates).eq('id', selectedUser.id);
        if (profileError) throw profileError;
      }

      await supabase.from('access_logs').insert({ user_id: selectedUser.id, email: selectedUser.email, action: 'role_updated', ip_address: 'admin_action' });
      toast.success('Usuário atualizado com sucesso!');
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar usuário');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setFormLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-users', { body: { action: 'delete', userId: selectedUser.id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Usuário excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir usuário');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditDialog = (u: UserWithRole) => {
    setSelectedUser(u);
    setFormData({ email: u.email, password: '', full_name: u.full_name || '', role: u.role as AppRole, organization_id: '00000000-0000-0000-0000-000000000001', phone: u.phone || '' });
    setIsEditDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) { toast.error('Nova senha é obrigatória'); return; }
    if (newPassword.length < 6) { toast.error('Senha deve ter no mínimo 6 caracteres'); return; }
    setFormLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-users', { body: { action: 'reset_password', userId: selectedUser.id, password: newPassword } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Senha alterada com sucesso!');
      setIsPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setFormLoading(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';

    try {
      return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const renderSectionFallback = (title: string) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Esta seção foi isolada para evitar a tela branca do painel.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Recarregue a página ou troque de aba para tentar novamente.</p>
      </CardContent>
    </Card>
  );

  const getActionBadge = (action: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      login: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Login' },
      logout: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Logout' },
      session_invalidated: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Sessão Invalidada' },
      all_sessions_invalidated: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Todas Sessões Invalidadas' },
      role_updated: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Role Atualizado' },
      user_created: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Usuário Criado' },
      user_deleted: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Usuário Excluído' },
      password_reset: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Senha Alterada' },
      user_impersonation: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'Impersonação' },
    };
    const m = map[action];
    if (m) return <Badge className={`${m.bg} ${m.text} border-${m.text.replace('text-', '')}/30`}>{m.label}</Badge>;
    return <Badge variant="outline">{action}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      super_admin: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Super Admin' },
      diretor: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Diretor' },
      gerente: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Gerente' },
      closer: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Closer' },
      admin: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Admin' },
    };
    const m = map[role];
    if (m) return <Badge className={`${m.bg} ${m.text}`}>{m.label}</Badge>;
    return <Badge variant="outline">Usuário</Badge>;
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const { data, error } = await supabase.from('app_settings' as any).select('key, value');
      if (error) throw error;
      const settings: Record<string, string> = {};
      (data as any[])?.forEach((s: any) => { settings[s.key] = s.value; });
      setEvolutionKey(settings.krolic_api_token || '');
      setEvolutionInstance(settings.krolic_instance_name || '');
      setCentralNumber(settings.central_whatsapp_number || '');
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      const updates = [
        { key: 'krolic_api_token', value: evolutionKey },
        { key: 'krolic_instance_name', value: evolutionInstance },
        { key: 'central_whatsapp_number', value: centralNumber },
      ];
      for (const u of updates) {
        const { error } = await supabase.from('app_settings' as any).update({ value: u.value, updated_at: new Date().toISOString() }).eq('key', u.key);
        if (error) throw error;
      }
      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + (error.message || ''));
    } finally {
      setSettingsSaving(false);
    }
  };

  const maskApiKey = (key: string) => {
    if (!key || key.length < 8) return key;
    return key.substring(0, 5) + '***' + key.substring(key.length - 4);
  };

  const parseUserAgent = (ua: string | null) => {
    if (!ua || ua === 'unknown') return 'Desconhecido';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return ua.substring(0, 30) + '...';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canAccessAdmin) return null;

  const activeSessions = sessions.filter(s => s.is_active);

  const showConfigGlobalTab =
    userRole === 'super_admin' ||
    hasAccess('admin') ||
    hasAccess('admin-whatsapp') ||
    hasAccess('admin-skills') ||
    hasAccess('admin-filiais');

  // Determine default tab — prioriza filial/equipe para quem opera cadastros no dia a dia
   const getDefaultTab = () => {
    if (hasAccess('admin-filiais')) return 'filiais';
    if (hasAccess('admin-usuarios') || hasAccess('time-comercial') || hasAccess('admin-pessoas')) return 'pessoas';
    if (hasAccess('admin-modulos')) return 'modulos';
    if (userRole === 'super_admin' && (hasAccess('admin-seguranca') || hasAccess('admin-sessoes'))) return 'seguranca';
    if (userRole === 'super_admin' && showConfigGlobalTab) return 'config-global';
    return 'filiais';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/selecao')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Painel de Administração
              </h1>
              <p className="text-sm text-muted-foreground">Scale › SOL › Gestão</p>
            </div>
          </div>
          <Button onClick={refreshData} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Usuários
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{users.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Filiais
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{organizations.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" /> Sessões Ativas
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-500">{activeSessions.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" /> Logs
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{accessLogs.length}</div></CardContent>
          </Card>
        </div>

        {/* Tabs — reordenadas: Filiais → Pessoas → Módulos → Segurança → Config Global */}
        <Tabs defaultValue={getDefaultTab()} className="space-y-4">
          <TabsList className="flex-wrap">
            {hasAccess('admin-filiais') && (
              <TabsTrigger value="filiais" className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Filiais
              </TabsTrigger>
            )}
            {(hasAccess('admin-usuarios') || hasAccess('time-comercial') || hasAccess('admin-pessoas')) && (
              <TabsTrigger value="pessoas" className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Pessoas
              </TabsTrigger>
            )}
            {hasAccess('admin-modulos') && (
              <TabsTrigger value="modulos" className="flex items-center gap-1.5">
                <LayoutGrid className="h-3.5 w-3.5" />
                Módulos
              </TabsTrigger>
            )}
            {userRole === 'super_admin' && (hasAccess('admin-seguranca') || hasAccess('admin-sessoes')) && (
              <TabsTrigger value="seguranca" className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                Segurança
              </TabsTrigger>
            )}
            {userRole === 'super_admin' && showConfigGlobalTab && (
              <TabsTrigger value="config-global" className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                Configurações globais
              </TabsTrigger>
            )}
          </TabsList>

          {/* ═══════════════════════════════════════════ */}
          {/* CONFIG GLOBAL — Krolic, Cenários, DS, Skills */}
          {/* ═══════════════════════════════════════════ */}
          <TabsContent value="config-global" className="space-y-6">
            {showConfigGlobalTab &&
              !hasAccess('admin-whatsapp') &&
              !hasAccess('admin-skills') &&
              userRole !== 'super_admin' && (
                <Card className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Configurações editáveis</CardTitle>
                    <CardDescription>
                      Krolic/WhatsApp, cenários monitorados, data stores e skills aparecem aqui quando seu usuário tiver as permissões
                      correspondentes (ex.: <strong>WhatsApp Config</strong>, <strong>Skills / Edges</strong>) ou perfil super admin.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

            {/* Krolic / WhatsApp — Compact */}
            {hasAccess('admin-whatsapp') && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Krolic API (WhatsApp Bot SOL)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {settingsLoading ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
                      <div className="space-y-1">
                        <Label className="text-xs">Token</Label>
                        <div className="flex gap-1">
                          <Input
                            className="h-8 text-xs"
                            type={showApiKey ? "text" : "password"}
                            value={showApiKey ? evolutionKey : maskApiKey(evolutionKey)}
                            onChange={(e) => { setShowApiKey(true); setEvolutionKey(e.target.value); }}
                            onFocus={() => setShowApiKey(true)}
                            placeholder="Chave da API"
                          />
                          <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowApiKey(!showApiKey)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Instância</Label>
                        <Input className="h-8 text-xs" value={evolutionInstance} onChange={(e) => setEvolutionInstance(e.target.value)} placeholder="Nome" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Central WhatsApp</Label>
                        <div className="flex gap-1">
                          <Input className="h-8 text-xs" value={centralNumber} onChange={(e) => setCentralNumber(e.target.value)} placeholder="5517999999999" />
                          <Button onClick={handleSaveSettings} disabled={settingsSaving} size="sm" className="h-8 gap-1 shrink-0">
                            {settingsSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            Salvar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* SOL v2 — Configuração do Robô */}
            {(userRole === 'super_admin' || userRole === 'diretor') && (
              <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/admin/config')}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    Configuração SOL v2 (Robô IA)
                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>Prompts, templates FUP Frio e variáveis globais do Agent IA</CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Cenários Monitorados */}
            {hasAccess('admin-whatsapp') && <MonitoredScenariosSettings />}

            {/* DataStores Descobertos */}
            {hasAccess('admin-whatsapp') && <DiscoveredDataStores />}

            {/* Skills / Edge Functions */}
            {hasAccess('admin-skills') && <SkillsTab />}

            {userRole === 'super_admin' && (
              <Accordion type="single" collapsible className="rounded-lg border border-border px-4">
                <AccordionItem value="infra-ref" className="border-0">
                  <AccordionTrigger className="text-sm font-medium hover:no-underline py-4">
                    <span className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-muted-foreground" />
                      Arquitetura e referência técnica (somente leitura)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 pt-0">
                    <InfrastructureReferenceContent />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </TabsContent>

          {/* ═══════════════════════════════════════════ */}
          {/* FILIAIS */}
          {/* ═══════════════════════════════════════════ */}
          <TabsContent value="filiais">
            <AppErrorBoundary fallback={renderSectionFallback('Filiais')}>
              <OrganizationsTab users={users.map(u => ({ id: u.id, email: u.email, full_name: u.full_name }))} />
            </AppErrorBoundary>
          </TabsContent>

          {/* ═══════════════════════════════════════════ */}
          {/* PESSOAS — Usuários + Time Comercial */}
          {/* ═══════════════════════════════════════════ */}
          <TabsContent value="pessoas" className="space-y-6">
            <AppErrorBoundary fallback={renderSectionFallback('Pessoas')}>
              <PessoasTab
                users={users}
                organizations={organizations}
                onRefreshUsers={fetchUsers}
                onImpersonate={(u) => setImpersonateTarget(u)}
                onEditUser={(u) => openEditDialog(u)}
                onResetPassword={(u) => { setSelectedUser(u); setNewPassword(''); setIsPasswordDialogOpen(true); }}
                onDeleteUser={(u) => { setIsDeleteDialogOpen(true); setSelectedUser(u); }}
                onInvalidateSessions={invalidateAllUserSessions}
                currentUserId={user?.id || null}
                impersonateLoading={impersonateLoading}
              />
            </AppErrorBoundary>
          </TabsContent>

          {/* ═══════════════════════════════════════════ */}
          {/* SEGURANÇA — Analytics + Logs + Sessões */}
          {/* ═══════════════════════════════════════════ */}
          <TabsContent value="seguranca" className="space-y-6">
            <AppErrorBoundary fallback={renderSectionFallback('Segurança')}>
              {hasAccess('admin-seguranca') && (
                <>
                  <LoginAnalyticsTab accessLogs={accessLogs} sessions={sessions} onInvalidateAllSessions={invalidateAllUserSessions} />

                {/* Logs de Acesso — com busca e filtro */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          Logs de Acesso
                        </CardTitle>
                        <CardDescription className="mt-1">Últimas {accessLogs.length} ações registradas</CardDescription>
                      </div>
                      <Badge variant="secondary">{accessLogs.length} registros</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-border/50 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="font-semibold">Email</TableHead>
                            <TableHead className="font-semibold">Ação</TableHead>
                            <TableHead className="font-semibold">IP</TableHead>
                            <TableHead className="font-semibold">Navegador</TableHead>
                            <TableHead className="font-semibold">Data/Hora</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {accessLogs.slice(0, 50).map((log) => (
                            <TableRow key={log.id} className="hover:bg-muted/20 transition-colors">
                              <TableCell className="font-medium text-sm">{log.email || '-'}</TableCell>
                              <TableCell>{getActionBadge(log.action)}</TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">{log.ip_address || 'N/A'}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{parseUserAgent(log.user_agent)}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{formatDate(log.created_at)}</TableCell>
                            </TableRow>
                          ))}
                          {accessLogs.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                                <Shield className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                <p>Nenhum log de acesso registrado</p>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {accessLogs.length > 50 && (
                      <p className="text-xs text-muted-foreground text-center mt-3">Mostrando 50 de {accessLogs.length} registros</p>
                    )}
                  </CardContent>
                </Card>
                </>
              )}

              {/* Sessões Ativas — redesign */}
              {hasAccess('admin-sessoes') && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Fingerprint className="h-4 w-4 text-primary" />
                          Sessões Ativas
                        </CardTitle>
                        <CardDescription className="mt-1">{activeSessions.length} sessões ativas no momento</CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        {activeSessions.length} online
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {sessions.length === 0 ? (
                      <div className="flex flex-col items-center py-12 text-muted-foreground">
                        <Fingerprint className="h-8 w-8 mb-2 opacity-30" />
                        <p className="text-sm">Nenhuma sessão registrada</p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border/50 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead className="font-semibold">Usuário</TableHead>
                              <TableHead className="font-semibold">IP</TableHead>
                              <TableHead className="font-semibold">Navegador</TableHead>
                              <TableHead className="font-semibold">Última Atividade</TableHead>
                              <TableHead className="font-semibold text-center">Status</TableHead>
                              <TableHead className="text-right font-semibold">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sessions.slice(0, 50).map((s) => {
                              const sessionUser = users.find(u => u.id === s.user_id);
                              return (
                                <TableRow key={s.id} className="hover:bg-muted/20 transition-colors">
                                  <TableCell>
                                    <div>
                                      <div className="font-medium text-sm">{sessionUser?.full_name || sessionUser?.email || s.user_id.slice(0, 8)}</div>
                                      {sessionUser?.email && sessionUser?.full_name && (
                                        <div className="text-xs text-muted-foreground">{sessionUser.email}</div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-mono text-xs text-muted-foreground">{s.ip_address || 'N/A'}</TableCell>
                                  <TableCell className="text-xs text-muted-foreground">{parseUserAgent(s.user_agent)}</TableCell>
                                  <TableCell className="text-xs text-muted-foreground">{formatDate(s.last_activity)}</TableCell>
                                  <TableCell className="text-center">
                                    <Badge className={s.is_active ? 'bg-success/15 text-success border-success/20' : 'bg-muted text-muted-foreground'}>
                                      {s.is_active ? '● Ativa' : 'Inativa'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {s.is_active && (
                                      <Button variant="ghost" size="sm" onClick={() => invalidateSession(s.id, s.user_id)} className="text-destructive text-xs hover:bg-destructive/10">
                                        <Ban className="h-3 w-3 mr-1" /> Invalidar
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </AppErrorBoundary>
          </TabsContent>

          {/* ═══════════════════════════════════════════ */}
          {/* MÓDULOS */}
          {/* ═══════════════════════════════════════════ */}
          <TabsContent value="modulos">
            <AppErrorBoundary fallback={renderSectionFallback('Módulos')}>
              <ModulesTab users={users.map(u => ({ id: u.id, email: u.email, full_name: u.full_name, role: u.role }))} />
            </AppErrorBoundary>
          </TabsContent>

        </Tabs>

        {/* ═══════════════════════════════════════════ */}
        {/* DIALOGS */}
        {/* ═══════════════════════════════════════════ */}




        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>Atualize os dados de {selectedUser?.email}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Telefone (WhatsApp)</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="5511999999999" />
              </div>
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="Nome do usuário" />
              </div>
              <div className="space-y-2">
                <Label>Função</Label>
                <Select value={formData.role} onValueChange={(value: AppRole) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="diretor">Diretor</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="closer">Closer</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpdateRole} disabled={formLoading}>
                {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir <strong>{selectedUser?.email}</strong>? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteUser} disabled={formLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reset Password Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Senha</DialogTitle>
              <DialogDescription>Nova senha para {selectedUser?.email}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nova Senha</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleResetPassword} disabled={formLoading}>
                {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar Senha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Impersonation Confirmation */}
        <AlertDialog open={!!impersonateTarget} onOpenChange={(open) => !open && setImpersonateTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Impersonação</AlertDialogTitle>
              <AlertDialogDescription>
                Você será conectado como <strong>{impersonateTarget?.full_name || impersonateTarget?.email}</strong>. Sua sessão será preservada.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (!impersonateTarget) return;
                  setImpersonateLoading(impersonateTarget.id);
                  await startImpersonation(impersonateTarget.id);
                  setImpersonateLoading(null);
                  setImpersonateTarget(null);
                }}
              >
                {impersonateLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Impersonar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
