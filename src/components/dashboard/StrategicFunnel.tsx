import { useMemo, useState } from "react";
import { ProjectsModal } from "./ProjectsModal";
import { Proposal } from "@/data/dataAdapter";
import { DollarSign, ChevronRight } from "lucide-react";

interface FunnelStage {
  etapa: string;
  quantidade: number;
  valor: number;
  taxaConversao: number;
}

interface StrategicFunnelProps {
  data: FunnelStage[];
  proposals: Proposal[];
}

// Ordem estratégica do funil de vendas
const FUNNEL_ORDER = [
  'TRAFEGO PAGO',
  'PROSPECÇÃO',
  'QUALIFICAÇÃO',
  'QUALIFICADO',
  'CONTATO REALIZADO',
  'PROPOSTA',
  'NEGOCIAÇÃO'
];

const stageColors = [
  'bg-blue-500',
  'bg-amber-400',
  'bg-emerald-500',
  'bg-rose-400',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-orange-500'
];

export function StrategicFunnel({ data, proposals }: StrategicFunnelProps) {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Ordenar dados pela ordem estratégica do funil
  const sortedData = useMemo(() => {
    const ordered: FunnelStage[] = [];
    FUNNEL_ORDER.forEach(etapa => {
      const found = data.find(d => d.etapa === etapa);
      if (found) {
        ordered.push(found);
      }
    });
    // Adiciona etapas que não estão no FUNNEL_ORDER
    data.forEach(d => {
      if (!FUNNEL_ORDER.includes(d.etapa) && !ordered.find(o => o.etapa === d.etapa)) {
        ordered.push(d);
      }
    });
    return ordered;
  }, [data]);

  const maxValue = useMemo(() => Math.max(...sortedData.map(d => d.valor), 1), [sortedData]);
  const firstStageQty = sortedData[0]?.quantidade || 1;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const handleStageClick = (etapa: string) => {
    setSelectedStage(etapa);
    setIsModalOpen(true);
  };

  const filteredProposals = useMemo(() => {
    if (!selectedStage) return [];
    return proposals.filter(p => p.etapa === selectedStage);
  }, [selectedStage, proposals]);

  const totalValue = sortedData.reduce((acc, d) => acc + d.valor, 0);
  const totalProjects = sortedData.reduce((acc, d) => acc + d.quantidade, 0);

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-6 shadow-card opacity-0 animate-fade-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
        <div className="mb-6 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-success" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Funil de Vendas (R$)</h3>
            <p className="text-sm text-muted-foreground">Clique para ver os projetos</p>
          </div>
        </div>

        {/* Funnel Bars */}
        <div className="space-y-3">
          {sortedData.map((stage, index) => {
            const widthPercent = Math.max(15, (stage.valor / maxValue) * 100);
            const conversionFromTop = ((stage.quantidade / firstStageQty) * 100).toFixed(1);
            const color = stageColors[index % stageColors.length];

            return (
              <div
                key={stage.etapa}
                className="group cursor-pointer"
                onClick={() => handleStageClick(stage.etapa)}
              >
                {/* Stage Label */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{stage.etapa}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {conversionFromTop}% do topo
                  </span>
                </div>

                {/* Bar Container */}
                <div className="relative h-10 w-full rounded-lg bg-muted/30 overflow-hidden group-hover:bg-muted/50 transition-colors">
                  {/* Filled Bar */}
                  <div
                    className={`absolute left-0 top-0 h-full ${color} rounded-lg transition-all duration-300 group-hover:brightness-110`}
                    style={{ width: `${widthPercent}%` }}
                  />
                  
                  {/* Content inside bar */}
                  <div className="absolute inset-0 flex items-center px-3">
                    <div 
                      className="flex items-center justify-between w-full"
                      style={{ width: `${widthPercent}%` }}
                    >
                      <span className="text-sm font-bold text-white drop-shadow-sm">
                        {stage.quantidade}
                      </span>
                      <span className="text-sm font-semibold text-white drop-shadow-sm">
                        {formatCurrency(stage.valor)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-3 gap-4 rounded-lg bg-muted/30 p-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Pipeline Total</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(totalValue)}</p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-xs text-muted-foreground">Projetos</p>
            <p className="text-lg font-bold text-foreground">{totalProjects}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Ticket Médio</p>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(totalProjects > 0 ? totalValue / totalProjects : 0)}
            </p>
          </div>
        </div>
      </div>

      <ProjectsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Projetos - ${selectedStage}`}
        proposals={filteredProposals}
      />
    </>
  );
}
