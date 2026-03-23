import { useMemo, useState } from "react";
import { ProjectsModal } from "./ProjectsModal";
import { Proposal } from "@/data/dataAdapter";
import { formatCurrencyAbbrev } from "@/lib/formatters";
import { DollarSign, ChevronRight, AlertTriangle } from "lucide-react";

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

const FUNNEL_ORDER = [
  'TRAFEGO PAGO',
  'PROSPECÇÃO',
  'FOLLOW UP',
  'QUALIFICAÇÃO',
  'QUALIFICADO',
  'CONTATO REALIZADO',
  'PROPOSTA',
  'NEGOCIAÇÃO',
  'CONTRATO ASSINADO',
];

const stageColors = [
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-amber-400',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-green-500',
  'bg-lime-500',
  'bg-orange-500',
];

export function StrategicFunnel({ data, proposals }: StrategicFunnelProps) {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sortedData = useMemo(() => {
    const ordered: FunnelStage[] = [];
    FUNNEL_ORDER.forEach(etapa => {
      const found = data.find(d => d.etapa === etapa);
      if (found) ordered.push(found);
    });
    data.forEach(d => {
      if (!FUNNEL_ORDER.includes(d.etapa) && !ordered.find(o => o.etapa === d.etapa)) {
        ordered.push(d);
      }
    });
    return ordered;
  }, [data]);

  const maxValue = useMemo(() => Math.max(...sortedData.map(d => d.valor), 1), [sortedData]);
  const totalQty = useMemo(() => sortedData.reduce((acc, d) => acc + d.quantidade, 0), [sortedData]);

  // Calculate conversion rates between stages + find bottleneck
  const stageConversions = useMemo(() => {
    const rates: (number | null)[] = [];
    for (let i = 0; i < sortedData.length; i++) {
      if (i === 0 || sortedData[i - 1].quantidade === 0) {
        rates.push(null);
      } else {
        rates.push(Math.round((sortedData[i].quantidade / sortedData[i - 1].quantidade) * 100));
      }
    }
    return rates;
  }, [sortedData]);

  const bottleneckIndex = useMemo(() => {
    let minRate = Infinity;
    let minIdx = -1;
    stageConversions.forEach((rate, i) => {
      if (rate !== null && rate < minRate) {
        minRate = rate;
        minIdx = i;
      }
    });
    return minIdx;
  }, [stageConversions]);

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

  // Accumulated value
  const accumulatedValues = useMemo(() => {
    let acc = 0;
    return sortedData.map(d => { acc += d.valor; return acc; });
  }, [sortedData]);

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm opacity-0 animate-fade-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
        <div className="mb-6 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Funil de Vendas (R$)</h3>
            <p className="text-sm text-muted-foreground">Clique para ver os projetos</p>
          </div>
        </div>

        <div className="space-y-1">
          {sortedData.map((stage, index) => {
            const widthPercent = Math.max(15, (stage.valor / maxValue) * 100);
            const percentOfValue = totalValue > 0 ? ((stage.valor / totalValue) * 100).toFixed(0) : '0';
            const color = stageColors[index % stageColors.length];
            const isBottleneck = index === bottleneckIndex;
            const convRate = stageConversions[index];

            return (
              <div key={stage.etapa}>
                {/* Conversion rate badge between stages */}
                {convRate !== null && (
                  <div className="flex items-center justify-center my-1">
                    <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      isBottleneck
                        ? "bg-destructive/10 text-destructive border border-destructive/30"
                        : "bg-muted/50 text-muted-foreground"
                    }`}>
                      {isBottleneck && <AlertTriangle className="h-2.5 w-2.5" />}
                      {convRate}% passagem
                      {isBottleneck && " · Gargalo"}
                    </div>
                  </div>
                )}

                <div
                  className={`group cursor-pointer ${isBottleneck ? "ring-1 ring-destructive/40 rounded-lg" : ""}`}
                  onClick={() => handleStageClick(stage.etapa)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{stage.etapa}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {percentOfValue}% · Acum: {formatCurrencyAbbrev(accumulatedValues[index])}
                    </span>
                  </div>

                  <div className="relative h-10 w-full rounded-lg bg-muted/30 overflow-hidden group-hover:bg-muted/50 transition-colors">
                    <div
                      className={`absolute left-0 top-0 h-full ${color} rounded-lg transition-all duration-300 group-hover:brightness-110`}
                      style={{ width: `${widthPercent}%` }}
                    />
                    <div className="absolute inset-0 flex items-center px-3">
                      <div className="flex items-center justify-between w-full" style={{ width: `${widthPercent}%` }}>
                        <span className="text-sm font-bold text-white drop-shadow-sm">{stage.quantidade}</span>
                        <span className="text-sm font-semibold text-white drop-shadow-sm">{formatCurrencyAbbrev(stage.valor)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 rounded-lg bg-muted/30 p-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Pipeline Total</p>
            <p className="text-lg font-bold text-foreground">{formatCurrencyAbbrev(totalValue)}</p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-xs text-muted-foreground">Projetos</p>
            <p className="text-lg font-bold text-foreground">{totalProjects}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Ticket Médio</p>
            <p className="text-lg font-bold text-foreground">
              {formatCurrencyAbbrev(totalProjects > 0 ? totalValue / totalProjects : 0)}
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
