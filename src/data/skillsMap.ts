export type SkillStatus = "ativo" | "precisa_dados" | "criar" | "futuro";
export type Vertical = "universal" | "solar" | "financeiro" | "viagens" | "seguros" | "academia";

export interface Skill {
  id: string;
  name: string;
  desc: string;
  status: SkillStatus;
  fonte?: string;
  output?: string;
  verticals: Vertical[]; // which verticals this skill applies to
}

export interface SkillCategory {
  key: string;
  label: string;
  emoji: string;
  skills: Skill[];
}

export const verticalConfig: Record<Vertical, { label: string; emoji: string; color: string }> = {
  universal: { label: "Universal", emoji: "🌐", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  solar: { label: "Energia Solar", emoji: "☀️", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  financeiro: { label: "Financeiro / Franquias", emoji: "🏦", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  viagens: { label: "Viagens & Pacotes", emoji: "✈️", color: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  seguros: { label: "Seguros", emoji: "🛡️", color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  academia: { label: "Academia / Fitness", emoji: "💪", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
};

export const statusConfig: Record<SkillStatus, { label: string; className: string }> = {
  ativo: { label: "✅ Ativo", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  precisa_dados: { label: "⏳ Aguardando Dados", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  criar: { label: "📝 Rascunho", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  futuro: { label: "🚀 Em Criação", className: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
};

// Helper: u = universal, s = solar, f = financeiro, v = viagens, sg = seguros, a = academia
const U: Vertical[] = ["universal"];
const ALL: Vertical[] = ["universal", "solar", "financeiro", "viagens", "seguros", "academia"];
const SOL: Vertical[] = ["solar"];
const FIN: Vertical[] = ["financeiro"];
const VIA: Vertical[] = ["viagens"];
const SEG: Vertical[] = ["seguros"];
const ACA: Vertical[] = ["academia"];

export const skillCategories: SkillCategory[] = [
  {
    key: "pre-venda", label: "Pré-Venda", emoji: "🎯",
    skills: [
      { id: "1.1", name: "Qualificação Automática (ICP Score)", desc: "Score 0-100 + temperatura FRIO/MORNO/QUENTE baseado no perfil", status: "ativo", verticals: ALL, fonte: "leads_sync (dados de perfil)", output: "Score 0-100 + temperatura" },
      { id: "golden-hour", name: "Golden Hour (5 min)", desc: "Alerta quando lead novo não foi contactado em 5 minutos — Edge Function + Make webhook", status: "ativo", verticals: ALL, fonte: "sol_leads_sync (ts_cadastro vs ts_ultima_interacao)", output: "⚠️ Insight + WhatsApp via Make" },
      { id: "1.3", name: "Detector de Lead Dormentes", desc: "Alerta WhatsApp para leads inativos >48h", status: "criar", verticals: ALL, fonte: "leads_sync (ts_ultima_interacao > 48h)", output: "⚠️ Alerta WhatsApp" },
      { id: "1.4", name: "Análise Canal × Conversão", desc: "CPL e taxa de conversão por canal de origem", status: "precisa_dados", verticals: ALL, fonte: "leads_sync + ads", output: "CPL comparativo por canal" },
      { id: "1.5", name: "Gerador de Script por Persona", desc: "Adapta prompt do Agente IA por perfil do lead", status: "criar", verticals: ALL, fonte: "config_sync + qualificacao_sync", output: "Prompt adaptado por persona" },
      { id: "1.6", name: "SLA Primeiro Contato", desc: "Tempo de resposta do agente IA ao primeiro contato", status: "criar", verticals: ALL, fonte: "leads_sync (ts_cadastro vs ts_primeira_msg)", output: "SLA cumprido em X%" },
      { id: "1.7", name: "Resgate FUP Inteligente", desc: "Follow-up automático resgata leads frios com cadência adaptativa", status: "ativo", verticals: ALL, fonte: "leads_sync (fup_count, status, temperatura)", output: "Taxa resgate: X%" },
      { id: "1.8", name: "Custo IA por Qualificação", desc: "Custo do agente IA por lead qualificado", status: "ativo", verticals: ALL, fonte: "leads_sync (custo_total_usd WHERE QUALIFICADO)", output: "Custo IA: $X/lead" },
      { id: "1.9", name: "Horário Pico de Resposta", desc: "Analisa quando leads respondem mais para otimizar FUP", status: "criar", verticals: ALL, fonte: "leads_sync (hora de interação)", output: "FUP ajusta horário" },
      // Solar-specific
      { id: "1.10", name: "OCR Conta de Luz", desc: "GPT-4 Vision extrai valor real da foto da conta de energia — calibra score e dimensionamento", status: "ativo", verticals: SOL, fonte: "leads_sync (valor_conta_confirmado_ocr)", output: "Valor extraído da foto" },
      // Financeiro-specific
      { id: "1.11", name: "Score Serasa/SPC", desc: "Consulta score de crédito automaticamente para qualificação", status: "futuro", verticals: FIN, fonte: "API Serasa/SPC", output: "Score crédito + risco" },
      { id: "1.12", name: "Análise de Capacidade de Investimento", desc: "Calcula capacidade de investimento do franqueado potencial", status: "futuro", verticals: FIN, fonte: "leads_sync (patrimonio, faturamento)", output: "Capacidade calculada" },
      // Viagens-specific
      { id: "1.13", name: "Detector de Sazonalidade de Destino", desc: "Identifica melhor período para vender cada destino", status: "futuro", verticals: VIA, fonte: "leads_sync + calendário destinos", output: "Destino × época ideal" },
      { id: "1.14", name: "Matching Pacote × Perfil", desc: "IA cruza perfil do lead com pacotes disponíveis", status: "futuro", verticals: VIA, fonte: "leads_sync + catálogo pacotes", output: "Top 3 pacotes sugeridos" },
      // Seguros-specific
      { id: "1.15", name: "Análise de Risco (Perfil)", desc: "Avalia risco do segurado baseado em dados demográficos", status: "futuro", verticals: SEG, fonte: "leads_sync (idade, veículo, região)", output: "Score de risco" },
      { id: "1.16", name: "Cotação Automática", desc: "Gera cotação inicial via integração com seguradoras", status: "futuro", verticals: SEG, fonte: "API seguradoras", output: "Cotação comparativa" },
      // Academia-specific
      { id: "1.17", name: "Trial Score", desc: "Prediz probabilidade de conversão do trial/experimental", status: "futuro", verticals: ACA, fonte: "leads_sync (frequência trial, horário)", output: "% chance de converter" },
      { id: "1.18", name: "Horário Ideal de Contato", desc: "Descobre melhor horário para abordar alunos potenciais", status: "futuro", verticals: ACA, fonte: "leads_sync (padrão de resposta)", output: "Horário ótimo" },
    ],
  },
  {
    key: "comercial", label: "Comercial", emoji: "💼",
    skills: [
      { id: "2.1", name: "Distribuição Inteligente (Golden Hour)", desc: "Roteia lead pro vendedor no pico de performance dele", status: "precisa_dados", verticals: ALL, fonte: "equipe_sync + leads_sync", output: "Roteamento dinâmico" },
      { id: "2.2", name: "Forecast Pipeline", desc: "Previsão de receita baseada no pipeline atual", status: "precisa_dados", verticals: ALL, fonte: "leads_sync × taxa_historica × valor_medio", output: "Receita prevista 30 dias" },
      { id: "2.3", name: "Alerta Lead Parado", desc: "WhatsApp: lead qualificado sem ação há X dias", status: "criar", verticals: ALL, fonte: "leads_sync (sem interação > 7d)", output: "Alerta WhatsApp closer" },
      { id: "2.4", name: "Sugestão Próxima Ação", desc: "IA sugere ação ideal baseada no contexto do lead", status: "criar", verticals: ALL, fonte: "leads_sync (status, etapa, contexto)", output: "Ação sugerida" },
      { id: "2.5", name: "Análise Motivo Perda", desc: "Identifica padrões nos motivos de perda", status: "precisa_dados", verticals: ALL, fonte: "projetos_sync (evento=lost)", output: "Top motivos + sugestão" },
      { id: "2.6", name: "Ranking Performance Vendedores", desc: "Ranking de conversão e produtividade por vendedor", status: "precisa_dados", verticals: ALL, fonte: "leads_sync GROUP BY vendedor", output: "Ranking conversão" },
      { id: "2.7", name: "Coach de Vendas", desc: "IA analisa conversas perdidas e sugere melhorias", status: "futuro", verticals: ALL, fonte: "leads_sync (resumo_conversa)", output: "Feedback por conversa" },
      { id: "2.8", name: "Gerador de Proposta", desc: "Gera proposta automática baseada no perfil", status: "futuro", verticals: ALL, fonte: "leads_sync + catálogo", output: "Proposta gerada" },
      { id: "2.9", name: "Alerta Risco de Perda", desc: "Alerta diretoria sobre leads em risco de perda", status: "criar", verticals: ALL, fonte: "leads_sync (qualificado > 21d)", output: "🔴 Alerta diretoria" },
      { id: "2.10", name: "Comissão Automática", desc: "Calcula comissão por vendedor automaticamente", status: "precisa_dados", verticals: ALL, fonte: "projetos_sync × equipe_sync", output: "Comissão calculada" },
      // Viagens
      { id: "2.11", name: "Upsell de Experiências", desc: "Sugere experiências/add-ons ao pacote principal", status: "futuro", verticals: VIA, fonte: "reservas + catálogo experiências", output: "Sugestão de add-on" },
      // Seguros
      { id: "2.12", name: "Cross-sell de Coberturas", desc: "Identifica coberturas adicionais relevantes pro perfil", status: "futuro", verticals: SEG, fonte: "apólice + perfil cliente", output: "Sugestão cobertura" },
      // Academia
      { id: "2.13", name: "Upgrade de Plano", desc: "Detecta alunos prontos para upgrade de plano", status: "futuro", verticals: ACA, fonte: "frequência + plano atual", output: "Sugestão upgrade" },
    ],
  },
  {
    key: "campanhas", label: "Campanhas & Marketing", emoji: "📢",
    skills: [
      { id: "3.1", name: "CPL por Plataforma", desc: "Comparativo de custo por lead entre canais", status: "precisa_dados", verticals: ALL, fonte: "ads_meta + ads_google + leads_sync", output: "CPL por canal" },
      { id: "3.2", name: "ROAS Real", desc: "Retorno real sobre investimento em ads", status: "precisa_dados", verticals: ALL, fonte: "ads (spend) + projetos (GANHO)", output: "ROAS por plataforma" },
      { id: "3.3", name: "Alerta Campanha Sem Leads", desc: "Campanha gastando sem gerar leads", status: "precisa_dados", verticals: ALL, fonte: "ads (spend > X AND leads = 0)", output: "⚠️ Alerta desperdício" },
      { id: "3.4", name: "Criativo Exausto", desc: "CTR caindo 3 dias seguidos", status: "precisa_dados", verticals: ALL, fonte: "ads_meta (CTR trend)", output: "⚠️ Trocar criativo" },
      { id: "3.5", name: "Público Saturado", desc: "Frequência alta indica público esgotado", status: "precisa_dados", verticals: ALL, fonte: "ads_meta (frequency > 5)", output: "⚠️ Expandir público" },
      { id: "3.6", name: "Canal Mais Eficiente", desc: "Identifica canal com melhor custo-benefício", status: "precisa_dados", verticals: ALL, fonte: "ads + leads_sync", output: "Recomendação budget" },
      { id: "3.7", name: "Volume de Busca (Market Intel)", desc: "Volume de buscas mensais por keyword", status: "criar", verticals: ALL, fonte: "Google Keyword Planner API", output: "Volume mensal" },
      { id: "3.8", name: "Benchmark CPC", desc: "CPC da empresa vs mercado", status: "criar", verticals: ALL, fonte: "Keyword Planner + ads_google", output: "CPC comparativo" },
      { id: "3.9", name: "Market Share Buscas", desc: "% das buscas que a empresa aparece", status: "precisa_dados", verticals: ALL, fonte: "Google Ads (impression_share)", output: "% market share" },
      { id: "3.10", name: "Sazonalidade", desc: "Identifica picos e vales de demanda no ano", status: "criar", verticals: ALL, fonte: "Keyword Planner (12 meses)", output: "Curva sazonal" },
    ],
  },
  {
    key: "site", label: "Site & Conversão", emoji: "🌐",
    skills: [
      { id: "4.1", name: "Taxa Conversão LP", desc: "% de visitantes que viram leads na landing page", status: "precisa_dados", verticals: ALL, fonte: "analytics_ga4_daily", output: "% conversão LP" },
      { id: "4.2", name: "Funil Site", desc: "Visualização de drop-off no site", status: "precisa_dados", verticals: ALL, fonte: "analytics_ga4_daily (eventos)", output: "Funil visualizado" },
      { id: "4.3", name: "Fonte × Conversão", desc: "Qual fonte de tráfego converte melhor", status: "precisa_dados", verticals: ALL, fonte: "analytics_ga4 GROUP BY source", output: "Conversão por fonte" },
      { id: "4.4", name: "Cidade × Lead", desc: "Distribuição geográfica do tráfego", status: "precisa_dados", verticals: ALL, fonte: "analytics_ga4 GROUP BY city", output: "Mapa geográfico" },
      { id: "4.5", name: "Device Performance", desc: "Performance mobile vs desktop", status: "precisa_dados", verticals: ALL, fonte: "analytics_ga4 GROUP BY device", output: "Insight responsividade" },
      { id: "4.6", name: "Horário Pico Site", desc: "Horários com mais tráfego no site", status: "precisa_dados", verticals: ALL, fonte: "analytics_ga4 GROUP BY hour", output: "Recomendação agendamento" },
      { id: "4.7", name: "Bounce Rate por Fonte", desc: "Taxa de rejeição por canal de origem", status: "precisa_dados", verticals: ALL, fonte: "analytics_ga4 (bounce_rate)", output: "Diagnóstico por fonte" },
      { id: "4.8", name: "Tempo no Site", desc: "Correlação entre tempo de visita e conversão", status: "precisa_dados", verticals: ALL, fonte: "analytics_ga4 (duration)", output: "Tempo × conversão" },
      { id: "4.9", name: "Página de Saída", desc: "Onde os visitantes abandonam o site", status: "precisa_dados", verticals: ALL, fonte: "analytics_ga4 (exit pages)", output: "Sugestão de UX" },
      { id: "4.10", name: "A/B Testing Sugestão", desc: "Comparativo de performance entre criativos", status: "precisa_dados", verticals: ALL, fonte: "analytics_ga4 + ads", output: "Recomendação A/B" },
    ],
  },
  {
    key: "financeiro", label: "Financeiro & ROI", emoji: "💰",
    skills: [
      { id: "5.1", name: "CAC Real", desc: "Custo de aquisição de cliente completo", status: "precisa_dados", verticals: ALL, fonte: "ads + custo_ia + fixos / ganhos", output: "CAC por contrato" },
      { id: "5.2", name: "Custo IA Total", desc: "Custo mensal do agente IA detalhado", status: "ativo", verticals: ALL, fonte: "leads_sync (SUM custo_total_usd)", output: "Custo mensal IA" },
      { id: "5.3", name: "Custo por Etapa do Funil", desc: "Quanto custa cada transição do funil", status: "precisa_dados", verticals: ALL, fonte: "ads + leads + projetos", output: "Custo por etapa" },
      { id: "5.4", name: "Ticket Médio Real", desc: "Valor médio dos contratos fechados", status: "precisa_dados", verticals: ALL, fonte: "projetos_sync WHERE GANHO", output: "Ticket médio" },
      { id: "5.5", name: "Payback de Campanha", desc: "Tempo para recuperar investimento em ads", status: "precisa_dados", verticals: ALL, fonte: "ads (spend) vs receita", output: "Dias para payback" },
      { id: "5.6", name: "Projeção Receita", desc: "Receita projetada baseada no pipeline", status: "precisa_dados", verticals: ALL, fonte: "leads × taxa × ticket", output: "Receita projetada" },
      { id: "5.7", name: "Margem por Projeto/Contrato", desc: "Margem de lucro por venda fechada", status: "precisa_dados", verticals: ALL, fonte: "projetos (valor - custo)", output: "% margem" },
      { id: "5.8", name: "Custo Operacional/Lead", desc: "Custo operacional total por lead", status: "criar", verticals: ALL, fonte: "custo_ia + Make + infra", output: "Custo unitário" },
      { id: "5.9", name: "LTV Estimado", desc: "Valor do cliente ao longo do tempo", status: "futuro", verticals: ALL, fonte: "projetos (valor × recorrência)", output: "LTV estimado" },
      { id: "5.10", name: "Alerta Budget", desc: "Alerta quando orçamento de ads está acabando", status: "precisa_dados", verticals: ALL, fonte: "ads (spend vs orçamento)", output: "⚠️ Alerta budget" },
      // Seguros
      { id: "5.11", name: "Sinistralidade por Carteira", desc: "Taxa de sinistro vs prêmio por perfil", status: "futuro", verticals: SEG, fonte: "apólices + sinistros", output: "Índice sinistralidade" },
      // Academia
      { id: "5.12", name: "Churn Prediction", desc: "Prevê cancelamentos baseado em frequência", status: "futuro", verticals: ACA, fonte: "check-ins + plano", output: "Risco de churn" },
      { id: "5.13", name: "Receita Recorrente (MRR)", desc: "Acompanha receita mensal recorrente", status: "futuro", verticals: ACA, fonte: "planos ativos × valor", output: "MRR atual + trend" },
    ],
  },
  {
    key: "operacional", label: "Operacional & Monitoramento", emoji: "⚙️",
    skills: [
      { id: "6.1", name: "Heartbeat Cenários", desc: "Monitora saúde de todos os cenários de automação", status: "ativo", verticals: ALL, fonte: "make_heartbeat", output: "Status cenários" },
      { id: "6.2", name: "Alerta DLQ", desc: "Detecta itens presos na Dead Letter Queue", status: "criar", verticals: ALL, fonte: "Make API (DLQ count)", output: "⚠️ Alerta DLQ" },
      { id: "6.3", name: "Consumo de Operações", desc: "Monitora consumo de ops vs budget do Make", status: "criar", verticals: ALL, fonte: "Make API (operations)", output: "Consumo ops" },
      { id: "6.4", name: "Sanitização Automática", desc: "Detecta e corrige dados inconsistentes", status: "ativo", verticals: ALL, fonte: "leads_sync (validação)", output: "Leads corrigidos" },
      { id: "6.5", name: "Sync Status", desc: "Status da última sincronização de dados", status: "ativo", verticals: ALL, fonte: "integration_runs", output: "Status sync" },
      { id: "6.6", name: "Token Expiration", desc: "Alerta quando tokens de API estão expirando", status: "criar", verticals: ALL, fonte: "auth + OAuth", output: "⚠️ Alerta expiração" },
      { id: "6.7", name: "Volume Make vs Budget", desc: "Cenários mais pesados e otimização", status: "criar", verticals: ALL, fonte: "Make API", output: "Otimização sugerida" },
      { id: "6.8", name: "Duplicata de Lead", desc: "Detecta leads duplicados entre canais", status: "criar", verticals: ALL, fonte: "leads_sync (telefone duplicado)", output: "Dedup necessário" },
      { id: "6.9", name: "FUP Esgotado Alert", desc: "Leads que receberam máximo de FUPs sem converter", status: "criar", verticals: ALL, fonte: "leads_sync (fup_count >= max)", output: "Sugestão desqualificar" },
      { id: "6.10", name: "Custo Infra por Lead", desc: "Custo de infraestrutura por lead processado", status: "criar", verticals: ALL, fonte: "Make ops + infra / leads", output: "Custo unitário" },
      { id: "6.11", name: "Relatórios Automáticos WhatsApp", desc: "Gera e envia relatórios programados (diário/semanal) via WhatsApp com dados reais + IA", status: "ativo", verticals: ALL, fonte: "report_templates + sol_leads_sync + campaign_metrics", output: "📊 Relatório WhatsApp" },
    ],
  },
  {
    key: "mercado", label: "Inteligência de Mercado", emoji: "📊",
    skills: [
      { id: "7.1", name: "Volume de Busca Mensal", desc: "Volume de buscas por keywords do segmento", status: "criar", verticals: ALL, fonte: "Google Keyword Planner API", output: "Volume mensal" },
      { id: "7.2", name: "CPC Benchmark", desc: "CPC da empresa vs média do mercado", status: "criar", verticals: ALL, fonte: "Google Keyword Planner", output: "CPC comparativo" },
      { id: "7.3", name: "Concorrência", desc: "Mapa de concorrentes e market share", status: "precisa_dados", verticals: ALL, fonte: "Google Ads Auction Insights", output: "Mapa concorrência" },
      { id: "7.4", name: "Sazonalidade", desc: "Curva de demanda ao longo do ano", status: "criar", verticals: ALL, fonte: "Keyword Planner (12 meses)", output: "Curva sazonal" },
      { id: "7.5", name: "Market Share Local", desc: "% das buscas relevantes que a empresa captura", status: "precisa_dados", verticals: ALL, fonte: "Google Ads (impression_share)", output: "% market share" },
      { id: "7.6", name: "Oportunidade de Budget", desc: "Impressões perdidas por falta de orçamento", status: "precisa_dados", verticals: ALL, fonte: "Google Ads (budget_lost)", output: "Recomendação invest." },
      { id: "7.7", name: "Ranking vs Concorrência", desc: "Impressões perdidas por ranking inferior", status: "precisa_dados", verticals: ALL, fonte: "Google Ads (rank_lost)", output: "Ação de otimização" },
      { id: "7.8", name: "Tendência do Setor", desc: "Tendência de interesse no segmento vs ano anterior", status: "criar", verticals: ALL, fonte: "Google Trends API", output: "Tendência anual" },
      { id: "7.9", name: "Preço Médio Mercado", desc: "Preço praticado vs concorrência na região", status: "futuro", verticals: ALL, fonte: "Web scraping / dados públicos", output: "Competitividade" },
      { id: "7.10", name: "Demanda Reprimida", desc: "Gap entre buscas totais e leads capturados", status: "futuro", verticals: ALL, fonte: "Keyword Planner + GA4", output: "TAM estimado" },
    ],
  },
  {
    key: "whatsapp", label: "WhatsApp & Comunicação", emoji: "💬",
    skills: [
      { id: "8.1", name: "Resumo Diário", desc: "WhatsApp diário com KPIs do dia anterior", status: "criar", verticals: ALL, fonte: "leads + metricas", output: "Resumo WhatsApp" },
      { id: "8.2", name: "Alerta Lead Qualificado", desc: "Notificação instantânea quando lead qualifica", status: "ativo", verticals: ALL, fonte: "Transfer Closer", output: "🎯 Notificação real-time" },
      { id: "8.3", name: "Insight Semanal", desc: "Report semanal com tendências e recomendações", status: "criar", verticals: ALL, fonte: "Todos os dados + ads", output: "Report semanal" },
      { id: "8.4", name: "Alerta Pipeline Parado", desc: "Leads qualificados parados sem proposta", status: "criar", verticals: ALL, fonte: "leads (qualificado > 7d)", output: "⏰ Alerta gestão" },
      { id: "8.5", name: "Alerta Campanha", desc: "CPL subiu ou campanha sem resultado", status: "precisa_dados", verticals: ALL, fonte: "ads_meta + ads_google", output: "⚠️ Alerta campanha" },
      { id: "8.6", name: "Report WhatsApp On-Demand", desc: "Vendedor pede relatório e IA responde com métricas", status: "futuro", verticals: ALL, fonte: "Todos os dados", output: "Report on-demand" },
      { id: "8.7", name: "Coach WhatsApp", desc: "IA analisa conversa e sugere abordagem em tempo real", status: "futuro", verticals: ALL, fonte: "leads (resumo_conversa)", output: "Sugestão de venda" },
      { id: "8.8", name: "Newsletter Automática", desc: "Email/WhatsApp periódico com conteúdo para leads frios", status: "ativo", verticals: ALL, fonte: "config + leads", output: "Comunicação automática" },
      { id: "8.9", name: "Notificação Contrato Fechado", desc: "Celebração no grupo quando fecha venda", status: "criar", verticals: ALL, fonte: "projetos (evento=won)", output: "🏆 WhatsApp equipe" },
      { id: "8.10", name: "Inbox Lovable", desc: "Feed de insights persistidos com marcar como lido", status: "criar", verticals: ALL, fonte: "sol_insights (Supabase)", output: "Feed de insights" },
    ],
  },
  {
    key: "equipe", label: "Equipe & Gestão", emoji: "👥",
    skills: [
      { id: "9.1", name: "Round-Robin Inteligente", desc: "Distribui leads igualmente entre vendedores ativos", status: "ativo", verticals: ALL, fonte: "equipe (ativo, leads_hoje)", output: "Distribuição balanceada" },
      { id: "9.2", name: "Golden Hour Routing", desc: "Roteia pro vendedor no pico de performance", status: "precisa_dados", verticals: ALL, fonte: "equipe (horario_pico) + hora", output: "Roteamento dinâmico" },
      { id: "9.3", name: "Sobrecarga Alert", desc: "Alerta quando vendedor está com muitos leads no dia", status: "criar", verticals: ALL, fonte: "leads GROUP BY vendedor", output: "⚠️ Alerta sobrecarga" },
      { id: "9.4", name: "Performance Semanal", desc: "Ranking de performance por vendedor", status: "precisa_dados", verticals: ALL, fonte: "leads + projetos GROUP BY vendedor", output: "Ranking semanal" },
      { id: "9.5", name: "Meta vs Realizado", desc: "Gap entre meta e resultado atual", status: "precisa_dados", verticals: ALL, fonte: "equipe (meta) vs projetos (GANHO)", output: "% da meta" },
      { id: "9.6", name: "Ativar/Desativar Vendedor", desc: "Toggle para ativar/desativar recebimento de leads", status: "ativo", verticals: ALL, fonte: "equipe_sync (ativo toggle)", output: "Toggle instantâneo" },
      { id: "9.7", name: "Treinamento Sugerido", desc: "Identifica gaps de performance e sugere treinamento", status: "futuro", verticals: ALL, fonte: "leads (motivo perda por vendedor)", output: "Sugestão treinamento" },
      { id: "9.8", name: "Horário Produtivo", desc: "Mapeia horários mais produtivos de cada vendedor", status: "precisa_dados", verticals: ALL, fonte: "leads (ts por vendedor)", output: "Mapa produtividade" },
      { id: "9.9", name: "Férias/Ausência", desc: "Redireciona leads automaticamente quando alguém sai", status: "ativo", verticals: ALL, fonte: "equipe (ativo toggle)", output: "Redistribuição auto" },
      { id: "9.10", name: "NPS Lead/Cliente", desc: "Score de satisfação por vendedor", status: "futuro", verticals: ALL, fonte: "pesquisa pós-atendimento", output: "NPS por vendedor" },
    ],
  },
  {
    key: "pos-venda", label: "Pós-Venda", emoji: "🔄",
    skills: [
      // Solar
      { id: "10.1", name: "Tracking Homologação", desc: "Acompanha etapas pós-venda: projeto → aprovação → instalação → homologação", status: "criar", verticals: SOL, fonte: "sol_projetos_sync (etapas pós-venda)", output: "Status por etapa" },
      { id: "10.2", name: "Alerta Instalação", desc: "Notifica equipe técnica e cliente sobre instalações pendentes na semana", status: "criar", verticals: SOL, fonte: "sol_projetos_sync (etapa=instalacao)", output: "Agenda instalação" },
      { id: "10.3", name: "Geração Monitoramento", desc: "Monitora geração do sistema solar instalado vs projetado", status: "futuro", verticals: SOL, fonte: "Integração inversor", output: "% geração vs esperado" },
      // Universal pós-venda
      { id: "10.4", name: "Tempo por Etapa Pós-Venda", desc: "SLA de cada etapa do pós-venda", status: "precisa_dados", verticals: ALL, fonte: "projetos (ts_evento por etapa)", output: "SLA pós-venda" },
      { id: "10.5", name: "Indicação Automática", desc: "Pede indicação para clientes satisfeitos", status: "futuro", verticals: ALL, fonte: "projetos (GANHO > X meses)", output: "Solicitação indicação" },
      { id: "10.6", name: "Review Google", desc: "Pede review no Google pós-entrega", status: "futuro", verticals: ALL, fonte: "Pós-entrega", output: "Solicitação review" },
      { id: "10.7", name: "Upsell Automático", desc: "Detecta oportunidade de upsell em cliente existente", status: "futuro", verticals: ALL, fonte: "projetos + comportamento", output: "Sugestão upsell" },
      // Viagens
      { id: "10.8", name: "Feedback Pós-Viagem", desc: "Pesquisa de satisfação automática após retorno", status: "futuro", verticals: VIA, fonte: "reservas (data_retorno)", output: "NPS + feedback" },
      { id: "10.9", name: "Próxima Viagem Sugerida", desc: "IA sugere próximo destino baseado no histórico", status: "futuro", verticals: VIA, fonte: "histórico + perfil", output: "Sugestão destino" },
      // Seguros
      { id: "10.10", name: "Renovação Automática", desc: "Alerta e processo de renovação de apólice", status: "futuro", verticals: SEG, fonte: "apólices (vencimento)", output: "Alerta renovação" },
      // Academia
      { id: "10.11", name: "Reativação de Alunos", desc: "Campanha automática para alunos que cancelaram", status: "futuro", verticals: ACA, fonte: "cancelamentos + perfil", output: "Campanha reativação" },
      { id: "10.12", name: "Aniversário / Marcos", desc: "Mensagem comemorativa em marcos do aluno", status: "futuro", verticals: ACA, fonte: "cadastro + check-ins", output: "Mensagem personalizada" },
    ],
  },
];
