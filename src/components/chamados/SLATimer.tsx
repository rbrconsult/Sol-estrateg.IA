import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, XCircle, PauseCircle } from "lucide-react";

interface SLATimerProps {
  deadline: string;
  createdAt: string;
  pausedAt?: string | null;
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

  return { hours, minutes, isOverdue: false, percentage: 100 };
}

function getSLAStatus(deadline: string, createdAt: string, pausedAt?: string | null) {
  if (pausedAt) return "paused";

  const now = new Date().getTime();
  const end = new Date(deadline).getTime();
  const start = new Date(createdAt).getTime();
  const totalDuration = end - start;
  const remaining = end - now;

  if (remaining <= 0) return "overdue";
  if (remaining / totalDuration <= 0.25) return "warning";
  return "ok";
}

export function SLATimer({ deadline, createdAt, pausedAt, className }: SLATimerProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (pausedAt) return; // Don't tick when paused
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, [pausedAt]);

  const status = getSLAStatus(deadline, createdAt, pausedAt);

  if (status === "paused") {
    return (
      <Badge
        className={cn(
          "gap-1 font-mono text-xs bg-purple-500/20 text-purple-400 border-purple-500/30",
          className
        )}
        variant="outline"
      >
        <PauseCircle className="h-3 w-3" />
        <span>Pausado</span>
      </Badge>
    );
  }

  const { hours, minutes, isOverdue } = getTimeRemaining(deadline);
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
