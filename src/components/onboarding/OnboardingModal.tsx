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
  Sun
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Step {
  icon: any;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    icon: Sun,
    title: "Bem-vindo ao Sol EstrategIA! ☀️",
    description:
      "Sua plataforma integrada de BI, CRM e Suporte. Vamos fazer um tour rápido para você conhecer os principais recursos.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard Estratégico",
    description:
      "Visualize KPIs consolidados, funis de vendas por valor e potência, ranking de vendedores e tendências mensais — tudo em tempo real.",
  },
  {
    icon: Kanban,
    title: "Pipeline Visual",
    description:
      "Acompanhe suas propostas em um quadro Kanban organizado por etapas. Identifique rapidamente negócios parados ou em risco.",
  },
  {
    icon: Headset,
    title: "Chamados de Suporte",
    description:
      "Abra e acompanhe tickets de suporte com SLA configurável, categorias, prioridades e comunicação integrada.",
  },
  {
    icon: HelpCircle,
    title: "Central de Ajuda",
    description:
      "Acesse a documentação completa a qualquer momento. Cada módulo possui um botão (?) que leva direto à seção correspondente.",
  },
  {
    icon: CheckCircle2,
    title: "Tudo pronto! 🚀",
    description:
      "Agora você está pronto para explorar o Sol EstrategIA. Configure sua planilha Google Sheets no Admin e comece a acompanhar seus dados.",
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

  const handleSkip = () => {
    handleComplete();
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="flex flex-col items-center text-center space-y-6 py-4">
          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? "w-8 bg-primary"
                    : idx < currentStep
                    ? "w-2 bg-primary/50"
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-10 w-10 text-primary" />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">{step.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              {step.description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 w-full">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="flex-1 text-muted-foreground"
            >
              Pular
            </Button>
            <Button onClick={handleNext} className="flex-1">
              {isLast ? "Começar!" : "Próximo"}
            </Button>
          </div>

          {/* Step counter */}
          <p className="text-xs text-muted-foreground">
            {currentStep + 1} de {steps.length}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
