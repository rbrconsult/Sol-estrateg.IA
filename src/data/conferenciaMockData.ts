// ══════════════════════════════════════════════════════════
// DADOS — PAINEL DE CONTROLE DENSO · SOL INSIGHTS
// Demo Jan–Fev 2026 — RBR Consult
// ══════════════════════════════════════════════════════════

// ─── ROW 1: KPIs PRINCIPAIS (7 cards — inclui Repescagem) ───
// Dados calibrados para apresentação 01/03 — início de operação
export const kpiCards = [
  { label: "Leads Recebidos", value: 18, suffix: "", detail: "100%" },
  { label: "Taxa Resposta", value: 61, suffix: "%", detail: "11/18" },
  { label: "MQL", value: 3, suffix: "", detail: "16.7%", tooltip: "Marketing Qualified Leads" },
  { label: "SQL", value: 2, suffix: "", detail: "66.7%", tooltip: "Sales Qualified Leads" },
  { label: "Agendamentos", value: 1, suffix: "", detail: "50%" },
  { label: "Fechados", value: 0, suffix: "", detail: "—" },
  { label: "Resgatados FUP", value: 1, suffix: "", detail: "R$ 6k", tooltip: "Leads recuperados via FUP Frio" },
];

// ─── PIPELINE REAL: SOL → Qualificação → Closer → Fechamento ───
export const pipelineStages = [
  { etapa: "Robô SOL", valor: 18, icon: "🤖", desc: "Leads recebidos e abordados pela IA" },
  { etapa: "Qualificação", valor: 11, icon: "🎯", desc: "Em processo de qualificação BANT" },
  { etapa: "Qualificado", valor: 3, icon: "✅", desc: "MQL aprovados pela SOL" },
  { etapa: "Closer", valor: 2, icon: "📞", desc: "Transferidos para Closer humano" },
  { etapa: "Proposta", valor: 1, icon: "📋", desc: "Agendamento / proposta enviada" },
  { etapa: "Fechado", valor: 0, icon: "🏆", desc: "Contratos assinados" },
];

// ─── FUP FRIO — REPESCAGEM (dados expandidos com ROI) ───
export const fupFrio = {
  entraram: 7,
  reativados: 1,
  pctReativados: 14.3,
  diasAteReativar: 2.1,
  valorRecuperado: "R$ 6.000",
  ticketMedio: "R$ 6.000",
  conversaoPosResgate: 0,
  receitaTotal: "R$ 0",
  pctReceitaViaFup: 0,
};

// ─── ROW 2: ORIGEM DOS LEADS ───
export const origemLeads = [
  { origem: "Meta", share: 56, conversao: 15 },
  { origem: "Google", share: 22, conversao: 25 },
  { origem: "Site", share: 11, conversao: 33 },
  { origem: "Orgânico", share: 6, conversao: 0 },
  { origem: "Indicação", share: 5, conversao: 100 },
];

// (fupFrio movido para cima junto com pipeline)

// ─── ROW 3: MOTIVOS DE DESQUALIFICAÇÃO ───
export const desqualMotivos = [
  { motivo: "Problemas de Financiamento", pct: 34, fill: "hsl(var(--destructive))" },
  { motivo: "Consumo Desqualificado", pct: 22, fill: "hsl(var(--warning))" },
  { motivo: "Timing", pct: 19, fill: "hsl(var(--primary))" },
  { motivo: "Sem interesse/Curioso", pct: 15, fill: "hsl(var(--muted-foreground))" },
  { motivo: "Outros", pct: 10, fill: "hsl(var(--accent-foreground))" },
];

// ─── ROW 4: MENSAGENS ───
export const mensagens = {
  enviadas: 142,
  recebidas: 67,
  interacoesPorConv: 7.9,
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

// ─── SOL HOJE — Atividade Diária (7 dias) ───
// Atividade 23/02 a 01/03 — ramp-up com 3 qualificados no dia 01/03
export const solHojeMock = [
  { dia: "23/02", qualificados: 0, scores: 0, quentes: 0, mornos: 0, frios: 0 },
  { dia: "24/02", qualificados: 1, scores: 1, quentes: 0, mornos: 1, frios: 0 },
  { dia: "25/02", qualificados: 2, scores: 2, quentes: 0, mornos: 1, frios: 1 },
  { dia: "26/02", qualificados: 3, scores: 3, quentes: 1, mornos: 1, frios: 1 },
  { dia: "27/02", qualificados: 4, scores: 3, quentes: 1, mornos: 2, frios: 1 },
  { dia: "28/02", qualificados: 5, scores: 4, quentes: 1, mornos: 3, frios: 1 },
  { dia: "01/03", qualificados: 3, scores: 3, quentes: 1, mornos: 1, frios: 1 },
];

// ─── ALERTAS & INSIGHTS ───
export const alertasMock = [
  { type: "success" as const, title: "SOL ativada — primeiros 18 leads abordados", desc: "Operação iniciada em 23/02" },
  { type: "success" as const, title: "3 leads qualificados em 01/03", desc: "Taxa de qualificação acima do esperado para início" },
  { type: "warning" as const, title: "1 lead morno sem contato há +24h", desc: "Considerar follow-up" },
  { type: "success" as const, title: "SLA de 5min mantido em 94% dos leads", desc: "Excelente para período inicial" },
  { type: "info" as const, title: "Primeiros resultados de FUP Frio", desc: "1 lead resgatado — R$ 6k" },
];

// ─── TEMPERATURA POR ETAPA ───
export const temperaturaPorEtapaMock = [
  { etapa: "Robô SOL", quente: 2, morno: 10, frio: 6 },
  { etapa: "Qualificação", quente: 1, morno: 7, frio: 3 },
  { etapa: "Qualificado", quente: 1, morno: 1, frio: 1 },
  { etapa: "Closer", quente: 1, morno: 1, frio: 0 },
  { etapa: "Proposta", quente: 1, morno: 0, frio: 0 },
  { etapa: "Fechado", quente: 0, morno: 0, frio: 0 },
];

// ─── TABELA DE LEADS DETALHADOS ───
// ─── SLA METRICS (mock) ───
export const slaMock = {
  primeiroAtendimento: { media: 0.8, pctDentro24h: 94, total: 18 },
  porEtapa: [
    { etapa: "Robô SOL", slaDias: 1, mediaDias: 0.1, status: "ok" as const },
    { etapa: "Qualificação", slaDias: 3, mediaDias: 1.2, status: "ok" as const },
    { etapa: "Qualificado", slaDias: 5, mediaDias: 2.0, status: "ok" as const },
    { etapa: "Closer", slaDias: 7, mediaDias: 1.5, status: "ok" as const },
    { etapa: "Proposta", slaDias: 10, mediaDias: 0, status: "ok" as const },
  ],
  robos: { tempoResposta: "8s", leadsAguardando: 2, taxaResposta: 61 },
  geralProposta: { mediaDias: 3.2 },
};

// ─── ROBOT INSIGHTS (mock) ───
export const robotInsightsMock = {
  destaques: [
    { label: "Leads Qualificados", value: 3, icon: "bot" as const, color: "text-primary" },
    { label: "Mensagens Enviadas", value: 142, icon: "send" as const, color: "text-foreground" },
    { label: "Contatos Únicos", value: 18, icon: "users" as const, color: "text-primary" },
    { label: "Leads Quentes", value: 2, icon: "flame" as const, color: "text-orange-500" },
  ],
  comparacao: {
    sol: { nome: "SOL (Qualificação)", taxaResposta: 61, tempoMedioResposta: "8s", leadsProcessados: 18 },
    fup: { nome: "FUP Frio", taxaResposta: 14, tempoMedioResposta: "2.1d", leadsProcessados: 7 },
  },
  funilMensagens: [
    { etapa: "Enviadas", valor: 142 },
    { etapa: "Entregues", valor: 139 },
    { etapa: "Lidas", valor: 98 },
    { etapa: "Respondidas", valor: 67 },
    { etapa: "Qualificadas", valor: 3 },
  ],
  alertasUrgentes: [
    { tipo: "warning" as const, titulo: "1 lead morno sem contato há +24h", desc: "Acompanhar qualificação" },
    { tipo: "success" as const, titulo: "Taxa de resposta acima de 60%", desc: "Início promissor da operação" },
  ],
};

// ─── SCORE POR ORIGEM (mock) ───
export const scorePorOrigemMock = [
  { origem: "Indicação", score: 82, leads: 1 },
  { origem: "Site", score: 68, leads: 2 },
  { origem: "Google", score: 59, leads: 4 },
  { origem: "Orgânico", score: 45, leads: 1 },
  { origem: "Meta", score: 51, leads: 10 },
];

export const tabelaLeadsMock = [
  { id: 1, nome: "Carlos Mendes", etapa: "Qualificado", temperatura: "QUENTE" as const, score: 85, sla: 0.5, statusFup: "Ativo", valor: 42000, historico: [
    { data: "26/02 10:00", tipo: "SOL", msg: "Primeiro contato — interesse imediato" },
    { data: "27/02 09:30", tipo: "SOL", msg: "BANT completo — orçamento R$ 42k confirmado" },
    { data: "01/03 08:00", tipo: "SOL", msg: "Qualificado — transferido para Closer" },
  ]},
  { id: 2, nome: "Ana Beatriz Costa", etapa: "Qualificado", temperatura: "MORNO" as const, score: 72, sla: 0.8, statusFup: "Ativo", valor: 28000, historico: [
    { data: "25/02 14:00", tipo: "SOL", msg: "Primeiro contato via Meta" },
    { data: "27/02 11:00", tipo: "SOL", msg: "Resposta positiva — iniciando BANT" },
    { data: "28/02 16:00", tipo: "SOL", msg: "Qualificação parcial — budget pendente" },
    { data: "01/03 09:15", tipo: "SOL", msg: "Qualificada — budget confirmado R$ 28k" },
  ]},
  { id: 3, nome: "Roberto Almeida", etapa: "Qualificado", temperatura: "QUENTE" as const, score: 88, sla: 0.3, statusFup: "Ativo", valor: 55000, historico: [
    { data: "28/02 08:00", tipo: "SOL", msg: "Lead via Indicação — alta urgência" },
    { data: "28/02 08:05", tipo: "SOL", msg: "BANT completo em 1ª interação" },
    { data: "01/03 07:45", tipo: "SOL", msg: "Qualificado — decisor confirmado" },
  ]},
  { id: 4, nome: "Juliana Ferreira", etapa: "Qualificação", temperatura: "MORNO" as const, score: 54, sla: 1.2, statusFup: "Ativo", valor: 0, historico: [
    { data: "26/02 20:00", tipo: "SOL", msg: "Contato inicial fora do horário" },
    { data: "27/02 09:00", tipo: "SOL", msg: "Resposta recebida — interesse médio" },
    { data: "28/02 10:00", tipo: "SOL", msg: "2ª interação BANT — em andamento" },
  ]},
  { id: 5, nome: "Fernando Lima", etapa: "Qualificação", temperatura: "FRIO" as const, score: 31, sla: 2.5, statusFup: "FUP Frio", valor: 0, historico: [
    { data: "24/02 15:00", tipo: "SOL", msg: "Contato inicial — sem resposta" },
    { data: "25/02 15:00", tipo: "SOL", msg: "2ª tentativa — sem resposta" },
    { data: "27/02 10:00", tipo: "FUP", msg: "Transferido para FUP Frio" },
  ]},
  { id: 6, nome: "Mariana Santos", etapa: "Closer", temperatura: "QUENTE" as const, score: 79, sla: 0.6, statusFup: "Ativo", valor: 35000, historico: [
    { data: "27/02 11:00", tipo: "SOL", msg: "Lead qualificado rapidamente" },
    { data: "28/02 14:00", tipo: "Closer", msg: "Ligação agendada para 01/03" },
  ]},
  { id: 7, nome: "Lucas Rodrigues", etapa: "Robô SOL", temperatura: "MORNO" as const, score: 42, sla: 0.1, statusFup: "Novo", valor: 0, historico: [
    { data: "01/03 10:30", tipo: "SOL", msg: "Primeiro contato enviado — aguardando resposta" },
  ]},
  { id: 8, nome: "Patrícia Gomes", etapa: "Robô SOL", temperatura: "FRIO" as const, score: 18, sla: 0.1, statusFup: "Novo", valor: 0, historico: [
    { data: "01/03 11:00", tipo: "SOL", msg: "Contato inicial — lead Meta" },
  ]},
  { id: 9, nome: "Ricardo Souza", etapa: "Qualificação", temperatura: "MORNO" as const, score: 48, sla: 1.8, statusFup: "Ativo", valor: 0, historico: [
    { data: "25/02 09:00", tipo: "SOL", msg: "Primeiro contato" },
    { data: "26/02 14:00", tipo: "SOL", msg: "Respondeu com dúvidas" },
    { data: "28/02 09:00", tipo: "SOL", msg: "Em qualificação BANT" },
  ]},
  { id: 10, nome: "Camila Oliveira", etapa: "Proposta", temperatura: "QUENTE" as const, score: 91, sla: 0.4, statusFup: "Ativo", valor: 48000, historico: [
    { data: "25/02 08:00", tipo: "SOL", msg: "Lead qualificado — projeto urgente" },
    { data: "26/02 10:00", tipo: "Closer", msg: "Reunião realizada" },
    { data: "28/02 15:00", tipo: "Closer", msg: "Proposta enviada — R$ 48k" },
  ]},
];
