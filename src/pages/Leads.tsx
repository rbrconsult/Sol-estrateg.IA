import { mockLeads } from "@/data/leadsMockData";
import { LeadsKPIs } from "@/components/leads/LeadsKPIs";
import { LeadsByOrigin } from "@/components/leads/LeadsByOrigin";
import { LeadsByDayOfWeek } from "@/components/leads/LeadsByDayOfWeek";
import { LeadsByHour } from "@/components/leads/LeadsByHour";
import { LeadsByLocation } from "@/components/leads/LeadsByLocation";
import { LeadsTrendChart } from "@/components/leads/LeadsTrendChart";
import { RoboMetrics } from "@/components/leads/RoboMetrics";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { Bot, Zap } from "lucide-react";

export default function Leads() {
  const leads = mockLeads;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Leads</h1>
          <p className="text-sm text-muted-foreground">Captação, qualificação e métricas do robô</p>
        </div>
      </div>

      {/* Bloco 1 - KPIs */}
      <LeadsKPIs leads={leads} />

      {/* Bloco 2 - Análise */}
      <div className="grid md:grid-cols-2 gap-4">
        <LeadsByOrigin leads={leads} />
        <LeadsByDayOfWeek leads={leads} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <LeadsByHour leads={leads} />
        <LeadsByLocation leads={leads} />
      </div>

      <LeadsTrendChart leads={leads} />

      {/* Bloco 3 - Robô */}
      <RoboMetrics leads={leads} />

      {/* Bloco 4 - Tabela */}
      <LeadsTable leads={leads} />
    </div>
  );
}
