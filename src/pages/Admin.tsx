import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
import { ArrowLeft, Users, Activity, Shield, Ban, RefreshCw, Loader2, Plus, Pencil, Trash2, UserPlus, Key, Eye, Settings, Save, Building2, LayoutGrid, Fingerprint } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import OrganizationsTab from '@/components/admin/OrganizationsTab';
import ModulesTab from '@/components/admin/ModulesTab';
import LoginAnalyticsTab from '@/components/admin/LoginAnalyticsTab';
import MonitoredScenariosSettings from '@/components/admin/MonitoredScenariosSettings';
import { TimeComercialTab } from '@/components/admin/TimeComercialTab';

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: string;
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
  const [evolutionUrl, setEvolutionUrl] = useState('');
  const [evolutionKey, setEvolutionKey] = useState('');
  const [evolutionInstance, setEvolutionInstance] = useState('');
  const [centralNumber, setCentralNumber] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (!authLoading && userRole !== 'super_admin') {
      toast.error('Acesso negado. Apenas super admins podem acessar esta página.');
      navigate('/selecao');
    }
  }, [userRole, authLoading, navigate]);

  useEffect(() => {
    if (userRole === 'super_admin') {
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

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map(profile => ({
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name,
        created_at: profile.created_at,
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
      const { data, error } = await supabase
        .from('access_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAccessLogs(data || []);
    } catch (error) {
      console.error('Error fetching access logs:', error);
      toast.error('Erro ao carregar logs de acesso');
    }
  };

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .order('last_activity', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Erro ao carregar sessões');
    }
  };

  const invalidateSession = async (sessionId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;

      // Log the action
      const userEmail = users.find(u => u.id === userId)?.email;
      await supabase.from('access_logs').insert({
        user_id: userId,
        email: userEmail,
        action: 'session_invalidated',
        ip_address: 'admin_action'
      });

      toast.success('Sessão invalidada com sucesso');
      fetchSessions();
    } catch (error) {
      console.error('Error invalidating session:', error);
      toast.error('Erro ao invalidar sessão');
    }
  };

  const invalidateAllUserSessions = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      const userEmail = users.find(u => u.id === userId)?.email;
      await supabase.from('access_logs').insert({
        user_id: userId,
        email: userEmail,
        action: 'all_sessions_invalidated',
        ip_address: 'admin_action'
      });

      toast.success('Todas as sessões do usuário foram invalidadas');
      fetchSessions();
    } catch (error) {
      console.error('Error invalidating sessions:', error);
      toast.error('Erro ao invalidar sessões');
    }
  };

  // CRUD Functions
  const handleCreateUser = async () => {
    if (!formData.email || !formData.password) {
      toast.error('Email e senha são obrigatórios');
      return;
    }
    
    setFormLoading(true);
    try {
      // Create user via Supabase Auth Admin API (edge function)
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { 
          action: 'create',
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role,
          organization_id: formData.organization_id,
          phone: formData.phone
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Usuário criado com sucesso!');
      setIsCreateDialogOpen(false);
      setFormData({ email: '', password: '', full_name: '', role: 'user', organization_id: '00000000-0000-0000-0000-000000000001', phone: '' });
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Erro ao criar usuário');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    
    setFormLoading(true);
    try {
      // Update role in user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: formData.role })
        .eq('user_id', selectedUser.id);

      if (roleError) throw roleError;

      // Update full_name in profiles
      if (formData.full_name !== selectedUser.full_name) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: formData.full_name })
          .eq('id', selectedUser.id);

        if (profileError) throw profileError;
      }

      // Log the action
      await supabase.from('access_logs').insert({
        user_id: selectedUser.id,
        email: selectedUser.email,
        action: 'role_updated',
        ip_address: 'admin_action'
      });

      toast.success('Usuário atualizado com sucesso!');
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Erro ao atualizar usuário');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setFormLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { 
          action: 'delete',
          userId: selectedUser.id
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Usuário excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Erro ao excluir usuário');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditDialog = (u: UserWithRole) => {
    setSelectedUser(u);
    setFormData({ 
      email: u.email, 
      password: '', 
      full_name: u.full_name || '', 
      role: u.role as AppRole,
      organization_id: '00000000-0000-0000-0000-000000000001',
      phone: ''
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (u: UserWithRole) => {
    setSelectedUser(u);
    setIsDeleteDialogOpen(true);
  };

  const openPasswordDialog = (u: UserWithRole) => {
    setSelectedUser(u);
    setNewPassword('');
    setIsPasswordDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) {
      toast.error('Nova senha é obrigatória');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    
    setFormLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { 
          action: 'reset_password',
          userId: selectedUser.id,
          password: newPassword
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Senha alterada com sucesso!');
      setIsPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setFormLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'login':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Login</Badge>;
      case 'logout':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Logout</Badge>;
      case 'session_invalidated':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Sessão Invalidada</Badge>;
      case 'all_sessions_invalidated':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Todas Sessões Invalidadas</Badge>;
      case 'role_updated':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Role Atualizado</Badge>;
      case 'user_created':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Usuário Criado</Badge>;
      case 'user_deleted':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Usuário Excluído</Badge>;
      case 'password_reset':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Senha Alterada</Badge>;
      case 'user_impersonation':
        return <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Impersonação</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Admin</Badge>;
      default:
        return <Badge variant="outline">Usuário</Badge>;
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings' as any)
        .select('key, value');
      if (error) throw error;
      const settings: Record<string, string> = {};
      (data as any[])?.forEach((s: any) => { settings[s.key] = s.value; });
      setEvolutionUrl(settings.evolution_api_url || '');
      setEvolutionKey(settings.evolution_api_key || '');
      setEvolutionInstance(settings.evolution_instance_name || '');
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
        { key: 'evolution_api_url', value: evolutionUrl },
        { key: 'evolution_api_key', value: evolutionKey },
        { key: 'evolution_instance_name', value: evolutionInstance },
        { key: 'central_whatsapp_number', value: centralNumber },
      ];
      for (const u of updates) {
        const { error } = await supabase
          .from('app_settings' as any)
          .update({ value: u.value, updated_at: new Date().toISOString() })
          .eq('key', u.key);
        if (error) throw error;
      }
      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações: ' + (error.message || ''));
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

  if (userRole !== 'super_admin') {
    return null;
  }

  const activeSessions = sessions.filter(s => s.is_active);

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
              <p className="text-muted-foreground">Gestão de acessos e usuários</p>
            </div>
          </div>
          <Button onClick={refreshData} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Filiais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organizations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Sessões Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{activeSessions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Logs de Acesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accessLogs.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="organizations" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="organizations">Filiais</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="modules">Módulos</TabsTrigger>
            <TabsTrigger value="seguranca" className="flex items-center gap-1">
              <Fingerprint className="h-3.5 w-3.5" />
              Segurança & Logs
            </TabsTrigger>
            <TabsTrigger value="sessions">Sessões Ativas</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Usuários Cadastrados</CardTitle>
                  <CardDescription>Lista de todos os usuários do sistema</CardDescription>
                </div>
                <Button onClick={() => {
                  setFormData({ email: '', password: '', full_name: '', role: 'user', organization_id: '00000000-0000-0000-0000-000000000001', phone: '' });
                  setIsCreateDialogOpen(true);
                }}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Cadastrado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.email}</TableCell>
                        <TableCell>{u.full_name || '-'}</TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        <TableCell>{formatDate(u.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                            onClick={() => setImpersonateTarget(u)}
                              disabled={u.id === user?.id || impersonateLoading === u.id}
                              className="h-8 w-8 text-primary hover:text-primary"
                              title="Impersonar Usuário"
                            >
                              {impersonateLoading === u.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(u)}
                              className="h-8 w-8"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openPasswordDialog(u)}
                              className="h-8 w-8 text-purple-500 hover:text-purple-600"
                              title="Alterar Senha"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => invalidateAllUserSessions(u.id)}
                              disabled={u.id === user?.id}
                              className="h-8 w-8 text-orange-500 hover:text-orange-600"
                              title="Desconectar"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(u)}
                              disabled={u.id === user?.id}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modules">
            <ModulesTab users={users.map(u => ({ id: u.id, email: u.email, full_name: u.full_name, role: u.role }))} />
          </TabsContent>

          <TabsContent value="organizations">
            <OrganizationsTab users={users.map(u => ({ id: u.id, email: u.email, full_name: u.full_name }))} />
          </TabsContent>

          <TabsContent value="seguranca">
            <div className="space-y-6">
              {/* Login Analytics */}
              <LoginAnalyticsTab
                accessLogs={accessLogs}
                sessions={sessions}
                onInvalidateAllSessions={invalidateAllUserSessions}
              />

              {/* Access Logs Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Logs de Acesso</CardTitle>
                  <CardDescription>Histórico completo de acessos e ações no sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Navegador</TableHead>
                        <TableHead>Data/Hora</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accessLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.email || '-'}</TableCell>
                          <TableCell>{getActionBadge(log.action)}</TableCell>
                          <TableCell>{log.ip_address || 'N/A'}</TableCell>
                          <TableCell>{parseUserAgent(log.user_agent)}</TableCell>
                          <TableCell>{formatDate(log.created_at)}</TableCell>
                        </TableRow>
                      ))}
                      {accessLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Nenhum log de acesso
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações da Evolution API (WhatsApp)
                </CardTitle>
                <CardDescription>Configure as credenciais para envio de notificações via WhatsApp</CardDescription>
              </CardHeader>
              <CardContent>
                {settingsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : (
                  <div className="space-y-4 max-w-lg">
                    <div className="space-y-2">
                      <Label>URL da API</Label>
                      <Input value={evolutionUrl} onChange={(e) => setEvolutionUrl(e.target.value)} placeholder="https://api.exemplo.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          type={showApiKey ? "text" : "password"}
                          value={showApiKey ? evolutionKey : maskApiKey(evolutionKey)}
                          onChange={(e) => { setShowApiKey(true); setEvolutionKey(e.target.value); }}
                          onFocus={() => setShowApiKey(true)}
                          placeholder="Chave da API"
                        />
                        <Button type="button" variant="outline" size="icon" onClick={() => setShowApiKey(!showApiKey)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Nome da Instância</Label>
                      <Input value={evolutionInstance} onChange={(e) => setEvolutionInstance(e.target.value)} placeholder="Nome da instância" />
                    </div>
                    <div className="space-y-2">
                      <Label>Número da Central (WhatsApp)</Label>
                      <Input value={centralNumber} onChange={(e) => setCentralNumber(e.target.value)} placeholder="5517999999999" />
                      <p className="text-xs text-muted-foreground">Formato: código do país + DDD + número (ex: 5517997335222)</p>
                    </div>
                    <Button onClick={handleSaveSettings} disabled={settingsSaving} className="gap-2">
                      {settingsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Salvar Configurações
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <MonitoredScenariosSettings />
          </TabsContent>
        </Tabs>

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>Preencha os dados do novo usuário</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Nome do usuário"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select value={formData.role} onValueChange={(value: AppRole) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="5517991244540"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Organização</Label>
                <Select value={formData.organization_id} onValueChange={(value) => setFormData({ ...formData, organization_id: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateUser} disabled={formLoading}>
                {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>Atualize os dados do usuário {selectedUser?.email}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_full_name">Nome Completo</Label>
                <Input
                  id="edit_full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Nome do usuário"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_role">Função</Label>
                <Select value={formData.role} onValueChange={(value: AppRole) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpdateRole} disabled={formLoading}>
                {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar Alterações
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
                Tem certeza que deseja excluir o usuário <strong>{selectedUser?.email}</strong>? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteUser} 
                disabled={formLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
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
              <DialogDescription>Defina uma nova senha para {selectedUser?.email}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new_password">Nova Senha</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
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
      {/* Impersonation Confirmation Dialog */}
      <AlertDialog open={!!impersonateTarget} onOpenChange={(open) => !open && setImpersonateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Impersonação</AlertDialogTitle>
            <AlertDialogDescription>
              Você será conectado como <strong>{impersonateTarget?.full_name || impersonateTarget?.email}</strong>. Sua sessão atual será preservada para restauração posterior.
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
