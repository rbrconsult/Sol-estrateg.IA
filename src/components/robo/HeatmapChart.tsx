import type { SolLead } from '@/hooks/useSolData';

interface HeatmapChartProps {
  records: any[];
  title?: string;
  dateField?: string;
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';

const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function buildHeatmap(records: SolLead[], dateField: 'ts_cadastro' | 'ts_ultimo_fup' = 'ts_cadastro'): number[][] {
  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  records.forEach(r => {
    try {
      const raw = (dateField === 'ts_ultimo_fup' ? r.ts_ultimo_fup : r.ts_cadastro) || '';
      if (!raw) return;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return;
      const day = d.getDay();
      const hour = d.getHours();
      const mapDay = day === 0 ? 6 : day - 1;
      heatmap[mapDay][hour]++;
    } catch { /* skip */ }
  });
  return heatmap;
}

export default function HeatmapChart({ records, title = 'Melhor Horário e Dia', dateField = 'ts_cadastro' }: HeatmapChartProps) {
  const heatmap = useMemo(() => buildHeatmap(records, dateField), [records, dateField]);
  const maxV = Math.max(...heatmap.flat(), 1);
  const totalPoints = heatmap.flat().reduce((a, b) => a + b, 0);

  let bestDay = 0, bestHour = 0, bestVal = 0;
  heatmap.forEach((row, di) => row.forEach((v, hi) => { if (v > bestVal) { bestVal = v; bestDay = di; bestHour = hi; } }));

  if (totalPoints === 0) {
    return (
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground text-center py-8">Dados insuficientes para gerar heatmap.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {bestVal > 0 && (
            <span className="text-xs text-muted-foreground">
              🔥 Melhor: <strong className="text-foreground">{diasSemana[bestDay]} {bestHour}h</strong> ({bestVal} interações)
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="flex gap-1 mb-1 pl-12">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="flex-1 text-center text-[9px] text-muted-foreground">{i}h</div>
              ))}
            </div>
            {heatmap.map((row, di) => (
              <div key={di} className="flex gap-1 mb-1 items-center">
                <span className="text-xs text-muted-foreground w-10 text-right shrink-0">{diasSemana[di]}</span>
                {row.map((v, hi) => {
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
      </CardContent>
    </Card>
  );
}
