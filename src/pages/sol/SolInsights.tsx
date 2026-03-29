import { Bot, Lightbulb, RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsightCard } from "@/components/sol/InsightCard";
import { useSolInsights } from "@/hooks/useSolInsights";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { HelpButton } from "@/components/HelpButton";

export default function SolInsights() {
  const { data: insights, isLoading, refetch, markAsRead } = useSolInsights();
  const { selectedOrgName } = useOrgFilter();

  const unread = (insights || []).filter(i => !i.visualizado);
  const read = (insights || []).filter(i => i.visualizado);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="h-5 w-5 md:h-6 md:w-6 text-primary" /> SOL Insights
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Feed de inteligência operacional — {selectedOrgName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unread.length > 0 && <Badge variant="destructive">{unread.length} não lidos</Badge>}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
          <HelpButton moduleId="sol-insights" label="Ajuda" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (insights || []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Lightbulb className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">Nenhum insight ainda</h3>
          <p className="text-sm text-muted-foreground/60 max-w-md mt-1">
            Os insights serão gerados automaticamente conforme os dados do Agent SOL v2 forem acumulados.
          </p>
        </div>
      ) : (
        <Tabs defaultValue="novos">
          <TabsList>
            <TabsTrigger value="novos">Novos ({unread.length})</TabsTrigger>
            <TabsTrigger value="lidos">Lidos ({read.length})</TabsTrigger>
            <TabsTrigger value="todos">Todos ({(insights || []).length})</TabsTrigger>
          </TabsList>
          <TabsContent value="novos" className="space-y-3 mt-4">
            {unread.map(i => <InsightCard key={i.id} insight={i} onMarkAsRead={(id) => markAsRead.mutate(id)} />)}
            {unread.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Todos os insights foram lidos ✓</p>}
          </TabsContent>
          <TabsContent value="lidos" className="space-y-3 mt-4">
            {read.map(i => <InsightCard key={i.id} insight={i} />)}
          </TabsContent>
          <TabsContent value="todos" className="space-y-3 mt-4">
            {(insights || []).map(i => <InsightCard key={i.id} insight={i} onMarkAsRead={(id) => markAsRead.mutate(id)} />)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
