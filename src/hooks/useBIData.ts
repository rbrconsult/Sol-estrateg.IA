import { useMemo } from 'react';
import { useCommercialProposals } from '@/hooks/useCommercialProposals';
import { useSolLeads, normalizePhone, type SolLead } from '@/hooks/useSolData';
import { useGlobalFilters } from '@/contexts/GlobalFilterContext';
import { getVendedorPerformance, getKPIs } from '@/data/dataAdapter';

// ─── Helpers ───
function parseTemp(t: string): 'QUENTE' | 'MORNO' | 'FRIO' | '' {
  const n = (t || '').toUpperCase().trim();
  if (n.includes('QUENTE')) return 'QUENTE';
  if (n.includes('MORNO')) return 'MORNO';
  if (n.includes('FRIO')) return 'FRIO';
  return '';
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
  const raw = String(str).trim();
  if (!raw) return null;
  // DD/MM/YYYY or DD-MM-YYYY first to avoid US-style misinterpretation
  const br = raw.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (br) {
    const [, dd, mm, yyyy, hh = '00', min = '00', ss = '00'] = br;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min), Number(ss));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(raw);
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
  'TRAFEGO PAGO': 'Tráfego Pago',
  'SOL SDR': 'Robô SOL',
  'FOLLOW UP': 'Robô SOL',
  'QUALIFICADO': 'Qualificado',
  'CONTATO REALIZADO': 'Closer',
  'PROPOSTA': 'Proposta',
  'NEGOCIAÇÃO': 'Proposta',
  'COBRANÇA': 'Proposta',
  'DECLÍNIO': 'Declínio',
  'REMARKETING': 'Declínio',
};

function getSolStage(etapa: string, status: string): string {
  const upper = (etapa || '').toUpperCase().trim();
  const mapped = SOL_PIPELINE_MAP[upper];
  if (status?.toUpperCase() === 'GANHO') return 'Fechado';
  if (status?.toUpperCase() === 'PERDIDO') return 'Declínio';
  return mapped || 'Tráfego Pago';
}

/** Robô SDR (qualificação inicial) — antes da sequência FUP Frio */
function isSolSdrRecord(r: SolLead): boolean {
  return (r.fup_followup_count ?? 0) < 1;
}

/** Leads na sequência FUP Frio (≥1 disparo) */
function isFupFrioRecord(r: SolLead): boolean {
  return (r.fup_followup_count ?? 0) >= 1;
}

function statusResposta(r: SolLead): string {
  return String((r as { status_resposta?: string }).status_resposta || (r as { _status_resposta?: string })._status_resposta || '').toLowerCase();
}

// ─── Main Hook ───
export function useBIData() {
  const gf = useGlobalFilters();
  const {
    proposals: enrichedProposals,
    isLoading: proposalsLoading,
    error: proposalsError,
    dataUpdatedAt: projetosDataUpdatedAt,
  } = useCommercialProposals();
  const { data: solLeads, isLoading: makeLoading, dataUpdatedAt: leadsDataUpdatedAt } = useSolLeads();

  const filteredProposals = useMemo(
    () => gf.filterProposals(enrichedProposals),
    [enrichedProposals, gf.filterProposals],
  );

  const filteredSolLeads = useMemo(
    () => gf.filterRecords(solLeads || []),
    [solLeads, gf.filterRecords],
  );

  const allSolLeads = filteredSolLeads;

  // ═══ SOL SDR (V5-V8) ═══
  const solSDR = useMemo(() => {
    const solRecords = allSolLeads.filter(isSolSdrRecord);

    // V5: Funil real-time
    const responderam = solRecords.filter(r => statusResposta(r) === 'respondeu');
    const qualificados = filteredProposals.filter(p => p.solQualificado);
    const closers = filteredProposals.filter(p => {
      const stage = getSolStage(p.etapa, p.status);
      return stage === 'Closer' || stage === 'Proposta' || stage === 'Fechado';
    });
    const fechados = filteredProposals.filter(p => p.status === 'Ganho');

    const funilStages = [
      { etapa: 'Leads Recebidos', valor: solRecords.length, icon: '📥' },
      { etapa: 'Responderam', valor: responderam.length, icon: '💬' },
      { etapa: 'MQL', valor: qualificados.length, icon: '✅' },
      { etapa: 'Closer', valor: closers.length, icon: '🎯' },
      { etapa: 'Fechados', valor: fechados.length, icon: '🏆' },
    ];
    const funil = funilStages.map((stage, i) => {
      const prevVal = i > 0 ? funilStages[i - 1]!.valor : stage.valor;
      const pctAnterior =
        i === 0 ? 100 : prevVal > 0 ? Math.min(100, Math.round((stage.valor / prevVal) * 100)) : 0;
      return { ...stage, pctAnterior };
    });

    // V6: Motivos de desqualificação
    const desqualificados = filteredProposals.filter(p => !p.solQualificado && p.notaCompleta);
    const motivosMap: Record<string, number> = {};
    desqualificados.forEach(p => {
      const nota = (p.notaCompleta || '').toLowerCase();
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
      const d = safeDate(r.ts_cadastro);
      if (!d) return;
      const turno = hourBucket(d);
      turnos[turno].total++;
      if (statusResposta(r) === 'respondeu') turnos[turno].responderam++;
    });
    const performanceTurno = Object.entries(turnos).map(([turno, v]) => ({
      turno,
      total: v.total,
      responderam: v.responderam,
      taxa: v.total > 0 ? Math.round((v.responderam / v.total) * 100) : 0,
    }));

    // V8: Qualidade do lead entregue
    const leadsEntregues = filteredProposals.filter(p => {
      const stage = getSolStage(p.etapa, p.status);
      return stage !== 'Robô SOL';
    });
    const leadsComScore = leadsEntregues.filter(p => p.solScore > 0);
    const scoreMedio = leadsComScore.length > 0
      ? leadsComScore.reduce((acc, p) => acc + p.solScore, 0) / leadsComScore.length
      : 0;
    const quentes = leadsEntregues.filter(p => p.temperatura === 'QUENTE').length;
    const mornos = leadsEntregues.filter(p => p.temperatura === 'MORNO').length;
    const frios = leadsEntregues.filter(p => p.temperatura === 'FRIO').length;

    const qualidadeLead = {
      totalEntregues: leadsEntregues.length,
      scoreMedio: Math.round(scoreMedio * 10) / 10,
      quentes,
      mornos,
      frios,
      pctQuentes: leadsEntregues.length > 0 ? Math.round((quentes / leadsEntregues.length) * 100) : 0,
    };

    return { funil, motivos, performanceTurno, qualidadeLead };
  }, [allSolLeads, filteredProposals]);

  // ═══ FUP Frio ═══
  const fupFrio = useMemo(() => {
    const fupRecords = allSolLeads.filter(isFupFrioRecord);
    const totalFup = fupRecords.length;
    const empty = {
      funil: [] as { etapa: string; valor: number; icon: string }[],
      resgate: {
        taxaResposta: 0,
        taxaResgate: 0,
        taxaFechamento: 0,
        valorResgatado: 0,
        valorFechado: 0,
        totalResgatados: 0,
        totalFechados: 0,
      },
      tentativasConversao: [] as { faixa: string; total: number; responderam: number; resgatados: number; taxaResposta: number; taxaResgate: number }[],
      performanceTurnoFup: [] as { turno: string; total: number; responderam: number; taxa: number }[],
      alertas: [] as { tipo: 'danger' | 'warning' | 'success' | 'info'; titulo: string; desc: string }[],
      totalFup: 0,
      responderam: 0,
      aguardando: 0,
      ignoraram: 0,
      etapasResposta: [] as { etapa: string; pctResposta: number }[],
    };
    if (totalFup === 0) return empty;

    const responderam = fupRecords.filter(r => statusResposta(r) === 'respondeu');
    const ignoraram = fupRecords.filter(r => statusResposta(r) === 'ignorou');
    const aguardando = fupRecords.filter(r => statusResposta(r) === 'aguardando');

    // Cross-reference with proposals to find rescued leads
    const fupPhones = new Set(fupRecords.map(r => r.telefone));
    const leadsResgatados = filteredProposals.filter(p => {
      const phone = normalizePhone(p.clienteTelefone || '');
      if (!fupPhones.has(phone)) return false;
      const stage = getSolStage(p.etapa, p.status);
      return stage === 'Qualificado' || stage === 'Closer' || stage === 'Proposta' || stage === 'Fechado';
    });
    const leadsFechados = filteredProposals.filter(p => {
      const phone = normalizePhone(p.clienteTelefone || '');
      if (!fupPhones.has(phone)) return false;
      return p.status === 'Ganho';
    });

    const valorResgatado = leadsResgatados.reduce((acc, p) => acc + (p.valorProposta || 0), 0);
    const valorFechado = leadsFechados.reduce((acc, p) => acc + (p.valorProposta || 0), 0);

    const funil = [
      { etapa: 'Leads no FUP', valor: totalFup, icon: '🧊' },
      { etapa: 'Responderam', valor: responderam.length, icon: '💬' },
      { etapa: 'Resgatados (Pipeline)', valor: leadsResgatados.length, icon: '🔄' },
      { etapa: 'Fechados', valor: leadsFechados.length, icon: '🏆' },
    ];

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

    const tentativasMap: Record<string, { total: number; responderam: number; resgatados: number }> = {};
    fupRecords.forEach(r => {
      const attempts = Math.max(1, r.fup_followup_count ?? 1);
      const faixa = attempts <= 1 ? '1' : attempts <= 3 ? '2-3' : attempts <= 5 ? '4-5' : '6+';
      if (!tentativasMap[faixa]) tentativasMap[faixa] = { total: 0, responderam: 0, resgatados: 0 };
      tentativasMap[faixa].total++;
      if (statusResposta(r) === 'respondeu') tentativasMap[faixa].responderam++;
      const phone = r.telefone;
      const rescued = leadsResgatados.some(p => normalizePhone(p.clienteTelefone || '') === phone);
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

    const turnos = { 'Manhã': { total: 0, responderam: 0 }, 'Tarde': { total: 0, responderam: 0 }, 'Noite': { total: 0, responderam: 0 } };
    fupRecords.forEach(r => {
      const d = safeDate(r.ts_cadastro);
      if (!d) return;
      const turno = hourBucket(d);
      turnos[turno].total++;
      if (statusResposta(r) === 'respondeu') turnos[turno].responderam++;
    });
    const performanceTurnoFup = Object.entries(turnos).map(([turno, v]) => ({
      turno,
      total: v.total,
      responderam: v.responderam,
      taxa: v.total > 0 ? Math.round((v.responderam / v.total) * 100) : 0,
    }));

    const alertas: { tipo: 'danger' | 'warning' | 'success' | 'info'; titulo: string; desc: string }[] = [];
    if (taxaResposta > 20) alertas.push({ tipo: 'success', titulo: `Taxa de resposta ${taxaResposta}%`, desc: 'FUP Frio está gerando engajamento acima da média' });
    if (aguardando.length > totalFup * 0.5) alertas.push({ tipo: 'warning', titulo: `${aguardando.length} leads sem resposta`, desc: 'Mais da metade dos leads de FUP ainda não responderam' });
    if (valorResgatado > 0) alertas.push({ tipo: 'success', titulo: `${formatCurrencyShort(valorResgatado)} em pipeline`, desc: `${leadsResgatados.length} leads resgatados pelo FUP Frio` });
    if (leadsFechados.length > 0) alertas.push({ tipo: 'success', titulo: `${leadsFechados.length} vendas fechadas`, desc: `${formatCurrencyShort(valorFechado)} em receita recuperada` });
    if (ignoraram.length > totalFup * 0.7) alertas.push({ tipo: 'danger', titulo: `${ignoraram.length} leads ignorando`, desc: 'Mais de 70% dos leads de FUP não responderam — revisar abordagem' });

    const etapasResposta = tentativasConversao.map(t => ({
      etapa: `FUP ${t.faixa}`,
      pctResposta: t.taxaResposta,
    }));

    return {
      funil,
      resgate,
      tentativasConversao,
      performanceTurnoFup,
      alertas,
      totalFup,
      responderam: responderam.length,
      aguardando: aguardando.length,
      ignoraram: ignoraram.length,
      etapasResposta,
    };
  }, [allSolLeads, filteredProposals]);

  // ═══ SolarMarket (V9-V11) ═══
  const solarMarket = useMemo(() => {
    if (filteredProposals.length === 0) return null;

    // V9: Funil comercial
    const etapasOrder = ['TRAFEGO PAGO', 'PROSPECÇÃO', 'QUALIFICAÇÃO', 'QUALIFICADO', 'CONTATO REALIZADO', 'PROPOSTA', 'NEGOCIAÇÃO'];
    const funilComercial = etapasOrder.map(etapa => {
      const count = filteredProposals.filter(p => (p.etapa || '').toUpperCase().trim() === etapa).length;
      return { etapa, valor: count };
    }).filter(e => e.valor > 0);

    // V10: Performance por vendedor
    const vendedores = getVendedorPerformance(filteredProposals);

    // V11: Inteligência de proposta
    const kpis = getKPIs(filteredProposals);
    const ganhos = filteredProposals.filter(p => p.status === 'Ganho');
    const abertos = filteredProposals.filter(p => p.status === 'Aberto');

    const valorGanho = kpis.valorGanho;
    const ticketMedioGanho = ganhos.length > 0 ? valorGanho / ganhos.length : 0;

    const inteligenciaProposta = {
      ticketMedio: kpis.ticketMedio,
      ticketMedioGanho,
      cicloProposta: kpis.cicloProposta,
      taxaConversao: kpis.taxaConversao,
      valorPipeline: kpis.valorPipeline,
      valorGanho,
      negociosAbertos: abertos.length,
      negociosGanhos: ganhos.length,
      totalNegocios: filteredProposals.length,
    };

    return { funilComercial, vendedores, inteligenciaProposta };
  }, [filteredProposals]);

  // ═══ Cruzamentos Grupo B (SDR × SolarMarket) ═══
  const cruzamentosB = useMemo(() => {
    if (filteredProposals.length === 0 || filteredSolLeads.length === 0) return null;

    // C4: Aproveitamento do lead qualificado
    const qualificadosSol = filteredProposals.filter(p => p.solQualificado);
    const qualificadosQueAvancaram = qualificadosSol.filter(p => {
      const stage = getSolStage(p.etapa, p.status);
      return stage === 'Closer' || stage === 'Proposta' || stage === 'Fechado';
    });
    const qualificadosQueFecharam = qualificadosSol.filter(p => p.status === 'Ganho');

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
    const fechados = filteredProposals.filter(p => p.status === 'Ganho');
    const perfilMap: Record<string, { count: number; valorTotal: number }> = {};
    fechados.forEach(p => {
      const origem = extractOrigem(p.etiquetas);
      if (!perfilMap[origem]) perfilMap[origem] = { count: 0, valorTotal: 0 };
      perfilMap[origem].count++;
      perfilMap[origem].valorTotal += p.valorProposta || 0;
    });
    const perfil = Object.entries(perfilMap).map(([origem, v]) => ({
      origem,
      fechados: v.count,
      valorTotal: v.valorTotal,
      ticketMedio: v.count > 0 ? Math.round(v.valorTotal / v.count) : 0,
    })).sort((a, b) => b.fechados - a.fechados);

    // C6: Velocidade × Conversão
    const velocidade = filteredProposals
      .filter(p => p.dataCriacaoProjeto && p.dataCriacaoProposta)
      .map(p => {
        const d1 = safeDate(p.dataCriacaoProjeto);
        const d2 = safeDate(p.dataCriacaoProposta);
        if (!d1 || !d2) return null;
        const dias = Math.max(0, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
        const ganho = p.status === 'Ganho';
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
  }, [filteredProposals, filteredSolLeads]);

  // ═══ Cruzamento D C14: Lead em risco ═══
  const leadsEmRisco = useMemo(() => {
    if (filteredProposals.length === 0) return [];
    return filteredProposals
      .filter(p => {
        if (p.status === 'Ganho' || p.status === 'Perdido') return false;
        return p.tempoNaEtapa > 7 || p.temperatura === 'FRIO';
      })
      .map(p => ({
        nome: p.nomeCliente,
        etapa: p.etapa,
        temperatura: parseTemp(p.temperatura),
        tempoNaEtapa: p.tempoNaEtapa,
        valor: p.valorProposta,
        score: p.solScore,
      }))
      .sort((a, b) => b.tempoNaEtapa - a.tempoNaEtapa)
      .slice(0, 20);
  }, [filteredProposals]);

  const volumeSla = useMemo(() => {
    const sol = allSolLeads.filter(isSolSdrRecord);
    const totalEnviadas = sol.reduce((a, l) => a + (l.total_mensagens_ia ?? 0), 0);
    const comDelta = sol.filter(r => {
      const c = safeDate(r.ts_cadastro);
      const u = safeDate(r.ts_ultima_interacao);
      return c && u && u.getTime() > c.getTime();
    });
    const totalRecebidas = comDelta.length;
    const comResposta = sol.filter(r => {
      const c = safeDate(r.ts_cadastro);
      const u = safeDate(r.ts_ultima_interacao);
      return c && u && u.getTime() >= c.getTime();
    });
    const dentro5min = comResposta.filter(r => {
      const c = safeDate(r.ts_cadastro)!;
      const u = safeDate(r.ts_ultima_interacao)!;
      const ms = u.getTime() - c.getTime();
      return ms >= 0 && ms <= 5 * 60 * 1000;
    }).length;
    const slaMenos5min =
      comResposta.length > 0 ? Math.round((dentro5min / comResposta.length) * 100) : 0;
    const temposMin = comResposta.map(r => {
      const c = safeDate(r.ts_cadastro)!;
      const u = safeDate(r.ts_ultima_interacao)!;
      return (u.getTime() - c.getTime()) / (1000 * 60);
    }).filter(m => m >= 0 && m < 7 * 24 * 60);
    const medMin = temposMin.length > 0 ? temposMin.reduce((a, b) => a + b, 0) / temposMin.length : 0;
    const tempoMedioPrimeiroContato =
      temposMin.length > 0
        ? medMin < 60
          ? `${Math.round(medMin)} min`
          : `${(medMin / 60).toFixed(1)} h`
        : '—';
    const mediaInteracoes =
      sol.length > 0 ? Math.round((totalEnviadas / sol.length) * 10) / 10 : 0;
    return {
      totalEnviadas,
      totalRecebidas,
      mediaInteracoes,
      slaMenos5min,
      tempoMedioPrimeiroContato,
      tempoMedioRespostaLead: tempoMedioPrimeiroContato,
    };
  }, [allSolLeads]);

  const leadsByCidade = useMemo(() => {
    const map = new Map<string, { leads: number; qualificados: number }>();
    for (const r of allSolLeads) {
      const label = (r.cidade || '').trim() || 'Sem cidade';
      const cur = map.get(label) || { leads: 0, qualificados: 0 };
      cur.leads++;
      if ((r.etapa_funil || '').toUpperCase().trim() === 'QUALIFICADO') cur.qualificados++;
      map.set(label, cur);
    }
    return [...map.entries()]
      .map(([cidade, v]) => ({ cidade, canal: cidade, leads: v.leads, qualificados: v.qualificados }))
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 18);
  }, [allSolLeads]);

  const leadsRecentes = useMemo(() => {
    const rowTemp = (r: SolLead): 'QUENTE' | 'MORNO' | 'FRIO' => {
      const n = (r.temperatura || '').toUpperCase();
      if (n.includes('QUENTE')) return 'QUENTE';
      if (n.includes('MORNO')) return 'MORNO';
      if (n.includes('FRIO')) return 'FRIO';
      return 'FRIO';
    };
    return [...allSolLeads]
      .filter(r => r.ts_cadastro)
      .sort((a, b) => {
        const ta = safeDate(a.ts_cadastro)?.getTime() ?? 0;
        const tb = safeDate(b.ts_cadastro)?.getTime() ?? 0;
        return tb - ta;
      })
      .slice(0, 25)
      .map(r => ({
        nome: r.nome || `Lead …${(r.telefone || '').slice(-4)}`,
        cidade: (r.cidade || '').trim() || '—',
        valor_conta: r.valor_conta || '—',
        temperatura: rowTemp(r),
        etapa: r.etapa_funil || '—',
        data: r.ts_cadastro || '',
        score: r.score || '—',
      }));
  }, [allSolLeads]);

  const hasData = filteredProposals.length > 0 || allSolLeads.length > 0;
  const isLoading = proposalsLoading || makeLoading;
  const totalSyncedLeads = allSolLeads.length;

  return {
    solSDR,
    solarMarket,
    fupFrio,
    cruzamentosB,
    leadsEmRisco,
    volumeSla,
    leadsByCidade,
    leadsRecentes,
    totalSyncedLeads,
    filteredProjectCount: filteredProposals.length,
    hasData,
    isLoading,
    error: proposalsError,
    leadsDataUpdatedAt,
    projetosDataUpdatedAt,
  };
}
