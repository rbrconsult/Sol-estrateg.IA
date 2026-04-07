import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Proposal } from "@/data/dataAdapter";
import { JOURNEY_ORDER } from "@/lib/leads-utils";

interface StageProgressProps {
  proposals: Proposal[];
}

const FUNNEL_ORDER = JOURNEY_ORDER;

export function StageProgress({ proposals }: StageProgressProps) {
  const stageData = useMemo(() => {
    const stages = FUNNEL_ORDER.map((etapa, index) => {
      const stageProposals = proposals.filter(p => p.etapa === etapa);
      const ganhos = stageProposals.filter(p => p.status === 'Ganho').length;
      const perdidos = stageProposals.filter(p => p.status === 'Perdido').length;
      const abertos = stageProposals.filter(p => p.status === 'Aberto').length;
      const total = stageProposals.length;
      
      // Taxa de passagem para próxima etapa
      const nextStage = FUNNEL_ORDER[index + 1];
      const nextStageCount = nextStage 
        ? proposals.filter(p => FUNNEL_ORDER.indexOf(p.etapa) > index).length
        : ganhos;
      const passRate = total > 0 ? (nextStageCount / total) * 100 : 0;

      return {
        etapa,
        total,
        ganhos,
        perdidos,
        abertos,
        passRate: Math.min(passRate, 100)
      };
    });

    return stages.filter(s => s.total > 0);
  }, [proposals]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card opacity-0 animate-fade-up" style={{ animationDelay: '550ms', animationFillMode: 'forwards' }}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Progresso por Etapas</h3>
        <p className="text-sm text-muted-foreground">Taxa de passagem entre etapas do funil</p>
      </div>

      <div className="space-y-4">
        {stageData.map((stage, index) => (
          <div key={stage.etapa} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-foreground">{stage.etapa}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-muted-foreground">{stage.total} projetos</span>
                <span className="font-semibold text-foreground">{stage.passRate.toFixed(0)}%</span>
              </div>
            </div>
            
            <div className="relative">
              <Progress 
                value={stage.passRate} 
                className="h-2"
              />
            </div>

            <div className="flex gap-4 text-xs">
              <span className="text-success">✓ {stage.ganhos} ganhos</span>
              <span className="text-destructive">✗ {stage.perdidos} perdidos</span>
              <span className="text-primary">◎ {stage.abertos} abertos</span>
            </div>

            {index < stageData.length - 1 && (
              <div className="flex justify-center py-1">
                <div className="h-4 w-px bg-border" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Resumo geral */}
      <div className="mt-6 rounded-lg bg-muted/30 p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Total Ganhos</p>
            <p className="text-lg font-bold text-success">
              {proposals.filter(p => p.status === 'Ganho').length}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Taxa Geral</p>
            <p className="text-lg font-bold text-foreground">
              {proposals.length > 0 
                ? ((proposals.filter(p => p.status === 'Ganho').length / proposals.length) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Valor Ganho</p>
            <p className="text-lg font-bold text-success">
              {formatCurrency(
                proposals.filter(p => p.status === 'Ganho').reduce((acc, p) => acc + p.valorProposta, 0)
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
