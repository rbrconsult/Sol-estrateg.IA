import { useMemo } from "react";
import { useEnrichedProposals } from "@/hooks/useEnrichedProposals";
import { getVendedorPerformance, getPerdasData } from "@/data/dataAdapter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyAbbrev, formatNumber } from "@/lib/formatters";
import { Users, TrendingUp, DollarSign, XCircle, RefreshCw } from "lucide-react";
import { HelpButton } from "@/components/HelpButton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function Vendedores() {
  const { proposals: allProposals, isLoading, error } = useEnrichedProposals();

  const { vendedorPerformance, perdasData } = useMemo(() => {
    if (allProposals.length === 0) return { vendedorPerformance: [], perdasData: null };
    const vendedorPerformance = getVendedorPerformance(allProposals);
    const perdasData = getPerdasData(allProposals);
    return { vendedorPerformance, perdasData };
  }, [allProposals]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive">Erro ao carregar dados</p>
      </div>
    );
  }

  const maxValor = Math.max(...vendedorPerformance.map(v => v.valorTotal), 1);

  // Dados para gráfico de barras
  const chartData = vendedorPerformance.slice(0, 10).map(v => ({
    nome: v.nome.split(' ')[0], // Primeiro nome
    ganho: v.valorGanho,
    perdido: v.valorPerdido,
    aberto: v.valorAberto,
  }));

  // Dados para gráfico de conversão
  const conversaoData = vendedorPerformance.slice(0, 10).map(v => ({
    nome: v.nome.split(' ')[0],
    conversao: v.taxaConversao,
    ticketMedio: v.ticketMedio / 1000, // Em milhares
  }));

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Vendedores</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Análise detalhada por vendedor</p>
        </div>
        <HelpButton moduleId="vendedores" label="Ajuda de Vendedores" />
      </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Receita por Vendedor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Receita por Vendedor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatCurrencyAbbrev(v)} />
                  <YAxis dataKey="nome" type="category" stroke="hsl(var(--muted-foreground))" width={80} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [formatCurrencyAbbrev(value), name === 'ganho' ? 'Ganho' : name === 'perdido' ? 'Perdido' : 'Em Aberto']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="ganho" stackId="a" fill="hsl(var(--chart-2))" name="Ganho" />
                  <Bar dataKey="aberto" stackId="a" fill="hsl(var(--primary))" name="Em Aberto" />
                  <Bar dataKey="perdido" stackId="a" fill="hsl(var(--destructive))" name="Perdido" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Conversão por Vendedor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Taxa de Conversão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={conversaoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="nome" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}%`} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Conversão']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="conversao" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabela Detalhada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Tabela de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-semibold text-muted-foreground">Vendedor</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">Propostas</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">Ganhas</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">Perdidas</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">Valor Total</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">Ticket Médio</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">Conversão</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">Tempo Resposta</th>
                    <th className="p-3 font-semibold text-muted-foreground">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {vendedorPerformance.map((v, index) => (
                    <tr key={v.nome} className="border-b border-border/50 hover:bg-secondary/30">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-warning text-warning-foreground' :
                            index === 1 ? 'bg-muted text-muted-foreground' :
                            index === 2 ? 'bg-orange-600 text-white' :
                            'bg-secondary text-secondary-foreground'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="font-medium">{v.nome}</span>
                        </div>
                      </td>
                      <td className="text-right p-3">{v.totalPropostas}</td>
                      <td className="text-right p-3 text-chart-2">{v.ganhos}</td>
                      <td className="text-right p-3 text-destructive">{v.perdidos}</td>
                      <td className="text-right p-3 font-semibold">{formatCurrencyAbbrev(v.valorTotal)}</td>
                      <td className="text-right p-3">{formatCurrencyAbbrev(v.ticketMedio)}</td>
                      <td className="text-right p-3">
                        <Badge variant={v.taxaConversao >= 30 ? "default" : v.taxaConversao >= 15 ? "secondary" : "destructive"}>
                          {v.taxaConversao.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="text-right p-3">
                        {v.tempoMedioResposta > 0 ? `${v.tempoMedioResposta} dias` : '-'}
                      </td>
                      <td className="p-3 w-32">
                        <Progress value={(v.valorTotal / maxValor) * 100} className="h-2" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Perdas por Vendedor */}
        {perdasData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                Perdas por Vendedor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {perdasData.porVendedor.slice(0, 6).map((v) => (
                  <div key={v.vendedor} className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                    <p className="font-medium">{v.vendedor}</p>
                    <div className="flex justify-between mt-2">
                      <span className="text-sm text-muted-foreground">{v.quantidade} perdas</span>
                      <span className="font-bold text-destructive">{formatCurrencyAbbrev(v.valor)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
