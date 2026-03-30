import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff, Check, X, Loader2,
  Settings, Webhook, Database, Key, Users as UsersIcon, Search, Megaphone,
  Archive, ChevronDown, Zap, Shield,
} from "lucide-react";

interface OrgConfig {
  id: string;
  config_key: string;
  config_value: string;
  config_category: string;
  is_secret: boolean;
}

interface OrgInfo {
  id: string;
  name: string;
  slug: string;
}

const CATEGORIES = [
  { value: "datastore", label: "Datastore v2", icon: Database, color: "text-emerald-400" },
  { value: "webhook", label: "Webhooks", icon: Webhook, color: "text-blue-400" },
  { value: "api", label: "API", icon: Key, color: "text-purple-400" },
  { value: "responsavel", label: "Responsáveis", icon: UsersIcon, color: "text-amber-400" },
  { value: "campanhas", label: "Campanhas", icon: Megaphone, color: "text-pink-400" },
  { value: "make", label: "Make", icon: Zap, color: "text-orange-400" },
  { value: "general", label: "Geral", icon: Settings, color: "text-muted-foreground" },
  { value: "datastore_legado", label: "DS Legado", icon: Archive, color: "text-zinc-500" },
];

const CATEGORY_ORDER = CATEGORIES.map(c => c.value);

export default function OrgConfigPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();

  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [configs, setConfigs] = useState<OrgConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());
  const [collapsedLegacy, setCollapsedLegacy] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ config_key: "", config_value: "", config_category: "general", is_secret: false });

  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({ config_key: "", config_value: "", config_category: "general", is_secret: false });

  const [deleteTarget, setDeleteTarget] = useState<OrgConfig | null>(null);

  useEffect(() => {
    if (!orgId) return;
    fetchData();
  }, [orgId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: orgData }, { data: configData }] = await Promise.all([
        supabase.from("organizations").select("id, name, slug").eq("id", orgId!).single(),
        supabase.from("organization_configs").select("id, config_key, config_value, config_category, is_secret").eq("organization_id", orgId!).order("config_category").order("config_key"),
      ]);
      setOrg(orgData);
      setConfigs(configData || []);
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return configs.filter((c) => {
      if (filterCategory !== "all" && c.config_category !== filterCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return c.config_key.toLowerCase().includes(q) || c.config_value.toLowerCase().includes(q);
      }
      return true;
    });
  }, [configs, search, filterCategory]);

  const grouped = useMemo(() => {
    const groups: Record<string, OrgConfig[]> = {};
    for (const c of filtered) {
      const cat = c.config_category || "general";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(c);
    }
    // Sort by CATEGORY_ORDER
    const sorted: [string, OrgConfig[]][] = [];
    for (const key of CATEGORY_ORDER) {
      if (groups[key]) sorted.push([key, groups[key]]);
    }
    // Any remaining
    for (const [key, items] of Object.entries(groups)) {
      if (!CATEGORY_ORDER.includes(key)) sorted.push([key, items]);
    }
    return sorted;
  }, [filtered]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    configs.forEach((c) => { counts[c.config_category] = (counts[c.config_category] || 0) + 1; });
    return counts;
  }, [configs]);

  const totalActive = useMemo(() => {
    return configs.filter(c => c.config_category !== 'datastore_legado').length;
  }, [configs]);

  const totalLegacy = categoryCounts['datastore_legado'] || 0;

  // CRUD
  const handleAdd = async () => {
    if (!orgId || !addForm.config_key || !addForm.config_value) {
      toast.error("Chave e valor são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("organization_configs").insert({
        organization_id: orgId,
        config_key: addForm.config_key,
        config_value: addForm.config_value,
        config_category: addForm.config_category,
        is_secret: addForm.is_secret,
      });
      if (error) throw error;
      toast.success("Configuração adicionada!");
      setAddForm({ config_key: "", config_value: "", config_category: "general", is_secret: false });
      setIsAdding(false);
      await fetchData();
    } catch (e: any) {
      toast.error(e.message || "Erro ao adicionar");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase.from("organization_configs").update({
        config_key: editForm.config_key,
        config_value: editForm.config_value,
        config_category: editForm.config_category,
        is_secret: editForm.is_secret,
      }).eq("id", id);
      if (error) throw error;
      toast.success("Configuração atualizada!");
      setEditingId(null);
      await fetchData();
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("organization_configs").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      toast.success("Configuração excluída!");
      setDeleteTarget(null);
      await fetchData();
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c: OrgConfig) => {
    setEditingId(c.id);
    setEditForm({ config_key: c.config_key, config_value: c.config_value, config_category: c.config_category, is_secret: c.is_secret });
  };

  const toggleReveal = (id: string) => {
    setRevealedSecrets((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const maskValue = (val: string) => val.length > 8 ? val.slice(0, 4) + "••••" + val.slice(-4) : "••••••••";

  const getCatMeta = (cat: string) => CATEGORIES.find((c) => c.value === cat) || CATEGORIES[0];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Organização não encontrada.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-4 w-4 mr-2" />Voltar
        </Button>
      </div>
    );
  }

  const renderConfigTable = (items: OrgConfig[], catMeta: ReturnType<typeof getCatMeta>) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[240px]">Chave</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead className="text-right w-[100px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((c) =>
          editingId === c.id ? (
            <TableRow key={c.id} className="bg-primary/5">
              <TableCell>
                <Input
                  value={editForm.config_key}
                  onChange={(e) => setEditForm({ ...editForm, config_key: e.target.value })}
                  className="h-8 font-mono text-xs"
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Input
                    value={editForm.config_value}
                    onChange={(e) => setEditForm({ ...editForm, config_value: e.target.value })}
                    className="h-8 font-mono text-xs flex-1"
                  />
                  <Select value={editForm.config_category} onValueChange={(v) => setEditForm({ ...editForm, config_category: v })}>
                    <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1 shrink-0">
                    <Checkbox
                      checked={editForm.is_secret}
                      onCheckedChange={(v) => setEditForm({ ...editForm, is_secret: !!v })}
                    />
                    <span className="text-[10px] text-muted-foreground">Secreto</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUpdate(c.id)} disabled={saving}>
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 text-emerald-500" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            <TableRow key={c.id}>
              <TableCell className="font-mono text-xs font-medium">{c.config_key}</TableCell>
              <TableCell className="font-mono text-xs max-w-[400px]">
                <span className="truncate block">
                  {c.is_secret && !revealedSecrets.has(c.id) ? maskValue(c.config_value) : c.config_value}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-0.5">
                  {c.is_secret && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleReveal(c.id)}>
                      {revealedSecrets.has(c.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(c)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(c)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
      {/* Header — Filial Identity Card */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2 bg-muted/40 border-b">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="shrink-0 h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>Scale</span>
            <ChevronDown className="h-3 w-3 -rotate-90" />
            <span className="text-foreground font-medium">SOL</span>
            <ChevronDown className="h-3 w-3 -rotate-90" />
            <span className="text-foreground font-medium">{org.name}</span>
          </div>
        </div>
        <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <span className="text-2xl">☀️</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{org.name}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] text-muted-foreground font-mono">{org.slug}</code>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-emerald-400 font-medium">{totalActive} ativas</span>
                </div>
                {totalLegacy > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                    <span className="text-xs text-zinc-500">{totalLegacy} legado</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="text-xs" disabled>
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Scale Wizard
            </Button>
            <Button size="sm" onClick={() => { setIsAdding(true); setAddForm({ config_key: "", config_value: "", config_category: "datastore", is_secret: false }); }}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />Nova Config
            </Button>
          </div>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            filterCategory === "all"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/50 bg-card text-muted-foreground hover:border-border"
          }`}
        >
          Todas ({configs.length})
        </button>
        {CATEGORIES.filter(c => c.value !== 'datastore_legado').map((cat) => {
          const count = categoryCounts[cat.value] || 0;
          if (count === 0) return null;
          const isActive = filterCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(isActive ? "all" : cat.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 bg-card text-muted-foreground hover:border-border"
              }`}
            >
              <cat.icon className={`h-3 w-3 ${cat.color}`} />
              {cat.label}
              <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por chave ou valor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Add form */}
      {isAdding && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />Nova Configuração
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Chave</Label>
                <Input
                  value={addForm.config_key}
                  onChange={(e) => setAddForm({ ...addForm, config_key: e.target.value })}
                  placeholder="ex: ds_sol_config, webhook_xyz"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Categoria</Label>
                <Select value={addForm.config_category} onValueChange={(v) => setAddForm({ ...addForm, config_category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Valor</Label>
              <Input
                value={addForm.config_value}
                onChange={(e) => setAddForm({ ...addForm, config_value: e.target.value })}
                placeholder="ID, URL ou token..."
                className="font-mono text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="add-secret"
                checked={addForm.is_secret}
                onCheckedChange={(v) => setAddForm({ ...addForm, is_secret: !!v })}
              />
              <Label htmlFor="add-secret" className="text-xs">Valor secreto (ocultar por padrão)</Label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
                <X className="h-3.5 w-3.5 mr-1" />Cancelar
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {grouped.length === 0 && !isAdding && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Settings className="h-8 w-8 mb-3 opacity-40" />
            <p className="text-sm">
              {search || filterCategory !== "all"
                ? "Nenhuma configuração encontrada com esses filtros."
                : "Nenhuma configuração cadastrada."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Active configs (non-legacy) */}
      {grouped
        .filter(([category]) => category !== 'datastore_legado')
        .map(([category, items]) => {
          const catMeta = getCatMeta(category);
          return (
            <Card key={category}>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <catMeta.icon className={`h-4 w-4 ${catMeta.color}`} />
                  {catMeta.label}
                  <Badge variant="secondary" className="ml-auto text-[10px] font-mono">{items.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {renderConfigTable(items, catMeta)}
              </CardContent>
            </Card>
          );
        })}

      {/* Legacy DS — collapsible */}
      {grouped.some(([cat]) => cat === 'datastore_legado') && (
        <Collapsible open={!collapsedLegacy} onOpenChange={(open) => setCollapsedLegacy(!open)}>
          <Card className="border-zinc-800/50 bg-card/50">
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-2 pt-4 px-4 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
                <CardTitle className="text-sm flex items-center gap-2 text-zinc-500">
                  <Archive className="h-4 w-4" />
                  DataStores Legado
                  <Badge variant="outline" className="ml-1 text-[10px] font-mono border-zinc-700 text-zinc-500">
                    {totalLegacy}
                  </Badge>
                  <span className="text-[10px] text-zinc-600 ml-1">— substituídos por v2</span>
                  <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${!collapsedLegacy ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="p-0">
                {renderConfigTable(
                  grouped.find(([cat]) => cat === 'datastore_legado')?.[1] || [],
                  getCatMeta('datastore_legado')
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Configuração</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong className="font-mono">{deleteTarget?.config_key}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
