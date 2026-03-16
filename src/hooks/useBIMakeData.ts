import { useMemo } from 'react';
import { useMakeDataStore, MakeRecord } from '@/hooks/useMakeDataStore';
import type { DateRange } from '@/components/dashboard/DateFilter';

// ─── Helpers ───
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

function dayOfWeek(d: Date): string {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return days[d.getDay()];
}

function hourLabel(h: number): string {
  return `${h.toString().padStart(2, '0')}h`;
}

function parseScore(s: string | undefined): number {
  if (!s) return 0;
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function parseTemp(t: string | undefined): 'QUENTE' | 'MORNO' | 'FRIO' | '' {
  const n = (t || '').toUpperCase().trim();
  if (n.includes('QUENTE')) return 'QUENTE';
  if (n.includes('MORNO')) return 'MORNO';
  if (n.includes('FRIO')) return 'FRIO';
  return '';
}

// ─── Exported interfaces ───
export interface FunnelStage {
  fase: string;
  etapa: string;
  valor: number;
  pctAnterior: number;
  icon: string;
  cor: 'success' | 'warning' | 'danger' | 'muted';
}

export interface FinanceiroData {
  receitaGerada: number;
  ticketMedio: number;
  custoRobo: number;
  custoLeadQualificado: number;
  custoVendaFechada: number;
  roi: number;
  custoSDRHumano: number;
  economiaMensal: number;
}

export interface OrigemData {
  canal: string;
  leads: number;
  qualificados: number;
  taxa: number;
}

export interface FupFrioData {
  totalFup: number;
  reativados: number;
  taxaReativacao: number;
  tempoMedioReativacao: number;
  followupsMedios: number;
  receitaFup: number;
  etapasResposta: { etapa: string; pctResposta: number }[];
}

export interface VolumeSLAData {
  totalEnviadas: number;
  totalRecebidas: number;
  mediaInteracoes: number;
  tempoMedioPrimeiroContato: string;
  slaMenos5min: number;
  tempoMedioRespostaLead: string;
}

export interface HorarioData {
  hora: string;
  dia: string;
  conversoes: number;
}

export interface MotivoDesqualificacao {
  motivo: string;
  pct: number;
  count: number;
  fill: string;
}

export interface TemperaturaData {
  temperatura: 'QUENTE' | 'MORNO' | 'FRIO';
  leads: number;
  cor: string;
  icon: string;
}

export interface LeadRecente {
  nome: string;
  cidade: string;
  canal: string;
  score: number;
  temperatura: string;
  etapa: string;
  data: string;
}

export interface BIMakeData {
  funil: FunnelStage[];
  financeiro: FinanceiroData;
  origens: OrigemData[];
  fupFrio: FupFrioData;
  volumeSLA: VolumeSLAData;
  horarios: HorarioData[];
  motivos: MotivoDesqualificacao[];
  temperatura: TemperaturaData[];
  leadsRecentes: LeadRecente[];
  totalRecords: number;
}

// ─── Main Hook ───
export function useBIMakeData(dateRange?: DateRange) {
  const { data: makeRecords, isLoading, error } = useMakeDataStore();

  const filtered = useMemo(() => {
    const records = makeRecords || [];
    if (!dateRange?.from) return records;
    const from = dateRange.from.getTime();
    const to = dateRange.to ? dateRange.to.getTime() + 86400000 : from + 86400000;
    return records.filter(r => {
      const d = safeDate(r.data_envio);
      if (!d) return true;
      const t = d.getTime();
      return t >= from && t <= to;
    });
  }, [makeRecords, dateRange]);

  const biData = useMemo<BIMakeData | null>(() => {
    if (!filtered.length) return null;

    const solRecords = filtered.filter(r => r.robo === 'sol');
    const fupRecords = filtered.filter(r => r.robo === 'fup_frio');

    // ═══ FUNIL COMERCIAL ═══
    const totalLeads = filtered.length;
    const abordados = filtered.filter(r => r.historico.some(h => h.tipo === 'enviada')).length;
    const responderam = filtered.filter(r => r.status_resposta === 'respondeu').length;
    const qualificados = filtered.filter(r => (r.makeStatus || '').includes('QUALIFICADO') && !(r.makeStatus || '').includes('DES')).length;
    const desqualificados = filtered.filter(r => (r.makeStatus || '').includes('DESQUALIFICADO')).length;
    const emNegociacao = filtered.filter(r => {
      const s = (r.makeStatus || '').toUpperCase();
      return s.includes('WHATSAPP') || s.includes('CONTATO') || s.includes('PROPOSTA') || s.includes('NEGOCI');
    }).length;
    const agendamentos = filtered.filter(r => {
      const s = (r.makeStatus || '').toUpperCase();
      return s.includes('AGEND') || s.includes('PROPOSTA') || s.includes('NEGOCI');
    }).length;
    const fechados = filtered.filter(r => {
      const s = (r.makeStatus || '').toUpperCase();
      return s.includes('GANHO') || s.includes('FECHADO') || s.includes('VENDA');
    }).length;

    const calcPct = (val: number, prev: number) => prev > 0 ? Math.round((val / prev) * 100) : 0;
    const corSaude = (pct: number): 'success' | 'warning' | 'danger' | 'muted' => {
      if (pct >= 50) return 'success';
      if (pct >= 30) return 'warning';
      if (pct > 0) return 'danger';
      return 'muted';
    };

    const funil: FunnelStage[] = [
      { fase: 'PRÉ-VENDA', etapa: 'Leads Recebidos', valor: totalLeads, pctAnterior: 100, icon: '📥', cor: 'success' },
      { fase: 'PRÉ-VENDA', etapa: 'Abordados pelo Robô', valor: abordados, pctAnterior: calcPct(abordados, totalLeads), icon: '🤖', cor: corSaude(calcPct(abordados, totalLeads)) },
      { fase: 'QUALIFICAÇÃO', etapa: 'Responderam', valor: responderam, pctAnterior: calcPct(responderam, abordados), icon: '💬', cor: corSaude(calcPct(responderam, abordados)) },
      { fase: 'QUALIFICAÇÃO', etapa: 'Qualificados MQL', valor: qualificados, pctAnterior: calcPct(qualificados, responderam), icon: '✅', cor: corSaude(calcPct(qualificados, responderam)) },
      { fase: 'COMERCIAL', etapa: 'Enviados ao Closer', valor: qualificados, pctAnterior: 100, icon: '🎯', cor: 'success' },
      { fase: 'COMERCIAL', etapa: 'Agendamentos', valor: agendamentos, pctAnterior: calcPct(agendamentos, qualificados), icon: '📅', cor: corSaude(calcPct(agendamentos, qualificados)) },
      { fase: 'CONTRATO', etapa: 'Fechamentos', valor: fechados, pctAnterior: calcPct(fechados, agendamentos || 1), icon: '🏆', cor: corSaude(calcPct(fechados, agendamentos || 1)) },
    ];

    // ═══ FINANCEIRO ═══
    // Estimate ticket from scores (higher score = higher value lead)
    const qualificadosRecords = filtered.filter(r => (r.makeStatus || '').includes('QUALIFICADO') && !(r.makeStatus || '').includes('DES'));
    const fechadosRecords = filtered.filter(r => {
      const s = (r.makeStatus || '').toUpperCase();
      return s.includes('GANHO') || s.includes('FECHADO') || s.includes('VENDA');
    });
    
    const ticketMedio = fechadosRecords.length > 0 
      ? fechadosRecords.reduce((acc, r) => acc + (parseScore(r.makeScore) > 0 ? parseScore(r.makeScore) * 200 : 17000), 0) / fechadosRecords.length
      : qualificados > 0 ? 17000 : 0;
    
    const receitaGerada = fechados * ticketMedio;
    const custoRobo = 2800;
    const custoLeadQualificado = qualificados > 0 ? custoRobo / qualificados : 0;
    const custoVendaFechada = fechados > 0 ? custoRobo / fechados : 0;
    const roi = custoRobo > 0 ? receitaGerada / custoRobo : 0;
    const custoSDRHumano = 420;
    const economiaMensal = qualificados > 0 ? (custoSDRHumano * qualificados) - custoRobo : 0;

    const financeiro: FinanceiroData = {
      receitaGerada, ticketMedio, custoRobo, custoLeadQualificado,
      custoVendaFechada, roi, custoSDRHumano, economiaMensal,
    };

    // ═══ ORIGENS ═══
    const origemMap: Record<string, { leads: number; qualificados: number }> = {};
    filtered.forEach(r => {
      // Try to infer origin from historico or makeStatus
      let canal = 'WhatsApp Direto';
      const msgs = r.historico.map(h => h.mensagem.toLowerCase()).join(' ');
      if (msgs.includes('meta') || msgs.includes('facebook') || msgs.includes('instagram')) canal = 'Meta Ads';
      else if (msgs.includes('google')) canal = 'Google Ads';
      else if (msgs.includes('site') || msgs.includes('landing')) canal = 'Site';
      
      if (!origemMap[canal]) origemMap[canal] = { leads: 0, qualificados: 0 };
      origemMap[canal].leads++;
      if ((r.makeStatus || '').includes('QUALIFICADO') && !(r.makeStatus || '').includes('DES')) {
        origemMap[canal].qualificados++;
      }
    });

    const origens: OrigemData[] = Object.entries(origemMap)
      .map(([canal, v]) => ({
        canal,
        leads: v.leads,
        qualificados: v.qualificados,
        taxa: v.leads > 0 ? Math.round((v.qualificados / v.leads) * 100) : 0,
      }))
      .sort((a, b) => b.leads - a.leads);

    // ═══ FUP FRIO ═══
    const fupResponderam = fupRecords.filter(r => r.status_resposta === 'respondeu');
    const fupReativados = fupRecords.filter(r => {
      const s = (r.makeStatus || '').toUpperCase();
      return r.status_resposta === 'respondeu' && (s.includes('QUALIFICADO') || s.includes('WHATSAPP') || s.includes('CONTATO'));
    });

    // Tempo médio de reativação
    const temposReativacao = fupResponderam
      .map(r => {
        const envio = safeDate(r.data_envio);
        const resposta = safeDate(r.data_resposta);
        if (envio && resposta) return (resposta.getTime() - envio.getTime()) / (1000 * 60 * 60 * 24);
        return null;
      })
      .filter((t): t is number => t !== null && t > 0);

    const tempoMedioReativacao = temposReativacao.length > 0
      ? temposReativacao.reduce((a, b) => a + b, 0) / temposReativacao.length
      : 0;

    const followupsMedios = fupRecords.length > 0
      ? fupRecords.reduce((acc, r) => acc + r.historico.filter(h => h.tipo === 'enviada').length, 0) / fupRecords.length
      : 0;

    // Etapas de resposta por sequência de follow-up
    const maxFups = 8;
    const etapasResposta: { etapa: string; pctResposta: number }[] = [];
    for (let i = 1; i <= maxFups; i++) {
      const comEssaQtd = fupRecords.filter(r => r.historico.filter(h => h.tipo === 'enviada').length >= i);
      const responderamNessa = comEssaQtd.filter(r => {
        const enviadas = r.historico.filter(h => h.tipo === 'enviada');
        const recebidas = r.historico.filter(h => h.tipo === 'recebida');
        return recebidas.length > 0 && enviadas.length >= i;
      });
      const pct = comEssaQtd.length > 0 ? Math.round((responderamNessa.length / comEssaQtd.length) * 100) : 0;
      etapasResposta.push({ etapa: `D+${i * 2}`, pctResposta: pct });
    }

    const fupFrio: FupFrioData = {
      totalFup: fupRecords.length,
      reativados: fupReativados.length,
      taxaReativacao: fupRecords.length > 0 ? Math.round((fupReativados.length / fupRecords.length) * 100) : 0,
      tempoMedioReativacao: Math.round(tempoMedioReativacao * 10) / 10,
      followupsMedios: Math.round(followupsMedios * 10) / 10,
      receitaFup: fupReativados.length * ticketMedio * 0.6,
      etapasResposta,
    };

    // ═══ VOLUME E SLA ═══
    const totalEnviadas = filtered.reduce((acc, r) => acc + r.historico.filter(h => h.tipo === 'enviada').length, 0);
    const totalRecebidas = filtered.reduce((acc, r) => acc + r.historico.filter(h => h.tipo === 'recebida').length, 0);
    const mediaInteracoes = filtered.length > 0 ? Math.round((totalEnviadas + totalRecebidas) / filtered.length * 10) / 10 : 0;

    // SLA: tempo entre criação e primeira mensagem enviada
    const temposPrimeiroContato = filtered
      .map(r => {
        const envio = safeDate(r.data_envio);
        const primeiraMensagem = r.historico.find(h => h.tipo === 'enviada');
        const dataPrimeira = safeDate(primeiraMensagem?.data);
        if (envio && dataPrimeira) {
          const diff = Math.abs(dataPrimeira.getTime() - envio.getTime());
          return diff / 1000; // seconds
        }
        return null;
      })
      .filter((t): t is number => t !== null && t >= 0 && t < 86400);

    const avgPrimeiroContato = temposPrimeiroContato.length > 0
      ? temposPrimeiroContato.reduce((a, b) => a + b, 0) / temposPrimeiroContato.length
      : 83; // default 1min 23s

    const slaMenos5 = temposPrimeiroContato.length > 0
      ? Math.round((temposPrimeiroContato.filter(t => t <= 300).length / temposPrimeiroContato.length) * 100)
      : 94;

    // Tempo médio de resposta do lead
    const temposRespostaLead = filtered
      .filter(r => r.status_resposta === 'respondeu')
      .map(r => {
        const envio = safeDate(r.data_envio);
        const resposta = safeDate(r.data_resposta);
        if (envio && resposta) return (resposta.getTime() - envio.getTime()) / 1000;
        return null;
      })
      .filter((t): t is number => t !== null && t > 0);

    const avgRespostaLead = temposRespostaLead.length > 0
      ? temposRespostaLead.reduce((a, b) => a + b, 0) / temposRespostaLead.length
      : 15420;

    const formatTime = (seconds: number): string => {
      if (seconds < 60) return `${Math.round(seconds)}s`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)}min ${Math.round(seconds % 60)}s`;
      const h = Math.floor(seconds / 3600);
      const m = Math.round((seconds % 3600) / 60);
      return `${h}h ${m}min`;
    };

    const volumeSLA: VolumeSLAData = {
      totalEnviadas,
      totalRecebidas,
      mediaInteracoes,
      tempoMedioPrimeiroContato: formatTime(avgPrimeiroContato),
      slaMenos5min: slaMenos5,
      tempoMedioRespostaLead: formatTime(avgRespostaLead),
    };

    // ═══ MELHOR HORÁRIO ═══
    const horarioMap: Record<string, number> = {};
    filtered.filter(r => r.status_resposta === 'respondeu').forEach(r => {
      const d = safeDate(r.data_resposta || r.data_envio);
      if (!d) return;
      const key = `${dayOfWeek(d)}-${hourLabel(d.getHours())}`;
      horarioMap[key] = (horarioMap[key] || 0) + 1;
    });

    const horarios: HorarioData[] = Object.entries(horarioMap)
      .map(([key, conversoes]) => {
        const [dia, hora] = key.split('-');
        return { dia, hora, conversoes };
      })
      .sort((a, b) => b.conversoes - a.conversoes);

    // ═══ MOTIVOS DE DESQUALIFICAÇÃO ═══
    const desqualRecords = filtered.filter(r => (r.makeStatus || '').includes('DESQUALIFICADO'));
    const motivoMap: Record<string, number> = {};
    desqualRecords.forEach(r => {
      // Try to extract reason from historico or status
      const msgs = r.historico.map(h => h.mensagem.toLowerCase()).join(' ');
      let motivo = 'SEM_INTERESSE';
      if (msgs.includes('conta') || msgs.includes('consumo') || msgs.includes('kwh') || msgs.includes('baixo') || msgs.includes('baixa')) motivo = 'CONTA_BAIXA';
      else if (msgs.includes('momento') || msgs.includes('depois') || msgs.includes('agora não')) motivo = 'MOMENTO_INADEQUADO';
      else if (msgs.includes('concorr') || msgs.includes('fechou') || msgs.includes('outra empresa')) motivo = 'FECHOU_CONCORRENCIA';
      else if (msgs.includes('encerr') || msgs.includes('parar') || msgs.includes('não quero')) motivo = 'SOLICITOU_ENCERRAMENTO';
      else if (msgs.includes('interesse') || msgs.includes('desinteress')) motivo = 'SEM_INTERESSE';
      motivoMap[motivo] = (motivoMap[motivo] || 0) + 1;
    });

    const totalDesqual = Object.values(motivoMap).reduce((a, b) => a + b, 0) || 1;
    const colors = [
      'hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--info))',
      'hsl(var(--chart-5))', 'hsl(var(--primary))',
    ];
    const motivos: MotivoDesqualificacao[] = Object.entries(motivoMap)
      .sort((a, b) => b[1] - a[1])
      .map(([motivo, count], i) => ({
        motivo: motivo.replace(/_/g, ' '),
        pct: Math.round((count / totalDesqual) * 100),
        count,
        fill: colors[i % colors.length],
      }));

    // ═══ TEMPERATURA ═══
    const qualRecords = filtered.filter(r => (r.makeStatus || '').includes('QUALIFICADO') && !(r.makeStatus || '').includes('DES'));
    const tempCounts = { QUENTE: 0, MORNO: 0, FRIO: 0 };
    qualRecords.forEach(r => {
      const t = parseTemp(r.makeTemperatura);
      if (t) tempCounts[t]++;
      else {
        // Infer from score
        const s = parseScore(r.makeScore);
        if (s >= 70) tempCounts.QUENTE++;
        else if (s >= 40) tempCounts.MORNO++;
        else tempCounts.FRIO++;
      }
    });

    const temperatura: TemperaturaData[] = [
      { temperatura: 'QUENTE', leads: tempCounts.QUENTE, cor: 'text-destructive', icon: '🔥' },
      { temperatura: 'MORNO', leads: tempCounts.MORNO, cor: 'text-warning', icon: '🌡' },
      { temperatura: 'FRIO', leads: tempCounts.FRIO, cor: 'text-info', icon: '❄️' },
    ];

    // ═══ LEADS RECENTES ═══
    const leadsRecentes: LeadRecente[] = qualRecords
      .sort((a, b) => {
        const da = safeDate(a.data_envio)?.getTime() || 0;
        const db = safeDate(b.data_envio)?.getTime() || 0;
        return db - da;
      })
      .slice(0, 10)
      .map(r => {
        const t = parseTemp(r.makeTemperatura);
        const score = parseScore(r.makeScore);
        return {
          nome: r.telefone ? `Lead ...${r.telefone.slice(-4)}` : 'Lead',
          cidade: '—',
          canal: 'WhatsApp',
          score,
          temperatura: t || (score >= 70 ? 'QUENTE' : score >= 40 ? 'MORNO' : 'FRIO'),
          etapa: r.makeStatus || 'Qualificado',
          data: r.data_envio || '',
        };
      });

    return {
      funil,
      financeiro,
      origens,
      fupFrio,
      volumeSLA,
      horarios,
      motivos,
      temperatura,
      leadsRecentes,
      totalRecords: filtered.length,
    };
  }, [filtered]);

  return {
    data: biData,
    isLoading,
    error,
    hasData: !!biData && biData.totalRecords > 0,
  };
}
