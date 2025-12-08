import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';
import { ProjectsModal } from "./ProjectsModal";
import { Proposal } from "@/data/dataAdapter";

interface VendedorData {
  nome: string;
  totalPropostas: number;
  ganhos: number;
  perdidos: number;
  abertos: number;
  valorTotal: number;
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const handleBarClick = (vendedor: string) => {
    setSelectedVendedor(vendedor);
    setIsModalOpen(true);
  };

  const filteredProposals = useMemo(() => {
    if (!selectedVendedor) return [];
    return proposals.filter(p => p.representante === selectedVendedor);
  }, [selectedVendedor, proposals]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = data.find(d => d.nome === label);
      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-success">Ganhos: {item?.ganhos}</p>
            <p className="text-destructive">Perdidos: {item?.perdidos}</p>
            <p className="text-primary">Em Aberto: {item?.abertos}</p>
            <p className="border-t border-border pt-1 mt-2 font-medium">
              Taxa: {item?.taxaConversao.toFixed(1)}%
            </p>
            <p className="font-semibold text-foreground">
              Valor: {formatCurrency(item?.valorTotal || 0)}
            </p>
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
          <h3 className="text-lg font-semibold text-foreground">Funil por Vendedor</h3>
          <p className="text-sm text-muted-foreground">Taxa de conversão e status por vendedor</p>
        </div>

        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
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
                height={60}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36}
                formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
              />
              <Bar 
                dataKey="ganhos" 
                name="Ganhos"
                stackId="stack"
                fill="hsl(152, 60%, 45%)"
                radius={[0, 0, 0, 0]}
                cursor="pointer"
                onClick={(data) => handleBarClick(data.nome)}
              />
              <Bar 
                dataKey="abertos" 
                name="Em Aberto"
                stackId="stack"
                fill="hsl(215, 60%, 50%)"
                radius={[0, 0, 0, 0]}
                cursor="pointer"
                onClick={(data) => handleBarClick(data.nome)}
              />
              <Bar 
                dataKey="perdidos" 
                name="Perdidos"
                stackId="stack"
                fill="hsl(0, 72%, 51%)"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(data) => handleBarClick(data.nome)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Taxa de conversão por vendedor */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {data.slice(0, 5).map((vendedor) => (
            <div 
              key={vendedor.nome}
              className="rounded-lg bg-muted/30 p-2 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleBarClick(vendedor.nome)}
            >
              <p className="text-xs text-muted-foreground truncate">{vendedor.nome}</p>
              <p className={`font-bold ${
                vendedor.taxaConversao >= 20 ? 'text-success' : 
                vendedor.taxaConversao >= 10 ? 'text-warning' : 'text-destructive'
              }`}>
                {vendedor.taxaConversao.toFixed(1)}%
              </p>
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
