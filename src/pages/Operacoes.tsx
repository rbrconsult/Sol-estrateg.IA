import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, AlertTriangle } from "lucide-react";
import Monitoramento from "./Monitoramento";
import MakeErrors from "./MakeErrors";

export default function Operacoes() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Operações</h1>
        <p className="text-xs md:text-sm text-muted-foreground">Monitoramento e erros dos fluxos Make</p>
      </div>

      <Tabs defaultValue="monitoramento" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="monitoramento" className="gap-1.5">
            <Activity className="h-4 w-4" /> Monitor
          </TabsTrigger>
          <TabsTrigger value="erros" className="gap-1.5">
            <AlertTriangle className="h-4 w-4" /> Erros Make
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitoramento" className="-mx-4 md:-mx-6 -mt-2">
          <Monitoramento />
        </TabsContent>

        <TabsContent value="erros" className="-mx-4 md:-mx-6 -mt-2">
          <MakeErrors />
        </TabsContent>
      </Tabs>
    </div>
  );
}
