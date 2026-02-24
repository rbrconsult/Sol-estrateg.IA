import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyFull } from "@/lib/formatters";
import type { Lead } from "@/data/leadsMockData";

const statusVariant: Record<Lead["status"], "default" | "destructive" | "secondary"> = {
  qualificado: "default",
  desqualificado: "destructive",
  pendente: "secondary",
};

const statusLabel: Record<Lead["status"], string> = {
  qualificado: "Qualificado",
  desqualificado: "Desqualificado",
  pendente: "Pendente",
};

const agendamentoLabel: Record<string, string> = {
  whatsapp: "WhatsApp",
  reuniao_online: "Reunião Online",
  ligacao: "Ligação",
};

interface Props { leads: Lead[] }

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
              <TableHead>Data</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>UF</TableHead>
              <TableHead className="text-right">Gasto Mensal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Agendamento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="whitespace-nowrap">{format(l.data_entrada, "dd/MM/yy HH:mm")}</TableCell>
                <TableCell className="font-medium">{l.nome}</TableCell>
                <TableCell>{l.origem}</TableCell>
                <TableCell>{l.cidade}</TableCell>
                <TableCell>{l.uf}</TableCell>
                <TableCell className="text-right">{formatCurrencyFull(l.gasto_mensal)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[l.status]}>{statusLabel[l.status]}</Badge>
                </TableCell>
                <TableCell>{l.tipo_agendamento ? agendamentoLabel[l.tipo_agendamento] : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
