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
    default: 'border-border hover:border-primary/30',
    success: 'border-success/30 hover:border-success/50',
    danger: 'border-destructive/30 hover:border-destructive/50',
    warning: 'border-warning/30 hover:border-warning/50'
  };

  const iconStyles = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    danger: 'bg-destructive/10 text-destructive',
    warning: 'bg-warning/10 text-warning'
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
        "group relative overflow-hidden rounded-xl border bg-card p-4 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 opacity-0 animate-fade-up",
        variantStyles[variant],
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Header with icon */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
        <div className={cn(
          "rounded-lg p-2 transition-transform group-hover:scale-110",
          iconStyles[variant]
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {/* Value */}
      <p className={cn(
        "text-2xl font-bold tracking-tight leading-none mb-1",
        valueStyles[variant]
      )}>
        {value}
      </p>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}

      {/* Trend badge */}
      {trend && (
        <div className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium mt-2",
          trend.isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
        )}>
          <span>{trend.isPositive ? '↑' : '↓'}</span>
          <span>{Math.abs(trend.value)}%</span>
        </div>
      )}
      
      {/* Subtle decorative element */}
      <div className={cn(
        "absolute -right-6 -bottom-6 h-16 w-16 rounded-full opacity-5 transition-opacity group-hover:opacity-10",
        variant === 'success' && 'bg-success',
        variant === 'danger' && 'bg-destructive',
        variant === 'warning' && 'bg-warning',
        variant === 'default' && 'bg-primary'
      )} />
    </div>
  );
}
