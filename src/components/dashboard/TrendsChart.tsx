import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { safeToFixed } from "@/lib/formatters";

interface MonthlyData {
  mes: string;
  iniciados: number;
  valorFechado: number;
  taxaConversao: number;
}

interface TrendsChartProps {
  data: MonthlyData[];
}

export function TrendsChart({ data }: TrendsChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="text-sm" style={{ color: p.color }}>
              {p.dataKey === 'valorFechado' 
                ? formatCurrency(p.value)
                : p.dataKey === 'taxaConversao'
                  ? `${safeToFixed(p.value, 1)}%`
                  : p.value
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card opacity-0 animate-fade-up" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Tendências Mensais</h3>
        <p className="text-sm text-muted-foreground">Evolução dos indicadores ao longo do tempo</p>
      </div>

      <Tabs defaultValue="valor" className="w-full">
        <TabsList className="mb-4 w-full justify-start bg-muted/50">
          <TabsTrigger value="valor" className="data-[state=active]:bg-card">
            Valor Fechado
          </TabsTrigger>
          <TabsTrigger value="negocios" className="data-[state=active]:bg-card">
            Negócios
          </TabsTrigger>
          <TabsTrigger value="conversao" className="data-[state=active]:bg-card">
            Conversão
          </TabsTrigger>
        </TabsList>

        <TabsContent value="valor" className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152, 60%, 45%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(152, 60%, 45%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                vertical={false}
              />
              <XAxis 
                dataKey="mes" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="valorFechado"
                stroke="hsl(152, 60%, 45%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="negocios" className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNegocios" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(215, 60%, 25%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(215, 60%, 25%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                vertical={false}
              />
              <XAxis 
                dataKey="mes" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="iniciados"
                stroke="hsl(215, 60%, 25%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorNegocios)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="conversao" className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                vertical={false}
              />
              <XAxis 
                dataKey="mes" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="taxaConversao"
                stroke="hsl(38, 92%, 50%)"
                strokeWidth={2}
                dot={{ fill: 'hsl(38, 92%, 50%)', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
}
