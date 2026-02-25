import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrencyAbbrev } from "@/lib/formatters";

interface Item {
  origem: string;
  totalLeads: number;
  ganhos: number;
  taxaConversao: number;
  valorTotal: number;
  scoreMedio: number;
  ticketMedio: number;
}
interface Props { data: Item[] }

export function ROIPorOrigem({ data }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">ROI por Origem</CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto max-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead className="text-right">Ganhos</TableHead>
              <TableHead className="text-right">Conversão</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead className="text-right">Score Médio</TableHead>
              <TableHead className="text-right">Ticket Médio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((d) => (
              <TableRow key={d.origem}>
                <TableCell className="font-medium">{d.origem}</TableCell>
                <TableCell className="text-right">{d.totalLeads}</TableCell>
                <TableCell className="text-right">{d.ganhos}</TableCell>
                <TableCell className="text-right">{d.taxaConversao.toFixed(1)}%</TableCell>
                <TableCell className="text-right">{formatCurrencyAbbrev(d.valorTotal)}</TableCell>
                <TableCell className="text-right">{d.scoreMedio.toFixed(1)}</TableCell>
                <TableCell className="text-right">{formatCurrencyAbbrev(d.ticketMedio)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
