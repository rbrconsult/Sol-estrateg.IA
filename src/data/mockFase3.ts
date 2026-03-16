// ============================
// MOCK DATA — Fase 3-4
// Jan-Fev 2026 | Sol Estrateg.IA
// ============================

// ── MONITOR DE SLA ──────────────────────────────────

export type SLAStatus = "dentro" | "atencao" | "fora";

export interface SLAStage {
  id: number;
  etapa: string;
  slaMeta: string;
  slaMetaMinutos: number;
  realMedio: string;
  realMedioMinutos: number;
  status: SLAStatus;
  pctCumprindo: number;
  ator: string;
}

export const slaStages: SLAStage[] = [
  { id: 1, etapa: "Lead → Sol aborda", slaMeta: "3 min", slaMetaMinutos: 3, realMedio: "1min 23s", realMedioMinutos: 1.38, status: "dentro", pctCumprindo: 97, ator: "Automação" },
  { id: 2, etapa: "Sol aborda → Responde", slaMeta: "10 min", slaMetaMinutos: 10, realMedio: "4h 17min", realMedioMinutos: 257, status: "atencao", pctCumprindo: 0, ator: "Cliente" },
  { id: 3, etapa: "Sol → Qualificado", slaMeta: "10 min", slaMetaMinutos: 10, realMedio: "8min 42s", realMedioMinutos: 8.7, status: "dentro", pctCumprindo: 89, ator: "Sol IA" },
  { id: 4, etapa: "Qualificado → Closer contata", slaMeta: "60 min", slaMetaMinutos: 60, realMedio: "47min", realMedioMinutos: 47, status: "dentro", pctCumprindo: 72, ator: "Closer" },
  { id: 5, etapa: "Closer → Agendamento", slaMeta: "1h", slaMetaMinutos: 60, realMedio: "2h 14min", realMedioMinutos: 134, status: "atencao", pctCumprindo: 61, ator: "Closer" },
  { id: 6, etapa: "Agendamento → Reunião", slaMeta: "5 dias", slaMetaMinutos: 7200, realMedio: "3,8 dias", realMedioMinutos: 5472, status: "dentro", pctCumprindo: 84, ator: "Cliente" },
  { id: 7, etapa: "Reunião → Proposta", slaMeta: "3h", slaMetaMinutos: 180, realMedio: "5h 22min", realMedioMinutos: 322, status: "atencao", pctCumprindo: 55, ator: "Closer" },
  { id: 8, etapa: "Proposta → Fechamento", slaMeta: "7 dias", slaMetaMinutos: 10080, realMedio: "9,3 dias", realMedioMinutos: 13392, status: "fora", pctCumprindo: 38, ator: "Cliente" },
];

export interface SLAGargalo {
  etapa: string;
  realMedio: string;
  slaMeta: string;
  pctAcima: number;
  status: SLAStatus;
  sugestao: string;
}

export const slaGargalos: SLAGargalo[] = [
  { etapa: "Proposta → Fechamento", realMedio: "9,3 dias", slaMeta: "7 dias", pctAcima: 62, status: "fora", sugestao: "Implementar follow-up automático D+5 após proposta." },
  { etapa: "Reunião → Proposta enviada", realMedio: "5h 22min", slaMeta: "3h", pctAcima: 45, status: "atencao", sugestao: "Criar alerta automático para closer 2h após reunião." },
  { etapa: "Closer → Agendamento confirmado", realMedio: "2h 14min", slaMeta: "1h", pctAcima: 39, status: "atencao", sugestao: "Notificação push para closer quando lead qualificado entra na fila." },
];

export interface SLALeadForaSLA {
  nome: string;
  etapa: string;
  tempoNaEtapa: string;
  slaMeta: string;
  extrapolou: string;
  status: SLAStatus;
}

export const slaLeadsForaSLA: SLALeadForaSLA[] = [
  { nome: "Paulo F.", etapa: "Proposta enviada", tempoNaEtapa: "11 dias", slaMeta: "7 dias", extrapolou: "+4 dias", status: "fora" },
  { nome: "Roberto V.", etapa: "Closer → Agendamento", tempoNaEtapa: "3h 12min", slaMeta: "1h", extrapolou: "+2h 12min", status: "atencao" },
  { nome: "Tito", etapa: "Proposta enviada", tempoNaEtapa: "8 dias", slaMeta: "7 dias", extrapolou: "+1 dia", status: "atencao" },
  { nome: "Luciana M.", etapa: "Reunião → Proposta", tempoNaEtapa: "6h 45min", slaMeta: "3h", extrapolou: "+3h 45min", status: "atencao" },
  { nome: "Carlos R.", etapa: "Proposta enviada", tempoNaEtapa: "14 dias", slaMeta: "7 dias", extrapolou: "+7 dias", status: "fora" },
];

export interface SLADistribuicao {
  etapa: string;
  faixas: { label: string; count: number }[];
}

export const slaDistribuicoes: SLADistribuicao[] = [
  { etapa: "Proposta → Fechamento", faixas: [{ label: "1-3d", count: 8 }, { label: "4-7d", count: 14 }, { label: "8-14d", count: 11 }, { label: "15-30d", count: 5 }, { label: "+30d", count: 2 }] },
  { etapa: "Reunião → Proposta", faixas: [{ label: "<1h", count: 12 }, { label: "1-3h", count: 18 }, { label: "3-6h", count: 9 }, { label: "6-12h", count: 4 }, { label: "+12h", count: 2 }] },
  { etapa: "Closer → Agendamento", faixas: [{ label: "<30m", count: 15 }, { label: "30-60m", count: 22 }, { label: "1-2h", count: 11 }, { label: "2-4h", count: 6 }, { label: "+4h", count: 3 }] },
  { etapa: "Qualificado → Closer", faixas: [{ label: "<15m", count: 18 }, { label: "15-30m", count: 14 }, { label: "30-60m", count: 10 }, { label: "1-2h", count: 5 }, { label: "+2h", count: 2 }] },
  { etapa: "Sol → Qualificado", faixas: [{ label: "<5m", count: 32 }, { label: "5-10m", count: 21 }, { label: "10-20m", count: 8 }, { label: "20-60m", count: 3 }, { label: "+1h", count: 1 }] },
  { etapa: "Lead → Sol aborda", faixas: [{ label: "<1m", count: 45 }, { label: "1-3m", count: 28 }, { label: "3-5m", count: 4 }, { label: "5-10m", count: 2 }, { label: "+10m", count: 1 }] },
];

export interface SLALeadBusca {
  nome: string;
  telefone: string;
  etapas: { etapa: string; data: string; duracao: string; status: SLAStatus }[];
}

export const slaLeadsBusca: SLALeadBusca[] = [
  { nome: "Paulo F.", telefone: "(17) 99812-3456", etapas: [
    { etapa: "Lead entrada", data: "15/01/2026 09:12", duracao: "—", status: "dentro" },
    { etapa: "Sol abordou", data: "15/01/2026 09:13", duracao: "1min", status: "dentro" },
    { etapa: "Resposta", data: "15/01/2026 14:30", duracao: "5h 17min", status: "atencao" },
    { etapa: "Qualificado", data: "15/01/2026 14:38", duracao: "8min", status: "dentro" },
    { etapa: "Closer contatou", data: "15/01/2026 15:15", duracao: "37min", status: "dentro" },
    { etapa: "Agendamento", data: "16/01/2026 10:00", duracao: "18h 45min", status: "atencao" },
    { etapa: "Reunião", data: "20/01/2026 14:00", duracao: "4 dias", status: "dentro" },
    { etapa: "Proposta", data: "20/01/2026 17:22", duracao: "3h 22min", status: "atencao" },
  ]},
  { nome: "Roberto V.", telefone: "(17) 99834-7890", etapas: [
    { etapa: "Lead entrada", data: "22/01/2026 11:45", duracao: "—", status: "dentro" },
    { etapa: "Sol abordou", data: "22/01/2026 11:46", duracao: "1min", status: "dentro" },
    { etapa: "Resposta", data: "22/01/2026 12:03", duracao: "17min", status: "atencao" },
    { etapa: "Qualificado", data: "22/01/2026 12:10", duracao: "7min", status: "dentro" },
    { etapa: "Closer contatou", data: "22/01/2026 13:22", duracao: "1h 12min", status: "atencao" },
  ]},
  { nome: "Maria L.", telefone: "(11) 98765-4321", etapas: [
    { etapa: "Lead entrada", data: "28/01/2026 08:30", duracao: "—", status: "dentro" },
    { etapa: "Sol abordou", data: "28/01/2026 08:31", duracao: "1min", status: "dentro" },
    { etapa: "Resposta", data: "28/01/2026 09:15", duracao: "44min", status: "atencao" },
    { etapa: "Qualificado", data: "28/01/2026 09:22", duracao: "7min", status: "dentro" },
    { etapa: "Closer contatou", data: "28/01/2026 10:05", duracao: "43min", status: "dentro" },
    { etapa: "Agendamento", data: "28/01/2026 11:30", duracao: "1h 25min", status: "atencao" },
    { etapa: "Reunião", data: "31/01/2026 15:00", duracao: "3,1 dias", status: "dentro" },
    { etapa: "Proposta", data: "31/01/2026 16:45", duracao: "1h 45min", status: "dentro" },
    { etapa: "Fechamento", data: "05/02/2026 10:00", duracao: "4,7 dias", status: "dentro" },
  ]},
];

// ── ANALISTA DE MÍDIA × RECEITA ────────────────────

export interface MidiaKPI {
  metrica: string;
  meta: string;
  google: string;
  total: string;
}

export const midiaKPIs: MidiaKPI[] = [
  { metrica: "Investimento", meta: "R$ 18.400", google: "R$ 11.200", total: "R$ 29.600" },
  { metrica: "Leads gerados", meta: "187", google: "89", total: "276" },
  { metrica: "CPL", meta: "R$ 98", google: "R$ 126", total: "R$ 107" },
  { metrica: "Qualificados", meta: "51", google: "24", total: "75" },
  { metrica: "Custo/qualificado", meta: "R$ 361", google: "R$ 467", total: "R$ 395" },
  { metrica: "Contratos", meta: "7", google: "4", total: "11" },
  { metrica: "Receita", meta: "R$ 124k", google: "R$ 63k", total: "R$ 187k" },
  { metrica: "ROAS", meta: "6,7×", google: "5,6×", total: "6,3×" },
];

export interface FunilOrigem {
  origem: string;
  cor: string;
  etapas: { label: string; valor: number; pct: string }[];
}

export const funisOrigem: FunilOrigem[] = [
  { origem: "Meta Ads", cor: "#1877F2", etapas: [
    { label: "Leads", valor: 187, pct: "100%" },
    { label: "Responderam", valor: 108, pct: "58%" },
    { label: "Qualificados", valor: 51, pct: "47%" },
    { label: "Contratos", valor: 7, pct: "14%" },
  ]},
  { origem: "Google Ads", cor: "#34A853", etapas: [
    { label: "Leads", valor: 89, pct: "100%" },
    { label: "Responderam", valor: 54, pct: "61%" },
    { label: "Qualificados", valor: 24, pct: "44%" },
    { label: "Contratos", valor: 4, pct: "17%" },
  ]},
  { origem: "Site", cor: "#F59E0B", etapas: [
    { label: "Leads", valor: 41, pct: "100%" },
    { label: "Responderam", valor: 26, pct: "63%" },
    { label: "Qualificados", valor: 12, pct: "46%" },
    { label: "Contratos", valor: 2, pct: "17%" },
  ]},
  { origem: "WA Direto", cor: "#25D366", etapas: [
    { label: "Leads", valor: 25, pct: "100%" },
    { label: "Responderam", valor: 18, pct: "72%" },
    { label: "Qualificados", valor: 7, pct: "39%" },
    { label: "Contratos", valor: 2, pct: "29%" },
  ]},
];

export const radarComparativo = [
  { eixo: "Volume", meta: 187, google: 89 },
  { eixo: "CPL (inv)", meta: 90, google: 70 },
  { eixo: "Taxa Qual.", meta: 27, google: 27 },
  { eixo: "Taxa Contrato", meta: 14, google: 17 },
  { eixo: "ROAS", meta: 67, google: 56 },
  { eixo: "Vel. Resposta", meta: 75, google: 80 },
];

export interface Campanha {
  nome: string;
  plataforma: "Meta" | "Google";
  leads: number;
  cpl: string;
  qualificados: number;
  pctQual: string;
  contratos: number;
  roas: string;
  status: "verde" | "amarelo" | "vermelho";
}

export const campanhas: Campanha[] = [
  { nome: "Solar Residencial SP", plataforma: "Meta", leads: 89, cpl: "R$ 87", qualificados: 28, pctQual: "31%", contratos: 4, roas: "7,2×", status: "verde" },
  { nome: "Solar Comercial", plataforma: "Meta", leads: 54, cpl: "R$ 112", qualificados: 14, pctQual: "26%", contratos: 2, roas: "5,1×", status: "amarelo" },
  { nome: "Remarketing", plataforma: "Meta", leads: 44, cpl: "R$ 95", qualificados: 9, pctQual: "20%", contratos: 1, roas: "4,2×", status: "amarelo" },
  { nome: "Search Solar Olímpia", plataforma: "Google", leads: 52, cpl: "R$ 118", qualificados: 15, pctQual: "29%", contratos: 3, roas: "6,1×", status: "verde" },
  { nome: "Display Solar", plataforma: "Google", leads: 37, cpl: "R$ 135", qualificados: 9, pctQual: "24%", contratos: 1, roas: "4,8×", status: "amarelo" },
];

export const scorePorOrigem = [
  { origem: "WhatsApp Direto", score: 68 },
  { origem: "Site", score: 65 },
  { origem: "Meta Ads", score: 64 },
  { origem: "Google Ads", score: 61 },
];

export const temperaturaPorCanal = [
  { canal: "Meta Ads", quente: 24, morno: 38, frio: 38 },
  { canal: "Google Ads", quente: 20, morno: 35, frio: 45 },
  { canal: "Site", quente: 30, morno: 33, frio: 37 },
  { canal: "WA Direto", quente: 40, morno: 32, frio: 28 },
];

export const engajamentoMeta = [
  { metrica: "Impressões", valor: "412.800" },
  { metrica: "Alcance", valor: "187.300" },
  { metrica: "Frequência", valor: "2,2×" },
  { metrica: "CTR link", valor: "2,16%" },
  { metrica: "Hook Rate (3s)", valor: "6,9%" },
  { metrica: "Hold Rate (25%)", valor: "50%" },
  { metrica: "Taxa conclusão vídeo", valor: "14,4%" },
  { metrica: "Curtidas / Reações", valor: "1.847" },
  { metrica: "Comentários", valor: "312" },
  { metrica: "Compartilhamentos", valor: "89" },
];

export const evolucaoSemanal = [
  { semana: "S1 Jan", leadsMeta: 18, leadsGoogle: 9, cplMeta: 105, cplGoogle: 132 },
  { semana: "S2 Jan", leadsMeta: 21, leadsGoogle: 11, cplMeta: 98, cplGoogle: 128 },
  { semana: "S3 Jan", leadsMeta: 25, leadsGoogle: 12, cplMeta: 95, cplGoogle: 125 },
  { semana: "S4 Jan", leadsMeta: 24, leadsGoogle: 10, cplMeta: 97, cplGoogle: 130 },
  { semana: "S1 Fev", leadsMeta: 22, leadsGoogle: 13, cplMeta: 100, cplGoogle: 120 },
  { semana: "S2 Fev", leadsMeta: 28, leadsGoogle: 11, cplMeta: 92, cplGoogle: 126 },
  { semana: "S3 Fev", leadsMeta: 26, leadsGoogle: 12, cplMeta: 96, cplGoogle: 122 },
  { semana: "S4 Fev", leadsMeta: 23, leadsGoogle: 11, cplMeta: 99, cplGoogle: 124 },
];

// ── ANALISTA DE FOLLOW-UP FRIO ─────────────────────

export interface FollowupKPIs {
  leadsEmFUP: number;
  totalEntrouFUP: number;
  reativados: number;
  pctReativados: string;
  receitaFUP: string;
  tempoMedioReativacao: string;
  fupsAteMedioReativacao: number;
  custoRegua: string;
  contratosOriginadosFUP: number;
}

export const followupKPIs: FollowupKPIs = {
  leadsEmFUP: 48,
  totalEntrouFUP: 124,
  reativados: 31,
  pctReativados: "25%",
  receitaFUP: "R$ 42.300",
  tempoMedioReativacao: "8,4 dias",
  fupsAteMedioReativacao: 3.2,
  custoRegua: "R$ 0",
  contratosOriginadosFUP: 4,
};

export interface FollowupEtapa {
  etapa: string;
  dia: string;
  gatilho: string;
  disparos: number;
  respostas: number;
  taxa: string;
  destaque?: boolean;
}

export const followupPipeline: FollowupEtapa[] = [
  { etapa: "FUP 1", dia: "D+1", gatilho: "Urgência suave", disparos: 124, respostas: 18, taxa: "14,5%" },
  { etapa: "FUP 2", dia: "D+3", gatilho: "Prova social", disparos: 106, respostas: 19, taxa: "17,9%", destaque: true },
  { etapa: "FUP 3", dia: "D+5", gatilho: "Escassez", disparos: 87, respostas: 11, taxa: "12,6%" },
  { etapa: "FUP 4", dia: "D+7", gatilho: "Benefício direto", disparos: 76, respostas: 17, taxa: "22,4%", destaque: true },
  { etapa: "FUP 5", dia: "D+10", gatilho: "Dor", disparos: 59, respostas: 8, taxa: "13,6%" },
  { etapa: "FUP 6", dia: "D+14", gatilho: "Última chance", disparos: 51, respostas: 6, taxa: "11,8%" },
  { etapa: "FUP 7", dia: "D+21", gatilho: "Reativação longa", disparos: 45, respostas: 4, taxa: "8,9%" },
  { etapa: "FUP 8", dia: "D+30", gatilho: "Encerramento", disparos: 41, respostas: 3, taxa: "7,3%" },
];

export const followupResultadoReativados = [
  { label: "Qualificados → Closer", valor: 18, pct: 58, cor: "hsl(var(--success))" },
  { label: "Desqualificados novamente", valor: 9, pct: 29, cor: "hsl(var(--destructive))" },
  { label: "Ainda em qualificação", valor: 4, pct: 13, cor: "hsl(var(--warning))" },
];

export const followupPorCanal = [
  { canal: "Meta Ads", entrouFUP: 67, reativados: 16, taxa: "24%" },
  { canal: "Google Ads", entrouFUP: 31, reativados: 8, taxa: "26%" },
  { canal: "Site", entrouFUP: 16, reativados: 5, taxa: "31%" },
  { canal: "WhatsApp Direto", entrouFUP: 10, reativados: 2, taxa: "20%" },
];

export const followupPerfilReativacao = {
  temperatura: [
    { label: "Entrou FRIO", pct: 71 },
    { label: "Entrou MORNO", pct: 29 },
  ],
  faixaConta: [
    { label: "R$ 250-400", pct: 42 },
    { label: "R$ 400-700", pct: 35 },
    { label: "Acima R$ 700", pct: 23 },
  ],
  cidades: [
    { label: "Olímpia", pct: 35 },
    { label: "São José do Rio Preto", pct: 18 },
    { label: "Outras", pct: 47 },
  ],
};

export interface FollowupLeadAtivo {
  nome: string;
  etapaAtual: string;
  proximoFUP: string;
  diasEmFUP: string;
  canal: string;
  ultResposta: string;
}

export const followupLeadsAtivos: FollowupLeadAtivo[] = [
  { nome: "Isabela S.", etapaAtual: "FUP 2", proximoFUP: "Amanhã 09:00", diasEmFUP: "4 dias", canal: "Meta", ultResposta: "—" },
  { nome: "Maria L.", etapaAtual: "FUP 4", proximoFUP: "D+7", diasEmFUP: "7 dias", canal: "Site", ultResposta: "D+3" },
  { nome: "Milton R.", etapaAtual: "FUP 1", proximoFUP: "Hoje 14:00", diasEmFUP: "1 dia", canal: "WA Direto", ultResposta: "—" },
  { nome: "Carla B.", etapaAtual: "FUP 5", proximoFUP: "D+10", diasEmFUP: "10 dias", canal: "Google", ultResposta: "D+3" },
  { nome: "Fernando S.", etapaAtual: "FUP 3", proximoFUP: "D+5", diasEmFUP: "5 dias", canal: "Meta", ultResposta: "—" },
  { nome: "Ana Paula T.", etapaAtual: "FUP 6", proximoFUP: "D+14", diasEmFUP: "14 dias", canal: "Site", ultResposta: "D+7" },
];

export const followupEvolucaoTemporal = [
  { dia: "01 Jan", disparos: 12, respostas: 2, reativacaoAcum: 0 },
  { dia: "05 Jan", disparos: 18, respostas: 3, reativacaoAcum: 2 },
  { dia: "10 Jan", disparos: 22, respostas: 4, reativacaoAcum: 5 },
  { dia: "15 Jan", disparos: 15, respostas: 3, reativacaoAcum: 8 },
  { dia: "20 Jan", disparos: 20, respostas: 5, reativacaoAcum: 12 },
  { dia: "25 Jan", disparos: 17, respostas: 2, reativacaoAcum: 14 },
  { dia: "01 Fev", disparos: 19, respostas: 4, reativacaoAcum: 18 },
  { dia: "05 Fev", disparos: 21, respostas: 3, reativacaoAcum: 20 },
  { dia: "10 Fev", disparos: 16, respostas: 5, reativacaoAcum: 23 },
  { dia: "15 Fev", disparos: 23, respostas: 4, reativacaoAcum: 26 },
  { dia: "20 Fev", disparos: 18, respostas: 3, reativacaoAcum: 28 },
  { dia: "25 Fev", disparos: 14, respostas: 3, reativacaoAcum: 31 },
];
