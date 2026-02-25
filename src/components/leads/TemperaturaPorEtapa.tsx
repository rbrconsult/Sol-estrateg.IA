import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Item { etapa: string; quente: number; morno: number; frio: number; sem: number }
interface Props { data: Item[] }

export function TemperaturaPorEtapa({ data }: Props) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Temperatura por Etapa</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="etapa" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="quente" name="Quente" fill="#f97316" stackId="a" radius={[0, 0, 0, 0]} />
            <Bar dataKey="morno" name="Morno" fill="#f59e0b" stackId="a" />
            <Bar dataKey="frio" name="Frio" fill="#60a5fa" stackId="a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
