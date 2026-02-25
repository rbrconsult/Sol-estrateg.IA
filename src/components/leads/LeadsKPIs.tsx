import { Users, UserCheck, UserX, Percent, Flame, Thermometer, Snowflake, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  kpis: {
    total: number;
    qualificados: number;
    naoQualificados: number;
    taxaQualificacao: number;
    quentes: number;
    mornos: number;
    frios: number;
    scoreMedio: number;
  };
}

export function LeadsKPIs({ kpis }: Props) {
  const cards = [
    { label: "Total de Leads", value: kpis.total, icon: Users, color: "text-primary" },
    { label: "Qualificados Sol", value: kpis.qualificados, icon: UserCheck, color: "text-emerald-500" },
    { label: "Não Qualificados", value: kpis.naoQualificados, icon: UserX, color: "text-destructive" },
    { label: "Taxa Qualificação", value: `${kpis.taxaQualificacao.toFixed(1)}%`, icon: Percent, color: "text-primary" },
    { label: "Quentes", value: kpis.quentes, icon: Flame, color: "text-orange-500" },
    { label: "Mornos", value: kpis.mornos, icon: Thermometer, color: "text-amber-500" },
    { label: "Frios", value: kpis.frios, icon: Snowflake, color: "text-blue-400" },
    { label: "Score Médio", value: kpis.scoreMedio.toFixed(1), icon: Star, color: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="relative overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-secondary ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-2xl font-bold">{c.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
