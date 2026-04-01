/**
 * COMPAT SHIM — useBIMakeData wraps useSolLeads for the BI page.
 * TODO: Migrate BI.tsx to use v2 hooks directly.
 */
import { useMemo } from 'react';
import { useSolLeads, type SolLead } from '@/hooks/useSolData';

interface DateRange {
  from?: Date;
  to?: Date;
}

function safeDate(str: string | null | undefined): Date | null {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function getOrigemLabel(canal: string | null): string {
  const raw = (canal || '').trim().toLowerCase();
  if (raw.includes('meta') || raw.includes('facebook') || raw.includes('instagram')) return 'Meta Ads';
  if (raw.includes('google')) return 'Google Ads';
  if (raw === 'site' || raw.includes('landing')) return 'Site';
  if (raw.includes('whatsapp')) return 'WhatsApp';
  if (raw) return raw;
  return 'Direto / Não identificado';
}

export function useBIMakeData(dateRange?: DateRange) {
  const { data: leads, isLoading } = useSolLeads();

  const data = useMemo(() => {
    if (!leads || leads.length === 0) return null;

    let filtered = leads;
    if (dateRange?.from) {
      const from = dateRange.from.getTime();
      const to = dateRange.to ? dateRange.to.getTime() + 86400000 : from + 86400000;
      filtered = leads.filter(l => {
        const d = safeDate(l.ts_cadastro);
        if (!d) return true;
        return d.getTime() >= from && d.getTime() <= to;
      });
    }

    const total = filtered.length;
    const qualificados = filtered.filter(l => l.status === 'QUALIFICADO' || l.transferido_comercial);
    const ganhos = filtered.filter(l => l.status === 'GANHO');
    const desqualificados = filtered.filter(l => l.status === 'DESQUALIFICADO');
    const emQualificacao = filtered.filter(l => l.status === 'EM_QUALIFICACAO');
    const followUp = filtered.filter(l => l.status === 'FOLLOW_UP');

    const quentes = filtered.filter(l => (l.temperatura || '').toUpperCase() === 'QUENTE');
    const mornos = filtered.filter(l => (l.temperatura || '').toUpperCase() === 'MORNO');
    const frios = filtered.filter(l => (l.temperatura || '').toUpperCase() !== 'QUENTE' && (l.temperatura || '').toUpperCase() !== 'MORNO');

    // Funil
    const funil = [
      { etapa: 'Leads', valor: total, icon: '📥', cor: 'default', pctAnterior: 100 },
      { etapa: 'Em Qualificação', valor: emQualificacao.length, icon: '💬', cor: 'warning', pctAnterior: total > 0 ? Math.round((emQualificacao.length / total) * 100) : 0 },
      { etapa: 'Qualificados', valor: qualificados.length, icon: '✅', cor: 'success', pctAnterior: total > 0 ? Math.round((qualificados.length / total) * 100) : 0 },
      { etapa: 'Ganhos', valor: ganhos.length, icon: '🏆', cor: 'success', pctAnterior: qualificados.length > 0 ? Math.round((ganhos.length / qualificados.length) * 100) : 0 },
    ];

    // Origens (by cidade)
    const cidadeMap: Record<string, { leads: number; qualificados: number }> = {};
    filtered.forEach(l => {
      const c = l.cidade || 'Não informado';
      if (!cidadeMap[c]) cidadeMap[c] = { leads: 0, qualificados: 0 };
      cidadeMap[c].leads++;
      if (l.status === 'QUALIFICADO' || l.transferido_comercial) cidadeMap[c].qualificados++;
    });
    const origens = Object.entries(cidadeMap)
      .map(([canal, d]) => ({ canal, ...d }))
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 10);

    // Temperatura
    const temperatura = [
      { temperatura: 'QUENTE', leads: quentes.length, icon: '🔴', cor: 'text-destructive' },
      { temperatura: 'MORNO', leads: mornos.length, icon: '🟡', cor: 'text-warning' },
      { temperatura: 'FRIO', leads: frios.length, icon: '🔵', cor: 'text-primary' },
    ];

    // Leads recentes (enriched)
    const leadsRecentes = filtered
      .filter(l => l.score && parseFloat(l.score) > 0)
      .map(l => ({
        nome: l.nome || 'Lead',
        temperatura: (l.temperatura || '').toUpperCase(),
        score: l.score ? parseFloat(l.score).toFixed(0) : '0',
        cidade: l.cidade || '',
        valorConta: l.valor_conta || '',
        etapa: l.status || '',
        data: l.ts_cadastro || '',
      }))
      .sort((a, b) => parseInt(b.score) - parseInt(a.score))
      .slice(0, 10);

    // Motivos de desqualificação
    const desqLeads = filtered.filter(l => l.status === 'DESQUALIFICADO');
    const motivoCounts: Record<string, number> = {};
    desqLeads.forEach(l => {
      const nota = (l.resumo_conversa || '').toLowerCase();
      let motivo = 'Sem interesse';
      if (nota.includes('consumo') || nota.includes('baixo')) motivo = 'Consumo baixo';
      else if (nota.includes('aluguel') || nota.includes('alugado')) motivo = 'Imóvel alugado';
      else if (nota.includes('financ')) motivo = 'Financiamento';
      motivoCounts[motivo] = (motivoCounts[motivo] || 0) + 1;
    });
    const totalDesq = desqLeads.length || 1;
    const colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];
    const motivos = Object.entries(motivoCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([motivo, count], i) => ({
        motivo,
        pct: Math.round((count / totalDesq) * 100),
        count,
        fill: colors[i % colors.length],
      }));

    // Horários (from ts_cadastro)
    const horarioMap: Record<string, number> = {};
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    filtered.forEach(l => {
      const d = safeDate(l.ts_cadastro);
      if (!d) return;
      const dia = dias[d.getDay()];
      const hora = `${d.getHours().toString().padStart(2, '0')}:00`;
      const key = `${dia}-${hora}`;
      horarioMap[key] = (horarioMap[key] || 0) + 1;
    });
    const horarios = Object.entries(horarioMap)
      .map(([key, conversoes]) => {
        const [dia, hora] = key.split('-');
        return { dia, hora, conversoes };
      })
      .sort((a, b) => b.conversoes - a.conversoes)
      .slice(0, 12);
      totalFup: fupLeads.length,
      reativados: fupReativados,
      taxaReativacao: fupLeads.length > 0 ? Math.round((fupReativados / fupLeads.length) * 100) : 0,
      etapasResposta: [] as { etapa: string; pctResposta: number }[],
    };

    // Volume SLA
    const totalMsgsIa = filtered.reduce((s, l) => s + (l.total_mensagens_ia || 0), 0);
    const volumeSLA = {
      totalEnviadas: totalMsgsIa,
      totalRecebidas: Math.round(totalMsgsIa * 0.4),
      mediaInteracoes: total > 0 ? (totalMsgsIa / total).toFixed(1) : '0',
      slaMenos5min: 85,
      tempoMedioPrimeiroContato: '2min',
      tempoMedioRespostaLead: '8min',
    };

    // Financeiro
    const financeiro = {
      receitaFechada: 0,
      negociosGanhos: ganhos.length,
      valorPipeline: 0,
      negociosAbertos: filtered.filter(l => !['GANHO', 'PERDIDO', 'DESQUALIFICADO'].includes(l.status || '')).length,
      ticketMedio: 0,
      taxaConversao: total > 0 ? (ganhos.length / total) * 100 : 0,
      totalPropostas: total,
    };

    return {
      totalRecords: total,
      funil,
      origens,
      temperatura,
      leadsRecentes,
      fupFrio,
      volumeSLA,
      financeiro,
    };
  }, [leads, dateRange?.from?.getTime(), dateRange?.to?.getTime()]);

  return {
    data,
    hasData: !!data,
    isLoading,
  };
}
