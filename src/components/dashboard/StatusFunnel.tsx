import { useMemo, useState } from "react";
import { ProjectsModal } from "./ProjectsModal";
import { Proposal } from "@/data/dataAdapter";
import { Activity, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown } from "lucide-react";

interface StatusData {
  status: string;
  quantidade: number;
  valor: number;
  percentual: number;
}

interface StatusFunnelProps {
  data: StatusData[];
  proposals: Proposal[];
}

const statusConfig = {
  'Aberto': { 
    bgClass: 'bg-info/20 border-info/40', 
    barClass: 'bg-info',
    icon: Clock, 
    label: 'Em Aberto',
    textColor: 'text-info'
  },
  'Ganho': { 
    bgClass: 'bg-success/20 border-success/40', 
    barClass: 'bg-success',
    icon: CheckCircle, 
    label: 'Ganhos',
    textColor: 'text-success'
  },
  'Perdido': { 
    bgClass: 'bg-destructive/20 border-destructive/40', 
    barClass: 'bg-destructive',
    icon: XCircle, 
    label: 'Perdidos',
    textColor: 'text-destructive'
  }
};

export function StatusFunnel({ data, proposals }: StatusFunnelProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalValue = data.reduce((acc, d) => acc + d.valor, 0);
  const totalQty = data.reduce((acc, d) => acc + d.quantidade, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const formatCurrencyFull = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const handleStatusClick = (status: string) => {
    setSelectedStatus(status);
    setIsModalOpen(true);
  };

  const filteredProposals = useMemo(() => {
    if (!selectedStatus) return [];
    return proposals.filter(p => p.status === selectedStatus);
  }, [selectedStatus, proposals]);

  const taxaConversao = totalQty > 0 ? ((data.find(d => d.status === 'Ganho')?.quantidade || 0) / totalQty * 100) : 0;
  const taxaPerda = totalQty > 0 ? ((data.find(d => d.status === 'Perdido')?.quantidade || 0) / totalQty * 100) : 0;

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-6 shadow-card opacity-0 animate-fade-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/20 p-2">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Ciclo de Vida</h3>
              <p className="text-sm text-muted-foreground">Distribuição por status das propostas</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-lg font-bold text-foreground">{totalQty} propostas</p>
          </div>
        </div>

        {/* Status Cards - Horizontal Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {data.map((item) => {
            const config = statusConfig[item.status as keyof typeof statusConfig];
            const Icon = config?.icon || Clock;
            
            return (
              <button
                key={item.status}
                onClick={() => handleStatusClick(item.status)}
                className={`group relative rounded-xl border ${config?.bgClass} p-5 text-left transition-all hover:scale-[1.02] hover:shadow-lg`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${config?.barClass}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-base font-semibold text-foreground">
                      {config?.label || item.status}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${config?.textColor}`}>
                    {item.percentual.toFixed(0)}%
                  </span>
                </div>
                
                <div className="space-y-1">
                  <p className={`text-3xl font-bold ${config?.textColor}`}>
                    {item.quantidade}
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatCurrencyFull(item.valor)}
                  </p>
                </div>

                {/* Mini progress bar */}
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted/50">
                  <div
                    className={`h-full ${config?.barClass} transition-all duration-700`}
                    style={{ width: `${item.percentual}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Full Progress Bar */}
        <div className="space-y-3 mb-6">
          <div className="flex h-5 w-full overflow-hidden rounded-full bg-muted/30">
            {data.map((item) => {
              const config = statusConfig[item.status as keyof typeof statusConfig];
              return (
                <div
                  key={item.status}
                  className={`${config?.barClass} transition-all duration-700 first:rounded-l-full last:rounded-r-full`}
                  style={{ width: `${item.percentual}%` }}
                  title={`${config?.label}: ${item.quantidade} (${item.percentual.toFixed(1)}%)`}
                />
              );
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg bg-secondary/50 border border-border/50 p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Taxa de Conversão</p>
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <p className="text-xl font-bold text-success">
                {taxaConversao.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-secondary/50 border border-border/50 p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Taxa de Perda</p>
            <div className="flex items-center justify-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <p className="text-xl font-bold text-destructive">
                {taxaPerda.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-secondary/50 border border-border/50 p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Valor em Aberto</p>
            <p className="text-xl font-bold text-info">
              {formatCurrency(data.find(d => d.status === 'Aberto')?.valor || 0)}
            </p>
          </div>
          <div className="rounded-lg bg-secondary/50 border border-border/50 p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Valor Total</p>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(totalValue)}
            </p>
          </div>
        </div>
      </div>

      <ProjectsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Propostas - ${selectedStatus}`}
        proposals={filteredProposals}
      />
    </>
  );
}