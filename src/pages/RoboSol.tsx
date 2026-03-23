import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Bot, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMakeDataStore, MakeRecord } from '@/hooks/useMakeDataStore';
import { format, parseISO } from 'date-fns';
import { usePageFilters, PageFloatingFilter } from '@/components/filters/PageFloatingFilter';

function useAnimatedNumber(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = (ts: number) => { if (!start) start = ts; const p = Math.min((ts - start) / duration, 1); setValue(target * p); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 };
const COLORS_MOTIVOS = ['hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--chart-5))', 'hsl(var(--muted-foreground))'];
const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function SLAGauge({ pct, status }: { pct: number; status: string }) {
  const color = status === 'dentro' ? 'hsl(var(--success))' : status === 'depende' ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';
  const r = 40, cx = 50, cy = 50;
  const circumference = Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <svg viewBox="0 0 100 60" className="w-24 h-14 mx-auto">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      <text x={cx} y={cy - 5} textAnchor="middle" className="fill-foreground text-xs font-bold">{pct}%</text>
    </svg>
  );
}

function TempBadge({ temp }: { temp: string }) {
  const c = temp === 'QUENTE' ? 'bg-destructive/20 text-destructive' : temp === 'MORNO' ? 'bg-warning/20 text-warning' : 'bg-info/20 text-info';
  return <Badge className={`${c} text-xs`}>{temp}</Badge>;
}

function deriveSolData(records: MakeRecord[]) {
  const solRecords = records.filter(r => r.robo === 'sol' || (!r.robo.includes('fup') && (r.followupCount ?? 0) === 0));
  const total = solRecords.length;
  const responderam = solRecords.filter(r => r.status_resposta === 'respondeu').length;
  const taxaResposta = total > 0 ? (responderam / total) * 100 : 0;

  const qualificados = solRecords.filter(r => (r.makeStatus || '').toUpperCase() === 'QUALIFICADO').length;
  const desqualificados = solRecords.filter(r => (r.makeStatus || '').toUpperCase() === 'DESQUALIFICADO').length;
  const emQualificacao = solRecords.filter(r => {
    const s = (r.makeStatus || '').toUpperCase();
    return s !== 'QUALIFICADO' && s !== 'DESQUALIFICADO' && r.status_resposta === 'respondeu';
  }).length;

  const scores = solRecords.map(r => parseInt(r.makeScore || '0') || 0).filter(s => s > 0);
  const scoreMedio = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const temps = solRecords.map(r => (r.makeTemperatura || '').toUpperCase());
  const quentes = temps.filter(t => t === 'QUENTE').length;
  const mornos = temps.filter(t => t === 'MORNO').length;
  const frios = temps.filter(t => t === 'FRIO').length;
  const tempMedia = quentes > mornos && quentes > frios ? 'QUENTE' : mornos >= quentes ? 'MORNO' : 'FRIO';

  const taxaQualificacao = total > 0 ? (qualificados / total) * 100 : 0;

  // Funnel
  const funil = [
    { etapa: 'Recebidos', valor: total, pct: 100 },
    { etapa: 'Responderam', valor: responderam, pct: total > 0 ? Math.round((responderam / total) * 100) : 0 },
    { etapa: 'Em qualificação', valor: emQualificacao, pct: responderam > 0 ? Math.round((emQualificacao / responderam) * 100) : 0 },
    { etapa: 'Qualificados MQL', valor: qualificados, pct: total > 0 ? Math.round((qualificados / total) * 100) : 0 },
    { etapa: 'Desqualificados', valor: desqualificados, pct: total > 0 ? Math.round((desqualificados / total) * 100) : 0 },
  ];

  // Temperature distribution
  const tempDist = [
    { label: 'QUENTE', range: '70-100', qtd: quentes, cor: 'hsl(0, 84%, 60%)' },
    { label: 'MORNO', range: '40-69', qtd: mornos, cor: 'hsl(45, 93%, 47%)' },
    { label: 'FRIO', range: '0-39', qtd: frios, cor: 'hsl(199, 89%, 48%)' },
  ];

  // Top hot leads
  const topQuentes = solRecords
    .filter(r => (r.makeTemperatura || '').toUpperCase() === 'QUENTE')
    .sort((a, b) => (parseInt(b.makeScore || '0') || 0) - (parseInt(a.makeScore || '0') || 0))
    .slice(0, 5)
    .map(r => ({ nome: r.nome || 'Lead', cidade: r.cidade || '—', score: parseInt(r.makeScore || '0') || 0, canal: r.cidade || 'Direto' }));

  // Disqualification reasons from codigoStatus
  const desqualReasons: Record<string, number> = {};
  solRecords.filter(r => (r.makeStatus || '').toUpperCase() === 'DESQUALIFICADO').forEach(r => {
    const reason = r.codigoStatus || 'NAO_INFORMADO';
    desqualReasons[reason] = (desqualReasons[reason] || 0) + 1;
  });
  const totalDesq = Object.values(desqualReasons).reduce((a, b) => a + b, 0) || 1;
  const motivos = Object.entries(desqualReasons)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([motivo, qtd]) => ({ motivo, qtd, pct: Math.round((qtd / totalDesq) * 100) }));

  // Performance by channel (derived from cidade/campanha)
  const byCanal: Record<string, { leads: number; responderam: number; qualificados: number; scores: number[] }> = {};
  solRecords.forEach(r => {
    const canal = r.cidade || 'Outros';
    if (!byCanal[canal]) byCanal[canal] = { leads: 0, responderam: 0, qualificados: 0, scores: [] };
    byCanal[canal].leads++;
    if (r.status_resposta === 'respondeu') byCanal[canal].responderam++;
    if ((r.makeStatus || '').toUpperCase() === 'QUALIFICADO') byCanal[canal].qualificados++;
    const s = parseInt(r.makeScore || '0') || 0;
    if (s > 0) byCanal[canal].scores.push(s);
  });
  const perfCanal = Object.entries(byCanal)
    .map(([canal, d]) => ({
      canal,
      leads: d.leads,
      responderam: d.responderam,
      qualificados: d.qualificados,
      taxa: d.leads > 0 ? Math.round((d.qualificados / d.leads) * 100) : 0,
      scoreMedio: d.scores.length > 0 ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 0,
    }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 6);

  // Messages volume
  const totalEnviadas = solRecords.reduce((s, r) => s + r.historico.filter(h => h.tipo === 'enviada').length, 0);
  const totalRecebidas = solRecords.reduce((s, r) => s + r.historico.filter(h => h.tipo === 'recebida').length, 0);
  const conversas = solRecords.filter(r => r.historico.length > 0).length || 1;
  const volumeMensagens = {
    totalEnviadas,
    totalRecebidas,
    mediaPorConversa: +(totalEnviadas / conversas).toFixed(1),
    mediaAteQualificar: +(totalEnviadas / Math.max(qualificados, 1)).toFixed(1),
    mediaAteDesqualificar: +(totalEnviadas / Math.max(desqualificados, 1)).toFixed(1),
  };

  // Messages per day (aggregate by date)
  const msgByDay: Record<string, { enviadas: number; recebidas: number }> = {};
  solRecords.forEach(r => {
    const date = r.data_envio ? r.data_envio.slice(0, 10) : '';
    if (!date) return;
    if (!msgByDay[date]) msgByDay[date] = { enviadas: 0, recebidas: 0 };
    msgByDay[date].enviadas += r.historico.filter(h => h.tipo === 'enviada').length || 1;
    msgByDay[date].recebidas += r.historico.filter(h => h.tipo === 'recebida').length;
  });
  const mensagensPorDia = Object.entries(msgByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-17)
    .map(([dia, d]) => ({ dia: dia.slice(5), ...d }));

  // Heatmap (7 days x 24 hours) from data_envio timestamps
  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  solRecords.forEach(r => {
    try {
      const raw = r.data_envio || ""; const parts = raw.match(/\d+/g); const d = parts && parts.length >= 5 ? new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]), parseInt(parts[3]), parseInt(parts[4])) : new Date(raw);
      if (isNaN(d.getTime())) return;
      const day = d.getDay(); // 0=Sun
      const hour = d.getHours();
      const mapDay = day === 0 ? 6 : day - 1; // Mon=0
      heatmap[mapDay][hour]++;
    } catch { /* skip */ }
  });

  // Daily evolution
  const evolByDay: Record<string, { recebidos: number; qualificados: number }> = {};
  solRecords.forEach(r => {
    const date = r.data_envio ? r.data_envio.slice(0, 10) : '';
    if (!date) return;
    if (!evolByDay[date]) evolByDay[date] = { recebidos: 0, qualificados: 0 };
    evolByDay[date].recebidos++;
    if ((r.makeStatus || '').toUpperCase() === 'QUALIFICADO') evolByDay[date].qualificados++;
  });
  const evolucaoDiaria = Object.entries(evolByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-17)
    .map(([dia, d]) => ({
      dia: dia.slice(5),
      recebidos: d.recebidos,
      qualificados: d.qualificados,
      taxa: d.recebidos > 0 ? Math.round((d.qualificados / d.recebidos) * 100) : 0,
    }));

  // Recent leads
  const leadsRecentes = solRecords
    .sort((a, b) => (b.data_envio || '').localeCompare(a.data_envio || ''))
    .slice(0, 15)
    .map(r => ({
      nome: r.nome || 'Lead',
      cidade: r.cidade || '—',
      canal: r.cidade || 'Direto',
      score: parseInt(r.makeScore || '0') || 0,
      temperatura: (r.makeTemperatura || 'FRIO').toUpperCase(),
      status: (r.makeStatus || '').toUpperCase() === 'QUALIFICADO' ? 'Qualificado' :
              (r.makeStatus || '').toUpperCase() === 'DESQUALIFICADO' ? 'Desqualificado' : 'Em qualificação',
      duracao: '—',
      data: r.data_envio ? r.data_envio.slice(0, 10) : '—',
    }));

  // SLA — derive from data
  const slaData = [
    { etapa: 'Lead entra → Sol aborda', slaMeta: '3 min', real: '—', pctCumprido: 0, status: 'dentro' as const },
    { etapa: 'Sol aborda → Lead responde', slaMeta: '10 min', real: '—', pctCumprido: 0, status: 'depende' as const },
    { etapa: 'Sol → Lead qualificado', slaMeta: '10 min', real: '—', pctCumprido: 0, status: 'dentro' as const },
  ];
  // Attempt to calculate real SLA if we have tempo_resposta_seg equivalent in historico
  const withResponse = solRecords.filter(r => r.data_resposta && r.data_envio);
  if (withResponse.length > 0) {
    const avgResponseMs = withResponse.reduce((sum, r) => {
      const sent = new Date(r.data_envio).getTime();
      const resp = new Date(r.data_resposta!).getTime();
      return sum + (resp - sent);
    }, 0) / withResponse.length;
    const avgMin = avgResponseMs / 60000;
    const formatted = avgMin > 60 ? `${Math.round(avgMin / 60)}h ${Math.round(avgMin % 60)}min` : `${Math.round(avgMin)}min`;
    slaData[1].real = formatted;
    slaData[1].pctCumprido = Math.round(withResponse.filter(r => {
      const diff = new Date(r.data_resposta!).getTime() - new Date(r.data_envio).getTime();
      return diff <= 10 * 60000;
    }).length / withResponse.length * 100);
  }

  return {
    kpis: { conversasIniciadas: total, taxaResposta: +taxaResposta.toFixed(1), leadsQualificados: qualificados, taxaQualificacao: +taxaQualificacao.toFixed(1), leadsDesqualificados: desqualificados, emQualificacao, scoreMedio, temperatureMedia: tempMedia },
    funil, tempDist, topQuentes, motivos, perfCanal, volumeMensagens, mensagensPorDia, slaData, heatmap, evolucaoDiaria, leadsRecentes,
  };
}

export default function RoboSol() {
  const { data: makeRecords, isLoading, refetch } = useMakeDataStore();
  const allRecords = makeRecords || [];

  const canais = useMemo(() => [...new Set(allRecords.map(r => r.canalOrigem).filter(Boolean) as string[])].sort(), [allRecords]);
  const pf = usePageFilters({ showPeriodo: true, showCanal: true, showTemperatura: true, showSearch: true, canais });
  const records = useMemo(() => pf.filterRecords(allRecords), [allRecords, pf.filterRecords]);

  const d = useMemo(() => deriveSolData(records), [records]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div><h1 className="text-2xl font-black text-foreground flex items-center gap-2"><Bot className="h-6 w-6 text-primary" /> Robô SOL — SDR IA</h1></div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="space-y-6 pb-10">
        <div><h1 className="text-2xl font-black text-foreground flex items-center gap-2"><Bot className="h-6 w-6 text-primary" /> Robô SOL — SDR IA</h1></div>
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum dado disponível no Data Store. Verifique a integração.</CardContent></Card>
      </div>
    );
  }

  const { kpis, funil, tempDist, topQuentes, motivos, perfCanal, volumeMensagens, mensagensPorDia, slaData, heatmap, evolucaoDiaria, leadsRecentes } = d;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" /> Robô SOL — SDR IA
          </h1>
          <p className="text-sm text-muted-foreground">Performance operacional — Dados reais do Data Store</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCcw className="h-4 w-4 mr-1" /> Atualizar</Button>
      </div>

      <PageFloatingFilter
        filters={pf.filters} hasFilters={pf.hasFilters} clearFilters={pf.clearFilters}
        setPeriodo={pf.setPeriodo} setDateFrom={pf.setDateFrom} setDateTo={pf.setDateTo}
        setCanal={pf.setCanal} setTemperatura={pf.setTemperatura} setSearchTerm={pf.setSearchTerm}
        canais={canais}
        config={{ showPeriodo: true, showCanal: true, showTemperatura: true, showSearch: true }}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Conversas iniciadas', value: kpis.conversasIniciadas, color: 'text-warning' },
          { label: 'Taxa de resposta', value: kpis.taxaResposta, suffix: '%', color: 'text-primary' },
          { label: 'Leads qualificados', value: kpis.leadsQualificados, color: 'text-primary' },
          { label: 'Taxa qualificação', value: kpis.taxaQualificacao, suffix: '%', color: 'text-warning' },
          { label: 'Desqualificados', value: kpis.leadsDesqualificados, color: 'text-destructive/70' },
          { label: 'Em qualificação', value: kpis.emQualificacao, color: 'text-info', pulse: true },
          { label: 'Score médio', value: kpis.scoreMedio, color: 'text-warning' },
          { label: 'Temp. média', value: 0, text: kpis.temperatureMedia, color: 'text-warning' },
        ].map((k, i) => {
          const anim = useAnimatedNumber(k.value);
          return (
            <Card key={i} className={k.pulse ? 'ring-1 ring-info/50' : ''}>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
                <p className={`text-xl font-bold ${k.color}`}>
                  {k.text || (k.suffix === '%' ? anim.toFixed(1) : Math.round(anim).toLocaleString('pt-BR'))}{k.suffix || ''}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Funil */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Funil do Robô SOL</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {funil.map((s, i) => {
              const isLast = s.etapa === 'Desqualificados';
              const color = isLast ? 'bg-destructive/70' : i === 0 ? 'bg-muted-foreground' : 'bg-primary';
              return (
                <div key={s.etapa} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-32 text-right shrink-0">{s.etapa}</span>
                  <div className="flex-1 bg-muted rounded-full h-7 relative overflow-hidden">
                    <div className={`${color} h-full rounded-full flex items-center justify-end pr-3 transition-all duration-1000`} style={{ width: `${Math.max(s.pct, 2)}%` }}>
                      <span className="text-xs font-bold text-primary-foreground">{s.valor}</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold w-10 text-right">{s.pct}%</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Temperatura */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Distribuição de Temperatura</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={tempDist} dataKey="qtd" nameKey="label" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {tempDist.map((d, i) => <Cell key={i} fill={d.cor} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Top Leads Mais Quentes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topQuentes.length === 0 && <p className="text-sm text-muted-foreground text-center">Nenhum lead quente encontrado</p>}
              {topQuentes.map((l, i) => (
                <div key={i} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{l.nome}</p>
                    <p className="text-xs text-muted-foreground">{l.cidade}</p>
                  </div>
                  <Badge className="bg-destructive/20 text-destructive font-bold">{l.score}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Motivos Desqualificação */}
      {motivos.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Motivos de Desqualificação</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={motivos} dataKey="qtd" nameKey="motivo" cx="50%" cy="50%" outerRadius={80}>
                    {motivos.map((_, i) => <Cell key={i} fill={COLORS_MOTIVOS[i % COLORS_MOTIVOS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Detalhamento</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Motivo</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead className="text-right">%</TableHead></TableRow></TableHeader>
                <TableBody>
                  {motivos.map(m => (
                    <TableRow key={m.motivo}>
                      <TableCell className="text-xs">{m.motivo.replace(/_/g, ' ')}</TableCell>
                      <TableCell className="text-right text-xs">{m.qtd}</TableCell>
                      <TableCell className="text-right text-xs">{m.pct}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance por Canal */}
      {perfCanal.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Performance por Canal de Origem</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Canal</TableHead><TableHead className="text-right">Leads</TableHead><TableHead className="text-right">Responderam</TableHead>
                  <TableHead className="text-right">Qualificados</TableHead><TableHead className="text-right">Taxa</TableHead><TableHead className="text-right">Score Médio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perfCanal.map(c => (
                  <TableRow key={c.canal}>
                    <TableCell className="font-medium text-xs">{c.canal}</TableCell>
                    <TableCell className="text-right text-xs">{c.leads}</TableCell>
                    <TableCell className="text-right text-xs">{c.responderam}</TableCell>
                    <TableCell className="text-right text-xs font-semibold">{c.qualificados}</TableCell>
                    <TableCell className="text-right text-xs">{c.taxa}%</TableCell>
                    <TableCell className="text-right text-xs">{c.scoreMedio}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Volume Mensagens */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Volume de Mensagens</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { l: 'Enviadas', v: volumeMensagens.totalEnviadas },
              { l: 'Recebidas', v: volumeMensagens.totalRecebidas },
              { l: 'Média/conversa', v: volumeMensagens.mediaPorConversa, d: true },
              { l: 'Até qualificar', v: volumeMensagens.mediaAteQualificar, d: true },
              { l: 'Até desqualificar', v: volumeMensagens.mediaAteDesqualificar, d: true },
            ].map(k => (
              <div key={k.l} className="bg-muted/30 rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">{k.l}</p>
                <p className="text-lg font-bold">{k.d ? k.v.toFixed(1) : k.v.toLocaleString('pt-BR')}</p>
              </div>
            ))}
          </div>
          {mensagensPorDia.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mensagensPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="enviadas" name="Enviadas" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="recebidas" name="Recebidas" fill="hsl(var(--info))" radius={[3, 3, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Heatmap */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Melhor Horário e Dia</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="flex gap-1 mb-1 pl-12">
                {Array.from({ length: 24 }, (_, i) => (
                  <div key={i} className="flex-1 text-center text-[9px] text-muted-foreground">{i}h</div>
                ))}
              </div>
              {heatmap.map((row, di) => {
                const maxV = Math.max(...heatmap.flat(), 1);
                return (
                  <div key={di} className="flex gap-1 mb-1 items-center">
                    <span className="text-xs text-muted-foreground w-10 text-right shrink-0">{diasSemana[di]}</span>
                    {row.map((v, hi) => {
                      const opacity = v / maxV;
                      return (
                        <div key={hi} className="flex-1 h-5 rounded-sm" title={`${diasSemana[di]} ${hi}h: ${v}`}
                          style={{ backgroundColor: `hsl(var(--primary) / ${Math.max(opacity, 0.05)})` }} />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evolução Diária */}
      {evolucaoDiaria.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Evolução Diária</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={evolucaoDiaria}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line yAxisId="left" type="monotone" dataKey="recebidos" name="Recebidos" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={{ r: 2 }} />
                <Line yAxisId="left" type="monotone" dataKey="qualificados" name="Qualificados" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} />
                <Line yAxisId="right" type="monotone" dataKey="taxa" name="Taxa %" stroke="hsl(var(--warning))" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 2 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Leads Recentes */}
      {leadsRecentes.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Leads Recentes</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead><TableHead>Cidade</TableHead>
                  <TableHead className="text-right">Score</TableHead><TableHead>Temp.</TableHead>
                  <TableHead>Status</TableHead><TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsRecentes.map((l, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-xs">{l.nome}</TableCell>
                    <TableCell className="text-xs">{l.cidade}</TableCell>
                    <TableCell className="text-right text-xs font-semibold">{l.score}</TableCell>
                    <TableCell><TempBadge temp={l.temperatura} /></TableCell>
                    <TableCell>
                      <Badge variant={l.status === 'Qualificado' ? 'default' : l.status === 'Em qualificação' ? 'secondary' : 'outline'} className="text-xs">
                        {l.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.data}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-xs text-muted-foreground pt-4">
        Sol Estrateg.IA — Robô SOL SDR • Dados reais do Data Store
      </p>
    </div>
  );
}
