import { Activity, ExternalLink, Globe, Shield, Server, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_URL = "https://status.rbrsistemas.com/status/evolve";

export default function Monitoramento() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" /> Monitoramento
        </h1>
        <p className="text-sm text-muted-foreground">Acompanhe o status dos sistemas Evolve</p>
      </div>

      <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 14rem)" }}>
        <Card className="w-full max-w-lg text-center">
          <CardContent className="flex flex-col items-center gap-6 py-12 px-8">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="h-10 w-10 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center ring-4 ring-card">
                <Shield className="h-3 w-3 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Status dos Sistemas</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Verifique a disponibilidade e desempenho de todos os serviços da plataforma Evolve em tempo real.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full py-2">
              <div className="flex flex-col items-center gap-1.5">
                <Server className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Servidores</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Wifi className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Conectividade</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Uptime</span>
              </div>
            </div>

            <Button asChild size="lg" className="gap-2 w-full">
              <a href={STATUS_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> Acessar Painel de Status
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
