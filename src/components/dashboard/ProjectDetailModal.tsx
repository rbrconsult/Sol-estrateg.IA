import { Proposal } from "@/data/dataAdapter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  Zap, 
  DollarSign,
  Briefcase,
  FileText
} from "lucide-react";

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal | null;
}

export function ProjectDetailModal({ isOpen, onClose, proposal }: ProjectDetailModalProps) {
  if (!proposal) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const getSLAColor = (sla: number) => {
    if (sla <= 24) return 'bg-green-500/20 text-green-400';
    if (sla <= 48) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Detalhes do Projeto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="rounded-lg bg-muted/30 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">{proposal.nomeCliente}</h3>
                <p className="text-sm text-muted-foreground">{proposal.nomeProposta}</p>
                <p className="text-xs text-muted-foreground mt-1">ID: {proposal.projetoId}</p>
              </div>
              <Badge className={getSLAColor(proposal.slaProposta)}>
                <Clock className="h-3 w-3 mr-1" />
                SLA: {proposal.slaProposta}h
              </Badge>
            </div>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-primary/10 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                Valor da Proposta
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(proposal.valorProposta)}
              </p>
            </div>
            <div className="rounded-lg bg-warning/10 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Zap className="h-4 w-4" />
                Potência do Sistema
              </div>
              <p className="text-2xl font-bold text-foreground">
                {proposal.potenciaSistema.toFixed(2)} kWp
              </p>
            </div>
          </div>

          {/* Etapa */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <FileText className="h-4 w-4" />
              Etapa Atual
            </div>
            <Badge variant="outline" className="text-sm">
              {proposal.etapa}
            </Badge>
          </div>

          {/* Contato do Cliente */}
          <div className="rounded-lg border border-border p-4">
            <h4 className="font-semibold text-foreground mb-3">Contato do Cliente</h4>
            <div className="space-y-2">
              {proposal.clienteTelefone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${proposal.clienteTelefone}`} className="text-primary hover:underline">
                    {proposal.clienteTelefone}
                  </a>
                </div>
              )}
              {proposal.clienteEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${proposal.clienteEmail}`} className="text-primary hover:underline">
                    {proposal.clienteEmail}
                  </a>
                </div>
              )}
              {!proposal.clienteTelefone && !proposal.clienteEmail && (
                <p className="text-sm text-muted-foreground">Nenhum contato disponível</p>
              )}
            </div>
          </div>

          {/* Responsáveis */}
          <div className="rounded-lg border border-border p-4">
            <h4 className="font-semibold text-foreground mb-3">Responsáveis</h4>
            <div className="space-y-2">
              {proposal.responsavel && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Comercial Responsável:</span>
                  <span className="font-medium text-foreground">{proposal.responsavel}</span>
                </div>
              )}
              {proposal.representante && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Vendedor:</span>
                  <span className="font-medium text-foreground">{proposal.representante}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-lg border border-border p-4">
            <h4 className="font-semibold text-foreground mb-3">Datas</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Criação do Projeto:</span>
                <span className="font-medium text-foreground">{formatDate(proposal.dataCriacaoProjeto)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Criação da Proposta:</span>
                <span className="font-medium text-foreground">{formatDate(proposal.dataCriacaoProposta)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Última Atualização:</span>
                <span className="font-medium text-foreground">{formatDate(proposal.ultimaAtualizacao)}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
