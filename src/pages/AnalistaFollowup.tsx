import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, Line, Legend, PieChart, Pie, Cell,
} from "recharts";
import { useSolLeads, normalizePhone, type SolLead } from '@/hooks/useSolData';
import { useLead360 } from "@/contexts/Lead360Context";
import {
  Repeat, Users, DollarSign, Clock, Zap, TrendingUp, MessageSquare, Target, RefreshCcw,
} from "lucide-react";
import { PageFloatingFilter } from "@/components/filters/PageFloatingFilter";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";

const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 };

function deriveFupData(records: SolLead[]) {
  const fupRecords = records.filter(r => (r.fup_followup_count ?? 0) > 0 || false);
  const total = fupRecords.length;
  const reativados = fupRecords.filter(r => ((r as any)._status_resposta || '') === 'respondeu').length;
  const pctReativados = total > 0 ? Math.round((reativados / total) * 100) : 0;
  const qualificadosPosFup = fupRecords.filter(r => (r.status || '').toUpperCase() === 'QUALIFICADO').length;
  const ativos = fupRecords.filter(r => ((r as any)._status_resposta || '') === 'aguardando').length;

  // KPIs
  const kpis = [
    { label: "Leads em FUP ativo", value: String(ativos), icon: Users },
    { label: "Total entrou no FUP", value: String(total), icon: Target },
    { label: "Reativados", value: `${reativados} (${pctReativados}%)`, icon: Zap },
    { label: "Qualificados pós-FUP", value: String(qualificadosPosFup), icon: DollarSign },
    { label: "FUPs médios/lead", value: total > 0 ? (fupRecords.reduce((s, r) => s + (r.fup_followup_count || 0), 0) / total).toFixed(1) : "0", icon: Repeat },
    { label: "Custo da régua", value: "R$ 0", icon: TrendingUp },
  ];

  // Pipeline by FUP count (1-8)
  const pipeline = Array.from({ length: 8 }, (_, i) => {
    const fupNum = i + 1;
    const inFup = fupRecords.filter(r => (r.fup_followup_count || 0) >= fupNum);
    const responded = inFup.filter(r => ((r as any)._status_resposta || '') === 'respondeu').length;
    return {
      etapa: `FUP ${fupNum}`,
      dia: `D+${[1, 3, 5, 7, 10, 14, 21, 30][i]}`,
      gatilho: ['Urgência suave', 'Prova social', 'Escassez', 'Benefício direto', 'Dor', 'Última chance', 'Reativação longa', 'Encerramento'][i],
      disparos: inFup.length,
      respostas: responded,
      taxa: `${inFup.length > 0 ? ((responded / inFup.length) * 100).toFixed(1) : 0}%`,
      destaque: fupNum === 2 || fupNum === 4,
    };
  });

  // Resultado reativados
  const desqNovamente = fupRecords.filter(r => ((r as any)._status_resposta || '') === 'respondeu' && (r.status || '').toUpperCase() === 'DESQUALIFICADO').length;
  const qualPosFup = fupRecords.filter(r => ((r as any)._status_resposta || '') === 'respondeu' && (r.status || '').toUpperCase() === 'QUALIFICADO').length;
  const aindaQual = reativados - qualPosFup - desqNovamente;
  const resultadoReativados = [
    { label: "Qualificados → Closer", valor: qualPosFup, pct: reativados > 0 ? Math.round((qualPosFup / reativados) * 100) : 0, cor: "hsl(var(--success))" },
    { label: "Desqualificados novamente", valor: desqNovamente, pct: reativados > 0 ? Math.round((desqNovamente / reativados) * 100) : 0, cor: "hsl(var(--destructive))" },
    { label: "Ainda em qualificação", valor: Math.max(aindaQual, 0), pct: reativados > 0 ? Math.round((Math.max(aindaQual, 0) / reativados) * 100) : 0, cor: "hsl(var(--warning))" },
  ];

  // By canal
  const byCanal: Record<string, { entrouFUP: number; reativados: number }> = {};
  fupRecords.forEach(r => {
    const canal = r.canal_origem || 'Outros';
    if (!byCanal[canal]) byCanal[canal] = { entrouFUP: 0, reativados: 0 };
    byCanal[canal].entrouFUP++;
    if (((r as any)._status_resposta || '') === 'respondeu') byCanal[canal].reativados++;
  });
  const porCanal = Object.entries(byCanal)
    .map(([canal, d]) => ({ canal, ...d, taxa: `${d.entrouFUP > 0 ? Math.round((d.reativados / d.entrouFUP) * 100) : 0}%` }))
    .sort((a, b) => b.entrouFUP - a.entrouFUP)
    .slice(0, 5);

  // Perfil
  const reativadosRecs = fupRecords.filter(r => ((r as any)._status_resposta || '') === 'respondeu');
  const tempDistReativados = {
    temperatura: [
      { label: "Entrou FRIO", pct: reativadosRecs.length > 0 ? Math.round(reativadosRecs.filter(r => (r.temperatura || '').toUpperCase() === 'FRIO' || !r.temperatura).length / reativadosRecs.length * 100) : 0 },
      { label: "Entrou MORNO", pct: reativadosRecs.length > 0 ? Math.round(reativadosRecs.filter(r => (r.temperatura || '').toUpperCase() === 'MORNO').length / reativadosRecs.length * 100) : 0 },
    ],
    faixaConta: deriveFaixaConta(reativadosRecs),
    cidades: deriveCidades(reativadosRecs),
  };

  // Active leads
  const leadsAtivos = fupRecords
    .filter(r => ((r as any)._status_resposta || '') === 'aguardando')
    .sort((a, b) => (b.fup_followup_count || 0) - (a.fup_followup_count || 0))
    .slice(0, 8)
    .map(r => ({
      nome: r.nome || 'Lead',
      etapaAtual: `FUP ${r.fup_followup_count || 1}`,
      proximoFUP: r.ts_ultimo_fup || '—',
      diasEmFUP: r.ts_ultimo_fup ? `${Math.max(1, Math.round((Date.now() - new Date(r.ts_ultimo_fup).getTime()) / 86400000))} dias` : '—',
      canal: r.canal_origem || 'Direto',
      ultResposta: r.ts_ultima_interacao || '—',
    }));

  // Temporal evolution
  const byWeek: Record<string, { disparos: number; respostas: number }> = {};
  fupRecords.forEach(r => {
    const date = r.ts_cadastro || r.ts_ultimo_fup || '';
    if (!date) return;
    const d = new Date(date);
    if (isNaN(d.getTime())) return;
    const key = d.toISOString().slice(0, 10);
    if (!byWeek[key]) byWeek[key] = { disparos: 0, respostas: 0 };
    byWeek[key].disparos++;
    if (((r as any)._status_resposta || '') === 'respondeu') byWeek[key].respostas++;
  });
  let acum = 0;
  const evolucao = Object.entries(byWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([dia, d]) => {
      acum += d.respostas;
      return { dia: dia.slice(5), disparos: d.disparos, respostas: d.respostas, reativacaoAcum: acum };
    });

  return { kpis, pipeline, resultadoReativados, porCanal, tempDistReativados, leadsAtivos, evolucao };
}

function deriveFaixaConta(records: SolLead[]) {
  const ranges = [
    { label: "R$ 250-400", min: 250, max: 400 },
    { label: "R$ 400-700", min: 400, max: 700 },
    { label: "Acima R$ 700", min: 700, max: Infinity },
  ];
  const total = records.length || 1;
  return ranges.map(r => {
    const count = records.filter(rec => {
      const val = parseInt((rec.valor_conta || '').replace(/\D/g, '')) || 0;
      return val >= r.min && val < r.max;
    }).length;
    return { label: r.label, pct: Math.round((count / total) * 100) };
  });
}

function deriveCidades(records: SolLead[]) {
  const cidades: Record<string, number> = {};
  records.forEach(r => { const c = r.canal_origem || 'Outros'; cidades[c] = (cidades[c] || 0) + 1; });
  const total = records.length || 1;
  return Object.entries(cidades)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([label, count]) => ({ label, pct: Math.round((count / total) * 100) }));
}

export default function AnalistaFollowup() {
  const { data: solLeads, isLoading } = useSolLeads();
  
  const { openLead360 } = useLead360();
  const gf = useGlobalFilters();

  const canais = useMemo(() => [...new Set(solLeads.map(r => r.canal_origem).filter(Boolean) as string[])].sort(), [solLeads]);
  const records = useMemo(() => gf.filterRecords(solLeads), [solLeads, gf.filterRecords]);

  const d = useMemo(() => deriveFupData(records), [records]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div><h1 className="text-2xl font-bold text-foreground">Analista de Follow-up Frio</h1></div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="space-y-6 pb-10">
        <div><h1 className="text-2xl font-bold text-foreground">Analista de Follow-up Frio</h1></div>
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum dado disponível no Data Store.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Analista de Follow-up Frio</h1>
          <p className="text-sm text-muted-foreground mt-1">Régua de reativação · Dados reais do Data Store</p>
        </div>
        
      </div>

      <PageFloatingFilter
        filters={gf.filters} hasFilters={gf.hasFilters} clearFilters={gf.clearFilters}
        setPeriodo={gf.setPeriodo} setDateFrom={gf.setDateFrom} setDateTo={gf.setDateTo}
        setCanal={gf.setCanal} setTemperatura={gf.setTemperatura} setSearchTerm={gf.setSearchTerm} setEtapa={gf.setEtapa} setStatus={gf.setStatus}
        canais={canais}
        config={{ showPeriodo: true, showCanal: true, showTemperatura: true, showSearch: true, showEtapa: true, showStatus: true }}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {d.kpis.map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <kpi.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-lg font-bold font-mono">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Pipeline da Sequência FUP</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {d.pipeline.map(etapa => (
              <div key={etapa.etapa} className={`p-3 rounded-lg border transition-all ${etapa.destaque ? "border-success/50 bg-success/5" : "border-border/50 bg-muted/10"}`}>
                <div className="flex items-center justify-between mb-1">
                  <Badge variant={etapa.destaque ? "default" : "outline"} className="text-[10px] px-1.5">{etapa.dia}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2">{etapa.gatilho}</p>
                <div className="space-y-0.5 text-[10px] font-mono">
                  <div className="flex justify-between"><span className="text-muted-foreground">Disparos</span><span className="font-bold">{etapa.disparos}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Respostas</span><span className="font-bold">{etapa.respostas}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Taxa</span><span className={`font-bold ${etapa.destaque ? "text-success" : ""}`}>{etapa.taxa}</span></div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-muted">
                  <div className={`h-full rounded-full ${etapa.destaque ? "bg-success" : "bg-primary"}`} style={{ width: `${etapa.disparos > 0 ? (etapa.respostas / etapa.disparos) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resultado + Canal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Resultado dos Reativados</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={d.resultadoReativados} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="valor" nameKey="label">
                    {d.resultadoReativados.map((entry, i) => <Cell key={i} fill={entry.cor} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {d.resultadoReativados.map(item => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.cor }} />
                      <span className="text-muted-foreground">{item.label}</span>
                    </div>
                    <span className="font-mono font-bold">{item.valor} ({item.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Reativação por Canal de Origem</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {d.porCanal.map(canal => {
                const taxa = canal.entrouFUP > 0 ? (canal.reativados / canal.entrouFUP) * 100 : 0;
                return (
                  <div key={canal.canal}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{canal.canal}</span>
                      <div className="flex items-center gap-3 font-mono text-xs">
                        <span className="text-muted-foreground">{canal.entrouFUP} → {canal.reativados}</span>
                        <span className="font-bold">{canal.taxa}</span>
                      </div>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${taxa}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Perfil */}
      <div>
        <h2 className="text-lg font-bold mb-3">Perfil do Lead que Reativa</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-bold mb-3">🌡️ Temperatura na entrada</p>
              {d.tempDistReativados.temperatura.map(item => (
                <div key={item.label} className="flex items-center justify-between mb-2 last:mb-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-info" style={{ width: `${item.pct}%` }} /></div>
                    <span className="text-sm font-mono font-bold w-10 text-right">{item.pct}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-bold mb-3">💰 Faixa de conta de luz</p>
              {d.tempDistReativados.faixaConta.map(item => (
                <div key={item.label} className="flex items-center justify-between mb-2 last:mb-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-warning" style={{ width: `${item.pct}%` }} /></div>
                    <span className="text-sm font-mono font-bold w-10 text-right">{item.pct}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-bold mb-3">📍 Cidades que mais reativam</p>
              {d.tempDistReativados.cidades.map(item => (
                <div key={item.label} className="flex items-center justify-between mb-2 last:mb-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${item.pct}%` }} /></div>
                    <span className="text-sm font-mono font-bold w-10 text-right">{item.pct}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Leads Ativos */}
      {d.leadsAtivos.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Leads em FUP Agora</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead><TableHead>Etapa atual</TableHead><TableHead>Dias em FUP</TableHead>
                  <TableHead>Canal</TableHead><TableHead>Últ. resposta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.leadsAtivos.map((lead, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{lead.nome}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs font-mono">{lead.etapaAtual}</Badge></TableCell>
                    <TableCell className="text-sm font-mono">{lead.diasEmFUP}</TableCell>
                    <TableCell className="text-sm">{lead.canal}</TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">{lead.ultResposta}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Evolução Temporal */}
      {d.evolucao.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Evolução Temporal — Disparos vs Respostas</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={d.evolucao}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="count" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="acum" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Area yAxisId="count" type="monotone" dataKey="disparos" name="Disparos" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} />
                <Area yAxisId="count" type="monotone" dataKey="respostas" name="Respostas" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.15} />
                <Line yAxisId="acum" type="monotone" dataKey="reativacaoAcum" name="Reativação acum." stroke="hsl(var(--warning))" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
