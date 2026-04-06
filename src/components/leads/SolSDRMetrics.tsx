import { Users, Clock, Percent } from "lucide-react";
import { safeToFixed } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  data: { total: number; tempoMedio: number; taxaPassagem: number };
}

export function SolSDRMetrics({ data }: Props) {
  const items = [
    { label: "Passaram pela Sol SDR", value: data.total, icon: Users },
    { label: "Tempo Médio na SDR", value: `${data.tempoMedio} dias`, icon: Clock },
    { label: "Taxa de Passagem", value: `${safeToFixed(data.taxaPassagem, 1)}%`, icon: Percent },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Sol SDR: Tempo e Passagem</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <item.icon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-lg font-bold">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
