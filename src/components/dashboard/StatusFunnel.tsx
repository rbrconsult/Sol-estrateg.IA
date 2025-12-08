import { useMemo, useState } from "react";
import { ProjectsModal } from "./ProjectsModal";
import { Proposal } from "@/data/dataAdapter";
import { Activity, CheckCircle, XCircle, Clock } from "lucide-react";

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
    color: 'bg-blue-500', 
    icon: Clock, 
    label: 'Em Aberto',
    textColor: 'text-blue-500'
  },
  'Ganho': { 
    color: 'bg-emerald-500', 
    icon: CheckCircle, 
    label: 'Ganhos',
    textColor: 'text-emerald-500'
  },
  'Perdido': { 
    color: 'bg-red-500', 
    icon: XCircle, 
    label: 'Perdidos',
    textColor: 'text-red-500'
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

  const handleStatusClick = (status: string) => {
    setSelectedStatus(status);
    setIsModalOpen(true);
  };

  const filteredProposals = useMemo(() => {
    if (!selectedStatus) return [];
    return proposals.filter(p => p.status === selectedStatus);
  }, [selectedStatus, proposals]);

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-6 shadow-card opacity-0 animate-fade-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
        <div className="mb-6 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Ciclo de Vida</h3>
            <p className="text-sm text-muted-foreground">Distribuição por status</p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {data.map((item) => {
            const config = statusConfig[item.status as keyof typeof statusConfig];
            const Icon = config?.icon || Clock;
            
            return (
              <button
                key={item.status}
                onClick={() => handleStatusClick(item.status)}
                className="group rounded-lg border border-border bg-muted/30 p-4 text-left transition-all hover:bg-muted/50 hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`rounded-full p-1.5 ${config?.color} bg-opacity-20`}>
                    <Icon className={`h-4 w-4 ${config?.textColor}`} />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {config?.label || item.status}
                  </span>
                </div>
                <p className={`text-2xl font-bold ${config?.textColor}`}>
                  {item.quantidade}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(item.valor)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.percentual.toFixed(1)}% do total
                </p>
              </button>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted/30">
            {data.map((item, index) => {
              const config = statusConfig[item.status as keyof typeof statusConfig];
              return (
                <div
                  key={item.status}
                  className={`${config?.color} transition-all duration-500`}
                  style={{ width: `${item.percentual}%` }}
                  title={`${config?.label}: ${item.quantidade} (${item.percentual.toFixed(1)}%)`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Total: {totalQty} propostas</span>
            <span>{formatCurrency(totalValue)}</span>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-2 gap-4 rounded-lg bg-muted/30 p-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
            <p className="text-xl font-bold text-emerald-500">
              {totalQty > 0 ? ((data.find(d => d.status === 'Ganho')?.quantidade || 0) / totalQty * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Taxa de Perda</p>
            <p className="text-xl font-bold text-red-500">
              {totalQty > 0 ? ((data.find(d => d.status === 'Perdido')?.quantidade || 0) / totalQty * 100).toFixed(1) : 0}%
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
