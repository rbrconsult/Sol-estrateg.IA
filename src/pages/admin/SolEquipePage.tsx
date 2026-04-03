import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Pencil, Users } from "lucide-react";
import { useSolEquipe, useSolEquipeUpdate, useSolEquipeInsert, type SolEquipeMembro } from "@/hooks/useSolData";
import { useFranquiaId } from "@/hooks/useFranquiaId";

export default function SolEquipePage() {
  const { data: equipe, isLoading } = useSolEquipe();
  const updateEquipe = useSolEquipeUpdate();
  const insertEquipe = useSolEquipeInsert();
  const franquiaId = useFranquiaId();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", cargo: "", sm_id: "", krolik_id: "", krolik_setor_id: "", gestor_key: "" });

  // Gestores = members with cargo gerente/diretor
  const gestores = useMemo(() => {
    if (!equipe) return [];
    return equipe.filter(m => 
      m.cargo?.toLowerCase().includes("gerente") || 
      m.cargo?.toLowerCase().includes("diretor") ||
      m.cargo?.toLowerCase().includes("gestor")
    );
  }, [equipe]);

  const gestorMap = useMemo(() => {
    const map: Record<string, string> = {};
    (equipe || []).forEach(m => { map[m.key] = m.nome || m.key; });
    return map;
  }, [equipe]);

  const openCreate = () => {
    setEditingKey(null);
    setForm({ nome: "", cargo: "closer", sm_id: "", krolik_id: "", krolik_setor_id: "67ddafcb1446d3c5aa5f66c6", gestor_key: "" });
    setDialogOpen(true);
  };

  const openEdit = (m: SolEquipeMembro) => {
    setEditingKey(m.key);
    setForm({
      nome: m.nome || "",
      cargo: m.cargo || "",
      sm_id: m.sm_id?.toString() || "",
      krolik_id: m.krolik_id || "",
      krolik_setor_id: m.krolik_setor_id || "",
      gestor_key: m.gestor_key || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome) return;
    if (editingKey) {
      await updateEquipe.mutateAsync({
        key: editingKey,
        updates: {
          nome: form.nome,
          cargo: form.cargo || null,
          sm_id: form.sm_id ? parseInt(form.sm_id) : null,
          krolik_id: form.krolik_id || null,
          krolik_setor_id: form.krolik_setor_id || null,
          gestor_key: form.gestor_key || null,
        },
      });
    } else {
      await insertEquipe.mutateAsync({
        key: `${franquiaId}_${form.nome.toLowerCase().replace(/ /g, "_")}`,
        franquia_id: franquiaId,
        nome: form.nome,
        cargo: form.cargo || null,
        ativo: true,
        krolik_ativo: false,
        sm_id: form.sm_id ? parseInt(form.sm_id) : null,
        krolik_id: form.krolik_id || null,
        krolik_setor_id: form.krolik_setor_id || "67ddafcb1446d3c5aa5f66c6",
        gestor_key: form.gestor_key || null,
      });
    }
    setDialogOpen(false);
  };

  const toggleField = async (member: SolEquipeMembro, field: "ativo" | "krolik_ativo") => {
    await updateEquipe.mutateAsync({ key: member.key, updates: { [field]: !member[field] } });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Equipe Comercial</CardTitle>
            <CardDescription>Closers com "Recebe Leads" ativo entram no round-robin automático. Vincule cada closer ao seu Gestor.</CardDescription>
          </div>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Adicionar</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Gestor</TableHead>
                <TableHead className="text-center">SM ID</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                <TableHead className="text-center">Recebe Leads</TableHead>
                <TableHead>Pico</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!equipe || equipe.length === 0) ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum membro</TableCell></TableRow>
              ) : equipe.map(m => (
                <TableRow key={m.key}>
                  <TableCell className="font-medium">{m.nome}</TableCell>
                  <TableCell><Badge variant="outline">{m.cargo || "—"}</Badge></TableCell>
                  <TableCell>
                    {m.gestor_key ? (
                      <Badge variant="secondary" className="text-xs">
                        {gestorMap[m.gestor_key] || m.gestor_key}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs">{m.sm_id || "—"}</TableCell>
                  <TableCell className="text-center"><Switch checked={!!m.ativo} onCheckedChange={() => toggleField(m, "ativo")} /></TableCell>
                  <TableCell className="text-center"><Switch checked={!!m.krolik_ativo} onCheckedChange={() => toggleField(m, "krolik_ativo")} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.horario_pico_inicio || "08"}-{m.horario_pico_fim || "12"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingKey ? "Editar" : "Novo"} Membro</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Cargo</Label><Input value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} placeholder="closer" /></div>
            </div>
            <div className="space-y-2">
              <Label>Gestor Atribuído</Label>
              <Select value={form.gestor_key || "none"} onValueChange={v => setForm(f => ({ ...f, gestor_key: v === "none" ? "" : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gestor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem gestor</SelectItem>
                  {gestores.map(g => (
                    <SelectItem key={g.key} value={g.key}>{g.nome} ({g.cargo})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">O gerente vinculado verá apenas os leads dos closers sob sua gestão.</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>SM ID</Label><Input value={form.sm_id} onChange={e => setForm(f => ({ ...f, sm_id: e.target.value }))} type="number" /></div>
              <div className="space-y-2"><Label>Krolik ID</Label><Input value={form.krolik_id} onChange={e => setForm(f => ({ ...f, krolik_id: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Setor ID</Label><Input value={form.krolik_setor_id} onChange={e => setForm(f => ({ ...f, krolik_setor_id: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={updateEquipe.isPending || insertEquipe.isPending}>
              {(updateEquipe.isPending || insertEquipe.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}