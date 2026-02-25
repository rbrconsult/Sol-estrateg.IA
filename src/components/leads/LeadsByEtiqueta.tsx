import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--warning, 45 93% 47%))",
  "hsl(142 71% 45%)",
  "hsl(var(--destructive))",
  "hsl(200 80% 50%)",
  "hsl(280 60% 55%)",
];

interface Item { name: string; quantidade: number; valor: number; qualificados: number }
interface Props { data: Item[] }

export function LeadsByEtiqueta({ data }: Props) {
  const chartData = useMemo(() => data.slice(0, 8).map(d => ({ name: d.name, value: d.quantidade })), [data]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Leads por Origem / Etiqueta</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
