import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';
import { Repeat, DollarSign, Clock, Zap, CalendarClock } from 'lucide-react';
import {
  fupKPIs, pipelineFup, resultadoReativados, fupPorStatusAnterior,
  slaFup, evolucaoFup, leadsFupAtivos
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
const RESULT_COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--warning))'];

export default function RoboFupFrio() {
  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
          <Repeat className="h-6 w-6 text-info" /> Robô FUP Frio
        </h1>
        <p className="text-sm text-muted-foreground">Reengajamento de leads frios — Jan-Fev 2026 (dados mockados)</p>
      </div>

      {/* BLOCO 1 — KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Leads em FUP ativo', value: fupKPIs.leadsAtivos, color: 'text-warning' },
          { label: 'Total entrou no FUP', value: fupKPIs.totalEntrou, color: 'text-info' },
          { label: 'Reativados', value: fupKPIs.reativados, color: 'text-primary' },
          { label: 'Taxa de reativação', value: fupKPIs.taxaReativacao, suffix: '%', color: 'text-primary' },
          { label: 'Receita gerada', value: fupKPIs.receitaGerada, prefix: 'R$ ', color: 'text-primary' },
          { label: 'Tempo médio reativ.', value: fupKPIs.tempoMedioReativacao, suffix: ' dias', color: 'text-warning' },
          { label: 'FUPs médios', value: fupKPIs.fupsMedios, color: 'text-muted-foreground' },
          { label: 'Custo/reativação', value: fupKPIs.custoReativacao, prefix: 'R$ ', color: 'text-primary' },
        ].map((k, i) => {
          const anim = useAnimatedNumber(k.value);
          return (
            <Card key={i}>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
                <p className={`text-xl font-bold ${k.color}`}>
                  {k.prefix || ''}{k.value >= 1000 ? Math.round(anim).toLocaleString('pt-BR') : anim.toFixed(k.value % 1 !== 0 ? 1 : 0)}{k.suffix || ''}
                </p>
              </CardContent>
            </Card>
          );
        })}
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
                {pipelineFup.map(p => {
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
          {/* Bar visual */}
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={pipelineFup} layout="vertical">
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
                  {resultadoReativados.map((_, i) => <Cell key={i} fill={RESULT_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Fechamentos do FUP Frio</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-black text-primary">4</p>
                <p className="text-sm text-muted-foreground">Contratos fechados</p>
              </div>
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-black text-primary">R$ 42.300</p>
                <p className="text-sm text-muted-foreground">Receita originada</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BLOCO 4 — Performance por Status Anterior */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Performance por Etapa de Entrada</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status anterior</TableHead><TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Reativados</TableHead><TableHead className="text-right">Taxa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fupPorStatusAnterior.map(s => (
                <TableRow key={s.statusAnterior}>
                  <TableCell className="font-medium text-xs">{s.statusAnterior}</TableCell>
                  <TableCell className="text-right text-xs">{s.qtd}</TableCell>
                  <TableCell className="text-right text-xs font-semibold">{s.reativados}</TableCell>
                  <TableCell className="text-right"><Badge variant="secondary" className="text-xs">{s.taxa}%</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* BLOCO 5 — SLA FUP */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">SLA FUP Frio</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Aguardando FUP 1</p>
              <p className="text-lg font-bold">{slaFup.aguardandoFup1}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Intervalo</p>
              <p className="text-sm font-bold">{slaFup.intervalo}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Em espera hoje</p>
              <p className="text-lg font-bold text-warning">{slaFup.leadsEspera}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Próximo disparo</p>
              <p className="text-sm font-bold text-info">{slaFup.proximoDisparo}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BLOCO 6 — Evolução */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Evolução Temporal</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={evolucaoFup}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="dia" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="disparos" name="Disparos" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.15} />
              <Area type="monotone" dataKey="respostas" name="Respostas" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* BLOCO 7 — Leads no FUP */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Leads Ativos no FUP</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead><TableHead>Etapa</TableHead><TableHead>Próximo FUP</TableHead>
                <TableHead className="text-right">Dias</TableHead><TableHead>Canal</TableHead><TableHead>Última Resp.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadsFupAtivos.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-xs">{l.nome}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{l.etapaAtual}</Badge></TableCell>
                  <TableCell className="text-xs">{l.proximoFup}</TableCell>
                  <TableCell className="text-right text-xs">{l.diasEmFup}</TableCell>
                  <TableCell className="text-xs">{l.canalOrigem}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.ultimaResposta}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground pt-4">
        Sol Estrateg.IA — Robô FUP Frio • Dados mockados Jan-Fev 2026
      </p>
    </div>
  );
}
