import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyAbbrev } from "@/lib/formatters";
import type { Proposal } from "@/data/dataAdapter";

const tempBadge: Record<string, "default" | "destructive" | "secondary"> = {
  QUENTE: "destructive",
  MORNO: "secondary",
  FRIO: "default",
};

interface Props { leads: Proposal[] }

export function LeadsTable({ leads }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Tabela Detalhada de Leads</CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto max-h-[500px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Temperatura</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-right">SLA (dias)</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.nomeCliente}</TableCell>
                <TableCell>{l.etapa}</TableCell>
                <TableCell>
                  <Badge variant={l.status === 'Ganho' ? 'default' : l.status === 'Perdido' ? 'destructive' : 'secondary'}>
                    {l.status}
                  </Badge>
                </TableCell>
                <TableCell>{l.etiquetas || '—'}</TableCell>
                <TableCell>
                  {l.temperatura ? (
                    <Badge variant={tempBadge[l.temperatura] || 'secondary'}>{l.temperatura}</Badge>
                  ) : '—'}
                </TableCell>
                <TableCell className="text-right">{l.solScore > 0 ? l.solScore.toFixed(1) : '—'}</TableCell>
                <TableCell className="text-right">{l.tempoNaEtapa}</TableCell>
                <TableCell className="text-right">{formatCurrencyAbbrev(l.valorProposta)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
