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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PreVendedorData {
  nome: string;
  leadsTrabalhos: number;
  convertidos: number;
  taxaConversao: number;
  atividades: number;
}

interface PreVendedorStatsProps {
  data: PreVendedorData[];
}

export function PreVendedorStats({ data }: PreVendedorStatsProps) {
  const getConversionColor = (value: number) => {
    if (value >= 20) return 'hsl(152, 60%, 45%)';
    if (value >= 10) return 'hsl(38, 92%, 50%)';
    return 'hsl(0, 72%, 51%)';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = data.find(d => d.nome === label);
      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          <div className="mt-1 space-y-1 text-sm">
            <p className="text-muted-foreground">Leads: {item?.leadsTrabalhos}</p>
            <p className="text-muted-foreground">Convertidos: {item?.convertidos}</p>
            <p className="text-success font-medium">Taxa: {item?.taxaConversao.toFixed(1)}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card opacity-0 animate-fade-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Performance Pré-Vendedores</h3>
        <p className="text-sm text-muted-foreground">Taxa de conversão e cadência</p>
      </div>

      <Tabs defaultValue="conversao" className="w-full">
        <TabsList className="mb-4 w-full justify-start bg-muted/50">
          <TabsTrigger value="conversao" className="data-[state=active]:bg-card">
            Taxa Conversão
          </TabsTrigger>
          <TabsTrigger value="cadencia" className="data-[state=active]:bg-card">
            Cadência
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversao" className="h-[280px]">
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
                tickFormatter={(value) => `${value}%`}
                domain={[0, 'auto']}
              />
              <YAxis 
                type="category" 
                dataKey="nome" 
                width={120}
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="taxaConversao" 
                radius={[0, 6, 6, 0]}
                maxBarSize={28}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getConversionColor(entry.taxaConversao)} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="cadencia" className="h-[280px]">
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
              />
              <YAxis 
                type="category" 
                dataKey="nome" 
                width={120}
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                formatter={(value: number) => [`${value} leads`, 'Leads Trabalhados']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="leadsTrabalhos" 
                fill="hsl(215, 60%, 50%)"
                radius={[0, 6, 6, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>

      {/* Resumo */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-lg bg-muted/30 p-2">
          <p className="text-xs text-muted-foreground">Total Leads</p>
          <p className="font-bold text-foreground">{data.reduce((acc, d) => acc + d.leadsTrabalhos, 0)}</p>
        </div>
        <div className="rounded-lg bg-muted/30 p-2">
          <p className="text-xs text-muted-foreground">Convertidos</p>
          <p className="font-bold text-success">{data.reduce((acc, d) => acc + d.convertidos, 0)}</p>
        </div>
        <div className="rounded-lg bg-muted/30 p-2">
          <p className="text-xs text-muted-foreground">Taxa Média</p>
          <p className="font-bold text-foreground">
            {data.length > 0 
              ? (data.reduce((acc, d) => acc + d.taxaConversao, 0) / data.length).toFixed(1)
              : 0}%
          </p>
        </div>
      </div>
    </div>
  );
}
