import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend,
} from "recharts";
import { useMakeDataStore, MakeRecord } from "@/hooks/useMakeDataStore";
import { DollarSign, TrendingUp, Users, Target, RefreshCcw } from "lucide-react";

const TEMP_COLORS = { quente: "hsl(var(--destructive))", morno: "hsl(var(--warning))", frio: "hsl(var(--info))" };
const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 };

function deriveMidiaData(records: MakeRecord[]) {
  // Group by canal
  const canais: Record<string, { leads: number; responderam: number; qualificados: number; scores: number[]; quentes: number; mornos: number; frios: number }> = {};

  records.forEach(r => {
    let canal = r.cidade || 'Outros';
    if (!canais[canal]) canais[canal] = { leads: 0, responderam: 0, qualificados: 0, scores: [], quentes: 0, mornos: 0, frios: 0 };
    canais[canal].leads++;
    if (r.status_resposta === 'respondeu') canais[canal].responderam++;
    if ((r.makeStatus || '').toUpperCase() === 'QUALIFICADO') canais[canal].qualificados++;
    const s = parseInt(r.makeScore || '0') || 0;
    if (s > 0) canais[canal].scores.push(s);
    const temp = (r.makeTemperatura || '').toUpperCase();
    if (temp === 'QUENTE') canais[canal].quentes++;
    else if (temp === 'MORNO') canais[canal].mornos++;
    else canais[canal].frios++;
  });

  const canalList = Object.entries(canais)
    .map(([canal, d]) => ({
      canal,
      ...d,
      taxaResp: d.leads > 0 ? Math.round((d.responderam / d.leads) * 100) : 0,
      taxaQual: d.leads > 0 ? Math.round((d.qualificados / d.leads) * 100) : 0,
      scoreMedia: d.scores.length > 0 ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 0,
    }))
    .sort((a, b) => b.leads - a.leads);

  // Funnel per origin (top 4)
  const funisOrigem = canalList.slice(0, 4).map((c, i) => ({
    origem: c.canal,
    cor: ['#1877F2', '#34A853', '#F59E0B', '#25D366'][i] || '#888',
    etapas: [
      { label: 'Leads', valor: c.leads, pct: '100%' },
      { label: 'Responderam', valor: c.responderam, pct: `${c.taxaResp}%` },
      { label: 'Qualificados', valor: c.qualificados, pct: c.responderam > 0 ? `${Math.round((c.qualificados / c.responderam) * 100)}%` : '0%' },
    ],
  }));

  // Radar
  const top2 = canalList.slice(0, 2);
  const radarComparativo = [
    { eixo: "Volume", a: top2[0]?.leads || 0, b: top2[1]?.leads || 0 },
    { eixo: "Taxa Resp.", a: top2[0]?.taxaResp || 0, b: top2[1]?.taxaResp || 0 },
    { eixo: "Taxa Qual.", a: top2[0]?.taxaQual || 0, b: top2[1]?.taxaQual || 0 },
    { eixo: "Score Médio", a: top2[0]?.scoreMedia || 0, b: top2[1]?.scoreMedia || 0 },
    { eixo: "Quentes", a: top2[0]?.quentes || 0, b: top2[1]?.quentes || 0 },
  ];

  // Score por Origem
  const scorePorOrigem = canalList.filter(c => c.scoreMedia > 0).slice(0, 5).map(c => ({ origem: c.canal, score: c.scoreMedia }));

  // Temperatura por Canal
  const temperaturaPorCanal = canalList.slice(0, 4).map(c => {
    const total = c.quentes + c.mornos + c.frios || 1;
    return { canal: c.canal, quente: Math.round((c.quentes / total) * 100), morno: Math.round((c.mornos / total) * 100), frio: Math.round((c.frios / total) * 100) };
  });

  // Weekly evolution
  const byWeek: Record<string, Record<string, { leads: number }>> = {};
  records.forEach(r => {
    if (!r.data_envio) return;
    try {
      const d = new Date(r.data_envio);
      if (isNaN(d.getTime())) return;
      const ws = new Date(d); ws.setDate(d.getDate() - d.getDay());
      const key = ws.toISOString().slice(0, 10);
      const canal = r.cidade || 'Outros';
      if (!byWeek[key]) byWeek[key] = {};
      if (!byWeek[key][canal]) byWeek[key][canal] = { leads: 0 };
      byWeek[key][canal].leads++;
    } catch { /* skip */ }
  });
  const topCanais = canalList.slice(0, 2).map(c => c.canal);
  const evolucaoSemanal = Object.entries(byWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([semana, canals]) => ({
      semana: semana.slice(5),
      [topCanais[0] || 'Canal 1']: canals[topCanais[0]]?.leads || 0,
      [topCanais[1] || 'Canal 2']: canals[topCanais[1]]?.leads || 0,
    }));

  // KPIs table
  const totalLeads = records.length;
  const totalResp = records.filter(r => r.status_resposta === 'respondeu').length;
  const totalQual = records.filter(r => (r.makeStatus || '').toUpperCase() === 'QUALIFICADO').length;
  const kpiTable = [
    { metrica: "Leads gerados", total: String(totalLeads) },
    { metrica: "Responderam", total: String(totalResp) },
    { metrica: "Qualificados", total: String(totalQual) },
    { metrica: "Taxa resposta", total: `${totalLeads > 0 ? Math.round((totalResp / totalLeads) * 100) : 0}%` },
    { metrica: "Taxa qualificação", total: `${totalLeads > 0 ? Math.round((totalQual / totalLeads) * 100) : 0}%` },
  ];

  return { canalList, funisOrigem, radarComparativo, scorePorOrigem, temperaturaPorCanal, evolucaoSemanal, kpiTable, topCanais };
}

export default function MidiaReceita() {
  const { data: makeRecords, isLoading, refetch } = useMakeDataStore();
  const records = makeRecords || [];

  const d = useMemo(() => deriveMidiaData(records), [records]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div><h1 className="text-2xl font-bold text-foreground">Mídia × Receita</h1></div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="space-y-6 pb-10">
        <div><h1 className="text-2xl font-bold text-foreground">Mídia × Receita</h1></div>
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum dado disponível no Data Store.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Mídia × Receita — Atribuição e ROI</h1>
          <p className="text-sm text-muted-foreground mt-1">{records.length} leads · Dados reais do Data Store</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCcw className="h-4 w-4 mr-1" /> Atualizar</Button>
      </div>

      {/* KPIs */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">KPIs Gerais</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Métrica</TableHead><TableHead className="font-bold">Total</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {d.kpiTable.map(kpi => (
                  <TableRow key={kpi.metrica}>
                    <TableCell className="font-medium text-sm">{kpi.metrica}</TableCell>
                    <TableCell className="font-mono text-sm font-bold">{kpi.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Funil por Origem */}
      <div>
        <h2 className="text-lg font-bold mb-3">Funil por Origem</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {d.funisOrigem.map(funil => (
            <Card key={funil.origem}>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: funil.cor }} />
                  {funil.origem}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {funil.etapas.map((etapa, i) => {
                  const maxVal = funil.etapas[0].valor || 1;
                  const width = (etapa.valor / maxVal) * 100;
                  return (
                    <div key={i} className="mb-2 last:mb-0">
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className="text-muted-foreground">{etapa.label}</span>
                        <span className="font-mono font-bold">{etapa.valor}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div className="h-full rounded-full transition-all" style={{ width: `${width}%`, backgroundColor: funil.cor, opacity: 1 - i * 0.15 }} />
                      </div>
                      {i < funil.etapas.length - 1 && (
                        <p className="text-[10px] text-muted-foreground text-center font-mono">↓ {funil.etapas[i + 1]?.pct}</p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Radar + Score */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Comparativo Top 2 Canais</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={d.radarComparativo}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="eixo" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fontSize: 9 }} />
                <Radar name={d.topCanais[0] || 'Canal 1'} dataKey="a" stroke="#1877F2" fill="#1877F2" fillOpacity={0.2} />
                <Radar name={d.topCanais[1] || 'Canal 2'} dataKey="b" stroke="#34A853" fill="#34A853" fillOpacity={0.2} />
                <Legend />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Score Médio por Origem</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {d.scorePorOrigem.map(item => (
                <div key={item.origem}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{item.origem}</span>
                    <span className="font-mono font-bold">{item.score} ⭐</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${item.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {d.temperaturaPorCanal.map(canal => {
                return (
                  <div key={canal.canal}>
                    <p className="text-xs font-medium mb-1">{canal.canal}</p>
                    <div className="flex h-4 rounded-full overflow-hidden">
                      <div style={{ width: `${canal.quente}%`, backgroundColor: TEMP_COLORS.quente }} />
                      <div style={{ width: `${canal.morno}%`, backgroundColor: TEMP_COLORS.morno }} />
                      <div style={{ width: `${canal.frio}%`, backgroundColor: TEMP_COLORS.frio }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5 font-mono">
                      <span>🔥{canal.quente}%</span>
                      <span>🌡{canal.morno}%</span>
                      <span>❄{canal.frio}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance table */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Performance por Canal</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Canal</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Resp.</TableHead>
                <TableHead className="text-right">Qualif.</TableHead>
                <TableHead className="text-right">Taxa Qual</TableHead>
                <TableHead className="text-right">Score ∅</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.canalList.slice(0, 8).map(c => (
                <TableRow key={c.canal}>
                  <TableCell className="font-medium text-sm">{c.canal}</TableCell>
                  <TableCell className="text-right font-mono">{c.leads}</TableCell>
                  <TableCell className="text-right font-mono">{c.responderam}</TableCell>
                  <TableCell className="text-right font-mono font-bold">{c.qualificados}</TableCell>
                  <TableCell className="text-right font-mono">{c.taxaQual}%</TableCell>
                  <TableCell className="text-right font-mono">{c.scoreMedia}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Evolução */}
      {d.evolucaoSemanal.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Evolução Semanal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={d.evolucaoSemanal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey={d.topCanais[0] || 'Canal 1'} name={d.topCanais[0] || 'Canal 1'} fill="#1877F2" radius={[4, 4, 0, 0]} />
                <Bar dataKey={d.topCanais[1] || 'Canal 2'} name={d.topCanais[1] || 'Canal 2'} fill="#34A853" radius={[4, 4, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
