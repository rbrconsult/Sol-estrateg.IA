import { useMemo, useState } from "react";
import { ProjectsModal } from "./ProjectsModal";
import { Proposal } from "@/data/dataAdapter";
import { Zap } from "lucide-react";

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

const stageColors = [
  { bg: 'bg-amber-500', hover: 'hover:bg-amber-600', text: 'text-white' },
  { bg: 'bg-orange-400', hover: 'hover:bg-orange-500', text: 'text-white' },
  { bg: 'bg-yellow-400', hover: 'hover:bg-yellow-500', text: 'text-gray-900' },
  { bg: 'bg-lime-400', hover: 'hover:bg-lime-500', text: 'text-gray-900' },
  { bg: 'bg-green-500', hover: 'hover:bg-green-600', text: 'text-white' },
  { bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600', text: 'text-white' },
  { bg: 'bg-teal-500', hover: 'hover:bg-teal-600', text: 'text-white' }
];

export function PowerFunnel({ data, proposals }: PowerFunnelProps) {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Ordenar dados pela ordem estratégica do funil
  const sortedData = useMemo(() => {
    const ordered: PowerStage[] = [];
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

  const totalPower = sortedData.reduce((acc, d) => acc + d.potencia, 0);
  const totalProjects = sortedData.reduce((acc, d) => acc + d.quantidade, 0);

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

        {/* Funnel Visualization */}
        <div className="relative flex flex-col items-center py-4">
          {sortedData.map((stage, index) => {
            // Calcula a largura progressiva (100% no topo, diminuindo)
            const maxWidth = 100;
            const minWidth = 25;
            const widthStep = (maxWidth - minWidth) / Math.max(sortedData.length - 1, 1);
            const width = maxWidth - (index * widthStep);
            
            const colorIndex = index % stageColors.length;
            const colors = stageColors[colorIndex];

            return (
              <div
                key={stage.etapa}
                className="relative w-full flex justify-center"
                style={{ marginTop: index === 0 ? 0 : -1 }}
              >
                <button
                  onClick={() => handleStageClick(stage.etapa)}
                  className={`
                    relative transition-all duration-200 cursor-pointer
                    ${colors.bg} ${colors.hover} ${colors.text}
                    flex items-center justify-center
                    py-3 font-medium text-sm
                    shadow-sm hover:shadow-md hover:scale-[1.02]
                  `}
                  style={{
                    width: `${width}%`,
                    clipPath: index === sortedData.length - 1 
                      ? 'polygon(8% 0%, 92% 0%, 50% 100%)' 
                      : 'polygon(0% 0%, 100% 0%, 96% 100%, 4% 100%)',
                    minHeight: '52px'
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 z-10">
                    <span className="font-semibold text-xs sm:text-sm">{stage.etapa}</span>
                    <span className="text-[10px] sm:text-xs opacity-90">
                      {stage.quantidade} • {formatPower(stage.potencia)}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-3 gap-4 rounded-lg bg-muted/30 p-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Potência Total</p>
            <p className="text-lg font-bold text-foreground">{formatPower(totalPower)}</p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-xs text-muted-foreground">Projetos</p>
            <p className="text-lg font-bold text-foreground">{totalProjects}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Potência Média</p>
            <p className="text-lg font-bold text-foreground">
              {formatPower(totalProjects > 0 ? totalPower / totalProjects : 0)}
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
