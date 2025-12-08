import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface FunnelStage {
  etapa: string;
  quantidade: number;
  valor: number;
  taxaConversao: number;
}

interface SalesFunnelProps {
  data: FunnelStage[];
}

export function SalesFunnel({ data }: SalesFunnelProps) {
  const maxQuantidade = useMemo(() => 
    Math.max(...data.map(d => d.quantidade)), 
    [data]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const stageColors = [
    'from-primary/90 to-primary',
    'from-primary/80 to-primary/90',
    'from-primary/70 to-primary/80',
    'from-accent/80 to-accent/90',
    'from-accent/90 to-accent',
    'from-success to-success/90'
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card opacity-0 animate-fade-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Funil de Vendas</h3>
        <p className="text-sm text-muted-foreground">Distribuição de negócios por etapa</p>
      </div>

      <div className="space-y-3">
        {data.map((stage, index) => {
          const widthPercent = maxQuantidade > 0 
            ? Math.max(20, (stage.quantidade / maxQuantidade) * 100)
            : 20;

          return (
            <div key={stage.etapa} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-foreground">{stage.etapa}</span>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{stage.quantidade} negócios</span>
                  <span className="font-semibold text-foreground">{formatCurrency(stage.valor)}</span>
                </div>
              </div>
              <div className="relative h-10 w-full overflow-hidden rounded-lg bg-muted/50">
                <div
                  className={cn(
                    "absolute left-0 top-0 h-full rounded-lg bg-gradient-to-r transition-all duration-500 ease-out",
                    stageColors[index] || stageColors[0]
                  )}
                  style={{ 
                    width: `${widthPercent}%`,
                    clipPath: index < data.length - 1 
                      ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                      : undefined
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-4">
                  <span className="text-sm font-medium text-primary-foreground drop-shadow-sm">
                    {stage.quantidade}
                  </span>
                  <span className="text-xs font-medium text-primary-foreground/80 drop-shadow-sm">
                    {stage.taxaConversao.toFixed(0)}% conv.
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-lg bg-muted/50 p-4">
        <div>
          <p className="text-xs text-muted-foreground">Total no Pipeline</p>
          <p className="text-lg font-bold text-foreground">
            {formatCurrency(data.reduce((acc, d) => acc + d.valor, 0))}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Negócios Ativos</p>
          <p className="text-lg font-bold text-foreground">
            {data.reduce((acc, d) => acc + d.quantidade, 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
