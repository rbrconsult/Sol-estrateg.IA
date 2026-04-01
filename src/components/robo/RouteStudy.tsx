import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, AreaChart, Area } from 'recharts';
import type { SolLead } from '@/hooks/useSolData';

const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 };

interface RouteStudyProps {
  records: any[];
}

export default function RouteStudy({ records }: RouteStudyProps) {
  const analysis = useMemo(() => {
    const fupRecords = records.filter(r => (r.fup_followup_count || 0) >= 1);
    const reactivatedByStage: Record<number, number> = {};
    const totalByStage: Record<number, number> = {};
    
    fupRecords.forEach(r => {
      const stage = Math.min(r.fup_followup_count || 1, 8);
      totalByStage[stage] = (totalByStage[stage] || 0) + 1;
      if (r.status === 'QUALIFICADO') reactivatedByStage[stage] = (reactivatedByStage[stage] || 0) + 1;
    });

    const gatilhos = ['Urgência suave', 'Prova social', 'Escassez', 'Benefício direto', 'Dor', 'Última chance', 'Reativação longa', 'Encerramento'];
    const dias = ['D+1', 'D+3', 'D+5', 'D+7', 'D+10', 'D+14', 'D+21', 'D+30'];

    const conversionByStage = Array.from({ length: 8 }, (_, i) => {
      const stage = i + 1;
      const total = totalByStage[stage] || 0;
      const converted = reactivatedByStage[stage] || 0;
      return { etapa: `FUP ${stage}`, dia: dias[i], gatilho: gatilhos[i], total, reativados: converted, semResposta: total - converted, taxa: total > 0 ? Math.round((converted / total) * 100 * 10) / 10 : 0 };
    });

    const totalReactivated = fupRecords.filter(r => r.status === 'QUALIFICADO').length;
    const efficiencyByStage = conversionByStage.map(s => ({ ...s, pctDoTotal: totalReactivated > 0 ? Math.round((s.reativados / totalReactivated) * 100) : 0 }));
    const bestStage = conversionByStage.reduce((best, curr) => curr.reativados > best.reativados ? curr : best, conversionByStage[0]);
    const convertedLeads = fupRecords.filter(r => r.status === 'QUALIFICADO');
    const avgFupsToConvert = convertedLeads.length > 0 ? (convertedLeads.reduce((sum, r) => sum + Math.min(r.fup_followup_count || 1, 8), 0) / convertedLeads.length).toFixed(1) : '—';

    const dropoff = Array.from({ length: 8 }, (_, i) => {
      const stage = i + 1;
      const remaining = fupRecords.filter(r => (r.fup_followup_count || 0) >= stage).length;
      return { etapa: `FUP ${stage}`, dia: dias[i], leadsAtivos: remaining, pctOriginal: fupRecords.length > 0 ? Math.round((remaining / fupRecords.length) * 100) : 0 };
    });

    let cumulative = 0;
    const cumulativeConversions = conversionByStage.map(s => { cumulative += s.reativados; return { etapa: s.etapa, dia: s.dia, acumulado: cumulative, novas: s.reativados }; });

    const bestGatilho = efficiencyByStage.filter(s => s.total >= 5).reduce((best, curr) => curr.taxa > best.taxa ? curr : best, efficiencyByStage[0]);
    const roiByStage = efficiencyByStage.map(s => ({ etapa: s.etapa, gatilho: s.gatilho, eficiencia: s.total > 0 ? Math.round((s.reativados / s.total) * 1000) / 10 : 0, volume: s.reativados }));

    return { conversionByStage: efficiencyByStage, dropoff, cumulativeConversions, bestStage, avgFupsToConvert, totalReactivated, totalFup: fupRecords.length, bestGatilho, roiByStage };
  }, [records]);

  if (analysis.totalFup === 0) {
    return (<Card><CardHeader className="pb-3"><CardTitle className="text-base">📊 Estudo de Rotas FUP</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground text-center py-8">Sem dados de follow-up para análise.</p></CardContent></Card>);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">📊 Estudo de Rotas FUP 1→8</h2>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground mb-1">Melhor etapa</p><p className="text-xl font-bold text-primary">{analysis.bestStage.etapa}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground mb-1">FUPs médios p/ converter</p><p className="text-xl font-bold text-warning">{analysis.avgFupsToConvert}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground mb-1">Total reativados</p><p className="text-xl font-bold text-primary">{analysis.totalReactivated}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground mb-1">Melhor gatilho</p><p className="text-sm font-bold text-primary">{analysis.bestGatilho?.gatilho || '—'}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground mb-1">Retenção FUP 8</p><p className="text-xl font-bold text-muted-foreground">{analysis.dropoff[7]?.pctOriginal || 0}%</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Detalhamento por Rota</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Rota</TableHead><TableHead>Dia</TableHead><TableHead>Gatilho</TableHead><TableHead className="text-right">Leads</TableHead><TableHead className="text-right">Reativados</TableHead><TableHead className="text-right">Taxa</TableHead><TableHead className="text-right">% do Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {analysis.conversionByStage.map(s => (
                <TableRow key={s.etapa} className={s.etapa === analysis.bestStage.etapa ? 'bg-primary/10' : ''}>
                  <TableCell className="font-medium text-xs">{s.etapa}</TableCell><TableCell className="text-xs">{s.dia}</TableCell><TableCell className="text-xs">{s.gatilho}</TableCell>
                  <TableCell className="text-right text-xs">{s.total}</TableCell><TableCell className="text-right text-xs font-semibold">{s.reativados}</TableCell>
                  <TableCell className="text-right"><Badge variant={s.etapa === analysis.bestStage.etapa ? 'default' : 'secondary'} className="text-xs">{s.taxa}%</Badge></TableCell>
                  <TableCell className="text-right text-xs">{s.pctDoTotal}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
