import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrgFilter } from '@/contexts/OrgFilterContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Users, UserPlus, Pencil, Trash2, Key, Eye, Ban, Loader2, Search, Building2, ArrowUpCircle, MessageCircle, Send } from 'lucide-react';
import { UserCreationWizard } from './UserCreationWizard';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: string;
  phone?: string;
}

interface TeamMember {
  id: string;
  key: string;
  franquia_id: string;
  nome: string;
  cargo: string | null;
  ativo: boolean;
  sm_id: number | null;
  krolik_id: string | null;
  krolik_setor_id: string | null;
  krolik_ativo: boolean;
}

interface UnifiedPerson {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  cargo: string | null;
  franquia_id: string | null;
  hasSOLAccess: boolean;
  hasKrolic: boolean;
  hasSM: boolean;
  smId: number | null;
  isActive: boolean;
  userId: string | null; // auth user id
  teamMemberId: string | null; // sol_equipe_sync key
  createdAt: string | null;
}

interface Props {
  users: UserWithRole[];
  organizations: { id: string; name: string }[];
  onRefreshUsers: () => void;
  onImpersonate: (user: UserWithRole) => void;
  onEditUser: (user: UserWithRole) => void;
  onResetPassword: (user: UserWithRole) => void;
  onDeleteUser: (user: UserWithRole) => void;
  onInvalidateSessions: (userId: string) => void;
  currentUserId: string | null;
  impersonateLoading: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  diretor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  gerente: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  closer: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  user: 'bg-muted text-muted-foreground',
};

export function PessoasTab({
  users,
  organizations,
  onRefreshUsers,
  onImpersonate,
  onEditUser,
  onResetPassword,
  onDeleteUser,
  onInvalidateSessions,
  currentUserId,
  impersonateLoading,
}: Props) {
  const { userRole } = useAuth();
  const { orgs } = useOrgFilter();
  const isSuperAdmin = userRole === 'super_admin';
  const canManagePeople = isSuperAdmin || userRole === 'diretor';

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterFranquia, setFilterFranquia] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Team member edit state
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [teamEditOpen, setTeamEditOpen] = useState(false);
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);
  const [teamForm, setTeamForm] = useState({ nome: '', cargo: '', telefone: '', email: '', franquia_id: '', ativo: true, krolic: true, sm_id: '', krolik_id: '', krolik_setor_id: '' });
  const [teamSaving, setTeamSaving] = useState(false);

  // Promote team member to SOL user state
  const [promoteTarget, setPromoteTarget] = useState<UnifiedPerson | null>(null);
  const [promoteForm, setPromoteForm] = useState({ email: '', telefone: '', role: 'closer' as string });
  const [promoteLoading, setPromoteLoading] = useState(false);

  // WhatsApp sending state
  const [whatsappSending, setWhatsappSending] = useState<string | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageTarget, setMessageTarget] = useState<UnifiedPerson | null>(null);
  const [customMessage, setCustomMessage] = useState('');

  useEffect(() => { fetchTeamMembers(); }, []);

  async function fetchTeamMembers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('sol_equipe_sync')
      .select('*')
      .order('nome');
    if (error) console.error(error);
    setTeamMembers((data || []).map((d: any) => ({ ...d, id: d.key })) as TeamMember[]);
    setLoading(false);
  }

  const getFranquiaLabel = (slug: string) => {
    const org = orgs.find(o => o.slug === slug);
    return org?.name || slug;
  };

  // Merge users + team members into unified list
  const unifiedPeople = useMemo<UnifiedPerson[]>(() => {
    const people: UnifiedPerson[] = [];
    const matchedTeamEmails = new Set<string>();

    // First, process all SOL users
    for (const u of users) {
      // Match by email OR by name (sol_equipe_sync may have no email)
      const teamMatch = teamMembers.find(tm => {
        if (u.full_name && tm.nome && u.full_name.toLowerCase().includes(tm.nome.toLowerCase().split(' ')[0])) {
          return tm.nome.toLowerCase() === u.full_name.toLowerCase() ||
                 u.full_name.toLowerCase().includes(tm.nome.toLowerCase()) ||
                 tm.nome.toLowerCase().includes(u.full_name.toLowerCase());
        }
        return false;
      });
      if (teamMatch) matchedTeamEmails.add(teamMatch.key);

      people.push({
        id: u.id,
        name: u.full_name || u.email,
        email: u.email,
        phone: u.phone || null,
        role: u.role,
        cargo: teamMatch?.cargo || null,
        franquia_id: teamMatch?.franquia_id || null,
        hasSOLAccess: true,
        hasKrolic: teamMatch?.krolik_ativo ?? false,
        hasSM: !!teamMatch?.sm_id,
        smId: teamMatch?.sm_id || null,
        isActive: teamMatch?.ativo ?? true,
        userId: u.id,
        teamMemberId: teamMatch?.key || null,
        createdAt: u.created_at,
      });
    }

    // Then, add team members NOT matched to any SOL user
    for (const tm of teamMembers) {
      if (matchedTeamEmails.has(tm.key)) continue;
      
      people.push({
        id: `tm-${tm.key}`,
        name: tm.nome,
        email: null,
        phone: null,
        role: null,
        cargo: tm.cargo,
        franquia_id: tm.franquia_id,
        hasSOLAccess: false,
        hasKrolic: tm.krolik_ativo,
        hasSM: !!tm.sm_id,
        smId: tm.sm_id,
        isActive: tm.ativo,
        userId: null,
        teamMemberId: tm.key,
        createdAt: null,
      });
    }

    return people;
  }, [users, teamMembers]);

  const franquias = [...new Set(teamMembers.map(m => m.franquia_id))];

  const filtered = useMemo(() => {
    let list = unifiedPeople;
    if (filterFranquia !== 'all') {
      list = list.filter(p => p.franquia_id === filterFranquia);
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(s) ||
        (p.email && p.email.toLowerCase().includes(s)) ||
        (p.cargo && p.cargo.toLowerCase().includes(s))
      );
    }
    // Sort: SOL users first, then team-only
    return list.sort((a, b) => {
      if (a.hasSOLAccess && !b.hasSOLAccess) return -1;
      if (!a.hasSOLAccess && b.hasSOLAccess) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [unifiedPeople, filterFranquia, search]);

  function openTeamEdit(tm: TeamMember) {
    setEditingTeamMember(tm);
    setTeamForm({
      nome: tm.nome,
      cargo: tm.cargo || '',
      telefone: '',
      email: '',
      franquia_id: tm.franquia_id,
      ativo: tm.ativo,
      krolic: tm.krolik_ativo,
      sm_id: tm.sm_id?.toString() || '',
      krolik_id: tm.krolik_id || '',
      krolik_setor_id: tm.krolik_setor_id || '',
    });
    setTeamEditOpen(true);
  }

  async function handleTeamSave() {
    if (!teamForm.nome || !teamForm.franquia_id) {
      toast.error('Nome e Franquia são obrigatórios');
      return;
    }
    setTeamSaving(true);
    const payload: any = {
      nome: teamForm.nome,
      cargo: teamForm.cargo || null,
      franquia_id: teamForm.franquia_id,
      ativo: teamForm.ativo,
      krolik_ativo: teamForm.krolic,
      sm_id: teamForm.sm_id ? parseInt(teamForm.sm_id) : null,
      krolik_id: teamForm.krolik_id || null,
      krolik_setor_id: teamForm.krolik_setor_id || null,
      updated_by: 'lovable',
      updated_at: new Date().toISOString(),
    };

    const { error } = editingTeamMember
      ? await supabase.from('sol_equipe_sync').update(payload).eq('key', editingTeamMember.key)
      : await supabase.from('sol_equipe_sync').insert({ ...payload, key: `${teamForm.franquia_id}_${teamForm.nome.replace(/\s/g, '_')}` } as any);

    if (error) {
      toast.error('Erro ao salvar: ' + error.message);
    } else {
      toast.success(editingTeamMember ? 'Atualizado' : 'Membro cadastrado');
      setTeamEditOpen(false);
      fetchTeamMembers();
    }
    setTeamSaving(false);
  }

  async function handleTeamDelete() {
    if (!deleteTeamId) return;
    const { error } = await supabase.from('sol_equipe_sync').delete().eq('key', deleteTeamId);
    if (error) toast.error('Erro ao excluir');
    else {
      toast.success('Removido');
      fetchTeamMembers();
    }
    setDeleteTeamId(null);
  }

  async function toggleKrolic(person: UnifiedPerson) {
    if (!person.teamMemberId) return;
    const newVal = !person.hasKrolic;
    const { error } = await supabase.from('sol_equipe_sync').update({ krolik_ativo: newVal, updated_by: 'lovable', updated_at: new Date().toISOString() }).eq('key', person.teamMemberId);
    if (error) { toast.error('Erro'); return; }
    toast.success(newVal ? 'Krolic ativado' : 'Krolic desativado');
    setTeamMembers(prev => prev.map(x => x.key === person.teamMemberId ? { ...x, krolik_ativo: newVal } : x));
  }

  async function toggleAtivo(person: UnifiedPerson) {
    if (!person.teamMemberId) return;
    const newVal = !person.isActive;
    const { error } = await supabase.from('sol_equipe_sync').update({ ativo: newVal, updated_by: 'lovable', updated_at: new Date().toISOString() }).eq('key', person.teamMemberId);
    if (error) { toast.error('Erro'); return; }
    toast.success(newVal ? 'Ativado' : 'Desativado');
    setTeamMembers(prev => prev.map(x => x.key === person.teamMemberId ? { ...x, ativo: newVal } : x));
  }

  async function handlePromote() {
    if (!promoteTarget || !promoteForm.email) {
      toast.error('Email é obrigatório');
      return;
    }
    setPromoteLoading(true);
    try {
      const DEFAULT_PASSWORD = 'Sol1.3strat3g51@';
      // Find org ID from franquia_id
      const orgMatch = orgs.find(o => o.slug === promoteTarget.franquia_id);
      const orgId = orgMatch?.id || '00000000-0000-0000-0000-000000000001';

      // 1. Create user via manage-users
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'create',
          email: promoteForm.email,
          password: DEFAULT_PASSWORD,
          full_name: promoteTarget.name,
          role: promoteForm.role,
          organization_id: orgId,
          phone: promoteForm.telefone.replace(/\D/g, ''),
        }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // 2. Update sol_equipe_sync
      if (promoteTarget.teamMemberId) {
        await supabase.from('sol_equipe_sync').update({
          updated_by: 'lovable',
          updated_at: new Date().toISOString(),
        }).eq('key', promoteTarget.teamMemberId);
      }

      // 3. Send WhatsApp welcome
      if (promoteForm.telefone) {
        const cleanPhone = promoteForm.telefone.replace(/\D/g, '');
        await sendWhatsAppWelcome(cleanPhone, promoteTarget.name, promoteForm.email, DEFAULT_PASSWORD);
      }

      toast.success(`${promoteTarget.name} agora é usuário SOL!`);
      setPromoteTarget(null);
      onRefreshUsers();
      fetchTeamMembers();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao promover');
    } finally {
      setPromoteLoading(false);
    }
  }

  async function sendWhatsAppWelcome(phone: string, name: string, email: string, password?: string) {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) { toast.error('Telefone não informado'); return; }
    const pwd = password || 'Sol1.3strat3g51@';
    const message = `🌞 *Seja bem-vindo(a) à SOL Estrateg.IA!*\n\nOlá ${name}! 👋\n\nSeu acesso foi criado com sucesso.\n\n🔐 *Credenciais de acesso:*\n📧 Email: ${email}\n🔑 Senha: ${pwd}\n\n🌐 Acesse: https://solestrategia.com.br\n\n⚠️ Recomendamos alterar sua senha no primeiro acesso.\n\nQualquer dúvida, estamos à disposição!`;
    try {
      await supabase.functions.invoke('send-whatsapp-alert', {
        body: { phone: cleanPhone, message }
      });
      toast.success(`WhatsApp enviado para ${name}`);
    } catch {
      toast.error('Erro ao enviar WhatsApp');
    }
  }

  async function handleSendWhatsApp(person: UnifiedPerson) {
    if (!person.phone && !person.email) {
      toast.error('Sem telefone cadastrado');
      return;
    }
    setWhatsappSending(person.id);
    await sendWhatsAppWelcome(
      person.phone || '',
      person.name,
      person.email || '',
    );
    setWhatsappSending(null);
  }

  function openMessageDialog(person: UnifiedPerson) {
    setMessageTarget(person);
    setCustomMessage('');
    setMessageDialogOpen(true);
  }

  async function handleSendCustomMessage() {
    if (!messageTarget || !messageTarget.phone || !customMessage.trim()) return;
    setWhatsappSending(messageTarget.id);
    setMessageDialogOpen(false);
    try {
      const cleanPhone = messageTarget.phone.replace(/\D/g, '');
      await supabase.functions.invoke('send-whatsapp-alert', {
        body: { phone: cleanPhone, message: customMessage.trim() }
      });
      toast.success(`Mensagem enviada para ${messageTarget.name}`);
    } catch {
      toast.error('Erro ao enviar mensagem');
    }
    setWhatsappSending(null);
    setMessageTarget(null);
  }

  function openPromote(person: UnifiedPerson) {
    const teamObj = person.teamMemberId ? teamMembers.find(t => t.id === person.teamMemberId) : null;
    setPromoteTarget(person);
    setPromoteForm({
      email: person.email || teamObj?.email || '',
      telefone: person.phone || teamObj?.telefone || '',
      role: 'closer',
    });
  }

  const solUsers = filtered.filter(p => p.hasSOLAccess).length;
  const teamOnly = filtered.filter(p => !p.hasSOLAccess).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Pessoas
              </CardTitle>
              <CardDescription className="flex items-center gap-3 mt-1">
                <span>{solUsers} com acesso SOL</span>
                {teamOnly > 0 && (
                  <>
                    <span className="text-border">•</span>
                    <span>{teamOnly} equipe SM (sem login)</span>
                  </>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 w-56"
                  placeholder="Buscar pessoa..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              {isSuperAdmin && franquias.length > 1 && (
                <Select value={filterFranquia} onValueChange={setFilterFranquia}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Filtrar filial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas filiais</SelectItem>
                    {franquias.map(f => (
                      <SelectItem key={f} value={f}>{getFranquiaLabel(f)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {canManagePeople && (
                <Button onClick={() => setIsCreateOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Novo
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Função / Cargo</TableHead>
                <TableHead>Acesso</TableHead>
                {isSuperAdmin && <TableHead>Filial</TableHead>}
                <TableHead>Krolic</TableHead>
                <TableHead>SM</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhuma pessoa encontrada
                  </TableCell>
                </TableRow>
              ) : filtered.map(p => {
                const userObj = p.userId ? users.find(u => u.id === p.userId) : null;
                const teamObj = p.teamMemberId ? teamMembers.find(t => t.id === p.teamMemberId) : null;

                return (
                  <TableRow key={p.id} className={!p.hasSOLAccess ? 'opacity-75' : ''}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{p.name}</span>
                        {p.email && <p className="text-xs text-muted-foreground">{p.email}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {p.role && (
                          <Badge variant="outline" className={`text-[10px] ${ROLE_COLORS[p.role] || ''}`}>
                            {p.role}
                          </Badge>
                        )}
                        {p.cargo && (
                          <Badge variant="secondary" className="text-[10px]">
                            {p.cargo}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.hasSOLAccess ? (
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                          SOL ✓
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Sem login
                        </Badge>
                      )}
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell>
                        {p.franquia_id ? (
                          <Badge variant="outline" className="text-[10px]">
                            {getFranquiaLabel(p.franquia_id)}
                          </Badge>
                        ) : '—'}
                      </TableCell>
                    )}
                    <TableCell>
                      {p.teamMemberId ? (
                        <Switch
                          checked={p.hasKrolic}
                          onCheckedChange={() => toggleKrolic(p)}
                          disabled={!canManagePeople}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.hasSM ? (
                        <Badge variant="outline" className="font-mono text-[10px]">{p.smId}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.teamMemberId ? (
                        <Switch
                          checked={p.isActive}
                          onCheckedChange={() => toggleAtivo(p)}
                          disabled={!canManagePeople}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        {/* SOL user actions */}
                        {userObj && isSuperAdmin && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" title="Impersonar"
                              onClick={() => onImpersonate(userObj)}
                              disabled={userObj.id === currentUserId || impersonateLoading === userObj.id}>
                              {impersonateLoading === userObj.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar" onClick={() => onEditUser(userObj)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-purple-500" title="Senha" onClick={() => onResetPassword(userObj)}>
                              <Key className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-orange-500" title="Desconectar"
                              onClick={() => onInvalidateSessions(userObj.id)}
                              disabled={userObj.id === currentUserId}>
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Excluir"
                              onClick={() => onDeleteUser(userObj)}
                              disabled={userObj.id === currentUserId}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {/* WhatsApp message for anyone with phone */}
                        {p.phone && canManagePeople && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-500" title="Enviar mensagem WhatsApp"
                              onClick={() => openMessageDialog(p)}
                              disabled={whatsappSending === p.id}>
                              {whatsappSending === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            </Button>
                            {userObj && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" title="Reenviar acesso"
                                onClick={() => handleSendWhatsApp(p)}
                                disabled={whatsappSending === p.id}>
                                <MessageCircle className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </>
                        )}
                        {/* Team-only member actions */}
                        {!userObj && teamObj && canManagePeople && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" title="Promover a Usuário SOL"
                              onClick={() => openPromote(p)}>
                              <ArrowUpCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar SM" onClick={() => openTeamEdit(teamObj)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Remover" onClick={() => setDeleteTeamId(teamObj.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Creation Wizard */}
      <UserCreationWizard
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => { onRefreshUsers(); fetchTeamMembers(); }}
        organizations={organizations}
      />

      {/* Team member edit dialog */}
      <Dialog open={teamEditOpen} onOpenChange={setTeamEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Membro SM</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={teamForm.nome} onChange={e => setTeamForm(f => ({ ...f, nome: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input value={teamForm.cargo} onChange={e => setTeamForm(f => ({ ...f, cargo: e.target.value }))} placeholder="Closer, SDR..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={teamForm.telefone} onChange={e => setTeamForm(f => ({ ...f, telefone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={teamForm.email} onChange={e => setTeamForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Franquia *</Label>
              <Select value={teamForm.franquia_id} onValueChange={v => setTeamForm(f => ({ ...f, franquia_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {orgs.map(o => (
                    <SelectItem key={o.slug} value={o.slug}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>SM ID</Label>
                <Input value={teamForm.sm_id} onChange={e => setTeamForm(f => ({ ...f, sm_id: e.target.value }))} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Krolik ID</Label>
                <Input value={teamForm.krolik_id} onChange={e => setTeamForm(f => ({ ...f, krolik_id: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Krolik Setor</Label>
                <Input value={teamForm.krolik_setor_id} onChange={e => setTeamForm(f => ({ ...f, krolik_setor_id: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={teamForm.ativo} onCheckedChange={v => setTeamForm(f => ({ ...f, ativo: v }))} />
                <Label>Ativo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={teamForm.krolic} onCheckedChange={v => setTeamForm(f => ({ ...f, krolic: v }))} />
                <Label>Krolic</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTeamEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleTeamSave} disabled={teamSaving}>
              {teamSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete team member */}
      <AlertDialog open={!!deleteTeamId} onOpenChange={() => setDeleteTeamId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Remover este membro do time comercial?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleTeamDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promote team member to SOL user */}
      <Dialog open={!!promoteTarget} onOpenChange={(open) => !open && setPromoteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-primary" />
              Promover a Usuário SOL
            </DialogTitle>
          </DialogHeader>
          {promoteTarget && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <p className="font-medium">{promoteTarget.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {promoteTarget.smId && <Badge variant="outline" className="text-[10px]">SM: {promoteTarget.smId}</Badge>}
                  {promoteTarget.franquia_id && <Badge variant="outline" className="text-[10px]">{getFranquiaLabel(promoteTarget.franquia_id)}</Badge>}
                  {promoteTarget.hasKrolic && <Badge variant="outline" className="text-[10px]">Krolic ✓</Badge>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={promoteForm.email} onChange={e => setPromoteForm(f => ({ ...f, email: e.target.value }))} placeholder="usuario@empresa.com" />
              </div>
              <div className="space-y-2">
                <Label>Telefone (WhatsApp)</Label>
                <Input value={promoteForm.telefone} onChange={e => setPromoteForm(f => ({ ...f, telefone: e.target.value }))} placeholder="5517991234567" />
              </div>
              <div className="space-y-2">
                <Label>Função</Label>
                <Select value={promoteForm.role} onValueChange={v => setPromoteForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diretor">Diretor</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="closer">Closer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground space-y-1">
                <p>🔑 Senha padrão: <code className="bg-muted px-1 rounded">Sol1.3strat3g51@</code></p>
                <p>📱 Credenciais serão enviadas via WhatsApp automaticamente</p>
                <p>📧 Email de verificação será enviado</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoteTarget(null)}>Cancelar</Button>
            <Button onClick={handlePromote} disabled={promoteLoading || !promoteForm.email}>
              {promoteLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowUpCircle className="h-4 w-4 mr-2" />}
              Promover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send WhatsApp message dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-emerald-500" />
              Enviar Mensagem WhatsApp
            </DialogTitle>
          </DialogHeader>
          {messageTarget && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="font-medium">{messageTarget.name}</p>
                <p className="text-xs text-muted-foreground">{messageTarget.phone}</p>
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <textarea
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  placeholder="Digite a mensagem..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSendCustomMessage} disabled={!customMessage.trim()} className="bg-emerald-600 hover:bg-emerald-700">
              <Send className="h-4 w-4 mr-2" />
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
