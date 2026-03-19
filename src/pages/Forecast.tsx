import { useMemo, useState } from "react";
import { useOrgFilteredProposals } from "@/hooks/useOrgFilteredProposals";
import { getForecastData } from "@/data/dataAdapter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyAbbrev, formatNumber } from "@/lib/formatters";
import { TrendingUp, Target, Calendar, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { HelpButton } from "@/components/HelpButton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { usePageFilters, PageFloatingFilter } from "@/components/filters/PageFloatingFilter";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function Forecast() {
  const { proposals: allProposals, isLoading, error, orgFilterActive } = useOrgFilteredProposals();
  const { selectedOrgName } = useOrgFilter();
  const [pipelineMode, setPipelineMode] = useState<"receita" | "potencia" | "ambos">("ambos");
  const pf = usePageFilters({ showPeriodo: true, showTemperatura: true, showSearch: true });

  const filteredProposals = useMemo(() => pf.filterProposals(allProposals), [allProposals, pf.filterProposals]);

  const forecastData = useMemo(() => {
    if (filteredProposals.length === 0) return null;
    return getForecastData(filteredProposals);
  }, [filteredProposals]);

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
        <div className="flex items-center gap-2">
          {orgFilterActive && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
              🏢 {selectedOrgName}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {filteredProposals.length} propostas
          </Badge>
          <HelpButton moduleId="forecast" label="Ajuda do Forecast" />
        </div>
      </div>

      <PageFloatingFilter
        filters={pf.filters} hasFilters={pf.hasFilters} clearFilters={pf.clearFilters}
        setPeriodo={pf.setPeriodo} setDateFrom={pf.setDateFrom} setDateTo={pf.setDateTo}
        setTemperatura={pf.setTemperatura} setSearchTerm={pf.setSearchTerm}
        config={{ showPeriodo: true, showTemperatura: true, showSearch: true, searchPlaceholder: "Buscar vendedor..." }}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              <span className="text-xs font-medium">Forecast 30d</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrencyAbbrev(forecastData.forecast30)}</p>
            <p className="text-xs text-muted-foreground mt-1">{formatNumber(forecastData.potencia30)} kWp</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Forecast 60d</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrencyAbbrev(forecastData.forecast60)}</p>
            <p className="text-xs text-muted-foreground mt-1">{formatNumber(forecastData.potencia60)} kWp</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium">Forecast 90d</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrencyAbbrev(forecastData.forecast90)}</p>
            <p className="text-xs text-muted-foreground mt-1">{formatNumber(forecastData.potencia90)} kWp</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Pipeline Ponderado</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrencyAbbrev(forecastData.pipelinePonderado)}</p>
            <p className="text-xs text-muted-foreground mt-1">Valor ponderado</p>
          </CardContent>
        </Card>
      </div>

      {/* Mode selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground font-medium">Visualizar:</span>
        <Tabs value={pipelineMode} onValueChange={(v) => setPipelineMode(v as any)}>
          <TabsList>
            <TabsTrigger value="receita">R$ Receita</TabsTrigger>
            <TabsTrigger value="potencia">kWp Potência</TabsTrigger>
            <TabsTrigger value="ambos">Ambos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Projeção por Período</CardTitle>
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
                    name === 'receita' ? 'Receita' : 'Potência'
                  ]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                {(pipelineMode === "receita" || pipelineMode === "ambos") && (
                  <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="receita" />
                )}
                {(pipelineMode === "potencia" || pipelineMode === "ambos") && (
                  <Bar dataKey="potencia" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="potencia" />
                )}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Probabilidade</CardTitle>
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
                  label={({ faixa, percent }) => `${faixa} ${(percent * 100).toFixed(0)}%`}
                >
                  {forecastData.distribuicao.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip
                  formatter={(value: number) => formatCurrencyAbbrev(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>