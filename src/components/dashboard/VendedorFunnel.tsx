import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ProjectsModal } from "./ProjectsModal";
import { Proposal } from "@/data/dataAdapter";
import { formatCurrencyAbbrev, formatCurrencyFull } from "@/lib/formatters";

interface VendedorData {
  nome: string;
  totalPropostas: number;
  ganhos: number;
  perdidos: number;
  abertos: number;
  valorTotal: number;
  valorGanho: number;
  valorPerdido: number;
  valorAberto: number;
  taxaConversao: number;
  atividades: number;
}

interface VendedorFunnelProps {
  data: VendedorData[];
  proposals: Proposal[];
}

export function VendedorFunnel({ data, proposals }: VendedorFunnelProps) {
  const [selectedVendedor, setSelectedVendedor] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBarClick = (vendedor: string) => {
    setSelectedVendedor(vendedor);
    setIsModalOpen(true);
  };

  const filteredProposals = useMemo(() => {
    if (!selectedVendedor) return [];
    return proposals.filter(p => p.representante === selectedVendedor);
  }, [selectedVendedor, proposals]);

  // Prepara dados para o gráfico com VALORES (R$) por status
  const chartData = useMemo(() => {
    return data.map(v => ({
      nome: v.nome,
      aberto: v.valorAberto,
      ganho: v.valorGanho,
      perdido: v.valorPerdido,
      total: v.valorTotal
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = data.find(d => d.nome === label);
      return (
        <div className="rounded-xl border border-border bg-card p-4 shadow-xl">
          <p className="font-semibold text-foreground mb-3 text-base">{label}</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Em Aberto:</span>
              <span className="font-medium text-info">{formatCurrencyFull(item?.valorAberto || 0)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Ganhos:</span>
              <span className="font-medium text-success">{formatCurrencyFull(item?.valorGanho || 0)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Perdidos:</span>
              <span className="font-medium text-destructive">{formatCurrencyFull(item?.valorPerdido || 0)}</span>
            </div>
            <div className="border-t border-border pt-2 mt-3">
              <div className="flex justify-between gap-6">
                <span className="font-medium text-foreground">Total:</span>
                <span className="font-bold text-foreground">{formatCurrencyFull(item?.valorTotal || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-6 shadow-card opacity-0 animate-fade-up" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
        <div className="mb-6">
          <h3 className="text-lg font-bold text-foreground">Funil por Vendedor (R$)</h3>
          <p className="text-sm text-muted-foreground">Valores por status por vendedor</p>
        </div>

        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                vertical={false}
              />
              <XAxis 
                dataKey="nome" 
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => formatCurrencyAbbrev(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36}
                formatter={(value) => (
                  <span className="text-sm text-foreground capitalize">{value}</span>
                )}
              />
              <Bar 
                dataKey="aberto" 
                name="Aberto"
                stackId="stack"
                fill="hsl(199, 89%, 48%)"
                radius={[0, 0, 0, 0]}
                cursor="pointer"
                onClick={(data) => handleBarClick(data.nome)}
              />
              <Bar 
                dataKey="ganho" 
                name="Ganho"
                stackId="stack"
                fill="hsl(142, 76%, 36%)"
                radius={[0, 0, 0, 0]}
                cursor="pointer"
                onClick={(data) => handleBarClick(data.nome)}
              />
              <Bar 
                dataKey="perdido" 
                name="Perdido"
                stackId="stack"
                fill="hsl(0, 84%, 60%)"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(data) => handleBarClick(data.nome)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resumo por vendedor */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.slice(0, 6).map((vendedor) => (
            <div 
              key={vendedor.nome}
              className="rounded-lg bg-secondary/50 border border-border/50 p-3 cursor-pointer hover:bg-secondary hover:border-primary/30 transition-all"
              onClick={() => handleBarClick(vendedor.nome)}
            >
              <p className="text-sm text-foreground font-medium truncate mb-2">{vendedor.nome}</p>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-semibold text-foreground">{formatCurrencyAbbrev(vendedor.valorTotal)}</span>
              </div>
              <div className="flex gap-2 mt-1 text-xs">
                <span className="text-info">{formatCurrencyAbbrev(vendedor.valorAberto)}</span>
                <span className="text-success">{formatCurrencyAbbrev(vendedor.valorGanho)}</span>
                <span className="text-destructive">{formatCurrencyAbbrev(vendedor.valorPerdido)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ProjectsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Projetos - ${selectedVendedor}`}
        proposals={filteredProposals}
      />
    </>
  );
}
