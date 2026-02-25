import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Item { etapa: string; quantidade: number }
interface Props { data: Item[] }

export function LeadsByEtapa({ data }: Props) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Leads por Etapa do Funil</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
            <YAxis dataKey="etapa" type="category" tick={{ fontSize: 11 }} width={120} />
            <Tooltip />
            <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
