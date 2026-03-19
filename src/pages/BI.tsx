import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Loader2, Radio, TrendingUp, DollarSign, Target, Zap,
  MessageCircle, Clock, BarChart3, Thermometer, Users, Snowflake,
  ArrowUpRight, ArrowDownRight, Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateFilter, DateRange, DateFilterPreset } from "@/components/dashboard/DateFilter";
import { useBIMakeData } from "@/hooks/useBIMakeData";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area,
} from "recharts";

function fmt(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
  return `R$ ${v.toFixed(0)}`;
}

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  fontSize: 12,
};

const DONUT_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
];

export default function BI() {
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [datePreset, setDatePreset] = useState<DateFilterPreset>("all");
  const { data, hasData, isLoading } = useBIMakeData(dateRange);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Derive radar data for channel comparison
  const radarData = useMemo(() => {
    if (!data?.origens) return [];
    return data.origens.slice(0, 5).map(o => ({
      canal: o.canal,
      leads: o.leads,
      qualificados: o.qualificados,
      taxa: o.taxa,
    }));
  }, [data]);

  return (
    <div className="max-w-[1400px] mx-auto px-3 md:px-4 py-4 space-y-5">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Business Intelligence
          </h1>
          <p className="text-xs text-muted-foreground">
            Análise estratégica completa • {format(now, "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateFilter
            dateRange={dateRange}
            preset={datePreset}
            onDateRangeChange={(range, preset) => { setDateRange(range); setDatePreset(preset); }}
          />
          {hasData && (
            <Badge variant="outline" className="border-primary/50 text-primary text-xs gap-1">
              <Radio className="h-3 w-3 animate-pulse" />
              {data?.totalRecords} registros
            </Badge>
          )}
        </div>
      </div>

      {/* LOADING */}
      {isLoading && !hasData && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && !hasData && (
        <div className="text-center py-20 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Nenhum dado encontrado</p>
        </div>
      )}

      {data && (
        <>
          {/* ═══ KPIs HERO ═══ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Receita Gerada', value: fmt(data.financeiro.receitaGerada), icon: DollarSign, color: 'text-primary', bg: 'from-primary/10 to-primary/5', border: 'border-primary/20' },
              { label: 'ROI', value: `${data.financeiro.roi.toFixed(1)}×`, icon: TrendingUp, color: 'text-chart-2', bg: 'from-chart-2/10 to-chart-2/5', border: 'border-chart-2/20' },
              { label: 'Ticket Médio', value: fmt(data.financeiro.ticketMedio), icon: Target, color: 'text-chart-3', bg: 'from-chart-3/10 to-chart-3/5', border: 'border-chart-3/20' },
              { label: 'Economia Mensal', value: fmt(Math.max(0, data.financeiro.economiaMensal)), icon: Zap, color: 'text-warning', bg: 'from-warning/10 to-warning/5', border: 'border-warning/20' },
            ].map(kpi => (
              <Card key={kpi.label} className={cn("bg-gradient-to-br", kpi.bg, kpi.border)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", kpi.bg.replace('from-', 'bg-').split(' ')[0].replace('/10', '/20'))}>
                      <kpi.icon className={cn("h-5 w-5", kpi.color)} />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                      <p className={cn("text-2xl font-extrabold tabular-nums", kpi.color)}>{kpi.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ═══ ROW 2: Funil + Financeiro ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Funil Comercial */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Funil Comercial
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {['PRÉ-VENDA', 'QUALIFICAÇÃO', 'COMERCIAL', 'CONTRATO'].map(fase => {
                  const stages = data.funil.filter(f => f.fase === fase);
                  if (stages.length === 0) return null;
                  return (
                    <div key={fase} className="mb-3 last:mb-0">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">{fase}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {stages.map((s, i) => {
                          const bgClass = s.cor === 'success' ? 'border-primary/30 bg-primary/5' : s.cor === 'warning' ? 'border-warning/30 bg-warning/5' : s.cor === 'danger' ? 'border-destructive/30 bg-destructive/5' : 'border-border/50';
                          return (
                            <div key={s.etapa} className="flex items-center gap-1">
                              <div className={cn("rounded-lg border p-2.5 text-center min-w-[90px] transition-colors hover:shadow-sm", bgClass)}>
                                <span className="text-sm">{s.icon}</span>
                                <p className="text-xl font-extrabold tabular-nums text-foreground">{s.valor}</p>
                                <p className="text-[8px] text-muted-foreground uppercase tracking-wider leading-tight">{s.etapa}</p>
                                {s.pctAnterior < 100 && (
                                  <p className={cn("text-[10px] font-bold",
                                    s.pctAnterior >= 50 ? 'text-primary' : s.pctAnterior >= 30 ? 'text-warning' : 'text-destructive'
                                  )}>
                                    {s.pctAnterior >= 50 ? <ArrowUpRight className="h-3 w-3 inline" /> : <ArrowDownRight className="h-3 w-3 inline" />}
                                    {s.pctAnterior}%
                                  </p>
                                )}
                              </div>
                              {i < stages.length - 1 && <span className="text-muted-foreground/40 text-xs">→</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* SOL vs SDR Humano */}
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  SOL vs SDR Humano
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Custo/Lead SOL', value: fmt(data.financeiro.custoLeadQualificado), color: 'text-primary' },
                    { label: 'Custo SDR Humano', value: `R$ ${data.financeiro.custoSDRHumano}`, color: 'text-destructive' },
                    { label: 'Custo Mensal Robô', value: fmt(data.financeiro.custoRobo), color: 'text-muted-foreground' },
                    { label: 'Custo/Venda', value: fmt(data.financeiro.custoVendaFechada), color: 'text-warning' },
                  ].map(k => (
                    <div key={k.label} className="text-center p-2 rounded-lg border border-border/30 bg-secondary/20">
                      <p className={cn("text-lg font-extrabold tabular-nums", k.color)}>{k.value}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{k.label}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Economia mensal estimada</p>
                  <p className="text-2xl font-extrabold text-primary tabular-nums">{fmt(Math.max(0, data.financeiro.economiaMensal))}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ═══ ROW 3: Origens + Radar ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Origens - Bar Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Origem dos Leads
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ResponsiveContainer width="100%" height={Math.max(200, data.origens.length * 40)}>
                  <BarChart data={data.origens} layout="vertical" barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis dataKey="canal" type="category" width={100} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="leads" name="Leads" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="qualificados" name="Qualificados" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Radar de canais */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-chart-3" />
                  Radar de Canais
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="canal" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <PolarRadiusAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      <Radar name="Leads" dataKey="leads" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.2} />
                      <Radar name="Qualificados" dataKey="qualificados" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                      <Tooltip contentStyle={tooltipStyle} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-12">Sem dados suficientes</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ═══ ROW 4: FUP Frio + Volume SLA ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* FUP Frio */}
            <Card className="border-chart-4/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Snowflake className="h-4 w-4 text-chart-4" />
                  FUP Frio — Reativação
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Leads FUP', value: data.fupFrio.totalFup, color: 'text-foreground' },
                    { label: 'Reativados', value: data.fupFrio.reativados, color: 'text-primary' },
                    { label: 'Taxa', value: `${data.fupFrio.taxaReativacao}%`, color: 'text-chart-3' },
                  ].map(k => (
                    <div key={k.label} className="text-center p-2 rounded-lg border border-border/30">
                      <p className={cn("text-xl font-extrabold tabular-nums", k.color)}>{k.value}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{k.label}</p>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={data.fupFrio.etapasResposta}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="etapa" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                    <Bar dataKey="pctResposta" name="Resposta %" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-center rounded-lg bg-primary/10 border border-primary/20 p-2">
                  <p className="text-[9px] text-muted-foreground">Receita via FUP</p>
                  <p className="text-xl font-extrabold text-primary tabular-nums">{fmt(data.fupFrio.receitaFup)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Volume & SLA */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  Volume & SLA
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Enviadas', value: data.volumeSLA.totalEnviadas.toLocaleString() },
                    { label: 'Recebidas', value: data.volumeSLA.totalRecebidas.toLocaleString() },
                    { label: 'Interações/Conv', value: data.volumeSLA.mediaInteracoes },
                  ].map(k => (
                    <div key={k.label} className="text-center p-2 rounded-lg border border-border/30">
                      <p className="text-lg font-extrabold tabular-nums text-foreground">{k.value}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{k.label}</p>
                    </div>
                  ))}
                </div>

                {/* SLA Gauge */}
                <div className="flex items-center justify-center gap-6 py-2">
                  <div className="relative w-32 h-16">
                    <svg viewBox="0 0 160 80" className="w-full h-full">
                      <path d="M 10 75 A 70 70 0 0 1 150 75" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" strokeLinecap="round" />
                      <path
                        d="M 10 75 A 70 70 0 0 1 150 75"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${(data.volumeSLA.slaMenos5min / 100) * 220} 220`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-end justify-center pb-0">
                      <p className="text-xl font-extrabold text-primary tabular-nums">{data.volumeSLA.slaMenos5min}%</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between gap-4 text-xs">
                      <span className="text-muted-foreground">1º Contato</span>
                      <span className="font-bold text-primary">{data.volumeSLA.tempoMedioPrimeiroContato}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-xs">
                      <span className="text-muted-foreground">Resp. Lead</span>
                      <span className="font-bold text-warning">{data.volumeSLA.tempoMedioRespostaLead}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ═══ ROW 5: Desqualificação + Temperatura ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Desqualificação */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-destructive" />
                  Motivos de Desqualificação
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {data.motivos.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="h-[180px] w-[180px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={data.motivos} dataKey="pct" nameKey="motivo" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
                            {data.motivos.map((m, i) => (
                              <Cell key={i} fill={m.fill} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 flex-1">
                      {data.motivos.map((m, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.fill }} />
                          <span className="text-xs text-foreground flex-1 truncate">{m.motivo}</span>
                          <span className="text-xs font-bold tabular-nums text-foreground">{m.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-8">Sem dados</p>
                )}
              </CardContent>
            </Card>

            {/* Temperatura */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-warning" />
                  Temperatura dos Leads
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-[160px] w-[160px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.temperatura.filter(t => t.leads > 0)}
                          dataKey="leads"
                          nameKey="temperatura"
                          cx="50%" cy="50%"
                          outerRadius={70} innerRadius={40}
                        >
                          {data.temperatura.filter(t => t.leads > 0).map((t, i) => (
                            <Cell key={i} fill={
                              t.temperatura === 'QUENTE' ? 'hsl(var(--destructive))' :
                              t.temperatura === 'MORNO' ? 'hsl(var(--warning))' :
                              'hsl(var(--chart-4))'
                            } />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3 flex-1">
                    {data.temperatura.map(t => (
                      <div key={t.temperatura} className="flex items-center gap-2">
                        <span className="text-lg">{t.icon}</span>
                        <div className="flex-1">
                          <p className="text-[10px] text-muted-foreground">{t.temperatura}</p>
                          <p className={cn("text-xl font-extrabold tabular-nums", t.cor)}>{t.leads}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top quentes */}
                {data.leadsRecentes.filter(l => l.temperatura === 'QUENTE').length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5">🔥 Top Leads Quentes</p>
                    <div className="space-y-1">
                      {data.leadsRecentes.filter(l => l.temperatura === 'QUENTE').slice(0, 4).map((l, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-foreground font-medium truncate">{l.nome}</span>
                          <Badge variant="outline" className="border-destructive/30 text-destructive text-[9px] shrink-0 ml-2">
                            Score {l.score}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ═══ ROW 6: Melhor Horário ═══ */}
          {data.horarios.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" />
                  Melhor Horário para Conversão
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data.horarios.slice(0, 15)}>
                    <defs>
                      <linearGradient id="colorConversoes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="hora"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(_, i) => {
                        const item = data.horarios[i];
                        return item ? `${item.dia} ${item.hora}` : '';
                      }}
                    />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelFormatter={(_, payload) => {
                        const item = payload?.[0]?.payload;
                        return item ? `${item.dia} ${item.hora}` : '';
                      }}
                    />
                    <Area type="monotone" dataKey="conversoes" name="Conversões" stroke="hsl(var(--warning))" fill="url(#colorConversoes)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* ═══ ROW 7: Leads Recentes ═══ */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Leads Qualificados Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {data.leadsRecentes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-2 px-2 text-muted-foreground text-xs">Nome</th>
                        <th className="text-left py-2 px-2 text-muted-foreground text-xs">Canal</th>
                        <th className="text-right py-2 px-2 text-muted-foreground text-xs">Score</th>
                        <th className="text-center py-2 px-2 text-muted-foreground text-xs">Temp.</th>
                        <th className="text-left py-2 px-2 text-muted-foreground text-xs">Etapa</th>
                        <th className="text-right py-2 px-2 text-muted-foreground text-xs">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.leadsRecentes.map((l, i) => (
                        <tr key={i} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                          <td className="py-2 px-2 font-medium text-foreground">{l.nome}</td>
                          <td className="py-2 px-2 text-muted-foreground">{l.canal}</td>
                          <td className="text-right py-2 px-2 tabular-nums font-bold">{l.score || '—'}</td>
                          <td className="text-center py-2 px-2">
                            <span className={cn("text-xs font-bold",
                              l.temperatura === 'QUENTE' ? 'text-destructive' :
                              l.temperatura === 'MORNO' ? 'text-warning' : 'text-chart-4'
                            )}>
                              {l.temperatura === 'QUENTE' ? '🔥' : l.temperatura === 'MORNO' ? '🌡' : '❄️'} {l.temperatura}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-muted-foreground text-xs">{l.etapa}</td>
                          <td className="text-right py-2 px-2 tabular-nums text-muted-foreground text-xs">
                            {l.data ? format(new Date(l.data), "dd/MM/yy HH:mm", { locale: ptBR }) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">Sem leads qualificados recentes</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Footer */}
      <div className="text-center py-3 border-t border-border/30">
        <p className="text-[10px] text-muted-foreground/50">
          Sol Estrateg.IA — Business Intelligence • {format(now, "dd/MM/yyyy HH:mm", { locale: ptBR })}
        </p>
      </div>
    </div>
  );
}
