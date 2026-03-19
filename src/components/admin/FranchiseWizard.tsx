import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, ArrowLeft, ArrowRight, Check, Building2, Webhook, Database, Key, Users } from 'lucide-react';

interface UserOption {
  id: string;
  email: string;
  full_name: string | null;
}

interface DataStoreEntry {
  key: string;
  name: string;
  datastoreId: string;
}

interface WebhookEntry {
  key: string;
  name: string;
  url: string;
  category: string;
}

interface FranchiseWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserOption[];
  onComplete: () => void;
}

const STEPS = [
  { label: 'Identidade', icon: Building2 },
  { label: 'API Make.com', icon: Key },
  { label: 'Data Stores', icon: Database },
  { label: 'Webhooks', icon: Webhook },
  { label: 'Usuários', icon: Users },
];

const WEBHOOK_CATEGORIES = ['SDR', 'Comercial', 'Ads', 'OCR', 'Gateway', 'Áudio', 'Outro'];

export default function FranchiseWizard({ open, onOpenChange, users, onComplete }: FranchiseWizardProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 - Identity
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  // Step 2 - API
  const [makeApiKey, setMakeApiKey] = useState('');
  const [makeTeamId, setMakeTeamId] = useState('');

  // Step 3 - Data Stores
  const [dataStores, setDataStores] = useState<DataStoreEntry[]>([
    { key: '', name: '', datastoreId: '' }
  ]);

  // Step 4 - Webhooks
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>([
    { key: '', name: '', url: '', category: 'SDR' }
  ]);

  // Step 5 - Users
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const resetForm = () => {
    setStep(0);
    setName('');
    setSlug('');
    setMakeApiKey('');
    setMakeTeamId('');
    setDataStores([{ key: '', name: '', datastoreId: '' }]);
    setWebhooks([{ key: '', name: '', url: '', category: 'SDR' }]);
    setSelectedUserIds([]);
  };

  const generateSlug = (val: string) => {
    return val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const canNext = () => {
    switch (step) {
      case 0: return name.trim().length > 0 && slug.trim().length > 0;
      case 1: return true; // API keys optional
      case 2: return true;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      // 1. Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name, slug, settings: {} })
        .select('id')
        .single();

      if (orgError) throw orgError;
      const orgId = org.id;

      // 2. Save configs
      const configs: { organization_id: string; config_key: string; config_value: string; config_category: string; is_secret: boolean }[] = [];

      if (makeApiKey) configs.push({ organization_id: orgId, config_key: 'make_api_key', config_value: makeApiKey, config_category: 'api', is_secret: true });
      if (makeTeamId) configs.push({ organization_id: orgId, config_key: 'make_team_id', config_value: makeTeamId, config_category: 'api', is_secret: false });

      dataStores.filter(ds => ds.key && ds.datastoreId).forEach(ds => {
        configs.push({
          organization_id: orgId,
          config_key: `ds_${ds.key}`,
          config_value: ds.datastoreId,
          config_category: 'datastore',
          is_secret: false,
        });
      });

      webhooks.filter(wh => wh.key && wh.url).forEach(wh => {
        configs.push({
          organization_id: orgId,
          config_key: `webhook_${wh.key}`,
          config_value: wh.url,
          config_category: 'webhook',
          is_secret: false,
        });
      });

      if (configs.length > 0) {
        const { error: cfgError } = await supabase
          .from('organization_configs')
          .insert(configs);
        if (cfgError) throw cfgError;
      }

      // 3. Add members
      if (selectedUserIds.length > 0) {
        const members = selectedUserIds.map(uid => ({
          organization_id: orgId,
          user_id: uid,
          role: 'user' as const,
        }));
        const { error: memError } = await supabase
          .from('organization_members')
          .insert(members);
        if (memError) throw memError;

        // Update profiles
        for (const uid of selectedUserIds) {
          await supabase.from('profiles').update({ organization_id: orgId }).eq('id', uid);
        }
      }

      toast.success(`Franquia "${name}" criada com sucesso!`);
      resetForm();
      onOpenChange(false);
      onComplete();
    } catch (error: any) {
      console.error('Error creating franchise:', error);
      toast.error(error.message || 'Erro ao criar franquia');
    } finally {
      setSaving(false);
    }
  };

  const addDataStore = () => setDataStores([...dataStores, { key: '', name: '', datastoreId: '' }]);
  const removeDataStore = (i: number) => setDataStores(dataStores.filter((_, idx) => idx !== i));
  const updateDataStore = (i: number, field: keyof DataStoreEntry, val: string) => {
    const updated = [...dataStores];
    updated[i] = { ...updated[i], [field]: val };
    if (field === 'name') updated[i].key = generateSlug(val);
    setDataStores(updated);
  };

  const addWebhook = () => setWebhooks([...webhooks, { key: '', name: '', url: '', category: 'SDR' }]);
  const removeWebhook = (i: number) => setWebhooks(webhooks.filter((_, idx) => idx !== i));
  const updateWebhook = (i: number, field: keyof WebhookEntry, val: string) => {
    const updated = [...webhooks];
    updated[i] = { ...updated[i], [field]: val };
    if (field === 'name') updated[i].key = generateSlug(val);
    setWebhooks(updated);
  };

  const toggleUser = (uid: string) => {
    setSelectedUserIds(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Nova Franquia
          </DialogTitle>
          <DialogDescription>Cadastro de nova franquia em {STEPS.length} etapas</DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-1 py-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={i} className="flex items-center gap-1 flex-1">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' :
                  isDone ? 'bg-primary/20 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`h-px flex-1 ${isDone ? 'bg-primary' : 'bg-border'}`} />}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[280px] py-2">
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Franquia *</Label>
                <Input value={name} onChange={e => { setName(e.target.value); if (!slug) setSlug(generateSlug(e.target.value)); }} placeholder="Ex: Evolve - Loja Olímpia" />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input value={slug} onChange={e => setSlug(generateSlug(e.target.value))} placeholder="evolve-olimpia" />
                <p className="text-xs text-muted-foreground">Identificador único (letras minúsculas, números e hifens)</p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Credenciais da API Make.com para esta franquia. Se não preencher, a franquia usará as credenciais globais.</p>
              <div className="space-y-2">
                <Label>Make API Key</Label>
                <Input type="password" value={makeApiKey} onChange={e => setMakeApiKey(e.target.value)} placeholder="Token xxx..." />
              </div>
              <div className="space-y-2">
                <Label>Make Team ID</Label>
                <Input value={makeTeamId} onChange={e => setMakeTeamId(e.target.value)} placeholder="Ex: 12345" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Data Stores do Make.com associados a esta franquia</p>
                <Button variant="outline" size="sm" onClick={addDataStore}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>ID do Data Store</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataStores.map((ds, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Input value={ds.name} onChange={e => updateDataStore(i, 'name', e.target.value)} placeholder="Ex: Comercial" className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input value={ds.datastoreId} onChange={e => updateDataStore(i, 'datastoreId', e.target.value)} placeholder="Ex: 64798" className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeDataStore(i)} disabled={dataStores.length === 1}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Webhooks do Make.com para esta franquia</p>
                <Button variant="outline" size="sm" onClick={addWebhook}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                </Button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {webhooks.map((wh, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center p-2 rounded-md border bg-muted/30">
                    <Input value={wh.name} onChange={e => updateWebhook(i, 'name', e.target.value)} placeholder="Nome" className="h-8 text-xs" />
                    <Input value={wh.url} onChange={e => updateWebhook(i, 'url', e.target.value)} placeholder="https://hook.us2.make.com/..." className="h-8 text-xs" />
                    <Select value={wh.category} onValueChange={v => updateWebhook(i, 'category', v)}>
                      <SelectTrigger className="h-8 w-24 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WEBHOOK_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeWebhook(i)} disabled={webhooks.length === 1}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Selecione os usuários que terão acesso a esta franquia</p>
              <div className="max-h-[300px] overflow-y-auto space-y-1">
                {users.map(u => (
                  <div
                    key={u.id}
                    onClick={() => toggleUser(u.id)}
                    className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                      selectedUserIds.includes(u.id) ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted border border-transparent'
                    }`}
                  >
                    <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                      selectedUserIds.includes(u.id) ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                    }`}>
                      {selectedUserIds.includes(u.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.full_name || u.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum usuário disponível</p>
                )}
              </div>
              {selectedUserIds.length > 0 && (
                <p className="text-xs text-muted-foreground">{selectedUserIds.length} usuário(s) selecionado(s)</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : onOpenChange(false)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {step === 0 ? 'Cancelar' : 'Voltar'}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
              Próximo
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving || !canNext()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Check className="h-4 w-4 mr-1" />
              Criar Franquia
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
