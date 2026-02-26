import { Activity } from "lucide-react";
import { HelpButton } from "@/components/HelpButton";

export default function Monitoramento() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" /> Monitoramento
          </h1>
          <p className="text-sm text-muted-foreground">Acompanhe o status dos sistemas</p>
        </div>
        <HelpButton moduleId="monitoramento" label="Ajuda de Monitoramento" />
      </div>

      <iframe
        src="https://status.rbrsistemas.com/status/evolve"
        className="w-full border-0 rounded-lg"
        style={{ height: "calc(100vh - 10rem)" }}
        title="Status dos Sistemas"
      />
    </div>
  );
}
