import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'danger' | 'warning';
  className?: string;
  delay?: number;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
  delay = 0
}: KPICardProps) {
  const variantStyles = {
    default: 'border-border/50 hover:border-primary/50 bg-gradient-to-br from-card to-card/80',
    success: 'border-success/30 hover:border-success/60 bg-gradient-to-br from-success/5 to-transparent',
    danger: 'border-destructive/30 hover:border-destructive/60 bg-gradient-to-br from-destructive/5 to-transparent',
    warning: 'border-warning/30 hover:border-warning/60 bg-gradient-to-br from-warning/5 to-transparent'
  };

  const iconStyles = {
    default: 'bg-primary/20 text-primary',
    success: 'bg-success/20 text-success',
    danger: 'bg-destructive/20 text-destructive',
    warning: 'bg-warning/20 text-warning'
  };

  const valueStyles = {
    default: 'text-foreground',
    success: 'text-success',
    danger: 'text-destructive',
    warning: 'text-warning'
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-4 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 hover:scale-[1.02] opacity-0 animate-fade-up",
        variantStyles[variant],
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Header with icon */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
        <div className={cn(
          "rounded-lg p-2 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg",
          iconStyles[variant]
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {/* Value */}
      <p className={cn(
        "text-2xl font-extrabold tracking-tight leading-none mb-1",
        valueStyles[variant]
      )}>
        {value}
      </p>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1.5 font-medium">{subtitle}</p>
      )}

      {/* Trend badge */}
      {trend && (
        <div className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold mt-2",
          trend.isPositive ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
        )}>
          <span>{trend.isPositive ? '↑' : '↓'}</span>
          <span>{Math.abs(trend.value)}%</span>
        </div>
      )}
      
      {/* Glowing decorative element */}
      <div className={cn(
        "absolute -right-8 -bottom-8 h-20 w-20 rounded-full opacity-10 blur-xl transition-all duration-500 group-hover:opacity-20 group-hover:scale-125",
        variant === 'success' && 'bg-success',
        variant === 'danger' && 'bg-destructive',
        variant === 'warning' && 'bg-warning',
        variant === 'default' && 'bg-primary'
      )} />
    </div>
  );
}