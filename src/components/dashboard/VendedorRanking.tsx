import { useMemo } from "react";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface VendedorData {
  nome: string;
  totalPropostas: number;
  ganhos: number;
  perdidos: number;
  abertos: number;
  valorTotal: number;
  taxaConversao: number;
  atividades: number;
}

interface VendedorRankingProps {
  data: VendedorData[];
}

const MedalIcon = ({ position }: { position: number }) => {
  if (position === 1) {
    return (
      <div className="relative">
        <Trophy className="h-8 w-8 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-yellow-900">
          1
        </span>
      </div>
    );
  }
  if (position === 2) {
    return (
      <div className="relative">
        <Medal className="h-7 w-7 text-slate-300 drop-shadow-[0_0_6px_rgba(203,213,225,0.5)]" />
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-300 text-[10px] font-bold text-slate-700">
          2
        </span>
      </div>
    );
  }
  if (position === 3) {
    return (
      <div className="relative">
        <Medal className="h-6 w-6 text-amber-600 drop-shadow-[0_0_4px_rgba(217,119,6,0.4)]" />
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white">
          3
        </span>
      </div>
    );
  }
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
      {position}
    </span>
  );
};

export function VendedorRanking({ data }: VendedorRankingProps) {
  const sortedData = useMemo(() => 
    [...data].sort((a, b) => b.valorTotal - a.valorTotal),
    [data]
  );

  const maxValor = useMemo(() => 
    Math.max(...sortedData.map(d => d.valorTotal), 1),
    [sortedData]
  );

  const avgConversao = useMemo(() => {
    if (sortedData.length === 0) return 0;
    return sortedData.reduce((acc, d) => acc + d.taxaConversao, 0) / sortedData.length;
  }, [sortedData]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  const getConversaoTrend = (taxa: number) => {
    const diff = taxa - avgConversao;
    if (diff > 5) return { icon: TrendingUp, color: "text-success", label: "Acima da média" };
    if (diff < -5) return { icon: TrendingDown, color: "text-destructive", label: "Abaixo da média" };
    return { icon: Minus, color: "text-muted-foreground", label: "Na média" };
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-card opacity-0 animate-fade-up" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
      <div className="p-6 pb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Ranking de Vendedores
          </h3>
          <p className="text-sm text-muted-foreground">Ordenado por valor total fechado</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Conversão Média</p>
          <p className="text-lg font-bold text-foreground">{avgConversao.toFixed(1)}%</p>
        </div>
      </div>
      
      <div className="px-6 pb-6 space-y-3">
        {sortedData.map((vendedor, index) => {
          const position = index + 1;
          const valorPercent = (vendedor.valorTotal / maxValor) * 100;
          const trend = getConversaoTrend(vendedor.taxaConversao);
          const TrendIcon = trend.icon;
          
          return (
            <div
              key={vendedor.nome}
              className={cn(
                "relative rounded-lg border p-4 transition-all hover:shadow-md",
                position === 1 && "border-yellow-400/30 bg-yellow-400/5 hover:border-yellow-400/50",
                position === 2 && "border-slate-300/30 bg-slate-300/5 hover:border-slate-300/50",
                position === 3 && "border-amber-600/30 bg-amber-600/5 hover:border-amber-600/50",
                position > 3 && "border-border bg-muted/20 hover:border-border/80"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Medal/Position */}
                <div className="flex-shrink-0">
                  <MedalIcon position={position} />
                </div>
                
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={cn(
                      "font-semibold truncate",
                      position === 1 && "text-yellow-400",
                      position === 2 && "text-slate-300",
                      position === 3 && "text-amber-500",
                      position > 3 && "text-foreground"
                    )}>
                      {vendedor.nome}
                    </h4>
                    <span className={cn(
                      "text-lg font-bold ml-2",
                      position === 1 && "text-yellow-400",
                      position <= 3 && position !== 1 && "text-foreground",
                      position > 3 && "text-foreground"
                    )}>
                      {formatCurrency(vendedor.valorTotal)}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <Progress 
                      value={valorPercent} 
                      className={cn(
                        "h-2",
                        position === 1 && "[&>div]:bg-yellow-400",
                        position === 2 && "[&>div]:bg-slate-300",
                        position === 3 && "[&>div]:bg-amber-600",
                        position > 3 && "[&>div]:bg-primary"
                      )}
                    />
                  </div>
                  
                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Propostas:</span>
                      <span className="font-medium text-foreground">{vendedor.totalPropostas}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex h-2 w-2 rounded-full bg-success" />
                      <span className="font-medium text-success">{vendedor.ganhos}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex h-2 w-2 rounded-full bg-destructive" />
                      <span className="font-medium text-destructive">{vendedor.perdidos}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex h-2 w-2 rounded-full bg-warning" />
                      <span className="font-medium text-warning">{vendedor.abertos}</span>
                    </div>
                    
                    <div className="ml-auto flex items-center gap-1.5">
                      <TrendIcon className={cn("h-4 w-4", trend.color)} />
                      <span className={cn(
                        "font-semibold",
                        vendedor.taxaConversao >= 25 && "text-success",
                        vendedor.taxaConversao >= 15 && vendedor.taxaConversao < 25 && "text-warning",
                        vendedor.taxaConversao < 15 && "text-destructive"
                      )}>
                        {vendedor.taxaConversao.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {sortedData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum vendedor encontrado
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="px-6 pb-4 flex items-center justify-center gap-6 text-xs text-muted-foreground border-t border-border pt-4">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-2 w-2 rounded-full bg-success" />
          Ganhos
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-2 w-2 rounded-full bg-destructive" />
          Perdidos
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-2 w-2 rounded-full bg-warning" />
          Em Aberto
        </div>
      </div>
    </div>
  );
}
