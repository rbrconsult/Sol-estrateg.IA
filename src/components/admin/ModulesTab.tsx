import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MODULE_DEFINITIONS } from '@/hooks/useModulePermissions';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const MODULE_GROUPS = [
  { label: 'Pré-venda', icon: '📥', keys: ['conferencia', 'leads', 'robo-sol', 'robo-fup-frio'] },
  { label: 'Comercial', icon: '💼', keys: ['pipeline', 'painel-comercial', 'forecast', 'vendedores', 'comissoes', 'time-comercial'] },
  { label: 'SDR / Qualificação', icon: '🤖', keys: ['robo-sol', 'robo-fup-frio', 'qualificacao', 'sanitizacao', 'reprocessamento'] },
  { label: 'Campanhas', icon: '📢', keys: ['ads-performance', 'midia-receita', 'ga4'] },
  { label: 'Inteligência', icon: '📊', keys: ['bi', 'followup', 'sla-monitor'] },
  { label: 'Operacional', icon: '⚙️', keys: ['chamados', 'monitoramento', 'ajuda'] },
  { label: 'Admin', icon: '🔐', keys: ['admin', 'admin-filiais', 'admin-usuarios', 'admin-modulos', 'admin-seguranca', 'admin-sessoes', 'admin-whatsapp', 'admin-skills'] },
];

interface UserBasic {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

interface ModulesTabProps {
  users: UserBasic[];
}

export default function ModulesTab({ users }: ModulesTabProps) {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const manageableUsers = users;

  useEffect(() => {
    if (selectedUserId) {
      fetchPermissions(selectedUserId);
    }
  }, [selectedUserId]);

  const fetchPermissions = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_module_permissions' as any)
        .select('module_key, enabled')
        .eq('user_id', userId);
      if (error) throw error;
      const map: Record<string, boolean> = {};
      (data as any[])?.forEach((row: any) => {
        map[row.module_key] = row.enabled;
      });
      setPermissions(map);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Erro ao carregar permissões');
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = async (moduleKey: string, enabled: boolean) => {
    if (!selectedUserId) return;
    setSaving(moduleKey);
    try {
      const { error } = await supabase
        .from('user_module_permissions' as any)
        .upsert(
          { user_id: selectedUserId, module_key: moduleKey, enabled },
          { onConflict: 'user_id,module_key' }
        );
      if (error) throw error;
      setPermissions(prev => ({ ...prev, [moduleKey]: enabled }));
      const mod = MODULE_DEFINITIONS.find(m => m.key === moduleKey);
      toast.success(`${enabled ? 'Liberado' : 'Restrito'}: ${mod?.label || moduleKey}`);
    } catch (error: any) {
      console.error('Error toggling module:', error);
      toast.error('Erro ao atualizar permissão');
    } finally {
      setSaving(null);
    }
  };

  const toggleGroup = async (keys: string[], enabled: boolean) => {
    if (!selectedUserId) return;
    for (const key of keys) {
      await toggleModule(key, enabled);
    }
  };

  const toggleAll = async (enabled: boolean) => {
    if (!selectedUserId) return;
    const allKeys = MODULE_DEFINITIONS.map(m => m.key);
    for (const key of allKeys) {
      await toggleModule(key, enabled);
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão de Módulos por Usuário</CardTitle>
        <CardDescription>
          Selecione um usuário e controle quais módulos ele pode acessar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Selecione o Usuário</Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Escolha um usuário..." />
            </SelectTrigger>
            <SelectContent>
              {manageableUsers.map(u => (
                <SelectItem key={u.id} value={u.id}>
                  <span className="flex items-center gap-2">
                    {u.full_name || u.email}
                    <Badge variant="outline" className="text-xs ml-1">
                      {u.role === 'admin' ? 'Admin' : 'Usuário'}
                    </Badge>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedUserId && (
          loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {selectedUser && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Permissões de <strong>{selectedUser.full_name || selectedUser.email}</strong>
                  </p>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => toggleAll(true)}>
                      Liberar Tudo
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => toggleAll(false)}>
                      Restringir Tudo
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {MODULE_GROUPS.map(group => {
                  const allEnabled = group.keys.every(k => permissions[k] !== false);
                  const someEnabled = group.keys.some(k => permissions[k] !== false);
                  return (
                    <Collapsible key={group.label} defaultOpen>
                      <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-2">
                        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors">
                          <ChevronRight className="h-3.5 w-3.5 transition-transform data-[state=open]:rotate-90" />
                          {group.icon} {group.label}
                          <Badge variant="outline" className="text-[10px] ml-1">
                            {group.keys.filter(k => permissions[k] !== false).length}/{group.keys.length}
                          </Badge>
                        </CollapsibleTrigger>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost" size="sm" className="text-[10px] h-6 px-2"
                            onClick={() => toggleGroup(group.keys, !allEnabled)}
                          >
                            {allEnabled ? 'Restringir Bloco' : 'Liberar Bloco'}
                          </Button>
                          <div className={`h-2.5 w-2.5 rounded-full ${allEnabled ? 'bg-emerald-500' : someEnabled ? 'bg-amber-500' : 'bg-destructive'}`} />
                        </div>
                      </div>
                      <CollapsibleContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6 pr-2 mt-1">
                          {group.keys.map(key => {
                            const mod = MODULE_DEFINITIONS.find(m => m.key === key);
                            if (!mod) return null;
                            const isEnabled = permissions[mod.key] !== false;
                            const isSaving = saving === mod.key;
                            return (
                              <div
                                key={mod.key}
                                className="flex items-center justify-between rounded-md border border-border p-3 transition-colors hover:bg-secondary/30"
                              >
                                <div className="space-y-0.5">
                                  <Label className="text-sm font-medium">{mod.label}</Label>
                                  <p className="text-xs text-muted-foreground">{mod.description}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                                  <Switch
                                    checked={isEnabled}
                                    onCheckedChange={(val) => toggleModule(mod.key, val)}
                                    disabled={isSaving}
                                  />
                                </div>
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
          )
        )}

        {!selectedUserId && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Selecione um usuário acima para gerenciar seus acessos aos módulos.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
