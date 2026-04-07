import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff, Check, X, Loader2,
  Settings, Webhook, Database, Key, Users as UsersIcon, Search, Megaphone,
  Archive, ChevronDown, Zap, Shield, Copy, ExternalLink,
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
  { value: "datastore", label: "Datastore v2", icon: Database, color: "text-emerald-500", bg: "from-emerald-500/10 to-emerald-600/5", border: "border-emerald-500/20", badgeBg: "bg-emerald-500/15 text-emerald-500" },
  { value: "webhook", label: "Webhooks", icon: Webhook, color: "text-blue-500", bg: "from-blue-500/10 to-blue-600/5", border: "border-blue-500/20", badgeBg: "bg-blue-500/15 text-blue-500" },
  { value: "api", label: "API Keys", icon: Key, color: "text-purple-500", bg: "from-purple-500/10 to-purple-600/5", border: "border-purple-500/20", badgeBg: "bg-purple-500/15 text-purple-500" },
  { value: "responsavel", label: "Responsáveis", icon: UsersIcon, color: "text-amber-500", bg: "from-amber-500/10 to-amber-600/5", border: "border-amber-500/20", badgeBg: "bg-amber-500/15 text-amber-500" },
  { value: "campanhas", label: "Campanhas", icon: Megaphone, color: "text-pink-500", bg: "from-pink-500/10 to-pink-600/5", border: "border-pink-500/20", badgeBg: "bg-pink-500/15 text-pink-500" },
  { value: "make", label: "Make", icon: Zap, color: "text-orange-500", bg: "from-orange-500/10 to-orange-600/5", border: "border-orange-500/20", badgeBg: "bg-orange-500/15 text-orange-500" },
  { value: "general", label: "Geral", icon: Settings, color: "text-muted-foreground", bg: "from-muted/30 to-muted/10", border: "border-border", badgeBg: "bg-muted text-muted-foreground" },
  { value: "datastore_legado", label: "DS Legado", icon: Archive, color: "text-zinc-500", bg: "from-zinc-500/10 to-zinc-600/5", border: "border-zinc-500/20", badgeBg: "bg-zinc-500/15 text-zinc-500" },
];

const CATEGORY_ORDER = CATEGORIES.map(c => c.value);

export default function OrgConfigPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [configs, setConfigs] = useState<OrgConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());
  const [collapsedLegacy, setCollapsedLegacy] = useState(true);

  // Edit dialog
  const [editTarget, setEditTarget] = useState<OrgConfig | null>(null);
  const [editForm, setEditForm] = useState({ config_key: "", config_value: "", config_category: "general", is_secret: false });

  // Add dialog
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
    const sorted: [string, OrgConfig[]][] = [];
    for (const key of CATEGORY_ORDER) {
      if (groups[key]) sorted.push([key, groups[key]]);
    }
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

  const totalActive = configs.filter(c => c.config_category !== 'datastore_legado').length;
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
      await queryClient.invalidateQueries({ queryKey: ["comercial-closer-allowlist", orgId] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao adicionar");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("organization_configs").update({
        config_key: editForm.config_key,
        config_value: editForm.config_value,
        config_category: editForm.config_category,
        is_secret: editForm.is_secret,
      }).eq("id", editTarget.id);
      if (error) throw error;
      toast.success("Configuração atualizada!");
      setEditTarget(null);
      await fetchData();
      await queryClient.invalidateQueries({ queryKey: ["comercial-closer-allowlist", orgId] });
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
      await queryClient.invalidateQueries({ queryKey: ["comercial-closer-allowlist", orgId] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c: OrgConfig) => {
    setEditTarget(c);
    setEditForm({ config_key: c.config_key, config_value: c.config_value, config_category: c.config_category, is_secret: c.is_secret });
  };

  const toggleReveal = (id: string) => {
    setRevealedSecrets((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const copyValue = (val: string) => {
    navigator.clipboard.writeText(val);
    toast.success("Copiado!");
  };

  const maskValue = (val: string) => val.length > 8 ? val.slice(0, 4) + "••••" + val.slice(-4) : "••••••••";

  const getCatMeta = (cat: string) => CATEGORIES.find((c) => c.value === cat) || CATEGORIES.find(c => c.value === 'general')!;

  const isUrl = (val: string) => /^https?:\/\//.test(val);

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

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2 bg-muted/40 border-b">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="shrink-0 h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>Admin</span>
            <ChevronDown className="h-3 w-3 -rotate-90" />
            <span className="text-foreground font-medium">Filiais</span>
            <ChevronDown className="h-3 w-3 -rotate-90" />
            <span className="text-foreground font-medium">{org.name}</span>
          </div>
        </div>
        <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center shrink-0">
              <span className="text-2xl">☀️</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{org.name}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] text-muted-foreground font-mono">{org.slug}</code>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-emerald-500 font-medium">{totalActive} ativas</span>
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
          <Button size="sm" onClick={() => { setIsAdding(true); setAddForm({ config_key: "", config_value: "", config_category: "datastore", is_secret: false }); }}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />Nova Config
          </Button>
        </div>
      </div>

      {/* Category Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {CATEGORIES.filter(c => c.value !== 'datastore_legado').map((cat) => {
          const count = categoryCounts[cat.value] || 0;
          const isActive = filterCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(isActive ? "all" : cat.value)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all ${
                isActive
                  ? `bg-gradient-to-br ${cat.bg} ${cat.border} shadow-sm`
                  : "bg-card border-border/50 hover:border-border hover:bg-muted/30"
              }`}
            >
              <cat.icon className={`h-4 w-4 shrink-0 ${cat.color}`} />
              <div className="min-w-0">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none">{cat.label}</div>
                <div className={`text-lg font-bold leading-tight ${count > 0 ? "text-foreground" : "text-muted-foreground/40"}`}>{count}</div>
              </div>
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
        {filterCategory !== "all" && (
          <Button variant="ghost" size="sm" className="absolute right-2 top-1.5 h-7 text-xs" onClick={() => setFilterCategory("all")}>
            Limpar filtro
          </Button>
        )}
      </div>

      {/* Empty state */}
      {grouped.length === 0 && (
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

      {/* Active configs — Card Grid per Category */}
      {grouped
        .filter(([category]) => category !== 'datastore_legado')
        .map(([category, items]) => {
          const catMeta = getCatMeta(category);
          return (
            <div key={category} className="space-y-3">
              {/* Category Header */}
              <div className="flex items-center gap-2">
                <catMeta.icon className={`h-4 w-4 ${catMeta.color}`} />
                <h3 className="text-sm font-semibold text-foreground">{catMeta.label}</h3>
                <Badge variant="outline" className="text-[10px] font-mono">{items.length}</Badge>
                <div className="flex-1 h-px bg-border/40" />
              </div>

              {/* Config Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((c) => {
                  const isRevealed = revealedSecrets.has(c.id);
                  const displayValue = c.is_secret && !isRevealed ? maskValue(c.config_value) : c.config_value;
                  const isUrlVal = isUrl(c.config_value);

                  return (
                    <Card
                      key={c.id}
                      className={`group relative bg-gradient-to-br ${catMeta.bg} ${catMeta.border} hover:shadow-md transition-all`}
                    >
                      <CardContent className="p-3 space-y-2">
                        {/* Key name */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-semibold text-foreground truncate">{c.config_key}</span>
                          {c.is_secret && (
                            <Badge variant="outline" className="text-[8px] shrink-0 border-destructive/30 text-destructive">🔒</Badge>
                          )}
                        </div>

                        {/* Value */}
                        <div className="bg-background/60 rounded-md px-2.5 py-2 min-h-[36px] flex items-center">
                          <span className={`font-mono text-[11px] break-all leading-relaxed flex-1 ${c.is_secret && !isRevealed ? "text-muted-foreground/60 select-none" : "text-foreground/80"}`}>
                            {displayValue.length > 100 ? displayValue.slice(0, 100) + "…" : displayValue}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {c.is_secret && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleReveal(c.id)}>
                              {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyValue(c.config_value)} title="Copiar">
                            <Copy className="h-3 w-3" />
                          </Button>
                          {isUrlVal && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(c.config_value, '_blank')} title="Abrir URL">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                          <div className="flex-1" />
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(c)} title="Editar">
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(c)} title="Excluir">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

      {/* Legacy DS — collapsible */}
      {grouped.some(([cat]) => cat === 'datastore_legado') && (
        <Collapsible open={!collapsedLegacy} onOpenChange={(open) => setCollapsedLegacy(!open)}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center gap-2 px-4 py-3 rounded-lg border border-zinc-500/20 bg-card/50 hover:bg-muted/30 transition-colors text-left">
              <Archive className="h-4 w-4 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-500">DataStores Legado</span>
              <Badge variant="outline" className="text-[10px] font-mono border-zinc-700 text-zinc-500">{totalLegacy}</Badge>
              <span className="text-[10px] text-zinc-600">— substituídos por v2</span>
              <ChevronDown className={`h-4 w-4 ml-auto text-zinc-500 transition-transform ${!collapsedLegacy ? 'rotate-180' : ''}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(grouped.find(([cat]) => cat === 'datastore_legado')?.[1] || []).map((c) => {
                const isRevealed = revealedSecrets.has(c.id);
                const displayValue = c.is_secret && !isRevealed ? maskValue(c.config_value) : c.config_value;
                return (
                  <Card key={c.id} className="group bg-zinc-500/5 border-zinc-500/15 opacity-60 hover:opacity-100 transition-all">
                    <CardContent className="p-3 space-y-2">
                      <span className="font-mono text-xs font-medium text-zinc-500 truncate block">{c.config_key}</span>
                      <div className="bg-background/40 rounded-md px-2.5 py-2">
                        <span className="font-mono text-[11px] text-zinc-500 break-all">
                          {displayValue.length > 80 ? displayValue.slice(0, 80) + "…" : displayValue}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {c.is_secret && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleReveal(c.id)}>
                            {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                        )}
                        <div className="flex-1" />
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(c)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(c)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* ═══ DIALOG: Edit Config ═══ */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              Editar Configuração
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Chave</Label>
              <Input value={editForm.config_key} onChange={(e) => setEditForm({ ...editForm, config_key: e.target.value })} className="font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Valor</Label>
              <Input value={editForm.config_value} onChange={(e) => setEditForm({ ...editForm, config_value: e.target.value })} className="font-mono text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Categoria</Label>
                <Select value={editForm.config_category} onValueChange={(v) => setEditForm({ ...editForm, config_category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span className="flex items-center gap-2"><cat.icon className={`h-3 w-3 ${cat.color}`} />{cat.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Checkbox id="edit-secret" checked={editForm.is_secret} onCheckedChange={(v) => setEditForm({ ...editForm, is_secret: !!v })} />
                <Label htmlFor="edit-secret" className="text-xs">Valor secreto</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DIALOG: Add Config ═══ */}
      <Dialog open={isAdding} onOpenChange={(open) => !open && setIsAdding(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Nova Configuração
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Chave</Label>
              <Input value={addForm.config_key} onChange={(e) => setAddForm({ ...addForm, config_key: e.target.value })} className="font-mono text-sm" placeholder="ex: ds_sol_config, webhook_xyz" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Valor</Label>
              <Input value={addForm.config_value} onChange={(e) => setAddForm({ ...addForm, config_value: e.target.value })} className="font-mono text-sm" placeholder="ID, URL ou token..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Categoria</Label>
                <Select value={addForm.config_category} onValueChange={(v) => setAddForm({ ...addForm, config_category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span className="flex items-center gap-2"><cat.icon className={`h-3 w-3 ${cat.color}`} />{cat.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Checkbox id="add-secret" checked={addForm.is_secret} onCheckedChange={(v) => setAddForm({ ...addForm, is_secret: !!v })} />
                <Label htmlFor="add-secret" className="text-xs">Valor secreto</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
