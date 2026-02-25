import { Clock, TrendingUp, ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  data: { media: number; mediana: number; min: number; max: number; totalComDados: number };
}

export function TempoQualificacao({ data }: Props) {
  const items = [
    { label: "Média", value: `${data.media} dias`, icon: Clock },
    { label: "Mediana", value: `${data.mediana} dias`, icon: TrendingUp },
    { label: "Mínimo", value: `${data.min} dias`, icon: ArrowDown },
    { label: "Máximo", value: `${data.max} dias`, icon: ArrowUp },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Tempo Médio de Qualificação</CardTitle>
        <p className="text-xs text-muted-foreground">Data Projeto → Data Qualificação Sol ({data.totalComDados} leads)</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
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
