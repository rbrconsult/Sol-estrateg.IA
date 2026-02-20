import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, XCircle } from "lucide-react";

interface SLATimerProps {
  deadline: string;
  createdAt: string;
  className?: string;
}

function getTimeRemaining(deadline: string) {
  const now = new Date().getTime();
  const end = new Date(deadline).getTime();
  const diff = end - now;

  if (diff <= 0) {
    const overdue = Math.abs(diff);
    const hours = Math.floor(overdue / (1000 * 60 * 60));
    const minutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes, isOverdue: true, percentage: 0 };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  const total = new Date(deadline).getTime() - new Date().getTime();
  const totalSLA = new Date(deadline).getTime() - new Date().getTime();
  const percentage = Math.max(0, (diff / (new Date(deadline).getTime() - new Date().getTime())) * 100);

  return { hours, minutes, isOverdue: false, percentage };
}

function getSLAStatus(deadline: string, createdAt: string) {
  const now = new Date().getTime();
  const end = new Date(deadline).getTime();
  const start = new Date(createdAt).getTime();
  const totalDuration = end - start;
  const remaining = end - now;

  if (remaining <= 0) return "overdue";
  if (remaining / totalDuration <= 0.25) return "warning";
  return "ok";
}

export function SLATimer({ deadline, createdAt, className }: SLATimerProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const { hours, minutes, isOverdue } = getTimeRemaining(deadline);
  const status = getSLAStatus(deadline, createdAt);

  const Icon = status === "overdue" ? XCircle : status === "warning" ? AlertTriangle : Clock;

  return (
    <Badge
      className={cn(
        "gap-1 font-mono text-xs",
        status === "ok" && "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        status === "warning" && "bg-amber-500/20 text-amber-400 border-amber-500/30",
        status === "overdue" && "bg-destructive/20 text-destructive border-destructive/30",
        className
      )}
      variant="outline"
    >
      <Icon className="h-3 w-3" />
      {isOverdue ? (
        <span>-{hours}h {minutes}m</span>
      ) : (
        <span>{hours}h {minutes}m</span>
      )}
    </Badge>
  );
}

export { getSLAStatus };
