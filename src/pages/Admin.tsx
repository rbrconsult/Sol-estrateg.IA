import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Users, Activity, Shield, Ban, RefreshCw, Loader2 } from 'lucide-react';

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
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && userRole !== 'super_admin') {
      toast.error('Acesso negado. Apenas super admins podem acessar esta página.');
      navigate('/');
    }
  }, [userRole, authLoading, navigate]);

  useEffect(() => {
    if (userRole === 'super_admin') {
      fetchData();
    }
  }, [userRole]);

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
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="sessions">Sessões Ativas</TabsTrigger>
            <TabsTrigger value="logs">Logs de Acesso</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Usuários Cadastrados</CardTitle>
                <CardDescription>Lista de todos os usuários do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Cadastrado em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.email}</TableCell>
                        <TableCell>{u.full_name || '-'}</TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        <TableCell>{formatDate(u.created_at)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => invalidateAllUserSessions(u.id)}
                            disabled={u.id === user?.id}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Desconectar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>Sessões Ativas</CardTitle>
                <CardDescription>Sessões de usuários atualmente conectados</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Navegador</TableHead>
                      <TableHead>Última Atividade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSessions.map((session) => {
                      const sessionUser = users.find(u => u.id === session.user_id);
                      return (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">{sessionUser?.email || session.user_id}</TableCell>
                          <TableCell>{session.ip_address || 'N/A'}</TableCell>
                          <TableCell>{parseUserAgent(session.user_agent)}</TableCell>
                          <TableCell>{formatDate(session.last_activity)}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              Ativa
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => invalidateSession(session.id, session.user_id)}
                              disabled={session.user_id === user?.id}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Invalidar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {activeSessions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhuma sessão ativa
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Logs de Acesso</CardTitle>
                <CardDescription>Histórico de acessos e ações no sistema</CardDescription>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
