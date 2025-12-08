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
import { Users, DollarSign } from "lucide-react";

interface ComercialData {
  nome: string;
  leadsTrabalhos: number;
  convertidos: number;
  valorTotal: number;
  taxaConversao: number;
  atividades: number;
}

interface ComercialResponsavelStatsProps {
  data: ComercialData[];
}

export function ComercialResponsavelStats({ data }: ComercialResponsavelStatsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const formatCurrencyFull = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  const CustomTooltipValor = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = data.find(d => d.nome === label);
      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          <div className="mt-1 space-y-1 text-sm">
            <p className="text-success font-medium">Valor: {formatCurrencyFull(item?.valorTotal || 0)}</p>
            <p className="text-muted-foreground">Propostas: {item?.leadsTrabalhos}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipCadencia = ({ active, payload, label }: any) => {
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

  const totalValor = data.reduce((acc, d) => acc + d.valorTotal, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card opacity-0 animate-fade-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
      <div className="mb-6 flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <div>
          <h3 className="text-lg font-semibold text-foreground">Comercial Responsável</h3>
          <p className="text-sm text-muted-foreground">Valor por responsável e cadência</p>
        </div>
      </div>

      <Tabs defaultValue="valor" className="w-full">
        <TabsList className="mb-4 w-full justify-start bg-muted/50">
          <TabsTrigger value="valor" className="data-[state=active]:bg-card">
            <DollarSign className="h-4 w-4 mr-1" />
            Valor (R$)
          </TabsTrigger>
          <TabsTrigger value="cadencia" className="data-[state=active]:bg-card">
            Cadência
          </TabsTrigger>
        </TabsList>

        <TabsContent value="valor" className="h-[280px]">
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
                tickFormatter={(value) => formatCurrency(value)}
              />
              <YAxis 
                type="category" 
                dataKey="nome" 
                width={120}
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltipValor />} />
              <Bar 
                dataKey="valorTotal" 
                fill="hsl(152, 60%, 45%)"
                radius={[0, 6, 6, 0]}
                maxBarSize={28}
              />
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
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltipCadencia />} />
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
          <p className="text-xs text-muted-foreground">Valor Total</p>
          <p className="font-bold text-success">{formatCurrency(totalValor)}</p>
        </div>
        <div className="rounded-lg bg-muted/30 p-2">
          <p className="text-xs text-muted-foreground">Total Leads</p>
          <p className="font-bold text-foreground">{data.reduce((acc, d) => acc + d.leadsTrabalhos, 0)}</p>
        </div>
        <div className="rounded-lg bg-muted/30 p-2">
          <p className="text-xs text-muted-foreground">Responsáveis</p>
          <p className="font-bold text-foreground">{data.length}</p>
        </div>
      </div>
    </div>
  );
}
