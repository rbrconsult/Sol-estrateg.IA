import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface PerformanceData {
  nome: string;
  taxaConversao: number;
  valorTotal?: number;
  atividades?: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  title: string;
  subtitle?: string;
  dataKey?: 'taxaConversao' | 'valorTotal' | 'atividades';
  showCurrency?: boolean;
}

export function PerformanceChart({ 
  data, 
  title, 
  subtitle,
  dataKey = 'taxaConversao',
  showCurrency = false
}: PerformanceChartProps) {
  const formatValue = (value: number) => {
    if (showCurrency) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(value);
    }
    return dataKey === 'taxaConversao' ? `${value.toFixed(1)}%` : value.toString();
  };

  const getBarColor = (value: number) => {
    if (dataKey === 'taxaConversao') {
      if (value >= 25) return 'hsl(152, 60%, 45%)';
      if (value >= 15) return 'hsl(38, 92%, 50%)';
      return 'hsl(0, 72%, 51%)';
    }
    return 'hsl(215, 60%, 25%)';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">
            {formatValue(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card opacity-0 animate-fade-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              horizontal={true}
              vertical={false}
            />
            <XAxis 
              type="number" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
              tickFormatter={(value) => formatValue(value)}
            />
            <YAxis 
              type="category" 
              dataKey="nome" 
              width={100}
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey={dataKey} 
              radius={[0, 6, 6, 0]}
              maxBarSize={32}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry[dataKey] || 0)} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
