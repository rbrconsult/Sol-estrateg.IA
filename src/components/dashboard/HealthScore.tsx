import { useMemo } from "react";
import { Activity, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Proposal } from "@/data/dataAdapter";

interface VendedorData {
  nome: string;
  valorTotal: number;
}

interface KPIs {
  taxaConversao: number;
  cicloProposta: number;
}

interface HealthScoreProps {
  proposals: Proposal[];
  kpis: KPIs;
  vendedorPerformance: VendedorData[];
}

function calcScore(proposals: Proposal[], kpis: KPIs, vendedorPerf: VendedorData[]): number {
  // 1. Conversão (25pts)
  let conv = 0;
  if (kpis.taxaConversao >= 15) conv = 25;
  else if (kpis.taxaConversao >= 10) conv = 18;
  else if (kpis.taxaConversao >= 5) conv = 10;

  // M3: Adjusted thresholds for solar sales cycle (longer than 7 days)
  let ciclo = 0;
  if (kpis.cicloProposta <= 15) ciclo = 25;
  else if (kpis.cicloProposta <= 30) ciclo = 18;
  else if (kpis.cicloProposta <= 60) ciclo = 10;

  // 3. Distribuição (25pts)
  let dist = 25;
  const totalVal = vendedorPerf.reduce((a, v) => a + v.valorTotal, 0);
  if (totalVal > 0) {
    const maxConc = Math.max(...vendedorPerf.map(v => (v.valorTotal / totalVal) * 100));
    if (maxConc > 70) dist = 0;
    else if (maxConc > 60) dist = 10;
    else if (maxConc > 50) dist = 18;
  }

  // 4. Fluxo – % paradas >15 dias (25pts)
  const abertos = proposals.filter(p => p.status === "Aberto");
  const parados = abertos.filter(p => p.tempoNaEtapa > 15).length;
  const pctParados = abertos.length > 0 ? (parados / abertos.length) * 100 : 0;
  let fluxo = 0;
  if (pctParados < 20) fluxo = 25;
  else if (pctParados < 40) fluxo = 15;

  return conv + ciclo + dist + fluxo;
}

export function HealthScore({ proposals, kpis, vendedorPerformance }: HealthScoreProps) {
  const score = useMemo(
    () => calcScore(proposals, kpis, vendedorPerformance),
    [proposals, kpis, vendedorPerformance]
  );

  const level = score >= 75 ? "healthy" : score >= 50 ? "warning" : "danger";

  const config = {
    healthy: {
      label: "Saudável",
      icon: CheckCircle,
      bg: "bg-primary/10",
      text: "text-primary",
      border: "border-primary/30",
    },
    warning: {
      label: "Atenção",
      icon: AlertTriangle,
      bg: "bg-warning/10",
      text: "text-warning",
      border: "border-warning/30",
    },
    danger: {
      label: "Risco",
      icon: XCircle,
      bg: "bg-destructive/10",
      text: "text-destructive",
      border: "border-destructive/30",
    },
  }[level];

  const Icon = config.icon;

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} p-5 shadow-sm flex flex-col items-center justify-center text-center`}>
      <div className="flex items-center gap-2 mb-2">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Health Score</h3>
      </div>

      <div className={`flex items-center gap-2 ${config.text} mb-1`}>
        <Icon className="h-6 w-6" />
        <span className="text-4xl font-bold">{score}</span>
      </div>
      <span className={`text-sm font-semibold ${config.text}`}>{config.label}</span>

      <div className="mt-3 w-full grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <span>Conversão: {kpis.taxaConversao.toFixed(0)}%</span>
        <span>Ciclo: {kpis.cicloProposta}d</span>
      </div>
    </div>
  );
}
