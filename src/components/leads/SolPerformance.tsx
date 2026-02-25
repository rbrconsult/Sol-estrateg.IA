import { Bot, Star, Flame, ArrowRightLeft, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyAbbrev } from "@/lib/formatters";

interface Props {
  data: {
    totalQualificados: number;
    scoreMedio: number;
    percentQuentes: number;
    conversaoSolProposta: number;
    conversaoSolFechamento: number;
    valorQualificados: number;
  };
}

export function SolPerformance({ data }: Props) {
  const cards = [
    { label: "Qualificados pela Sol", value: data.totalQualificados, icon: Bot, color: "text-primary" },
    { label: "Score Médio", value: data.scoreMedio.toFixed(1), icon: Star, color: "text-amber-500" },
    { label: "% Quentes", value: `${data.percentQuentes.toFixed(1)}%`, icon: Flame, color: "text-orange-500" },
    { label: "Sol → Proposta", value: `${data.conversaoSolProposta.toFixed(1)}%`, icon: ArrowRightLeft, color: "text-emerald-500" },
    { label: "Sol → Fechamento", value: `${data.conversaoSolFechamento.toFixed(1)}%`, icon: Trophy, color: "text-primary" },
    { label: "Valor Qualificados", value: formatCurrencyAbbrev(data.valorQualificados), icon: Bot, color: "text-emerald-500" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Performance da Sol</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <c.icon className={`h-5 w-5 ${c.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-lg font-bold">{c.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
