import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  temperatura: string | null | undefined;
  className?: string;
}

export function TemperatureBadge({ temperatura, className }: Props) {
  const t = (temperatura || "").toUpperCase().trim();
  if (!t || !["QUENTE", "MORNO", "FRIO"].includes(t)) return <span className="text-xs text-muted-foreground">—</span>;

  const styles: Record<string, string> = {
    QUENTE: "bg-green-500/20 text-green-400 border-green-500/30",
    MORNO: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    FRIO: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const icons: Record<string, string> = {
    QUENTE: "🔥",
    MORNO: "🟡",
    FRIO: "❄️",
  };

  return (
    <Badge variant="outline" className={cn("text-[10px] font-semibold border", styles[t], className)}>
      {icons[t]} {t}
    </Badge>
  );
}
