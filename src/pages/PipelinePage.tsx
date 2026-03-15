import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Kanban, TrendingUp } from "lucide-react";
import Pipeline from "./Pipeline";
import Forecast from "./Forecast";

export default function PipelinePage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <Tabs defaultValue="kanban" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kanban" className="gap-1.5">
            <Kanban className="h-4 w-4" /> Pipeline
          </TabsTrigger>
          <TabsTrigger value="forecast" className="gap-1.5">
            <TrendingUp className="h-4 w-4" /> Forecast
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="-mx-4 md:-mx-6 -mt-2">
          <Pipeline />
        </TabsContent>

        <TabsContent value="forecast" className="-mx-4 md:-mx-6 -mt-2">
          <Forecast />
        </TabsContent>
      </Tabs>
    </div>
  );
}
