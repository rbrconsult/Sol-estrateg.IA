import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KPICardProps {
  label: string;
  value: string;
  detail?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function KPICard({ label, value, detail, icon, className }: KPICardProps) {
  return (
    <Card className={cn("p-4 flex flex-col gap-1", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <span className="text-2xl font-bold tracking-tight">{value}</span>
      {detail && <span className="text-xs text-muted-foreground">{detail}</span>}
    </Card>
  );
}
