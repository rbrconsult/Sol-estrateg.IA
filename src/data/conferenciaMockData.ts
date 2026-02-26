// ══════════════════════════════════════════════════════════
// DADOS — PAINEL DE CONTROLE DENSO · SOL INSIGHTS
// Demo Jan–Fev 2026 — RBR Consult
// ══════════════════════════════════════════════════════════

// ─── ROW 1: KPIs PRINCIPAIS ───
export const kpiCards = [
  { label: "Leads Recebidos", value: 342, suffix: "" },
  { label: "Taxa Resposta", value: 58, suffix: "%" },
  { label: "MQL", value: 94, suffix: "" },
  { label: "SQL", value: 61, suffix: "" },
  { label: "Agendamentos", value: 38, suffix: "" },
  { label: "Fechados", value: 11, suffix: "" },
];

// ─── ROW 2: FUNIL ───
export const funnelData = [
  { etapa: "Leads", valor: 342 },
  { etapa: "Respondidos", valor: 198 },
  { etapa: "MQL", valor: 94 },
  { etapa: "SQL", valor: 61 },
  { etapa: "Agendados", valor: 38 },
  { etapa: "Fechados", valor: 11 },
];

// ─── ROW 2: ORIGEM DOS LEADS ───
export const origemLeads = [
  { origem: "Meta", share: 52, conversao: 18 },
  { origem: "Google", share: 18, conversao: 31 },
  { origem: "Site", share: 16, conversao: 38 },
  { origem: "Orgânico", share: 8, conversao: 29 },
  { origem: "Indicação", share: 6, conversao: 67 },
];

// ─── ROW 3: FUP FRIO ───
export const fupFrio = {
  entraram: 124,
  reativados: 31,
  pctReativados: 25,
  diasAteReativar: 8.4,
};

// ─── ROW 3: MOTIVOS DE DESQUALIFICAÇÃO ───
export const desqualMotivos = [
  { motivo: "Sem condição", pct: 34, fill: "hsl(var(--destructive))" },
  { motivo: "Imóvel inelegível", pct: 22, fill: "hsl(var(--warning))" },
  { motivo: "Timing", pct: 19, fill: "hsl(var(--primary))" },
  { motivo: "Sem interesse", pct: 15, fill: "hsl(var(--muted-foreground))" },
  { motivo: "Outros", pct: 10, fill: "hsl(var(--accent-foreground))" },
];

// ─── ROW 4: MENSAGENS ───
export const mensagens = {
  enviadas: 2847,
  recebidas: 1203,
  interacoesPorConv: 14.2,
};

// ─── ROW 4: SLA ───
export const sla = {
  pctAbordados5min: 94,
  tempoMedioRespostaLead: "4h 17min",
};

// ─── ROW 5: HEATMAP ───
export const heatmap = {
  dias: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
  periodos: ["Manhã", "Tarde", "Noite"],
  valores: [
    [45, 82, 88, 60, 55, 30, 15], // Manhã
    [50, 70, 75, 65, 58, 35, 20], // Tarde
    [30, 85, 90, 50, 40, 25, 10], // Noite
  ],
  pico: "Ter/Qua 10h–12h e 19h–21h",
};

// ─── ROW 6: TAXA POR TENTATIVA ───
export const taxaPorTentativa = [
  { tentativa: "1ª msg", pct: 42 },
  { tentativa: "2ª msg", pct: 28 },
  { tentativa: "3ª msg", pct: 18 },
  { tentativa: "4ª+", pct: 12 },
];

// ─── DADOS LEGADOS (mantidos para compatibilidade) ───
export const problemData = {
  semResposta: 63,
  tempoMedioResposta: 29,
  compraPrimeiro: 78,
  custoTriagemHumana: { min: 2, max: 5 },
  custoLeadHumano: { min: 60, max: 140 },
};

export const solucaoData = {
  tempoResposta: 10,
  aumentoConversao: 381,
  velocidadeQualif: "3-5×",
  disponibilidade: "24/7",
  metodoBANT: true,
  custoLeadSol: { min: 2, max: 8 },
};

export const roiData = {
  aumentoLeadsQualificados: 40,
  taxaAgendamentoMin: 15,
  taxaAgendamentoMax: 52,
  custoLeadSol: 6,
  custoSDRHumano: 420,
  economiaMensal: 11400,
  dadosCRM: 100,
};

export const kpis = [
  { label: "Leads Recebidos", value: 801, trend: null },
  { label: "Qualificados Sol", value: 284, trend: 35.4 },
  { label: "Leads Quentes", value: 47, trend: null },
  { label: "Agendamentos", value: 79, trend: 52 },
  { label: "ROI Estimado", value: 4.2, suffix: "×", isDecimal: true, trend: null },
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
  { type: "alert" as const, title: "63% das empresas ignoram seus leads", description: "" },
  { type: "ok" as const, title: "Sol responde em 10 segundos", description: "" },
  { type: "ok" as const, title: "Agendamentos subiram 52%", description: "" },
  { type: "info" as const, title: "47% dos leads chegam fora do horário", description: "" },
  { type: "ok" as const, title: "100% dos dados no CRM", description: "" },
];

export const leadsTable: any[] = [];
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
export const atividadeRecente: any[] = [];
export const antesDepois: any[] = [];
