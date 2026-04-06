import React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface AppErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): Partial<AppErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("AppErrorBoundary caught an error", error, errorInfo);
  }

  private handleReload = () => {
    sessionStorage.removeItem("__sol_runtime_recovery__");
    const url = new URL(window.location.href);
    url.searchParams.set("_hard_reload", `${Date.now()}`);
    window.location.replace(url.toString());
  };

  private handleTryAgain = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback !== undefined) {
      return this.props.fallback;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">Ocorreu um erro na interface</h2>
              <p className="text-sm text-muted-foreground">
                A tela foi protegida para evitar nova página em branco. Use outra rota no menu ou recarregue a página.
              </p>
              {this.state.error?.message && (
                <pre className="mt-2 max-h-32 overflow-auto rounded-md border border-border bg-muted/50 p-2 text-left text-[11px] text-muted-foreground whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </pre>
              )}
              <p className="text-[11px] text-muted-foreground">
                Abra o console do navegador (F12) para o stack completo.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={this.handleTryAgain} className="gap-2">
                  Tentar de novo
                </Button>
                <Button type="button" size="sm" onClick={this.handleReload} className="gap-2">
                  <RefreshCcw className="h-4 w-4" />
                  Recarregar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}