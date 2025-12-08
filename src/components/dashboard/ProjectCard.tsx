import { Proposal } from "@/data/dataAdapter";
import { User, Zap, Clock } from "lucide-react";

interface ProjectCardProps {
  proposal: Proposal;
  onClick: () => void;
}

export function ProjectCard({ proposal, onClick }: ProjectCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  // Calcular SLA badge color
  const getSLAColor = (sla: number) => {
    if (sla <= 24) return 'bg-green-500/20 text-green-400 border-green-500/50';
    if (sla <= 48) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    return 'bg-red-500/20 text-red-400 border-red-500/50';
  };

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:shadow-md hover:border-primary/50 hover:scale-[1.02]"
    >
      {/* Cliente */}
      <div className="mb-2">
        <h4 className="font-medium text-foreground text-sm line-clamp-1">
          {proposal.nomeCliente}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {proposal.nomeProposta}
        </p>
      </div>

      {/* Valores */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-lg font-bold text-foreground">
          {formatCurrency(proposal.valorProposta)}
        </span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Zap className="h-3 w-3" />
          <span>{proposal.potenciaSistema.toFixed(1)} kWp</span>
        </div>
      </div>

      {/* Responsáveis */}
      <div className="mb-2 space-y-1">
        {proposal.responsavel && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate">Comercial: {proposal.responsavel}</span>
          </div>
        )}
        {proposal.representante && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate">Vendedor: {proposal.representante}</span>
          </div>
        )}
      </div>

      {/* Footer: SLA e ID */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {proposal.projetoId}
        </span>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${getSLAColor(proposal.slaProposta)}`}>
          <Clock className="h-3 w-3" />
          <span>{proposal.slaProposta}h</span>
        </div>
      </div>
    </div>
  );
}
