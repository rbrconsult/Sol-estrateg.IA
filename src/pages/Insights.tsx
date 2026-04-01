import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Bot, MessageSquare, BarChart3, Zap, Target, Eye, Cpu, FileSearch, Gauge, TrendingUp, Workflow } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Skill {
  icon: React.ElementType;
  name: string;
  desc: string;
  status: "ativo" | "beta" | "planejado";
  category: string;
  usage?: number; // percentage
}

const skills: Skill[] = [
  // IA Conversacional
  { icon: Bot, name: "SDR com IA (SOL)", desc: "Qualificação automática de leads via WhatsApp com IA conversacional e áudio", status: "ativo", category: "IA Conversacional", usage: 92 },
  { icon: MessageSquare, name: "FUP Frio Automático", desc: "Follow-up inteligente para leads inativos com cadência adaptativa", status: "ativo", category: "IA Conversacional", usage: 78 },
  { icon: Zap, name: "Auto-Followup", desc: "Envia mensagens de acompanhamento automáticas baseadas em contexto", status: "ativo", category: "IA Conversacional", usage: 65 },

  // Análise & Scoring
  { icon: Brain, name: "Análise de Sentimento", desc: "Detecta tom, intenção e urgência das conversas para priorizar leads", status: "beta", category: "Análise & Scoring" },
  { icon: Gauge, name: "Lead Scoring (0-100)", desc: "Pontuação automática baseada em comportamento, perfil e engajamento", status: "ativo", category: "Análise & Scoring", usage: 88 },
  { icon: Target, name: "Temperatura Dinâmica", desc: "Classificação quente/morno/frio baseada em interações recentes", status: "ativo", category: "Análise & Scoring", usage: 95 },

  // Operacional
  { icon: Eye, name: "OCR Conta de Luz", desc: "Leitura automática de contas de energia com extração de kWh e valor", status: "ativo", category: "Operacional", usage: 70 },
  { icon: Workflow, name: "Roteamento Inteligente", desc: "Distribui leads para o closer ideal com base em carga e performance", status: "beta", category: "Operacional" },
  { icon: FileSearch, name: "Sanitização de Dados", desc: "Detecção e correção automática de dados inconsistentes", status: "ativo", category: "Operacional", usage: 45 },

  // Inteligência
  { icon: BarChart3, name: "Executive Summary", desc: "Resumo diário gerado por IA com KPIs e alertas estratégicos", status: "ativo", category: "Inteligência", usage: 60 },
  { icon: TrendingUp, name: "Previsão de Conversão", desc: "Modelo preditivo de probabilidade de fechamento por lead", status: "planejado", category: "Inteligência" },
  { icon: Cpu, name: "Copilot Comercial", desc: "Assistente IA para vendedores com sugestões de abordagem em tempo real", status: "planejado", category: "Inteligência" },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  ativo: { label: "Ativo", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  beta: { label: "Beta", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  planejado: { label: "Planejado", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
};

const categories = [...new Set(skills.map(s => s.category))];

export default function Insights() {
  const activeCount = skills.filter(s => s.status === "ativo").length;
  const betaCount = skills.filter(s => s.status === "beta").length;
  const plannedCount = skills.filter(s => s.status === "planejado").length;

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Skills & Automações</h1>
          <p className="text-muted-foreground mt-1">Capacidades de IA ativas e planejadas na plataforma SOL</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className={statusConfig.ativo.className}>
            {activeCount} Ativos
          </Badge>
          <Badge variant="outline" className={statusConfig.beta.className}>
            {betaCount} Beta
          </Badge>
          <Badge variant="outline" className={statusConfig.planejado.className}>
            {plannedCount} Planejados
          </Badge>
        </div>
      </div>

      {/* By Category */}
      {categories.map(cat => (
        <div key={cat} className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{cat}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.filter(s => s.category === cat).map(s => {
              const cfg = statusConfig[s.status];
              return (
                <Card key={s.name} className="bg-card/60 border-border/40 hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <s.icon className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
                    </div>
                    <CardTitle className="text-base mt-3">{s.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                    {s.usage !== undefined && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Utilização</span>
                          <span className="font-medium">{s.usage}%</span>
                        </div>
                        <Progress value={s.usage} className="h-1.5" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
