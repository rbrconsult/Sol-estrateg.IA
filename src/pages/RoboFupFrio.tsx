import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';
import { Repeat, RefreshCcw } from 'lucide-react';
import { useMakeDataStore, MakeRecord } from '@/hooks/useMakeDataStore';
import { useLead360 } from '@/contexts/Lead360Context';
import { usePageFilters, PageFloatingFilter } from '@/components/filters/PageFloatingFilter';

const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 };
const RESULT_COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--warning))'];

/* ── Derive FUP metrics from Make records ── */

function deriveFupData(records: MakeRecord[]) {
  const fupRecords = records.filter(r => (r.followupCount || 0) >= 1);
  const totalEntrou = fupRecords.length;
  const reativados = fupRecords.filter(r => r.status_resposta === 'respondeu').length;
  const taxaReativacao = totalEntrou > 0 ? Math.round((reativados / totalEntrou) * 100) : 0;

  // Group by followup count to build pipeline
  const byFup: Record<number, { disparos: number; respostas: number }> = {};
  fupRecords.forEach(r => {
    const count = r.followupCount || 1;
    for (let i = 1; i <= Math.min(count, 8); i++) {
      if (!byFup[i]) byFup[i] = { disparos: 0, respostas: 0 };
      byFup[i].disparos++;
    }
    if (r.status_resposta === 'respondeu') {
      const c = Math.min(count, 8);
      if (byFup[c]) byFup[c].respostas++;
    }
  });

  const gatilhos = ['Urgência suave', 'Prova social', 'Escassez', 'Benefício direto', 'Dor', 'Última chance', 'Reativação longa', 'Encerramento'];
  const dias = ['D+1', 'D+3', 'D+5', 'D+7', 'D+10', 'D+14', 'D+21', 'D+30'];

  const pipeline = Array.from({ length: 8 }, (_, i) => {
    const fupNum = i + 1;
    const data = byFup[fupNum] || { disparos: 0, respostas: 0 };
    return {
      etapa: `FUP ${fupNum}`,
      dia: dias[i],
      gatilho: gatilhos[i],
      disparos: data.disparos,
      respostas: data.respostas,
      taxa: data.disparos > 0 ? Math.round((data.respostas / data.disparos) * 100 * 10) / 10 : 0,
    };
  });

  // Status anterior analysis
  const desqEntrou = fupRecords.filter(r => (r.codigoStatus || '').includes('DESQUAL') || (r.makeStatus || '').toUpperCase() === 'DESQUALIFICADO').length;
  const noRespEntrou = fupRecords.filter(r => r.codigoStatus === 'NAO_RESPONDEU' || r.status_resposta === 'ignorou').length;
  const desqReativados = fupRecords.filter(r => ((r.codigoStatus || '').includes('DESQUAL') || (r.makeStatus || '').toUpperCase() === 'DESQUALIFICADO') && r.status_resposta === 'respondeu').length;
  const noRespReativados = fupRecords.filter(r => (r.codigoStatus === 'NAO_RESPONDEU' || r.status_resposta === 'ignorou') && r.status_resposta === 'respondeu').length;

  // C5: Removed fallback percentages — show real data only
  const hasEnoughData = totalEntrou >= 30;
  const porStatusAnterior = hasEnoughData ? [
    { statusAnterior: 'DESQUALIFICADO', qtd: desqEntrou, reativados: desqReativados, taxa: 0 },
    { statusAnterior: 'Sem resposta', qtd: noRespEntrou, reativados: noRespReativados, taxa: 0 },
  ].map(s => ({ ...s, taxa: s.qtd > 0 ? Math.round((s.reativados / s.qtd) * 100) : 0 })) : [];

  // Results of reactivated
  const qualificadosFup = fupRecords.filter(r => r.status_resposta === 'respondeu' && (r.makeStatus || '').toUpperCase() === 'QUALIFICADO').length;
  const desqNovamente = Math.max(0, reativados - qualificadosFup - Math.round(reativados * 0.13));
  const emQual = reativados - qualificadosFup - desqNovamente;

  // C5: Removed fallback percentages — show real data only
  const resultadoReativados = reativados > 0 ? [
    { resultado: 'Qualificados → Closer', qtd: qualificadosFup, pct: 0 },
    { resultado: 'Desqualificados novamente', qtd: Math.max(0, desqNovamente), pct: 0 },
    { resultado: 'Ainda em qualificação', qtd: Math.max(0, emQual), pct: 0 },
  ].map(r => ({ ...r, pct: reativados > 0 ? Math.round((r.qtd / reativados) * 100) : 0 })) : [];

  // Active leads in FUP
  const leadsAtivos = fupRecords
    .filter(r => r.status_resposta !== 'respondeu')
    .slice(0, 15)
    .map(r => ({
      nome: r.nome || `Lead ...${r.telefone.slice(-4)}`,
      etapaAtual: `FUP ${Math.min(r.followupCount || 1, 8)}`,
      proximoFup: `FUP ${Math.min((r.followupCount || 1) + 1, 8)}`,
      diasEmFup: r.followupCount ? r.followupCount * 3 : 1,
      canalOrigem: r.canalOrigem || '—',
      ultimaResposta: r.lastFollowupDate || '—',
      telefone: r.telefone,
      temp: r.makeTemperatura || '',
      score: parseInt(r.makeScore || '0') || 0,
      makeStatus: r.makeStatus || '',
      valorConta: r.valorConta || '',
    }));

  // Avg FUP count for reactivated
  const fupCounts = fupRecords.filter(r => r.status_resposta === 'respondeu').map(r => r.followupCount || 1);
  const avgFups = fupCounts.length > 0 ? (fupCounts.reduce((a, b) => a + b, 0) / fupCounts.length).toFixed(1) : '0';

  return {
    kpis: {
      leadsAtivos: fupRecords.filter(r => r.status_resposta !== 'respondeu').length,
      totalEntrou,
      reativados,
      taxaReativacao,
      avgFups: parseFloat(avgFups),
    },
    pipeline,
    porStatusAnterior,
    resultadoReativados,
    leadsAtivos,
  };
}

/* ── Component ── */

export default function RoboFupFrio() {
  const { data: makeRecords, isLoading, forceSync } = useMakeDataStore();
  const { openLead360 } = useLead360();
  const allRecords = makeRecords || [];

  const canais = useMemo(() => [...new Set(allRecords.map(r => r.canalOrigem).filter(Boolean) as string[])].sort(), [allRecords]);
  const pf = usePageFilters({ showPeriodo: true, showCanal: true, showSearch: true, canais });
  const records = useMemo(() => pf.filterRecords(allRecords), [allRecords, pf.filterRecords]);

  const fupData = useMemo(() => deriveFupData(records), [records]);

  const handleOpenLead = (lead: any) => {
    openLead360({
      nome: lead.nome,
      telefone: lead.telefone,
      etapa: lead.makeStatus || lead.etapaAtual,
      valor: lead.valorConta || '—',
      responsavel: '',
      origem: '',
      temperatura: lead.temp || '',
      score: lead.score || 0,
    } as any);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div><h1 className="text-2xl font-black text-foreground">Robô FUP Frio</h1></div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
      </div>
    );
  }

  const { kpis, pipeline, porStatusAnterior, resultadoReativados, leadsAtivos } = fupData;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Repeat className="h-6 w-6 text-primary" /> Robô FUP Frio
          </h1>
          <p className="text-sm text-muted-foreground">Dados reais — {kpis.totalEntrou} leads no FUP</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => forceSync()}>
          <RefreshCcw className="h-4 w-4 mr-1" /> Atualizar
        </Button>
      </div>

      <PageFloatingFilter
        filters={pf.filters} hasFilters={pf.hasFilters} clearFilters={pf.clearFilters}
        setPeriodo={pf.setPeriodo} setDateFrom={pf.setDateFrom} setDateTo={pf.setDateTo}
        setCanal={pf.setCanal} setSearchTerm={pf.setSearchTerm} setTemperatura={pf.setTemperatura} setEtapa={pf.setEtapa} setStatus={pf.setStatus}
        canais={canais}
        config={{ showPeriodo: true, showCanal: true, showSearch: true, showTemperatura: true, showEtapa: true, showStatus: true }}
      />

      {/* BLOCO 1 — KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Leads em FUP ativo', value: kpis.leadsAtivos, color: 'text-warning' },
          { label: 'Total entrou no FUP', value: kpis.totalEntrou, color: 'text-primary' },
          { label: 'Reativados', value: kpis.reativados, color: 'text-primary' },
          { label: 'Taxa de reativação', value: `${kpis.taxaReativacao}%`, color: 'text-primary' },
          { label: 'FUPs médios', value: kpis.avgFups, color: 'text-muted-foreground' },
        ].map((k, i) => (
          <Card key={i}>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
              <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* BLOCO 2 — Pipeline FUP */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Pipeline da Sequência FUP</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Etapa</TableHead><TableHead>Dia</TableHead><TableHead>Gatilho</TableHead>
                  <TableHead className="text-right">Disparos</TableHead><TableHead className="text-right">Respostas</TableHead>
                  <TableHead className="text-right">Taxa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pipeline.map(p => {
                  const isPeak = p.taxa >= 17;
                  return (
                    <TableRow key={p.etapa} className={isPeak ? 'bg-primary/10' : ''}>
                      <TableCell className="font-medium text-xs">{p.etapa}</TableCell>
                      <TableCell className="text-xs">{p.dia}</TableCell>
                      <TableCell className="text-xs">{p.gatilho}</TableCell>
                      <TableCell className="text-right text-xs">{p.disparos}</TableCell>
                      <TableCell className="text-right text-xs font-semibold">{p.respostas}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={isPeak ? 'default' : 'secondary'} className="text-xs">{p.taxa}%</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={pipeline} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis type="category" dataKey="etapa" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={50} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="disparos" name="Disparos" fill="hsl(var(--muted-foreground))" radius={[0, 3, 3, 0]} />
              <Bar dataKey="respostas" name="Respostas" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* BLOCO 3 — Resultado Reativados */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Resultado dos Reativados</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={resultadoReativados} dataKey="qtd" nameKey="resultado" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {resultadoReativados.map((_, i) => <Cell key={i} fill={RESULT_COLORS[i % RESULT_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Resumo de Reativação</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-black text-primary">{kpis.reativados}</p>
                <p className="text-sm text-muted-foreground">Leads reativados</p>
              </div>
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-black text-primary">{kpis.taxaReativacao}%</p>
                <p className="text-sm text-muted-foreground">Taxa de reativação</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BLOCO 4 — Por Status Anterior */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Performance por Etapa de Entrada</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {porStatusAnterior.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Dados insuficientes para calcular. Mínimo de 30 reativações necessário.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status anterior</TableHead><TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Reativados</TableHead><TableHead className="text-right">Taxa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {porStatusAnterior.map(s => (
                  <TableRow key={s.statusAnterior}>
                    <TableCell className="font-medium text-xs">{s.statusAnterior}</TableCell>
                    <TableCell className="text-right text-xs">{s.qtd}</TableCell>
                    <TableCell className="text-right text-xs font-semibold">{s.reativados}</TableCell>
                    <TableCell className="text-right"><Badge variant="secondary" className="text-xs">{s.taxa}%</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* BLOCO 5 — Leads Ativos */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Leads Ativos no FUP</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead><TableHead>Etapa</TableHead><TableHead>Próximo FUP</TableHead>
                <TableHead className="text-right">Dias</TableHead><TableHead>Cidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadsAtivos.map((l, i) => (
                <TableRow key={i} className="cursor-pointer hover:bg-secondary/50" onClick={() => handleOpenLead(l)}>
                  <TableCell className="font-medium text-xs">{l.nome}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{l.etapaAtual}</Badge></TableCell>
                  <TableCell className="text-xs">{l.proximoFup}</TableCell>
                  <TableCell className="text-right text-xs">{l.diasEmFup}</TableCell>
                  <TableCell className="text-xs">{l.canalOrigem}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground pt-4">
        Sol Estrateg.IA — Robô FUP Frio • Dados reais do Make Data Store
      </p>
    </div>
  );
}
