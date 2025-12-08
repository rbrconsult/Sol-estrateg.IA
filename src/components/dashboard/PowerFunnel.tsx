import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ProjectsModal } from "./ProjectsModal";
import { Proposal } from "@/data/dataAdapter";
import { ChevronRight, Zap } from "lucide-react";

interface PowerStage {
  etapa: string;
  quantidade: number;
  potencia: number;
  taxaConversao: number;
}

interface PowerFunnelProps {
  data: PowerStage[];
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

export function PowerFunnel({ data, proposals }: PowerFunnelProps) {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Ordenar dados pela ordem estratégica do funil
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const indexA = FUNNEL_ORDER.indexOf(a.etapa);
      const indexB = FUNNEL_ORDER.indexOf(b.etapa);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [data]);

  const maxQuantidade = useMemo(() => 
    Math.max(...sortedData.map(d => d.quantidade)), 
    [sortedData]
  );

  const formatPower = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)} MWp`;
    }
    return `${value.toFixed(1)} kWp`;
  };

  const handleStageClick = (etapa: string) => {
    setSelectedStage(etapa);
    setIsModalOpen(true);
  };

  const filteredProposals = useMemo(() => {
    if (!selectedStage) return [];
    return proposals.filter(p => p.etapa === selectedStage);
  }, [selectedStage, proposals]);

  // Calcular taxa de conversão entre etapas
  const getConversionRate = (currentIndex: number) => {
    if (currentIndex === 0) return 100;
    const current = sortedData[currentIndex]?.quantidade || 0;
    const previous = sortedData[0]?.quantidade || 1;
    return (current / previous) * 100;
  };

  const stageColors = [
    'from-amber-600 to-amber-500',
    'from-amber-500 to-orange-500',
    'from-orange-500 to-orange-400',
    'from-yellow-500 to-yellow-400',
    'from-lime-500 to-lime-400',
    'from-green-500 to-green-400',
    'from-emerald-500 to-emerald-400'
  ];

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-6 shadow-card opacity-0 animate-fade-up" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
        <div className="mb-6 flex items-center gap-2">
          <Zap className="h-5 w-5 text-warning" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Funil de Potência (kWh)</h3>
            <p className="text-sm text-muted-foreground">Clique em uma etapa para ver os projetos</p>
          </div>
        </div>

        <div className="space-y-2">
          {sortedData.map((stage, index) => {
            const widthPercent = maxQuantidade > 0 
              ? Math.max(25, (stage.quantidade / maxQuantidade) * 100)
              : 25;
            const conversionRate = getConversionRate(index);

            return (
              <div 
                key={stage.etapa} 
                className="group cursor-pointer transition-transform hover:scale-[1.01]"
                onClick={() => handleStageClick(stage.etapa)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{stage.etapa}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{stage.quantidade}</span>
                    <span className="font-semibold text-foreground w-24 text-right">{formatPower(stage.potencia)}</span>
                  </div>
                </div>
                
                <div className="relative h-12 w-full overflow-hidden rounded-lg bg-muted/30 group-hover:bg-muted/50 transition-colors">
                  <div
                    className={cn(
                      "absolute left-0 top-0 h-full rounded-lg bg-gradient-to-r transition-all duration-300",
                      stageColors[index % stageColors.length]
                    )}
                    style={{ 
                      width: `${widthPercent}%`,
                      clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)'
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-4">
                    <span className="text-sm font-bold text-white drop-shadow-md">
                      {stage.quantidade} projetos
                    </span>
                    <span className="text-xs font-medium text-white/90 drop-shadow-md bg-black/20 px-2 py-0.5 rounded">
                      {conversionRate.toFixed(1)}% do topo
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumo */}
        <div className="mt-6 grid grid-cols-3 gap-4 rounded-lg bg-muted/30 p-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Potência Total</p>
            <p className="text-xl font-bold text-foreground">
              {formatPower(sortedData.reduce((acc, d) => acc + d.potencia, 0))}
            </p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-xs text-muted-foreground">Total Projetos</p>
            <p className="text-xl font-bold text-foreground">
              {sortedData.reduce((acc, d) => acc + d.quantidade, 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Potência Média</p>
            <p className="text-xl font-bold text-foreground">
              {formatPower(
                sortedData.reduce((acc, d) => acc + d.potencia, 0) / 
                Math.max(1, sortedData.reduce((acc, d) => acc + d.quantidade, 0))
              )}
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
