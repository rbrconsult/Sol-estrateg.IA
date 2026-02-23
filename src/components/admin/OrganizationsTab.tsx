import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Pencil, Trash2, Users, UserPlus, UserMinus, Loader2, Building2 } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  settings: any;
  member_count?: number;
}

interface OrgMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  email?: string;
  full_name?: string;
}

interface UserOption {
  id: string;
  email: string;
  full_name: string | null;
}

export default function OrganizationsTab({ users }: { users: UserOption[] }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  // Create/Edit org dialog
  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [orgForm, setOrgForm] = useState({ name: '', slug: '', googleSheetId: '' });

  // Delete org dialog
  const [deleteOrg, setDeleteOrg] = useState<Organization | null>(null);

  // Members dialog
  const [membersOrg, setMembersOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch member counts
      const { data: memberCounts, error: mcError } = await supabase
        .from('organization_members')
        .select('organization_id');

      if (mcError) throw mcError;

      const countMap: Record<string, number> = {};
      memberCounts?.forEach(m => {
        countMap[m.organization_id] = (countMap[m.organization_id] || 0) + 1;
      });

      setOrganizations((orgs || []).map(o => ({
        ...o,
        member_count: countMap[o.id] || 0
      })));
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Erro ao carregar organizações');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrg = async () => {
    if (!orgForm.name || !orgForm.slug) {
      toast.error('Nome e slug são obrigatórios');
      return;
    }
    setFormLoading(true);
    try {
      const settings = { google_sheet_id: orgForm.googleSheetId || null };
      if (editingOrg) {
        const { error } = await supabase
          .from('organizations')
          .update({ name: orgForm.name, slug: orgForm.slug, settings })
          .eq('id', editingOrg.id);
        if (error) throw error;
        toast.success('Organização atualizada!');
      } else {
        const { error } = await supabase
          .from('organizations')
          .insert({ name: orgForm.name, slug: orgForm.slug, settings });
        if (error) throw error;
        toast.success('Organização criada!');
      }
      setIsOrgDialogOpen(false);
      setEditingOrg(null);
      fetchOrganizations();
    } catch (error: any) {
      console.error('Error saving org:', error);
      toast.error(error.message || 'Erro ao salvar organização');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (!deleteOrg) return;
    if ((deleteOrg.member_count || 0) > 0) {
      toast.error('Não é possível excluir uma organização com membros');
      return;
    }
    setFormLoading(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', deleteOrg.id);
      if (error) throw error;
      toast.success('Organização excluída!');
      setDeleteOrg(null);
      fetchOrganizations();
    } catch (error: any) {
      console.error('Error deleting org:', error);
      toast.error(error.message || 'Erro ao excluir organização');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditOrg = (org: Organization) => {
    setEditingOrg(org);
    const sheetId = (org.settings as any)?.google_sheet_id || '';
    setOrgForm({ name: org.name, slug: org.slug, googleSheetId: sheetId });
    setIsOrgDialogOpen(true);
  };

  const openCreateOrg = () => {
    setEditingOrg(null);
    setOrgForm({ name: '', slug: '', googleSheetId: '' });
    setIsOrgDialogOpen(true);
  };

  const openMembers = async (org: Organization) => {
    setMembersOrg(org);
    setSelectedUserId('');
    await fetchMembers(org.id);
  };

  const fetchMembers = async (orgId: string) => {
    setMembersLoading(true);
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('id, user_id, role, created_at')
        .eq('organization_id', orgId);

      if (error) throw error;

      // Enrich with profile info
      const enriched: OrgMember[] = (data || []).map(m => {
        const u = users.find(u => u.id === m.user_id);
        return {
          ...m,
          email: u?.email || m.user_id,
          full_name: u?.full_name || null
        };
      });
      setMembers(enriched);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Erro ao carregar membros');
    } finally {
      setMembersLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!membersOrg || !selectedUserId) return;
    setAddingMember(true);
    try {
      const { error } = await supabase
        .from('organization_members')
        .insert({ organization_id: membersOrg.id, user_id: selectedUserId, role: 'user' as any });
      if (error) throw error;

      // Also update user profile's organization_id
      await supabase
        .from('profiles')
        .update({ organization_id: membersOrg.id })
        .eq('id', selectedUserId);

      toast.success('Membro adicionado!');
      setSelectedUserId('');
      await fetchMembers(membersOrg.id);
      fetchOrganizations();
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast.error(error.message || 'Erro ao adicionar membro');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (membershipId: string, userId: string) => {
    if (!membersOrg) return;
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', membershipId);
      if (error) throw error;
      toast.success('Membro removido!');
      await fetchMembers(membersOrg.id);
      fetchOrganizations();
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast.error(error.message || 'Erro ao remover membro');
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
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

  // Users not already in the current org
  const availableUsers = users.filter(u => !members.some(m => m.user_id === u.id));

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organizações
            </CardTitle>
            <CardDescription>Gerencie as organizações e seus membros</CardDescription>
          </div>
          <Button onClick={openCreateOrg}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Organização
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Membros</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{org.slug}</code></TableCell>
                  <TableCell>
                    <Badge variant="secondary">{org.member_count || 0}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(org.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Membros" onClick={() => openMembers(org)}>
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={() => openEditOrg(org)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Excluir"
                        onClick={() => setDeleteOrg(org)}
                        disabled={(org.member_count || 0) > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {organizations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhuma organização cadastrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Org Dialog */}
      <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOrg ? 'Editar Organização' : 'Nova Organização'}</DialogTitle>
            <DialogDescription>
              {editingOrg ? `Editando ${editingOrg.name}` : 'Preencha os dados da nova organização'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={orgForm.name}
                onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                placeholder="Nome da organização"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={orgForm.slug}
                onChange={(e) => setOrgForm({ ...orgForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                placeholder="slug-da-organizacao"
              />
              <p className="text-xs text-muted-foreground">Identificador único (apenas letras minúsculas, números e hifens)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrgDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveOrg} disabled={formLoading}>
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingOrg ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Org Dialog */}
      <AlertDialog open={!!deleteOrg} onOpenChange={(open) => !open && setDeleteOrg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Organização</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteOrg?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrg} disabled={formLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Members Dialog */}
      <Dialog open={!!membersOrg} onOpenChange={(open) => !open && setMembersOrg(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Membros de {membersOrg?.name}
            </DialogTitle>
            <DialogDescription>Gerencie os membros desta organização</DialogDescription>
          </DialogHeader>

          {/* Add member */}
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Adicionar membro</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar usuário..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || u.email} ({u.email})
                    </SelectItem>
                  ))}
                  {availableUsers.length === 0 && (
                    <SelectItem value="_none" disabled>Todos os usuários já são membros</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddMember} disabled={!selectedUserId || addingMember} size="sm">
              {addingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1" />}
              Adicionar
            </Button>
          </div>

          {/* Members list */}
          {membersLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.email}</TableCell>
                    <TableCell>{m.full_name || '-'}</TableCell>
                    <TableCell>{getRoleBadge(m.role)}</TableCell>
                    <TableCell>{formatDate(m.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Remover membro"
                        onClick={() => handleRemoveMember(m.id, m.user_id)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {members.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      Nenhum membro nesta organização
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
