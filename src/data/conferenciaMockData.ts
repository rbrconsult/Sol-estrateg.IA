// ══════════════════════════════════════════════════════════
// DADOS — PAINEL DE CONTROLE DENSO · SOL INSIGHTS
// Calibrado com métricas reais — RBR Consult
// ══════════════════════════════════════════════════════════
// ANTES: 2 SDRs × 100 contatos/mês = 200 leads | 10/dia cada
// DEPOIS: SOL SDR (IA) = 800 leads/mês (4×) | escala infinita
// Qualificação: 37% mantida → ganho estratégico imediato
// Conversão: 15% fechamento
// Agilidade: resposta em segundos vs horas → potencial +10% eficiência

// ─── ROW 1: KPIs PRINCIPAIS (7 cards — inclui Repescagem) ───
export const kpiCards = [
  { label: "Leads Recebidos", value: 800, suffix: "", detail: "4× a capacidade SDR" },
  { label: "Taxa Resposta", value: 61, suffix: "%", detail: "488/800" },
  { label: "MQL", value: 296, suffix: "", detail: "37%", tooltip: "Marketing Qualified Leads — taxa mantida do SDR humano" },
  { label: "SQL", value: 198, suffix: "", detail: "66.9%", tooltip: "Sales Qualified Leads" },
  { label: "Agendamentos", value: 148, suffix: "", detail: "74.7%" },
  { label: "Fechados", value: 120, suffix: "", detail: "15%", tooltip: "Taxa de conversão geral mantida" },
  { label: "Resgatados FUP", value: 34, suffix: "", detail: "R$ 238k", tooltip: "Leads recuperados via FUP Frio" },
];

// ─── PIPELINE REAL: SOL → Qualificação → Closer → Fechamento ───
export const pipelineStages = [
  { etapa: "Robô SOL", valor: 800, icon: "🤖", desc: "4× capacidade — antes: 200 (2 SDRs)" },
  { etapa: "Qualificação", valor: 488, icon: "🎯", desc: "61% taxa de resposta" },
  { etapa: "Qualificado", valor: 296, icon: "✅", desc: "37% — mesma taxa do SDR humano" },
  { etapa: "Closer", valor: 198, icon: "📞", desc: "Transferidos para Closer humano" },
  { etapa: "Proposta", valor: 148, icon: "📋", desc: "Agendamento / proposta enviada" },
  { etapa: "Fechado", valor: 120, icon: "🏆", desc: "15% conversão geral" },
];

// ─── FUP FRIO — REPESCAGEM (dados expandidos com ROI) ───
export const fupFrio = {
  entraram: 312,
  reativados: 34,
  pctReativados: 10.9,
  diasAteReativar: 3.2,
  valorRecuperado: "R$ 238.000",
  ticketMedio: "R$ 7.000",
  conversaoPosResgate: 12,
  receitaTotal: "R$ 238.000",
  pctReceitaViaFup: 4.2,
};

// ─── ROW 2: ORIGEM DOS LEADS ───
export const origemLeads = [
  { origem: "Meta", share: 56, conversao: 15 },
  { origem: "Google", share: 22, conversao: 25 },
  { origem: "Site", share: 11, conversao: 33 },
  { origem: "Orgânico", share: 6, conversao: 0 },
  { origem: "Indicação", share: 5, conversao: 100 },
];

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
  enviadas: 6400,
  recebidas: 3904,
  interacoesPorConv: 8.0,
};

// ─── ROW 4: SLA ───
export const sla = {
  pctAbordados5min: 98,
  tempoMedioRespostaLead: "12s",
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
  { label: "Leads Recebidos", value: 800, trend: null },
  { label: "Qualificados Sol", value: 296, trend: 37 },
  { label: "Leads Quentes", value: 132, trend: null },
  { label: "Agendamentos", value: 148, trend: 52 },
  { label: "ROI Estimado", value: 4.2, suffix: "×", isDecimal: true, trend: null },
];

export const weeklyLeads = [
  { semana: "S1", leads: 180 },
  { semana: "S2", leads: 195 },
  { semana: "S3", leads: 210 },
  { semana: "S4", leads: 215 },
];

export const insights = [
  { type: "alert" as const, title: "63% das empresas ignoram seus leads", description: "" },
  { type: "ok" as const, title: "Sol responde em 12 segundos", description: "" },
  { type: "ok" as const, title: "4× mais leads processados que SDR humano", description: "" },
  { type: "info" as const, title: "47% dos leads chegam fora do horário", description: "" },
  { type: "ok" as const, title: "100% dos dados no CRM", description: "" },
];

export const leadsTable: any[] = [];
export const solPerformance = {
  scoreMedio: 61,
  taxaQualificacao: 37,
  respostMedia: 12,
  agendados: 148,
  temperaturas: [
    { label: "QUENTE", pct: 16.5 },
    { label: "MORNO", pct: 76.5 },
    { label: "FRIO", pct: 7.0 },
  ],
};
export const atividadeRecente: any[] = [];
export const antesDepois: any[] = [];

// ─── SOL HOJE — Atividade Diária (7 dias) ───
// Soma = 296 qualificados (= MQL base), distribuídos por dia
// Quentes 16.5% = 49 | Mornos 76.5% = 226 | Frios 7% = 21
export const solHojeMock = [
  { dia: "Seg", qualificados: 48, scores: 44, quentes: 8, mornos: 37, frios: 3 },
  { dia: "Ter", qualificados: 52, scores: 48, quentes: 9, mornos: 40, frios: 3 },
  { dia: "Qua", qualificados: 50, scores: 46, quentes: 8, mornos: 38, frios: 4 },
  { dia: "Qui", qualificados: 46, scores: 42, quentes: 8, mornos: 35, frios: 3 },
  { dia: "Sex", qualificados: 44, scores: 40, quentes: 7, mornos: 34, frios: 3 },
  { dia: "Sáb", qualificados: 32, scores: 28, quentes: 5, mornos: 24, frios: 3 },
  { dia: "Dom", qualificados: 24, scores: 22, quentes: 4, mornos: 18, frios: 2 },
];

// ─── ALERTAS & INSIGHTS ───
export const alertasMock = [
  { type: "success" as const, title: "Capacidade 4× maior que 2 SDRs humanos", desc: "800 leads/mês vs 200 com SDR tradicional" },
  { type: "success" as const, title: "37% de qualificação mantida", desc: "Mesma taxa do SDR humano — ganho estratégico pela escala" },
  { type: "success" as const, title: "Tempo de resposta: 12s vs 4h17", desc: "Potencial de +10% na qualificação pela agilidade" },
  { type: "success" as const, title: "SLA de 5min mantido em 98% dos leads", desc: "Atendimento 24/7 sem perda de horário" },
  { type: "info" as const, title: "FUP Frio recuperou 34 leads — R$ 238k", desc: "10.9% de reativação dos leads não qualificados" },
] as { type: "danger" | "warning" | "success" | "info"; title: string; desc: string }[];

// ─── TEMPERATURA POR ETAPA ───
export const temperaturaPorEtapaMock = [
  { etapa: "Robô SOL", quente: 88, morno: 480, frio: 232 },
  { etapa: "Qualificação", quente: 54, morno: 342, frio: 92 },
  { etapa: "Qualificado", quente: 49, morno: 210, frio: 37 },
  { etapa: "Closer", quente: 42, morno: 138, frio: 18 },
  { etapa: "Proposta", quente: 38, morno: 98, frio: 12 },
  { etapa: "Fechado", quente: 35, morno: 75, frio: 10 },
];

// ─── TABELA DE LEADS DETALHADOS ───
// ─── SLA METRICS (mock) ───
export const slaMock = {
  primeiroAtendimento: { media: 0.2, pctDentro24h: 98, total: 800 },
  porEtapa: [
    { etapa: "Robô SOL", slaDias: 1, mediaDias: 0.01, status: "ok" as const },
    { etapa: "Qualificação", slaDias: 3, mediaDias: 1.2, status: "ok" as const },
    { etapa: "Qualificado", slaDias: 5, mediaDias: 2.0, status: "ok" as const },
    { etapa: "Closer", slaDias: 7, mediaDias: 1.5, status: "ok" as const },
    { etapa: "Proposta", slaDias: 10, mediaDias: 3.2, status: "ok" as const },
  ],
  robos: { tempoResposta: "12s", leadsAguardando: 8, taxaResposta: 61 },
  geralProposta: { mediaDias: 5.4 },
};

// ─── ROBOT INSIGHTS (mock) ───
export const robotInsightsMock = {
  destaques: [
    { label: "Leads Qualificados", value: 296, icon: "bot" as const, color: "text-primary" },
    { label: "Mensagens Enviadas", value: 6400, icon: "send" as const, color: "text-foreground" },
    { label: "Contatos Únicos", value: 800, icon: "users" as const, color: "text-primary" },
    { label: "Leads Quentes", value: 132, icon: "flame" as const, color: "text-orange-500" },
  ],
  comparacao: {
    sol: { nome: "SOL SDR (IA)", taxaResposta: 61, tempoMedioResposta: "12s", leadsProcessados: 800 },
    fup: { nome: "SDR Humano (antes)", taxaResposta: 37, tempoMedioResposta: "4h 17min", leadsProcessados: 200 },
  },
  funilMensagens: [
    { etapa: "Enviadas", valor: 6400 },
    { etapa: "Entregues", valor: 6272 },
    { etapa: "Lidas", valor: 4416 },
    { etapa: "Respondidas", valor: 3904 },
    { etapa: "Qualificadas", valor: 296 },
  ],
  alertasUrgentes: [
    { tipo: "success" as const, titulo: "4× capacidade vs SDR humano", desc: "800 leads/mês processados vs 200 antes" },
    { tipo: "success" as const, titulo: "Resposta em 12s vs 4h17 do SDR", desc: "Ganho de agilidade potencializa +10% na qualificação" },
    { tipo: "success" as const, titulo: "37% de qualificação mantida em escala", desc: "Mesma taxa com 4× o volume — ganho estratégico comprovado" },
  ],
};

// ─── SCORE POR ORIGEM (mock) ───
export const scorePorOrigemMock = [
  { origem: "Indicação", score: 82, leads: 40 },
  { origem: "Site", score: 68, leads: 88 },
  { origem: "Google", score: 59, leads: 176 },
  { origem: "Orgânico", score: 45, leads: 48 },
  { origem: "Meta", score: 51, leads: 448 },
];

export const tabelaLeadsMock = [
  { id: 1, nome: "Carlos Mendes", etapa: "Qualificado", temperatura: "QUENTE" as const, score: 85, sla: 0.01, statusFup: "Ativo", valor: 42000, historico: [
    { data: "10/02 10:00", tipo: "SOL", msg: "Primeiro contato — resposta em 12s" },
    { data: "10/02 10:05", tipo: "SOL", msg: "BANT completo — orçamento R$ 42k confirmado" },
    { data: "10/02 10:15", tipo: "SOL", msg: "Qualificado — transferido para Closer" },
  ]},
  { id: 2, nome: "Ana Beatriz Costa", etapa: "Qualificado", temperatura: "MORNO" as const, score: 72, sla: 0.01, statusFup: "Ativo", valor: 28000, historico: [
    { data: "12/02 14:00", tipo: "SOL", msg: "Contato automático via Meta — resposta em 8s" },
    { data: "12/02 14:03", tipo: "SOL", msg: "Resposta positiva — iniciando BANT" },
    { data: "13/02 09:00", tipo: "SOL", msg: "Qualificada — budget confirmado R$ 28k" },
  ]},
  { id: 3, nome: "Roberto Almeida", etapa: "Fechado", temperatura: "QUENTE" as const, score: 92, sla: 0.01, statusFup: "Concluído", valor: 55000, historico: [
    { data: "05/02 08:00", tipo: "SOL", msg: "Lead via Indicação — resposta instantânea" },
    { data: "05/02 08:02", tipo: "SOL", msg: "BANT completo em 1ª interação" },
    { data: "06/02 14:00", tipo: "Closer", msg: "Reunião realizada — proposta R$ 55k" },
    { data: "08/02 10:00", tipo: "Closer", msg: "Contrato assinado ✓" },
  ]},
  { id: 4, nome: "Juliana Ferreira", etapa: "Qualificação", temperatura: "MORNO" as const, score: 54, sla: 0.01, statusFup: "Ativo", valor: 0, historico: [
    { data: "18/02 22:30", tipo: "SOL", msg: "Contato fora do horário — respondido em 12s (24/7)" },
    { data: "19/02 09:00", tipo: "SOL", msg: "Follow-up automático — interesse médio" },
    { data: "19/02 14:00", tipo: "SOL", msg: "Em qualificação BANT" },
  ]},
  { id: 5, nome: "Fernando Lima", etapa: "FUP Frio", temperatura: "FRIO" as const, score: 31, sla: 0.01, statusFup: "FUP Frio", valor: 0, historico: [
    { data: "08/02 15:00", tipo: "SOL", msg: "Contato inicial — resposta em 10s" },
    { data: "09/02 15:00", tipo: "SOL", msg: "2ª tentativa — sem resposta" },
    { data: "12/02 10:00", tipo: "FUP", msg: "Transferido para FUP Frio — reativação" },
  ]},
  { id: 6, nome: "Mariana Santos", etapa: "Closer", temperatura: "QUENTE" as const, score: 79, sla: 0.01, statusFup: "Ativo", valor: 35000, historico: [
    { data: "15/02 11:00", tipo: "SOL", msg: "Qualificado em 3 min — antes levava 4h+" },
    { data: "15/02 15:00", tipo: "Closer", msg: "Ligação agendada" },
  ]},
  { id: 7, nome: "Lucas Rodrigues", etapa: "Robô SOL", temperatura: "MORNO" as const, score: 42, sla: 0.01, statusFup: "Novo", valor: 0, historico: [
    { data: "20/02 10:30", tipo: "SOL", msg: "Primeiro contato — resposta automática em 12s" },
  ]},
  { id: 8, nome: "Patrícia Gomes", etapa: "Robô SOL", temperatura: "FRIO" as const, score: 18, sla: 0.01, statusFup: "Novo", valor: 0, historico: [
    { data: "20/02 23:45", tipo: "SOL", msg: "Lead Meta fora do horário — atendido em 12s (SDR dormindo)" },
  ]},
  { id: 9, nome: "Ricardo Souza", etapa: "Proposta", temperatura: "QUENTE" as const, score: 88, sla: 0.01, statusFup: "Ativo", valor: 48000, historico: [
    { data: "10/02 09:00", tipo: "SOL", msg: "Qualificação automática completa" },
    { data: "11/02 10:00", tipo: "Closer", msg: "Reunião realizada" },
    { data: "13/02 15:00", tipo: "Closer", msg: "Proposta enviada — R$ 48k" },
  ]},
  { id: 10, nome: "Camila Oliveira", etapa: "Fechado", temperatura: "QUENTE" as const, score: 91, sla: 0.01, statusFup: "Concluído", valor: 62000, historico: [
    { data: "03/02 08:00", tipo: "SOL", msg: "Lead Google — qualificado em 5 min" },
    { data: "04/02 10:00", tipo: "Closer", msg: "Reunião — projeto urgente" },
    { data: "06/02 15:00", tipo: "Closer", msg: "Proposta R$ 62k aceita ✓" },
  ]},
];
