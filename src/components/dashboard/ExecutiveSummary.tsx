import { useState } from "react";
import { Brain, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface KPIs {
  receitaPrevista: number;
  valorGanho: number;
  taxaConversao: number;
  ticketMedio: number;
  totalNegocios: number;
  negociosGanhos: number;
  negociosPerdidos: number;
  negociosAbertos: number;
  valorPipeline: number;
  cicloProposta: number;
}

interface ExecutiveSummaryProps {
  kpis: KPIs;
  healthScore: number;
  alertCount: number;
  topVendedor: string;
  funnelBottleneck: string;
}

export function ExecutiveSummary({ kpis, healthScore, alertCount, topVendedor, funnelBottleneck }: ExecutiveSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateSummary = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("executive-summary", {
        body: { kpis, healthScore, alertCount, topVendedor, funnelBottleneck },
      });

      if (error) throw error;
      setSummary(data.summary);
      setHasGenerated(true);
    } catch (err) {
      console.error("Error generating summary:", err);
      setSummary("Não foi possível gerar o resumo executivo. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasGenerated) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Raio-X Executivo</h3>
              <p className="text-xs text-muted-foreground">Análise inteligente do pipeline por IA</p>
            </div>
          </div>
          <Button
            onClick={generateSummary}
            disabled={isLoading}
            size="sm"
            className="gap-2"
          >
            {isLoading ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {isLoading ? "Analisando..." : "Gerar Raio-X"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Raio-X Executivo</h3>
            <p className="text-xs text-muted-foreground">Análise inteligente por IA</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={generateSummary}
          disabled={isLoading}
          className="text-muted-foreground hover:text-foreground gap-1"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>
      <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
        {summary}
      </div>
    </div>
  );
}
