import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Bot, MessageSquare, Zap, ThermometerSun, Clock, TrendingUp } from 'lucide-react';
import {
  solKPIs, solFunil, temperaturaDistribuicao, topLeadsQuentes,
  motivosDesqualificacao, performancePorCanal, volumeMensagens,
  mensagensPorDia, slaSol, heatmapSol, evolucaoDiariaSol, leadsRecentesSol
} from '@/data/biPagesMock';

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

export default function RoboSol() {
  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" /> Robô SOL — SDR IA
        </h1>
        <p className="text-sm text-muted-foreground">Performance operacional — Jan-Fev 2026 (dados mockados)</p>
      </div>

      {/* BLOCO 1 — KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Conversas iniciadas', value: solKPIs.conversasIniciadas, color: 'text-warning' },
          { label: 'Taxa de resposta', value: solKPIs.taxaResposta, suffix: '%', color: 'text-primary' },
          { label: 'Leads qualificados', value: solKPIs.leadsQualificados, color: 'text-primary' },
          { label: 'Taxa qualificação', value: solKPIs.taxaQualificacao, suffix: '%', color: 'text-warning' },
          { label: 'Desqualificados', value: solKPIs.leadsDesqualificados, color: 'text-destructive/70' },
          { label: 'Em qualificação', value: solKPIs.emQualificacao, color: 'text-info', pulse: true },
          { label: 'Score médio', value: solKPIs.scoreMedio, color: 'text-warning' },
          { label: 'Temp. média', value: 0, text: solKPIs.temperatureMedia, color: 'text-warning' },
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

      {/* BLOCO 2 — Funil */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Funil do Robô SOL</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {solFunil.map((s, i) => {
              const isLast = s.etapa === 'Desqualificados';
              const color = isLast ? 'bg-destructive/70' : i === 0 ? 'bg-muted-foreground' : 'bg-primary';
              return (
                <div key={s.etapa} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-32 text-right shrink-0">{s.etapa}</span>
                  <div className="flex-1 bg-muted rounded-full h-7 relative overflow-hidden">
                    <div className={`${color} h-full rounded-full flex items-center justify-end pr-3 transition-all duration-1000`} style={{ width: `${s.pct}%` }}>
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

      {/* BLOCO 3 — Temperatura */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Distribuição de Temperatura</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={temperaturaDistribuicao} dataKey="qtd" nameKey="label" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {temperaturaDistribuicao.map((d, i) => <Cell key={i} fill={d.cor} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Top 5 Leads Mais Quentes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topLeadsQuentes.map((l, i) => (
                <div key={i} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{l.nome}</p>
                    <p className="text-xs text-muted-foreground">{l.cidade} • {l.canal}</p>
                  </div>
                  <Badge className="bg-destructive/20 text-destructive font-bold">{l.score}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BLOCO 4 — Motivos Desqualificação */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Motivos de Desqualificação</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={motivosDesqualificacao} dataKey="qtd" nameKey="motivo" cx="50%" cy="50%" outerRadius={80}>
                  {motivosDesqualificacao.map((_, i) => <Cell key={i} fill={COLORS_MOTIVOS[i]} />)}
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
                {motivosDesqualificacao.map(m => (
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

      {/* BLOCO 5 — Performance por Canal */}
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
              {performancePorCanal.map(c => (
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

      {/* BLOCO 6 — Volume Mensagens */}
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
        </CardContent>
      </Card>

      {/* BLOCO 7 — SLA */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">SLA do Robô SOL</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            {slaSol.map(s => (
              <div key={s.etapa} className="text-center space-y-2 bg-muted/30 rounded-lg p-4">
                <SLAGauge pct={s.pctCumprido} status={s.status} />
                <p className="text-xs font-medium">{s.etapa}</p>
                <div className="flex justify-center gap-4 text-xs">
                  <span className="text-muted-foreground">Meta: {s.slaMeta}</span>
                  <span className="font-semibold">{s.real}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* BLOCO 8 — Heatmap */}
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
              {heatmapSol.map((row, di) => (
                <div key={di} className="flex gap-1 mb-1 items-center">
                  <span className="text-xs text-muted-foreground w-10 text-right shrink-0">{diasSemana[di]}</span>
                  {row.map((v, hi) => {
                    const maxV = 15;
                    const opacity = v / maxV;
                    return (
                      <div key={hi} className="flex-1 h-5 rounded-sm" title={`${diasSemana[di]} ${hi}h: ${v}`}
                        style={{ backgroundColor: `hsl(var(--primary) / ${Math.max(opacity, 0.05)})` }} />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span>🔥 Picos: Ter/Qui 10h-12h e 14h-16h</span>
          </div>
        </CardContent>
      </Card>

      {/* BLOCO 9 — Evolução Diária */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Evolução Diária</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={evolucaoDiariaSol}>
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

      {/* BLOCO 10 — Leads Recentes */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Leads Recentes</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead><TableHead>Cidade</TableHead><TableHead>Canal</TableHead>
                <TableHead className="text-right">Score</TableHead><TableHead>Temp.</TableHead>
                <TableHead>Status</TableHead><TableHead>Duração</TableHead><TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadsRecentesSol.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-xs">{l.nome}</TableCell>
                  <TableCell className="text-xs">{l.cidade}</TableCell>
                  <TableCell className="text-xs">{l.canal}</TableCell>
                  <TableCell className="text-right text-xs font-semibold">{l.score}</TableCell>
                  <TableCell><TempBadge temp={l.temperatura} /></TableCell>
                  <TableCell>
                    <Badge variant={l.status === 'Qualificado' ? 'default' : l.status === 'Em qualificação' ? 'secondary' : 'outline'} className="text-xs">
                      {l.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{l.duracao}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.data}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground pt-4">
        Sol Estrateg.IA — Robô SOL SDR • Dados mockados Jan-Fev 2026
      </p>
    </div>
  );
}
