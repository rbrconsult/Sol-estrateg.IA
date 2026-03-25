import { useLastSync } from '@/hooks/useCampaignObs';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function SyncBadge({ franquiaId }: { franquiaId: string }) {
  const { data: syncs } = useLastSync(franquiaId);
  const last = syncs?.[0];

  if (!last?.finished_at) {
    return (
      <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
        <RefreshCw className="h-3 w-3" /> Sem sincronização
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
      <RefreshCw className="h-3 w-3" />
      Sync: {format(new Date(last.finished_at), "dd/MM HH:mm", { locale: ptBR })}
      {last.status !== 'success' && <span className="text-destructive ml-1">({last.status})</span>}
    </Badge>
  );
}
