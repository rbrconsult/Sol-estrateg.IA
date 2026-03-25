import { Database } from 'lucide-react';

export function EmptyState({ message = "Aguardando dados" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
      <Database className="h-12 w-12 opacity-30" />
      <p className="text-sm">{message}</p>
      <p className="text-xs opacity-60">Os dados serão populados automaticamente via Make</p>
    </div>
  );
}
