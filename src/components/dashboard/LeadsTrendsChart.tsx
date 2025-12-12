import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';

interface DailyData {
  date: string;
  atual: number;
  anterior?: number;
  meta?: number;
}

interface LeadsTrendsChartProps {
  data: DailyData[];
  title?: string;
  linkText?: string;
  linkHref?: string;
}

export function LeadsTrendsChart({ 
  data, 
  title = "Novos leads",
  linkText = "Mais detalhes",
  linkHref = "#"
}: LeadsTrendsChartProps) {
  const maxValue = Math.max(...data.map(d => Math.max(d.atual, d.anterior || 0, d.meta || 0)));
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-lg text-sm">
          <p className="font-medium text-foreground mb-1">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color }} className="text-sm">
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const totalAtual = data.reduce((acc, d) => acc + d.atual, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-2xl font-bold text-foreground">{totalAtual}</span>
          <span className="text-sm text-muted-foreground ml-2">{title}</span>
        </div>
        <a 
          href={linkHref}
          className="text-sm text-info hover:text-info/80 transition-colors"
        >
          {linkText}
        </a>
      </div>

      {/* Chart */}
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAtual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="colorAnterior" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, maxValue * 1.1]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-xs text-muted-foreground">{value}</span>
              )}
            />
            
            {/* Meta line */}
            {data.some(d => d.meta) && (
              <Area
                type="monotone"
                dataKey="meta"
                name="Meta"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="none"
              />
            )}
            
            {/* Período anterior */}
            {data.some(d => d.anterior) && (
              <Area
                type="monotone"
                dataKey="anterior"
                name="Outubro"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                fill="url(#colorAnterior)"
              />
            )}
            
            {/* Período atual */}
            <Area
              type="monotone"
              dataKey="atual"
              name="Novembro"
              stroke="hsl(var(--info))"
              strokeWidth={2}
              fill="url(#colorAtual)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
