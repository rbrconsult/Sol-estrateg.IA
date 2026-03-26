import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, AreaChart, Area, PieChart, Pie } from 'recharts';
import { MakeRecord } from '@/hooks/useMakeDataStore';

const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 };
const COLORS = ['hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--accent-foreground))'];

interface RouteStudyProps {
  records: MakeRecord[];
}

export default function RouteStudy({ records }: RouteStudyProps) {
  const analysis = useMemo(() => {
    const fupRecords = records.filter(r => (r.followupCount || 0) >= 1);

    // 1. Where do leads convert? (which FUP stage)
    const reactivatedByStage: Record<number, number> = {};
    const totalByStage: Record<number, number> = {};
    
    fupRecords.forEach(r => {
      const stage = Math.min(r.followupCount || 1, 8);
      totalByStage[stage] = (totalByStage[stage] || 0) + 1;
      if (r.status_resposta === 'respondeu') {
        reactivatedByStage[stage] = (reactivatedByStage[stage] || 0) + 1;
      }
    });

    const gatilhos = ['Urgência suave', 'Prova social', 'Escassez', 'Benefício direto', 'Dor', 'Última chance', 'Reativação longa', 'Encerramento'];
    const dias = ['D+1', 'D+3', 'D+5', 'D+7', 'D+10', 'D+14', 'D+21', 'D+30'];

    const conversionByStage = Array.from({ length: 8 }, (_, i) => {
      const stage = i + 1;
      const total = totalByStage[stage] || 0;
      const converted = reactivatedByStage[stage] || 0;
      return {
        etapa: `FUP ${stage}`,
        dia: dias[i],
        gatilho: gatilhos[i],
        total,
        reativados: converted,
        semResposta: total - converted,
        taxa: total > 0 ? Math.round((converted / total) * 100 * 10) / 10 : 0,
      };
    });

    // 2. Cumulative drop-off
    const dropoff = Array.from({ length: 8 }, (_, i) => {
      const stage = i + 1;
      const remaining = fupRecords.filter(r => (r.followupCount || 0) >= stage).length;
      return {
        etapa: `FUP ${stage}`,
        dia: dias[i],
        leadsAtivos: remaining,
        pctOriginal: fupRecords.length > 0 ? Math.round((remaining / fupRecords.length) * 100) : 0,
      };
    });

    // 3. Cumulative conversions
    let cumulative = 0;
    const cumulativeConversions = conversionByStage.map(s => {
      cumulative += s.reativados;
      return { etapa: s.etapa, dia: s.dia, acumulado: cumulative, novas: s.reativados };
    });

    // 4. Best conversion stage
    const bestStage = conversionByStage.reduce((best, curr) => 
      curr.reativados > best.reativados ? curr : best, conversionByStage[0]);

    // 5. Average FUPs until conversion
    const convertedLeads = fupRecords.filter(r => r.status_resposta === 'respondeu');
    const avgFupsToConvert = convertedLeads.length > 0
      ? (convertedLeads.reduce((sum, r) => sum + Math.min(r.followupCount || 1, 8), 0) / convertedLeads.length).toFixed(1)
      : '—';

    // 6. Efficiency: % of all reactivations at each stage
    const totalReactivated = convertedLeads.length;
    const efficiencyByStage = conversionByStage.map(s => ({
      ...s,
      pctDoTotal: totalReactivated > 0 ? Math.round((s.reativados / totalReactivated) * 100) : 0,
    }));

    // 7. Best gatilho (by conversion rate, min 5 records)
    const bestGatilho = efficiencyByStage
      .filter(s => s.total >= 5)
      .reduce((best, curr) => curr.taxa > best.taxa ? curr : best, efficiencyByStage[0]);

    // 8. ROI by stage: which stages produce conversions most cost-effectively
    const roiByStage = efficiencyByStage.map(s => ({
      etapa: s.etapa,
      gatilho: s.gatilho,
      eficiencia: s.total > 0 ? Math.round((s.reativados / s.total) * 1000) / 10 : 0,
      volume: s.reativados,
    }));

    return { 
      conversionByStage: efficiencyByStage, 
      dropoff, 
      cumulativeConversions,
      bestStage, 
      avgFupsToConvert, 
      totalReactivated, 
      totalFup: fupRecords.length,
      bestGatilho,
      roiByStage,
    };
  }, [records]);

  if (analysis.totalFup === 0) {
    return (
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">📊 Estudo de Rotas FUP</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground text-center py-8">Sem dados de follow-up para análise.</p></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">📊 Estudo de Rotas FUP 1→8</h2>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Melhor etapa</p>
            <p className="text-xl font-bold text-primary">{analysis.bestStage.etapa}</p>
            <p className="text-[10px] text-muted-foreground">{analysis.bestStage.reativados} reativações</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">FUPs médios p/ converter</p>
            <p className="text-xl font-bold text-warning">{analysis.avgFupsToConvert}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total reativados</p>
            <p className="text-xl font-bold text-primary">{analysis.totalReactivated}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Melhor gatilho</p>
            <p className="text-sm font-bold text-primary">{analysis.bestGatilho?.gatilho || '—'}</p>
            <p className="text-[10px] text-muted-foreground">{analysis.bestGatilho?.taxa || 0}% taxa</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Retenção FUP 8</p>
            <p className="text-xl font-bold text-muted-foreground">{analysis.dropoff[7]?.pctOriginal || 0}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed route table */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Detalhamento por Rota</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rota</TableHead>
                <TableHead>Dia</TableHead>
                <TableHead>Gatilho</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Reativados</TableHead>
                <TableHead className="text-right">Taxa</TableHead>
                <TableHead className="text-right">% do Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.conversionByStage.map(s => {
                const isBest = s.etapa === analysis.bestStage.etapa;
                return (
                  <TableRow key={s.etapa} className={isBest ? 'bg-primary/10' : ''}>
                    <TableCell className="font-medium text-xs">{s.etapa}</TableCell>
                    <TableCell className="text-xs">{s.dia}</TableCell>
                    <TableCell className="text-xs">{s.gatilho}</TableCell>
                    <TableCell className="text-right text-xs">{s.total}</TableCell>
                    <TableCell className="text-right text-xs font-semibold">{s.reativados}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={isBest ? 'default' : 'secondary'} className="text-xs">{s.taxa}%</Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs">{s.pctDoTotal}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Conversion by stage bar chart */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Reativações por Rota</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analysis.conversionByStage}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="etapa" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar yAxisId="left" dataKey="reativados" name="Reativados" radius={[3, 3, 0, 0]}>
                  {analysis.conversionByStage.map((entry, i) => (
                    <Cell key={i} fill={entry.etapa === analysis.bestStage.etapa ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.5)'} />
                  ))}
                </Bar>
                <Bar yAxisId="right" dataKey="pctDoTotal" name="% do total" fill="hsl(var(--warning) / 0.6)" radius={[3, 3, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cumulative conversions area chart */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Conversões Acumuladas</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={analysis.cumulativeConversions}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="etapa" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [value, name === 'acumulado' ? 'Acumulado' : 'Novas']} />
                <Area type="monotone" dataKey="acumulado" name="Acumulado" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                <Bar dataKey="novas" name="Novas reativações" fill="hsl(var(--warning) / 0.7)" radius={[3, 3, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Efficiency & Drop-off row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Efficiency chart */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Eficiência por Rota (Taxa %)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analysis.roiByStage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="etapa" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={50} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value}%`, 'Eficiência']} />
                <Bar dataKey="eficiencia" name="Eficiência" radius={[0, 3, 3, 0]}>
                  {analysis.roiByStage.map((entry, i) => (
                    <Cell key={i} fill={entry.eficiencia > 15 ? 'hsl(var(--primary))' : entry.eficiencia > 8 ? 'hsl(var(--warning))' : 'hsl(var(--muted-foreground) / 0.5)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Drop-off curve */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Curva de Retenção (Drop-off)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.dropoff.map((d) => {
                const isLow = d.pctOriginal < 30;
                return (
                  <div key={d.etapa} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16 text-right shrink-0">{d.etapa}</span>
                    <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                      <div
                        className={`h-full rounded-full flex items-center justify-end pr-3 transition-all duration-700 ${isLow ? 'bg-destructive/60' : 'bg-primary/70'}`}
                        style={{ width: `${Math.max(d.pctOriginal, 2)}%` }}
                      >
                        <span className="text-[10px] font-bold text-primary-foreground">{d.leadsAtivos}</span>
                      </div>
                    </div>
                    <Badge variant={isLow ? 'destructive' : 'secondary'} className="text-xs w-12 justify-center">{d.pctOriginal}%</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
