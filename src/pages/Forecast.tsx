import { useMemo, useState } from "react";
import { useOrgFilteredProposals } from "@/hooks/useOrgFilteredProposals";
import { getForecastData } from "@/data/dataAdapter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyAbbrev, formatNumber } from "@/lib/formatters";
import { TrendingUp, Target, Calendar, RefreshCw, FileCheck, DollarSign, Zap, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { HelpButton } from "@/components/HelpButton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { PageFloatingFilter } from "@/components/filters/PageFloatingFilter";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function Forecast() {
  const { proposals: allProposals, isLoading, error, orgFilterActive } = useOrgFilteredProposals();
  const { selectedOrgName } = useOrgFilter();
  const [pipelineMode, setPipelineMode] = useState<"receita" | "potencia" | "ambos">("ambos");
  const [viewMode, setViewMode] = useState<"previsao" | "contratos">("previsao");
  const pf = useGlobalFilters();

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

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive">Erro ao carregar dados: {(error as Error)?.message}</p>
      </div>
    );
  }

  if (!forecastData) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Forecast & Contratos</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">Nenhuma proposta encontrada para o período selecionado</p>
            <p className="text-muted-foreground text-sm mt-1">Ajuste os filtros para visualizar dados</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chartData = [
    { periodo: '7 dias', receita: forecastData.forecast7, potencia: forecastData.potencia7 },
    { periodo: '14 dias', receita: forecastData.forecast14, potencia: forecastData.potencia14 },
    { periodo: '21 dias', receita: forecastData.forecast21, potencia: forecastData.potencia21 },
    { periodo: '28 dias', receita: forecastData.forecast28, potencia: forecastData.potencia28 },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Forecast</h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Previsão ponderada por etapa · Propostas vs Contratos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {orgFilterActive && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
              🏢 {selectedOrgName}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {forecastData.totalPropostasAbertas} propostas · {forecastData.totalContratos} contratos
          </Badge>
          <HelpButton moduleId="forecast" label="Ajuda do Forecast" />
        </div>
      </div>

      <PageFloatingFilter
        filters={pf.filters} hasFilters={pf.hasFilters} clearFilters={pf.clearFilters}
        setPeriodo={pf.setPeriodo} setDateFrom={pf.setDateFrom} setDateTo={pf.setDateTo}
        setTemperatura={pf.setTemperatura} setSearchTerm={pf.setSearchTerm} setEtapa={pf.setEtapa} setStatus={pf.setStatus}
        config={{ showPeriodo: true, showTemperatura: true, showSearch: true, showEtapa: true, showStatus: true, searchPlaceholder: "Buscar vendedor..." }}
      />

      {/* View Toggle */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList>
          <TabsTrigger value="previsao">📊 Receita Prevista</TabsTrigger>
          <TabsTrigger value="contratos">📝 Contratos Fechados</TabsTrigger>
        </TabsList>
      </Tabs>

      {viewMode === "previsao" ? (
        <>
          {/* KPIs Previsão */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Target className="h-4 w-4" />
                  <span className="text-xs font-medium">Forecast 30d</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrencyAbbrev(forecastData.forecast30)}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatNumber(forecastData.potencia30)} kWp · prob ≥ 70%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium">Forecast 60d</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrencyAbbrev(forecastData.forecast60)}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatNumber(forecastData.potencia60)} kWp · prob ≥ 40%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium">Forecast 90d</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrencyAbbrev(forecastData.forecast90)}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatNumber(forecastData.potencia90)} kWp · todo pipeline</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-xs font-medium">Pipeline Ponderado</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrencyAbbrev(forecastData.pipelinePonderado)}</p>
                <p className="text-xs text-muted-foreground mt-1">{forecastData.totalPropostasAbertas} propostas abertas</p>
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

          {/* Tabela por Etapa */}
          {forecastData.distribuicaoPorEtapa.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pipeline por Etapa do Funil</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Etapa</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Prob. Média</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead className="text-right">Valor Ponderado</TableHead>
                      <TableHead className="text-right">Potência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecastData.distribuicaoPorEtapa.map((row) => (
                      <TableRow key={row.etapa}>
                        <TableCell className="font-medium">{row.etapa}</TableCell>
                        <TableCell className="text-right">{row.quantidade}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={row.probabilidadeMedia >= 70 ? "default" : row.probabilidadeMedia >= 40 ? "secondary" : "outline"} className="text-xs">
                            {row.probabilidadeMedia}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrencyAbbrev(row.valor)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrencyAbbrev(row.valorPonderado)}</TableCell>
                        <TableCell className="text-right">{formatNumber(row.potencia)} kWp</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>
          {/* KPIs Contratos */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs font-medium">Receita Confirmada</span>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrencyAbbrev(forecastData.receitaConfirmada)}</p>
                <p className="text-xs text-muted-foreground mt-1">Contratos assinados</p>
              </CardContent>
            </Card>
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                  <FileCheck className="h-4 w-4" />
                  <span className="text-xs font-medium">Total Contratos</span>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{forecastData.totalContratos}</p>
                <p className="text-xs text-muted-foreground mt-1">Negócios fechados</p>
              </CardContent>
            </Card>
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                  <Zap className="h-4 w-4" />
                  <span className="text-xs font-medium">Potência Confirmada</span>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatNumber(forecastData.potenciaConfirmada)} kWp</p>
                <p className="text-xs text-muted-foreground mt-1">Instalação contratada</p>
              </CardContent>
            </Card>
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-xs font-medium">Ticket Médio</span>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrencyAbbrev(forecastData.ticketMedioContrato)}</p>
                <p className="text-xs text-muted-foreground mt-1">Valor médio por contrato</p>
              </CardContent>
            </Card>
          </div>

          {/* Comparativo Previsto vs Confirmado */}
          <Card>
            <CardHeader>
              <CardTitle>Previsto vs Confirmado</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { label: 'Receita Prevista (90d)', valor: forecastData.forecast90, tipo: 'previsto' },
                  { label: 'Receita Confirmada', valor: forecastData.receitaConfirmada, tipo: 'confirmado' },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatCurrencyAbbrev(v)} />
                  <Tooltip
                    formatter={(value: number) => formatCurrencyAbbrev(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                    <Cell fill="hsl(var(--primary))" />
                    <Cell fill="hsl(142 71% 45%)" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
