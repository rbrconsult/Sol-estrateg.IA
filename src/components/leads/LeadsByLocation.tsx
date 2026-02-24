import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrencyFull } from "@/lib/formatters";
import type { Lead } from "@/data/leadsMockData";

interface Props { leads: Lead[] }

export function LeadsByLocation({ leads }: Props) {
  const data = useMemo(() => {
    const map: Record<string, { count: number; totalGasto: number }> = {};
    leads.forEach((l) => {
      const key = `${l.cidade}|${l.uf}`;
      if (!map[key]) map[key] = { count: 0, totalGasto: 0 };
      map[key].count++;
      map[key].totalGasto += l.gasto_mensal;
    });
    return Object.entries(map)
      .map(([key, v]) => {
        const [cidade, uf] = key.split("|");
        return { cidade, uf, count: v.count, gastoMedio: v.totalGasto / v.count };
      })
      .sort((a, b) => b.count - a.count);
  }, [leads]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Leads por Cidade / UF</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[320px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cidade</TableHead>
              <TableHead>UF</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead className="text-right">Gasto Médio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={`${row.cidade}-${row.uf}`}>
                <TableCell className="font-medium">{row.cidade}</TableCell>
                <TableCell>{row.uf}</TableCell>
                <TableCell className="text-right">{row.count}</TableCell>
                <TableCell className="text-right">{formatCurrencyFull(row.gastoMedio)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
