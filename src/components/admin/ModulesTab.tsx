import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MODULE_DEFINITIONS } from '@/hooks/useModulePermissions';
import { toast } from 'sonner';

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
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  // All users are manageable, including super_admins (for demo/convention purposes)
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
      // Upsert permission
      const { error } = await supabase
        .from('user_module_permissions' as any)
        .upsert(
          { user_id: selectedUserId, module_key: moduleKey, enabled },
          { onConflict: 'user_id,module_key' }
        );
      if (error) throw error;
      setPermissions(prev => ({ ...prev, [moduleKey]: enabled }));
      toast.success(`${enabled ? 'Acesso liberado' : 'Acesso removido'}: ${moduleKey}`);
    } catch (error: any) {
      console.error('Error toggling module:', error);
      toast.error('Erro ao atualizar permissão');
    } finally {
      setSaving(null);
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão de Módulos por Usuário</CardTitle>
        <CardDescription>
          Selecione um usuário e controle quais módulos ele pode acessar. Super Admins sempre têm acesso total.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Selector */}
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

        {/* Modules Grid */}
        {selectedUserId && (
          loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {selectedUser && (
                <p className="text-sm text-muted-foreground">
                  Permissões de <strong>{selectedUser.full_name || selectedUser.email}</strong>
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {MODULE_DEFINITIONS.map(mod => {
                  const isEnabled = permissions[mod.key] !== false; // default true
                  const isSaving = saving === mod.key;
                  return (
                    <div
                      key={mod.key}
                      className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary/30"
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
