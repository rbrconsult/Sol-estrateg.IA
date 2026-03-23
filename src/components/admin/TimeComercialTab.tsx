import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users, Loader2 } from "lucide-react";

interface TeamMember {
  id: string;
  franquia_id: string;
  nome: string;
  cargo: string | null;
  telefone: string | null;
  email: string | null;
  ativo: boolean;
  sm_id: number | null;
  krolik_id: string | null;
  krolik_setor_id: string | null;
  entra_random: boolean;
  created_at: string;
}

const EMPTY_FORM = {
  nome: "",
  cargo: "",
  telefone: "",
  email: "",
  franquia_id: "",
  ativo: true,
  entra_random: true,
  sm_id: "",
  krolik_id: "",
  krolik_setor_id: "",
};

export function TimeComercialTab() {
  const { userRole } = useAuth();
  const { orgs } = useOrgFilter();
  const isSuperAdmin = userRole === "super_admin";

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterFranquia, setFilterFranquia] = useState<string>("all");

  useEffect(() => { fetchMembers(); }, []);

  async function fetchMembers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("time_comercial" as any)
      .select("*")
      .order("nome");
    if (error) {
      toast.error("Erro ao carregar time comercial");
      console.error(error);
    }
    setMembers((data as any as TeamMember[]) || []);
    setLoading(false);
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(m: TeamMember) {
    setEditingId(m.id);
    setForm({
      nome: m.nome,
      cargo: m.cargo || "",
      telefone: m.telefone || "",
      email: m.email || "",
      franquia_id: m.franquia_id,
      ativo: m.ativo,
      entra_random: m.entra_random,
      sm_id: m.sm_id?.toString() || "",
      krolik_id: m.krolik_id || "",
      krolik_setor_id: m.krolik_setor_id || "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.nome || !form.franquia_id) {
      toast.error("Nome e Franquia são obrigatórios");
      return;
    }
    setSaving(true);
    const payload: any = {
      nome: form.nome,
      cargo: form.cargo || null,
      telefone: form.telefone || null,
      email: form.email || null,
      franquia_id: form.franquia_id,
      ativo: form.ativo,
      entra_random: form.entra_random,
      sm_id: form.sm_id ? parseInt(form.sm_id) : null,
      krolik_id: form.krolik_id || null,
      krolik_setor_id: form.krolik_setor_id || null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("time_comercial" as any).update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("time_comercial" as any).insert(payload));
    }

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success(editingId ? "Membro atualizado" : "Membro cadastrado");
      // Sync to Make via edge function
      syncToMake({ ...payload, id: editingId });
      setDialogOpen(false);
      fetchMembers();
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from("time_comercial" as any).delete().eq("id", deleteId);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Membro removido");
      fetchMembers();
    }
    setDeleteId(null);
  }

  async function handleToggleAtivo(m: TeamMember) {
    const newAtivo = !m.ativo;
    const { error } = await supabase
      .from("time_comercial" as any)
      .update({ ativo: newAtivo })
      .eq("id", m.id);
    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }
    toast.success(newAtivo ? "Ativado" : "Desativado");
    syncToMake({ ...m, ativo: newAtivo });
    setMembers(prev => prev.map(x => x.id === m.id ? { ...x, ativo: newAtivo } : x));
  }

  async function syncToMake(member: any) {
    try {
      await supabase.functions.invoke("sync-time-comercial", {
        body: {
          franquia_id: member.franquia_id,
          nome: member.nome,
          ativo: member.ativo,
          sm_id: member.sm_id,
          krolik_id: member.krolik_id,
          krolik_setor_id: member.krolik_setor_id,
        },
      });
    } catch (e) {
      console.warn("Make sync failed (DS ID may not be configured yet):", e);
    }
  }

  const franquias = [...new Set(members.map(m => m.franquia_id))];
  const filtered = filterFranquia === "all" ? members : members.filter(m => m.franquia_id === filterFranquia);

  const getFranquiaLabel = (slug: string) => {
    const org = orgs.find(o => o.slug === slug);
    return org?.name || slug;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Time Comercial
          </CardTitle>
          <CardDescription>
            {isSuperAdmin ? "Gerencie vendedores de todas as filiais" : "Vendedores da sua filial"}
          </CardDescription>
        </div>
        <div className="flex items-center gap-3">
          {isSuperAdmin && franquias.length > 1 && (
            <Select value={filterFranquia} onValueChange={setFilterFranquia}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar franquia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {franquias.map(f => (
                  <SelectItem key={f} value={f}>{getFranquiaLabel(f)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {isSuperAdmin && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Membro
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              {isSuperAdmin && <TableHead>Franquia</TableHead>}
              {!isSuperAdmin && <TableHead>Telefone</TableHead>}
              {isSuperAdmin && <TableHead>SM ID</TableHead>}
              {isSuperAdmin && <TableHead>Krolik ID</TableHead>}
              {isSuperAdmin && <TableHead>Entra Random</TableHead>}
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isSuperAdmin ? 7 : 5} className="text-center text-muted-foreground py-8">
                  Nenhum membro cadastrado
                </TableCell>
              </TableRow>
            ) : filtered.map(m => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.nome}</TableCell>
                <TableCell>{m.cargo || "—"}</TableCell>
                {isSuperAdmin && (
                  <TableCell>
                    <Badge variant="outline">{getFranquiaLabel(m.franquia_id)}</Badge>
                  </TableCell>
                )}
                {!isSuperAdmin && <TableCell>{m.telefone || "—"}</TableCell>}
                {isSuperAdmin && <TableCell className="font-mono text-xs">{m.sm_id || "—"}</TableCell>}
                {isSuperAdmin && <TableCell className="font-mono text-xs max-w-[120px] truncate">{m.krolik_id || "—"}</TableCell>}
                {isSuperAdmin && (
                  <TableCell>
                    <Switch
                      checked={m.entra_random}
                      onCheckedChange={async () => {
                        const newVal = !m.entra_random;
                        const { error } = await supabase
                          .from("time_comercial" as any)
                          .update({ entra_random: newVal })
                          .eq("id", m.id);
                        if (error) { toast.error("Erro ao atualizar"); return; }
                        toast.success(newVal ? "Entra no random" : "Removido do random");
                        setMembers(prev => prev.map(x => x.id === m.id ? { ...x, entra_random: newVal } : x));
                      }}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Switch
                    checked={m.ativo}
                    onCheckedChange={() => handleToggleAtivo(m)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  {isSuperAdmin && (
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(m.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Membro" : "Novo Membro"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} placeholder="Closer, SDR..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Franquia *</Label>
              <Select value={form.franquia_id} onValueChange={v => setForm(f => ({ ...f, franquia_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a franquia" />
                </SelectTrigger>
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
                <Input value={form.sm_id} onChange={e => setForm(f => ({ ...f, sm_id: e.target.value }))} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Krolik ID</Label>
                <Input value={form.krolik_id} onChange={e => setForm(f => ({ ...f, krolik_id: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Krolik Setor ID</Label>
                <Input value={form.krolik_setor_id} onChange={e => setForm(f => ({ ...f, krolik_setor_id: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.ativo} onCheckedChange={v => setForm(f => ({ ...f, ativo: v }))} />
                <Label>Ativo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.entra_random} onCheckedChange={v => setForm(f => ({ ...f, entra_random: v }))} />
                <Label>Entra no Random</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este membro do time comercial?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
