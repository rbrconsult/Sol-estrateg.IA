import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Loader2, Radio, TrendingUp, DollarSign, Target, Zap,
  MessageCircle, Clock, BarChart3, Thermometer, Users, Snowflake,
  ArrowUpRight, ArrowDownRight, Activity, Briefcase,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateFilter, DateRange, DateFilterPreset } from "@/components/dashboard/DateFilter";
import { useBIMakeData } from "@/hooks/useBIMakeData";
import { formatCurrencyAbbrev } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  fontSize: 12,
};

export default function BI() {
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [datePreset, setDatePreset] = useState<DateFilterPreset>("all");
  const { data, hasData, isLoading } = useBIMakeData(dateRange);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-5 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Business Intelligence
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visão estratégica consolidada • {format(now, "dd MMM yyyy, HH:mm", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateFilter
            dateRange={dateRange}
            preset={datePreset}
            onDateRangeChange={(range, preset) => { setDateRange(range); setDatePreset(preset); }}
          />
          {hasData && (
            <Badge variant="outline" className="border-primary/30 text-primary text-[10px] gap-1">
              <Radio className="h-2.5 w-2.5 animate-pulse" />
              {data?.totalRecords} registros
            </Badge>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && !hasData && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && !hasData && (
        <div className="text-center py-24 text-muted-foreground">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum dado encontrado</p>
        </div>
      )}

      {data && (
        <>
          {/* ═══ KPIs ═══ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Receita Fechada', value: formatCurrencyAbbrev(data.financeiro.receitaFechada), icon: DollarSign, sub: `${data.financeiro.negociosGanhos} negócios ganhos` },
              { label: 'Pipeline Aberto', value: formatCurrencyAbbrev(data.financeiro.valorPipeline), icon: Briefcase, sub: `${data.financeiro.negociosAbertos} em aberto` },
              { label: 'Ticket Médio', value: formatCurrencyAbbrev(data.financeiro.ticketMedio), icon: Target, sub: 'Por proposta ganha' },
              { label: 'Conversão', value: `${data.financeiro.taxaConversao.toFixed(1)}%`, icon: TrendingUp, sub: `${data.financeiro.totalPropostas} propostas` },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.label} className="opacity-0 animate-fade-up" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground tabular-nums">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ═══ Funil horizontal ═══ */}
          <Card className="opacity-0 animate-fade-up" style={{ animationDelay: '280ms', animationFillMode: 'forwards' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Funil de Conversão
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
                {data.funil.map((s, i) => {
                  const bgClass = s.cor === 'success' ? 'border-primary/30 bg-primary/5' : s.cor === 'warning' ? 'border-warning/30 bg-warning/5' : s.cor === 'danger' ? 'border-destructive/30 bg-destructive/5' : 'border-border/40 bg-muted/20';
                  return (
                    <div key={s.etapa} className="flex items-center gap-1 flex-1 min-w-0">
                      <div className={cn("rounded-lg border p-3 text-center flex-1 transition-colors", bgClass)}>
                        <span className="text-lg">{s.icon}</span>
                        <p className="text-2xl font-bold tabular-nums text-foreground mt-1">{s.valor}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5 leading-tight truncate">{s.etapa}</p>
                        {i > 0 && s.pctAnterior < 100 && (
                          <p className={cn("text-[10px] font-bold mt-1",
                            s.pctAnterior >= 50 ? 'text-primary' : s.pctAnterior >= 30 ? 'text-warning' : 'text-destructive'
                          )}>
                            {s.pctAnterior >= 50 ? <ArrowUpRight className="h-3 w-3 inline" /> : <ArrowDownRight className="h-3 w-3 inline" />}
                            {s.pctAnterior}%
                          </p>
                        )}
                      </div>
                      {i < data.funil.length - 1 && <span className="text-muted-foreground/30 text-xs shrink-0">→</span>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ═══ Origens + Temperatura ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 opacity-0 animate-fade-up" style={{ animationDelay: '340ms', animationFillMode: 'forwards' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Leads por Cidade
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ResponsiveContainer width="100%" height={Math.max(200, Math.min(data.origens.length * 36, 380))}>
                  <BarChart data={data.origens} layout="vertical" barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="canal" type="category" width={110} tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="leads" name="Leads" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} barSize={14} />
                    <Bar dataKey="qualificados" name="Qualificados" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="opacity-0 animate-fade-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-warning" />
                  Temperatura
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
                  <div className="space-y-4 flex-1">
                    {data.temperatura.map(t => (
                      <div key={t.temperatura} className="flex items-center gap-2">
                        <span className="text-lg">{t.icon}</span>
                        <div className="flex-1">
                          <p className="text-[10px] text-muted-foreground uppercase">{t.temperatura}</p>
                          <p className={cn("text-xl font-bold tabular-nums", t.cor)}>{t.leads}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top quentes */}
                {data.leadsRecentes.filter(l => l.temperatura === 'QUENTE').length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border/30">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-2">🔥 Top Leads Quentes</p>
                    <div className="space-y-1.5">
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

          {/* ═══ FUP Frio + Volume SLA ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="opacity-0 animate-fade-up" style={{ animationDelay: '460ms', animationFillMode: 'forwards' }}>
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
                    <div key={k.label} className="text-center p-2.5 rounded-lg border border-border/40 bg-secondary/20">
                      <p className={cn("text-xl font-bold tabular-nums", k.color)}>{k.value}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{k.label}</p>
                    </div>
                  ))}
                </div>
                {data.fupFrio.etapasResposta.length > 0 && (
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={data.fupFrio.etapasResposta}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="etapa" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                      <Bar dataKey="pctResposta" name="Resposta %" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="opacity-0 animate-fade-up" style={{ animationDelay: '520ms', animationFillMode: 'forwards' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  Volume & SLA
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Enviadas', value: data.volumeSLA.totalEnviadas.toLocaleString() },
                    { label: 'Recebidas', value: data.volumeSLA.totalRecebidas.toLocaleString() },
                    { label: 'Interações/Conv', value: data.volumeSLA.mediaInteracoes },
                  ].map(k => (
                    <div key={k.label} className="text-center p-2.5 rounded-lg border border-border/40 bg-secondary/20">
                      <p className="text-lg font-bold tabular-nums text-foreground">{k.value}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{k.label}</p>
                    </div>
                  ))}
                </div>

                {/* SLA Gauge */}
                <div className="flex items-center justify-center gap-6 py-2">
                  <div className="relative w-28 h-14">
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
                      <p className="text-lg font-bold text-primary tabular-nums">{data.volumeSLA.slaMenos5min}%</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">1º Contato</span>
                      <span className="font-bold text-primary">{data.volumeSLA.tempoMedioPrimeiroContato}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Resp. Lead</span>
                      <span className="font-bold text-warning">{data.volumeSLA.tempoMedioRespostaLead}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground">SLA &lt; 5min</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ═══ Desqualificação + Melhor Horário ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="opacity-0 animate-fade-up" style={{ animationDelay: '580ms', animationFillMode: 'forwards' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-destructive" />
                  Motivos de Desqualificação
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {data.motivos.length > 0 ? (
                  <div className="flex items-center gap-5">
                    <div className="h-[160px] w-[160px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={data.motivos} dataKey="pct" nameKey="motivo" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                            {data.motivos.map((m, i) => (
                              <Cell key={i} fill={m.fill} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2.5 flex-1">
                      {data.motivos.map((m, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.fill }} />
                          <span className="text-xs text-foreground flex-1 truncate">{m.motivo}</span>
                          <span className="text-xs font-bold tabular-nums text-muted-foreground">{m.count}</span>
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

            {data.horarios.length > 0 && (
              <Card className="opacity-0 animate-fade-up" style={{ animationDelay: '640ms', animationFillMode: 'forwards' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-warning" />
                    Melhor Horário para Conversão
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={data.horarios.slice(0, 12)}>
                      <defs>
                        <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="hora"
                        tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false} tickLine={false}
                        tickFormatter={(_, i) => {
                          const item = data.horarios[i];
                          return item ? `${item.dia} ${item.hora}` : '';
                        }}
                      />
                      <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        labelFormatter={(_, payload) => {
                          const item = payload?.[0]?.payload;
                          return item ? `${item.dia} ${item.hora}` : '';
                        }}
                      />
                      <Area type="monotone" dataKey="conversoes" name="Conversões" stroke="hsl(var(--warning))" fill="url(#colorConv)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ═══ Leads Recentes ═══ */}
          <Card className="opacity-0 animate-fade-up" style={{ animationDelay: '700ms', animationFillMode: 'forwards' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Leads Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {data.leadsRecentes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-2 px-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Nome</th>
                        <th className="text-left py-2 px-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Cidade</th>
                        <th className="text-left py-2 px-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Valor Conta</th>
                        <th className="text-center py-2 px-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Temp.</th>
                        <th className="text-left py-2 px-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Status</th>
                        <th className="text-right py-2 px-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.leadsRecentes.map((l, i) => (
                        <tr key={i} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                          <td className="py-2 px-2 font-medium text-foreground">{l.nome}</td>
                          <td className="py-2 px-2 text-muted-foreground">{l.cidade}</td>
                          <td className="py-2 px-2 text-muted-foreground text-xs">{l.valorConta}</td>
                          <td className="text-center py-2 px-2">
                            <span className={cn("text-xs font-bold",
                              l.temperatura === 'QUENTE' ? 'text-destructive' :
                              l.temperatura === 'MORNO' ? 'text-warning' : 'text-chart-4'
                            )}>
                              {l.temperatura === 'QUENTE' ? '🔥' : l.temperatura === 'MORNO' ? '🌡' : '❄️'}
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            <Badge variant="outline" className="text-[9px] font-medium">
                              {l.etapa}
                            </Badge>
                          </td>
                          <td className="text-right py-2 px-2 tabular-nums text-muted-foreground text-xs">
                            {l.data ? format(new Date(l.data), "dd/MM HH:mm", { locale: ptBR }) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">Sem leads recentes</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <div className="text-center py-2">
        <p className="text-[9px] text-muted-foreground/40">
          BI • {format(now, "dd/MM/yyyy HH:mm", { locale: ptBR })}
        </p>
      </div>
    </div>
  );
}
