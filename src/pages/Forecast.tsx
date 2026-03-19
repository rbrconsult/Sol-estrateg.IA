import { useMemo, useState } from "react";
import { useEnrichedProposals } from "@/hooks/useEnrichedProposals";
import { getForecastData } from "@/data/dataAdapter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyAbbrev, formatNumber } from "@/lib/formatters";
import { TrendingUp, Target, Calendar, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { HelpButton } from "@/components/HelpButton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function Forecast() {
  const { proposals: allProposals, isLoading, error } = useEnrichedProposals();
  const [pipelineMode, setPipelineMode] = useState<"receita" | "potencia" | "ambos">("ambos");

  const forecastData = useMemo(() => {
    if (allProposals.length === 0) return null;
    return getForecastData(allProposals);
  }, [allProposals]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !forecastData) {
    return (
      <div className="p-6">
        <p className="text-destructive">Erro ao carregar dados</p>
      </div>
    );
  }

  const chartData = [
    { periodo: '30 dias', receita: forecastData.forecast30, potencia: forecastData.potencia30 },
    { periodo: '60 dias', receita: forecastData.forecast60, potencia: forecastData.potencia60 },
    { periodo: '90 dias', receita: forecastData.forecast90, potencia: forecastData.potencia90 },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Forecast</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Previsão de receita e potência baseada em leads em prospecção</p>
        </div>
        <HelpButton moduleId="forecast" label="Ajuda do Forecast" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita 30 dias</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrencyAbbrev(forecastData.forecast30)}</p>
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
                <p className="text-sm text-muted-foreground">Receita 90 dias</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrencyAbbrev(forecastData.forecast90)}</p>
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
                <p className="text-sm text-muted-foreground">Potência 30d</p>
                <p className="text-2xl font-bold text-foreground">{formatNumber(forecastData.potencia30)} kWp</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-chart-4/10 to-chart-4/5 border-chart-4/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-4/20 rounded-lg">
                <Target className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Potência 90d</p>
                <p className="text-2xl font-bold text-foreground">{formatNumber(forecastData.potencia90)} kWp</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Linha de Previsão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Linha de Previsão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="periodo" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatCurrencyAbbrev(v)} />
                <Tooltip
                  formatter={(value: number) => [formatCurrencyAbbrev(value), 'Receita']}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="receita" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Probabilidade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Distribuição por Probabilidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={forecastData.distribuicao}
                  dataKey="valor"
                  nameKey="faixa"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ faixa, percent }) => `${faixa}: ${(percent * 100).toFixed(0)}%`}
                >
                  {forecastData.distribuicao.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [formatCurrencyAbbrev(value), 'Valor']}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Ponderado with micro-filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Pipeline Ponderado
            </CardTitle>
            <Tabs value={pipelineMode} onValueChange={(v) => setPipelineMode(v as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="ambos" className="text-xs h-6 px-2">R$ + kWp</TabsTrigger>
                <TabsTrigger value="receita" className="text-xs h-6 px-2">R$</TabsTrigger>
                <TabsTrigger value="potencia" className="text-xs h-6 px-2">kWp</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="periodo" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => pipelineMode === "potencia" ? `${formatNumber(v)} kWp` : formatCurrencyAbbrev(v)} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'receita' ? formatCurrencyAbbrev(value) : `${formatNumber(value)} kWp`,
                  name === 'receita' ? 'Receita Prevista' : 'Potência Prevista'
                ]}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
              {(pipelineMode === "receita" || pipelineMode === "ambos") && (
                <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Receita" />
              )}
              {(pipelineMode === "potencia" || pipelineMode === "ambos") && (
                <Bar dataKey="potencia" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Potência" />
              )}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
