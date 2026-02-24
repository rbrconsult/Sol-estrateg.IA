import { useMemo } from "react";
import { AlertTriangle, AlertCircle, TrendingDown, Users, Clock, Target } from "lucide-react";
import { Proposal } from "@/data/dataAdapter";

interface VendedorData {
  nome: string;
  valorTotal: number;
}

interface KPIs {
  taxaConversao: number;
  cicloProposta: number;
  negociosPerdidos: number;
  totalNegocios: number;
  receitaPrevista: number;
}

interface StrategicAlertsProps {
  proposals: Proposal[];
  kpis: KPIs;
  vendedorPerformance: VendedorData[];
  meta: number;
}

interface Alert {
  icon: React.ElementType;
  text: string;
  severity: "danger" | "warning";
}

export function StrategicAlerts({ proposals, kpis, vendedorPerformance, meta }: StrategicAlertsProps) {
  const alerts = useMemo(() => {
    const list: Alert[] = [];

    // 1. Propostas paradas >15 dias
    const abertos = proposals.filter(p => p.status === "Aberto");
    const parados = abertos.filter(p => p.tempoNaEtapa > 15);
    const pctParados = abertos.length > 0 ? Math.round((parados.length / abertos.length) * 100) : 0;
    if (pctParados > 20) {
      list.push({
        icon: Clock,
        text: `${pctParados}% das oportunidades estão paradas há +15 dias`,
        severity: pctParados > 40 ? "danger" : "warning",
      });
    }

    // 2. Conversão baixa
    if (kpis.taxaConversao < 10 && kpis.totalNegocios > 0) {
      list.push({
        icon: TrendingDown,
        text: `Conversão em ${kpis.taxaConversao.toFixed(1)}% — abaixo do ideal`,
        severity: kpis.taxaConversao < 5 ? "danger" : "warning",
      });
    }

    // 3. Concentração de vendedor
    const totalVal = vendedorPerformance.reduce((a, v) => a + v.valorTotal, 0);
    if (totalVal > 0) {
      const top = vendedorPerformance.reduce((best, v) => v.valorTotal > best.valorTotal ? v : best, vendedorPerformance[0]);
      const pctConc = Math.round((top.valorTotal / totalVal) * 100);
      if (pctConc > 50 && vendedorPerformance.length > 1) {
        list.push({
          icon: Users,
          text: `${top.nome} concentra ${pctConc}% do pipeline`,
          severity: pctConc > 70 ? "danger" : "warning",
        });
      }
    }

    // 4. Principal motivo de perda
    const perdidos = proposals.filter(p => p.status === "Perdido" && p.motivoPerda);
    if (perdidos.length > 3) {
      const motivos: Record<string, number> = {};
      perdidos.forEach(p => { motivos[p.motivoPerda] = (motivos[p.motivoPerda] || 0) + 1; });
      const topMotivo = Object.entries(motivos).sort((a, b) => b[1] - a[1])[0];
      if (topMotivo) {
        const pctMotivo = Math.round((topMotivo[1] / perdidos.length) * 100);
        if (pctMotivo > 25) {
          list.push({
            icon: AlertTriangle,
            text: `${pctMotivo}% das perdas são por "${topMotivo[0]}"`,
            severity: "warning",
          });
        }
      }
    }

    // 5. Ciclo alto
    if (kpis.cicloProposta > 20) {
      list.push({
        icon: Clock,
        text: `Ciclo médio de ${kpis.cicloProposta} dias — acima do ideal`,
        severity: kpis.cicloProposta > 30 ? "danger" : "warning",
      });
    }

    // 6. Sem atualização >30 dias
    const semUpdate = abertos.filter(p => p.tempoNaEtapa > 30).length;
    if (semUpdate > 0) {
      list.push({
        icon: AlertCircle,
        text: `${semUpdate} proposta${semUpdate > 1 ? "s" : ""} sem atualização há +30 dias`,
        severity: "warning",
      });
    }

    // 7. Meta
    if (meta > 0) {
      const cobertura = Math.round(((kpis.receitaPrevista + proposals.filter(p => p.status === "Ganho").reduce((a, p) => a + p.valorProposta, 0)) / meta) * 100);
      if (cobertura < 80) {
        list.push({
          icon: Target,
          text: `Pipeline ponderado cobre apenas ${cobertura}% da meta`,
          severity: cobertura < 50 ? "danger" : "warning",
        });
      }
    }

    return list.slice(0, 5);
  }, [proposals, kpis, vendedorPerformance, meta]);

  if (alerts.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm opacity-0 animate-fade-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-semibold text-foreground">Alertas Estratégicos</h3>
      </div>

      <div className="space-y-2.5">
        {alerts.map((alert, i) => {
          const Icon = alert.icon;
          const color = alert.severity === "danger" ? "text-destructive" : "text-warning";
          const bg = alert.severity === "danger" ? "bg-destructive/5" : "bg-warning/5";
          return (
            <div key={i} className={`flex items-start gap-2.5 rounded-lg ${bg} px-3 py-2.5`}>
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
              <span className="text-sm text-foreground">{alert.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
