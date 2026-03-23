import { useMemo } from 'react';
import { useMakeDataStore, MakeRecord } from '@/hooks/useMakeDataStore';
import { useEnrichedProposals } from '@/hooks/useEnrichedProposals';
import type { DateRange } from '@/components/dashboard/DateFilter';

// ─── Helpers ───
function safeDate(str: string | undefined | null): Date | null {
  if (!str) return null;
  const brMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (brMatch) {
    return new Date(parseInt(brMatch[3]), parseInt(brMatch[2])-1, parseInt(brMatch[1]), parseInt(brMatch[4]), parseInt(brMatch[5]));
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function dayOfWeek(d: Date): string {
  return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()];
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
  etapa: string;
  valor: number;
  pctAnterior: number;
  icon: string;
  cor: 'success' | 'warning' | 'danger' | 'muted';
}

export interface FinanceiroData {
  receitaFechada: number;
  ticketMedio: number;
  totalPropostas: number;
  negociosGanhos: number;
  taxaConversao: number;
  valorPipeline: number;
  negociosAbertos: number;
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
  valorConta: string;
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
  cidadesTop: { cidade: string; count: number }[];
}

// ─── Main Hook ───
export function useBIMakeData(dateRange?: DateRange) {
  const { data: makeRecords, isLoading: makeLoading, error } = useMakeDataStore();
  const { proposals, isLoading: proposalsLoading } = useEnrichedProposals();

  const isLoading = makeLoading || proposalsLoading;

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

    const fupRecords = filtered.filter(r => r.robo === 'fup_frio');

    // ═══ FUNIL ═══
    const totalLeads = filtered.length;
    const abordados = filtered.filter(r => r.historico.some(h => h.tipo === 'enviada')).length;
    const responderam = filtered.filter(r => r.status_resposta === 'respondeu').length;
    const qualificados = filtered.filter(r => (r.makeStatus || '').includes('QUALIFICADO') && !(r.makeStatus || '').includes('DES')).length;
    const emContato = filtered.filter(r => {
      const s = (r.makeStatus || '').toUpperCase();
      return s.includes('WHATSAPP') || s.includes('CONTATO');
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
      { etapa: 'Leads Recebidos', valor: totalLeads, pctAnterior: 100, icon: '📥', cor: 'success' },
      { etapa: 'Abordados', valor: abordados, pctAnterior: calcPct(abordados, totalLeads), icon: '🤖', cor: corSaude(calcPct(abordados, totalLeads)) },
      { etapa: 'Responderam', valor: responderam, pctAnterior: calcPct(responderam, abordados), icon: '💬', cor: corSaude(calcPct(responderam, abordados)) },
      { etapa: 'Qualificados', valor: qualificados, pctAnterior: calcPct(qualificados, responderam), icon: '✅', cor: corSaude(calcPct(qualificados, responderam)) },
      { etapa: 'Em Contato', valor: emContato, pctAnterior: calcPct(emContato, qualificados || 1), icon: '📞', cor: corSaude(calcPct(emContato, qualificados || 1)) },
      { etapa: 'Fechados', valor: fechados, pctAnterior: calcPct(fechados, emContato || 1), icon: '🏆', cor: corSaude(calcPct(fechados, emContato || 1)) },
    ];

    // ═══ FINANCEIRO (from enriched proposals) ═══
    const ganhos = proposals.filter(p => p.status === 'Ganho');
    const abertosP = proposals.filter(p => p.status === 'Aberto');
    const receitaFechada = ganhos.reduce((s, p) => s + (p.valorProposta || 0), 0);
    const valorPipeline = abertosP.reduce((s, p) => s + (p.valorProposta || 0), 0);
    const ticketMedio = ganhos.length > 0 ? receitaFechada / ganhos.length : 0;
    const taxaConversao = proposals.length > 0 ? (ganhos.length / proposals.length) * 100 : 0;

    const financeiro: FinanceiroData = {
      receitaFechada,
      ticketMedio,
      totalPropostas: proposals.length,
      negociosGanhos: ganhos.length,
      taxaConversao,
      valorPipeline,
      negociosAbertos: abertosP.length,
    };

    // ═══ ORIGENS (use real cidade field) ═══
    const origemMap: Record<string, { leads: number; qualificados: number }> = {};
    filtered.forEach(r => {
      const canal = r.canalOrigem || 'Não informado';
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
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 12);

    // Top cidades
    const cidadesTop = origens.slice(0, 8).map(o => ({ cidade: o.canal, count: o.leads }));

    // ═══ FUP FRIO ═══
    const fupReativados = fupRecords.filter(r => {
      const s = (r.makeStatus || '').toUpperCase();
      return r.status_resposta === 'respondeu' && (s.includes('QUALIFICADO') || s.includes('WHATSAPP') || s.includes('CONTATO'));
    });

    const maxFups = 6;
    const etapasResposta: { etapa: string; pctResposta: number }[] = [];
    for (let i = 1; i <= maxFups; i++) {
      const comEssaQtd = fupRecords.filter(r => r.historico.filter(h => h.tipo === 'enviada').length >= i);
      const responderamNessa = comEssaQtd.filter(r => r.historico.filter(h => h.tipo === 'recebida').length > 0);
      const pct = comEssaQtd.length > 0 ? Math.round((responderamNessa.length / comEssaQtd.length) * 100) : 0;
      etapasResposta.push({ etapa: `D+${i * 2}`, pctResposta: pct });
    }

    const fupFrio: FupFrioData = {
      totalFup: fupRecords.length,
      reativados: fupReativados.length,
      taxaReativacao: fupRecords.length > 0 ? Math.round((fupReativados.length / fupRecords.length) * 100) : 0,
      receitaFup: fupReativados.length * ticketMedio * 0.6,
      etapasResposta,
    };

    // ═══ VOLUME E SLA ═══
    const totalEnviadas = filtered.reduce((acc, r) => acc + r.historico.filter(h => h.tipo === 'enviada').length, 0);
    const totalRecebidas = filtered.reduce((acc, r) => acc + r.historico.filter(h => h.tipo === 'recebida').length, 0);
    const mediaInteracoes = filtered.length > 0 ? Math.round((totalEnviadas + totalRecebidas) / filtered.length * 10) / 10 : 0;

    const temposPrimeiroContato = filtered
      .map(r => {
        const envio = safeDate(r.data_envio);
        const primeiraMensagem = r.historico.find(h => h.tipo === 'enviada');
        const dataPrimeira = safeDate(primeiraMensagem?.data);
        if (envio && dataPrimeira) {
          const diff = Math.abs(dataPrimeira.getTime() - envio.getTime());
          return diff / 1000;
        }
        return null;
      })
      .filter((t): t is number => t !== null && t >= 0 && t < 86400);

    const avgPrimeiroContato = temposPrimeiroContato.length > 0
      ? temposPrimeiroContato.reduce((a, b) => a + b, 0) / temposPrimeiroContato.length
      : 0;

    const slaMenos5 = temposPrimeiroContato.length > 0
      ? Math.round((temposPrimeiroContato.filter(t => t <= 300).length / temposPrimeiroContato.length) * 100)
      : 0;

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
      : 0;

    const formatTime = (seconds: number): string => {
      if (seconds <= 0) return '—';
      if (seconds < 60) return `${Math.round(seconds)}s`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
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
      const codigo = (r.codigoStatus || '').toUpperCase();
      let motivo = 'Sem interesse';
      if (codigo.includes('NAO_RESPONDEU') || codigo.includes('SEM_RESPOSTA')) motivo = 'Não respondeu';
      else if (codigo.includes('CONTA_BAIXA') || codigo.includes('BAIXO')) motivo = 'Conta baixa';
      else if (codigo.includes('MOMENTO') || codigo.includes('DEPOIS')) motivo = 'Momento inadequado';
      else if (codigo.includes('CONCORR') || codigo.includes('FECHOU')) motivo = 'Fechou concorrência';
      else if (codigo.includes('ENCERR')) motivo = 'Solicitou encerramento';
      else {
        // Use valor_conta to infer
        const vc = (r.valorConta || '').toLowerCase();
        if (vc.includes('menos') || vc.includes('<') || vc.includes('250')) motivo = 'Conta baixa';
      }
      motivoMap[motivo] = (motivoMap[motivo] || 0) + 1;
    });

    const totalDesqual = Object.values(motivoMap).reduce((a, b) => a + b, 0) || 1;
    const colors = [
      'hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--chart-4))',
      'hsl(var(--chart-2))', 'hsl(var(--primary))',
    ];
    const motivos: MotivoDesqualificacao[] = Object.entries(motivoMap)
      .sort((a, b) => b[1] - a[1])
      .map(([motivo, count], i) => ({
        motivo,
        pct: Math.round((count / totalDesqual) * 100),
        count,
        fill: colors[i % colors.length],
      }));

    // ═══ TEMPERATURA ═══
    const tempCounts = { QUENTE: 0, MORNO: 0, FRIO: 0 };
    filtered.forEach(r => {
      const t = parseTemp(r.makeTemperatura);
      if (t) tempCounts[t]++;
      else {
        const s = parseScore(r.makeScore);
        if (s >= 70) tempCounts.QUENTE++;
        else if (s >= 40) tempCounts.MORNO++;
        else if (s > 0) tempCounts.FRIO++;
      }
    });

    const temperatura: TemperaturaData[] = [
      { temperatura: 'QUENTE', leads: tempCounts.QUENTE, cor: 'text-destructive', icon: '🔥' },
      { temperatura: 'MORNO', leads: tempCounts.MORNO, cor: 'text-warning', icon: '🌡' },
      { temperatura: 'FRIO', leads: tempCounts.FRIO, cor: 'text-chart-4', icon: '❄️' },
    ];

    // ═══ LEADS RECENTES ═══
    const leadsRecentes: LeadRecente[] = filtered
      .filter(r => r.nome)
      .sort((a, b) => {
        const da = safeDate(a.data_envio)?.getTime() || 0;
        const db = safeDate(b.data_envio)?.getTime() || 0;
        return db - da;
      })
      .slice(0, 15)
      .map(r => {
        const t = parseTemp(r.makeTemperatura);
        const score = parseScore(r.makeScore);
        return {
          nome: r.nome || `Lead ...${(r.telefone || '').slice(-4)}`,
          cidade: r.canalOrigem || '—',
          canal: r.canalOrigem || 'WhatsApp',
          score,
          temperatura: t || (score >= 70 ? 'QUENTE' : score >= 40 ? 'MORNO' : 'FRIO'),
          etapa: r.makeStatus || '—',
          data: r.data_envio || '',
          valorConta: r.valorConta || '—',
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
      cidadesTop,
    };
  }, [filtered, proposals]);

  return {
    data: biData,
    isLoading,
    error,
    hasData: !!biData && biData.totalRecords > 0,
  };
}
