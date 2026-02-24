import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Lead } from "@/data/leadsMockData";

interface Props { leads: Lead[] }

export function LeadsTrendChart({ leads }: Props) {
  const data = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((l) => {
      const key = format(startOfDay(l.data_entrada), "dd/MM");
      map[key] = (map[key] || 0) + 1;
    });
    // sort by date
    const sorted = Object.entries(map).sort((a, b) => {
      const [dA, mA] = a[0].split("/").map(Number);
      const [dB, mB] = b[0].split("/").map(Number);
      return mA !== mB ? mA - mB : dA - dB;
    });
    return sorted.map(([date, leads]) => ({ date, leads }));
  }, [leads]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Tendência de Leads ao Longo do Tempo</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Area type="monotone" dataKey="leads" stroke="hsl(var(--primary))" fill="url(#leadGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
