export type SkillStatus = "ativo" | "precisa_dados" | "criar" | "futuro";

export interface Skill {
  id: string;
  name: string;
  desc: string;
  status: SkillStatus;
  fonte?: string;
  output?: string;
}

export interface SkillCategory {
  key: string;
  label: string;
  emoji: string;
  skills: Skill[];
}

export const statusConfig: Record<SkillStatus, { label: string; className: string }> = {
  ativo: { label: "✅ Ativo", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  precisa_dados: { label: "⏳ Precisa Dados", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  criar: { label: "🔨 Criar", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  futuro: { label: "🔮 Futuro", className: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
};

export const skillCategories: SkillCategory[] = [
  {
    key: "pre-venda", label: "Pré-Venda", emoji: "🎯",
    skills: [
      { id: "1.1", name: "Qualificação Automática (ICP Score)", desc: "Score 0-100 + temperatura FRIO/MORNO/QUENTE", status: "ativo", fonte: "sol_leads_sync (valor_conta, tipo_imovel, cidade, prazo)", output: "Score 0-100 + temperatura" },
      { id: "1.2", name: "Rankeamento Golden Hour", desc: "Transfer roteia pro closer no pico de performance", status: "precisa_dados", fonte: "sol_projetos_sync (GANHO × hora × dia × closer)", output: "Vitória fecha 3x mais terça 9-11h" },
      { id: "1.3", name: "Detector de Lead Dormentes", desc: "Alerta WhatsApp para leads inativos >48h", status: "criar", fonte: "sol_leads_sync (ts_ultima_interacao > 48h)", output: "⚠️ Rafa parado há 2 dias" },
      { id: "1.4", name: "Análise Canal × Conversão", desc: "CPL e taxa de conversão por canal de origem", status: "precisa_dados", fonte: "sol_leads_sync + ads_meta/google", output: "Meta qualifica 35%, Google 22%" },
      { id: "1.5", name: "Gerador de Script por Persona", desc: "Adapta prompt do Agent por perfil: residencial vs comercial vs rural", status: "criar", fonte: "sol_config_sync + sol_qualificacao_sync", output: "Prompt adaptado por persona" },
      { id: "1.6", name: "SLA Primeiro Contato", desc: "SOL responde em 2 min. SLA cumprido em 95% dos leads", status: "criar", fonte: "sol_leads_sync (ts_cadastro vs ts_primeira_msg)", output: "SLA cumprido em 95%" },
      { id: "1.7", name: "Resgate FUP Inteligente", desc: "FUP resgatou 3 leads frios. Taxa resgate: 8%", status: "ativo", fonte: "sol_leads_sync (fup_count, status, temperatura)", output: "Taxa resgate: 8%" },
      { id: "1.8", name: "Custo IA por Qualificação", desc: "Custo IA por lead qualificado: $0.42", status: "ativo", fonte: "sol_leads_sync (custo_total_usd WHERE QUALIFICADO)", output: "Custo IA: $0.42/lead" },
      { id: "1.9", name: "Horário Pico de Resposta", desc: "Leads respondem mais entre 9h-11h → FUP ajusta horário", status: "criar", fonte: "sol_leads_sync (hora de ts_ultima_interacao)", output: "FUP ajusta horário automaticamente" },
      { id: "1.10", name: "OCR Conta de Luz", desc: "GPT-4 Vision extrai valor real da foto da conta de luz", status: "ativo", fonte: "sol_leads_sync (valor_conta_confirmado_ocr)", output: "Valor real extraído da foto" },
    ],
  },
  {
    key: "comercial", label: "Comercial", emoji: "💼",
    skills: [
      { id: "2.1", name: "Distribuição Inteligente (Golden Hour)", desc: "Transfer roteia lead pro closer no pico dele", status: "precisa_dados", fonte: "sol_equipe_sync + sol_leads_sync", output: "Roteamento por horário pico" },
      { id: "2.2", name: "Forecast Pipeline", desc: "Pipeline previsto: R$85k nos próximos 30 dias", status: "precisa_dados", fonte: "sol_leads_sync × taxa_historica × valor_medio", output: "Previsão de receita 30 dias" },
      { id: "2.3", name: "Alerta Lead Parado", desc: "WhatsApp closer: lead qualificada há 7 dias sem proposta", status: "criar", fonte: "sol_leads_sync (QUALIFICADO sem interação > 7d)", output: "Alerta WhatsApp para closer" },
      { id: "2.4", name: "Sugestão Próxima Ação", desc: "GPT sugere ação baseada no contexto do lead", status: "criar", fonte: "sol_leads_sync (status, etapa_funil, ts)", output: "Ligar amanhã 9h, preferiu WA" },
      { id: "2.5", name: "Análise Motivo Perda", desc: "60% das perdas são por preço → oferecer financiamento", status: "precisa_dados", fonte: "sol_projetos_sync (evento=lost, motivo_perda)", output: "Insight de motivo de perda" },
      { id: "2.6", name: "Ranking Performance Closers", desc: "Vitória: 30% conversão, Danieli: 25%", status: "precisa_dados", fonte: "sol_leads_sync GROUP BY closer_nome", output: "Ranking de conversão" },
      { id: "2.7", name: "Coach de Vendas", desc: "GPT analisa conversas perdidas e sugere melhorias", status: "futuro", fonte: "sol_leads_sync + sol_projetos_sync", output: "Sugestão de abordagem" },
      { id: "2.8", name: "Gerador de Proposta", desc: "Gera proposta automática baseada no perfil do lead", status: "futuro", fonte: "sol_leads_sync + SM API", output: "Proposta gerada" },
      { id: "2.9", name: "Alerta Risco de Perda", desc: "WhatsApp diretoria: 3 leads em risco de perda", status: "criar", fonte: "sol_leads_sync (QUALIFICADO > 21d sem proposta)", output: "🔴 Alerta diretoria" },
      { id: "2.10", name: "Comissão Automática", desc: "Calcula comissão por closer automaticamente", status: "precisa_dados", fonte: "sol_projetos_sync × sol_equipe_sync", output: "Comissão calculada" },
    ],
  },
  {
    key: "campanhas", label: "Campanhas & Marketing", emoji: "📢",
    skills: [
      { id: "3.1", name: "CPL por Plataforma", desc: "Meta CPL R$30, Google CPL R$18. Google 40% mais barato", status: "precisa_dados", fonte: "ads_meta + ads_google + sol_leads_sync", output: "CPL comparativo" },
      { id: "3.2", name: "ROAS Real", desc: "ROAS Meta: 8.5x, Google: 4.2x", status: "precisa_dados", fonte: "ads (spend) + sol_projetos_sync (GANHO)", output: "ROAS por plataforma" },
      { id: "3.3", name: "Alerta Campanha Sem Leads", desc: "Campanha gastou R$200 sem gerar lead", status: "precisa_dados", fonte: "ads (spend > R$100 AND leads = 0)", output: "⚠️ Alerta WhatsApp" },
      { id: "3.4", name: "Criativo Exausto", desc: "CTR caindo 3 dias seguidos → trocar criativo", status: "precisa_dados", fonte: "ads_meta (CTR trend)", output: "⚠️ Alerta troca criativo" },
      { id: "3.5", name: "Público Saturado", desc: "Frequência > 5 → expandir segmentação", status: "precisa_dados", fonte: "ads_meta (frequency)", output: "⚠️ Alerta saturação" },
      { id: "3.6", name: "Canal Mais Eficiente", desc: "Meta gera qualificado por R$35, Google por R$65", status: "precisa_dados", fonte: "ads + sol_leads", output: "Recomendação de budget" },
      { id: "3.7", name: "Volume de Busca (Market Intel)", desc: "'energia solar olímpia': 320 buscas/mês", status: "criar", fonte: "Google Keyword Planner API", output: "Volume mensal" },
      { id: "3.8", name: "Benchmark CPC", desc: "CPC mercado: R$3.50, Evolve paga R$1.67. ✅ 52% abaixo", status: "criar", fonte: "Keyword Planner + ads_google", output: "CPC vs mercado" },
      { id: "3.9", name: "Market Share Buscas", desc: "Evolve aparece em 45% das buscas relevantes", status: "precisa_dados", fonte: "Google Ads (search_impression_share)", output: "% de market share" },
      { id: "3.10", name: "Sazonalidade", desc: "Pico de buscas Jan-Mar. Aumentar budget 50% no verão", status: "criar", fonte: "Google Keyword Planner (12 meses)", output: "Recomendação sazonal" },
    ],
  },
  {
    key: "site", label: "Site & Conversão", emoji: "🌐",
    skills: [
      { id: "4.1", name: "Taxa Conversão LP", desc: "LP converte 4.7%. Acima da média do mercado (3%)", status: "precisa_dados", fonte: "analytics_ga4_daily", output: "% conversão LP" },
      { id: "4.2", name: "Funil Site", desc: "45% scrollam, 12% iniciam form, 4.7% enviam", status: "precisa_dados", fonte: "analytics_ga4_daily (eventos)", output: "Funil visualizado" },
      { id: "4.3", name: "Fonte × Conversão", desc: "google/cpc converte 6%, facebook/paid converte 3%", status: "precisa_dados", fonte: "analytics_ga4_daily GROUP BY source_medium", output: "Conversão por fonte" },
      { id: "4.4", name: "Cidade × Lead", desc: "Olímpia: 45% do tráfego, Barretos: 12%", status: "precisa_dados", fonte: "analytics_ga4_daily GROUP BY city", output: "Distribuição geográfica" },
      { id: "4.5", name: "Device Performance", desc: "85% mobile. LP otimizada pra mobile?", status: "precisa_dados", fonte: "analytics_ga4_daily GROUP BY device_category", output: "Insight responsividade" },
      { id: "4.6", name: "Horário Pico Site", desc: "Pico: 10h-12h e 19h-21h. Agendar anúncios nesses horários", status: "precisa_dados", fonte: "analytics_ga4_daily GROUP BY hour", output: "Recomendação agendamento" },
      { id: "4.7", name: "Bounce Rate por Fonte", desc: "Bounce Google: 35%, Meta: 55%. Criativos desalinhados", status: "precisa_dados", fonte: "analytics_ga4_daily (bounce_rate)", output: "Diagnóstico por fonte" },
      { id: "4.8", name: "Tempo no Site", desc: "Leads que convertem ficam 4min15s. Mais tempo = mais conversão", status: "precisa_dados", fonte: "analytics_ga4_daily (avg_session_duration)", output: "Correlação tempo × conversão" },
      { id: "4.9", name: "Página de Saída", desc: "50% saem na LP sem ver preços. Adicionar investimento", status: "precisa_dados", fonte: "analytics_ga4_daily (exit pages)", output: "Sugestão de UX" },
      { id: "4.10", name: "A/B Testing Sugestão", desc: "Criativo A: CTR 2.8%, Criativo B: 1.2%. Pausar B", status: "precisa_dados", fonte: "analytics_ga4 + ads_meta", output: "Recomendação A/B" },
    ],
  },
  {
    key: "financeiro", label: "Financeiro & ROI", emoji: "💰",
    skills: [
      { id: "5.1", name: "CAC Real", desc: "CAC: R$2.800 por contrato. Meta saudável: < R$3.500", status: "precisa_dados", fonte: "ads (spend) + sol_leads (custo_ia) + fixos / ganhos", output: "CAC por contrato" },
      { id: "5.2", name: "Custo IA Total", desc: "Custo IA março: $45 (~R$225). OpenAI: $40, ElevenLabs: $5", status: "ativo", fonte: "sol_leads_sync (SUM custo_total_usd)", output: "Custo mensal IA" },
      { id: "5.3", name: "Custo por Etapa do Funil", desc: "Impressão→Lead: R$18. Lead→Qualificado: R$60+$0.42 IA", status: "precisa_dados", fonte: "ads + sol_leads + sol_projetos", output: "Custo por etapa" },
      { id: "5.4", name: "Ticket Médio Real", desc: "Ticket médio: R$18.500. Acima do mercado (R$15k)", status: "precisa_dados", fonte: "sol_projetos_sync WHERE GANHO", output: "Ticket médio" },
      { id: "5.5", name: "Payback de Campanha", desc: "Google Ads: payback em 45 dias. Meta: 60 dias", status: "precisa_dados", fonte: "ads (spend acumulado) vs receita", output: "Dias para payback" },
      { id: "5.6", name: "Projeção Receita", desc: "3 qualificados × 30% × R$18.5k = R$16.6k previsto", status: "precisa_dados", fonte: "sol_leads × taxa × ticket", output: "Receita projetada" },
      { id: "5.7", name: "Margem por Projeto", desc: "Margem média: 35%. Projeto Cristiana: 42% (à vista)", status: "precisa_dados", fonte: "sol_projetos (valor - custo)", output: "% margem" },
      { id: "5.8", name: "Custo Operacional/Lead", desc: "R$4.50 por lead (IA $0.33 + Make $0.15 + Krolik $0.02)", status: "criar", fonte: "sol_leads + Make ops + Krolik", output: "Custo operacional" },
      { id: "5.9", name: "LTV Estimado", desc: "LTV: R$18.5k (instalação) + R$500/ano (manutenção)", status: "futuro", fonte: "sol_projetos (valor × recorrência)", output: "LTV estimado" },
      { id: "5.10", name: "Alerta Budget", desc: "Google Ads gastou 85% do orçamento em 20 dias", status: "precisa_dados", fonte: "ads (spend vs orçamento)", output: "⚠️ Alerta budget" },
    ],
  },
  {
    key: "operacional", label: "Operacional & Monitoramento", emoji: "⚙️",
    skills: [
      { id: "6.1", name: "Heartbeat Cenários", desc: "15 cenários OK. 1 erro: Google Offline Conversions", status: "ativo", fonte: "make_heartbeat", output: "Status de cenários" },
      { id: "6.2", name: "Alerta DLQ", desc: "CAPI Meta: 1 item na DLQ. Investigar", status: "criar", fonte: "Make API (DLQ count)", output: "⚠️ Alerta DLQ" },
      { id: "6.3", name: "Consumo de Operações", desc: "Março: 6.500 ops. Budget: 10.000. Sobra: 3.500", status: "criar", fonte: "Make API (operations)", output: "Consumo ops" },
      { id: "6.4", name: "Sanitização Automática", desc: "3 leads com dados inválidos. Limpeza sugerida", status: "ativo", fonte: "sol_leads_sync (validação)", output: "Leads com dados inválidos" },
      { id: "6.5", name: "Sync Status", desc: "Última sync: há 3 min. 0 erros. 15 leads sincronizados", status: "ativo", fonte: "integration_runs", output: "Status da sincronização" },
      { id: "6.6", name: "Token Expiration", desc: "Token Meta expira em 58 dias (29/05). Renovar", status: "criar", fonte: "sol_auth + Meta OAuth", output: "⚠️ Alerta expiração" },
      { id: "6.7", name: "Volume Make vs Budget", desc: "Cenário Agent WhatsApp: 809 ops (mais pesado)", status: "criar", fonte: "Make API", output: "Otimização sugerida" },
      { id: "6.8", name: "Duplicata de Lead", desc: "Lead entrou por Meta E Google. Dedup necessário", status: "criar", fonte: "sol_leads_sync (telefone duplicado)", output: "Leads duplicados" },
      { id: "6.9", name: "FUP Esgotado Alert", desc: "12 leads receberam 9 FUPs sem converter. Desqualificar?", status: "criar", fonte: "sol_leads_sync (fup_count >= 9)", output: "Sugestão desqualificar" },
      { id: "6.10", name: "Custo Make por Lead", desc: "Custo Make por lead: R$0.15", status: "criar", fonte: "Make API (ops × preço) / leads", output: "Custo unitário Make" },
    ],
  },
  {
    key: "mercado", label: "Inteligência de Mercado", emoji: "📊",
    skills: [
      { id: "7.1", name: "Volume de Busca Mensal", desc: "energia solar olímpia: 320/mês", status: "criar", fonte: "Google Keyword Planner API", output: "Volume mensal" },
      { id: "7.2", name: "CPC Benchmark", desc: "CPC mercado: R$3.50. Evolve: R$1.67. ✅ 52% abaixo", status: "criar", fonte: "Google Keyword Planner", output: "CPC comparativo" },
      { id: "7.3", name: "Concorrência", desc: "15 anunciantes. Top: Concorrente A (60% share)", status: "precisa_dados", fonte: "Google Ads Auction Insights", output: "Mapa concorrência" },
      { id: "7.4", name: "Sazonalidade", desc: "Pico Jan-Mar (verão, conta alta). Aumentar budget 50%", status: "criar", fonte: "Google Keyword Planner (12 meses)", output: "Curva sazonal" },
      { id: "7.5", name: "Market Share Local", desc: "Evolve: 45% das buscas. +R$50/dia capturaria 75%", status: "precisa_dados", fonte: "Google Ads (search_impression_share)", output: "% market share" },
      { id: "7.6", name: "Oportunidade de Budget", desc: "Perdeu 30% das impressões por orçamento", status: "precisa_dados", fonte: "Google Ads (budget_lost_share)", output: "Recomendação invest." },
      { id: "7.7", name: "Ranking vs Concorrência", desc: "Perdeu 25% por ranking. Melhorar Quality Score", status: "precisa_dados", fonte: "Google Ads (rank_lost_share)", output: "Ação de otimização" },
      { id: "7.8", name: "Tendência do Setor", desc: "Interesse em energia solar subiu 15% vs ano passado", status: "criar", fonte: "Google Trends API", output: "Tendência anual" },
      { id: "7.9", name: "Preço Médio kWp Região", desc: "Preço médio kWp Olímpia: R$4.200. Evolve: R$4.000", status: "futuro", fonte: "Web scraping / dados públicos", output: "Competitividade" },
      { id: "7.10", name: "Demanda Reprimida", desc: "5.000 buscas/mês. Evolve captura 320. Oportunidade: 4.680", status: "futuro", fonte: "Keyword Planner + GA4", output: "TAM estimado" },
    ],
  },
  {
    key: "whatsapp", label: "WhatsApp & Comunicação", emoji: "💬",
    skills: [
      { id: "8.1", name: "Resumo Diário", desc: "WhatsApp 8h: funil, custos, equipe", status: "criar", fonte: "sol_leads + sol_metricas", output: "Resumo WhatsApp diário" },
      { id: "8.2", name: "Alerta Lead Qualificado", desc: "WhatsApp real-time: lead qualificado → closer", status: "ativo", fonte: "Transfer Closer", output: "🎯 Notificação instantânea" },
      { id: "8.3", name: "Insight Semanal", desc: "WhatsApp seg 7h: golden hour, tendências, recomendações", status: "criar", fonte: "Todos os DSes + ads", output: "Report semanal" },
      { id: "8.4", name: "Alerta Pipeline Parado", desc: "3 leads sem proposta há 7+ dias", status: "criar", fonte: "sol_leads (QUALIFICADO > 7d)", output: "⏰ Alerta gestão" },
      { id: "8.5", name: "Alerta Campanha", desc: "CPL subiu 40% ontem. Verificar criativos", status: "precisa_dados", fonte: "ads_meta + ads_google", output: "⚠️ Alerta campanha" },
      { id: "8.6", name: "Report WhatsApp On-Demand", desc: "Closer manda 'relatório' → SOL responde com métricas", status: "futuro", fonte: "Todos os DSes", output: "Report on-demand" },
      { id: "8.7", name: "Coach WhatsApp", desc: "SOL analisa conversa e sugere abordagem", status: "futuro", fonte: "sol_leads (resumo_conversa)", output: "Sugestão de venda" },
      { id: "8.8", name: "Newsletter Automática", desc: "Email semanal com conteúdo solar pra leads frios", status: "ativo", fonte: "sol_config + sol_leads", output: "Email automático" },
      { id: "8.9", name: "Notificação Contrato Fechado", desc: "🏆 CONTRATO FECHADO! Vitória - R$18.5k", status: "criar", fonte: "sol_projetos (evento=won)", output: "WhatsApp equipe" },
      { id: "8.10", name: "Inbox Lovable", desc: "Feed de insights persistidos no Lovable, com marcar lido", status: "criar", fonte: "sol_insights (Supabase)", output: "Feed de insights" },
    ],
  },
  {
    key: "equipe", label: "Equipe & Gestão", emoji: "👥",
    skills: [
      { id: "9.1", name: "Round-Robin Inteligente", desc: "Distribui leads igualmente entre closers ativos", status: "ativo", fonte: "sol_equipe (krolik_ativo, leads_hoje)", output: "Distribuição balanceada" },
      { id: "9.2", name: "Golden Hour Routing", desc: "Roteia pro closer no pico se lead chegar nesse horário", status: "precisa_dados", fonte: "sol_equipe (horario_pico) + hora atual", output: "Roteamento dinâmico" },
      { id: "9.3", name: "Sobrecarga Alert", desc: "Vitória com 6 leads hoje. Ativar Devisson?", status: "criar", fonte: "sol_leads GROUP BY closer", output: "⚠️ Alerta sobrecarga" },
      { id: "9.4", name: "Performance Semanal", desc: "Ranking: 1º Vitória (30%), 2º Danieli (25%)", status: "precisa_dados", fonte: "sol_leads + sol_projetos GROUP BY closer", output: "Ranking semanal" },
      { id: "9.5", name: "Meta vs Realizado", desc: "Vitória: 65% da meta. Faltam R$12k em 10 dias", status: "precisa_dados", fonte: "sol_equipe (meta) vs sol_projetos (GANHO)", output: "Gap da meta" },
      { id: "9.6", name: "Ativar/Desativar Closer", desc: "Admin ativa Devisson → próximo lead vai pra ele", status: "ativo", fonte: "sol_equipe_sync (krolik_ativo toggle)", output: "Toggle instantâneo" },
      { id: "9.7", name: "Treinamento Sugerido", desc: "Danieli: 40% perda por preço. Treinamento em objeções", status: "futuro", fonte: "sol_leads (motivo por closer)", output: "Sugestão treinamento" },
      { id: "9.8", name: "Horário Produtivo", desc: "Vitória mais produtiva 9h-12h. Danieli 14h-17h", status: "precisa_dados", fonte: "sol_leads (ts por closer)", output: "Mapa produtividade" },
      { id: "9.9", name: "Férias/Ausência", desc: "Vitória sai de férias → leads redirecionados pra Danieli", status: "ativo", fonte: "sol_equipe (ativo toggle)", output: "Redistribuição auto" },
      { id: "9.10", name: "NPS Lead", desc: "NPS closer Vitória: 85. Danieli: 72", status: "futuro", fonte: "sol_leads (pesquisa pós-atendimento)", output: "NPS por closer" },
    ],
  },
  {
    key: "pos-venda", label: "Pós-Venda Solar", emoji: "☀️",
    skills: [
      { id: "10.1", name: "Tracking Homologação", desc: "Projeto Cristiana: aguardando vistoria há 5 dias", status: "precisa_dados", fonte: "sol_projetos (etapas pós-venda SM)", output: "Status homologação" },
      { id: "10.2", name: "Alerta Instalação", desc: "3 instalações pendentes esta semana", status: "precisa_dados", fonte: "sol_projetos (etapa=agendar_instalacao)", output: "Agenda instalação" },
      { id: "10.3", name: "Tempo por Etapa Pós-Venda", desc: "Contrato→Instalação: 22 dias. Meta: 15 dias", status: "precisa_dados", fonte: "sol_projetos (ts_evento por etapa)", output: "SLA pós-venda" },
      { id: "10.4", name: "Geração Monitoramento", desc: "Sistema gerando 85% do esperado. Normal", status: "futuro", fonte: "Integração com inversor", output: "% geração vs esperado" },
      { id: "10.5", name: "Primeira Fatura Alert", desc: "WhatsApp cliente: sua primeira conta com solar chegou!", status: "futuro", fonte: "sol_projetos (etapa=envio_fatura)", output: "Notificação cliente" },
      { id: "10.6", name: "Manutenção Preventiva", desc: "5 clientes completam 1 ano. Agendar limpeza de painéis", status: "futuro", fonte: "Calendário (12 meses)", output: "Agenda manutenção" },
      { id: "10.7", name: "Upsell Identificador", desc: "Consumo subiu 30%. Oferecer ampliação do sistema", status: "futuro", fonte: "sol_projetos (consumo vs projetado)", output: "Oportunidade upsell" },
      { id: "10.8", name: "Indicação Automática", desc: "6 meses de economia comprovada. Pedir indicação", status: "futuro", fonte: "sol_projetos (GANHO > 6 meses)", output: "Solicitação de indicação" },
      { id: "10.9", name: "Garantia Tracker", desc: "2 clientes com garantia expirando em 30 dias", status: "precisa_dados", fonte: "sol_funis (etapa=garantia)", output: "Alerta garantia" },
      { id: "10.10", name: "Review Google", desc: "Pedir review no Google pra cliente satisfeito", status: "futuro", fonte: "Pós-instalação", output: "Solicitação de review" },
    ],
  },
];
