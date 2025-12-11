import { useMemo } from "react";
import { useGoogleSheetsData } from "@/hooks/useGoogleSheetsData";
import { adaptSheetData, getForecastData, getKPIs } from "@/data/dataAdapter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyAbbrev, formatNumber } from "@/lib/formatters";
import { TrendingUp, AlertTriangle, Target, Zap, Calendar, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function Forecast() {
  const { data: sheetData, isLoading, error } = useGoogleSheetsData();

  const { proposals, forecastData, kpis } = useMemo(() => {
    if (!sheetData?.data) return { proposals: [], forecastData: null, kpis: null };
    const proposals = adaptSheetData(sheetData.data);
    const forecastData = getForecastData(proposals);
    const kpis = getKPIs(proposals);
    return { proposals, forecastData, kpis };
  }, [sheetData]);

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Forecast</h1>
        <p className="text-muted-foreground">Previsão de receita e potência</p>
      </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <p className="text-sm text-muted-foreground">Alta Probabilidade</p>
                  <p className="text-2xl font-bold text-foreground">{forecastData.altaProbabilidade.length}</p>
                  <p className="text-xs text-muted-foreground">≥70% chance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Em Risco</p>
                  <p className="text-2xl font-bold text-foreground">{forecastData.emRisco.length}</p>
                  <p className="text-xs text-muted-foreground">&lt;30% ou +30 dias</p>
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
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="receita" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                  />
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
        </div>

        {/* Pipeline Ponderado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Pipeline Ponderado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="periodo" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatCurrencyAbbrev(v)} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'receita' ? formatCurrencyAbbrev(value) : `${formatNumber(value)} kWp`,
                    name === 'receita' ? 'Receita Prevista' : 'Potência Prevista'
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Receita" />
                <Bar dataKey="potencia" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Potência" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tabelas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alta Probabilidade */}
          <Card>
            <CardHeader>
              <CardTitle className="text-chart-3">Propostas Alta Probabilidade (≥70%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {forecastData.altaProbabilidade.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma proposta com alta probabilidade
                    <br />
                    <span className="text-xs">(Campo "Probabilidade %" não configurado no Sheets)</span>
                  </p>
                ) : (
                  forecastData.altaProbabilidade.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{p.nomeCliente}</p>
                        <p className="text-xs text-muted-foreground">{p.etapa}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-chart-3">{formatCurrencyAbbrev(p.valorProposta)}</p>
                        <p className="text-xs text-muted-foreground">{p.probabilidade}%</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Em Risco */}
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Propostas em Risco</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {forecastData.emRisco.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma proposta em risco identificada
                  </p>
                ) : (
                  forecastData.emRisco.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <div>
                        <p className="font-medium text-foreground">{p.nomeCliente}</p>
                        <p className="text-xs text-muted-foreground">{p.etapa} • {p.tempoNaEtapa} dias</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-destructive">{formatCurrencyAbbrev(p.valorProposta)}</p>
                        <p className="text-xs text-muted-foreground">{p.probabilidade}%</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
