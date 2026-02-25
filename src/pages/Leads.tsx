import { useMemo } from "react";
import { Zap, Loader2, AlertCircle } from "lucide-react";
import { useGoogleSheetsData } from "@/hooks/useGoogleSheetsData";
import {
  adaptSheetData,
  getLeadsKPIs,
  getLeadsByEtiqueta,
  getLeadsByEtapa,
  getTempoQualificacao,
  getTemperaturaPorEtapa,
  getSolPerformance,
  getScorePorOrigem,
  getSolSDRMetrics,
  getGargalosData,
  getLeadsQuentesAbandonados,
  getROIPorOrigem,
} from "@/data/dataAdapter";
import { LeadsKPIs } from "@/components/leads/LeadsKPIs";
import { LeadsByEtiqueta } from "@/components/leads/LeadsByEtiqueta";
import { LeadsByEtapa } from "@/components/leads/LeadsByEtapa";
import { TempoQualificacao } from "@/components/leads/TempoQualificacao";
import { TemperaturaPorEtapa } from "@/components/leads/TemperaturaPorEtapa";
import { SolPerformance } from "@/components/leads/SolPerformance";
import { ScorePorOrigem } from "@/components/leads/ScorePorOrigem";
import { SolSDRMetrics } from "@/components/leads/SolSDRMetrics";
import { GargalosLeads } from "@/components/leads/GargalosLeads";
import { LeadsQuentesAbandonados } from "@/components/leads/LeadsQuentesAbandonados";
import { ROIPorOrigem } from "@/components/leads/ROIPorOrigem";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { Button } from "@/components/ui/button";

export default function Leads() {
  const { data: sheetsData, isLoading, error, refetch } = useGoogleSheetsData();

  const proposals = useMemo(() => {
    if (!sheetsData?.data) return [];
    return adaptSheetData(sheetsData.data);
  }, [sheetsData]);

  const kpis = useMemo(() => getLeadsKPIs(proposals), [proposals]);
  const etiquetaData = useMemo(() => getLeadsByEtiqueta(proposals), [proposals]);
  const etapaData = useMemo(() => getLeadsByEtapa(proposals), [proposals]);
  const tempoQual = useMemo(() => getTempoQualificacao(proposals), [proposals]);
  const tempPorEtapa = useMemo(() => getTemperaturaPorEtapa(proposals), [proposals]);
  const solPerf = useMemo(() => getSolPerformance(proposals), [proposals]);
  const scorePorOrigem = useMemo(() => getScorePorOrigem(proposals), [proposals]);
  const solSdr = useMemo(() => getSolSDRMetrics(proposals), [proposals]);
  const gargalos = useMemo(() => getGargalosData(proposals), [proposals]);
  const quentesAband = useMemo(() => getLeadsQuentesAbandonados(proposals), [proposals]);
  const roiOrigem = useMemo(() => getROIPorOrigem(proposals), [proposals]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">Erro ao carregar dados</p>
        <Button onClick={() => refetch()} variant="outline">Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Leads</h1>
          <p className="text-sm text-muted-foreground">
            Jornada, qualificação e performance da Sol · {proposals.length} leads
          </p>
        </div>
      </div>

      {/* Bloco 1 - KPIs */}
      <LeadsKPIs kpis={kpis} />

      {/* Bloco 2 - Jornada */}
      <div className="grid md:grid-cols-2 gap-4">
        <LeadsByEtiqueta data={etiquetaData} />
        <LeadsByEtapa data={etapaData} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <TempoQualificacao data={tempoQual} />
        <TemperaturaPorEtapa data={tempPorEtapa} />
      </div>

      {/* Bloco 3 - Performance da Sol */}
      <SolPerformance data={solPerf} />
      <div className="grid md:grid-cols-2 gap-4">
        <ScorePorOrigem data={scorePorOrigem} />
        <SolSDRMetrics data={solSdr} />
      </div>

      {/* Bloco 4 - SLA e Gargalos */}
      <div className="grid md:grid-cols-2 gap-4">
        <GargalosLeads data={gargalos} />
        <LeadsQuentesAbandonados leads={quentesAband} />
      </div>

      {/* Bloco 5 - ROI por Origem */}
      <ROIPorOrigem data={roiOrigem} />

      {/* Bloco 6 - Tabela */}
      <LeadsTable leads={proposals} />
    </div>
  );
}
