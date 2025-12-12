import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface FunnelKPIData {
  label: string;
  value: string | number;
  trend?: {
    percentage: number;
    absolute: number;
    isPositive: boolean | null;
  };
  highlight?: boolean;
}

interface FunnelKPIsProps {
  data: FunnelKPIData[];
  conversionRates?: number[];
  className?: string;
}

export function FunnelKPIs({ data, conversionRates = [], className }: FunnelKPIsProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* KPI Cards Row */}
      <div className="flex flex-wrap items-stretch justify-start gap-0">
        {data.map((kpi, index) => (
          <div key={kpi.label} className="flex items-stretch">
            {/* KPI Card */}
            <div
              className={cn(
                "relative flex flex-col items-center justify-center px-6 py-5 min-w-[140px] transition-all duration-200",
                kpi.highlight 
                  ? "bg-info/20 border-2 border-info/40" 
                  : "bg-card border border-border/50",
                index === 0 && "rounded-l-xl",
                index === data.length - 1 && "rounded-r-xl",
                "hover:bg-muted/50"
              )}
            >
              {/* Label */}
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {kpi.label}
              </span>
              
              {/* Value */}
              <span className={cn(
                "text-3xl font-black tracking-tight",
                kpi.highlight ? "text-info" : "text-foreground"
              )}>
                {kpi.value}
              </span>
              
              {/* Trend Indicator */}
              {kpi.trend && (
                <div className={cn(
                  "flex items-center gap-1 mt-2 text-xs font-medium",
                  kpi.trend.isPositive === true && "text-success",
                  kpi.trend.isPositive === false && "text-destructive",
                  kpi.trend.isPositive === null && "text-muted-foreground"
                )}>
                  {kpi.trend.isPositive === true && <TrendingUp className="h-3 w-3" />}
                  {kpi.trend.isPositive === false && <TrendingDown className="h-3 w-3" />}
                  {kpi.trend.isPositive === null && <Minus className="h-3 w-3" />}
                  <span>
                    {kpi.trend.percentage > 0 ? '+' : ''}{kpi.trend.percentage.toFixed(2)}% 
                    ({kpi.trend.absolute >= 0 ? '+' : ''}{kpi.trend.absolute})
                  </span>
                </div>
              )}
            </div>

            {/* Conversion Rate Badge (between cards) */}
            {index < data.length - 1 && conversionRates[index] !== undefined && (
              <div className="flex items-center justify-center px-1 -mx-3 z-10">
                <div className="bg-foreground text-background px-2 py-1 rounded text-xs font-bold shadow-lg relative">
                  {conversionRates[index]}%
                  {/* Arrow pointing right */}
                  <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-foreground border-y-[6px] border-y-transparent" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
