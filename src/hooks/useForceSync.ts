import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/** Trigger cron-sync edge function then invalidate all data queries */
export function useForceSync() {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  const forceSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const { error } = await supabase.functions.invoke('cron-sync', {
        body: { time: new Date().toISOString() },
      });
      if (error) {
        console.error('Error triggering cron-sync:', error);
        toast.error('Erro ao sincronizar dados');
        return;
      }
      // Invalidate all data queries so pages refetch from DB
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['make-data-store'] }),
        queryClient.invalidateQueries({ queryKey: ['make-comercial-data'] }),
        queryClient.invalidateQueries({ queryKey: ['enriched-proposals'] }),
        queryClient.invalidateQueries({ queryKey: ['org-filtered-proposals'] }),
        queryClient.invalidateQueries({ queryKey: ['bi-make-data'] }),
        queryClient.invalidateQueries({ queryKey: ['make-heartbeat'] }),
        queryClient.invalidateQueries({ queryKey: ['make-errors'] }),
        queryClient.invalidateQueries({ queryKey: ['campaign-data'] }),
      ]);
      toast.success('Dados sincronizados com sucesso');
    } catch (err) {
      console.error('Force sync failed:', err);
      toast.error('Erro ao sincronizar');
    } finally {
      setIsSyncing(false);
    }
  }, [queryClient]);

  return { forceSync, isSyncing };
}
