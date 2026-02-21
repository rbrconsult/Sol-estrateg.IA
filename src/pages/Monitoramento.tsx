import { Activity, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Monitoramento() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" /> Monitoramento
          </h1>
          <p className="text-sm text-muted-foreground">Status em tempo real dos sistemas Evolve</p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <a href="https://status.rbrsistemas.com/status/evolve" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" /> Abrir página completa
          </a>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0" style={{ height: "calc(100vh - 12rem)" }}>
          <iframe
            src="https://status.rbrsistemas.com/status/evolve"
            className="w-full h-full border-0"
            title="Status do Sistema"
            sandbox="allow-scripts allow-same-origin allow-popups"
            referrerPolicy="no-referrer"
          />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Se o conteúdo não carregar, <a href="https://status.rbrsistemas.com/status/evolve" target="_blank" rel="noopener noreferrer" className="underline text-primary">clique aqui para acessar diretamente</a>.
      </p>
    </div>
  );
}
