// ══════════════════════════════════════════════════════════
// DADOS ALINHADOS COM A APRESENTAÇÃO EVOLVE ENERGIA SOLAR
// Convenção Fevereiro 2026 — RBR Consult
// ══════════════════════════════════════════════════════════

// ─── SEÇÃO 1: O PROBLEMA (Customer Experience Gap) ───
export const problemData = {
  semResposta: 63,         // % empresas que nunca respondem leads
  tempoMedioResposta: 29,  // horas — média de mercado
  compraPrimeiro: 78,      // % compradores fecham com quem responde primeiro
  custoTriagemHumana: { min: 2, max: 5 }, // horas por lead (SDR humano)
  custoLeadHumano: { min: 60, max: 140 }, // R$ por lead qualificado (SDR)
};

// ─── SEÇÃO 2: A SOLUÇÃO SOL ───
export const solucaoData = {
  tempoResposta: 10,        // segundos
  aumentoConversao: 381,    // % vs 30min de espera
  velocidadeQualif: "3-5×", // mais rápido que humano
  disponibilidade: "24/7",
  metodoBANT: true,
  custoLeadSol: { min: 2, max: 8 }, // R$ por lead qualificado
};

// ─── SEÇÃO 3: IMPACTO & ROI ───
export const roiData = {
  aumentoLeadsQualificados: 40,  // %
  taxaAgendamentoMin: 15,        // %
  taxaAgendamentoMax: 52,        // %
  custoLeadSol: 6,               // R$ médio real
  custoSDRHumano: 420,           // R$ médio real (com encargos)
  economiaMensal: 11400,         // R$
  dadosCRM: 100,                 // % dados inseridos
};

// ─── KPIs REAIS DA OPERAÇÃO EVOLVE ───
export const kpis = [
  { label: "Leads Recebidos", value: 801, trend: null },
  { label: "Qualificados Sol", value: 284, trend: 35.4 },
  { label: "Leads Quentes", value: 47, trend: null },
  { label: "Agendamentos", value: 79, trend: 52 },
  { label: "ROI Estimado", value: 4.2, suffix: "×", isDecimal: true, trend: null },
];

// ─── FUNIL DE LEADS (sequência operacional) ───
export const funnelData = [
  { etapa: "TRÁFEGO PAGO", valor: 801 },
  { etapa: "ROBÔ SOL", valor: 284 },
  { etapa: "QUALIFICAÇÃO", valor: 14 },
  { etapa: "QUALIFICADO", valor: 10 },
  { etapa: "FUP FRIO", valor: 6 },
  { etapa: "FUP FIO", valor: 1 },
  { etapa: "DESQUALIFICADOS", valor: 801 - 284 },
];

// ─── LEADS POR SEMANA ───
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

// ─── INSIGHTS ESTRATÉGICOS ───
export const insights = [
  {
    type: "alert" as const,
    title: "63% das empresas ignoram seus leads",
    description: "A média de resposta do mercado é 29 horas. Quem responde primeiro fecha 78% das vendas.",
  },
  {
    type: "ok" as const,
    title: "Sol responde em 10 segundos",
    description: "+381% de conversão vs 30 min de espera. Operação 24/7 capturando leads fora do horário comercial.",
  },
  {
    type: "ok" as const,
    title: "Agendamentos subiram 52%",
    description: "Taxa de agendamento de 18% para 27% com qualificação BANT automatizada.",
  },
  {
    type: "info" as const,
    title: "47% dos leads chegam fora do horário",
    description: "Noites e fins de semana. Sem a Sol, esses leads iriam para a concorrência.",
  },
  {
    type: "ok" as const,
    title: "100% dos dados no CRM",
    description: "284 leads qualificados com 100% dos dados inseridos no CRM. Decisões baseadas em dados, não suposições.",
  },
];

// ─── TABELA DE LEADS QUALIFICADOS ───
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

// ─── ORIGEM DOS LEADS ───
export const origemLeads = [
  { origem: "SITE", valor: 70, pct: 33 },
  { origem: "FACEBOOK", valor: 52, pct: 24 },
  { origem: "GOOGLE", valor: 12, pct: 6 },
  { origem: "ORGÂNICO", valor: 11, pct: 5 },
  { origem: "INDICAÇÃO", valor: 6, pct: 3 },
  { origem: "PROSPECÇÃO", valor: 3, pct: 1 },
];

// ─── PERFORMANCE DA SOL ───
export const solPerformance = {
  scoreMedio: 61,
  taxaQualificacao: 35,
  respostMedia: 8,
  agendados: 79,
  temperaturas: [
    { label: "QUENTE", pct: 16.5 },
    { label: "MORNO", pct: 76.5 },
    { label: "FRIO", pct: 7.0 },
  ],
};

// ─── ATIVIDADE RECENTE ───
export const atividadeRecente = [
  { icon: "🔥", nome: "Marcos Giacomo", detalhe: "Score 60 · agendado · há 26min", badge: "Proposta enviada" },
  { icon: "⚡", nome: "Luiz Soares", detalhe: "Qualificado pela Sol · há 2h", badge: "Novo lead" },
  { icon: "📅", nome: "Adriana Garcia", detalhe: "Reunião 25/02 10h · há 4h", badge: "Agendado" },
  { icon: "🌡️", nome: "Marcelo Urbano", detalhe: "Proposta R$ 15.523 · há 1 dia", badge: "Proposta" },
  { icon: "🤖", nome: "Sol SDR ativa", detalhe: "8 leads qualificados hoje", badge: "24/02" },
];

// ─── COMPARATIVO ANTES vs DEPOIS ───
export const antesDepois = [
  { metrica: "Tempo de Resposta", antes: "29 horas", depois: "10 segundos", impacto: "+381% conversão" },
  { metrica: "Custo por Lead Qualificado", antes: "R$ 60-140", depois: "R$ 2-8", impacto: "95% economia" },
  { metrica: "Qualificação", antes: "2-5h manual", depois: "Automática 24/7", impacto: "3-5× mais rápido" },
  { metrica: "Dados no CRM", antes: "Parcial / irregular", depois: "100% BANT", impacto: "Decisões por dados" },
  { metrica: "Leads fora do horário", antes: "Perdidos", depois: "100% atendidos", impacto: "47% captura extra" },
];
