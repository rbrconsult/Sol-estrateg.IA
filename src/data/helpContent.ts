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
        title: "O que é o Sol EstrategIA?",
        content:
          "Sol EstrategIA é uma plataforma integrada de Business Intelligence, CRM e Suporte, projetada para empresas do setor solar. Ela centraliza dados de propostas comerciais, pipeline de vendas, performance de vendedores e chamados de suporte em um único painel.",
      },
      {
        title: "Para que serve?",
        content:
          "Serve para dar visibilidade completa sobre o processo comercial: desde a geração de leads até o fechamento de contratos, passando por análise de perdas, forecast de receita e gestão de suporte ao cliente.",
      },
      {
        title: "Como começar?",
        content:
          "1. Configure sua planilha Google Sheets com os dados de propostas.\n2. Acesse o painel Admin para conectar a planilha à plataforma.\n3. Cadastre os vendedores e usuários da equipe.\n4. Explore o Dashboard para visualizar os KPIs em tempo real.",
      },
      {
        title: "Boas práticas",
        content:
          "• Mantenha a planilha Google Sheets sempre atualizada.\n• Preencha todos os campos obrigatórios (cliente, valor, etapa, status).\n• Revise os dados periodicamente para garantir consistência.\n• Use filtros no Dashboard para análises segmentadas.",
      },
    ],
  },
  {
    id: "bi-estrategico",
    title: "BI Estratégico",
    icon: LayoutDashboard,
    sections: [
      {
        title: "O que é?",
        content:
          "O módulo de BI Estratégico é o painel principal do Sol EstrategIA. Exibe KPIs consolidados, funis de vendas (por valor e potência), ciclo de vida das propostas, ranking de vendedores e tendências mensais.",
      },
      {
        title: "Para que serve?",
        content:
          "Permite uma visão executiva do desempenho comercial, facilitando a tomada de decisões rápidas baseadas em dados reais e atualizados.",
      },
      {
        title: "Como funciona?",
        content:
          "Os dados são importados automaticamente do Google Sheets a cada 10 minutos. Os KPIs são calculados em tempo real com base nos filtros aplicados (vendedor, pré-vendedor, período).",
      },
      {
        title: "Boas práticas",
        content:
          "• Use os filtros de data para comparar períodos.\n• Analise o funil estratégico para identificar gargalos.\n• Acompanhe o ranking de vendedores semanalmente.\n• Exporte dados para apresentações executivas.",
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
        title: "Para que serve?",
        content:
          "Facilita a visualização do estado atual de cada proposta e permite identificar rapidamente quais negócios estão parados ou em risco.",
      },
      {
        title: "Como funciona?",
        content:
          "As colunas do Kanban representam as etapas reais da planilha Google Sheets. Cada card mostra o nome do cliente, valor da proposta e tempo na etapa atual.",
      },
      {
        title: "Boas práticas",
        content:
          "• Revise o Pipeline diariamente.\n• Foque em propostas com mais tempo na mesma etapa.\n• Use as cores dos cards para identificar prioridades.\n• Atualize a etapa no Google Sheets sempre que houver progresso.",
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
        title: "Para que serve?",
        content:
          "Permite planejar o fluxo de caixa e estimar a capacidade instalada futura com base em dados reais do pipeline.",
      },
      {
        title: "Como funciona?",
        content:
          "A receita prevista é calculada multiplicando o valor de cada proposta pela sua probabilidade de fechamento. Propostas com probabilidade ≥70% são destacadas como alta confiança.",
      },
      {
        title: "Boas práticas",
        content:
          "• Ajuste as probabilidades das propostas regularmente.\n• Compare o forecast com o realizado mensal.\n• Foque nas propostas em risco (baixa probabilidade ou muito tempo paradas).\n• Use o forecast para dimensionar equipe e estoque.",
      },
    ],
  },
  {
    id: "atividades",
    title: "Atividades",
    icon: Activity,
    sections: [
      {
        title: "O que é?",
        content:
          "O módulo de Atividades monitora follow-ups, contatos e tarefas pendentes dos vendedores, identificando leads sem acompanhamento.",
      },
      {
        title: "Para que serve?",
        content:
          "Garante que nenhum lead fique sem contato e que os follow-ups sejam feitos no prazo, aumentando a taxa de conversão.",
      },
      {
        title: "Como funciona?",
        content:
          "Analisa datas de último contato, próxima atividade e speed-to-lead para gerar alertas automáticos. Clique nos KPIs para ver a lista de leads afetados.",
      },
      {
        title: "Boas práticas",
        content:
          "• Verifique diariamente os follow-ups atrasados.\n• Mantenha o speed-to-lead abaixo de 24h.\n• Preencha a data de próxima atividade para cada lead.\n• Use o ranking de atividades para coaching da equipe.",
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
          "Módulo de análise individual de performance dos vendedores, com gráficos de receita, taxa de conversão e tabela comparativa.",
      },
      {
        title: "Para que serve?",
        content:
          "Identifica os melhores performers, detecta oportunidades de coaching e permite comparar métricas entre vendedores.",
      },
      {
        title: "Como funciona?",
        content:
          "Agrega dados de propostas por vendedor/representante, calculando receita ganha, perdida, em aberto, taxa de conversão, ticket médio e tempo de resposta.",
      },
      {
        title: "Boas práticas",
        content:
          "• Compare a taxa de conversão entre vendedores.\n• Identifique vendedores com ticket médio alto mas baixa conversão.\n• Use o tempo de resposta como métrica de qualidade.\n• Realize reuniões de coaching baseadas nos dados.",
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
        title: "Para que serve?",
        content:
          "Permite entender por que negócios são perdidos e tomar ações corretivas para melhorar a taxa de conversão.",
      },
      {
        title: "Como funciona?",
        content:
          "Agrupa propostas com status 'Perdido' por motivo de perda, etapa em que foram perdidas, vendedor responsável e canal de origem.",
      },
      {
        title: "Boas práticas",
        content:
          "• Preencha o motivo de perda sempre que uma proposta for perdida.\n• Analise tendências mensais de perdas.\n• Foque nos motivos mais recorrentes.\n• Revise a etapa crítica para melhorar o processo nesse ponto.",
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
        title: "Para que serve?",
        content:
          "Identifica quais canais geram mais leads e quais convertem melhor, otimizando o investimento em marketing.",
      },
      {
        title: "Como funciona?",
        content:
          "Agrupa propostas pela coluna 'Origem do Lead' do Google Sheets, calculando métricas de conversão, valor e tempo de fechamento por canal.",
      },
      {
        title: "Boas práticas",
        content:
          "• Configure a coluna 'Origem do Lead' no Google Sheets.\n• Compare o custo de aquisição por canal com o ticket médio.\n• Invista mais nos canais com melhor ROI.\n• Monitore o tempo de fechamento por origem.",
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
        title: "Para que serve?",
        content:
          "Centraliza as solicitações de suporte, garante cumprimento de SLA e fornece métricas de qualidade do atendimento.",
      },
      {
        title: "Como funciona?",
        content:
          "Abra um chamado com título, descrição, categoria e prioridade. O sistema calcula o prazo de SLA automaticamente. Acompanhe o status e troque mensagens diretamente no chamado.",
      },
      {
        title: "Boas práticas",
        content:
          "• Descreva o problema com detalhes.\n• Anexe prints ou arquivos quando necessário.\n• Priorize chamados críticos corretamente.\n• Responda dentro do prazo de SLA.",
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
        title: "Para que serve?",
        content:
          "Permite configurar a conexão com Google Sheets, gerenciar membros da equipe e definir permissões de acesso.",
      },
      {
        title: "Como funciona?",
        content:
          "Acesse a aba Admin no menu lateral. Configure o ID da planilha Google Sheets, adicione ou remova usuários e defina roles (admin, user).",
      },
      {
        title: "Boas práticas",
        content:
          "• Mantenha poucos Super Admins.\n• Revise permissões periodicamente.\n• Configure a URL de monitoramento para cada organização.\n• Documente as configurações da planilha.",
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
          "Módulo que exibe o status de disponibilidade dos sistemas e serviços da plataforma.",
      },
      {
        title: "Para que serve?",
        content:
          "Permite verificar rapidamente se todos os serviços estão operacionais e acessar o painel de status externo.",
      },
      {
        title: "Como funciona?",
        content:
          "Exibe indicadores de status de servidores, conectividade e uptime. Se configurado, redireciona para um painel de status externo (ex: UptimeRobot).",
      },
      {
        title: "Boas práticas",
        content:
          "• Configure a URL do painel de status no Admin.\n• Verifique o monitoramento diariamente.\n• Configure alertas de downtime no serviço externo.",
      },
    ],
  },
];
