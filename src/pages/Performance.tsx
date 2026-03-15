import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, XCircle, Target } from "lucide-react";
import Vendedores from "./Vendedores";
import Perdas from "./Perdas";
import Origens from "./Origens";

export default function Performance() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <Tabs defaultValue="vendedores" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vendedores" className="gap-1.5">
            <Users className="h-4 w-4" /> Vendedores
          </TabsTrigger>
          <TabsTrigger value="perdas" className="gap-1.5">
            <XCircle className="h-4 w-4" /> Perdas
          </TabsTrigger>
          <TabsTrigger value="origens" className="gap-1.5">
            <Target className="h-4 w-4" /> Origens
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vendedores" className="-mx-4 md:-mx-6 -mt-2">
          <Vendedores />
        </TabsContent>

        <TabsContent value="perdas" className="-mx-4 md:-mx-6 -mt-2">
          <Perdas />
        </TabsContent>

        <TabsContent value="origens" className="-mx-4 md:-mx-6 -mt-2">
          <Origens />
        </TabsContent>
      </Tabs>
    </div>
  );
}
