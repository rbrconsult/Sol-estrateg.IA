import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { safeToFixed } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Item { origem: string; scoreMedio: number; quantidade: number }
interface Props { data: Item[] }

export function ScorePorOrigem({ data }: Props) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Score Médio por Origem</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="origem" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => safeToFixed(v, 1)} />
            <Bar dataKey="scoreMedio" name="Score Médio" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
