import { useMemo } from "react";
import { useCommercialProposals } from "@/hooks/useCommercialProposals";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { PageFloatingFilter } from "@/components/filters/PageFloatingFilter";
import { getOrigensData } from "@/data/dataAdapter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyAbbrev, safeToFixed } from "@/lib/formatters";
import { Target, TrendingUp, DollarSign, Clock, Users, RefreshCw } from "lucide-react";
import { HelpButton } from "@/components/HelpButton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--destructive))'];

export default function Origens() {
  const { proposals: allProposals, isLoading, error } = useCommercialProposals();
  const gf = useGlobalFilters();
  const filteredProposals = useMemo(() => gf.filterProposals(allProposals), [allProposals, gf.filterProposals]);

  const origensData = useMemo(() => {
    if (filteredProposals.length === 0) return [];
    return getOrigensData(filteredProposals);
  }, [filteredProposals]);

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

  const totalLeads = origensData.reduce((acc, o) => acc + o.totalLeads, 0);
  const totalGanhos = origensData.reduce((acc, o) => acc + o.ganhos, 0);
  const valorTotal = origensData.reduce((acc, o) => acc + o.valorTotal, 0);
  const hasRealData = origensData.length > 0 && !origensData.every(o => o.origem === 'Não informado');
  const maxLeads = Math.max(...origensData.map(o => o.totalLeads), 1);

  // Dados para pizza
  const pieData = origensData.map(o => ({
    name: o.origem,
    value: o.totalLeads
  }));

  // Dados para conversão
  const conversaoData = origensData.map(o => ({
    origem: o.origem.length > 15 ? o.origem.substring(0, 15) + '...' : o.origem,
    conversao: o.taxaConversao,
    leads: o.totalLeads
  }));

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageFloatingFilter
        filters={gf.filters} hasFilters={gf.hasFilters} clearFilters={gf.clearFilters}
        setPeriodo={gf.setPeriodo} setDateFrom={gf.setDateFrom} setDateTo={gf.setDateTo}
        setTemperatura={gf.setTemperatura} setSearchTerm={gf.setSearchTerm} setEtapa={gf.setEtapa} setStatus={gf.setStatus}
        config={{ showPeriodo: true, showTemperatura: true, showSearch: true, showEtapa: true, showStatus: true }}
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Origens</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Análise de canais de aquisição</p>
        </div>
        <HelpButton moduleId="origens" label="Ajuda de Origens" />
      </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Leads</p>
                  <p className="text-2xl font-bold text-foreground">{totalLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-chart-2/10 to-chart-2/5 border-chart-2/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-chart-2/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Leads Convertidos</p>
                  <p className="text-2xl font-bold text-foreground">{totalGanhos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-chart-3/10 to-chart-3/5 border-chart-3/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-chart-3/20 rounded-lg">
                  <Target className="h-5 w-5 text-chart-3" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxa Geral</p>
                  <p className="text-2xl font-bold text-foreground">
                    {totalLeads > 0 ? ((totalGanhos / totalLeads) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrencyAbbrev(valorTotal)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {!hasRealData && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Target className="h-12 w-12 text-warning opacity-50" />
                <div>
                  <h3 className="font-semibold text-warning">Campo "Origem do Lead" não configurado</h3>
                  <p className="text-muted-foreground">
                    Para análise de origem dos leads, adicione a coluna "Origem do Lead" (coluna Q) no Google Sheets.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuição por Origem */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Leads por Origem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [value, 'Leads']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Conversão por Origem */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Conversão por Canal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={conversaoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="origem" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}%`} />
                  <Tooltip 
                    formatter={(value) => [`${safeToFixed(value, 1)}%`, 'Conversão']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="conversao" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabela Detalhada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Performance por Origem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-semibold text-muted-foreground">Origem</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">Leads</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">Ganhos</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">Conversão</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">Valor Total</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">Valor Ganho</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">Ticket Médio</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">Tempo Fechamento</th>
                    <th className="p-3 font-semibold text-muted-foreground">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {origensData.map((o, index) => (
                    <tr key={o.origem} className="border-b border-border/50 hover:bg-secondary/30">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{o.origem}</span>
                        </div>
                      </td>
                      <td className="text-right p-3">{o.totalLeads}</td>
                      <td className="text-right p-3 text-chart-2">{o.ganhos}</td>
                      <td className="text-right p-3">
                        <Badge variant={o.taxaConversao >= 30 ? "default" : o.taxaConversao >= 15 ? "secondary" : "destructive"}>
                          {o.taxaConversao.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="text-right p-3">{formatCurrencyAbbrev(o.valorTotal)}</td>
                      <td className="text-right p-3 text-chart-2 font-semibold">{formatCurrencyAbbrev(o.valorGanho)}</td>
                      <td className="text-right p-3">{formatCurrencyAbbrev(o.ticketMedio)}</td>
                      <td className="text-right p-3">
                        {o.tempoMedioFechamento > 0 ? (
                          <span className="flex items-center justify-end gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {o.tempoMedioFechamento} dias
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-3 w-32">
                        <Progress value={(o.totalLeads / maxLeads) * 100} className="h-2" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
