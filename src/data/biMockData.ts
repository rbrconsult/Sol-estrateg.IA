// ══════════════════════════════════════════════════════════
// MOCK DATA — BI Centro de Inteligência
// Placeholders para fontes não integradas (Ads, Sults)
// ══════════════════════════════════════════════════════════

// ─── ADS (V1-V4) — Placeholder ───
export const adsMockData = {
  // V1: Volume & CPL por canal
  volumeCPL: [
    { canal: 'Meta Ads', leads: 448, investimento: 22400, cpl: 50, conversao: 15 },
    { canal: 'Google Ads', leads: 176, investimento: 14080, cpl: 80, conversao: 25 },
    { canal: 'Display', leads: 44, investimento: 2640, cpl: 60, conversao: 8 },
    { canal: 'YouTube', leads: 22, investimento: 1760, cpl: 80, conversao: 12 },
  ],
  // V2: Qualidade por criativo
  criativos: [
    { nome: 'Economia na conta de luz', impressoes: 45000, cliques: 2250, leads: 180, cpl: 44, score: 82, tipo: 'Vídeo' },
    { nome: 'Financiamento facilitado', impressoes: 38000, cliques: 1900, leads: 140, cpl: 52, score: 71, tipo: 'Carrossel' },
    { nome: 'Antes e depois', impressoes: 32000, cliques: 1280, leads: 95, cpl: 63, score: 64, tipo: 'Imagem' },
    { nome: 'Depoimento cliente', impressoes: 28000, cliques: 1400, leads: 88, cpl: 48, score: 76, tipo: 'Vídeo' },
    { nome: 'Promoção sazonal', impressoes: 22000, cliques: 880, leads: 45, cpl: 71, score: 52, tipo: 'Imagem' },
  ],
  // V3: Sazonalidade
  sazonalidade: [
    { mes: 'Jan', leads: 520, cpl: 58, conversao: 12 },
    { mes: 'Fev', leads: 580, cpl: 55, conversao: 13 },
    { mes: 'Mar', leads: 720, cpl: 48, conversao: 15 },
    { mes: 'Abr', leads: 800, cpl: 45, conversao: 16 },
    { mes: 'Mai', leads: 680, cpl: 50, conversao: 14 },
    { mes: 'Jun', leads: 620, cpl: 52, conversao: 13 },
    { mes: 'Jul', leads: 580, cpl: 55, conversao: 12 },
    { mes: 'Ago', leads: 640, cpl: 51, conversao: 14 },
    { mes: 'Set', leads: 750, cpl: 46, conversao: 16 },
    { mes: 'Out', leads: 820, cpl: 44, conversao: 17 },
    { mes: 'Nov', leads: 880, cpl: 42, conversao: 18 },
    { mes: 'Dez', leads: 600, cpl: 54, conversao: 11 },
  ],
  // V4: Geografia
  geografia: [
    { regiao: 'Grande BH', leads: 320, conversao: 18, ticketMedio: 42000 },
    { regiao: 'Interior MG', leads: 180, conversao: 14, ticketMedio: 35000 },
    { regiao: 'Triângulo Mineiro', leads: 120, conversao: 16, ticketMedio: 38000 },
    { regiao: 'Sul de Minas', leads: 95, conversao: 12, ticketMedio: 32000 },
    { regiao: 'Zona da Mata', leads: 85, conversao: 10, ticketMedio: 30000 },
  ],
};

// ─── SULTS (V12-V13) — Placeholder ───
export const sultsMockData = {
  // V12: Funil operacional pós-venda
  funilOperacional: [
    { etapa: 'Venda fechada', valor: 120, icon: '🏆' },
    { etapa: 'Projeto técnico', valor: 108, icon: '📐' },
    { etapa: 'Aprovação concessionária', valor: 95, icon: '📋' },
    { etapa: 'Instalação', valor: 82, icon: '🔧' },
    { etapa: 'Vistoria', valor: 78, icon: '✅' },
    { etapa: 'Homologação', valor: 72, icon: '⚡' },
  ],
  // V13: Eficiência técnica
  eficiencia: [
    { equipe: 'Equipe A', instalacoes: 28, tempoMedio: 2.1, satisfacao: 4.8, retrabalho: 2 },
    { equipe: 'Equipe B', instalacoes: 24, tempoMedio: 2.5, satisfacao: 4.5, retrabalho: 5 },
    { equipe: 'Equipe C', instalacoes: 18, tempoMedio: 3.2, satisfacao: 4.2, retrabalho: 8 },
    { equipe: 'Equipe D', instalacoes: 22, tempoMedio: 2.8, satisfacao: 4.6, retrabalho: 4 },
  ],
};

// ─── CRUZAMENTOS MOCK (para grupos sem dados reais) ───
export const cruzamentosMock = {
  // Grupo A — Ads × SDR
  custoRealLeadQualificado: [
    { canal: 'Meta Ads', cplBruto: 50, cplQualificado: 135, qualificados: 166, desperdicio: 62 },
    { canal: 'Google Ads', cplBruto: 80, cplQualificado: 142, qualificados: 99, desperdicio: 44 },
    { canal: 'Site', cplBruto: 0, cplQualificado: 0, qualificados: 33, desperdicio: 0 },
    { canal: 'Indicação', cplBruto: 0, cplQualificado: 0, qualificados: 15, desperdicio: 0 },
  ],
  criativoPerfilErrado: [
    { criativo: 'Promoção sazonal', leads: 45, qualificados: 8, pctErrado: 82, motivoPrincipal: 'Consumo baixo' },
    { criativo: 'Economia genérica', leads: 38, qualificados: 12, pctErrado: 68, motivoPrincipal: 'Sem financiamento' },
  ],
  janelaOuro: [
    { horario: '08-10h', leads: 120, taxaResposta: 72, taxaConversao: 22 },
    { horario: '10-12h', leads: 180, taxaResposta: 68, taxaConversao: 18 },
    { horario: '14-16h', leads: 150, taxaResposta: 58, taxaConversao: 15 },
    { horario: '18-20h', leads: 200, taxaResposta: 75, taxaConversao: 24 },
    { horario: '20-22h', leads: 100, taxaResposta: 80, taxaConversao: 20 },
    { horario: '22-08h', leads: 50, taxaResposta: 45, taxaConversao: 10 },
  ],
  // Grupo D — parcial (mock para itens sem dados)
  cacReal: { ads: 39200, sdr: 8000, closer: 12000, total: 59200, porVenda: 493, porLeadQualificado: 200 },
  ltvPerfil: [
    { perfil: 'Residencial pequeno', ticket: 25000, recorrencia: 1.2, ltv: 30000 },
    { perfil: 'Residencial médio', ticket: 42000, recorrencia: 1.4, ltv: 58800 },
    { perfil: 'Comercial', ticket: 85000, recorrencia: 1.6, ltv: 136000 },
    { perfil: 'Industrial', ticket: 180000, recorrencia: 1.8, ltv: 324000 },
  ],
};
