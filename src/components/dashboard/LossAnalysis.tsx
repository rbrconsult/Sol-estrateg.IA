import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface LossData {
  motivo: string;
  quantidade: number;
  valor: number;
}

interface LossAnalysisProps {
  data: LossData[];
}

const COLORS = [
  'hsl(0, 72%, 51%)',
  'hsl(15, 72%, 51%)',
  'hsl(30, 72%, 51%)',
  'hsl(38, 92%, 50%)',
  'hsl(45, 80%, 50%)',
  'hsl(280, 60%, 50%)'
];

export function LossAnalysis({ data }: LossAnalysisProps) {
  const totalPerdido = data.reduce((acc, d) => acc + d.valor, 0);
  const totalQuantidade = data.reduce((acc, d) => acc + d.quantidade, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.motivo}</p>
          <p className="text-sm text-muted-foreground">
            {data.quantidade} negócios ({((data.quantidade / totalQuantidade) * 100).toFixed(1)}%)
          </p>
          <p className="text-sm font-medium text-destructive">
            {formatCurrency(data.valor)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card opacity-0 animate-fade-up" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Análise de Perdas</h3>
        <p className="text-sm text-muted-foreground">Principais motivos de perda de negócios</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="quantidade"
              >
                {data.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    className="transition-opacity hover:opacity-80"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {data.slice(0, 5).map((item, index) => (
            <div key={item.motivo} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-foreground">{item.motivo}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-foreground">
                  {item.quantidade}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  ({formatCurrency(item.valor)})
                </span>
              </div>
            </div>
          ))}
          
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total Perdido</span>
              <span className="text-lg font-bold text-destructive">{formatCurrency(totalPerdido)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
