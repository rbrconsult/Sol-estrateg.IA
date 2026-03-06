import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateFilter, DateRange, DateFilterPreset } from "@/components/dashboard/DateFilter";
import { useBIData } from "@/hooks/useBIData";
import { AdsTab } from "@/components/bi/AdsTab";
import { SolSDRTab } from "@/components/bi/SolSDRTab";
import { FupFrioTab } from "@/components/bi/FupFrioTab";
import { SolarMarketTab } from "@/components/bi/SolarMarketTab";
import { SultsTab } from "@/components/bi/SultsTab";
import { CruzamentosTab } from "@/components/bi/CruzamentosTab";

export default function BI() {
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [datePreset, setDatePreset] = useState<DateFilterPreset>("all");
  const { solSDR, solarMarket, fupFrio, cruzamentosB, leadsEmRisco, hasData, isLoading, error } = useBIData(dateRange);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-3 md:px-4 py-4 space-y-4">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
            BI — Centro de Inteligência
          </h1>
          <p className="text-xs text-muted-foreground">
            Visão unificada de todas as fontes de dados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateFilter
            dateRange={dateRange}
            preset={datePreset}
            onDateRangeChange={(range, preset) => {
              setDateRange(range);
              setDatePreset(preset);
            }}
          />
          {hasData && (
            <Badge variant="outline" className="border-primary/50 text-primary text-xs gap-1">
              <Radio className="h-3 w-3 animate-pulse" />
              Dados Reais
            </Badge>
          )}
          <span className="text-xs text-muted-foreground tabular-nums">
            {format(now, "HH:mm", { locale: ptBR })}
          </span>
        </div>
      </div>

      {/* ─── Loading ─── */}
      {isLoading && !hasData && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}

      {/* ─── Tabs ─── */}
      <Tabs defaultValue="sol-sdr" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="ads" className="text-xs gap-1.5">📣 Ads</TabsTrigger>
          <TabsTrigger value="sol-sdr" className="text-xs gap-1.5">🤖 Sol SDR</TabsTrigger>
          <TabsTrigger value="fup-frio" className="text-xs gap-1.5">🧊 FUP Frio</TabsTrigger>
          <TabsTrigger value="solar-market" className="text-xs gap-1.5">📋 SolarMarket</TabsTrigger>
          <TabsTrigger value="sults" className="text-xs gap-1.5">🔧 Sults</TabsTrigger>
          <TabsTrigger value="cruzamentos" className="text-xs gap-1.5">🔀 Cruzamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="ads" className="mt-4">
          <AdsTab />
        </TabsContent>

        <TabsContent value="sol-sdr" className="mt-4">
          <SolSDRTab data={solSDR} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="fup-frio" className="mt-4">
          <FupFrioTab data={fupFrio} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="solar-market" className="mt-4">
          <SolarMarketTab data={solarMarket} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="sults" className="mt-4">
          <SultsTab />
        </TabsContent>

        <TabsContent value="cruzamentos" className="mt-4">
          <CruzamentosTab
            cruzamentosB={cruzamentosB}
            leadsEmRisco={leadsEmRisco}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* ─── Footer ─── */}
      <div className="text-center py-4 border-t border-border/50">
        <p className="text-[10px] text-muted-foreground">
          Sol Estrateg.IA — Centro de Inteligência • {format(now, "dd/MM/yyyy HH:mm", { locale: ptBR })}
        </p>
      </div>
    </div>
  );
}
