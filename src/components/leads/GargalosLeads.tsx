import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Item { etapa: string; tempoMedio: number; tempoMax: number; quantidade: number; intensidade: number }
interface Props { data: Item[] }

function getColor(intensidade: number) {
  if (intensidade > 70) return "#ef4444";
  if (intensidade > 40) return "#f59e0b";
  return "#22c55e";
}

export function GargalosLeads({ data }: Props) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Gargalos: Leads Parados por Etapa</CardTitle>
        <p className="text-xs text-muted-foreground">Tempo médio em dias (vermelho = gargalo)</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="etapa" type="category" tick={{ fontSize: 11 }} width={120} />
            <Tooltip formatter={(v: number) => `${v} dias`} />
            <Bar dataKey="tempoMedio" name="Tempo Médio (dias)" radius={[0, 4, 4, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={getColor(entry.intensidade)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
