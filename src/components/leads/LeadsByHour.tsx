import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getHours } from "date-fns";
import type { Lead } from "@/data/leadsMockData";

const RANGES = [
  { label: "06-09h", min: 6, max: 8 },
  { label: "09-12h", min: 9, max: 11 },
  { label: "12-14h", min: 12, max: 13 },
  { label: "14-17h", min: 14, max: 16 },
  { label: "17-20h", min: 17, max: 19 },
  { label: "20-23h", min: 20, max: 22 },
  { label: "Outros", min: -1, max: -1 },
];

interface Props { leads: Lead[] }

export function LeadsByHour({ leads }: Props) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    RANGES.forEach((r) => (counts[r.label] = 0));
    leads.forEach((l) => {
      const h = getHours(l.data_entrada);
      const range = RANGES.find((r) => h >= r.min && h <= r.max) || RANGES[RANGES.length - 1];
      counts[range.label]++;
    });
    return RANGES.map((r) => ({ name: r.label, leads: counts[r.label] }));
  }, [leads]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Leads por Faixa Horária</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="leads" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
