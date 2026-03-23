import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, User, Building2, LayoutGrid, MessageSquare, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { MODULE_DEFINITIONS } from '@/hooks/useModulePermissions';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  organizations: { id: string; name: string }[];
}

const DEFAULT_PASSWORD = 'Sol1.3strat3g51@';

const STEPS = [
  { id: 'dados', label: 'Dados', icon: User },
  { id: 'filial', label: 'Filial', icon: Building2 },
  { id: 'modulos', label: 'Módulos', icon: LayoutGrid },
  { id: 'confirmar', label: 'Confirmar', icon: CheckCircle2 },
];

export function UserCreationWizard({ open, onOpenChange, onSuccess, organizations }: Props) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: User data
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AppRole>('user');

  // Step 2: Franchise
  const [organizationId, setOrganizationId] = useState('00000000-0000-0000-0000-000000000001');
  const [krolicAtivo, setKrolicAtivo] = useState(true);
  const [smId, setSmId] = useState('');
  const [cargo, setCargo] = useState('Closer');

  // Step 3: Modules
  const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    MODULE_DEFINITIONS.forEach(m => { initial[m.key] = true; });
    return initial;
  });

  // Step 4: WhatsApp
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(0);
      setEmail('');
      setFullName('');
      setPhone('');
      setRole('user');
      setOrganizationId('00000000-0000-0000-0000-000000000001');
      setKrolicAtivo(true);
      setSmId('');
      setCargo('Closer');
      setSendWhatsApp(true);
      const initial: Record<string, boolean> = {};
      MODULE_DEFINITIONS.forEach(m => { initial[m.key] = true; });
      setModuleAccess(initial);
    }
  }, [open]);

  const selectedOrg = organizations.find(o => o.id === organizationId);

  const canProceed = () => {
    if (step === 0) return !!email && !!fullName;
    return true;
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      // 1. Create user via edge function
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'create',
          email,
          password: DEFAULT_PASSWORD,
          full_name: fullName,
          role,
          organization_id: organizationId,
          phone: phone.replace(/\D/g, ''),
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const userId = data?.user?.id;
      if (!userId) throw new Error('User ID not returned');

      // 2. Set module permissions (disable those unchecked)
      const disabledModules = Object.entries(moduleAccess)
        .filter(([_, enabled]) => !enabled)
        .map(([key]) => key);

      if (disabledModules.length > 0) {
        const rows = disabledModules.map(moduleKey => ({
          user_id: userId,
          module_key: moduleKey,
          enabled: false,
        }));
        await supabase.from('user_module_permissions').insert(rows as any);
      }

      // 3. Add to time_comercial if Krolic is active
      if (krolicAtivo && fullName) {
        const orgSlug = selectedOrg ? organizations.find(o => o.id === organizationId) : null;
        // Get org slug
        const { data: orgData } = await supabase
          .from('organizations')
          .select('slug')
          .eq('id', organizationId)
          .single();

        if (orgData?.slug) {
          await supabase.from('time_comercial').insert({
            nome: fullName,
            franquia_id: orgData.slug,
            cargo,
            telefone: phone.replace(/\D/g, ''),
            email,
            ativo: true,
            krolic: krolicAtivo,
            sm_id: smId ? parseInt(smId) : null,
          } as any);
        }
      }

      // 4. Send WhatsApp welcome message
      if (sendWhatsApp && phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        const message = `🌞 *Bem-vindo(a) à Sol Estrateg.IA!*\n\nOlá ${fullName}! 👋\n\nSeu acesso foi criado com sucesso.\n\n🔐 *Credenciais de acesso:*\n📧 Email: ${email}\n🔑 Senha: ${DEFAULT_PASSWORD}\n\n🌐 Acesse: ${window.location.origin}\n\n⚠️ Recomendamos alterar sua senha no primeiro acesso.\n\nQualquer dúvida, estamos à disposição!`;

        try {
          await supabase.functions.invoke('send-whatsapp-alert', {
            body: { phone: cleanPhone, message }
          });
        } catch (whatsappError) {
          console.warn('WhatsApp welcome message failed:', whatsappError);
          // Don't block user creation
        }
      }

      toast.success(`Usuário ${fullName} criado com sucesso!`);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  const toggleAllModules = (enabled: boolean) => {
    const next: Record<string, boolean> = {};
    MODULE_DEFINITIONS.forEach(m => { next[m.key] = enabled; });
    setModuleAccess(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Novo Usuário
          </DialogTitle>
          <DialogDescription>Cadastro em {STEPS.length} etapas</DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.id} className="flex items-center gap-1">
                <div className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-medium transition-colors ${
                  isDone ? 'bg-primary text-primary-foreground' :
                  isActive ? 'bg-primary/20 text-primary border-2 border-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={`text-xs hidden sm:inline ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && <div className="w-4 sm:w-8 h-px bg-border mx-1" />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Dados */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nome do colaborador" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@empresa.com" />
            </div>
            <div className="space-y-2">
              <Label>Telefone (WhatsApp)</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="5517991234567" />
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Select value={role} onValueChange={(v: AppRole) => setRole(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              🔑 Senha padrão: <code className="bg-background px-1 rounded">{DEFAULT_PASSWORD}</code>
            </div>
          </div>
        )}

        {/* Step 2: Filial & Krolic */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Filial</Label>
              <Select value={organizationId} onValueChange={setOrganizationId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-medium">Time Comercial</h4>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Ativo na Krolic (Roleta)</Label>
                  <p className="text-xs text-muted-foreground">Incluir na distribuição de leads</p>
                </div>
                <Switch checked={krolicAtivo} onCheckedChange={setKrolicAtivo} />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Select value={cargo} onValueChange={setCargo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Closer">Closer</SelectItem>
                    <SelectItem value="SDR">SDR</SelectItem>
                    <SelectItem value="Gerente">Gerente</SelectItem>
                    <SelectItem value="Analista">Analista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ID SolarMarket (SM)</Label>
                <Input value={smId} onChange={e => setSmId(e.target.value)} placeholder="Ex: 3766" type="number" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Módulos */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Permissões de Módulos</Label>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => toggleAllModules(true)} className="text-xs h-7">
                  Todos
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleAllModules(false)} className="text-xs h-7">
                  Nenhum
                </Button>
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto pr-1 space-y-1">
              {MODULE_GROUPS.map(group => {
                const groupKeys = group.keys;
                const allEnabled = groupKeys.every(k => moduleAccess[k] ?? true);
                const someEnabled = groupKeys.some(k => moduleAccess[k] ?? true);
                return (
                  <Collapsible key={group.label} defaultOpen>
                    <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1.5">
                      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors">
                        <ChevronRight className="h-3.5 w-3.5 transition-transform data-[state=open]:rotate-90" />
                        {group.icon} {group.label}
                      </CollapsibleTrigger>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost" size="sm" className="text-[10px] h-6 px-2"
                          onClick={() => toggleGroupModules(groupKeys, !allEnabled)}
                        >
                          {allEnabled ? 'Restringir' : 'Liberar'}
                        </Button>
                        <div className={`h-2 w-2 rounded-full ${allEnabled ? 'bg-emerald-500' : someEnabled ? 'bg-amber-500' : 'bg-destructive'}`} />
                      </div>
                    </div>
                    <CollapsibleContent>
                      <div className="pl-6 space-y-0.5 mt-0.5">
                        {groupKeys.map(key => {
                          const m = MODULE_DEFINITIONS.find(md => md.key === key);
                          if (!m) return null;
                          return (
                            <div key={m.key} className="flex items-center justify-between py-1 px-3 rounded-md hover:bg-muted/50">
                              <div>
                                <span className="text-sm">{m.label}</span>
                                <span className="text-xs text-muted-foreground ml-2">{m.description}</span>
                              </div>
                              <Switch
                                checked={moduleAccess[m.key] ?? true}
                                onCheckedChange={checked => setModuleAccess(prev => ({ ...prev, [m.key]: checked }))}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Nome:</span>
                  <p className="font-medium">{fullName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Telefone:</span>
                  <p className="font-medium">{phone || '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Função:</span>
                  <Badge variant="outline">{role}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Filial:</span>
                  <p className="font-medium">{selectedOrg?.name || 'RBR Consult'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cargo:</span>
                  <p className="font-medium">{cargo}</p>
                </div>
              </div>

              <div className="border-t pt-2">
                <span className="text-xs text-muted-foreground">Krolic:</span>
                <Badge variant={krolicAtivo ? 'default' : 'secondary'} className="ml-2">
                  {krolicAtivo ? 'Ativo' : 'Inativo'}
                </Badge>
                {smId && <span className="text-xs text-muted-foreground ml-3">SM: {smId}</span>}
              </div>

              <div className="border-t pt-2">
                <span className="text-xs text-muted-foreground">Módulos habilitados:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {MODULE_DEFINITIONS.filter(m => moduleAccess[m.key]).map(m => (
                    <Badge key={m.key} variant="outline" className="text-[10px]">{m.label}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">Enviar boas-vindas via WhatsApp</p>
                  <p className="text-xs text-muted-foreground">Mensagem com credenciais de acesso</p>
                </div>
              </div>
              <Switch checked={sendWhatsApp} onCheckedChange={setSendWhatsApp} disabled={!phone} />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            onClick={() => step === 0 ? onOpenChange(false) : setStep(s => s - 1)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {step === 0 ? 'Cancelar' : 'Voltar'}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
              Próximo
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Usuário
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
