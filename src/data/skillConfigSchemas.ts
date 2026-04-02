/**
 * Generic config schema for each skill.
 * Each skill that has configurable parameters declares its fields here.
 * The SkillConfigPanel component renders the form dynamically.
 */

export type FieldType = "number" | "text" | "select" | "slider" | "toggle" | "textarea" | "phone";

export interface ConfigField {
  key: string;
  label: string;
  emoji?: string;
  type: FieldType;
  defaultValue: string | number | boolean;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { label: string; value: string }[];
  placeholder?: string;
}

export interface SkillConfigSchema {
  skillId: string;
  title: string;
  description?: string;
  fields: ConfigField[];
}

export const skillConfigSchemas: Record<string, SkillConfigSchema> = {
  // ─── PRÉ-VENDA ───
  "1.1": {
    skillId: "1.1",
    title: "Qualificação Automática (ICP Score)",
    description: "Pesos dos critérios de qualificação e faixas de temperatura",
    fields: [
      { key: "peso_valor_conta", label: "Peso — Valor da Conta", emoji: "⚡", type: "slider", defaultValue: 30, min: 0, max: 50, step: 5, unit: "%" },
      { key: "peso_cidade", label: "Peso — Cidade/Região", emoji: "📍", type: "slider", defaultValue: 15, min: 0, max: 50, step: 5, unit: "%" },
      { key: "peso_tipo_imovel", label: "Peso — Tipo Imóvel", emoji: "🏠", type: "slider", defaultValue: 15, min: 0, max: 50, step: 5, unit: "%" },
      { key: "peso_canal_origem", label: "Peso — Canal de Origem", emoji: "📢", type: "slider", defaultValue: 10, min: 0, max: 50, step: 5, unit: "%" },
      { key: "peso_tempo_resposta", label: "Peso — Tempo de Resposta", emoji: "⏱️", type: "slider", defaultValue: 15, min: 0, max: 50, step: 5, unit: "%" },
      { key: "peso_completude", label: "Peso — Completude Dados", emoji: "📋", type: "slider", defaultValue: 15, min: 0, max: 50, step: 5, unit: "%" },
      { key: "threshold_quente", label: "Score mínimo — Quente 🔥", emoji: "🔥", type: "number", defaultValue: 80, min: 0, max: 100, description: "Score ≥ este valor = lead quente" },
      { key: "threshold_morno", label: "Score mínimo — Morno 🌤️", emoji: "🌤️", type: "number", defaultValue: 50, min: 0, max: 100, description: "Score ≥ este valor = lead morno" },
      { key: "acao_quente", label: "Ação — Lead Quente", type: "text", defaultValue: "Transferir imediatamente ao closer", placeholder: "Ex: Transferir ao closer" },
      { key: "acao_morno", label: "Ação — Lead Morno", type: "text", defaultValue: "Continuar qualificação via IA", placeholder: "Ex: Continuar qualificação" },
      { key: "acao_frio", label: "Ação — Lead Frio", type: "text", defaultValue: "Nutrir com follow-up automático", placeholder: "Ex: Follow-up automático" },
    ],
  },

  "golden-hour": {
    skillId: "golden-hour",
    title: "Golden Hour (Tempo de Resposta)",
    description: "Tempo máximo para primeiro contato com lead novo",
    fields: [
      { key: "tempo_limite_min", label: "Tempo limite", emoji: "⏰", type: "number", defaultValue: 5, min: 1, max: 60, unit: "minutos", description: "Tempo máximo até o primeiro contato" },
      { key: "alerta_canal", label: "Canal do alerta", type: "select", defaultValue: "whatsapp", options: [{ label: "WhatsApp", value: "whatsapp" }, { label: "Inbox Lovable", value: "inbox" }, { label: "Ambos", value: "ambos" }] },
      { key: "alerta_para", label: "Alertar quem", type: "select", defaultValue: "gestor", options: [{ label: "Gestor", value: "gestor" }, { label: "Vendedor atribuído", value: "vendedor" }, { label: "Ambos", value: "ambos" }] },
      { key: "telefone_alerta", label: "Telefone para alerta", emoji: "📱", type: "phone", defaultValue: "", placeholder: "5511999999999" },
    ],
  },

  "1.3": {
    skillId: "1.3",
    title: "Detector de Leads Dormentes",
    description: "Identifica leads sem interação e dispara alerta",
    fields: [
      { key: "horas_inatividade", label: "Tempo de inatividade", emoji: "😴", type: "number", defaultValue: 48, min: 12, max: 168, unit: "horas", description: "Lead sem interação por este período" },
      { key: "canal_alerta", label: "Canal do alerta", type: "select", defaultValue: "whatsapp", options: [{ label: "WhatsApp", value: "whatsapp" }, { label: "Inbox", value: "inbox" }, { label: "Ambos", value: "ambos" }] },
      { key: "telefone_alerta", label: "Telefone destino", emoji: "📱", type: "phone", defaultValue: "", placeholder: "5511999999999" },
      { key: "incluir_nome_lead", label: "Incluir nome do lead no alerta", type: "toggle", defaultValue: true },
    ],
  },

  "1.5": {
    skillId: "1.5",
    title: "Gerador de Script por Persona",
    description: "Adapta o prompt do Agente IA por perfil do lead",
    fields: [
      { key: "prompt_residencial", label: "Prompt — Residencial", emoji: "🏠", type: "textarea", defaultValue: "Foque em economia na conta de luz e retorno do investimento.", placeholder: "Instruções para persona residencial..." },
      { key: "prompt_comercial", label: "Prompt — Comercial", emoji: "🏢", type: "textarea", defaultValue: "Destaque ROI rápido, isenção fiscal e valorização do imóvel.", placeholder: "Instruções para persona comercial..." },
      { key: "prompt_rural", label: "Prompt — Rural/Agro", emoji: "🌾", type: "textarea", defaultValue: "Enfatize irrigação solar e economia operacional.", placeholder: "Instruções para persona rural..." },
    ],
  },

  "1.6": {
    skillId: "1.6",
    title: "SLA Primeiro Contato",
    description: "Meta de tempo para primeira resposta do agente IA",
    fields: [
      { key: "sla_segundos", label: "SLA de resposta", emoji: "⏱️", type: "number", defaultValue: 30, min: 5, max: 300, unit: "segundos", description: "Tempo máximo para primeira mensagem do agente" },
      { key: "alerta_breach", label: "Alertar ao violar SLA", type: "toggle", defaultValue: true },
      { key: "telefone_alerta", label: "Telefone para alerta", emoji: "📱", type: "phone", defaultValue: "", placeholder: "5511999999999" },
    ],
  },

  "1.7": {
    skillId: "1.7",
    title: "Resgate FUP Inteligente",
    description: "Cadência adaptativa de follow-up para leads frios",
    fields: [
      { key: "max_fups", label: "Máximo de follow-ups", emoji: "🔁", type: "number", defaultValue: 5, min: 1, max: 15, description: "Quantidade máxima antes de desistir" },
      { key: "intervalo_inicial_h", label: "Intervalo inicial", emoji: "⏰", type: "number", defaultValue: 24, min: 6, max: 72, unit: "horas" },
      { key: "fator_backoff", label: "Fator de backoff", emoji: "📈", type: "slider", defaultValue: 1.5, min: 1, max: 3, step: 0.5, description: "Multiplicador do intervalo a cada FUP (1.5x = exponencial suave)" },
      { key: "horario_envio", label: "Horário preferencial", type: "select", defaultValue: "comercial", options: [{ label: "Horário comercial (08-18h)", value: "comercial" }, { label: "Horário livre", value: "livre" }, { label: "Pico do lead", value: "pico" }] },
    ],
  },

  "1.8": {
    skillId: "1.8",
    title: "Custo IA por Qualificação",
    description: "Monitora custo do agente IA por lead qualificado",
    fields: [
      { key: "alerta_custo_max", label: "Custo máximo por lead", emoji: "💰", type: "number", defaultValue: 2.0, min: 0.5, max: 20, step: 0.5, unit: "USD", description: "Alerta quando custo unitário exceder" },
      { key: "alertar_gestao", label: "Alertar gestão ao exceder", type: "toggle", defaultValue: true },
    ],
  },

  "1.9": {
    skillId: "1.9",
    title: "Horário Pico de Resposta",
    description: "Analisa padrões de resposta dos leads",
    fields: [
      { key: "dias_analise", label: "Janela de análise", emoji: "📊", type: "number", defaultValue: 30, min: 7, max: 90, unit: "dias" },
      { key: "ajustar_fup", label: "Ajustar FUP automaticamente", type: "toggle", defaultValue: false, description: "Altera horário de envio baseado no pico detectado" },
    ],
  },

  // ─── COMERCIAL ───
  "2.1": {
    skillId: "2.1",
    title: "Distribuição Inteligente",
    description: "Roteamento dinâmico baseado em performance",
    fields: [
      { key: "criterio", label: "Critério de roteamento", emoji: "🎯", type: "select", defaultValue: "performance", options: [{ label: "Performance (taxa conversão)", value: "performance" }, { label: "Round-Robin igual", value: "roundrobin" }, { label: "Horário pico", value: "horario" }, { label: "Misto", value: "misto" }] },
      { key: "peso_performance", label: "Peso da performance", type: "slider", defaultValue: 60, min: 0, max: 100, step: 10, unit: "%" },
      { key: "max_leads_dia", label: "Max leads/dia por vendedor", emoji: "📊", type: "number", defaultValue: 10, min: 1, max: 50 },
    ],
  },

  "2.2": {
    skillId: "2.2",
    title: "Forecast Pipeline",
    description: "Previsão de receita baseada no pipeline",
    fields: [
      { key: "prob_qualificado", label: "Probabilidade — Qualificado", emoji: "🎯", type: "slider", defaultValue: 15, min: 0, max: 100, step: 5, unit: "%" },
      { key: "prob_agendado", label: "Probabilidade — Agendado", type: "slider", defaultValue: 30, min: 0, max: 100, step: 5, unit: "%" },
      { key: "prob_proposta", label: "Probabilidade — Proposta", type: "slider", defaultValue: 50, min: 0, max: 100, step: 5, unit: "%" },
      { key: "prob_negociacao", label: "Probabilidade — Negociação", type: "slider", defaultValue: 70, min: 0, max: 100, step: 5, unit: "%" },
      { key: "prob_fechamento", label: "Probabilidade — Fechamento", type: "slider", defaultValue: 90, min: 0, max: 100, step: 5, unit: "%" },
      { key: "horizonte_dias", label: "Horizonte de projeção", emoji: "📅", type: "number", defaultValue: 30, min: 7, max: 90, unit: "dias" },
    ],
  },

  "2.3": {
    skillId: "2.3",
    title: "Alerta Lead Parado",
    description: "Notificação quando lead qualificado fica sem ação",
    fields: [
      { key: "dias_parado", label: "Dias sem ação", emoji: "⏰", type: "number", defaultValue: 7, min: 1, max: 30, unit: "dias" },
      { key: "canal_alerta", label: "Canal do alerta", type: "select", defaultValue: "whatsapp", options: [{ label: "WhatsApp", value: "whatsapp" }, { label: "Inbox", value: "inbox" }, { label: "Ambos", value: "ambos" }] },
      { key: "alertar_closer", label: "Alertar closer", type: "toggle", defaultValue: true },
      { key: "alertar_gestor", label: "Alertar gestor", type: "toggle", defaultValue: true },
      { key: "telefone_gestor", label: "Telefone gestor", emoji: "📱", type: "phone", defaultValue: "", placeholder: "5511999999999" },
    ],
  },

  "2.4": {
    skillId: "2.4",
    title: "Sugestão Próxima Ação",
    description: "IA sugere ação ideal baseada no contexto",
    fields: [
      { key: "modelo_ia", label: "Modelo IA", type: "select", defaultValue: "gpt-5-mini", options: [{ label: "GPT-5 Mini (rápido)", value: "gpt-5-mini" }, { label: "GPT-5 (preciso)", value: "gpt-5" }, { label: "Gemini 2.5 Flash", value: "gemini-flash" }] },
      { key: "incluir_historico", label: "Incluir histórico de conversa", type: "toggle", defaultValue: true },
    ],
  },

  "2.5": {
    skillId: "2.5",
    title: "Análise Motivo Perda",
    description: "Identifica padrões nos motivos de perda",
    fields: [
      { key: "periodo_analise", label: "Período de análise", emoji: "📅", type: "number", defaultValue: 90, min: 30, max: 365, unit: "dias" },
      { key: "min_perdas", label: "Mínimo de perdas para análise", type: "number", defaultValue: 10, min: 5, max: 50, description: "Requer X perdas para gerar padrão" },
    ],
  },

  "2.9": {
    skillId: "2.9",
    title: "Alerta Risco de Perda",
    description: "Alerta diretoria sobre leads em risco",
    fields: [
      { key: "dias_risco", label: "Dias qualificado sem avanço", emoji: "⚠️", type: "number", defaultValue: 21, min: 7, max: 60, unit: "dias" },
      { key: "telefone_diretoria", label: "Telefone diretoria", emoji: "📱", type: "phone", defaultValue: "", placeholder: "5511999999999" },
      { key: "frequencia_alerta", label: "Frequência do alerta", type: "select", defaultValue: "diario", options: [{ label: "Diário", value: "diario" }, { label: "A cada 3 dias", value: "3dias" }, { label: "Semanal", value: "semanal" }] },
    ],
  },

  "2.10": {
    skillId: "2.10",
    title: "Comissão Automática",
    description: "Percentuais de comissão por vendedor",
    fields: [
      { key: "comissao_padrao", label: "Comissão padrão", emoji: "💰", type: "slider", defaultValue: 2, min: 0.5, max: 10, step: 0.5, unit: "%" },
      { key: "comissao_premium", label: "Comissão premium", type: "slider", defaultValue: 3, min: 0.5, max: 10, step: 0.5, unit: "%" },
      { key: "base_calculo", label: "Base de cálculo", type: "select", defaultValue: "valor_proposta", options: [{ label: "Valor da proposta", value: "valor_proposta" }, { label: "Valor kWp", value: "kwp" }] },
    ],
  },

  // ─── CAMPANHAS ───
  "3.3": {
    skillId: "3.3",
    title: "Alerta Campanha Sem Leads",
    description: "Detecta campanhas gastando sem resultado",
    fields: [
      { key: "spend_min", label: "Gasto mínimo para alerta", emoji: "💸", type: "number", defaultValue: 100, min: 10, max: 1000, unit: "R$", description: "Campanha com gasto ≥ X e 0 leads" },
      { key: "dias_analise", label: "Janela de análise", type: "number", defaultValue: 3, min: 1, max: 7, unit: "dias" },
      { key: "canal_alerta", label: "Canal do alerta", type: "select", defaultValue: "whatsapp", options: [{ label: "WhatsApp", value: "whatsapp" }, { label: "Inbox", value: "inbox" }] },
    ],
  },

  "3.4": {
    skillId: "3.4",
    title: "Criativo Exausto",
    description: "CTR caindo indica fadiga de criativo",
    fields: [
      { key: "dias_queda", label: "Dias consecutivos de queda", emoji: "📉", type: "number", defaultValue: 3, min: 2, max: 7, unit: "dias" },
      { key: "queda_pct", label: "Queda mínima acumulada", type: "number", defaultValue: 20, min: 5, max: 50, unit: "%" },
    ],
  },

  "3.5": {
    skillId: "3.5",
    title: "Público Saturado",
    description: "Frequência alta indica público esgotado",
    fields: [
      { key: "freq_max", label: "Frequência máxima", emoji: "🔄", type: "number", defaultValue: 5, min: 2, max: 15, description: "Alerta quando frequência ≥ este valor" },
    ],
  },

  // ─── FINANCEIRO ───
  "5.2": {
    skillId: "5.2",
    title: "Custo IA Total",
    description: "Monitoramento mensal de custos do agente IA",
    fields: [
      { key: "budget_mensal", label: "Budget mensal IA", emoji: "💰", type: "number", defaultValue: 500, min: 50, max: 5000, unit: "USD" },
      { key: "alerta_pct", label: "Alertar em % do budget", type: "slider", defaultValue: 80, min: 50, max: 100, step: 5, unit: "%" },
    ],
  },

  "5.10": {
    skillId: "5.10",
    title: "Alerta Budget Ads",
    description: "Alerta quando orçamento de ads está acabando",
    fields: [
      { key: "budget_mensal_ads", label: "Budget mensal Ads", emoji: "💰", type: "number", defaultValue: 5000, min: 500, max: 100000, unit: "R$" },
      { key: "alerta_pct", label: "Alertar em % consumido", type: "slider", defaultValue: 85, min: 50, max: 100, step: 5, unit: "%" },
      { key: "telefone_alerta", label: "Telefone para alerta", emoji: "📱", type: "phone", defaultValue: "", placeholder: "5511999999999" },
    ],
  },

  // ─── OPERACIONAL ───
  "6.8": {
    skillId: "6.8",
    title: "Duplicata de Lead",
    description: "Detecta leads duplicados entre canais",
    fields: [
      { key: "campo_matching", label: "Campo de matching", emoji: "🔍", type: "select", defaultValue: "telefone", options: [{ label: "Telefone", value: "telefone" }, { label: "Email", value: "email" }, { label: "Ambos", value: "ambos" }] },
      { key: "acao_duplicata", label: "Ação ao detectar", type: "select", defaultValue: "alertar", options: [{ label: "Apenas alertar", value: "alertar" }, { label: "Mesclar automaticamente", value: "mesclar" }, { label: "Desqualificar duplicata", value: "desqualificar" }] },
    ],
  },

  "6.9": {
    skillId: "6.9",
    title: "FUP Esgotado Alert",
    description: "Leads que atingiram máximo de follow-ups",
    fields: [
      { key: "max_fups", label: "Máximo de FUPs", emoji: "🔁", type: "number", defaultValue: 5, min: 1, max: 15, description: "Quantidade máxima antes de sugerir desqualificar" },
      { key: "acao_sugerida", label: "Ação sugerida", type: "select", defaultValue: "desqualificar", options: [{ label: "Sugerir desqualificar", value: "desqualificar" }, { label: "Mover para nurturing", value: "nurturing" }, { label: "Apenas alertar", value: "alertar" }] },
    ],
  },

  // ─── WHATSAPP ───
  "8.1": {
    skillId: "8.1",
    title: "Resumo Diário WhatsApp",
    description: "KPIs do dia anterior via WhatsApp",
    fields: [
      { key: "horario_envio", label: "Horário de envio", emoji: "⏰", type: "text", defaultValue: "07:00", placeholder: "HH:MM" },
      { key: "telefone_destino", label: "Telefone destino", emoji: "📱", type: "phone", defaultValue: "", placeholder: "5511999999999" },
      { key: "incluir_leads", label: "Incluir métricas de leads", type: "toggle", defaultValue: true },
      { key: "incluir_ads", label: "Incluir métricas de ads", type: "toggle", defaultValue: true },
      { key: "incluir_custo_ia", label: "Incluir custos IA", type: "toggle", defaultValue: false },
    ],
  },

  "8.3": {
    skillId: "8.3",
    title: "Insight Semanal",
    description: "Report semanal com tendências e recomendações",
    fields: [
      { key: "dia_semana", label: "Dia de envio", emoji: "📅", type: "select", defaultValue: "seg", options: [{ label: "Segunda", value: "seg" }, { label: "Terça", value: "ter" }, { label: "Quarta", value: "qua" }, { label: "Sexta", value: "sex" }] },
      { key: "horario_envio", label: "Horário", type: "text", defaultValue: "08:00", placeholder: "HH:MM" },
      { key: "telefone_destino", label: "Telefone destino", emoji: "📱", type: "phone", defaultValue: "", placeholder: "5511999999999" },
      { key: "usar_ia", label: "Análise IA (recomendações)", type: "toggle", defaultValue: true },
    ],
  },

  "8.4": {
    skillId: "8.4",
    title: "Alerta Pipeline Parado",
    description: "Leads qualificados sem proposta por X dias",
    fields: [
      { key: "dias_sem_proposta", label: "Dias sem proposta", emoji: "⏰", type: "number", defaultValue: 7, min: 3, max: 30, unit: "dias" },
      { key: "telefone_alerta", label: "Telefone gestão", emoji: "📱", type: "phone", defaultValue: "", placeholder: "5511999999999" },
    ],
  },

  "8.5": {
    skillId: "8.5",
    title: "Alerta Campanha",
    description: "CPL subiu ou campanha sem resultado",
    fields: [
      { key: "cpl_max", label: "CPL máximo aceitável", emoji: "💸", type: "number", defaultValue: 50, min: 5, max: 500, unit: "R$" },
      { key: "variacao_pct", label: "Variação % para alertar", type: "number", defaultValue: 30, min: 10, max: 100, unit: "%", description: "Alerta se CPL subir X% vs média" },
      { key: "telefone_alerta", label: "Telefone alerta", emoji: "📱", type: "phone", defaultValue: "", placeholder: "5511999999999" },
    ],
  },

  "8.9": {
    skillId: "8.9",
    title: "Notificação Contrato Fechado",
    description: "Celebração quando fecha venda",
    fields: [
      { key: "grupo_whatsapp", label: "Telefone grupo equipe", emoji: "🏆", type: "phone", defaultValue: "", placeholder: "5511999999999" },
      { key: "incluir_valor", label: "Incluir valor do contrato", type: "toggle", defaultValue: true },
      { key: "incluir_vendedor", label: "Incluir nome do vendedor", type: "toggle", defaultValue: true },
    ],
  },

  // ─── EQUIPE ───
  "9.1": {
    skillId: "9.1",
    title: "Round-Robin Inteligente",
    description: "Distribuição igualitária de leads",
    fields: [
      { key: "respeitar_horario_pico", label: "Respeitar horário pico", emoji: "⏰", type: "toggle", defaultValue: true, description: "Prioriza vendedor no horário pico dele" },
      { key: "max_leads_dia", label: "Max leads por dia", emoji: "📊", type: "number", defaultValue: 8, min: 1, max: 30 },
      { key: "considerar_taxa", label: "Considerar taxa de conversão", type: "toggle", defaultValue: false, description: "Vendedores com melhor taxa recebem mais" },
    ],
  },

  "9.3": {
    skillId: "9.3",
    title: "Alerta Sobrecarga",
    description: "Alerta quando vendedor está sobrecarregado",
    fields: [
      { key: "limite_leads", label: "Limite de leads/dia", emoji: "⚠️", type: "number", defaultValue: 12, min: 3, max: 30 },
      { key: "canal_alerta", label: "Canal do alerta", type: "select", defaultValue: "whatsapp", options: [{ label: "WhatsApp", value: "whatsapp" }, { label: "Inbox", value: "inbox" }] },
    ],
  },

  "9.5": {
    skillId: "9.5",
    title: "Meta vs Realizado",
    description: "Acompanhamento de metas",
    fields: [
      { key: "meta_leads_mes", label: "Meta leads/mês", emoji: "🎯", type: "number", defaultValue: 50, min: 10, max: 500 },
      { key: "meta_conversao", label: "Meta conversão", type: "slider", defaultValue: 15, min: 5, max: 50, step: 1, unit: "%" },
      { key: "meta_receita", label: "Meta receita mensal", emoji: "💰", type: "number", defaultValue: 100000, min: 10000, max: 1000000, unit: "R$" },
    ],
  },

  // ─── SOLAR ESPECÍFICO ───
  "1.10": {
    skillId: "1.10",
    title: "OCR Conta de Luz",
    description: "GPT-4 Vision extrai valor real da foto da conta de energia",
    fields: [
      { key: "modelo_ocr", label: "Modelo de OCR", emoji: "🤖", type: "select", defaultValue: "gpt4-vision", options: [{ label: "GPT-4 Vision", value: "gpt4-vision" }, { label: "Gemini 2.5 Flash", value: "gemini-flash" }] },
      { key: "confianca_minima", label: "Confiança mínima", emoji: "🎯", type: "slider", defaultValue: 80, min: 50, max: 100, step: 5, unit: "%", description: "Abaixo disso pede confirmação ao lead" },
      { key: "solicitar_reenvio", label: "Pedir reenvio se baixa confiança", type: "toggle", defaultValue: true },
    ],
  },

  "10.1": {
    skillId: "10.1",
    title: "Tracking Homologação",
    description: "Acompanha etapas pós-venda (projeto → aprovação → instalação → homologação)",
    fields: [
      { key: "sla_projeto_dias", label: "SLA projeto técnico", emoji: "📐", type: "number", defaultValue: 5, min: 1, max: 30, unit: "dias" },
      { key: "sla_aprovacao_dias", label: "SLA aprovação concessionária", emoji: "⚡", type: "number", defaultValue: 15, min: 5, max: 60, unit: "dias" },
      { key: "sla_instalacao_dias", label: "SLA instalação", emoji: "🔧", type: "number", defaultValue: 10, min: 3, max: 30, unit: "dias" },
      { key: "sla_homologacao_dias", label: "SLA homologação", emoji: "✅", type: "number", defaultValue: 30, min: 10, max: 90, unit: "dias" },
      { key: "alertar_atraso", label: "Alertar ao atrasar", type: "toggle", defaultValue: true },
      { key: "telefone_alerta", label: "Telefone alerta", emoji: "📱", type: "phone", defaultValue: "", placeholder: "5517999999999" },
    ],
  },

  "10.2": {
    skillId: "10.2",
    title: "Alerta Instalação",
    description: "Instalações pendentes e agendadas na semana",
    fields: [
      { key: "dias_antecedencia", label: "Dias de antecedência", emoji: "📅", type: "number", defaultValue: 3, min: 1, max: 7, unit: "dias", description: "Alertar X dias antes da instalação" },
      { key: "horario_alerta", label: "Horário do alerta", emoji: "⏰", type: "text", defaultValue: "07:00", placeholder: "HH:MM" },
      { key: "alertar_equipe", label: "Alertar equipe técnica", type: "toggle", defaultValue: true },
      { key: "alertar_cliente", label: "Enviar lembrete ao cliente", type: "toggle", defaultValue: true },
      { key: "telefone_coordenador", label: "Telefone coordenador", emoji: "📱", type: "phone", defaultValue: "", placeholder: "5517999999999" },
    ],
  },

  // ─── PÓS-VENDA ───
  "10.4": {
    skillId: "10.4",
    title: "SLA Pós-Venda",
    description: "Tempo máximo por etapa do pós-venda",
    fields: [
      { key: "sla_projeto_dias", label: "SLA projeto técnico", emoji: "📐", type: "number", defaultValue: 5, min: 1, max: 30, unit: "dias" },
      { key: "sla_aprovacao_dias", label: "SLA aprovação", type: "number", defaultValue: 15, min: 5, max: 60, unit: "dias" },
      { key: "sla_instalacao_dias", label: "SLA instalação", type: "number", defaultValue: 30, min: 10, max: 90, unit: "dias" },
      { key: "alertar_atraso", label: "Alertar ao atrasar", type: "toggle", defaultValue: true },
    ],
  },
};
