// ========== MOCK DATA — Ads Performance, Robô SOL, FUP Frio, Jornada ==========
// Jan-Fev 2026 — Substituir por DataStores via Supabase

// ─── PAGE 2: ADS PERFORMANCE ────────────────────────────────────

export const metaKPIs = {
  investimento: 18400,
  impressoes: 412800,
  alcance: 187300,
  frequencia: 2.2,
  cliquesLink: 8930,
  ctr: 2.16,
  cpc: 2.06,
  cpm: 44.58,
  leadsGerados: 187,
  cpl: 98.40,
  taxaConversaoForm: 2.09,
  leadsQualificados: 51,
  custoLeadQualificado: 360.78,
  roas: 5.2,
};

export const googleKPIs = {
  investimento: 11200,
  impressoes: 89400,
  cliques: 4210,
  ctr: 4.71,
  cpc: 2.66,
  cpm: 125.28,
  leadsGerados: 89,
  cpl: 125.84,
  taxaConversao: 2.11,
  leadsQualificados: 24,
  custoLeadQualificado: 466.67,
  roas: 4.1,
  posicaoMedia: 1.8,
  indiceQualidade: 7.2,
};

export const engajamentoMeta = {
  curtidas: 1847,
  comentarios: 312,
  compartilhamentos: 89,
  salvamentos: 234,
  cliquesPerfil: 567,
  videoViews3s: 28400,
  videoViews25: 14200,
  videoViews75: 4100,
  taxaConclusao: 14.4,
  thruPlay: 2890,
  custoThruPlay: 0.89,
  hookRate: 6.9,
  holdRate: 50,
  taxaEngajamento: 0.45,
};

export interface CampanhaMock {
  campanha: string;
  plataforma: 'Meta' | 'Google';
  objetivo: string;
  investimento: number;
  impressoes: number;
  cliques: number;
  ctr: number;
  leads: number;
  cpl: number;
  qualificados: number;
  status: 'Ativa' | 'Pausada' | 'Finalizada';
}

export const campanhas: CampanhaMock[] = [
  { campanha: 'Solar Residencial - Olimpia', plataforma: 'Meta', objetivo: 'Geração de Leads', investimento: 5200, impressoes: 118000, cliques: 2540, ctr: 2.15, leads: 54, cpl: 96.30, qualificados: 15, status: 'Ativa' },
  { campanha: 'Economia Energia - Região', plataforma: 'Meta', objetivo: 'Geração de Leads', investimento: 4800, impressoes: 105000, cliques: 2310, ctr: 2.20, leads: 48, cpl: 100.00, qualificados: 13, status: 'Ativa' },
  { campanha: 'Retargeting Visitantes', plataforma: 'Meta', objetivo: 'Conversão', investimento: 3400, impressoes: 89000, cliques: 1920, ctr: 2.16, leads: 38, cpl: 89.47, qualificados: 11, status: 'Ativa' },
  { campanha: 'Lookalike Clientes', plataforma: 'Meta', objetivo: 'Geração de Leads', investimento: 2800, impressoes: 62000, cliques: 1280, ctr: 2.06, leads: 28, cpl: 100.00, qualificados: 7, status: 'Pausada' },
  { campanha: 'Stories Depoimentos', plataforma: 'Meta', objetivo: 'Engajamento', investimento: 2200, impressoes: 38800, cliques: 880, ctr: 2.27, leads: 19, cpl: 115.79, qualificados: 5, status: 'Finalizada' },
  { campanha: 'Energia Solar Olimpia', plataforma: 'Google', objetivo: 'Search', investimento: 4800, impressoes: 38200, cliques: 1800, ctr: 4.71, leads: 38, cpl: 126.32, qualificados: 10, status: 'Ativa' },
  { campanha: 'Painel Solar Preço', plataforma: 'Google', objetivo: 'Search', investimento: 3600, impressoes: 28400, cliques: 1340, ctr: 4.72, leads: 28, cpl: 128.57, qualificados: 8, status: 'Ativa' },
  { campanha: 'Display Remarketing', plataforma: 'Google', objetivo: 'Display', investimento: 2800, impressoes: 22800, cliques: 1070, ctr: 4.69, leads: 23, cpl: 121.74, qualificados: 6, status: 'Ativa' },
];

export interface CriativoMock {
  nome: string;
  formato: 'Imagem' | 'Vídeo' | 'Carrossel';
  impressoes: number;
  ctr: number;
  cpl: number;
  leads: number;
  hookRate: number;
  holdRate: number;
  score: number;
}

export const criativos: CriativoMock[] = [
  { nome: 'Depoimento Cliente João', formato: 'Vídeo', impressoes: 98000, ctr: 2.8, cpl: 82.50, leads: 42, hookRate: 8.2, holdRate: 55, score: 92 },
  { nome: 'Antes e Depois Telhado', formato: 'Carrossel', impressoes: 87000, ctr: 2.4, cpl: 91.30, leads: 38, hookRate: 7.1, holdRate: 48, score: 85 },
  { nome: 'Economia Real - Infográfico', formato: 'Imagem', impressoes: 76000, ctr: 2.1, cpl: 105.00, leads: 32, hookRate: 6.5, holdRate: 42, score: 78 },
  { nome: 'Vídeo Instalação Rápida', formato: 'Vídeo', impressoes: 82000, ctr: 1.9, cpl: 110.50, leads: 28, hookRate: 7.8, holdRate: 52, score: 81 },
  { nome: 'Simulação Gratuita CTA', formato: 'Imagem', impressoes: 69800, ctr: 2.5, cpl: 88.20, leads: 47, hookRate: 5.8, holdRate: 38, score: 88 },
];

export const comparativo = [
  { metrica: 'Investimento', meta: 'R$ 18.400', google: 'R$ 11.200', melhor: '—' },
  { metrica: 'Total leads', meta: '187', google: '89', melhor: 'Meta' },
  { metrica: 'CPL', meta: 'R$ 98,40', google: 'R$ 125,84', melhor: 'Meta' },
  { metrica: 'Leads qualificados', meta: '51', google: '24', melhor: 'Meta' },
  { metrica: 'Custo/qualificado', meta: 'R$ 360', google: 'R$ 467', melhor: 'Meta' },
  { metrica: 'CTR', meta: '2,16%', google: '4,71%', melhor: 'Google' },
  { metrica: 'Taxa conversão', meta: '2,09%', google: '2,11%', melhor: 'Empate' },
  { metrica: 'ROAS', meta: '5,2×', google: '4,1×', melhor: 'Meta' },
];

export const evolucaoSemanal = [
  { semana: 'Sem 1 Jan', metaInvest: 2300, googleInvest: 1400, metaLeads: 22, googleLeads: 10, metaCPL: 104.55, googleCPL: 140.00 },
  { semana: 'Sem 2 Jan', metaInvest: 2400, googleInvest: 1500, metaLeads: 25, googleLeads: 12, metaCPL: 96.00, googleCPL: 125.00 },
  { semana: 'Sem 3 Jan', metaInvest: 2200, googleInvest: 1300, metaLeads: 21, googleLeads: 9, metaCPL: 104.76, googleCPL: 144.44 },
  { semana: 'Sem 4 Jan', metaInvest: 2500, googleInvest: 1500, metaLeads: 27, googleLeads: 13, metaCPL: 92.59, googleCPL: 115.38 },
  { semana: 'Sem 1 Fev', metaInvest: 2300, googleInvest: 1400, metaLeads: 24, googleLeads: 11, metaCPL: 95.83, googleCPL: 127.27 },
  { semana: 'Sem 2 Fev', metaInvest: 2400, googleInvest: 1300, metaLeads: 26, googleLeads: 12, metaCPL: 92.31, googleCPL: 108.33 },
  { semana: 'Sem 3 Fev', metaInvest: 2100, googleInvest: 1400, metaLeads: 22, googleLeads: 11, metaCPL: 95.45, googleCPL: 127.27 },
  { semana: 'Sem 4 Fev', metaInvest: 2200, googleInvest: 1400, metaLeads: 20, googleLeads: 11, metaCPL: 110.00, googleCPL: 127.27 },
];

// ─── PAGE 3: ROBÔ SOL ─────────────────────────────────────────

export const solKPIs = {
  conversasIniciadas: 318,
  taxaResposta: 58.8,
  leadsQualificados: 94,
  taxaQualificacao: 29.6,
  leadsDesqualificados: 93,
  emQualificacao: 12,
  scoreMedio: 62.4,
  temperatureMedia: 'MORNO' as const,
};

export const solFunil = [
  { etapa: 'Recebidos', valor: 318, pct: 100 },
  { etapa: 'Responderam', valor: 187, pct: 58 },
  { etapa: 'Em qualificação', valor: 94, pct: 50 },
  { etapa: 'Qualificados MQL', valor: 94, pct: 29 },
  { etapa: 'Desqualificados', valor: 93, pct: 29 },
];

export const temperaturaDistribuicao = [
  { label: 'QUENTE', range: '70-100', qtd: 47, cor: 'hsl(0, 84%, 60%)' },
  { label: 'MORNO', range: '40-69', qtd: 31, cor: 'hsl(45, 93%, 47%)' },
  { label: 'FRIO', range: '0-39', qtd: 16, cor: 'hsl(199, 89%, 48%)' },
];

export const topLeadsQuentes = [
  { nome: 'Carlos Silva', cidade: 'Olímpia', score: 95, canal: 'Meta Ads' },
  { nome: 'Ana Oliveira', cidade: 'Barretos', score: 91, canal: 'Google Ads' },
  { nome: 'Roberto Santos', cidade: 'São José do Rio Preto', score: 88, canal: 'Site' },
  { nome: 'Maria Lima', cidade: 'Bebedouro', score: 85, canal: 'Meta Ads' },
  { nome: 'João Pereira', cidade: 'Olímpia', score: 82, canal: 'WhatsApp Direto' },
];

export const motivosDesqualificacao = [
  { motivo: 'SEM_INTERESSE', qtd: 30, pct: 32 },
  { motivo: 'MOMENTO_INADEQUADO', qtd: 22, pct: 24 },
  { motivo: 'CONTA_BAIXA', qtd: 17, pct: 18 },
  { motivo: 'FECHOU_CONCORRENCIA', qtd: 13, pct: 14 },
  { motivo: 'SOLICITOU_ENCERRAMENTO', qtd: 11, pct: 12 },
];

export const performancePorCanal = [
  { canal: 'Meta Ads', leads: 187, responderam: 108, qualificados: 51, taxa: 27, scoreMedio: 64 },
  { canal: 'Google Ads', leads: 89, responderam: 52, qualificados: 24, taxa: 27, scoreMedio: 61 },
  { canal: 'Site', leads: 41, responderam: 24, qualificados: 12, taxa: 29, scoreMedio: 65 },
  { canal: 'WhatsApp Direto', leads: 25, responderam: 16, qualificados: 7, taxa: 28, scoreMedio: 68 },
];

export const volumeMensagens = {
  totalEnviadas: 2847,
  totalRecebidas: 1203,
  mediaPorConversa: 8.4,
  mediaAteQualificar: 12.1,
  mediaAteDesqualificar: 4.2,
};

export const mensagensPorDia = [
  { dia: '02/01', enviadas: 48, recebidas: 22 },
  { dia: '05/01', enviadas: 62, recebidas: 28 },
  { dia: '08/01', enviadas: 55, recebidas: 24 },
  { dia: '12/01', enviadas: 71, recebidas: 31 },
  { dia: '15/01', enviadas: 58, recebidas: 26 },
  { dia: '19/01', enviadas: 65, recebidas: 29 },
  { dia: '22/01', enviadas: 52, recebidas: 21 },
  { dia: '26/01', enviadas: 68, recebidas: 30 },
  { dia: '29/01', enviadas: 60, recebidas: 25 },
  { dia: '02/02', enviadas: 72, recebidas: 33 },
  { dia: '05/02', enviadas: 58, recebidas: 27 },
  { dia: '09/02', enviadas: 64, recebidas: 28 },
  { dia: '12/02', enviadas: 70, recebidas: 32 },
  { dia: '16/02', enviadas: 56, recebidas: 24 },
  { dia: '19/02', enviadas: 63, recebidas: 27 },
  { dia: '23/02', enviadas: 75, recebidas: 34 },
  { dia: '26/02', enviadas: 59, recebidas: 26 },
];

export const slaSol = [
  { etapa: 'Lead entra → Sol aborda', slaMeta: '3 min', real: '1min 23s', pctCumprido: 94, status: 'dentro' as const },
  { etapa: 'Sol aborda → Lead responde', slaMeta: '10 min', real: '4h 17min', pctCumprido: 32, status: 'depende' as const },
  { etapa: 'Sol → Lead qualificado', slaMeta: '10 min', real: '8min 42s', pctCumprido: 87, status: 'dentro' as const },
];

export const heatmapSol: number[][] = [
  // 0-23h for Mon-Sun
  [0,0,0,0,0,0,1,3,5,8,10,9,4,6,8,7,5,3,2,1,0,0,0,0], // Seg
  [0,0,0,0,0,0,2,4,7,11,14,12,5,8,12,10,6,4,2,1,0,0,0,0], // Ter
  [0,0,0,0,0,0,1,3,6,9,11,10,4,7,10,8,5,3,2,1,0,0,0,0], // Qua
  [0,0,0,0,0,0,2,4,7,12,15,13,5,9,13,11,7,4,2,1,0,0,0,0], // Qui
  [0,0,0,0,0,0,1,3,5,8,10,9,4,6,8,7,4,3,1,1,0,0,0,0], // Sex
  [0,0,0,0,0,0,0,1,2,3,4,3,2,2,3,2,1,1,0,0,0,0,0,0], // Sab
  [0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,0,0,0,0,0,0,0,0], // Dom
];

export const evolucaoDiariaSol = [
  { dia: '02/01', recebidos: 8, qualificados: 2, taxa: 25 },
  { dia: '05/01', recebidos: 12, qualificados: 4, taxa: 33 },
  { dia: '08/01', recebidos: 10, qualificados: 3, taxa: 30 },
  { dia: '12/01', recebidos: 14, qualificados: 5, taxa: 36 },
  { dia: '15/01', recebidos: 11, qualificados: 3, taxa: 27 },
  { dia: '19/01', recebidos: 13, qualificados: 4, taxa: 31 },
  { dia: '22/01', recebidos: 9, qualificados: 2, taxa: 22 },
  { dia: '26/01', recebidos: 15, qualificados: 5, taxa: 33 },
  { dia: '29/01', recebidos: 12, qualificados: 3, taxa: 25 },
  { dia: '02/02', recebidos: 14, qualificados: 5, taxa: 36 },
  { dia: '05/02', recebidos: 11, qualificados: 3, taxa: 27 },
  { dia: '09/02', recebidos: 13, qualificados: 4, taxa: 31 },
  { dia: '12/02', recebidos: 16, qualificados: 6, taxa: 38 },
  { dia: '16/02', recebidos: 10, qualificados: 3, taxa: 30 },
  { dia: '19/02', recebidos: 12, qualificados: 4, taxa: 33 },
  { dia: '23/02', recebidos: 15, qualificados: 5, taxa: 33 },
  { dia: '26/02', recebidos: 11, qualificados: 3, taxa: 27 },
];

export const leadsRecentesSol = [
  { nome: 'Carlos Silva', cidade: 'Olímpia', canal: 'Meta Ads', score: 95, temperatura: 'QUENTE', status: 'Qualificado', duracao: '12min', data: '26/02/2026' },
  { nome: 'Ana Oliveira', cidade: 'Barretos', canal: 'Google Ads', score: 91, temperatura: 'QUENTE', status: 'Qualificado', duracao: '15min', data: '26/02/2026' },
  { nome: 'Roberto Santos', cidade: 'São José do Rio Preto', canal: 'Site', score: 88, temperatura: 'QUENTE', status: 'Qualificado', duracao: '18min', data: '25/02/2026' },
  { nome: 'Maria Lima', cidade: 'Bebedouro', canal: 'Meta Ads', score: 85, temperatura: 'QUENTE', status: 'Qualificado', duracao: '10min', data: '25/02/2026' },
  { nome: 'João Pereira', cidade: 'Olímpia', canal: 'WhatsApp Direto', score: 82, temperatura: 'QUENTE', status: 'Qualificado', duracao: '20min', data: '25/02/2026' },
  { nome: 'Fernanda Costa', cidade: 'Monte Azul', canal: 'Meta Ads', score: 72, temperatura: 'QUENTE', status: 'Qualificado', duracao: '14min', data: '24/02/2026' },
  { nome: 'Pedro Almeida', cidade: 'Olímpia', canal: 'Google Ads', score: 65, temperatura: 'MORNO', status: 'Em qualificação', duracao: '8min', data: '24/02/2026' },
  { nome: 'Lucia Mendes', cidade: 'Catanduva', canal: 'Meta Ads', score: 58, temperatura: 'MORNO', status: 'Desqualificado', duracao: '4min', data: '24/02/2026' },
  { nome: 'Ricardo Souza', cidade: 'Barretos', canal: 'Site', score: 45, temperatura: 'MORNO', status: 'Desqualificado', duracao: '3min', data: '23/02/2026' },
  { nome: 'Camila Rocha', cidade: 'Olímpia', canal: 'Meta Ads', score: 38, temperatura: 'FRIO', status: 'Desqualificado', duracao: '2min', data: '23/02/2026' },
  { nome: 'Marcos Oliveira', cidade: 'Bebedouro', canal: 'Google Ads', score: 35, temperatura: 'FRIO', status: 'Desqualificado', duracao: '3min', data: '22/02/2026' },
  { nome: 'Patrícia Dias', cidade: 'Olímpia', canal: 'Meta Ads', score: 78, temperatura: 'QUENTE', status: 'Qualificado', duracao: '16min', data: '22/02/2026' },
  { nome: 'Bruno Ferreira', cidade: 'São José do Rio Preto', canal: 'WhatsApp Direto', score: 52, temperatura: 'MORNO', status: 'Em qualificação', duracao: '6min', data: '21/02/2026' },
  { nome: 'Juliana Santos', cidade: 'Monte Azul', canal: 'Meta Ads', score: 28, temperatura: 'FRIO', status: 'Desqualificado', duracao: '2min', data: '21/02/2026' },
  { nome: 'Eduardo Lima', cidade: 'Olímpia', canal: 'Google Ads', score: 68, temperatura: 'MORNO', status: 'Qualificado', duracao: '11min', data: '20/02/2026' },
];

// ─── PAGE 4: ROBÔ FUP FRIO ────────────────────────────────────

export const fupKPIs = {
  leadsAtivos: 48,
  totalEntrou: 124,
  reativados: 31,
  taxaReativacao: 25,
  receitaGerada: 42300,
  tempoMedioReativacao: 8.4,
  fupsMedios: 3.2,
  custoReativacao: 0,
};

export const pipelineFup = [
  { etapa: 'FUP 1', dia: 'D+1', gatilho: 'Urgência suave', disparos: 124, respostas: 18, taxa: 14.5 },
  { etapa: 'FUP 2', dia: 'D+3', gatilho: 'Prova social', disparos: 106, respostas: 19, taxa: 17.9 },
  { etapa: 'FUP 3', dia: 'D+5', gatilho: 'Escassez', disparos: 87, respostas: 11, taxa: 12.6 },
  { etapa: 'FUP 4', dia: 'D+7', gatilho: 'Benefício direto', disparos: 76, respostas: 17, taxa: 22.4 },
  { etapa: 'FUP 5', dia: 'D+10', gatilho: 'Dor', disparos: 59, respostas: 8, taxa: 13.6 },
  { etapa: 'FUP 6', dia: 'D+14', gatilho: 'Última chance', disparos: 51, respostas: 6, taxa: 11.8 },
  { etapa: 'FUP 7', dia: 'D+21', gatilho: 'Reativação longa', disparos: 45, respostas: 4, taxa: 8.9 },
  { etapa: 'FUP 8', dia: 'D+30', gatilho: 'Encerramento', disparos: 41, respostas: 3, taxa: 7.3 },
];

export const resultadoReativados = [
  { resultado: 'Qualificados → Closer', qtd: 18, pct: 58 },
  { resultado: 'Desqualificados novamente', qtd: 9, pct: 29 },
  { resultado: 'Ainda em qualificação', qtd: 4, pct: 13 },
];

export const fupPorStatusAnterior = [
  { statusAnterior: 'DESQUALIFICADO', qtd: 67, reativados: 14, taxa: 21 },
  { statusAnterior: 'Sem resposta', qtd: 57, reativados: 17, taxa: 30 },
];

export const slaFup = {
  aguardandoFup1: '48h máx',
  intervalo: 'conforme sequência',
  leadsEspera: 23,
  proximoDisparo: 'amanhã 09:00',
};

export const evolucaoFup = [
  { dia: '02/01', disparos: 8, respostas: 1 },
  { dia: '05/01', disparos: 12, respostas: 2 },
  { dia: '08/01', disparos: 10, respostas: 1 },
  { dia: '12/01', disparos: 15, respostas: 3 },
  { dia: '15/01', disparos: 11, respostas: 2 },
  { dia: '19/01', disparos: 14, respostas: 2 },
  { dia: '22/01', disparos: 9, respostas: 1 },
  { dia: '26/01', disparos: 16, respostas: 3 },
  { dia: '29/01', disparos: 12, respostas: 2 },
  { dia: '02/02', disparos: 15, respostas: 3 },
  { dia: '05/02', disparos: 11, respostas: 2 },
  { dia: '09/02', disparos: 13, respostas: 2 },
  { dia: '12/02', disparos: 17, respostas: 4 },
  { dia: '16/02', disparos: 10, respostas: 1 },
  { dia: '19/02', disparos: 14, respostas: 2 },
  { dia: '23/02', disparos: 16, respostas: 3 },
  { dia: '26/02', disparos: 11, respostas: 1 },
];

export const leadsFupAtivos = [
  { nome: 'Marcos Silva', etapaAtual: 'FUP 3', proximoFup: '10/03/2026', diasEmFup: 5, canalOrigem: 'Meta Ads', ultimaResposta: '—' },
  { nome: 'Ana Costa', etapaAtual: 'FUP 5', proximoFup: '12/03/2026', diasEmFup: 10, canalOrigem: 'Google Ads', ultimaResposta: '05/03/2026' },
  { nome: 'Pedro Lima', etapaAtual: 'FUP 2', proximoFup: '09/03/2026', diasEmFup: 3, canalOrigem: 'Site', ultimaResposta: '—' },
  { nome: 'Julia Mendes', etapaAtual: 'FUP 7', proximoFup: '20/03/2026', diasEmFup: 21, canalOrigem: 'Meta Ads', ultimaResposta: '01/03/2026' },
  { nome: 'Ricardo Alves', etapaAtual: 'FUP 4', proximoFup: '11/03/2026', diasEmFup: 7, canalOrigem: 'WhatsApp Direto', ultimaResposta: '—' },
  { nome: 'Carla Souza', etapaAtual: 'FUP 6', proximoFup: '15/03/2026', diasEmFup: 14, canalOrigem: 'Meta Ads', ultimaResposta: '—' },
  { nome: 'Fernando Dias', etapaAtual: 'FUP 1', proximoFup: '08/03/2026', diasEmFup: 1, canalOrigem: 'Google Ads', ultimaResposta: '—' },
  { nome: 'Beatriz Rocha', etapaAtual: 'FUP 8', proximoFup: '25/03/2026', diasEmFup: 30, canalOrigem: 'Site', ultimaResposta: '28/02/2026' },
];

// ─── PAGE 5: JORNADA DO LEAD + SLAs ────────────────────────────

export const slasJornada = [
  { etapa: 'Lead entra → Sol aborda', slaMeta: '3 min', realMedio: '1min 23s', status: 'dentro' as const, pctCumpriu: 94 },
  { etapa: 'Sol aborda → Lead responde', slaMeta: '10 min', realMedio: '4h 17min', status: 'depende' as const, pctCumpriu: 32 },
  { etapa: 'Sol → Lead qualificado', slaMeta: '10 min', realMedio: '8min 42s', status: 'dentro' as const, pctCumpriu: 87 },
  { etapa: 'Qualificado → Closer contata', slaMeta: '60 min', realMedio: '47min', status: 'dentro' as const, pctCumpriu: 78 },
  { etapa: 'Closer → Agendamento confirmado', slaMeta: '1 h', realMedio: '2h 14min', status: 'alerta' as const, pctCumpriu: 52 },
  { etapa: 'Agendamento → Reunião acontece', slaMeta: '5 dias', realMedio: '3,8 dias', status: 'dentro' as const, pctCumpriu: 71 },
  { etapa: 'Reunião → Proposta enviada', slaMeta: '3 h', realMedio: '5h 22min', status: 'alerta' as const, pctCumpriu: 45 },
  { etapa: 'Proposta → Fechamento', slaMeta: '7 dias', realMedio: '9,3 dias', status: 'fora' as const, pctCumpriu: 33 },
];

export const leadsPorEtapaAgora = [
  { etapa: 'Pré-venda', qtd: 23, tempoMedio: '2h', alertas: 0 },
  { etapa: 'Em qualificação', qtd: 12, tempoMedio: '18min', alertas: 0 },
  { etapa: 'Aguardando closer', qtd: 8, tempoMedio: '1h 12min', alertas: 2 },
  { etapa: 'Agendados', qtd: 14, tempoMedio: '2,1 dias', alertas: 0 },
  { etapa: 'Proposta enviada', qtd: 19, tempoMedio: '5,8 dias', alertas: 4 },
  { etapa: 'Em negociação', qtd: 6, tempoMedio: '4,2 dias', alertas: 0 },
];

export const gargalos = [
  { etapa: 'Proposta → Fechamento', real: '9,3 dias', meta: '7 dias', pctAcima: 38, severidade: 'critico' as const, sugestao: 'Automatizar lembretes de follow-up pós-proposta' },
  { etapa: 'Reunião → Proposta', real: '5h 22min', meta: '3h', pctAcima: 25, severidade: 'alerta' as const, sugestao: 'Oportunidade de automação na geração de propostas' },
  { etapa: 'Closer → Agendamento', real: '2h 14min', meta: '1h', pctAcima: 18, severidade: 'alerta' as const, sugestao: 'Considerar alertas automáticos para o closer' },
];

export const abandonoPorEtapa = [
  { etapa: 'Pré-venda', abandonaram: 7, motivoPrincipal: 'Não respondeu' },
  { etapa: 'Qualificação', abandonaram: 50, motivoPrincipal: 'Desqualificado pelo Sol' },
  { etapa: 'Comercial', abandonaram: 60, motivoPrincipal: 'Closer não fechou' },
  { etapa: 'Proposta', abandonaram: 38, motivoPrincipal: 'Perdido na negociação' },
];

export const distribuicaoTempoPorEtapa = [
  { range: '0-1h', preVenda: 45, qualificacao: 65, closer: 30, proposta: 5 },
  { range: '1-3h', preVenda: 25, qualificacao: 20, closer: 25, proposta: 8 },
  { range: '3-6h', preVenda: 15, qualificacao: 10, closer: 20, proposta: 12 },
  { range: '6-12h', preVenda: 8, qualificacao: 3, closer: 12, proposta: 15 },
  { range: '1-3d', preVenda: 5, qualificacao: 2, closer: 8, proposta: 25 },
  { range: '3-7d', preVenda: 2, qualificacao: 0, closer: 5, proposta: 20 },
  { range: '7-15d', preVenda: 0, qualificacao: 0, closer: 0, proposta: 10 },
  { range: '15-30d', preVenda: 0, qualificacao: 0, closer: 0, proposta: 5 },
];
