import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Proposal } from "@/data/dataAdapter";
import { useLead360 } from "@/contexts/Lead360Context";
import { Phone, Mail, Copy } from "lucide-react";
import { toast } from "sonner";

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  proposals: Proposal[];
}

export function ProjectsModal({ isOpen, onClose, title, proposals }: ProjectsModalProps) {
  const { openLead360 } = useLead360();
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ganho':
        return <Badge className="bg-success/20 text-success border-0">Ganho</Badge>;
      case 'Perdido':
        return <Badge className="bg-destructive/20 text-destructive border-0">Perdido</Badge>;
      default:
        return <Badge className="bg-info/20 text-info border-0">Aberto</Badge>;
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success(`${type} copiado!`);
    }
  };

  const totalValor = proposals.reduce((acc, p) => acc + p.valorProposta, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-lg font-bold">{title}</span>
            <div className="flex items-center gap-4 text-sm font-normal">
              <span className="text-muted-foreground">{proposals.length} projetos</span>
              <span className="font-bold text-primary">{formatCurrency(totalValor)}</span>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[65vh]">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-secondary/30">
                <TableHead className="text-muted-foreground font-semibold">ID</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Cliente</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Contato</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Etapa</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Vendedor</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((proposal) => (
                <TableRow key={proposal.id} className="border-border hover:bg-secondary/30">
                  <TableCell className="font-mono text-xs text-muted-foreground">{proposal.projetoId}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{proposal.nomeCliente}</p>
                      {proposal.responsavel && (
                        <p className="text-xs text-muted-foreground">Pré-venda: {proposal.responsavel}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {proposal.clienteTelefone && (
                        <button
                          onClick={() => copyToClipboard(proposal.clienteTelefone, 'Telefone')}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-info transition-colors group"
                        >
                          <Phone className="h-3 w-3" />
                          <span>{proposal.clienteTelefone}</span>
                          <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                      {proposal.clienteEmail && (
                        <button
                          onClick={() => copyToClipboard(proposal.clienteEmail, 'Email')}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-info transition-colors group"
                        >
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{proposal.clienteEmail}</span>
                          <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                      {!proposal.clienteTelefone && !proposal.clienteEmail && (
                        <span className="text-xs text-muted-foreground/50">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-medium">{proposal.etapa}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                  <TableCell className="text-sm text-foreground">{proposal.representante || '-'}</TableCell>
                  <TableCell className="text-right font-bold text-foreground">{formatCurrency(proposal.valorProposta)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}