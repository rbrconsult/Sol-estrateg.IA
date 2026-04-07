import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ArrowLeft, ArrowRight, Check, Building2, Users } from "lucide-react";
import { MODULE_DEFINITIONS } from "@/hooks/useModulePermissions";
import { APP_ROLE_LABELS } from "@/lib/appRoleLabels";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface FilialPessoasUserOption {
  id: string;
  email: string;
  full_name: string | null;
}

interface NewPersonRow {
  email: string;
  full_name: string;
  password: string;
  role: AppRole;
}

interface FilialPessoasWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingUsers: FilialPessoasUserOption[];
  onComplete: () => void;
}

const STEPS = [
  { label: "Filial", icon: Building2 },
  { label: "Equipe", icon: Users },
];

const WIZARD_ROLES: AppRole[] = ["user", "closer", "gerente", "diretor"];

function generateSlug(val: string) {
  return val
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function FilialPessoasWizard({ open, onOpenChange, existingUsers, onComplete }: FilialPessoasWizardProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [newPeople, setNewPeople] = useState<NewPersonRow[]>([
    { email: "", full_name: "", password: "", role: "user" },
  ]);

  const resetForm = () => {
    setStep(0);
    setName("");
    setSlug("");
    setSelectedUserIds([]);
    setNewPeople([{ email: "", full_name: "", password: "", role: "user" }]);
  };

  const filledNewRows = newPeople.filter((r) => r.email.trim() || r.password.trim() || r.full_name.trim());

  const newRowsValid =
    filledNewRows.length === 0 ||
    filledNewRows.every((r) => r.email.trim().length > 0 && r.password.length >= 6);

  const canNext = () => {
    if (step === 0) return name.trim().length > 0 && slug.trim().length > 0;
    if (step === 1) {
      const hasTeam = selectedUserIds.length > 0 || filledNewRows.length > 0;
      return hasTeam && newRowsValid;
    }
    return false;
  };

  const toggleUser = (uid: string) => {
    setSelectedUserIds((prev) => (prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]));
  };

  const addNewRow = () => setNewPeople((p) => [...p, { email: "", full_name: "", password: "", role: "user" }]);
  const removeNewRow = (i: number) => setNewPeople((p) => (p.length <= 1 ? p : p.filter((_, idx) => idx !== i)));
  const updateNewRow = (i: number, patch: Partial<NewPersonRow>) => {
    setNewPeople((p) => {
      const next = [...p];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  };

  const createUserViaEdge = async (
    email: string,
    password: string,
    full_name: string,
    role: AppRole,
    organization_id: string,
  ) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("manage-users", {
      body: { action: "create", email, password, full_name, role, organization_id },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (res.error) throw new Error(res.error.message);
    if (res.data?.error) throw new Error(res.data.error);
    return res.data.user.id as string;
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: name.trim(), slug: slug.trim(), settings: {} })
        .select("id")
        .single();

      if (orgError) throw orgError;
      const orgId = org.id;

      const createdIds: string[] = [];
      for (const row of filledNewRows) {
        const id = await createUserViaEdge(row.email.trim(), row.password, row.full_name.trim(), row.role, orgId);
        createdIds.push(id);
      }

      const allUserIds = [...new Set([...selectedUserIds, ...createdIds])];

      if (allUserIds.length > 0) {
        const members = allUserIds.map((uid) => ({
          organization_id: orgId,
          user_id: uid,
          role: "user" as const,
        }));
        const { error: memError } = await supabase.from("organization_members").insert(members);
        if (memError) throw memError;

        /* Só logins criados agora recebem “todos os módulos”; quem já existia mantém o que está em Módulos */
        if (createdIds.length > 0) {
          const modulePerms = createdIds.flatMap((uid) =>
            MODULE_DEFINITIONS.map((m) => ({
              user_id: uid,
              module_key: m.key,
              enabled: true,
            })),
          );
          const { error: permError } = await supabase.from("user_module_permissions").upsert(modulePerms, {
            onConflict: "user_id,module_key",
          });
          if (permError) console.error("user_module_permissions", permError);
        }

        for (const uid of allUserIds) {
          await supabase.from("profiles").update({ organization_id: orgId }).eq("id", uid);
        }
      }

      toast.success(`Filial "${name}" criada com ${allUserIds.length} pessoa(s) vinculada(s).`);
      resetForm();
      onOpenChange(false);
      onComplete();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao criar filial";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Nova filial + equipe
          </DialogTitle>
          <DialogDescription>
            Dois passos: filial e equipe. <strong>Papel</strong> (Diretor, Closer…) é a função no sistema; <strong>quais módulos</strong> cada
            um vê fica em Admin → Módulos. Integração Make: assistente técnico completo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-1 py-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.label} className="flex items-center gap-1 flex-1 min-w-0">
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isDone
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`h-px flex-1 min-w-[8px] ${isDone ? "bg-primary" : "bg-border"}`} />}
              </div>
            );
          })}
        </div>

        <div className="min-h-[240px] py-2 space-y-4">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label>Nome da filial *</Label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) setSlug(generateSlug(e.target.value));
                  }}
                  placeholder="Ex: Evolve - Filial Olímpia"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input value={slug} onChange={(e) => setSlug(generateSlug(e.target.value))} placeholder="evolve-olimpia" />
                <p className="text-xs text-muted-foreground">Identificador único (URL / sync). Letras minúsculas e hífens.</p>
              </div>
            </>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Usuários já existentes na plataforma</p>
                <p className="text-xs text-muted-foreground mb-2">Marque quem entra nesta filial agora.</p>
                <div className="max-h-[160px] overflow-y-auto space-y-1 rounded-md border p-2">
                  {existingUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleUser(u.id)}
                      className={`flex w-full items-center gap-3 rounded-md p-2 text-left text-sm transition-colors ${
                        selectedUserIds.includes(u.id) ? "bg-primary/10 border border-primary/30" : "hover:bg-muted border border-transparent"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          selectedUserIds.includes(u.id) ? "border-primary bg-primary" : "border-muted-foreground/30"
                        }`}
                      >
                        {selectedUserIds.includes(u.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{u.full_name || u.email}</span>
                      <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                    </button>
                  ))}
                  {existingUsers.length === 0 && (
                    <p className="text-xs text-muted-foreground py-4 text-center">Nenhum outro usuário listado.</p>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Novos logins</p>
                    <p className="text-xs text-muted-foreground">
                      Criação de conta exige perfil <strong>super admin</strong> no sistema. Caso contrário, use apenas usuários existentes.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addNewRow}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Linha
                  </Button>
                </div>
                <div className="space-y-2">
                  {newPeople.map((row, i) => (
                    <div key={i} className="grid grid-cols-1 gap-2 rounded-md border bg-muted/20 p-2 sm:grid-cols-12">
                      <div className="sm:col-span-4 space-y-1">
                        <Label className="text-[10px]">E-mail *</Label>
                        <Input
                          className="h-8 text-xs"
                          type="email"
                          value={row.email}
                          onChange={(e) => updateNewRow(i, { email: e.target.value })}
                          placeholder="email@empresa.com"
                        />
                      </div>
                      <div className="sm:col-span-3 space-y-1">
                        <Label className="text-[10px]">Nome</Label>
                        <Input
                          className="h-8 text-xs"
                          value={row.full_name}
                          onChange={(e) => updateNewRow(i, { full_name: e.target.value })}
                          placeholder="Nome completo"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-[10px]">Senha *</Label>
                        <Input
                          className="h-8 text-xs"
                          type="password"
                          value={row.password}
                          onChange={(e) => updateNewRow(i, { password: e.target.value })}
                          placeholder="mín. 6"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-[10px]">Papel (função)</Label>
                        <Select value={row.role} onValueChange={(v: AppRole) => updateNewRow(i, { role: v })}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {WIZARD_ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {APP_ROLE_LABELS[r] ?? r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end justify-end sm:col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeNewRow(i)}
                          disabled={newPeople.length <= 1}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                Logins <strong>criados neste assistente</strong> começam com todos os módulos liberados. Quem você só marcou na lista acima{" "}
                <strong>não</strong> tem permissões alteradas — ajuste telas na aba <strong className="text-foreground">Módulos</strong>.
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={() => (step > 0 ? setStep(step - 1) : onOpenChange(false))}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {step === 0 ? "Cancelar" : "Voltar"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
              Próximo
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving || !canNext()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Check className="mr-1 h-4 w-4" />
              Criar filial
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
