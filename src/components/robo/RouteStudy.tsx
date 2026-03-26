import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { MakeRecord } from '@/hooks/useMakeDataStore';

const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 };

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

    const conversionByStage = Array.from({ length: 8 }, (_, i) => {
      const stage = i + 1;
      const total = totalByStage[stage] || 0;
      const converted = reactivatedByStage[stage] || 0;
      return {
        etapa: `FUP ${stage}`,
        total,
        reativados: converted,
        taxa: total > 0 ? Math.round((converted / total) * 100) : 0,
      };
    });

    // 2. Cumulative drop-off (how many leads survive to each stage)
    const dropoff = Array.from({ length: 8 }, (_, i) => {
      const stage = i + 1;
      const remaining = fupRecords.filter(r => (r.followupCount || 0) >= stage).length;
      return {
        etapa: `FUP ${stage}`,
        leadsAtivos: remaining,
        pctOriginal: fupRecords.length > 0 ? Math.round((remaining / fupRecords.length) * 100) : 0,
      };
    });

    // 3. Best conversion stage
    const bestStage = conversionByStage.reduce((best, curr) => 
      curr.reativados > best.reativados ? curr : best, conversionByStage[0]);

    // 4. Average FUPs until conversion
    const convertedLeads = fupRecords.filter(r => r.status_resposta === 'respondeu');
    const avgFupsToConvert = convertedLeads.length > 0
      ? (convertedLeads.reduce((sum, r) => sum + Math.min(r.followupCount || 1, 8), 0) / convertedLeads.length).toFixed(1)
      : '—';

    // 5. Efficiency: % of all reactivations that happen at each stage
    const totalReactivated = convertedLeads.length;
    const efficiencyByStage = conversionByStage.map(s => ({
      ...s,
      pctDoTotal: totalReactivated > 0 ? Math.round((s.reativados / totalReactivated) * 100) : 0,
    }));

    return { conversionByStage: efficiencyByStage, dropoff, bestStage, avgFupsToConvert, totalReactivated, totalFup: fupRecords.length };
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
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            <p className="text-xs text-muted-foreground mb-1">Retenção FUP 8</p>
            <p className="text-xl font-bold text-muted-foreground">{analysis.dropoff[7]?.pctOriginal || 0}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion funnel chart */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">📊 Análise do Caminho FUP 1→8</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Stacked: reativados vs taxa */}
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

      {/* Drop-off curve */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Curva de Retenção (Drop-off)</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analysis.dropoff.map((d, i) => {
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
  );
}
