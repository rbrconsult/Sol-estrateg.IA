import { Navigate } from 'react-router-dom';
import { useModulePermissions } from '@/hooks/useModulePermissions';
import { Loader2 } from 'lucide-react';

interface ModuleGuardProps {
  moduleKey: string;
  children: React.ReactNode;
}

export function ModuleGuard({ moduleKey, children }: ModuleGuardProps) {
  const { hasAccess, isLoading } = useModulePermissions();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess(moduleKey)) {
    return <Navigate to="/selecao" replace />;
  }

  return <>{children}</>;
}
