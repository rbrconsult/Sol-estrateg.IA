import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Kanban, 
  Headset, 
  HelpCircle, 
  Rocket, 
  CheckCircle2,
  Sun,
  Filter,
  TrendingUp,
  Users,
  Percent,
  BarChart3,
  Compass,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Step {
  icon: any;
  title: string;
  description: string;
  page?: string; // route to navigate to
}

const steps: Step[] = [
  {
    icon: Sun,
    title: "Bora juntos nessa jornada! ☀️",
    description:
      "Bem-vindo ao Sol Estrateg.IA — sua plataforma integrada de BI, CRM e Suporte. Vamos fazer um tour interativo página por página para você conhecer cada recurso.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard Estratégico",
    description:
      "Objetivo: Visão executiva consolidada do desempenho comercial.\n\n• KPIs: Receita prevista, valor ganho, taxa de conversão, ticket médio.\n• Views: Resumo executivo, progresso da meta, health score, alertas e funil.\n• Filtros: Período, Etapa, Temperatura e Busca — todos globais.\n• Dica: O Health Score mostra a saúde geral do pipeline (0-100).",
    page: "/dashboard",
  },
  {
    icon: Kanban,
    title: "Pipeline (Kanban)",
    description:
      "Objetivo: Visualizar o estado atual de cada proposta por etapa.\n\n• Views: Quadro Kanban com cards por etapa, valor e tempo na etapa.\n• Filtros: Herda os mesmos filtros globais do Dashboard.\n• Dica: Foque em propostas com mais tempo parado na mesma etapa — são as que precisam de atenção.",
    page: "/pipeline",
  },
  {
    icon: Filter,
    title: "Filtros Globais",
    description:
      "Os filtros são compartilhados entre TODAS as páginas.\n\n• Clique no botão de funil (canto inferior direito) para abrir.\n• Período: de 'Hoje' até 'Todos' ou datas personalizadas.\n• Etapa: todas as etapas do processo comercial.\n• Temperatura: Quente, Morno, Frio.\n• Busca: nome de cliente ou vendedor.\n\nSe aplicar um filtro aqui, ele se reflete em Dashboard, Pipeline, BI, Comissões e demais telas.",
  },
  {
    icon: Users,
    title: "Vendedores",
    description:
      "Objetivo: Análise individual de performance.\n\n• Views: Gráficos de receita e conversão, tabela detalhada com ranking.\n• Métricas: Propostas, contratos fechados, valor ganho, taxa de conversão (fechadas ÷ enviadas), ticket médio.\n• Dica: Compare vendedores com alto ticket mas baixa conversão — oportunidade de coaching.",
    page: "/performance",
  },
  {
    icon: Percent,
    title: "Comissões",
    description:
      "Objetivo: Calcular comissões por vendedor.\n\n• Regra: Padrão 2%, Danielle 3% — editável por vendedor.\n• Views: Top 10 com valor de comissão + fechamentos, tabela completa.\n• Métrica: Taxa de conversão = propostas fechadas ÷ propostas enviadas.\n• Dica: Use o filtro de período para ver comissões de meses específicos.",
    page: "/comissoes",
  },
  {
    icon: BarChart3,
    title: "Business Intelligence",
    description:
      "Objetivo: Visão estratégica consolidada dos dados de leads e propostas.\n\n• Views: Funil de conversão, leads por cidade, temperatura, FUP Frio, Volume & SLA.\n• Importante: O BI não tem filtro local próprio — obedece aos filtros globais.\n• Dica: Use os filtros globais para segmentar a análise do BI.",
    page: "/bi",
  },
  {
    icon: TrendingUp,
    title: "Forecast",
    description:
      "Objetivo: Prever receita futura com base no pipeline.\n\n• Views: Previsão para 30, 60 e 90 dias por probabilidade.\n• Classificação: Alta confiança (≥70%), Média (30-69%), Baixa (<30%).\n• Dica: Compare o forecast com o realizado para calibrar as probabilidades.",
    page: "/forecast",
  },
  {
    icon: Headset,
    title: "Chamados de Suporte",
    description:
      "Objetivo: Gerenciar tickets de suporte.\n\n• Funcionalidades: Criar chamado, definir prioridade/categoria, acompanhar SLA.\n• SLA: Calculado automaticamente com base na prioridade.\n• Dica: Descreva o problema com detalhes e anexe prints.",
    page: "/chamados",
  },
  {
    icon: Compass,
    title: "Navegação",
    description:
      "O menu lateral organiza os módulos em 5 blocos:\n\n• PRÉ-VENDA: Dashboard, Pipeline, Leads, Robô SOL, FUP Frio, Forecast.\n• COMERCIAL: Painel Comercial, Vendedores, Comissões.\n• INTELIGÊNCIA: BI, Analista, Jornada Lead, Ads, Mídia × Receita.\n• INSIGHTS: Reports.\n• OPERACIONAL: Monitor, Chamados, Reprocessar, Sanitização.\n\nDica: Os filtros globais persistem ao navegar entre as páginas!",
  },
  {
    icon: HelpCircle,
    title: "Central de Ajuda",
    description:
      "A qualquer momento, acesse a página Ajuda no menu lateral para documentação completa de cada módulo. Cada página também possui um botão (?) que leva direto à seção correspondente.",
    page: "/ajuda",
  },
  {
    icon: CheckCircle2,
    title: "Tudo pronto! 🚀",
    description:
      "Agora você está pronto para explorar o Sol Estrateg.IA. Lembre-se:\n\n✅ Filtros globais funcionam em todas as páginas\n✅ Comissão padrão: 2% (Danielle: 3%)\n✅ Use a Ajuda (?) a qualquer momento\n✅ Configure seus dados no Admin\n\nBoa jornada!",
  },
];

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleComplete = async () => {
    if (user) {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true } as any)
        .eq("id", user.id);
    }
    onComplete();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleGoToPage = () => {
    const step = steps[currentStep];
    if (step.page) {
      navigate(step.page);
    }
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="flex flex-col items-center text-center space-y-5 py-4">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? "w-6 bg-primary"
                    : idx < currentStep
                    ? "w-1.5 bg-primary/50"
                    : "w-1.5 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-8 w-8 text-primary" />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">{step.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md whitespace-pre-line text-left">
              {step.description}
            </p>
          </div>

          {/* Navigate to page button */}
          {step.page && (
            <Button variant="outline" size="sm" onClick={handleGoToPage} className="text-xs gap-1">
              <Compass className="h-3 w-3" />
              Ir para esta página
            </Button>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 w-full">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground text-xs"
              size="sm"
            >
              Sair do tour
            </Button>
            <div className="flex-1" />
            {!isFirst && (
              <Button variant="outline" size="sm" onClick={handleBack} className="text-xs">
                Voltar
              </Button>
            )}
            <Button onClick={handleNext} size="sm" className="text-xs">
              {isLast ? "Começar!" : "Próximo"}
            </Button>
          </div>

          {/* Step counter */}
          <p className="text-[10px] text-muted-foreground">
            {currentStep + 1} de {steps.length}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
