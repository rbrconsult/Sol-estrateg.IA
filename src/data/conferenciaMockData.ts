export const kpis = [
  { label: "Leads Recebidos", value: 801, color: "#F5A623", trend: null },
  { label: "Qualificados Sol", value: 284, color: "#06D6A0", trend: 35.4 },
  { label: "Leads QUENTES", value: 47, color: "#EF476F", trend: null },
  { label: "Propostas Geradas", value: 61, color: "#F5A623", trend: 21.5 },
  { label: "ROI Estimado", value: 4.2, color: "#06D6A0", trend: null, suffix: "×", isDecimal: true },
];

export const roiData = {
  custoLead: 6,
  custoSDR: 420,
  faturamento: 1800000,
  leadsQualificados: 284,
  ticketMedio: 28000,
  economiaMensal: 11400,
};

export const funnelData = [
  { etapa: "TRÁFEGO PAGO", valor: 84, color: "#F5A623" },
  { etapa: "PROPOSTA", valor: 61, color: "#8B5CF6" },
  { etapa: "NEGOCIAÇÃO", valor: 19, color: "#06D6A0" },
  { etapa: "CONTATO REALIZADO", valor: 18, color: "#118AB2" },
  { etapa: "QUALIFICAÇÃO", valor: 14, color: "#EF476F" },
  { etapa: "QUALIFICADO", valor: 10, color: "#06D6A0" },
  { etapa: "PROSPECÇÃO", valor: 6, color: "#6B7A99" },
  { etapa: "FOLLOW UP", valor: 1, color: "#6B7A99" },
];

export const weeklyLeads = [
  { semana: "S1", leads: 3 },
  { semana: "S2", leads: 4 },
  { semana: "S3", leads: 5 },
  { semana: "S4", leads: 6 },
  { semana: "S5", leads: 4 },
  { semana: "S6", leads: 7 },
  { semana: "S7", leads: 5 },
  { semana: "S8", leads: 8 },
];

export const insights = [
  {
    type: "alert" as const,
    icon: "🔴",
    title: "2 Leads QUENTES Descartados",
    description: "Norma (70) e Miguel H. Jr. (70) marcados perdidos. Receita potencial R$ 112k em risco.",
    borderColor: "#EF476F",
  },
  {
    type: "info" as const,
    icon: "🟡",
    title: "Resposta em 10 segundos",
    description: "Sol responde 99% em até 10s. +381% conversão vs 30min de espera.",
    borderColor: "#F5A623",
  },
  {
    type: "ok" as const,
    icon: "🟢",
    title: "Agendamentos +52%",
    description: "Taxa subiu de 18% para 27% nos leads da Sol.",
    borderColor: "#06D6A0",
  },
  {
    type: "info" as const,
    icon: "🟡",
    title: "47% chegam fora do horário",
    description: "Após 18h e FDS. Atendimento 24/7 garante captura.",
    borderColor: "#F5A623",
  },
  {
    type: "ok" as const,
    icon: "🟢",
    title: "Dados 100% no CRM",
    description: "284 leads com perfil BANT completo no SolarMarket.",
    borderColor: "#06D6A0",
  },
];

export const leadsTable = [
  { nome: "Marcos Giacomo", cidade: "Ibaté", valorConta: ">R$1k", score: 60, temperatura: "MORNO", etapa: "QUALIFICADO", responsavel: "Vitoria Coelho", data: "24/02" },
  { nome: "Miguel Hanna Jr.", cidade: "Ribeirão Preto", valorConta: "R$1k-5k", score: 70, temperatura: "QUENTE", etapa: "QUALIFICADO", responsavel: "Em aberto", data: "05/02" },
  { nome: "Norma Suely", cidade: "S.J.Rio Preto", valorConta: "R$350-700", score: 70, temperatura: "QUENTE", etapa: "NEGOCIAÇÃO", responsavel: "Giovana Rodrigues", data: "02/02" },
  { nome: "Thiago G. Ferreira", cidade: "Ariranha", valorConta: "R$250-400", score: 60, temperatura: "MORNO", etapa: "QUALIFICAÇÃO", responsavel: "Vitoria Coelho", data: "03/02" },
  { nome: "Marcelo P. Urbano", cidade: "Santos", valorConta: "R$350-700", score: 50, temperatura: "MORNO", etapa: "PROPOSTA", responsavel: "Giovana Rodrigues", data: "19/02" },
  { nome: "Lucas G. Ferreira", cidade: "Araraquara", valorConta: "R$700-1k", score: 60, temperatura: "MORNO", etapa: "CONTATO REALIZADO", responsavel: "DANIELI NICASSO", data: "04/02" },
  { nome: "Danieli Viana", cidade: "Pres. Prudente", valorConta: "R$350-700", score: 60, temperatura: "MORNO", etapa: "CONTATO REALIZADO", responsavel: "Giovana Rodrigues", data: "04/02" },
  { nome: "Anaasilveira", cidade: "Campo Grande", valorConta: "R$700-1k", score: 60, temperatura: "MORNO", etapa: "CONTATO REALIZADO", responsavel: "Giovana Rodrigues", data: "05/02" },
  { nome: "Adriana R. Garcia", cidade: "São Paulo", valorConta: "R$100-350", score: 60, temperatura: "MORNO", etapa: "QUALIFICADO", responsavel: "DANIELI NICASSO", data: "20/02" },
  { nome: "Priscila D.Gianotto", cidade: "S.J.Rio Preto", valorConta: "R$700-1k", score: 60, temperatura: "MORNO", etapa: "PROSPECÇÃO", responsavel: "Vitoria Coelho", data: "10/02" },
  { nome: "Andre P. Santos", cidade: "São Paulo", valorConta: "R$350-700", score: 60, temperatura: "MORNO", etapa: "TRÁFEGO PAGO", responsavel: "Vitoria Coelho", data: "09/02" },
  { nome: "Degmar Damaceno", cidade: "Ribeirão Preto", valorConta: "R$700-1k", score: 60, temperatura: "MORNO", etapa: "QUALIFICAÇÃO", responsavel: "Giovana Rodrigues", data: "04/02" },
];

export const origemLeads = [
  { origem: "SITE", valor: 70, pct: 33, color: "#8B5CF6" },
  { origem: "FACEBOOK", valor: 52, pct: 24, color: "#118AB2" },
  { origem: "GOOGLE", valor: 12, pct: 6, color: "#EF476F" },
  { origem: "ORGÂNICO", valor: 11, pct: 5, color: "#06D6A0" },
  { origem: "INDICAÇÃO", valor: 6, pct: 3, color: "#F5A623" },
  { origem: "PROSPECÇÃO", valor: 3, pct: 1, color: "#6B7A99" },
];

export const solPerformance = {
  scoreMedio: 61,
  taxaQualificacao: 35,
  respostMedia: 8,
  agendados: 79,
  temperaturas: [
    { label: "QUENTE", pct: 16.5, color: "#EF476F" },
    { label: "MORNO", pct: 76.5, color: "#F5A623" },
    { label: "FRIO", pct: 7.0, color: "#118AB2" },
  ],
};

export const atividadeRecente = [
  { icon: "🔥", nome: "Marcos Giacomo", detalhe: "Score 60 · agendado · há 26min", badge: "Proposta enviada", badgeColor: "#F5A623" },
  { icon: "⚡", nome: "Luiz Soares", detalhe: "Qualificado pela Sol · há 2h", badge: "Novo lead", badgeColor: "#06D6A0" },
  { icon: "📅", nome: "Adriana Garcia", detalhe: "Reunião 25/02 10h · há 4h", badge: "Agendado", badgeColor: "#118AB2" },
  { icon: "🌡️", nome: "Marcelo Urbano", detalhe: "Proposta R$ 15.523 · há 1 dia", badge: "Proposta", badgeColor: "#8B5CF6" },
  { icon: "🤖", nome: "Sol SDR ativa", detalhe: "8 leads qualificados hoje", badge: "24/02", badgeColor: "#6B7A99" },
];
