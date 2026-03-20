import {
  LayoutDashboard,
  Kanban,
  TrendingUp,
  Activity,
  Users,
  XCircle,
  Target,
  Headset,
  Shield,
  Activity as MonitorIcon,
  Rocket,
  Filter,
  DollarSign,
  BarChart3,
  Percent,
  Compass,
  MessageSquare,
} from "lucide-react";

export interface HelpSection {
  title: string;
  content: string;
}

export interface HelpCategory {
  id: string;
  title: string;
  icon: any;
  sections: HelpSection[];
}

export const helpCategories: HelpCategory[] = [
  {
    id: "primeiros-passos",
    title: "Primeiros Passos",
    icon: Rocket,
    sections: [
      {
        title: "O que é o Sol Estrateg.IA?",
        content:
          "Sol Estrateg.IA é uma plataforma integrada de Business Intelligence, CRM e Suporte, projetada para empresas do setor solar. Ela centraliza dados de propostas comerciais, pipeline de vendas, performance de vendedores e chamados de suporte em um único painel.",
      },
      {
        title: "Para que serve?",
        content:
          "Serve para dar visibilidade completa sobre o processo comercial: desde a geração de leads até o fechamento de contratos, passando por análise de perdas, forecast de receita e gestão de suporte ao cliente.",
      },
      {
        title: "Como começar?",
        content:
          "1. Configure sua planilha Google Sheets com os dados de propostas.\n2. Acesse o painel Admin para conectar a planilha à plataforma.\n3. Cadastre os vendedores e usuários da equipe.\n4. Explore o Dashboard para visualizar os KPIs em tempo real.\n5. Use o Tour Interativo (menu lateral) para conhecer cada módulo.",
      },
      {
        title: "Boas práticas",
        content:
          "• Mantenha a planilha Google Sheets sempre atualizada.\n• Preencha todos os campos obrigatórios (cliente, valor, etapa, status).\n• Revise os dados periodicamente para garantir consistência.\n• Use os filtros globais para análises segmentadas — eles funcionam em toda a plataforma.",
      },
    ],
  },
  {
    id: "filtros-globais",
    title: "Filtros Globais",
    icon: Filter,
    sections: [
      {
        title: "O que são os Filtros Globais?",
        content:
          "Os filtros globais são um sistema unificado de filtragem que persiste entre todas as páginas da plataforma. Quando você aplica um filtro em qualquer página, ele reflete automaticamente em Dashboard, Pipeline, BI, Comissões, Vendedores e demais telas analíticas.",
      },
      {
        title: "Quais filtros estão disponíveis?",
        content:
          "• Período: Hoje, 3 dias, 7 dias, 30 dias, 90 dias, Este mês, Este ano, YTD, Todos ou Personalizado.\n• Etapa: Todas as etapas do processo (Tráfego Pago, Prospecção, Qualificação, Proposta, Negociação, etc.).\n• Temperatura: Quente 🔥, Morno 🌤, Frio ❄️.\n• Busca: Pesquisa textual por nome de cliente, vendedor ou representante.",
      },
      {
        title: "Como usar?",
        content:
          "1. Clique no botão flutuante de filtro (ícone de funil) no canto inferior direito.\n2. Selecione os filtros desejados.\n3. Os dados em TODAS as páginas serão atualizados automaticamente.\n4. Navegue entre as páginas — os filtros permanecem ativos.\n5. Clique em 'Limpar tudo' para resetar.",
      },
      {
        title: "Como os filtros impactam os dados?",
        content:
          "Os filtros atuam sobre TODOS os KPIs, gráficos e tabelas simultaneamente. Por exemplo:\n• Filtrar por 'QUENTE' mostra apenas leads/propostas quentes em todas as views.\n• Filtrar por 'Negociação' mostra dados exclusivamente dessa etapa.\n• A busca filtra por nome de cliente ou vendedor em todas as telas.\n\nIsso garante consistência de leitura e evita divergência entre painéis.",
      },
    ],
  },
  {
    id: "bi-estrategico",
    title: "Dashboard (BI Estratégico)",
    icon: LayoutDashboard,
    sections: [
      {
        title: "O que é?",
        content:
          "O Dashboard é o painel principal do Sol Estrateg.IA. Exibe KPIs consolidados, funis de vendas (por valor e potência), ciclo de vida das propostas, ranking de vendedores e tendências mensais.",
      },
      {
        title: "Indicadores principais",
        content:
          "• Receita Prevista: soma do valor de todas as propostas abertas × probabilidade.\n• Valor Ganho: total das propostas com status 'Ganho'.\n• Taxa de Conversão: (propostas ganhas ÷ total de propostas) × 100.\n• Ticket Médio: valor médio das propostas ganhas.\n• Health Score: nota de 0-100 baseada em conversão, ciclo, distribuição e fluxo.",
      },
      {
        title: "Views disponíveis",
        content:
          "• KPIs Executivos: cartões com métricas principais.\n• Resumo Executivo: análise textual do momento comercial.\n• Progresso da Meta: barra de progresso vs meta mensal.\n• Health Score: termômetro da saúde do pipeline.\n• Alertas Estratégicos: situações que requerem atenção.\n• Funil Estratégico: visualização do funil de conversão.",
      },
      {
        title: "Filtros que afetam esta página",
        content:
          "Esta página responde aos filtros globais: Período, Etapa, Temperatura e Busca. Todos os KPIs e gráficos são recalculados automaticamente. O filtro de Etapa inclui todas as etapas do processo.",
      },
    ],
  },
  {
    id: "pipeline",
    title: "Pipeline",
    icon: Kanban,
    sections: [
      {
        title: "O que é?",
        content:
          "O Pipeline exibe suas propostas em um quadro Kanban visual, organizadas por etapa do processo de vendas (Prospecção, Qualificação, Proposta, Negociação, etc.).",
      },
      {
        title: "Indicadores principais",
        content:
          "• Cada coluna mostra: número de propostas, valor total e cards individuais.\n• Cores dos cards indicam prioridade e tempo na etapa.\n• O header mostra o total de propostas filtradas.",
      },
      {
        title: "Views disponíveis",
        content:
          "• Kanban Board: visão de colunas por etapa.\n• Cards de proposta: nome do cliente, valor, vendedor, tempo na etapa.\n• Contadores por coluna: quantidade e valor acumulado.",
      },
      {
        title: "Filtros que afetam esta página",
        content:
          "Esta página responde aos filtros globais. Se você filtrar por 'QUENTE' no Dashboard, o Pipeline mostrará apenas propostas quentes. Os filtros de Período e Etapa também se aplicam.",
      },
    ],
  },
  {
    id: "forecast",
    title: "Forecast",
    icon: TrendingUp,
    sections: [
      {
        title: "O que é?",
        content:
          "O módulo Forecast apresenta previsões de receita e potência para os próximos 30, 60 e 90 dias, baseadas na probabilidade de fechamento de cada proposta.",
      },
      {
        title: "Como interpretar",
        content:
          "• Alta confiança: propostas com probabilidade ≥70%.\n• Média confiança: probabilidade entre 30-69%.\n• Baixa confiança: probabilidade <30%.\n• A receita prevista = valor × probabilidade.",
      },
      {
        title: "Filtros que afetam esta página",
        content:
          "Responde aos filtros globais de Período, Temperatura e Busca. Use filtros para ver forecast segmentado por vendedor ou por tipo de lead.",
      },
    ],
  },
  {
    id: "vendedores",
    title: "Vendedores",
    icon: Users,
    sections: [
      {
        title: "O que é?",
        content:
          "Módulo de análise individual de performance dos vendedores, com gráficos de receita, taxa de conversão e tabela comparativa detalhada.",
      },
      {
        title: "Indicadores principais",
        content:
          "• Propostas: total de propostas enviadas pelo vendedor.\n• Contratos Fechados: número de propostas com status 'Ganho'.\n• Valor Ganho: receita total dos contratos fechados.\n• Taxa de Conversão: propostas fechadas ÷ propostas enviadas.\n• Ticket Médio: valor médio das propostas ganhas.",
      },
      {
        title: "Views disponíveis",
        content:
          "• Receita por Vendedor: gráfico de barras empilhadas (ganho, aberto, perdido).\n• Taxa de Conversão: gráfico de barras com % por vendedor.\n• Tabela de Performance: ranking completo com todas as métricas.\n• Perdas por Vendedor: análise de propostas perdidas por vendedor.",
      },
      {
        title: "Filtros que afetam esta página",
        content:
          "Responde aos filtros globais. Filtre por período para ver performance mensal, por temperatura para focar em leads quentes, ou use busca para encontrar um vendedor específico.",
      },
    ],
  },
  {
    id: "comissoes",
    title: "Comissões",
    icon: Percent,
    sections: [
      {
        title: "O que é?",
        content:
          "Módulo de cálculo de comissões baseado em valor fechado por vendedor. Taxa padrão: 2%. Danielle: 3%. As taxas são editáveis por vendedor.",
      },
      {
        title: "Indicadores principais",
        content:
          "• Receita Fechada: soma dos valores de propostas com status 'Ganho'.\n• Total Comissões: soma das comissões calculadas.\n• Taxa Média: média ponderada das taxas aplicadas.\n• Vendedores: quantidade de vendedores com propostas.",
      },
      {
        title: "Views disponíveis",
        content:
          "• Top 10 Comissão por Vendedor: gráfico com valor de comissão E quantidade de fechamentos (barras duplas).\n• Detalhamento por Vendedor: tabela com propostas enviadas, contratos fechados, valor ganho, % comissão (editável), comissão em R$ e taxa de conversão.\n• Taxa de Conversão = propostas fechadas ÷ propostas enviadas.",
      },
      {
        title: "Filtros que afetam esta página",
        content:
          "Responde aos filtros globais. Filtre por período para calcular comissões de um mês específico, ou por vendedor via busca.",
      },
    ],
  },
  {
    id: "bi",
    title: "Business Intelligence",
    icon: BarChart3,
    sections: [
      {
        title: "O que é?",
        content:
          "O módulo BI consolida dados do Make Data Store e propostas enriquecidas em uma visão estratégica com funis, métricas de SLA, temperatura de leads e análises de desqualificação.",
      },
      {
        title: "Indicadores principais",
        content:
          "• Receita Fechada e Pipeline Aberto.\n• Funil de Conversão com taxas por etapa.\n• Leads por Cidade e Temperatura.\n• FUP Frio: métricas de reativação de leads frios.\n• Volume & SLA: tempos de primeiro contato e resposta.",
      },
      {
        title: "Filtros que afetam esta página",
        content:
          "O BI NÃO possui filtro local próprio. Ele obedece aos filtros globais aplicados em qualquer outra página. Isso garante que os dados do BI estejam sempre no mesmo contexto das demais telas.",
      },
    ],
  },
  {
    id: "perdas",
    title: "Perdas",
    icon: XCircle,
    sections: [
      {
        title: "O que é?",
        content:
          "Análise detalhada dos motivos, etapas, vendedores e origens associados às propostas perdidas.",
      },
      {
        title: "Como interpretar",
        content:
          "• Motivo de perda: razão registrada para a perda.\n• Etapa da perda: em qual fase do funil a proposta foi perdida.\n• Tendência mensal: evolução das perdas ao longo do tempo.",
      },
      {
        title: "Filtros que afetam esta página",
        content:
          "Responde aos filtros globais de Período, Temperatura e Busca.",
      },
    ],
  },
  {
    id: "origens",
    title: "Origens",
    icon: Target,
    sections: [
      {
        title: "O que é?",
        content:
          "Módulo de análise dos canais de aquisição de leads, mostrando volume, conversão e valor por origem.",
      },
      {
        title: "Indicadores principais",
        content:
          "• Volume de leads por canal.\n• Taxa de conversão por canal.\n• Valor total por canal.\n• ROI estimado por origem.",
      },
      {
        title: "Filtros que afetam esta página",
        content:
          "Responde aos filtros globais. Use o filtro de período para comparar canais em diferentes janelas temporais.",
      },
    ],
  },
  {
    id: "chamados",
    title: "Chamados",
    icon: Headset,
    sections: [
      {
        title: "O que é?",
        content:
          "Sistema de chamados (tickets de suporte) com SLA configurável, categorias, prioridades e comunicação integrada.",
      },
      {
        title: "Como usar",
        content:
          "1. Clique em 'Novo Chamado'.\n2. Preencha título, descrição, categoria e prioridade.\n3. O sistema calcula o prazo de SLA automaticamente.\n4. Acompanhe o status e troque mensagens no chamado.\n5. Anexe prints ou arquivos quando necessário.",
      },
      {
        title: "Indicadores",
        content:
          "• SLA Timer: conta regressiva até o prazo.\n• Status: Aberto, Em Andamento, Aguardando Usuário, Resolvido, Fechado.\n• Prioridade: Baixa, Média, Alta, Crítica.",
      },
    ],
  },
  {
    id: "admin",
    title: "Admin",
    icon: Shield,
    sections: [
      {
        title: "O que é?",
        content:
          "Painel administrativo para gerenciar organizações, usuários, roles e configurações da plataforma. Acessível apenas para Super Admins.",
      },
      {
        title: "Funcionalidades",
        content:
          "• Gerenciar Filiais: criar, editar, configurar credenciais por filial.\n• Gerenciar Usuários: adicionar, remover, alterar roles.\n• Módulos: habilitar/desabilitar módulos por usuário.\n• Logs de Acesso: monitorar atividade de login.",
      },
    ],
  },
  {
    id: "monitoramento",
    title: "Monitoramento",
    icon: MonitorIcon,
    sections: [
      {
        title: "O que é?",
        content:
          "Módulo que exibe o status de disponibilidade dos sistemas, heartbeat dos fluxos Make e erros de execução.",
      },
      {
        title: "Views disponíveis",
        content:
          "• Heartbeat Grid: status de cada cenário Make.\n• Erros: dashboard de erros com filtros por tipo e status.\n• Reprocessamento: fila de itens para reprocessar.",
      },
    ],
  },
  {
    id: "navegacao",
    title: "Navegação entre Views",
    icon: Compass,
    sections: [
      {
        title: "Menu Lateral",
        content:
          "O menu lateral está organizado em 5 blocos:\n• PRÉ-VENDA: Dashboard, Pipeline, Leads, Robô SOL, FUP Frio, Forecast.\n• COMERCIAL: Painel Comercial, Propostas, Contratos, Vendedores, Comissões.\n• INTELIGÊNCIA: BI, Analista Follow-up, Jornada Lead, Monitor SLA, Ads, Mídia × Receita.\n• INSIGHTS: Reports.\n• OPERACIONAL: Monitor, Chamados, Reprocessar, Sanitização.",
      },
      {
        title: "Compartilhamento de filtros",
        content:
          "Todas as páginas analíticas compartilham o mesmo contexto de filtros. Se você selecionar 'Último mês' no Dashboard, o Pipeline, BI, Comissões e Vendedores exibirão dados do mesmo período automaticamente.",
      },
    ],
  },
];
