import { cn } from "@/lib/utils";

interface Props {
  score: number | null | undefined;
  size?: "sm" | "md";
}

export function ScoreGauge({ score, size = "sm" }: Props) {
  if (!score || score <= 0) return <span className="text-xs text-muted-foreground">—</span>;

  const color = score >= 70 ? "text-green-400" : score >= 40 ? "text-yellow-400" : "text-red-400";
  const bg = score >= 70 ? "bg-green-500/20" : score >= 40 ? "bg-yellow-500/20" : "bg-red-500/20";

  return (
    <div className={cn(
      "inline-flex items-center justify-center rounded-full font-bold tabular-nums",
      bg, color,
      size === "sm" ? "h-7 w-7 text-[10px]" : "h-10 w-10 text-sm"
    )}>
      {score}
    </div>
  );
}
