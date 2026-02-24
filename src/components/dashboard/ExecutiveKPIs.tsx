import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, Receipt } from "lucide-react";
import { formatCurrencyAbbrev } from "@/lib/formatters";

interface ExecutiveKPIsProps {
  receitaPrevista: number;
  valorGanho: number;
  taxaConversao: number;
  ticketMedio: number;
  totalPropostas: number;
  negociosAbertos: number;
  valorPipeline: number;
  negociosGanhos: number;
}

const cards = [
  { key: "receitaPrevista", label: "Receita Prevista", icon: TrendingUp, subtitle: "Pipeline ponderado" },
  { key: "valorGanho", label: "Receita Fechada", icon: DollarSign, subtitle: "" },
  { key: "taxaConversao", label: "Conversão Real", icon: Target, subtitle: "Ganhos / Total" },
  { key: "ticketMedio", label: "Ticket Médio", icon: Receipt, subtitle: "Por proposta" },
] as const;

export function ExecutiveKPIs(props: ExecutiveKPIsProps) {
  const getValue = (key: string) => {
    switch (key) {
      case "receitaPrevista": return formatCurrencyAbbrev(props.receitaPrevista);
      case "valorGanho": return formatCurrencyAbbrev(props.valorGanho);
      case "taxaConversao": return `${props.taxaConversao.toFixed(1)}%`;
      case "ticketMedio": return formatCurrencyAbbrev(props.ticketMedio);
      default: return "—";
    }
  };

  const getSubtitle = (key: string) => {
    switch (key) {
      case "valorGanho": return `${props.negociosGanhos} negócios ganhos`;
      default: return cards.find(c => c.key === key)?.subtitle || "";
    }
  };

  return (
    <div className="space-y-4 opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
      {/* Main 4 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          const isMoney = card.key === "receitaPrevista" || card.key === "valorGanho" || card.key === "ticketMedio";
          return (
            <div
              key={card.key}
              className="rounded-xl border border-border bg-card p-5 shadow-sm opacity-0 animate-fade-up"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "forwards" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {card.label}
                </span>
              </div>
              <p className={`font-bold text-foreground ${isMoney ? "text-3xl" : "text-2xl"}`}>
                {getValue(card.key)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{getSubtitle(card.key)}</p>
            </div>
          );
        })}
      </div>

      {/* Secondary badges */}
      <div className="flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
          <BarChart3 className="h-3 w-3" />
          {props.totalPropostas.toLocaleString("pt-BR")} propostas
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          {props.negociosAbertos} em aberto
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
          <DollarSign className="h-3 w-3" />
          Pipeline bruto: {formatCurrencyAbbrev(props.valorPipeline)}
        </span>
      </div>
    </div>
  );
}
