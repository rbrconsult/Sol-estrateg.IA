import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  canal: string | null | undefined;
  className?: string;
}

const CANAL_STYLES: Record<string, { label: string; style: string; icon: string }> = {
  META_ADS: { label: "Meta", style: "bg-blue-600/20 text-blue-400 border-blue-600/30", icon: "🔵" },
  GOOGLE_ADS: { label: "Google", style: "bg-green-600/20 text-green-400 border-green-600/30", icon: "🟢" },
  SITE_ORGANICO: { label: "Site", style: "bg-purple-600/20 text-purple-400 border-purple-600/30", icon: "🟣" },
  INBOUND_WHATSAPP: { label: "WhatsApp", style: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: "🟠" },
};

export function CanalOrigemBadge({ canal, className }: Props) {
  const key = (canal || "").toUpperCase().trim();
  const config = CANAL_STYLES[key];

  if (!config) {
    if (!canal) return <span className="text-xs text-muted-foreground">—</span>;
    return (
      <Badge variant="outline" className={cn("text-[10px]", className)}>
        {canal}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn("text-[10px] font-semibold border", config.style, className)}>
      {config.icon} {config.label}
    </Badge>
  );
}
