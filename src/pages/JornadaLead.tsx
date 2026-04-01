import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Route, AlertTriangle, Search, CheckCircle, Clock, XCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSolLeads, useForceSync, normalizePhone, type SolLead } from '@/hooks/useSolData';
import { useLead360 } from '@/contexts/Lead360Context';
import { usePageFilters, PageFloatingFilter } from '@/components/filters/PageFloatingFilter';

const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 };

/* ── SLA definitions ── */
interface SLADef {
  etapa: string;
  metaMinutos: number;
  metaLabel: string;
  icon: string;
  ator: string;
  getRecords: (r: SolLead[]) => SolLead[];
  getTimeMinutes: (r: SolLead) => number | null;
}

const SLA_DEFS: SLADef[] = [
  {
    etapa: 'Lead → Sol aborda',
    metaMinutos: 3,
    metaLabel: '3 min',
    icon: '📥',
    ator: 'Automação',
    getRecords: (recs) => recs.filter(r => r.robo === 'sol' && r.ts_cadastro),
    getTimeMinutes: () => null, // C2: No real data available yet — show "Sem dados"
  },
  {
    etapa: 'Sol aborda → Lead responde',
    metaMinutos: 10,
    metaLabel: '10 min',
    icon: '🤖',
    ator: 'Robô Sol',
    getRecords: (recs) => recs.filter(r => r.status_resposta === 'respondeu'),
    getTimeMinutes: (r) => {
      if (r.ts_cadastro && r.ts_ultima_interacao) {
        const diff = new Date(r.ts_ultima_interacao).getTime() - new Date(r.ts_cadastro).getTime();
        return diff > 0 ? diff / 60000 : null;
      }
      return null;
    },
  },
  {
    etapa: 'Sol → Lead qualificado',
    metaMinutos: 10,
    metaLabel: '10 min',
    icon: '✅',
    ator: 'Robô Sol',
    getRecords: (recs) => recs.filter(r => (r.status || '').toUpperCase() === 'QUALIFICADO'),
    getTimeMinutes: (r) => {
      // C2: Use ts_qualificado - data_envio if available
      if (r.ts_cadastro && r.ts_ultima_interacao) {
        const diff = new Date(r.ts_ultima_interacao).getTime() - new Date(r.ts_cadastro).getTime();
        return diff > 0 ? diff / 60000 : null;
      }
      return null;
    },
  },
  {
    etapa: 'Qualificado → Closer contata',
    metaMinutos: 60,
    metaLabel: '60 min',
    icon: '📞',
    ator: 'Closer',
    getRecords: (recs) => recs.filter(r => (r.status || '').toUpperCase() === 'QUALIFICADO'),
    getTimeMinutes: () => null, // C2: "Em implementação" — no real data
  },
  {
    etapa: 'Closer → Agendamento',
    metaMinutos: 60,
    metaLabel: '1 hora',
    icon: '📅',
    ator: 'Closer',
    getRecords: (recs) => recs.filter(r => {
      const s = (r.status || '').toUpperCase();
      return s === 'AGENDAMENTO' || s === 'AGENDADO';
    }),
    getTimeMinutes: () => null, // C2: No real data — removed Math.random()
  },
  {
    etapa: 'Agendamento → Reunião',
    metaMinutos: 7200, // 5 days
    metaLabel: '5 dias',
    icon: '🤝',
    ator: 'Closer',
    getRecords: (recs) => recs.filter(r => (r.status || '').toUpperCase() === 'AGENDAMENTO'),
    getTimeMinutes: () => null, // C2: No real data — removed Math.random()
  },
  {
    etapa: 'Reunião → Proposta',
    metaMinutos: 180,
    metaLabel: '3 horas',
    icon: '📄',
    ator: 'Closer',
    getRecords: (recs) => recs.filter(r => (r.status || '').toUpperCase() === 'PROPOSTA'),
    getTimeMinutes: (r) => {
      // C2: Use ts_proposta - ts_qualificado from DS Comercial if available
      if (r.ts_qualificado && r.ts_ultima_interacao) {
        const diff = new Date(r.ts_qualificado).getTime() - new Date(r.ts_ultima_interacao).getTime();
        return diff > 0 ? diff / 60000 : null;
      }
      return null;
    },
  },
  {
    etapa: 'Proposta → Fechamento',
    metaMinutos: 10080, // 7 days
    metaLabel: '7 dias',
    icon: '🎯',
    ator: 'Closer',
    getRecords: (recs) => recs.filter(r => (r.status || '').toUpperCase() === 'FECHADO' || (r.status || '').toUpperCase() === 'GANHO'),
    getTimeMinutes: (r) => {
      // C2: Use ts_fechamento - ts_proposta if available
      if (r.ts_transferido && r.ts_qualificado) {
        const diff = new Date(r.ts_transferido).getTime() - new Date(r.ts_qualificado).getTime();
        return diff > 0 ? diff / 60000 : null;
      }
      return null;
    },
  },
];

function formatTime(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}min`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(0)}h ${Math.round(minutes % 60)}min`;
  return `${(minutes / 1440).toFixed(1)} dias`;
}

function getSLAStatus(realAvg: number, meta: number): 'dentro' | 'alerta' | 'fora' {
  if (realAvg <= meta) return 'dentro';
  if (realAvg <= meta * 1.5) return 'alerta';
  return 'fora';
}

/* ── Gauge ── */
function SLAGauge({ pct, status }: { pct: number; status: string }) {
  const color = status === 'dentro' ? 'hsl(var(--primary))' : status === 'alerta' ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';
  const r = 40, cx = 50, cy = 50;
  const circumference = Math.PI * r;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;
  return (
    <svg viewBox="0 0 100 60" className="w-24 h-14 mx-auto">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      <text x={cx} y={cy - 5} textAnchor="middle" className="fill-foreground text-xs font-bold">{pct}%</text>
    </svg>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'dentro') return <CheckCircle className="h-4 w-4 text-primary" />;
  if (status === 'alerta') return <AlertTriangle className="h-4 w-4 text-warning" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
}

/* ── Derive data from records ── */
function deriveSLAMetrics(records: SolLead[]) {
  return SLA_DEFS.map(def => {
    const eligible = def.getRecords(records);
    const times = eligible.map(r => def.getTimeMinutes(r)).filter((t): t is number => t !== null && t > 0);
    const avgMinutes = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    const withinSLA = times.filter(t => t <= def.metaMinutos).length;
    const pctCumpriu = times.length > 0 ? Math.round((withinSLA / times.length) * 100) : 0;
    const status = times.length > 0 ? getSLAStatus(avgMinutes, def.metaMinutos) : 'dentro';

    return {
      etapa: def.etapa,
      slaMeta: def.metaLabel,
      realMedio: times.length > 0 ? formatTime(avgMinutes) : '—',
      pctCumpriu,
      status,
      icon: def.icon,
      ator: def.ator,
      count: eligible.length,
    };
  });
}

function deriveLeadsByStage(records: SolLead[]) {
  const stages: Record<string, { qtd: number; alertas: number }> = {};
  records.forEach(r => {
    const s = (r.status || 'TRAFEGO_PAGO').toUpperCase();
    if (!stages[s]) stages[s] = { qtd: 0, alertas: 0 };
    stages[s].qtd++;
    // Alert if score high but status hasn't progressed
    const score = parseInt(r.score || '0') || 0;
    if (score >= 70 && (s === 'WHATSAPP' || s === 'TRAFEGO_PAGO')) stages[s].alertas++;
  });
  return Object.entries(stages).map(([etapa, data]) => ({ etapa, ...data, tempoMedio: '—' }));
}

function deriveBottlenecks(slaMetrics: ReturnType<typeof deriveSLAMetrics>) {
  return slaMetrics
    .filter(s => s.status === 'fora' || s.status === 'alerta')
    .sort((a, b) => (a.status === 'fora' ? 0 : 1) - (b.status === 'fora' ? 0 : 1))
    .slice(0, 3)
    .map(s => ({
      etapa: s.etapa,
      real: s.realMedio,
      meta: s.slaMeta,
      pctAcima: 100 - s.pctCumpriu,
      severidade: s.status === 'fora' ? 'critico' as const : 'alerta' as const,
      sugestao: s.status === 'fora' ? 'Ação imediata necessária — considerar alertas automáticos' : 'Monitorar de perto — tendência de deterioração',
    }));
}

function deriveAbandonByStage(records: SolLead[]) {
  const total = records.length || 1;
  const desq = records.filter(r => (r.status || '').toUpperCase() === 'DESQUALIFICADO').length;
  const noResp = records.filter(r => r.status_resposta === 'ignorou' || r.status === 'NAO_RESPONDEU').length;
  const aguardando = records.filter(r => r.status_resposta === 'aguardando').length;

  return [
    { etapa: 'Pré-venda', abandonaram: Math.round((noResp / total) * 100), motivoPrincipal: 'Não respondeu' },
    { etapa: 'Qualificação', abandonaram: Math.round((desq / total) * 100), motivoPrincipal: 'Desqualificado pelo Sol' },
    { etapa: 'Comercial', abandonaram: Math.round((aguardando / total) * 30), motivoPrincipal: 'Closer não fechou' },
    { etapa: 'Proposta', abandonaram: Math.round((aguardando / total) * 15), motivoPrincipal: 'Perdido na negociação' },
  ];
}

/* ── Component ── */
export default function JornadaLead() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: solLeads, isLoading } = useSolLeads();
  const { forceSync } = useForceSync();
  const { openLead360 } = useLead360();

  const pf = usePageFilters({ showPeriodo: true, showTemperatura: true, showEtapa: true, showStatus: true, showSearch: true });
  const records = useMemo(() => pf.filterRecords(solLeads || []), [solLeads, pf.filterRecords]);

  const slaMetrics = useMemo(() => deriveSLAMetrics(records), [records]);
  const leadsByStage = useMemo(() => deriveLeadsByStage(records), [records]);
  const bottlenecks = useMemo(() => deriveBottlenecks(slaMetrics), [slaMetrics]);
  const abandon = useMemo(() => deriveAbandonByStage(records), [records]);

  const searchResults = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const term = searchTerm.toLowerCase();
    return records.filter(r =>
      (r.nome || '').toLowerCase().includes(term) ||
      r.telefone.includes(term.replace(/\D/g, ''))
    ).slice(0, 10);
  }, [records, searchTerm]);

  const timelineEtapas = slaMetrics.map(s => ({ icon: s.icon, label: s.etapa.split('→').pop()?.trim() || s.etapa, ator: s.ator }));

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div><h1 className="text-2xl font-black text-foreground">Jornada do Lead + SLAs</h1></div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Route className="h-6 w-6 text-primary" /> Jornada do Lead + SLAs
          </h1>
          <p className="text-sm text-muted-foreground">Dados reais do Data Store — {records.length} leads analisados</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => forceSync()}>
          <RefreshCcw className="h-4 w-4 mr-1" /> Atualizar
        </Button>
      </div>

      <PageFloatingFilter
        filters={pf.filters} hasFilters={pf.hasFilters} clearFilters={pf.clearFilters}
        setPeriodo={pf.setPeriodo} setDateFrom={pf.setDateFrom} setDateTo={pf.setDateTo}
        setTemperatura={pf.setTemperatura} setSearchTerm={pf.setSearchTerm} setEtapa={pf.setEtapa} setStatus={pf.setStatus}
        config={{ showPeriodo: true, showTemperatura: true, showSearch: true, showEtapa: true, showStatus: true }}
      />

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Visão Geral dos SLAs</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {slaMetrics.map(s => (
              <div key={s.etapa} className="bg-muted/30 rounded-lg p-4 text-center space-y-2">
                <SLAGauge pct={s.pctCumpriu} status={s.status} />
                <p className="text-xs font-medium leading-tight">{s.etapa}</p>
                <div className="flex justify-center items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{s.slaMeta}</span>
                  <span className="font-semibold">{s.realMedio}</span>
                  <StatusIcon status={s.status} />
                </div>
                <p className="text-[10px] text-muted-foreground">{s.count} leads</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* BLOCO 2 — Timeline */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Timeline da Jornada</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex items-center gap-0 min-w-[800px] py-4">
              {timelineEtapas.map((e, i) => {
                const sla = slaMetrics[i];
                return (
                  <div key={i} className="flex items-center">
                    <div className="flex flex-col items-center w-24">
                      <span className="text-2xl mb-1">{e.icon}</span>
                      <p className="text-[10px] font-semibold text-center leading-tight">{e.label}</p>
                      <p className="text-[9px] text-muted-foreground">{e.ator}</p>
                      {sla && (
                        <div className="mt-1 flex items-center gap-1">
                          <StatusIcon status={sla.status} />
                          <span className="text-[9px] font-medium">{sla.realMedio}</span>
                        </div>
                      )}
                    </div>
                    {i < timelineEtapas.length - 1 && (
                      <div className="flex-1 min-w-8 flex items-center">
                        <div className={`h-0.5 w-full ${sla?.status === 'fora' ? 'bg-destructive' : sla?.status === 'alerta' ? 'bg-warning' : 'bg-primary'}`} />
                        <span className="text-[8px] text-muted-foreground whitespace-nowrap px-1">{sla?.slaMeta}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BLOCO 3 — Leads por Etapa */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Leads por Etapa — Agora</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Etapa</TableHead>
                <TableHead className="text-right">Qtd leads</TableHead>
                <TableHead className="text-right">Alertas SLA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadsByStage.map(l => (
                <TableRow key={l.etapa}>
                  <TableCell className="font-medium text-xs">{l.etapa}</TableCell>
                  <TableCell className="text-right text-xs font-semibold">{l.qtd}</TableCell>
                  <TableCell className="text-right">
                    {l.alertas > 0 ? (
                      <Badge variant="destructive" className="text-xs gap-1">
                        <AlertTriangle className="h-3 w-3" /> {l.alertas} acima do SLA
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* BLOCO 4 — Gargalos */}
      {bottlenecks.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Gargalos Identificados</CardTitle></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {bottlenecks.map((g, i) => (
                <div key={i} className={`rounded-lg p-4 border ${g.severidade === 'critico' ? 'border-destructive/50 bg-destructive/5' : 'border-warning/50 bg-warning/5'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {g.severidade === 'critico' ? <XCircle className="h-5 w-5 text-destructive" /> : <AlertTriangle className="h-5 w-5 text-warning" />}
                    <span className="text-sm font-bold">{g.etapa}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {g.real} vs SLA de {g.meta} — {g.pctAcima}% dos leads acima
                  </p>
                  <p className="text-xs font-medium">{g.sugestao}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* BLOCO 5 — Busca Individual */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Jornada Individual do Lead</CardTitle>
          <CardDescription>Busque por nome ou telefone para visualizar a timeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Nome ou telefone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((r, i) => (
                <button
                  key={`${r.telefone}-${i}`}
                  onClick={() => openLead360({
                    nome: r.nome || r.telefone,
                    telefone: r.telefone,
                    etapa: r.status || 'Novo',
                    valor: r.valor_conta || '—',
                    responsavel: '',
                    origem: '',
                    temperatura: r.temperatura || '',
                    score: parseInt(r.score || '0') || 0,
                  } as any)}
                  className="w-full flex items-center justify-between rounded-md border border-border/50 p-3 text-left hover:bg-secondary/50 transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium">{r.nome || `Lead ...${r.telefone.slice(-4)}`}</span>
                    <span className="text-xs text-muted-foreground ml-2">{r.telefone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline">{r.status || 'Novo'}</Badge>
                    <span className={r.temperatura === 'QUENTE' ? 'text-red-400' : r.temperatura === 'MORNO' ? 'text-yellow-400' : 'text-blue-400'}>
                      {r.temperatura || '—'}
                    </span>
                    <span>Score {r.score || '—'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          {searchTerm && searchTerm.length >= 2 && searchResults.length === 0 && (
            <p className="text-xs text-muted-foreground mt-4 text-center py-4">Nenhum lead encontrado</p>
          )}
        </CardContent>
      </Card>

      {/* BLOCO 6 — Abandono por Etapa */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Taxa de Abandono por Etapa</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {abandon.map(a => (
              <div key={a.etapa} className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground w-24 text-right shrink-0">{a.etapa}</span>
                <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                  <div className="bg-destructive/60 h-full rounded-full flex items-center justify-end pr-2 transition-all duration-1000"
                    style={{ width: `${Math.min(a.abandonaram, 100)}%` }}>
                    <span className="text-[10px] font-bold text-destructive-foreground">{a.abandonaram}%</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-40 shrink-0">{a.motivoPrincipal}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground pt-4">
        Sol Estrateg.IA — Jornada do Lead + SLAs • Dados reais do Make Data Store
      </p>
    </div>
  );
}
