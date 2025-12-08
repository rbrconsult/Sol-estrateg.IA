import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Proposal } from "@/data/dataAdapter";

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  proposals: Proposal[];
}

export function ProjectsModal({ isOpen, onClose, title, proposals }: ProjectsModalProps) {
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
        return <Badge className="bg-primary/20 text-primary border-0">Aberto</Badge>;
    }
  };

  const totalValor = proposals.reduce((acc, p) => acc + p.valorProposta, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <div className="flex items-center gap-4 text-sm font-normal">
              <span className="text-muted-foreground">{proposals.length} projetos</span>
              <span className="font-semibold text-primary">{formatCurrency(totalValor)}</span>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">ID</TableHead>
                <TableHead className="text-muted-foreground">Cliente</TableHead>
                <TableHead className="text-muted-foreground">Etapa</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Vendedor</TableHead>
                <TableHead className="text-muted-foreground">Pré-Vendedor</TableHead>
                <TableHead className="text-muted-foreground text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((proposal) => (
                <TableRow key={proposal.id} className="border-border hover:bg-muted/50">
                  <TableCell className="font-mono text-xs">{proposal.projetoId}</TableCell>
                  <TableCell className="font-medium">{proposal.nomeCliente}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{proposal.etapa}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                  <TableCell className="text-sm">{proposal.representante || '-'}</TableCell>
                  <TableCell className="text-sm">{proposal.responsavel || '-'}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(proposal.valorProposta)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
