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

  "1.4": {
    skillId: "1.4",
    title: "Análise Canal × Conversão",
    description: "CPL e taxa de conversão por canal de origem",
    fields: [
      { key: "periodo_analise", label: "Período de análise", emoji: "📅", type: "number", defaultValue: 30, min: 7, max: 90, unit: "dias" },
      { key: "agrupar_por", label: "Agrupar por", type: "select", defaultValue: "canal", options: [{ label: "Canal de origem", value: "canal" }, { label: "Campanha", value: "campanha" }, { label: "Canal + Campanha", value: "ambos" }] },
      { key: "incluir_custo_ia", label: "Incluir custo IA no CPL", type: "toggle", defaultValue: true, description: "Soma custo do agente IA ao CPL do canal" },
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

  "2.6": {
    skillId: "2.6",
    title: "Ranking Performance Vendedores",
    description: "Ranking de conversão e produtividade por vendedor",
    fields: [
      { key: "periodo", label: "Período do ranking", emoji: "📅", type: "select", defaultValue: "mensal", options: [{ label: "Semanal", value: "semanal" }, { label: "Mensal", value: "mensal" }, { label: "Trimestral", value: "trimestral" }] },
      { key: "metrica_principal", label: "Métrica principal", emoji: "🎯", type: "select", defaultValue: "conversao", options: [{ label: "Taxa de conversão", value: "conversao" }, { label: "Volume de leads", value: "volume" }, { label: "Receita gerada", value: "receita" }] },
      { key: "enviar_whatsapp", label: "Enviar ranking via WhatsApp", type: "toggle", defaultValue: true },
    ],
  },

  "2.7": {
    skillId: "2.7",
    title: "Coach de Vendas",
    description: "IA analisa conversas e sugere melhorias",
    fields: [
      { key: "modelo_ia", label: "Modelo IA", emoji: "🤖", type: "select", defaultValue: "gpt-5-mini", options: [{ label: "GPT-5 Mini", value: "gpt-5-mini" }, { label: "GPT-5", value: "gpt-5" }, { label: "Claude Opus", value: "claude-opus" }] },
      { key: "analisar_perdas", label: "Analisar apenas perdas", type: "toggle", defaultValue: true, description: "Foca nas conversas que não converteram" },
      { key: "frequencia", label: "Frequência de análise", type: "select", defaultValue: "semanal", options: [{ label: "Diário", value: "diario" }, { label: "Semanal", value: "semanal" }] },
    ],
  },

  "2.8": {
    skillId: "2.8",
    title: "Gerador de Proposta",
    description: "Gera proposta automática baseada no perfil solar do lead",
    fields: [
      { key: "modelo_ia", label: "Modelo IA", emoji: "🤖", type: "select", defaultValue: "gpt-5-mini", options: [{ label: "GPT-5 Mini", value: "gpt-5-mini" }, { label: "GPT-5", value: "gpt-5" }] },
      { key: "incluir_financiamento", label: "Incluir opções de financiamento", type: "toggle", defaultValue: true },
      { key: "margem_padrao", label: "Margem padrão", emoji: "💰", type: "slider", defaultValue: 25, min: 10, max: 50, step: 5, unit: "%" },
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
      { key: "comissao_premium", label: "Comissão premium (Danieli)", type: "slider", defaultValue: 3, min: 0.5, max: 10, step: 0.5, unit: "%" },
      { key: "base_calculo", label: "Base de cálculo", type: "select", defaultValue: "valor_proposta", options: [{ label: "Valor da proposta", value: "valor_proposta" }, { label: "Valor kWp", value: "kwp" }] },
    ],
  },

  // ─── CAMPANHAS ───
  "3.1": {
    skillId: "3.1",
    title: "CPL por Plataforma",
    description: "Comparativo de custo por lead entre canais",
    fields: [
      { key: "periodo_analise", label: "Período de análise", emoji: "📅", type: "number", defaultValue: 30, min: 7, max: 90, unit: "dias" },
      { key: "plataformas", label: "Plataformas", type: "select", defaultValue: "todas", options: [{ label: "Todas", value: "todas" }, { label: "Apenas Meta", value: "meta" }, { label: "Apenas Google", value: "google" }] },
    ],
  },

  "3.2": {
    skillId: "3.2",
    title: "ROAS Real",
    description: "Retorno real sobre investimento em ads",
    fields: [
      { key: "periodo_analise", label: "Período", emoji: "📅", type: "number", defaultValue: 30, min: 7, max: 90, unit: "dias" },
      { key: "roas_minimo", label: "ROAS mínimo aceitável", emoji: "🎯", type: "number", defaultValue: 3, min: 1, max: 20, step: 0.5, description: "Alerta se ROAS < este valor" },
    ],
  },

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

  "3.6": {
    skillId: "3.6",
    title: "Canal Mais Eficiente",
    description: "Identifica canal com melhor custo-benefício",
    fields: [
      { key: "periodo_analise", label: "Período", emoji: "📅", type: "number", defaultValue: 30, min: 7, max: 90, unit: "dias" },
      { key: "metrica", label: "Métrica de eficiência", type: "select", defaultValue: "cpl", options: [{ label: "CPL (Custo por Lead)", value: "cpl" }, { label: "CPA (Custo por Agendamento)", value: "cpa" }, { label: "ROAS", value: "roas" }] },
    ],
  },

  "3.7": {
    skillId: "3.7",
    title: "Volume de Busca (Market Intel)",
    description: "Volume de buscas mensais por keyword solar",
    fields: [
      { key: "keywords", label: "Keywords para monitorar", emoji: "🔍", type: "textarea", defaultValue: "energia solar, placa solar, painel solar, instalação solar", placeholder: "Uma keyword por linha..." },
      { key: "regiao", label: "Região", type: "text", defaultValue: "São Paulo, SP", placeholder: "Cidade, Estado" },
    ],
  },

  "3.8": {
    skillId: "3.8",
    title: "Benchmark CPC",
    description: "CPC da empresa vs mercado solar",
    fields: [
      { key: "cpc_alerta", label: "CPC máximo aceitável", emoji: "💸", type: "number", defaultValue: 5, min: 0.5, max: 50, step: 0.5, unit: "R$" },
      { key: "comparar_mercado", label: "Comparar com média do mercado", type: "toggle", defaultValue: true },
    ],
  },

  "3.9": {
    skillId: "3.9",
    title: "Market Share Buscas",
    description: "% das buscas que a empresa aparece",
    fields: [
      { key: "meta_impression_share", label: "Meta de impression share", emoji: "🎯", type: "slider", defaultValue: 30, min: 5, max: 100, step: 5, unit: "%" },
    ],
  },

  "3.10": {
    skillId: "3.10",
    title: "Sazonalidade",
    description: "Identifica picos e vales de demanda solar no ano",
    fields: [
      { key: "meses_historico", label: "Meses de histórico", emoji: "📊", type: "number", defaultValue: 12, min: 6, max: 24, unit: "meses" },
      { key: "alertar_pico", label: "Alertar em períodos de pico", type: "toggle", defaultValue: true },
    ],
  },

  // ─── SITE & CONVERSÃO ───
  "4.1": {
    skillId: "4.1",
    title: "Taxa Conversão LP",
    description: "% de visitantes que viram leads na landing page",
    fields: [
      { key: "meta_conversao", label: "Meta de conversão", emoji: "🎯", type: "slider", defaultValue: 5, min: 1, max: 30, step: 1, unit: "%" },
      { key: "periodo_analise", label: "Período", type: "number", defaultValue: 7, min: 1, max: 30, unit: "dias" },
    ],
  },

  "4.2": {
    skillId: "4.2",
    title: "Funil Site",
    description: "Visualização de drop-off no site",
    fields: [
      { key: "etapas", label: "Eventos do funil", emoji: "📊", type: "textarea", defaultValue: "page_view, scroll_50, form_start, form_submit", placeholder: "Eventos GA4 separados por vírgula" },
    ],
  },

  "4.3": {
    skillId: "4.3",
    title: "Fonte × Conversão",
    description: "Qual fonte de tráfego converte melhor",
    fields: [
      { key: "periodo_analise", label: "Período", emoji: "📅", type: "number", defaultValue: 30, min: 7, max: 90, unit: "dias" },
      { key: "min_sessoes", label: "Mínimo de sessões", type: "number", defaultValue: 50, min: 10, max: 500, description: "Fonte precisa ter X sessões para entrar na análise" },
    ],
  },

  "4.4": {
    skillId: "4.4",
    title: "Cidade × Lead",
    description: "Distribuição geográfica do tráfego",
    fields: [
      { key: "top_n", label: "Top N cidades", emoji: "📍", type: "number", defaultValue: 10, min: 5, max: 50 },
      { key: "periodo_analise", label: "Período", type: "number", defaultValue: 30, min: 7, max: 90, unit: "dias" },
    ],
  },

  "4.5": {
    skillId: "4.5",
    title: "Device Performance",
    description: "Performance mobile vs desktop",
    fields: [
      { key: "alerta_mobile_baixo", label: "Alertar se mobile < desktop em X%", emoji: "📱", type: "number", defaultValue: 30, min: 10, max: 80, unit: "%" },
    ],
  },

  "4.6": {
    skillId: "4.6",
    title: "Horário Pico Site",
    description: "Horários com mais tráfego no site",
    fields: [
      { key: "dias_analise", label: "Janela de análise", emoji: "📅", type: "number", defaultValue: 14, min: 7, max: 60, unit: "dias" },
      { key: "ajustar_ads", label: "Sugerir ajuste de budget por horário", type: "toggle", defaultValue: true },
    ],
  },

  "4.7": {
    skillId: "4.7",
    title: "Bounce Rate por Fonte",
    description: "Taxa de rejeição por canal de origem",
    fields: [
      { key: "bounce_max", label: "Bounce rate máximo aceitável", emoji: "⚠️", type: "slider", defaultValue: 60, min: 20, max: 90, step: 5, unit: "%" },
    ],
  },

  "4.8": {
    skillId: "4.8",
    title: "Tempo no Site",
    description: "Correlação entre tempo de visita e conversão",
    fields: [
      { key: "tempo_min_seg", label: "Tempo mínimo engajado", emoji: "⏱️", type: "number", defaultValue: 60, min: 10, max: 300, unit: "segundos" },
    ],
  },

  "4.9": {
    skillId: "4.9",
    title: "Página de Saída",
    description: "Onde os visitantes abandonam o site",
    fields: [
      { key: "top_n", label: "Top N páginas de saída", emoji: "🚪", type: "number", defaultValue: 5, min: 3, max: 20 },
      { key: "sugestao_ia", label: "Gerar sugestão de UX via IA", type: "toggle", defaultValue: true },
    ],
  },

  "4.10": {
    skillId: "4.10",
    title: "A/B Testing Sugestão",
    description: "Comparativo de performance entre criativos/LPs",
    fields: [
      { key: "confianca_min", label: "Nível de confiança mínimo", emoji: "📊", type: "slider", defaultValue: 95, min: 80, max: 99, step: 1, unit: "%" },
      { key: "min_conversoes", label: "Mínimo de conversões", type: "number", defaultValue: 30, min: 10, max: 100 },
    ],
  },

  // ─── FINANCEIRO ───
  "5.1": {
    skillId: "5.1",
    title: "CAC Real",
    description: "Custo de aquisição de cliente completo",
    fields: [
      { key: "incluir_custo_ia", label: "Incluir custo IA no CAC", type: "toggle", defaultValue: true },
      { key: "incluir_fixos", label: "Incluir custos fixos", type: "toggle", defaultValue: false },
      { key: "custo_fixo_mensal", label: "Custos fixos mensais", emoji: "💰", type: "number", defaultValue: 5000, min: 0, max: 50000, unit: "R$", description: "Salários, ferramentas, etc." },
    ],
  },

  "5.2": {
    skillId: "5.2",
    title: "Custo IA Total",
    description: "Monitoramento mensal de custos do agente IA",
    fields: [
      { key: "budget_mensal", label: "Budget mensal IA", emoji: "💰", type: "number", defaultValue: 500, min: 50, max: 5000, unit: "USD" },
      { key: "alerta_pct", label: "Alertar em % do budget", type: "slider", defaultValue: 80, min: 50, max: 100, step: 5, unit: "%" },
    ],
  },

  "5.3": {
    skillId: "5.3",
    title: "Custo por Etapa do Funil",
    description: "Quanto custa cada transição do funil",
    fields: [
      { key: "periodo_analise", label: "Período", emoji: "📅", type: "number", defaultValue: 30, min: 7, max: 90, unit: "dias" },
      { key: "incluir_custos_fixos", label: "Incluir custos fixos rateados", type: "toggle", defaultValue: false },
    ],
  },

  "5.4": {
    skillId: "5.4",
    title: "Ticket Médio Real",
    description: "Valor médio dos contratos fechados",
    fields: [
      { key: "periodo_analise", label: "Período", emoji: "📅", type: "number", defaultValue: 90, min: 30, max: 365, unit: "dias" },
      { key: "agrupar_por", label: "Agrupar por", type: "select", defaultValue: "geral", options: [{ label: "Geral", value: "geral" }, { label: "Por vendedor", value: "vendedor" }, { label: "Por canal", value: "canal" }] },
    ],
  },

  "5.5": {
    skillId: "5.5",
    title: "Payback de Campanha",
    description: "Tempo para recuperar investimento em ads",
    fields: [
      { key: "meta_payback_dias", label: "Meta de payback", emoji: "⏰", type: "number", defaultValue: 30, min: 7, max: 180, unit: "dias" },
      { key: "alertar_acima_meta", label: "Alertar acima da meta", type: "toggle", defaultValue: true },
    ],
  },

  "5.6": {
    skillId: "5.6",
    title: "Projeção Receita",
    description: "Receita projetada baseada no pipeline solar",
    fields: [
      { key: "horizonte_dias", label: "Horizonte de projeção", emoji: "📅", type: "number", defaultValue: 30, min: 7, max: 90, unit: "dias" },
      { key: "ticket_medio", label: "Ticket médio referência", emoji: "💰", type: "number", defaultValue: 25000, min: 5000, max: 200000, unit: "R$" },
      { key: "taxa_conversao", label: "Taxa de conversão referência", type: "slider", defaultValue: 15, min: 5, max: 50, step: 1, unit: "%" },
    ],
  },

  "5.7": {
    skillId: "5.7",
    title: "Margem por Projeto",
    description: "Margem de lucro por venda fechada",
    fields: [
      { key: "margem_meta", label: "Margem meta", emoji: "🎯", type: "slider", defaultValue: 25, min: 5, max: 50, step: 5, unit: "%" },
      { key: "alertar_abaixo", label: "Alertar se margem abaixo da meta", type: "toggle", defaultValue: true },
    ],
  },

  "5.8": {
    skillId: "5.8",
    title: "Custo Operacional/Lead",
    description: "Custo operacional total por lead processado",
    fields: [
      { key: "custo_make_mensal", label: "Custo Make.com mensal", emoji: "⚙️", type: "number", defaultValue: 200, min: 0, max: 2000, unit: "USD" },
      { key: "custo_infra_mensal", label: "Custo infra mensal", emoji: "🖥️", type: "number", defaultValue: 100, min: 0, max: 1000, unit: "USD" },
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
  "6.2": {
    skillId: "6.2",
    title: "Alerta DLQ",
    description: "Detecta itens presos na Dead Letter Queue do Make",
    fields: [
      { key: "threshold_itens", label: "Limite de itens na DLQ", emoji: "⚠️", type: "number", defaultValue: 5, min: 1, max: 50, description: "Alerta quando DLQ tiver ≥ X itens" },
      { key: "verificar_a_cada", label: "Verificar a cada", type: "number", defaultValue: 15, min: 5, max: 60, unit: "minutos" },
    ],
  },

  "6.3": {
    skillId: "6.3",
    title: "Consumo de Operações Make",
    description: "Monitora consumo de ops vs budget",
    fields: [
      { key: "budget_ops_mensal", label: "Budget ops/mês", emoji: "⚙️", type: "number", defaultValue: 10000, min: 1000, max: 100000 },
      { key: "alerta_pct", label: "Alertar em %", type: "slider", defaultValue: 80, min: 50, max: 100, step: 5, unit: "%" },
    ],
  },

  "6.6": {
    skillId: "6.6",
    title: "Token Expiration",
    description: "Alerta quando tokens de API estão expirando",
    fields: [
      { key: "dias_antecedencia", label: "Dias de antecedência", emoji: "⏰", type: "number", defaultValue: 7, min: 1, max: 30, unit: "dias" },
      { key: "telefone_alerta", label: "Telefone alerta", emoji: "📱", type: "phone", defaultValue: "", placeholder: "5511999999999" },
    ],
  },

  "6.7": {
    skillId: "6.7",
    title: "Volume Make vs Budget",
    description: "Cenários mais pesados e otimização",
    fields: [
      { key: "top_n_cenarios", label: "Top N cenários pesados", emoji: "📊", type: "number", defaultValue: 5, min: 3, max: 20 },
      { key: "sugestao_otimizacao", label: "Sugerir otimização via IA", type: "toggle", defaultValue: true },
    ],
  },

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

  "6.10": {
    skillId: "6.10",
    title: "Custo Infra por Lead",
    description: "Custo de infraestrutura por lead processado",
    fields: [
      { key: "custo_make", label: "Custo Make.com/mês", emoji: "⚙️", type: "number", defaultValue: 200, min: 0, max: 2000, unit: "USD" },
      { key: "custo_supabase", label: "Custo Supabase/mês", emoji: "🗄️", type: "number", defaultValue: 25, min: 0, max: 500, unit: "USD" },
      { key: "custo_outros", label: "Outros custos/mês", emoji: "📦", type: "number", defaultValue: 50, min: 0, max: 1000, unit: "USD" },
    ],
  },

  // ─── INTELIGÊNCIA DE MERCADO ───
  "7.1": {
    skillId: "7.1",
    title: "Volume de Busca Mensal",
    description: "Volume de buscas por keywords do segmento solar",
    fields: [
      { key: "keywords", label: "Keywords para monitorar", emoji: "🔍", type: "textarea", defaultValue: "energia solar residencial, painel solar preço, instalação solar", placeholder: "Uma keyword por linha..." },
      { key: "regiao", label: "Região", type: "text", defaultValue: "Brasil", placeholder: "País ou Estado" },
    ],
  },

  "7.3": {
    skillId: "7.3",
    title: "Concorrência",
    description: "Mapa de concorrentes e market share",
    fields: [
      { key: "concorrentes", label: "Concorrentes a monitorar", emoji: "🏢", type: "textarea", defaultValue: "", placeholder: "Nome dos concorrentes, um por linha..." },
      { key: "metricas", label: "Métricas a comparar", type: "select", defaultValue: "impression_share", options: [{ label: "Impression Share", value: "impression_share" }, { label: "Posição média", value: "posicao" }, { label: "Ambos", value: "ambos" }] },
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

  "8.6": {
    skillId: "8.6",
    title: "Report On-Demand",
    description: "Vendedor pede relatório e IA responde",
    fields: [
      { key: "modelo_ia", label: "Modelo IA", emoji: "🤖", type: "select", defaultValue: "gpt-5-mini", options: [{ label: "GPT-5 Mini", value: "gpt-5-mini" }, { label: "Gemini Flash", value: "gemini-flash" }] },
      { key: "max_tokens", label: "Tamanho máximo da resposta", type: "number", defaultValue: 500, min: 200, max: 2000, unit: "tokens" },
    ],
  },

  "8.7": {
    skillId: "8.7",
    title: "Coach WhatsApp",
    description: "IA sugere abordagem em tempo real",
    fields: [
      { key: "modelo_ia", label: "Modelo IA", emoji: "🤖", type: "select", defaultValue: "gpt-5-mini", options: [{ label: "GPT-5 Mini", value: "gpt-5-mini" }, { label: "GPT-5", value: "gpt-5" }] },
      { key: "contexto_conversa", label: "Incluir contexto da conversa", type: "toggle", defaultValue: true },
      { key: "estilo_sugestao", label: "Estilo de sugestão", type: "select", defaultValue: "direto", options: [{ label: "Direto (ação)", value: "direto" }, { label: "Consultivo (opções)", value: "consultivo" }] },
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

  "9.2": {
    skillId: "9.2",
    title: "Golden Hour Routing",
    description: "Roteia pro vendedor no pico de performance",
    fields: [
      { key: "usar_horario_pico", label: "Usar horário pico do vendedor", emoji: "⏰", type: "toggle", defaultValue: true },
      { key: "peso_taxa_conversao", label: "Peso da taxa de conversão", type: "slider", defaultValue: 50, min: 0, max: 100, step: 10, unit: "%" },
      { key: "fallback", label: "Fallback se ninguém no pico", type: "select", defaultValue: "roundrobin", options: [{ label: "Round-Robin", value: "roundrobin" }, { label: "Menor carga", value: "menor_carga" }] },
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

  "9.4": {
    skillId: "9.4",
    title: "Performance Semanal",
    description: "Ranking de performance por vendedor",
    fields: [
      { key: "dia_envio", label: "Dia de envio", emoji: "📅", type: "select", defaultValue: "seg", options: [{ label: "Segunda", value: "seg" }, { label: "Sexta", value: "sex" }] },
      { key: "telefone_grupo", label: "Telefone grupo equipe", emoji: "📱", type: "phone", defaultValue: "", placeholder: "5511999999999" },
      { key: "incluir_ranking", label: "Incluir ranking comparativo", type: "toggle", defaultValue: true },
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

  "9.7": {
    skillId: "9.7",
    title: "Treinamento Sugerido",
    description: "Identifica gaps de performance e sugere treinamento",
    fields: [
      { key: "min_leads_analise", label: "Mínimo de leads para análise", emoji: "📊", type: "number", defaultValue: 20, min: 10, max: 100 },
      { key: "modelo_ia", label: "Modelo IA", type: "select", defaultValue: "gpt-5-mini", options: [{ label: "GPT-5 Mini", value: "gpt-5-mini" }, { label: "GPT-5", value: "gpt-5" }] },
    ],
  },

  "9.8": {
    skillId: "9.8",
    title: "Horário Produtivo",
    description: "Mapeia horários mais produtivos de cada vendedor",
    fields: [
      { key: "dias_analise", label: "Janela de análise", emoji: "📅", type: "number", defaultValue: 30, min: 7, max: 90, unit: "dias" },
      { key: "granularidade", label: "Granularidade", type: "select", defaultValue: "hora", options: [{ label: "Por hora", value: "hora" }, { label: "Por turno (manhã/tarde)", value: "turno" }] },
    ],
  },

  "9.10": {
    skillId: "9.10",
    title: "NPS Lead/Cliente",
    description: "Score de satisfação por vendedor",
    fields: [
      { key: "enviar_pesquisa_apos", label: "Enviar pesquisa após", emoji: "📅", type: "number", defaultValue: 7, min: 1, max: 30, unit: "dias", description: "Dias após fechamento" },
      { key: "canal_pesquisa", label: "Canal da pesquisa", type: "select", defaultValue: "whatsapp", options: [{ label: "WhatsApp", value: "whatsapp" }, { label: "Email", value: "email" }] },
    ],
  },

  // ─── SOLAR ESPECÍFICO ───
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

  "10.5": {
    skillId: "10.5",
    title: "Indicação Automática",
    description: "Pede indicação para clientes satisfeitos pós-entrega",
    fields: [
      { key: "dias_apos_entrega", label: "Dias após entrega", emoji: "📅", type: "number", defaultValue: 30, min: 7, max: 90, unit: "dias" },
      { key: "canal_envio", label: "Canal de envio", type: "select", defaultValue: "whatsapp", options: [{ label: "WhatsApp", value: "whatsapp" }, { label: "Email", value: "email" }] },
      { key: "oferecer_desconto", label: "Oferecer benefício por indicação", type: "toggle", defaultValue: true },
    ],
  },

  "10.6": {
    skillId: "10.6",
    title: "Review Google",
    description: "Pede review no Google pós-entrega",
    fields: [
      { key: "dias_apos_instalacao", label: "Dias após instalação", emoji: "📅", type: "number", defaultValue: 14, min: 3, max: 60, unit: "dias" },
      { key: "link_review", label: "Link do Google Reviews", emoji: "🔗", type: "text", defaultValue: "", placeholder: "https://g.page/r/..." },
    ],
  },

  "10.7": {
    skillId: "10.7",
    title: "Upsell Automático",
    description: "Detecta oportunidade de upsell (ampliação de sistema)",
    fields: [
      { key: "meses_apos_instalacao", label: "Meses após instalação", emoji: "📅", type: "number", defaultValue: 6, min: 3, max: 24, unit: "meses" },
      { key: "criterio", label: "Critério de upsell", type: "select", defaultValue: "consumo", options: [{ label: "Aumento de consumo", value: "consumo" }, { label: "Novo imóvel", value: "imovel" }, { label: "Bateria/Backup", value: "bateria" }] },
    ],
  },
};
