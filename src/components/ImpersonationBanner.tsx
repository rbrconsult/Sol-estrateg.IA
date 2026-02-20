import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';

export function ImpersonationBanner() {
  const { isImpersonating, impersonationInfo, stopImpersonation } = useAuth();

  if (!isImpersonating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">
          Impersonando: <strong>{impersonationInfo?.targetName || impersonationInfo?.targetEmail}</strong>
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={stopImpersonation}
        className="bg-transparent border-destructive-foreground/30 text-destructive-foreground hover:bg-destructive-foreground/10"
      >
        <X className="h-3 w-3 mr-1" />
        Voltar para minha conta
      </Button>
    </div>
  );
}
