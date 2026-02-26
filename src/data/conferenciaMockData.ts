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
  { origem: "Meta", share: 52, conversao: 18 },
  { origem: "Google", share: 18, conversao: 31 },
  { origem: "Site", share: 16, conversao: 38 },
  { origem: "Orgânico", share: 8, conversao: 29 },
  { origem: "Indicação", share: 6, conversao: 67 },
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

// ─── SOL HOJE — Atividade Diária (7 dias) ───
export const solHojeMock = [
  { dia: "Seg", qualificados: 14, scores: 12, quentes: 3, mornos: 8, frios: 3 },
  { dia: "Ter", qualificados: 18, scores: 16, quentes: 5, mornos: 9, frios: 4 },
  { dia: "Qua", qualificados: 21, scores: 19, quentes: 6, mornos: 11, frios: 4 },
  { dia: "Qui", qualificados: 15, scores: 13, quentes: 4, mornos: 8, frios: 3 },
  { dia: "Sex", qualificados: 12, scores: 10, quentes: 2, mornos: 7, frios: 3 },
  { dia: "Sáb", qualificados: 8, scores: 7, quentes: 1, mornos: 5, frios: 2 },
  { dia: "Dom", qualificados: 6, scores: 5, quentes: 1, mornos: 3, frios: 2 },
];

// ─── ALERTAS & INSIGHTS ───
export const alertasMock = [
  { type: "danger" as const, title: "12 leads quentes sem contato há +48h", desc: "Risco de perda iminente" },
  { type: "warning" as const, title: "Taxa de resposta caiu 8% vs semana anterior", desc: "Verificar qualidade dos leads Meta" },
  { type: "success" as const, title: "FUP Frio resgatou R$ 42k esta semana", desc: "25% acima da média" },
  { type: "warning" as const, title: "3 leads mornos parados há +5 dias em Closer", desc: "Considerar follow-up manual" },
  { type: "success" as const, title: "Agendamentos subiram 18% vs mês anterior", desc: "Melhor mês do trimestre" },
  { type: "danger" as const, title: "SLA de 5min violado em 6% dos leads hoje", desc: "Horário de pico: 19h–21h" },
];

// ─── TEMPERATURA POR ETAPA ───
export const temperaturaPorEtapaMock = [
  { etapa: "Robô SOL", quente: 28, morno: 214, frio: 100 },
  { etapa: "Qualificação", quente: 22, morno: 138, frio: 38 },
  { etapa: "Qualificado", quente: 18, morno: 62, frio: 14 },
  { etapa: "Closer", quente: 15, morno: 38, frio: 8 },
  { etapa: "Proposta", quente: 12, morno: 22, frio: 4 },
  { etapa: "Fechado", quente: 8, morno: 3, frio: 0 },
];

// ─── TABELA DE LEADS DETALHADOS ───
// ─── SLA METRICS (mock) ───
export const slaMock = {
  primeiroAtendimento: { media: 2.1, pctDentro24h: 87, total: 342 },
  porEtapa: [
    { etapa: "Robô SOL", slaDias: 1, mediaDias: 0.3, status: "ok" as const },
    { etapa: "Qualificação", slaDias: 3, mediaDias: 2.1, status: "ok" as const },
    { etapa: "Qualificado", slaDias: 5, mediaDias: 4.2, status: "warning" as const },
    { etapa: "Closer", slaDias: 7, mediaDias: 8.5, status: "overdue" as const },
    { etapa: "Proposta", slaDias: 10, mediaDias: 6.3, status: "ok" as const },
  ],
  robos: { tempoResposta: "10s", leadsAguardando: 18, taxaResposta: 58 },
  geralProposta: { mediaDias: 12.4 },
};

// ─── ROBOT INSIGHTS (mock) ───
export const robotInsightsMock = {
  destaques: [
    { label: "Leads Qualificados", value: 94, icon: "bot" as const, color: "text-primary" },
    { label: "Mensagens Enviadas", value: 2847, icon: "send" as const, color: "text-foreground" },
    { label: "Contatos Únicos", value: 342, icon: "users" as const, color: "text-primary" },
    { label: "Leads Quentes", value: 47, icon: "flame" as const, color: "text-orange-500" },
  ],
  comparacao: {
    sol: { nome: "SOL (Qualificação)", taxaResposta: 58, tempoMedioResposta: "10s", leadsProcessados: 342 },
    fup: { nome: "FUP Frio", taxaResposta: 25, tempoMedioResposta: "8.4d", leadsProcessados: 124 },
  },
  funilMensagens: [
    { etapa: "Enviadas", valor: 2847 },
    { etapa: "Entregues", valor: 2790 },
    { etapa: "Lidas", valor: 1985 },
    { etapa: "Respondidas", valor: 1203 },
    { etapa: "Qualificadas", valor: 94 },
  ],
  alertasUrgentes: [
    { tipo: "danger" as const, titulo: "8 leads quentes sem contato do robô há +24h", desc: "Verificar integração Make" },
    { tipo: "warning" as const, titulo: "15 leads responderam mas não avançaram", desc: "Possível gargalo na qualificação BANT" },
    { tipo: "danger" as const, titulo: "5 leads sem resposta há +3 dias", desc: "Considerar transferência para FUP Frio" },
  ],
};

// ─── SCORE POR ORIGEM (mock) ───
export const scorePorOrigemMock = [
  { origem: "Indicação", score: 78, leads: 21 },
  { origem: "Site", score: 72, leads: 55 },
  { origem: "Google", score: 65, leads: 62 },
  { origem: "Orgânico", score: 61, leads: 27 },
  { origem: "Meta", score: 54, leads: 178 },
];

export const tabelaLeadsMock = [
  { id: 1, nome: "João Silva", etapa: "Closer", temperatura: "QUENTE" as const, score: 87, sla: 1.2, statusFup: "Ativo", valor: 45000, historico: [
    { data: "25/02 14:30", tipo: "SOL", msg: "Lead qualificado via BANT — orçamento confirmado R$ 45k" },
    { data: "25/02 14:32", tipo: "SOL", msg: "Agendamento transferido para Closer" },
    { data: "26/02 09:15", tipo: "Closer", msg: "Ligação realizada — proposta em elaboração" },
  ]},
  { id: 2, nome: "Maria Santos", etapa: "Qualificado", temperatura: "QUENTE" as const, score: 92, sla: 0.5, statusFup: "Ativo", valor: 68000, historico: [
    { data: "26/02 10:00", tipo: "SOL", msg: "Qualificação BANT completa — interesse alto" },
    { data: "26/02 10:05", tipo: "SOL", msg: "Score 92 atribuído — lead prioritário" },
  ]},
  { id: 3, nome: "Carlos Oliveira", etapa: "Proposta", temperatura: "MORNO" as const, score: 71, sla: 3.1, statusFup: "Aguardando", valor: 32000, historico: [
    { data: "23/02 16:00", tipo: "SOL", msg: "Lead qualificado — budget parcialmente confirmado" },
    { data: "24/02 11:30", tipo: "Closer", msg: "Proposta enviada por email" },
    { data: "26/02 08:00", tipo: "FUP", msg: "Follow-up agendado para hoje" },
  ]},
  { id: 4, nome: "Ana Pereira", etapa: "Qualificação", temperatura: "MORNO" as const, score: 58, sla: 1.8, statusFup: "Ativo", valor: 22000, historico: [
    { data: "25/02 20:30", tipo: "SOL", msg: "Primeiro contato — interesse demonstrado" },
    { data: "26/02 09:00", tipo: "SOL", msg: "Tentativa 2 de qualificação BANT" },
  ]},
  { id: 5, nome: "Pedro Costa", etapa: "Fechado", temperatura: "QUENTE" as const, score: 95, sla: 0.3, statusFup: "Concluído", valor: 85000, historico: [
    { data: "20/02 09:00", tipo: "SOL", msg: "Lead qualificado rapidamente — urgência alta" },
    { data: "21/02 14:00", tipo: "Closer", msg: "Reunião realizada — proposta aceita" },
    { data: "22/02 10:00", tipo: "Closer", msg: "Contrato assinado" },
  ]},
  { id: 6, nome: "Fernanda Lima", etapa: "Closer", temperatura: "MORNO" as const, score: 65, sla: 2.5, statusFup: "Ativo", valor: 38000, historico: [
    { data: "24/02 11:00", tipo: "SOL", msg: "Qualificação concluída — timing incerto" },
  ]},
  { id: 7, nome: "Ricardo Souza", etapa: "Robô SOL", temperatura: "FRIO" as const, score: 22, sla: 0.1, statusFup: "Novo", valor: 0, historico: [
    { data: "26/02 13:45", tipo: "SOL", msg: "Primeiro contato enviado — aguardando resposta" },
  ]},
  { id: 8, nome: "Luciana Ferreira", etapa: "Qualificado", temperatura: "QUENTE" as const, score: 88, sla: 0.8, statusFup: "Ativo", valor: 55000, historico: [
    { data: "25/02 18:00", tipo: "SOL", msg: "BANT completo — decisor identificado" },
    { data: "26/02 08:30", tipo: "SOL", msg: "Transferência para Closer em andamento" },
  ]},
  { id: 9, nome: "Marcos Almeida", etapa: "Qualificação", temperatura: "FRIO" as const, score: 31, sla: 4.2, statusFup: "FUP Frio", valor: 15000, historico: [
    { data: "22/02 10:00", tipo: "SOL", msg: "Contato inicial — sem resposta" },
    { data: "23/02 10:00", tipo: "SOL", msg: "2ª tentativa — sem resposta" },
    { data: "25/02 10:00", tipo: "FUP", msg: "Transferido para FUP Frio" },
  ]},
  { id: 10, nome: "Juliana Rocha", etapa: "Proposta", temperatura: "QUENTE" as const, score: 84, sla: 1.5, statusFup: "Ativo", valor: 72000, historico: [
    { data: "24/02 09:00", tipo: "SOL", msg: "Lead qualificado — orçamento alto" },
    { data: "25/02 15:00", tipo: "Closer", msg: "Proposta personalizada enviada" },
  ]},
  { id: 11, nome: "Bruno Mendes", etapa: "Closer", temperatura: "MORNO" as const, score: 62, sla: 3.0, statusFup: "Aguardando", valor: 28000, historico: [
    { data: "23/02 14:00", tipo: "SOL", msg: "Qualificação parcial — budget não confirmado" },
  ]},
  { id: 12, nome: "Camila Dias", etapa: "Robô SOL", temperatura: "MORNO" as const, score: 45, sla: 0.2, statusFup: "Novo", valor: 0, historico: [
    { data: "26/02 12:00", tipo: "SOL", msg: "Contato inicial — respondeu com interesse" },
  ]},
  { id: 13, nome: "Rafael Nunes", etapa: "Qualificado", temperatura: "MORNO" as const, score: 69, sla: 1.1, statusFup: "Ativo", valor: 41000, historico: [
    { data: "25/02 11:00", tipo: "SOL", msg: "BANT parcialmente completo" },
  ]},
  { id: 14, nome: "Patrícia Gomes", etapa: "Qualificação", temperatura: "FRIO" as const, score: 28, sla: 5.0, statusFup: "FUP Frio", valor: 12000, historico: [
    { data: "21/02 16:00", tipo: "SOL", msg: "Sem resposta após 3 tentativas" },
    { data: "24/02 10:00", tipo: "FUP", msg: "Entrou em FUP Frio" },
  ]},
  { id: 15, nome: "Thiago Barbosa", etapa: "Fechado", temperatura: "QUENTE" as const, score: 91, sla: 0.4, statusFup: "Concluído", valor: 93000, historico: [
    { data: "19/02 08:00", tipo: "SOL", msg: "Lead qualificado — necessidade urgente" },
    { data: "20/02 10:00", tipo: "Closer", msg: "Proposta aceita imediatamente" },
    { data: "20/02 16:00", tipo: "Closer", msg: "Contrato assinado — R$ 93k" },
  ]},
];
