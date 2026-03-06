import { useMemo } from 'react';
import { useGoogleSheetsData, Proposal } from '@/hooks/useGoogleSheetsData';
import { useMakeDataStore, MakeRecord, normalizePhone, buildMakeMap } from '@/hooks/useMakeDataStore';
import { adaptSheetData, getVendedorPerformance, getKPIs } from '@/data/dataAdapter';

// ─── Helpers ───
function parseTemp(t: string): 'QUENTE' | 'MORNO' | 'FRIO' | '' {
  const n = (t || '').toUpperCase().trim();
  if (n.includes('QUENTE')) return 'QUENTE';
  if (n.includes('MORNO')) return 'MORNO';
  if (n.includes('FRIO')) return 'FRIO';
  return '';
}

function isSolQualificado(p: Proposal): boolean {
  const v = (p.sol_qualificado || '').toLowerCase().trim();
  return v === 'sim' || v === 'yes' || v === 'true' || v === '1' || v === 'qualificado';
}

function extractOrigem(etiquetas: string): string {
  if (!etiquetas) return 'Outros';
  const tags = etiquetas.split(',').map(t => t.trim().toLowerCase());
  const origemMap: Record<string, string> = {
    'meta': 'Meta', 'facebook': 'Meta', 'instagram': 'Meta',
    'google': 'Google', 'google ads': 'Google',
    'site': 'Site', 'website': 'Site',
    'indicação': 'Indicação', 'indicacao': 'Indicação', 'referral': 'Indicação',
    'orgânico': 'Orgânico', 'organico': 'Orgânico',
  };
  for (const tag of tags) {
    for (const [key, val] of Object.entries(origemMap)) {
      if (tag.includes(key)) return val;
    }
  }
  return 'Outros';
}

function safeDate(str: string | undefined | null): Date | null {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function hourBucket(d: Date): 'Manhã' | 'Tarde' | 'Noite' {
  const h = d.getHours();
  if (h < 12) return 'Manhã';
  if (h < 18) return 'Tarde';
  return 'Noite';
}

function formatCurrencyShort(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
  return `R$ ${v.toFixed(0)}`;
}

const SOL_PIPELINE_MAP: Record<string, string> = {
  'TRAFEGO PAGO': 'Robô SOL',
  'PROSPECÇÃO': 'Robô SOL',
  'QUALIFICAÇÃO': 'Qualificação',
  'QUALIFICADO': 'Qualificado',
  'CONTATO REALIZADO': 'Closer',
  'PROPOSTA': 'Proposta',
  'NEGOCIAÇÃO': 'Proposta',
};

function getSolStage(etapa: string, status: string): string {
  const upper = (etapa || '').toUpperCase().trim();
  const mapped = SOL_PIPELINE_MAP[upper];
  if (status?.toLowerCase() === 'ganho') return 'Fechado';
  return mapped || 'Robô SOL';
}

// ─── Main Hook ───
export function useBIData() {
  const { data: sheetsData, isLoading: sheetsLoading, error: sheetsError } = useGoogleSheetsData();
  const { data: makeRecords, isLoading: makeLoading } = useMakeDataStore();

  const proposals = useMemo(() => sheetsData?.data || [], [sheetsData]);
  const adaptedProposals = useMemo(() => {
    if (!sheetsData?.data) return [];
    return adaptSheetData(sheetsData.data as any);
  }, [sheetsData]);

  const makeMap = useMemo(() => {
    if (!makeRecords) return new Map<string, MakeRecord[]>();
    return buildMakeMap(makeRecords);
  }, [makeRecords]);

  const allMakeRecords = makeRecords || [];

  // ═══ SOL SDR (V5-V8) ═══
  const solSDR = useMemo(() => {
    const total = allMakeRecords.length;
    const solRecords = allMakeRecords.filter(r => r.robo === 'sol');
    const fupRecords = allMakeRecords.filter(r => r.robo === 'fup_frio');

    // V5: Funil real-time
    const responderam = solRecords.filter(r => r.status_resposta === 'respondeu');
    const qualificados = proposals.filter(p => isSolQualificado(p));
    const closers = proposals.filter(p => {
      const stage = getSolStage(p.etapa, p.status);
      return stage === 'Closer' || stage === 'Proposta' || stage === 'Fechado';
    });
    const fechados = proposals.filter(p => (p.status || '').toLowerCase().includes('ganho'));

    const funil = [
      { etapa: 'Leads Recebidos', valor: solRecords.length, icon: '📥' },
      { etapa: 'Responderam', valor: responderam.length, icon: '💬' },
      { etapa: 'MQL (Qualificados)', valor: qualificados.length, icon: '✅' },
      { etapa: 'Closer', valor: closers.length, icon: '🎯' },
      { etapa: 'Fechados', valor: fechados.length, icon: '🏆' },
    ];

    // V6: Motivos de desqualificação
    const desqualificados = proposals.filter(p => !isSolQualificado(p) && p.nota_completa);
    const motivosMap: Record<string, number> = {};
    desqualificados.forEach(p => {
      const nota = (p.nota_completa || '').toLowerCase();
      let motivo = 'Outros';
      if (nota.includes('consumo') || nota.includes('kwh') || nota.includes('baixo')) motivo = 'Consumo baixo';
      else if (nota.includes('financ') || nota.includes('crédito')) motivo = 'Sem crédito';
      else if (nota.includes('aluguel') || nota.includes('alugado')) motivo = 'Imóvel alugado';
      else if (nota.includes('interesse') || nota.includes('desist')) motivo = 'Sem interesse';
      else if (nota.includes('concorr') || nota.includes('outra')) motivo = 'Concorrência';
      motivosMap[motivo] = (motivosMap[motivo] || 0) + 1;
    });
    const totalDesqual = Object.values(motivosMap).reduce((a, b) => a + b, 0) || 1;
    const colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
    const motivos = Object.entries(motivosMap)
      .sort((a, b) => b[1] - a[1])
      .map(([motivo, count], i) => ({
        motivo,
        pct: Math.round((count / totalDesqual) * 100),
        count,
        fill: colors[i % colors.length],
      }));

    // V7: Performance por turno
    const turnos = { 'Manhã': { total: 0, responderam: 0 }, 'Tarde': { total: 0, responderam: 0 }, 'Noite': { total: 0, responderam: 0 } };
    solRecords.forEach(r => {
      const d = safeDate(r.data_envio);
      if (!d) return;
      const turno = hourBucket(d);
      turnos[turno].total++;
      if (r.status_resposta === 'respondeu') turnos[turno].responderam++;
    });
    const performanceTurno = Object.entries(turnos).map(([turno, v]) => ({
      turno,
      total: v.total,
      responderam: v.responderam,
      taxa: v.total > 0 ? Math.round((v.responderam / v.total) * 100) : 0,
    }));

    // V8: Qualidade do lead entregue
    const leadsEntregues = proposals.filter(p => {
      const stage = getSolStage(p.etapa, p.status);
      return stage !== 'Robô SOL';
    });
    const leadsComScore = leadsEntregues.filter(p => parseFloat(p.sol_score) > 0);
    const scoreMedio = leadsComScore.length > 0
      ? leadsComScore.reduce((acc, p) => acc + parseFloat(p.sol_score), 0) / leadsComScore.length
      : 0;
    const quentes = leadsEntregues.filter(p => parseTemp(p.temperatura) === 'QUENTE').length;
    const mornos = leadsEntregues.filter(p => parseTemp(p.temperatura) === 'MORNO').length;
    const frios = leadsEntregues.filter(p => parseTemp(p.temperatura) === 'FRIO').length;

    const qualidadeLead = {
      totalEntregues: leadsEntregues.length,
      scoreMedio: Math.round(scoreMedio * 10) / 10,
      quentes,
      mornos,
      frios,
      pctQuentes: leadsEntregues.length > 0 ? Math.round((quentes / leadsEntregues.length) * 100) : 0,
    };

    return { funil, motivos, performanceTurno, qualidadeLead };
  }, [allMakeRecords, proposals]);

  // ═══ FUP Frio ═══
  const fupFrio = useMemo(() => {
    const fupRecords = allMakeRecords.filter(r => r.robo === 'fup_frio');
    const totalFup = fupRecords.length;
    if (totalFup === 0) return null;

    const responderam = fupRecords.filter(r => r.status_resposta === 'respondeu');
    const ignoraram = fupRecords.filter(r => r.status_resposta === 'ignorou');
    const aguardando = fupRecords.filter(r => r.status_resposta === 'aguardando');

    // Cross-reference with proposals to find rescued leads
    const fupPhones = new Set(fupRecords.map(r => r.telefone));
    const leadsResgatados = proposals.filter(p => {
      const phone = normalizePhone(p.cliente_telefone || '');
      if (!fupPhones.has(phone)) return false;
      const stage = getSolStage(p.etapa, p.status);
      return stage === 'Qualificado' || stage === 'Closer' || stage === 'Proposta' || stage === 'Fechado';
    });
    const leadsFechados = proposals.filter(p => {
      const phone = normalizePhone(p.telefone || '');
      if (!fupPhones.has(phone)) return false;
      return (p.status || '').toLowerCase().includes('ganho');
    });

    const valorResgatado = leadsResgatados.reduce((acc, p) => acc + (p.valor_proposta || 0), 0);
    const valorFechado = leadsFechados.reduce((acc, p) => acc + (p.valor_proposta || 0), 0);

    // Funil
    const funil = [
      { etapa: 'Leads no FUP', valor: totalFup, icon: '🧊' },
      { etapa: 'Responderam', valor: responderam.length, icon: '💬' },
      { etapa: 'Resgatados (Pipeline)', valor: leadsResgatados.length, icon: '🔄' },
      { etapa: 'Fechados', valor: leadsFechados.length, icon: '🏆' },
    ];

    // Taxa de resgate
    const taxaResposta = totalFup > 0 ? Math.round((responderam.length / totalFup) * 100) : 0;
    const taxaResgate = totalFup > 0 ? Math.round((leadsResgatados.length / totalFup) * 100) : 0;
    const taxaFechamento = leadsResgatados.length > 0 ? Math.round((leadsFechados.length / leadsResgatados.length) * 100) : 0;

    const resgate = {
      taxaResposta,
      taxaResgate,
      taxaFechamento,
      valorResgatado,
      valorFechado,
      totalResgatados: leadsResgatados.length,
      totalFechados: leadsFechados.length,
    };

    // Tentativas × Conversão: analyze historico length as proxy for attempts
    const tentativasMap: Record<string, { total: number; responderam: number; resgatados: number }> = {};
    fupRecords.forEach(r => {
      const attempts = r.historico.filter(h => h.tipo === 'enviada').length;
      const faixa = attempts <= 1 ? '1' : attempts <= 3 ? '2-3' : attempts <= 5 ? '4-5' : '6+';
      if (!tentativasMap[faixa]) tentativasMap[faixa] = { total: 0, responderam: 0, resgatados: 0 };
      tentativasMap[faixa].total++;
      if (r.status_resposta === 'respondeu') tentativasMap[faixa].responderam++;
      const phone = r.telefone;
      const rescued = leadsResgatados.some(p => normalizePhone(p.telefone || '') === phone);
      if (rescued) tentativasMap[faixa].resgatados++;
    });

    const tentativasOrder = ['1', '2-3', '4-5', '6+'];
    const tentativasConversao = tentativasOrder
      .filter(f => tentativasMap[f])
      .map(faixa => ({
        faixa,
        total: tentativasMap[faixa].total,
        responderam: tentativasMap[faixa].responderam,
        resgatados: tentativasMap[faixa].resgatados,
        taxaResposta: tentativasMap[faixa].total > 0 ? Math.round((tentativasMap[faixa].responderam / tentativasMap[faixa].total) * 100) : 0,
        taxaResgate: tentativasMap[faixa].total > 0 ? Math.round((tentativasMap[faixa].resgatados / tentativasMap[faixa].total) * 100) : 0,
      }));

    // Performance por turno
    const turnos = { 'Manhã': { total: 0, responderam: 0 }, 'Tarde': { total: 0, responderam: 0 }, 'Noite': { total: 0, responderam: 0 } };
    fupRecords.forEach(r => {
      const d = safeDate(r.data_envio);
      if (!d) return;
      const turno = hourBucket(d);
      turnos[turno].total++;
      if (r.status_resposta === 'respondeu') turnos[turno].responderam++;
    });
    const performanceTurnoFup = Object.entries(turnos).map(([turno, v]) => ({
      turno,
      total: v.total,
      responderam: v.responderam,
      taxa: v.total > 0 ? Math.round((v.responderam / v.total) * 100) : 0,
    }));

    // Alertas
    const alertas: { tipo: 'danger' | 'warning' | 'success' | 'info'; titulo: string; desc: string }[] = [];
    if (taxaResposta > 20) alertas.push({ tipo: 'success', titulo: `Taxa de resposta ${taxaResposta}%`, desc: 'FUP Frio está gerando engajamento acima da média' });
    if (aguardando.length > totalFup * 0.5) alertas.push({ tipo: 'warning', titulo: `${aguardando.length} leads sem resposta`, desc: 'Mais da metade dos leads de FUP ainda não responderam' });
    if (valorResgatado > 0) alertas.push({ tipo: 'success', titulo: `${formatCurrencyShort(valorResgatado)} em pipeline`, desc: `${leadsResgatados.length} leads resgatados pelo FUP Frio` });
    if (leadsFechados.length > 0) alertas.push({ tipo: 'success', titulo: `${leadsFechados.length} vendas fechadas`, desc: `${formatCurrencyShort(valorFechado)} em receita recuperada` });
    if (ignoraram.length > totalFup * 0.7) alertas.push({ tipo: 'danger', titulo: `${ignoraram.length} leads ignorando`, desc: 'Mais de 70% dos leads de FUP não responderam — revisar abordagem' });

    return { funil, resgate, tentativasConversao, performanceTurnoFup, alertas, totalFup, responderam: responderam.length, aguardando: aguardando.length, ignoraram: ignoraram.length };
  }, [allMakeRecords, proposals]);

  // ═══ SolarMarket (V9-V11) ═══
  const solarMarket = useMemo(() => {
    const adapted = adaptedProposals;
    if (adapted.length === 0) return null;

    // V9: Funil comercial
    const etapasOrder = ['TRAFEGO PAGO', 'PROSPECÇÃO', 'QUALIFICAÇÃO', 'QUALIFICADO', 'CONTATO REALIZADO', 'PROPOSTA', 'NEGOCIAÇÃO'];
    const funilComercial = etapasOrder.map(etapa => {
      const count = proposals.filter(p => (p.etapa || '').toUpperCase().trim() === etapa).length;
      return { etapa, valor: count };
    }).filter(e => e.valor > 0);

    // V10: Performance por vendedor (reuse adapter)
    const vendedores = getVendedorPerformance(adapted);

    // V11: Inteligência de proposta
    const kpis = getKPIs(adapted);
    const ganhos = adapted.filter(p => p.status === 'Ganho');
    const abertos = adapted.filter(p => p.status === 'Aberto');

    const inteligenciaProposta = {
      ticketMedio: kpis.ticketMedio,
      cicloProposta: kpis.cicloProposta,
      taxaConversao: kpis.taxaConversao,
      valorPipeline: kpis.valorPipeline,
      valorGanho: kpis.valorGanho,
      negociosAbertos: abertos.length,
      negociosGanhos: ganhos.length,
    };

    return { funilComercial, vendedores, inteligenciaProposta };
  }, [adaptedProposals, proposals]);

  // ═══ Cruzamentos Grupo B (SDR × SolarMarket) ═══
  const cruzamentosB = useMemo(() => {
    if (proposals.length === 0 || allMakeRecords.length === 0) return null;

    // C4: Aproveitamento do lead qualificado
    const qualificadosSol = proposals.filter(p => isSolQualificado(p));
    const qualificadosQueAvancaram = qualificadosSol.filter(p => {
      const stage = getSolStage(p.etapa, p.status);
      return stage === 'Closer' || stage === 'Proposta' || stage === 'Fechado';
    });
    const qualificadosQueFecharam = qualificadosSol.filter(p => (p.status || '').toLowerCase().includes('ganho'));

    const aproveitamento = {
      totalQualificados: qualificadosSol.length,
      avancaram: qualificadosQueAvancaram.length,
      fecharam: qualificadosQueFecharam.length,
      taxaAproveitamento: qualificadosSol.length > 0
        ? Math.round((qualificadosQueAvancaram.length / qualificadosSol.length) * 100)
        : 0,
      taxaFechamento: qualificadosSol.length > 0
        ? Math.round((qualificadosQueFecharam.length / qualificadosSol.length) * 100)
        : 0,
    };

    // C5: Perfil do lead que fecha
    const fechados = proposals.filter(p => (p.status || '').toLowerCase().includes('ganho'));
    const perfilMap: Record<string, { count: number; valorTotal: number }> = {};
    fechados.forEach(p => {
      const origem = extractOrigem(p.etiquetas);
      if (!perfilMap[origem]) perfilMap[origem] = { count: 0, valorTotal: 0 };
      perfilMap[origem].count++;
      perfilMap[origem].valorTotal += p.valor_proposta || 0;
    });
    const perfil = Object.entries(perfilMap).map(([origem, v]) => ({
      origem,
      fechados: v.count,
      valorTotal: v.valorTotal,
      ticketMedio: v.count > 0 ? Math.round(v.valorTotal / v.count) : 0,
    })).sort((a, b) => b.fechados - a.fechados);

    // C6: Velocidade × Conversão
    const velocidade = proposals
      .filter(p => p.data_criacao_projeto && p.data_criacao_proposta)
      .map(p => {
        const d1 = safeDate(p.data_criacao_projeto);
        const d2 = safeDate(p.data_criacao_proposta);
        if (!d1 || !d2) return null;
        const dias = Math.max(0, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
        const ganho = (p.status || '').toLowerCase().includes('ganho');
        return { dias, ganho };
      })
      .filter(Boolean) as { dias: number; ganho: boolean }[];

    const faixas = [
      { faixa: '0-7 dias', min: 0, max: 7 },
      { faixa: '8-15 dias', min: 8, max: 15 },
      { faixa: '16-30 dias', min: 16, max: 30 },
      { faixa: '31+ dias', min: 31, max: 9999 },
    ];
    const velocidadeConversao = faixas.map(f => {
      const items = velocidade.filter(v => v.dias >= f.min && v.dias <= f.max);
      const ganhos = items.filter(v => v.ganho);
      return {
        faixa: f.faixa,
        total: items.length,
        ganhos: ganhos.length,
        taxa: items.length > 0 ? Math.round((ganhos.length / items.length) * 100) : 0,
      };
    });

    return { aproveitamento, perfil, velocidadeConversao };
  }, [proposals, allMakeRecords]);

  // ═══ Cruzamento D C14: Lead em risco ═══
  const leadsEmRisco = useMemo(() => {
    if (proposals.length === 0) return [];
    return proposals
      .filter(p => {
        const status = (p.status || '').toLowerCase();
        if (status.includes('ganho') || status.includes('perdido')) return false;
        const tempoEtapa = parseInt(p.tempo_na_etapa) || 0;
        const temp = parseTemp(p.temperatura);
        return tempoEtapa > 7 || temp === 'FRIO';
      })
      .map(p => ({
        nome: p.nome_cliente,
        etapa: p.etapa,
        temperatura: parseTemp(p.temperatura),
        tempoNaEtapa: parseInt(p.tempo_na_etapa) || 0,
        valor: p.valor_proposta,
        score: parseFloat(p.sol_score) || 0,
      }))
      .sort((a, b) => b.tempoNaEtapa - a.tempoNaEtapa)
      .slice(0, 20);
  }, [proposals]);

  const hasData = proposals.length > 0 || allMakeRecords.length > 0;
  const isLoading = sheetsLoading || makeLoading;

  return {
    solSDR,
    solarMarket,
    cruzamentosB,
    leadsEmRisco,
    hasData,
    isLoading,
    error: sheetsError,
  };
}
