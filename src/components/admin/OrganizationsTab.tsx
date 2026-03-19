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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Pencil, Trash2, Users, UserPlus, UserMinus, Loader2, Building2, Webhook, Database, Key, Settings, Eye, EyeOff, ShieldCheck, Save, X, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import FranchiseWizard from './FranchiseWizard';

const MATRIZ_ORG_ID = '00000000-0000-0000-0000-000000000001';

interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  settings: any;
  member_count?: number;
  config_count?: number;
}

interface OrgMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  email?: string;
  full_name?: string;
}

interface OrgConfig {
  id: string;
  config_key: string;
  config_value: string;
  config_category: string;
  is_secret: boolean;
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

  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [orgForm, setOrgForm] = useState({ name: '', slug: '' });

  const [deleteOrg, setDeleteOrg] = useState<Organization | null>(null);

  const [membersOrg, setMembersOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  // Configs dialog
  const [configsOrg, setConfigsOrg] = useState<Organization | null>(null);
  const [configs, setConfigs] = useState<OrgConfig[]>([]);
  const [configsLoading, setConfigsLoading] = useState(false);
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [editConfigForm, setEditConfigForm] = useState({ config_key: '', config_value: '', config_category: 'general', is_secret: false });
  const [isAddingConfig, setIsAddingConfig] = useState(false);
  const [newConfigForm, setNewConfigForm] = useState({ config_key: '', config_value: '', config_category: 'general', is_secret: false });
  const [configSaving, setConfigSaving] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState<OrgConfig | null>(null);

  // Wizard
  const [wizardOpen, setWizardOpen] = useState(false);

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

      const { data: memberCounts } = await supabase
        .from('organization_members')
        .select('organization_id');

      const { data: configCounts } = await supabase
        .from('organization_configs')
        .select('organization_id');

      const mCountMap: Record<string, number> = {};
      memberCounts?.forEach(m => { mCountMap[m.organization_id] = (mCountMap[m.organization_id] || 0) + 1; });

      const cCountMap: Record<string, number> = {};
      configCounts?.forEach(c => { cCountMap[c.organization_id] = (cCountMap[c.organization_id] || 0) + 1; });

      setOrganizations((orgs || [])
        .filter(o => o.id !== MATRIZ_ORG_ID)
        .map(o => ({
          ...o,
          member_count: mCountMap[o.id] || 0,
          config_count: cCountMap[o.id] || 0,
        })));
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Erro ao carregar organizações');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrg = async () => {
    if (!orgForm.name || !orgForm.slug) { toast.error('Nome e slug são obrigatórios'); return; }
    setFormLoading(true);
    try {
      if (editingOrg) {
        const { error } = await supabase.from('organizations').update({ name: orgForm.name, slug: orgForm.slug }).eq('id', editingOrg.id);
        if (error) throw error;
        toast.success('Organização atualizada!');
      } else {
        const { error } = await supabase.from('organizations').insert({ name: orgForm.name, slug: orgForm.slug, settings: {} });
        if (error) throw error;
        toast.success('Organização criada!');
      }
      setIsOrgDialogOpen(false);
      setEditingOrg(null);
      fetchOrganizations();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar organização');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (!deleteOrg) return;
    if ((deleteOrg.member_count || 0) > 0) { toast.error('Não é possível excluir organização com membros'); return; }
    setFormLoading(true);
    try {
      const { error } = await supabase.from('organizations').delete().eq('id', deleteOrg.id);
      if (error) throw error;
      toast.success('Organização excluída!');
      setDeleteOrg(null);
      fetchOrganizations();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir organização');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditOrg = (org: Organization) => {
    setEditingOrg(org);
    setOrgForm({ name: org.name, slug: org.slug });
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
      const { data, error } = await supabase.from('organization_members').select('id, user_id, role, created_at').eq('organization_id', orgId);
      if (error) throw error;
      setMembers((data || []).map(m => {
        const u = users.find(u => u.id === m.user_id);
        return { ...m, email: u?.email || m.user_id, full_name: u?.full_name || null };
      }));
    } catch { toast.error('Erro ao carregar membros'); }
    finally { setMembersLoading(false); }
  };

  const handleAddMember = async () => {
    if (!membersOrg || !selectedUserId) return;
    setAddingMember(true);
    try {
      const { error } = await supabase.from('organization_members').insert({ organization_id: membersOrg.id, user_id: selectedUserId, role: 'user' as any });
      if (error) throw error;
      await supabase.from('profiles').update({ organization_id: membersOrg.id }).eq('id', selectedUserId);
      toast.success('Membro adicionado!');
      setSelectedUserId('');
      await fetchMembers(membersOrg.id);
      fetchOrganizations();
    } catch (error: any) { toast.error(error.message || 'Erro ao adicionar membro'); }
    finally { setAddingMember(false); }
  };

  const handleRemoveMember = async (membershipId: string) => {
    if (!membersOrg) return;
    try {
      const { error } = await supabase.from('organization_members').delete().eq('id', membershipId);
      if (error) throw error;
      toast.success('Membro removido!');
      await fetchMembers(membersOrg.id);
      fetchOrganizations();
    } catch (error: any) { toast.error(error.message || 'Erro ao remover membro'); }
  };

  // Configs
  const openConfigs = async (org: Organization) => {
    setConfigsOrg(org);
    setRevealedSecrets(new Set());
    setConfigsLoading(true);
    try {
      const { data, error } = await supabase
        .from('organization_configs')
        .select('id, config_key, config_value, config_category, is_secret')
        .eq('organization_id', org.id)
        .order('config_category', { ascending: true });
      if (error) throw error;
      setConfigs(data || []);
    } catch { toast.error('Erro ao carregar configs'); }
    finally { setConfigsLoading(false); }
  };

  const toggleReveal = (id: string) => {
    setRevealedSecrets(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const maskValue = (val: string) => val.length > 8 ? val.slice(0, 4) + '••••' + val.slice(-4) : '••••••••';

  const handleAddConfig = async () => {
    if (!configsOrg || !newConfigForm.config_key || !newConfigForm.config_value) { toast.error('Chave e valor são obrigatórios'); return; }
    setConfigSaving(true);
    try {
      const { error } = await supabase.from('organization_configs').insert({
        organization_id: configsOrg.id,
        config_key: newConfigForm.config_key,
        config_value: newConfigForm.config_value,
        config_category: newConfigForm.config_category,
        is_secret: newConfigForm.is_secret,
      });
      if (error) throw error;
      toast.success('Configuração adicionada!');
      setNewConfigForm({ config_key: '', config_value: '', config_category: 'general', is_secret: false });
      setIsAddingConfig(false);
      await openConfigs(configsOrg);
      fetchOrganizations();
    } catch (error: any) { toast.error(error.message || 'Erro ao adicionar'); }
    finally { setConfigSaving(false); }
  };

  const handleUpdateConfig = async (id: string) => {
    if (!configsOrg) return;
    setConfigSaving(true);
    try {
      const { error } = await supabase.from('organization_configs').update({
        config_key: editConfigForm.config_key,
        config_value: editConfigForm.config_value,
        config_category: editConfigForm.config_category,
        is_secret: editConfigForm.is_secret,
      }).eq('id', id);
      if (error) throw error;
      toast.success('Configuração atualizada!');
      setEditingConfig(null);
      await openConfigs(configsOrg);
    } catch (error: any) { toast.error(error.message || 'Erro ao atualizar'); }
    finally { setConfigSaving(false); }
  };

  const handleDeleteConfig = async () => {
    if (!deleteConfig || !configsOrg) return;
    setConfigSaving(true);
    try {
      const { error } = await supabase.from('organization_configs').delete().eq('id', deleteConfig.id);
      if (error) throw error;
      toast.success('Configuração excluída!');
      setDeleteConfig(null);
      await openConfigs(configsOrg);
      fetchOrganizations();
    } catch (error: any) { toast.error(error.message || 'Erro ao excluir'); }
    finally { setConfigSaving(false); }
  };

  const startEditConfig = (c: OrgConfig) => {
    setEditingConfig(c.id);
    setEditConfigForm({ config_key: c.config_key, config_value: c.config_value, config_category: c.config_category, is_secret: c.is_secret });
  };

  const getCategoryBadge = (cat: string) => {
    const styles: Record<string, string> = {
      webhook: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      datastore: 'bg-green-500/20 text-green-400 border-green-500/30',
      api: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      general: 'bg-muted text-muted-foreground',
    };
    return <Badge className={styles[cat] || styles.general}>{cat}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin': return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Super Admin</Badge>;
      case 'admin': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Admin</Badge>;
      default: return <Badge variant="outline">Usuário</Badge>;
    }
  };

  const formatDate = (d: string) => format(new Date(d), "dd/MM/yyyy HH:mm", { locale: ptBR });

  const availableUsers = users.filter(u => !members.some(m => m.user_id === u.id));

  if (loading) {
    return <Card><CardContent className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></CardContent></Card>;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Filiais</CardTitle>
            <CardDescription>Gerencie filiais, integrações e membros</CardDescription>
          </div>
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Nova Franquia
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg border border-border bg-muted/50">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Matriz: <strong className="text-foreground">RBR Consult</strong> — administração global (super admin)</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Membros</TableHead>
                <TableHead>Configs</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{org.slug}</code></TableCell>
                  <TableCell><Badge variant="secondary">{org.member_count || 0}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={org.config_count ? 'default' : 'outline'} className={org.config_count ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}>
                      {org.config_count || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(org.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Configs" onClick={() => openConfigs(org)}>
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Membros" onClick={() => openMembers(org)}>
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={() => openEditOrg(org)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Excluir" onClick={() => setDeleteOrg(org)} disabled={(org.member_count || 0) > 0}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {organizations.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma organização cadastrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Org Dialog */}
      <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOrg ? 'Editar Organização' : 'Nova Organização'}</DialogTitle>
            <DialogDescription>{editingOrg ? `Editando ${editingOrg.name}` : 'Preencha os dados'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={orgForm.name} onChange={e => setOrgForm({ ...orgForm, name: e.target.value })} placeholder="Nome da organização" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={orgForm.slug} onChange={e => setOrgForm({ ...orgForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} placeholder="slug-da-organizacao" />
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
      <AlertDialog open={!!deleteOrg} onOpenChange={o => !o && setDeleteOrg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Organização</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir <strong>{deleteOrg?.name}</strong>? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrg} disabled={formLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Members Dialog */}
      <Dialog open={!!membersOrg} onOpenChange={o => !o && setMembersOrg(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Membros de {membersOrg?.name}</DialogTitle>
            <DialogDescription>Gerencie os membros desta organização</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Adicionar membro</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger><SelectValue placeholder="Selecionar usuário..." /></SelectTrigger>
                <SelectContent>
                  {availableUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email} ({u.email})</SelectItem>)}
                  {availableUsers.length === 0 && <SelectItem value="_none" disabled>Todos já são membros</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddMember} disabled={!selectedUserId || addingMember} size="sm">
              {addingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1" />}Adicionar
            </Button>
          </div>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleRemoveMember(m.id)}>
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {members.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Nenhum membro</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Configs Dialog */}
      <Dialog open={!!configsOrg} onOpenChange={o => { if (!o) { setConfigsOrg(null); setEditingConfig(null); setIsAddingConfig(false); } }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Configurações — {configsOrg?.name}</DialogTitle>
            <DialogDescription>Webhooks, Data Stores e credenciais da franquia</DialogDescription>
          </DialogHeader>

          {/* Add new config button */}
          {!isAddingConfig && (
            <Button size="sm" variant="outline" className="self-start" onClick={() => setIsAddingConfig(true)}>
              <Plus className="h-4 w-4 mr-1" />Nova Configuração
            </Button>
          )}

          {/* Add config form */}
          {isAddingConfig && (
            <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
              <p className="text-sm font-medium">Nova Configuração</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Chave</Label>
                  <Input value={newConfigForm.config_key} onChange={e => setNewConfigForm({ ...newConfigForm, config_key: e.target.value })} placeholder="ex: webhook_leads" className="font-mono text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Categoria</Label>
                  <Select value={newConfigForm.config_category} onValueChange={v => setNewConfigForm({ ...newConfigForm, config_category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                      <SelectItem value="datastore">Datastore</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valor</Label>
                <Input value={newConfigForm.config_value} onChange={e => setNewConfigForm({ ...newConfigForm, config_value: e.target.value })} placeholder="Valor da configuração" className="font-mono text-xs" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="new-secret" checked={newConfigForm.is_secret} onCheckedChange={v => setNewConfigForm({ ...newConfigForm, is_secret: !!v })} />
                <Label htmlFor="new-secret" className="text-xs">Valor secreto (ocultar por padrão)</Label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => { setIsAddingConfig(false); setNewConfigForm({ config_key: '', config_value: '', config_category: 'general', is_secret: false }); }}>
                  <X className="h-3.5 w-3.5 mr-1" />Cancelar
                </Button>
                <Button size="sm" onClick={handleAddConfig} disabled={configSaving}>
                  {configSaving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}Salvar
                </Button>
              </div>
            </div>
          )}

          {configsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : configs.length === 0 && !isAddingConfig ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma configuração cadastrada.</p>
          ) : configs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Chave</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right w-28">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map(c => editingConfig === c.id ? (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Select value={editConfigForm.config_category} onValueChange={v => setEditConfigForm({ ...editConfigForm, config_category: v })}>
                        <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="webhook">Webhook</SelectItem>
                          <SelectItem value="datastore">Datastore</SelectItem>
                          <SelectItem value="api">API</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input value={editConfigForm.config_key} onChange={e => setEditConfigForm({ ...editConfigForm, config_key: e.target.value })} className="h-8 font-mono text-xs" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input value={editConfigForm.config_value} onChange={e => setEditConfigForm({ ...editConfigForm, config_value: e.target.value })} className="h-8 font-mono text-xs" />
                        <div className="flex items-center gap-1">
                          <Checkbox id={`edit-secret-${c.id}`} checked={editConfigForm.is_secret} onCheckedChange={v => setEditConfigForm({ ...editConfigForm, is_secret: !!v })} />
                          <Label htmlFor={`edit-secret-${c.id}`} className="text-xs whitespace-nowrap">Secreto</Label>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUpdateConfig(c.id)} disabled={configSaving}>
                          {configSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 text-green-500" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingConfig(null)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={c.id}>
                    <TableCell>{getCategoryBadge(c.config_category)}</TableCell>
                    <TableCell className="font-mono text-xs">{c.config_key}</TableCell>
                    <TableCell className="font-mono text-xs max-w-[300px] truncate">
                      {c.is_secret && !revealedSecrets.has(c.id) ? maskValue(c.config_value) : c.config_value}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {c.is_secret && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleReveal(c.id)}>
                            {revealedSecrets.has(c.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditConfig(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteConfig(c)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Config Dialog */}
      <AlertDialog open={!!deleteConfig} onOpenChange={o => !o && setDeleteConfig(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Configuração</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir <strong className="font-mono">{deleteConfig?.config_key}</strong>? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfig} disabled={configSaving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {configSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Franchise Wizard */}
      <FranchiseWizard open={wizardOpen} onOpenChange={setWizardOpen} users={users} onComplete={fetchOrganizations} />
    </>
  );
}
