import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface VendedorData {
  nome: string;
  totalPropostas: number;
  ganhos: number;
  perdidos: number;
  abertos: number;
  valorTotal: number;
  taxaConversao: number;
  atividades: number;
}

interface VendedorTableProps {
  data: VendedorData[];
}

export function VendedorTable({ data }: VendedorTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  const sortedData = [...data].sort((a, b) => b.valorTotal - a.valorTotal);

  return (
    <div className="rounded-xl border border-border bg-card shadow-card opacity-0 animate-fade-up" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
      <div className="p-6 pb-4">
        <h3 className="text-lg font-semibold text-foreground">Ranking de Vendedores</h3>
        <p className="text-sm text-muted-foreground">Performance detalhada por vendedor</p>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-muted-foreground font-medium">#</TableHead>
              <TableHead className="text-muted-foreground font-medium">Vendedor</TableHead>
              <TableHead className="text-muted-foreground font-medium text-center">Propostas</TableHead>
              <TableHead className="text-muted-foreground font-medium text-center">Ganhos</TableHead>
              <TableHead className="text-muted-foreground font-medium text-center">Perdidos</TableHead>
              <TableHead className="text-muted-foreground font-medium text-center">Em Aberto</TableHead>
              <TableHead className="text-muted-foreground font-medium text-right">Valor Fechado</TableHead>
              <TableHead className="text-muted-foreground font-medium text-center">Conversão</TableHead>
              <TableHead className="text-muted-foreground font-medium text-center">Atividades</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((vendedor, index) => (
              <TableRow 
                key={vendedor.nome} 
                className="border-border hover:bg-muted/50 transition-colors"
              >
                <TableCell className="font-medium">
                  <span className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                    index === 0 && "bg-warning/20 text-warning",
                    index === 1 && "bg-muted text-muted-foreground",
                    index === 2 && "bg-warning/10 text-warning/70",
                    index > 2 && "text-muted-foreground"
                  )}>
                    {index + 1}
                  </span>
                </TableCell>
                <TableCell className="font-medium text-foreground">{vendedor.nome}</TableCell>
                <TableCell className="text-center text-foreground">{vendedor.totalPropostas}</TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center rounded-full bg-success/10 px-2 py-0.5 text-sm font-medium text-success">
                    {vendedor.ganhos}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center rounded-full bg-destructive/10 px-2 py-0.5 text-sm font-medium text-destructive">
                    {vendedor.perdidos}
                  </span>
                </TableCell>
                <TableCell className="text-center text-muted-foreground">{vendedor.abertos}</TableCell>
                <TableCell className="text-right font-semibold text-foreground">
                  {formatCurrency(vendedor.valorTotal)}
                </TableCell>
                <TableCell className="text-center">
                  <span className={cn(
                    "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-sm font-medium",
                    vendedor.taxaConversao >= 25 && "bg-success/10 text-success",
                    vendedor.taxaConversao >= 15 && vendedor.taxaConversao < 25 && "bg-warning/10 text-warning",
                    vendedor.taxaConversao < 15 && "bg-destructive/10 text-destructive"
                  )}>
                    {vendedor.taxaConversao.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-center text-muted-foreground">{vendedor.atividades}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
