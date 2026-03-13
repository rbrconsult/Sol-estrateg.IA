import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Rocket, CheckCircle2, Clock, Lightbulb, Calendar, Tag, ArrowRight } from "lucide-react";

type Status = "done" | "in-progress" | "planned";

interface RoadmapItem {
  title: string;
  description: string;
  status: Status;
  quarter: string;
  tags: string[];
}

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: { type: "feature" | "fix" | "improvement"; text: string }[];
}

const roadmapItems: RoadmapItem[] = [
  {
    title: "Dashboard Executivo",
    description: "Painel com KPIs estratégicos, funil de vendas e ranking de vendedores em tempo real.",
    status: "done",
    quarter: "Q1 2025",
    tags: ["BI", "Dashboard"],
  },
  {
    title: "Sol Estrateg.IA",
    description: "Módulo de conferência inteligente com score por origem, SLA e insights automáticos.",
    status: "done",
    quarter: "Q1 2025",
    tags: ["IA", "Conferência"],
  },
  {
    title: "Sistema de Chamados",
    description: "Abertura de tickets com SLA automático, notificações WhatsApp e histórico completo.",
    status: "done",
    quarter: "Q1 2025",
    tags: ["Suporte", "SLA"],
  },
  {
    title: "Monitoramento Make",
    description: "Heartbeat e monitoramento de erros em cenários de automação Make.com.",
    status: "done",
    quarter: "Q1 2025",
    tags: ["Automação", "Make"],
  },
  {
    title: "Centro de Inteligência (BI)",
    description: "Módulo BI com abas para Solar Market, FUP Frio, Sol SDR, Cruzamentos e mais.",
    status: "done",
    quarter: "Q1 2025",
    tags: ["BI", "Análise"],
  },
  {
    title: "Integração Ads (Meta/Google)",
    description: "Conexão direta com APIs de anúncios para métricas reais de campanhas.",
    status: "in-progress",
    quarter: "Q2 2025",
    tags: ["Ads", "Integração"],
  },
  {
    title: "Integração Sults",
    description: "Dados de franquias e operação via API Sults em tempo real.",
    status: "in-progress",
    quarter: "Q2 2025",
    tags: ["Sults", "Integração"],
  },
  {
    title: "Alertas Inteligentes por WhatsApp",
    description: "Notificações automáticas de anomalias, metas batidas e SLA estourado.",
    status: "planned",
    quarter: "Q3 2025",
    tags: ["WhatsApp", "Alertas"],
  },
  {
    title: "App Mobile (PWA)",
    description: "Versão mobile otimizada como Progressive Web App para acesso rápido.",
    status: "planned",
    quarter: "Q3 2025",
    tags: ["Mobile", "PWA"],
  },
  {
    title: "Relatórios Automatizados",
    description: "Geração e envio automático de relatórios semanais/mensais por email.",
    status: "planned",
    quarter: "Q4 2025",
    tags: ["Relatórios", "Automação"],
  },
];

const changelogEntries: ChangelogEntry[] = [
  {
    version: "2.4.0",
    date: "12/03/2025",
    title: "Roadmap & Changelog",
    changes: [
      { type: "feature", text: "Nova página de Roadmap e Changelog para transparência com clientes" },
      { type: "improvement", text: "Botão de acesso rápido na barra lateral" },
    ],
  },
  {
    version: "2.3.0",
    date: "10/03/2025",
    title: "Centro de Inteligência BI",
    changes: [
      { type: "feature", text: "Módulo BI com abas Solar Market, FUP Frio, Sol SDR, Cruzamentos" },
      { type: "feature", text: "Aba de Ads com indicador de 'Aguardando API'" },
      { type: "improvement", text: "Filtros de período corrigidos no Sol Estrateg.IA" },
    ],
  },
  {
    version: "2.2.0",
    date: "03/03/2025",
    title: "Monitor de Erros Make",
    changes: [
      { type: "feature", text: "Dashboard de erros de cenários Make.com com detalhes e resolução" },
      { type: "feature", text: "Heartbeat visual dos cenários de automação" },
      { type: "fix", text: "Correção no cache de dados do Google Sheets" },
    ],
  },
  {
    version: "2.1.0",
    date: "24/02/2025",
    title: "Sistema de Chamados",
    changes: [
      { type: "feature", text: "Abertura de chamados com categorias e prioridade" },
      { type: "feature", text: "SLA automático com timer visual" },
      { type: "feature", text: "Notificações via WhatsApp ao abrir/atualizar chamados" },
      { type: "improvement", text: "Histórico de status e mensagens por chamado" },
    ],
  },
  {
    version: "2.0.0",
    date: "15/02/2025",
    title: "Sol Estrateg.IA",
    changes: [
      { type: "feature", text: "Módulo de conferência inteligente com dados do CRM" },
      { type: "feature", text: "Score por origem e métricas de SLA" },
      { type: "feature", text: "Integração com Make.com Data Store" },
      { type: "improvement", text: "Novo layout com sidebar colapsável" },
    ],
  },
  {
    version: "1.0.0",
    date: "01/02/2025",
    title: "Lançamento Inicial",
    changes: [
      { type: "feature", text: "Dashboard executivo com KPIs e funil de vendas" },
      { type: "feature", text: "Pipeline Kanban visual" },
      { type: "feature", text: "Forecast de receita" },
      { type: "feature", text: "Ranking de vendedores e análise de perdas" },
      { type: "feature", text: "Autenticação segura com Turnstile" },
    ],
  },
];

const statusConfig: Record<Status, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  done: { label: "Concluído", color: "bg-success/20 text-success border-success/30", icon: CheckCircle2 },
  "in-progress": { label: "Em andamento", color: "bg-warning/20 text-warning border-warning/30", icon: Clock },
  planned: { label: "Planejado", color: "bg-info/20 text-info border-info/30", icon: Lightbulb },
};

const changeTypeConfig = {
  feature: { label: "Novo", color: "bg-success/20 text-success border-success/30" },
  fix: { label: "Correção", color: "bg-destructive/20 text-destructive border-destructive/30" },
  improvement: { label: "Melhoria", color: "bg-info/20 text-info border-info/30" },
};

export default function Roadmap() {
  const [activeTab, setActiveTab] = useState("roadmap");

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Rocket className="h-8 w-8 text-primary" />
          Roadmap & Changelog
        </h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe as novidades e o que estamos construindo para você.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="roadmap" className="gap-2">
            <Calendar className="h-4 w-4" />
            Roadmap
          </TabsTrigger>
          <TabsTrigger value="changelog" className="gap-2">
            <Tag className="h-4 w-4" />
            Changelog
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roadmap" className="mt-6">
          <div className="flex gap-4 mb-6 flex-wrap">
            {(Object.entries(statusConfig) as [Status, typeof statusConfig[Status]][]).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                <cfg.icon className="h-4 w-4" />
                <span className="text-muted-foreground">{cfg.label}</span>
                <Badge variant="outline" className={cfg.color}>
                  {roadmapItems.filter(i => i.status === key).length}
                </Badge>
              </div>
            ))}
          </div>

          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="space-y-4">
              {roadmapItems.map((item, idx) => {
                const cfg = statusConfig[item.status];
                return (
                  <Card key={idx} className="border-border/50 hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <cfg.icon className="h-5 w-5 shrink-0" />
                          <div>
                            <CardTitle className="text-base">{item.title}</CardTitle>
                            <CardDescription className="mt-1">{item.description}</CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className={cfg.color + " shrink-0"}>
                          {cfg.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">{item.quarter}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        {item.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="changelog" className="mt-6">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-6">
              {changelogEntries.map((entry, idx) => (
                <Card key={idx} className="border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-primary text-primary-foreground">v{entry.version}</Badge>
                        <CardTitle className="text-base">{entry.title}</CardTitle>
                      </div>
                      <span className="text-xs text-muted-foreground">{entry.date}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2">
                      {entry.changes.map((change, cIdx) => {
                        const cCfg = changeTypeConfig[change.type];
                        return (
                          <li key={cIdx} className="flex items-start gap-2 text-sm">
                            <Badge variant="outline" className={cCfg.color + " text-[10px] px-1.5 py-0 shrink-0 mt-0.5"}>
                              {cCfg.label}
                            </Badge>
                            <span className="text-foreground">{change.text}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
