import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SLATimer } from "./SLATimer";
import { cn } from "@/lib/utils";

interface Ticket {
  id: string;
  titulo: string;
  categoria: string;
  prioridade: string;
  status: string;
  sla_deadline: string;
  created_at: string;
  fluxo?: string;
  cliente_nome?: string;
}

interface TicketListProps {
  tickets: Ticket[];
  onSelectTicket: (id: string) => void;
  selectedTicketId?: string;
}

const priorityLabels: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

const statusLabels: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em Andamento",
  aguardando_usuario: "Aguard. Usuário",
  resolvido: "Resolvido",
  fechado: "Fechado",
};

const categoryEmojis: Record<string, string> = {
  bug: "🐛",
  duvida: "❓",
  melhoria: "✨",
  urgencia: "🚨",
};

export function TicketList({ tickets, onSelectTicket, selectedTicketId }: TicketListProps) {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum chamado encontrado. Abra um novo chamado acima.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="w-20">ID</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Fluxo</TableHead>
            <TableHead className="w-24">Categoria</TableHead>
            <TableHead className="w-24">Prioridade</TableHead>
            <TableHead className="w-28">Status</TableHead>
            <TableHead className="w-28">SLA</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow
              key={ticket.id}
              className={cn(
                "cursor-pointer transition-colors",
                selectedTicketId === ticket.id && "bg-primary/10"
              )}
              onClick={() => onSelectTicket(ticket.id)}
            >
              <TableCell className="font-mono text-xs text-muted-foreground">
                #{ticket.id.slice(0, 6)}
              </TableCell>
              <TableCell className="font-medium">
                <div>{ticket.titulo}</div>
                {ticket.cliente_nome && <div className="text-xs text-muted-foreground">{ticket.cliente_nome}</div>}
              </TableCell>
              <TableCell className="text-xs">{ticket.fluxo || "—"}</TableCell>
              <TableCell>
                <span>{categoryEmojis[ticket.categoria] || ""} {ticket.categoria}</span>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    ticket.prioridade === "critica" && "border-destructive/50 text-destructive",
                    ticket.prioridade === "alta" && "border-orange-500/50 text-orange-400",
                    ticket.prioridade === "media" && "border-amber-500/50 text-amber-400",
                    ticket.prioridade === "baixa" && "border-emerald-500/50 text-emerald-400"
                  )}
                >
                  {priorityLabels[ticket.prioridade]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    ticket.status === "aberto" && "border-blue-500/50 text-blue-400",
                    ticket.status === "em_andamento" && "border-amber-500/50 text-amber-400",
                    ticket.status === "aguardando_usuario" && "border-purple-500/50 text-purple-400",
                    ticket.status === "resolvido" && "border-emerald-500/50 text-emerald-400",
                    ticket.status === "fechado" && "border-muted-foreground/50 text-muted-foreground"
                  )}
                >
                  {statusLabels[ticket.status]}
                </Badge>
              </TableCell>
              <TableCell>
                {ticket.status !== "fechado" && ticket.status !== "resolvido" ? (
                  <SLATimer deadline={ticket.sla_deadline} createdAt={ticket.created_at} />
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
