import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Eye, Lightbulb, AlertTriangle, TrendingUp, AlertCircle } from "lucide-react";
import type { SolInsight } from "@/hooks/useSolInsights";

const TIPO_CONFIG: Record<string, { icon: React.ElementType; emoji: string; color: string }> = {
  ALERTA: { icon: AlertCircle, emoji: "🔴", color: "border-l-red-500" },
  ANOMALIA: { icon: AlertTriangle, emoji: "🟡", color: "border-l-yellow-500" },
  PADRAO: { icon: TrendingUp, emoji: "🟢", color: "border-l-green-500" },
  RECOMENDACAO: { icon: Lightbulb, emoji: "💡", color: "border-l-blue-500" },
};

const SEVERIDADE_STYLES: Record<string, string> = {
  CRITICAL: "border-red-500/50 bg-red-500/5",
  WARNING: "border-yellow-500/50 bg-yellow-500/5",
  INFO: "border-border/50",
};

interface Props {
  insight: SolInsight;
  onMarkAsRead?: (id: string) => void;
}

export function InsightCard({ insight, onMarkAsRead }: Props) {
  const tipoConfig = TIPO_CONFIG[insight.tipo] || TIPO_CONFIG.PADRAO;
  const sevStyle = SEVERIDADE_STYLES[insight.severidade] || SEVERIDADE_STYLES.INFO;
  const Icon = tipoConfig.icon;

  return (
    <Card className={cn(
      "border-l-4 transition-all",
      tipoConfig.color,
      sevStyle,
      insight.visualizado && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Icon className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold">{insight.titulo}</h4>
                {insight.categoria && (
                  <Badge variant="outline" className="text-[10px]">{insight.categoria}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{insight.descricao}</p>
              {insight.acao_sugerida && (
                <p className="text-xs text-primary mt-1">💡 {insight.acao_sugerida}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!insight.visualizado && onMarkAsRead && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onMarkAsRead(insight.id)}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-muted-foreground">
            {new Date(insight.created_at).toLocaleDateString("pt-BR")}
          </span>
          <Badge variant={insight.severidade === "CRITICAL" ? "destructive" : "secondary"} className="text-[10px]">
            {insight.severidade}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
