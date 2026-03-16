import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Route, AlertTriangle, Search, CheckCircle, Clock, XCircle } from 'lucide-react';
import {
  slasJornada, leadsPorEtapaAgora, gargalos, abandonoPorEtapa, distribuicaoTempoPorEtapa
} from '@/data/biPagesMock';

const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 };

function SLAGauge({ pct, status }: { pct: number; status: string }) {
  const color = status === 'dentro' ? 'hsl(var(--success))' : status === 'alerta' || status === 'depende' ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';
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

function StatusIcon({ status }: { status: string }) {
  if (status === 'dentro') return <CheckCircle className="h-4 w-4 text-primary" />;
  if (status === 'alerta' || status === 'depende') return <AlertTriangle className="h-4 w-4 text-warning" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
}

const timelineEtapas = [
  { icon: '📥', label: 'Entrada', ator: 'Automação' },
  { icon: '🤖', label: 'Sol Aborda', ator: 'Robô Sol' },
  { icon: '✅', label: 'Qualificado', ator: 'Robô Sol' },
  { icon: '📞', label: 'Closer', ator: 'Closer' },
  { icon: '📅', label: 'Agendado', ator: 'Closer' },
  { icon: '🤝', label: 'Reunião', ator: 'Closer' },
  { icon: '📄', label: 'Proposta', ator: 'Closer' },
  { icon: '🎯', label: 'Fechamento', ator: 'Closer' },
];

export default function JornadaLead() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
          <Route className="h-6 w-6 text-primary" /> Jornada do Lead + SLAs
        </h1>
        <p className="text-sm text-muted-foreground">Visão completa da jornada — Jan-Fev 2026 (dados mockados)</p>
      </div>

      {/* BLOCO 1 — SLAs Overview */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Visão Geral dos SLAs</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {slasJornada.map(s => (
              <div key={s.etapa} className="bg-muted/30 rounded-lg p-4 text-center space-y-2">
                <SLAGauge pct={s.pctCumpriu} status={s.status} />
                <p className="text-xs font-medium leading-tight">{s.etapa}</p>
                <div className="flex justify-center items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{s.slaMeta}</span>
                  <span className="font-semibold">{s.realMedio}</span>
                  <StatusIcon status={s.status} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* BLOCO 2 — Timeline Visual */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Timeline da Jornada</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex items-center gap-0 min-w-[800px] py-4">
              {timelineEtapas.map((e, i) => {
                const sla = slasJornada[i];
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
                        <div className={`h-0.5 w-full ${sla?.status === 'fora' ? 'bg-destructive' : sla?.status === 'alerta' || sla?.status === 'depende' ? 'bg-warning' : 'bg-primary'}`} />
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

      {/* BLOCO 3 — Distribuição de Tempo */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Distribuição de Tempo por Etapa</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={distribuicaoTempoPorEtapa}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} label={{ value: '% leads', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="preVenda" name="Pré-venda" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="qualificacao" name="Qualificação" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="closer" name="Closer" fill="hsl(var(--chart-3))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="proposta" name="Proposta" fill="hsl(var(--chart-4))" radius={[2, 2, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* BLOCO 4 — Leads por Etapa Agora */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Leads por Etapa — Agora</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Etapa</TableHead><TableHead className="text-right">Qtd leads</TableHead>
                <TableHead>Tempo médio</TableHead><TableHead className="text-right">Alertas SLA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadsPorEtapaAgora.map(l => (
                <TableRow key={l.etapa}>
                  <TableCell className="font-medium text-xs">{l.etapa}</TableCell>
                  <TableCell className="text-right text-xs font-semibold">{l.qtd}</TableCell>
                  <TableCell className="text-xs">{l.tempoMedio}</TableCell>
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

      {/* BLOCO 5 — Gargalos */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Gargalos Identificados</CardTitle></CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {gargalos.map((g, i) => (
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

      {/* BLOCO 6 — Busca Individual */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Jornada Individual do Lead</CardTitle>
          <CardDescription>Busque por nome ou telefone para visualizar a timeline completa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Nome ou telefone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          {searchTerm && (
            <div className="mt-4 text-center py-8 text-muted-foreground">
              <p className="text-sm">🚧 Funcionalidade em desenvolvimento</p>
              <p className="text-xs mt-1">Busca conectada ao DataStore em breve</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BLOCO 7 — Abandono por Etapa */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Taxa de Abandono por Etapa</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {abandonoPorEtapa.map(a => (
              <div key={a.etapa} className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground w-24 text-right shrink-0">{a.etapa}</span>
                <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                  <div className="bg-destructive/60 h-full rounded-full flex items-center justify-end pr-2 transition-all duration-1000"
                    style={{ width: `${a.abandonaram}%` }}>
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
        Sol Estrateg.IA — Jornada do Lead + SLAs • Dados mockados Jan-Fev 2026
      </p>
    </div>
  );
}
