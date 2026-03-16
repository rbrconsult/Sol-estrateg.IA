import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Loader2, Radio, TrendingUp, DollarSign, Target, Zap,
  MessageCircle, Clock, BarChart3, Thermometer, Users, Snowflake,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateFilter, DateRange, DateFilterPreset } from "@/components/dashboard/DateFilter";
import { useBIMakeData, FunnelStage } from "@/hooks/useBIMakeData";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
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

export default function BI() {
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [datePreset, setDatePreset] = useState<DateFilterPreset>("all");
  const { data, hasData, isLoading } = useBIMakeData(dateRange);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-3 md:px-4 py-4 space-y-6">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
            Inteligência Comercial — Sol SDR
          </h1>
          <p className="text-xs text-muted-foreground">
            Dados reais do Make Data Store • {format(now, "dd/MM/yyyy HH:mm", { locale: ptBR })}
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

      {/* ─── LOADING ─── */}
      {isLoading && !hasData && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && !hasData && (
        <div className="text-center py-20 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Nenhum dado encontrado no Data Store</p>
          <p className="text-xs mt-1">Verifique a integração com o Make.com</p>
        </div>
      )}

      {data && (
        <>
          {/* ═══ FUNIL COMERCIAL ═══ */}
          <section>
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Funil Comercial Completo
            </h2>
            <div className="space-y-1">
              {['PRÉ-VENDA', 'QUALIFICAÇÃO', 'COMERCIAL', 'CONTRATO'].map(fase => {
                const stages = data.funil.filter(f => f.fase === fase);
                return (
                  <div key={fase}>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-1 mt-3">
                      {fase}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {stages.map((s, i) => {
                        const bgClass = s.cor === 'success' ? 'border-primary/40' : s.cor === 'warning' ? 'border-warning/40' : s.cor === 'danger' ? 'border-destructive/40' : 'border-border/50';
                        return (
                          <div key={s.etapa} className="flex items-center gap-1">
                            <div className={cn(
                              "rounded-lg border p-3 text-center min-w-[120px] hover:bg-muted/30 transition-colors",
                              bgClass
                            )}>
                              <span className="text-lg">{s.icon}</span>
                              <p className="text-2xl font-extrabold tabular-nums text-foreground mt-0.5">{s.valor}</p>
                              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.etapa}</p>
                              {s.pctAnterior < 100 && (
                                <p className={cn("text-[10px] font-bold mt-0.5",
                                  s.cor === 'success' ? 'text-primary' : s.cor === 'warning' ? 'text-warning' : 'text-destructive'
                                )}>
                                  {s.pctAnterior}%
                                </p>
                              )}
                            </div>
                            {i < stages.length - 1 && (
                              <span className="text-muted-foreground text-xs">→</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ═══ FINANCEIRO E ROI ═══ */}
          <section>
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Financeiro e ROI
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Receita Gerada', value: fmt(data.financeiro.receitaGerada), cor: 'text-primary' },
                { label: 'Ticket Médio', value: fmt(data.financeiro.ticketMedio), cor: 'text-warning' },
                { label: 'Custo Mensal Robô', value: fmt(data.financeiro.custoRobo), cor: 'text-muted-foreground' },
                { label: 'Custo/Lead Qualif.', value: fmt(data.financeiro.custoLeadQualificado), cor: 'text-info' },
                { label: 'Custo/Venda', value: fmt(data.financeiro.custoVendaFechada), cor: 'text-info' },
                { label: 'ROI', value: `${data.financeiro.roi.toFixed(1)}×`, cor: 'text-primary' },
              ].map(kpi => (
                <Card key={kpi.label} className="border-border/50">
                  <CardContent className="p-3 text-center">
                    <p className={cn("text-2xl font-extrabold tabular-nums", kpi.cor)}>{kpi.value}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">{kpi.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Comparação SOL vs SDR Humano */}
            <Card className="border-primary/30 mt-3">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Custo/Lead SOL</p>
                    <p className="text-xl font-extrabold text-primary tabular-nums">{fmt(data.financeiro.custoLeadQualificado)}</p>
                  </div>
                  <span className="text-muted-foreground font-bold">vs</span>
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">SDR Humano</p>
                    <p className="text-xl font-extrabold text-destructive tabular-nums">R$ {data.financeiro.custoSDRHumano}</p>
                  </div>
                  <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-2">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Economia mensal</p>
                    <p className="text-xl font-extrabold text-primary tabular-nums">{fmt(Math.max(0, data.financeiro.economiaMensal))}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ═══ ORIGEM DOS LEADS ═══ */}
          <section>
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Origem dos Leads
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Bar chart */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <ResponsiveContainer width="100%" height={Math.max(200, data.origens.length * 50)}>
                    <BarChart data={data.origens} layout="vertical" barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis dataKey="canal" type="category" width={120} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="leads" name="Leads" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="qualificados" name="Qualificados" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Table */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-1.5 px-2 text-muted-foreground text-xs">Canal</th>
                          <th className="text-right py-1.5 px-2 text-muted-foreground text-xs">Leads</th>
                          <th className="text-right py-1.5 px-2 text-muted-foreground text-xs">Qualificados</th>
                          <th className="text-right py-1.5 px-2 text-muted-foreground text-xs">Taxa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.origens.map((o, i) => (
                          <tr key={i} className="border-b border-border/30 hover:bg-muted/30">
                            <td className="py-1.5 px-2 font-medium text-foreground">{o.canal}</td>
                            <td className="text-right py-1.5 px-2 tabular-nums font-semibold">{o.leads}</td>
                            <td className="text-right py-1.5 px-2 tabular-nums text-primary">{o.qualificados}</td>
                            <td className="text-right py-1.5 px-2 tabular-nums">{o.taxa}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ═══ FUP FRIO E REATIVAÇÃO ═══ */}
          <section>
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Snowflake className="h-4 w-4 text-info" />
              FUP Frio e Reativação
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Leads FUP', value: data.fupFrio.totalFup },
                { label: 'Reativados', value: data.fupFrio.reativados, cor: 'text-primary' },
                { label: 'Taxa Reativação', value: `${data.fupFrio.taxaReativacao}%`, cor: 'text-primary' },
                { label: 'Tempo Médio', value: `${data.fupFrio.tempoMedioReativacao}d`, cor: 'text-info' },
                { label: 'Follow-ups Médios', value: data.fupFrio.followupsMedios },
              ].map(kpi => (
                <Card key={kpi.label} className="border-border/50">
                  <CardContent className="p-3 text-center">
                    <p className={cn("text-xl font-extrabold tabular-nums", kpi.cor || 'text-foreground')}>{kpi.value}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{kpi.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* FUP pipeline + receita */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pipeline FUP — % Resposta por Etapa</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.fupFrio.etapasResposta}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="etapa" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                      <Bar dataKey="pctResposta" name="Resposta %" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-primary/30">
                <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-2">Receita Gerada por FUP Frio</p>
                  <p className="text-4xl font-extrabold text-primary tabular-nums">{fmt(data.fupFrio.receitaFup)}</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ═══ VOLUME E SLA ═══ */}
          <section>
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              Volume e SLA
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Mensagens Enviadas', value: data.volumeSLA.totalEnviadas.toLocaleString() },
                { label: 'Mensagens Recebidas', value: data.volumeSLA.totalRecebidas.toLocaleString() },
                { label: 'Interações/Conversa', value: data.volumeSLA.mediaInteracoes },
                { label: '1º Contato', value: data.volumeSLA.tempoMedioPrimeiroContato, cor: 'text-primary' },
                { label: 'SLA ≤ 5min', value: `${data.volumeSLA.slaMenos5min}%`, cor: 'text-primary' },
                { label: 'Resp. do Lead', value: data.volumeSLA.tempoMedioRespostaLead, cor: 'text-warning' },
              ].map(kpi => (
                <Card key={kpi.label} className="border-border/50">
                  <CardContent className="p-3 text-center">
                    <p className={cn("text-lg font-extrabold tabular-nums", kpi.cor || 'text-foreground')}>{kpi.value}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{kpi.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* SLA Gauge */}
            <Card className="border-border/50 mt-3">
              <CardContent className="p-4 flex items-center justify-center">
                <div className="relative w-40 h-20">
                  <svg viewBox="0 0 160 80" className="w-full h-full">
                    <path d="M 10 75 A 70 70 0 0 1 150 75" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" strokeLinecap="round" />
                    <path
                      d="M 10 75 A 70 70 0 0 1 150 75"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${(data.volumeSLA.slaMenos5min / 100) * 220} 220`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-end justify-center pb-0">
                    <p className="text-2xl font-extrabold text-primary tabular-nums">{data.volumeSLA.slaMenos5min}%</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground ml-4">SLA ≤ 5 minutos</p>
              </CardContent>
            </Card>
          </section>

          {/* ═══ MELHOR HORÁRIO ═══ */}
          {data.horarios.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                Melhor Horário para Conversão
              </h2>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.horarios.slice(0, 15)}>
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
                      <Bar dataKey="conversoes" name="Conversões" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ═══ MOTIVOS DE DESQUALIFICAÇÃO ═══ */}
            <section>
              <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-destructive" />
                Motivos de Desqualificação
              </h2>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  {data.motivos.length > 0 ? (
                    <div className="flex items-center gap-4">
                      <div className="h-[200px] w-[200px] shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={data.motivos} dataKey="pct" nameKey="motivo" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
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
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: m.fill }} />
                            <span className="text-xs text-foreground flex-1">{m.motivo}</span>
                            <span className="text-xs font-bold tabular-nums text-foreground">{m.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-8">Sem dados de desqualificação</p>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* ═══ TEMPERATURA ═══ */}
            <section>
              <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-warning" />
                Temperatura dos Leads Qualificados
              </h2>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-6">
                    {/* Donut */}
                    <div className="h-[180px] w-[180px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.temperatura.filter(t => t.leads > 0)}
                            dataKey="leads"
                            nameKey="temperatura"
                            cx="50%"
                            cy="50%"
                            outerRadius={75}
                            innerRadius={45}
                          >
                            {data.temperatura.filter(t => t.leads > 0).map((t, i) => (
                              <Cell
                                key={i}
                                fill={
                                  t.temperatura === 'QUENTE' ? 'hsl(var(--destructive))' :
                                  t.temperatura === 'MORNO' ? 'hsl(var(--warning))' :
                                  'hsl(var(--info))'
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-3 flex-1">
                      {data.temperatura.map(t => (
                        <div key={t.temperatura} className="flex items-center gap-3">
                          <span className="text-lg">{t.icon}</span>
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">{t.temperatura}</p>
                            <p className={cn("text-2xl font-extrabold tabular-nums", t.cor)}>{t.leads}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top 5 leads mais quentes */}
                  {data.leadsRecentes.filter(l => l.temperatura === 'QUENTE').length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border/50">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-2">🔥 Top Leads Quentes</p>
                      <div className="space-y-1">
                        {data.leadsRecentes
                          .filter(l => l.temperatura === 'QUENTE')
                          .slice(0, 5)
                          .map((l, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-foreground font-medium">{l.nome}</span>
                              <Badge variant="outline" className="border-destructive/30 text-destructive text-[10px]">
                                Score {l.score}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>

          {/* ═══ LEADS RECENTES ═══ */}
          <section>
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Leads Qualificados Recentes
            </h2>
            <Card className="border-border/50">
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
                          <tr key={i} className="border-b border-border/30 hover:bg-muted/30">
                            <td className="py-2 px-2 font-medium text-foreground">{l.nome}</td>
                            <td className="py-2 px-2 text-muted-foreground">{l.canal}</td>
                            <td className="text-right py-2 px-2 tabular-nums font-bold">{l.score || '—'}</td>
                            <td className="text-center py-2 px-2">
                              <span className={cn("text-xs font-bold",
                                l.temperatura === 'QUENTE' ? 'text-destructive' :
                                l.temperatura === 'MORNO' ? 'text-warning' : 'text-info'
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
          </section>
        </>
      )}

      {/* ─── Footer ─── */}
      <div className="text-center py-4 border-t border-border/50">
        <p className="text-[10px] text-muted-foreground">
          Sol Estrateg.IA — Inteligência Comercial • {format(now, "dd/MM/yyyy HH:mm", { locale: ptBR })}
        </p>
      </div>
    </div>
  );
}
