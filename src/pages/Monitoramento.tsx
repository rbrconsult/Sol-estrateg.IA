import { useState } from "react";
import { Activity, ExternalLink, RefreshCw } from "lucide-react";
import { HelpButton } from "@/components/HelpButton";
import { Button } from "@/components/ui/button";

const STATUS_URL = "https://status.rbrsistemas.com/status/evolve";

export default function Monitoramento() {
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeError, setIframeError] = useState(false);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" /> Monitoramento
          </h1>
          <p className="text-sm text-muted-foreground">Acompanhe o status dos sistemas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(STATUS_URL, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-1" /> Abrir em nova aba
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setIframeError(false); setIframeKey(k => k + 1); }}
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
          <HelpButton moduleId="monitoramento" label="Ajuda de Monitoramento" />
        </div>
      </div>

      {iframeError ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-muted/30 p-12 text-center" style={{ height: "calc(100vh - 12rem)" }}>
          <Activity className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Não foi possível carregar o painel aqui</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            O servidor de status bloqueia a exibição embutida. Clique abaixo para visualizar em uma nova aba.
          </p>
          <Button onClick={() => window.open(STATUS_URL, "_blank")}>
            <ExternalLink className="h-4 w-4 mr-2" /> Abrir Painel de Status
          </Button>
        </div>
      ) : (
        <iframe
          key={iframeKey}
          src={STATUS_URL}
          className="w-full border-0 rounded-lg bg-background"
          style={{ height: "calc(100vh - 12rem)" }}
          title="Status dos Sistemas"
          sandbox="allow-scripts allow-same-origin"
          onLoad={(e) => {
            try {
              const doc = (e.target as HTMLIFrameElement).contentDocument;
              if (!doc || !doc.body || doc.body.innerHTML === "") {
                setIframeError(true);
              }
            } catch {
              // Cross-origin = iframe loaded but can't access content, which is fine
            }
          }}
          onError={() => setIframeError(true)}
        />
      )}
    </div>
  );
}
