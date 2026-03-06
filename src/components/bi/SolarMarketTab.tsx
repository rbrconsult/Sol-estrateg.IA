import { Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface SolarMarketData {
  funilComercial: { etapa: string; valor: number }[];
  vendedores: {
    nome: string; totalPropostas: number; ganhos: number; perdidos: number;
    valorTotal: number; taxaConversao: number; ticketMedio: number;
  }[];
  inteligenciaProposta: {
    ticketMedio: number; cicloProposta: number; taxaConversao: number;
    valorPipeline: number; valorGanho: number; negociosAbertos: number; negociosGanhos: number;
  };
}

interface Props {
  data: SolarMarketData | null;
  isLoading: boolean;
}

function formatCurrency(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
  return `R$ ${v.toFixed(0)}`;
}

export function SolarMarketTab({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground text-center py-10">Sem dados disponíveis.</p>;
  }

  const { funilComercial, vendedores, inteligenciaProposta: ip } = data;

  return (
    <div className="space-y-6">
      {/* V9: Funil Comercial */}
      <div className="rounded-lg border bg-card border-border/50 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">Funil Comercial Completo</h3>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-4">Leads por etapa do CRM</p>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funilComercial} layout="vertical" barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis dataKey="etapa" type="category" width={140} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="valor" name="Leads" radius={[0, 4, 4, 0]}>
                {funilComercial.map((_, i) => (
                  <Cell key={i} fill={`hsl(var(--chart-${(i % 5) + 1}))`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* V11: Inteligência de Proposta (KPIs) */}
      <div className="rounded-lg border bg-card border-border/50 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">V11 — Inteligência de Proposta</h3>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-4">Métricas de negócios</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-extrabold tabular-nums text-foreground">{formatCurrency(ip.ticketMedio)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ticket Médio</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold tabular-nums text-foreground">{ip.cicloProposta}d</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ciclo Proposta</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold tabular-nums text-primary">{ip.taxaConversao.toFixed(1)}%</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Conversão</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold tabular-nums text-foreground">{formatCurrency(ip.valorPipeline)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pipeline</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
          <div className="text-center">
            <p className="text-xl font-bold tabular-nums text-primary">{formatCurrency(ip.valorGanho)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Receita Ganha</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold tabular-nums text-foreground">{ip.negociosAbertos}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Abertos</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold tabular-nums text-primary">{ip.negociosGanhos}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ganhos</p>
          </div>
        </div>
      </div>

      {/* V10: Performance por Vendedor */}
      <div className="rounded-lg border bg-card border-border/50 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">V10 — Performance por Vendedor</h3>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-4">Ranking de vendas</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Vendedor</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Propostas</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Ganhos</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Conversão</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Valor Total</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Ticket Médio</th>
              </tr>
            </thead>
            <tbody>
              {vendedores.slice(0, 10).map((v, i) => (
                <tr key={i} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="py-2 px-3 text-foreground font-medium">{v.nome || '—'}</td>
                  <td className="text-right py-2 px-3 tabular-nums">{v.totalPropostas}</td>
                  <td className="text-right py-2 px-3 tabular-nums font-semibold text-primary">{v.ganhos}</td>
                  <td className="text-right py-2 px-3 tabular-nums">
                    <span className={v.taxaConversao >= 20 ? 'text-primary' : v.taxaConversao >= 10 ? 'text-warning' : 'text-destructive'}>
                      {v.taxaConversao.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-right py-2 px-3 tabular-nums">{formatCurrency(v.valorTotal)}</td>
                  <td className="text-right py-2 px-3 tabular-nums">{formatCurrency(v.ticketMedio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
