import { Proposal } from "@/data/dataAdapter";
import { User, Zap, Clock, MapPin, Mail, Phone, Thermometer, Star, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProjectCardProps {
  proposal: Proposal;
  onClick: () => void;
}

const tempConfig: Record<string, { label: string; emoji: string; className: string }> = {
  QUENTE: { label: "Quente", emoji: "🔥", className: "bg-red-500/20 text-red-400 border-red-500/40" },
  MORNO: { label: "Morno", emoji: "🌤", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40" },
  FRIO: { label: "Frio", emoji: "❄️", className: "bg-blue-500/20 text-blue-400 border-blue-500/40" },
};

export function ProjectCard({ proposal, onClick }: ProjectCardProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);

  const getSLAColor = (sla: number) => {
    if (sla <= 24) return "bg-green-500/20 text-green-400 border-green-500/50";
    if (sla <= 48) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    return "bg-red-500/20 text-red-400 border-red-500/50";
  };

  const cidade = proposal.makeCidade || "";
  const email = proposal.makeEmail || proposal.clienteEmail || "";
  const telefone = proposal.clienteTelefone || "";
  const valorConta = proposal.makeValorConta || "";
  const imovel = proposal.makeImovel || "";
  const temp = proposal.temperatura || proposal.makeTemperatura?.toUpperCase() || "";
  const score = proposal.solScore || (proposal.makeScore ? parseFloat(proposal.makeScore) : 0);
  const nome = proposal.makeNome || proposal.nomeCliente;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:shadow-md hover:border-primary/50 hover:scale-[1.02] space-y-2"
    >
      {/* Header: Nome + Temperatura */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-foreground text-sm line-clamp-1">{nome}</h4>
          <p className="text-xs text-muted-foreground line-clamp-1">{proposal.nomeProposta}</p>
        </div>
        {temp && tempConfig[temp] && (
          <Badge variant="outline" className={`text-[10px] shrink-0 ${tempConfig[temp].className}`}>
            {tempConfig[temp].emoji} {tempConfig[temp].label}
          </Badge>
        )}
      </div>

      {/* Valores */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-foreground">{formatCurrency(proposal.valorProposta)}</span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Zap className="h-3 w-3" />
          <span>{proposal.potenciaSistema.toFixed(1)} kWp</span>
        </div>
      </div>

      {/* Dados do cliente */}
      <div className="space-y-1 text-xs text-muted-foreground">
        {telefone && (
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 shrink-0" />
            <span className="truncate">{telefone}</span>
          </div>
        )}
        {email && (
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{email}</span>
          </div>
        )}
        {cidade && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{cidade}</span>
          </div>
        )}
        {valorConta && (
          <div className="flex items-center gap-1.5">
            <Home className="h-3 w-3 shrink-0" />
            <span className="truncate">Conta: R$ {valorConta}</span>
          </div>
        )}
      </div>

      {/* Score + Responsáveis */}
      <div className="space-y-1">
        {score > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <Star className="h-3 w-3 text-yellow-400" />
            <span className="text-muted-foreground">Score: {score.toFixed(1)}</span>
          </div>
        )}
        {proposal.responsavel && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate">{proposal.responsavel}</span>
          </div>
        )}
      </div>

      {/* Footer: SLA e ID */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-[10px] text-muted-foreground">{proposal.projetoId}</span>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] ${getSLAColor(proposal.slaProposta)}`}>
          <Clock className="h-3 w-3" />
          <span>{proposal.slaProposta}h</span>
        </div>
      </div>
    </div>
  );
}
