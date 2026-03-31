import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Calculator, ChevronDown, ChevronRight } from "lucide-react";

interface Variable {
  key: string;
  label: string;
  description: string;
  example?: string;
}

interface VariableCategory {
  label: string;
  icon: string;
  variables: Variable[];
}

const VARIABLE_CATEGORIES: VariableCategory[] = [
  {
    label: "Pré-venda / Leads",
    icon: "👥",
    variables: [
      { key: "leads_gerados", label: "Leads Gerados", description: { key: "leads_gerados", label: "Leads Gerados", description: "Total de leads no sol_leads", example: "142" },, example: "142" },
      { key: "leads_qualificados", label: "Leads Qualificados", description: "Leads com status QUALIFICADO", example: "38" },
      { key: "taxa_qualificacao", label: "Taxa Qualificação", description: "% de qualificação sobre total", example: "26.8%" },
      { key: "taxa_resposta", label: "Taxa de Resposta", description: "% que responderam mensagens", example: "45.2%" },
      { key: "origem", label: "Principal Origem", description: "Canal de origem mais frequente", example: "Meta Ads" },
      { key: "sol_score", label: "Score Médio", description: "Score médio dos leads", example: "72" },
      { key: "sol_temperatura", label: "Temperatura Predominante", description: "Temperatura mais comum", example: "Quente" },
    ],
  },
  {
    label: "Robô SOL",
    icon: "🤖",
    variables: [
      { key: "conversas_robo", label: "Conversas Robô", description: "Total de conversas do robô SOL", example: "89" },
      { key: "sol_qualificados", label: "Qualificados pelo Robô", description: "Leads qualificados com taxa", example: "12 (13.5%)" },
      { key: "sol_erros", label: "Erros SOL", description: "Erros registrados no robô", example: "2" },
      { key: "fup_disparos", label: "FUP Disparos", description: "Msgs enviadas pelo FUP Frio", example: "156" },
      { key: "fup_respostas", label: "FUP Respostas", description: "Respostas recebidas do FUP", example: "23" },
      { key: "fup_reativados", label: "FUP Reativados", description: "Leads reativados pelo FUP", example: "8" },
    ],
  },
  {
    label: "Comercial / CRM",
    icon: "💼",
    variables: [
      { key: "propostas", label: "Propostas", description: "Total com valor_proposta > 0", example: "45" },
      { key: "vendas", label: "Vendas Fechadas", description: "Leads com status Ganho", example: "12" },
      { key: "faturamento", label: "Faturamento", description: "Soma valor_proposta dos ganhos", example: "R$ 480.000" },
      { key: "conversao", label: "Taxa Conversão", description: "vendas / propostas × 100", example: "26.7%" },
      { key: "reunioes", label: "Agendamentos", description: "Leads com data_agendamento", example: "28" },
      { key: "melhor_closer", label: "Melhor Closer", description: "Closer com mais vendas", example: "João Silva" },
      { key: "closers_detalhes", label: "Detalhes Closers", description: "Top 5 closers com métricas", example: "• João: 5 vendas..." },
      { key: "leads_distribuidos", label: "Leads Distribuídos", description: "Leads com responsável atribuído", example: "98" },
      { key: "ticket_medio", label: "Ticket Médio", description: "faturamento / vendas", example: "R$ 40.000" },
      { key: "pipeline_valor", label: "Pipeline (Valor)", description: "Valor total do pipeline aberto", example: "R$ 1.200.000" },
      { key: "pipeline_count", label: "Pipeline (Qtd)", description: "Quantidade de propostas abertas", example: "33" },
    ],
  },
  {
    label: "Campanhas / Ads",
    icon: "📣",
    variables: [
      { key: "investimento", label: "Investimento Total", description: "Soma do spend de todas campanhas", example: "R$ 12.500" },
      { key: "cliques_total", label: "Cliques Total", description: "Total de cliques em ads", example: "3.420" },
      { key: "impressoes_total", label: "Impressões Total", description: "Total de impressões", example: "125.000" },
      { key: "cpl", label: "CPL", description: "Custo por lead (invest / leads)", example: "R$ 32.50" },
      { key: "cac", label: "CAC", description: "Custo por aquisição (invest / vendas)", example: "R$ 1.041" },
      { key: "roi", label: "ROI", description: "(faturamento - invest) / invest × 100", example: "284.5%" },
      { key: "roas_geral", label: "ROAS Geral", description: "faturamento / investimento", example: "3.8x" },
      { key: "top_campanhas", label: "Top Campanhas", description: "Top 3 campanhas por gasto", example: "• Camp1: R$..." },
      { key: "ctr_medio", label: "CTR Médio", description: "Taxa de cliques média", example: "2.8%" },
    ],
  },
  {
    label: "GA4 / Site",
    icon: "🌐",
    variables: [
      { key: "ga4_sessoes", label: "Sessões", description: "Total de sessões do site", example: "4.200" },
      { key: "ga4_usuarios", label: "Usuários", description: "Total de usuários únicos", example: "2.800" },
      { key: "ga4_conversoes", label: "Conversões GA4", description: "Conversões registradas no GA4", example: "85" },
      { key: "ga4_bounce", label: "Bounce Rate", description: "Taxa de rejeição média", example: "42.3%" },
      { key: "ga4_duracao", label: "Duração Média", description: "Tempo médio de sessão", example: "2m 15s" },
      { key: "ga4_top_source", label: "Top Source", description: "Fonte de tráfego principal", example: "google" },
      { key: "ga4_taxa_conversao", label: "Taxa Conversão Site", description: "conversões / sessões × 100", example: "2.0%" },
    ],
  },
  {
    label: "IA / Insights",
    icon: "🧠",
    variables: [
      { key: "insight_1", label: "Insight 1", description: "Primeiro insight gerado por IA", example: "Leads quentes..." },
      { key: "insight_2", label: "Insight 2", description: "Segundo insight gerado por IA", example: "Taxa de..." },
      { key: "insight_3", label: "Insight 3", description: "Terceiro insight gerado por IA", example: "Campanha X..." },
      { key: "recomendacao", label: "Recomendação", description: "Ação estratégica sugerida pela IA", example: "Investir mais em..." },
      { key: "destaque_1", label: "Destaque 1", description: "Ponto positivo 1", example: "Taxa acima..." },
      { key: "destaque_2", label: "Destaque 2", description: "Ponto positivo 2", example: "Closer X..." },
      { key: "atencao", label: "Ponto de Atenção", description: "Alerta identificado pela IA", example: "CPL subiu 15%..." },
      { key: "acao_gerencial", label: "Ação Gerencial", description: "Ação sugerida para gestão", example: "Revisar..." },
    ],
  },
  {
    label: "Sistema",
    icon: "⚙️",
    variables: [
      { key: "data", label: "Data Atual", description: "Data do relatório (DD/MM/YYYY)", example: "25/03/2026" },
      { key: "semana", label: "Período", description: "Intervalo do mês até hoje", example: "01/03 a 25/03" },
    ],
  },
];

interface VariableBankProps {
  onInsert: (variable: string) => void;
}

export function VariableBank({ onInsert }: VariableBankProps) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string[]>(["Pré-venda / Leads"]);

  const toggle = (label: string) => {
    setExpanded(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };

  const filtered = search.trim()
    ? VARIABLE_CATEGORIES.map(cat => ({
        ...cat,
        variables: cat.variables.filter(v =>
          v.key.includes(search.toLowerCase()) ||
          v.label.toLowerCase().includes(search.toLowerCase()) ||
          v.description.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(cat => cat.variables.length > 0)
    : VARIABLE_CATEGORIES;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar variável..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-xs"
        />
      </div>

      {/* Math tip */}
      <div className="bg-primary/5 border border-primary/20 rounded-md p-2.5 flex items-start gap-2">
        <Calculator className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        <div className="text-[10px] text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">Operações matemáticas:</span> Use{" "}
          <code className="bg-muted px-1 rounded font-mono">{"{{calc: vendas / propostas * 100}}"}</code>{" "}
          para cálculos dinâmicos entre variáveis.
          <br />
          Operadores: <code className="bg-muted px-0.5 rounded font-mono">+ - * /</code>
        </div>
      </div>

      <ScrollArea className="h-full max-h-[calc(100vh-300px)]">
        <div className="space-y-1">
          {filtered.map((cat) => (
            <div key={cat.label}>
              <button
                onClick={() => toggle(cat.label)}
                className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
              >
                {expanded.includes(cat.label) ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
                <span className="text-sm">{cat.icon}</span>
                <span className="text-xs font-medium">{cat.label}</span>
                <Badge variant="secondary" className="text-[9px] ml-auto">{cat.variables.length}</Badge>
              </button>

              {(expanded.includes(cat.label) || search.trim()) && (
                <div className="ml-5 space-y-0.5 mb-2">
                  <TooltipProvider delayDuration={200}>
                    {cat.variables.map((v) => (
                      <Tooltip key={v.key}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onInsert(`{{${v.key}}}`)}
                            className="w-full text-left flex items-center justify-between gap-2 px-2 py-1 rounded hover:bg-primary/10 transition-colors group"
                          >
                            <div className="min-w-0">
                              <span className="text-xs text-foreground group-hover:text-primary transition-colors">{v.label}</span>
                            </div>
                            <code className="text-[9px] font-mono text-muted-foreground shrink-0 bg-muted px-1 rounded group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                              {`{{${v.key}}}`}
                            </code>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-[200px]">
                          <p className="text-xs font-medium">{v.description}</p>
                          {v.example && <p className="text-[10px] text-muted-foreground mt-0.5">Ex: {v.example}</p>}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
