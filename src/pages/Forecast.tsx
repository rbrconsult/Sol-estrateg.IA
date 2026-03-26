import { useMemo, useState } from "react";
import { useOrgFilteredProposals } from "@/hooks/useOrgFilteredProposals";
import { getForecastData, Proposal } from "@/data/dataAdapter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyAbbrev, formatCurrencyFull, formatNumber, formatPercent } from "@/lib/formatters";
import { TrendingUp, Target, Calendar, RefreshCw, FileCheck, DollarSign, Zap, BarChart3, Users, CheckCircle2, Clock, ArrowRight, Percent, X, Phone, Mail, MapPin, User, Hash, Thermometer, MessageSquare } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { HelpButton } from "@/components/HelpButton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { PageFloatingFilter } from "@/components/filters/PageFloatingFilter";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function Forecast() {
  const { proposals: allProposals, isLoading, error, orgFilterActive } = useOrgFilteredProposals();
  const { selectedOrgName } = useOrgFilter();
  const [pipelineMode, setPipelineMode] = useState<"receita" | "potencia" | "ambos">("ambos");
  const [viewMode, setViewMode] = useState<"previsao" | "contratos">("previsao");
  const [selectedContrato, setSelectedContrato] = useState<Proposal | null>(null);
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
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Target className="h-4 w-4" />
                  <span className="text-xs font-medium">Forecast 7d</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrencyAbbrev(forecastData.forecast7)}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatNumber(forecastData.potencia7)} kWh · prob ≥ 90%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium">Forecast 14d</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrencyAbbrev(forecastData.forecast14)}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatNumber(forecastData.potencia14)} kWh · prob ≥ 70%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium">Forecast 21d</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrencyAbbrev(forecastData.forecast21)}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatNumber(forecastData.potencia21)} kWh · prob ≥ 40%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium">Forecast 28d</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrencyAbbrev(forecastData.forecast28)}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatNumber(forecastData.potencia28)} kWh · todo pipeline</p>
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
                <TabsTrigger value="potencia">kWh Potência</TabsTrigger>
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
                    {(pipelineMode === "receita" || pipelineMode === "ambos") && (
                      <YAxis yAxisId="receita" stroke="hsl(var(--primary))" tickFormatter={(v) => formatCurrencyAbbrev(v)} />
                    )}
                    {(pipelineMode === "potencia" || pipelineMode === "ambos") && (
                      <YAxis yAxisId="potencia" orientation="right" stroke="hsl(var(--chart-2))" tickFormatter={(v) => `${formatNumber(v)} kWh`} />
                    )}
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        name === 'receita' ? formatCurrencyAbbrev(value) : `${formatNumber(value)} kWh`,
                        name === 'receita' ? 'R$ Receita' : 'kWh Potência'
                      ]}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend formatter={(value) => value === 'receita' ? 'R$ Receita' : 'kWh Potência'} />
                    {(pipelineMode === "receita" || pipelineMode === "ambos") && (
                      <Bar yAxisId="receita" dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="receita" />
                    )}
                    {(pipelineMode === "potencia" || pipelineMode === "ambos") && (
                      <Bar yAxisId="potencia" dataKey="potencia" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="potencia" />
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
                      formatter={(value: number) => `R$ ${formatCurrencyAbbrev(value)}`}
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
                        <TableCell className="text-right">{formatNumber(row.potencia)} kWh</TableCell>
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
          {/* Funil: Contrato → Receita Confirmada */}

          {/* Row 1: Funil de Conversão */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-medium">Leads Qualificados</span>
                </div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{forecastData.totalLeadsQualificados}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrencyAbbrev(forecastData.valorLeadsQualificados)} total
                </p>
              </CardContent>
            </Card>

            <Card className="border-indigo-500/30 bg-indigo-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                  <FileCheck className="h-4 w-4" />
                  <span className="text-xs font-medium">Propostas Geradas</span>
                </div>
                <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{forecastData.totalPropostasGeradas}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrencyAbbrev(forecastData.valorPropostasGeradas)} · TM {formatCurrencyAbbrev(forecastData.ticketMedioPropostas)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                  <ArrowRight className="h-4 w-4" />
                  <span className="text-xs font-medium">Negócios Iniciados</span>
                </div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{forecastData.totalNegociosIniciados}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrencyAbbrev(forecastData.valorNegociosIniciados)} · TM {formatCurrencyAbbrev(forecastData.ticketMedioIniciados)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-medium">Propostas Aceitas</span>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{forecastData.totalPropostasAceitas}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrencyAbbrev(forecastData.valorPropostasAceitas)} · TM {formatCurrencyAbbrev(forecastData.ticketMedioAceitas)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Receita Confirmada (Cobrança) + Indicadores */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-emerald-600/30 bg-emerald-600/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs font-medium">Receita Confirmada</span>
                </div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrencyAbbrev(forecastData.receitaConfirmada)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {forecastData.totalCobranca} Aceitas · TM {formatCurrencyAbbrev(forecastData.ticketMedioCobranca)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-600/30 bg-emerald-600/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                  <Zap className="h-4 w-4" />
                  <span className="text-xs font-medium">Potência Confirmada</span>
                </div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatNumber(forecastData.potenciaConfirmada)} kWh</p>
                <p className="text-xs text-muted-foreground mt-1">Somente Propostas Aceitas</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Percent className="h-4 w-4" />
                  <span className="text-xs font-medium">Taxa de Conversão</span>
                </div>
                <p className="text-2xl font-bold">{formatPercent(forecastData.taxaConversao)}</p>
                <p className="text-xs text-muted-foreground mt-1">Aceitas / Iniciados</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-medium">SLA Fechamento</span>
                </div>
                <p className="text-2xl font-bold">{forecastData.slaFechamentoDias > 0 ? `${Math.round(forecastData.slaFechamentoDias)}d` : '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">Proposta → Aceite (média)</p>
              </CardContent>
            </Card>
          </div>

          {/* Funil Visual */}
          <Card>
            <CardHeader>
              <CardTitle>Funil: Qualificação → Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { etapa: 'Qualificados', quantidade: forecastData.totalLeadsQualificados, valor: forecastData.valorLeadsQualificados },
                  { etapa: 'Propostas', quantidade: forecastData.totalPropostasGeradas, valor: forecastData.valorPropostasGeradas },
                  { etapa: 'Negócios', quantidade: forecastData.totalNegociosIniciados, valor: forecastData.valorNegociosIniciados },
                  { etapa: 'Aceitas', quantidade: forecastData.totalPropostasAceitas, valor: forecastData.valorPropostasAceitas },
                  { etapa: 'Cobrança', quantidade: forecastData.totalCobranca, valor: forecastData.receitaConfirmada },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="etapa" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="qtd" stroke="hsl(var(--primary))" />
                  <YAxis yAxisId="valor" orientation="right" tickFormatter={(v) => formatCurrencyAbbrev(v)} stroke="hsl(var(--chart-2))" />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'quantidade' ? value : formatCurrencyAbbrev(value),
                      name === 'quantidade' ? 'Quantidade' : 'R$ Valor'
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend formatter={(value) => value === 'quantidade' ? 'Quantidade' : 'R$ Valor'} />
                  <Bar yAxisId="qtd" dataKey="quantidade" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="quantidade" />
                  <Bar yAxisId="valor" dataKey="valor" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="valor" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tabela de Contratos */}
          <Card>
            <CardHeader>
              <CardTitle>Contratos & Cobrança</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const ETAPAS_COBRANCA = new Set(['COBRANÇA', 'COBRANCA']);
                const contratos = filteredProposals
                  .filter(p => p.status === 'Ganho')
                  .sort((a, b) => b.valorProposta - a.valorProposta);
                if (contratos.length === 0) {
                  return <p className="text-sm text-muted-foreground py-4 text-center">Nenhum contrato fechado no período</p>;
                }

                const isGanhoConfirmado = (_p: typeof contratos[0]) => true; // status_proposta=5 é o único critério

                const ganhoCount = contratos.length;
                const cobrancaCount = contratos.filter(p => ETAPAS_COBRANCA.has((p.etapa || '').toUpperCase())).length;

                return (
                  <>
                    <div className="flex gap-3 mb-4 text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
                        Ganho Confirmado ({ganhoCount})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" />
                        Em Cobrança ({cobrancaCount})
                      </span>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>ID Projeto</TableHead>
                          <TableHead>Projeto</TableHead>
                          <TableHead>Responsável</TableHead>
                          <TableHead>Etapa</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="text-right">Potência</TableHead>
                          <TableHead className="text-right">Data Proposta</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contratos.map((c) => {
                          const confirmado = isGanhoConfirmado(c);
                          const emCobranca = ETAPAS_COBRANCA.has((c.etapa || '').toUpperCase());
                          const clienteName = c.makeNome || c.nomeCliente || '—';
                          const projetoName = c.nomeProposta || c.projetoId || '—';
                          return (
                            <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelectedContrato(c)}>
                              <TableCell>
                                {confirmado ? (
                                  <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 text-xs">Ganho</Badge>
                                ) : emCobranca ? (
                                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs">Cobrança</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">{c.etapa}</Badge>
                                )}
                              </TableCell>
                              <TableCell className="font-medium max-w-[180px] truncate" title={clienteName}>{clienteName}</TableCell>
                              <TableCell className="text-muted-foreground text-xs" title={c.projetoId || ''}>{c.projetoId || '—'}</TableCell>
                              <TableCell className="max-w-[200px] truncate text-muted-foreground text-xs" title={projetoName}>{projetoName}</TableCell>
                              <TableCell>{c.responsavel || '—'}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">{c.etapa}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-semibold">{formatCurrencyAbbrev(c.valorProposta)}</TableCell>
                              <TableCell className="text-right">{c.potenciaSistema > 0 ? `${formatNumber(c.potenciaSistema)} kWh` : '—'}</TableCell>
                              <TableCell className="text-right text-muted-foreground text-xs">
                                {c.dataCriacaoProposta ? new Date(c.dataCriacaoProposta).toLocaleDateString('pt-BR') : '—'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Previsto vs Confirmado</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { label: 'Receita Prevista (28d)', valor: forecastData.forecast28 },
                  { label: 'Receita Confirmada', valor: forecastData.receitaConfirmada },
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
                    <Cell fill="hsl(var(--chart-2))" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selectedContrato} onOpenChange={(open) => !open && setSelectedContrato(null)}>
        <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto">
          {selectedContrato && (() => {
            const c = selectedContrato;
            const clienteName = c.makeNome || c.nomeCliente || '—';
            const DetailRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
              <div className="flex items-start gap-3 py-2">
                <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium break-words">{value || '—'}</p>
                </div>
              </div>
            );
            return (
              <>
                <SheetHeader>
                  <SheetTitle className="text-left text-lg">{clienteName}</SheetTitle>
                  <p className="text-xs text-muted-foreground">Projeto #{c.projetoId || '—'} · {c.nomeProposta || '—'}</p>
                </SheetHeader>

                <div className="mt-4 space-y-1">
                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 text-xs">
                      {c.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{c.etapa}</Badge>
                    {c.faseSM && <Badge variant="secondary" className="text-xs">Fase: {c.faseSM}</Badge>}
                    {c.temperatura && (
                      <Badge variant="outline" className="text-xs">
                        {c.temperatura === 'QUENTE' ? '🔥' : c.temperatura === 'MORNO' ? '🌤️' : '❄️'} {c.temperatura}
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  {/* Financeiro */}
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-3 pb-1">Financeiro</h4>
                  <DetailRow icon={DollarSign} label="Valor da Proposta" value={formatCurrencyFull(c.valorProposta)} />
                  <DetailRow icon={Zap} label="Potência do Sistema" value={c.potenciaSistema > 0 ? `${formatNumber(c.potenciaSistema)} kWh` : '—'} />
                  <DetailRow icon={Percent} label="Probabilidade" value={`${c.probabilidade}%`} />

                  <Separator />

                  {/* Contato */}
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-3 pb-1">Contato</h4>
                  <DetailRow icon={Phone} label="Telefone" value={c.clienteTelefone} />
                  <DetailRow icon={Mail} label="Email" value={c.makeEmail || c.clienteEmail || '—'} />
                  <DetailRow icon={MapPin} label="Cidade" value={c.makeCidade || '—'} />
                  {c.makeValorConta && <DetailRow icon={Zap} label="Valor da Conta" value={c.makeValorConta} />}
                  {c.makeImovel && <DetailRow icon={Hash} label="Imóvel" value={c.makeImovel} />}

                  <Separator />

                  {/* Responsáveis */}
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-3 pb-1">Responsáveis</h4>
                  <DetailRow icon={User} label="Responsável (SDR)" value={c.responsavel} />
                  <DetailRow icon={User} label="Representante (Closer)" value={c.representante} />

                  <Separator />

                  {/* Datas */}
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-3 pb-1">Datas</h4>
                  <DetailRow icon={Calendar} label="Criação do Projeto" value={c.dataCriacaoProjeto ? new Date(c.dataCriacaoProjeto).toLocaleDateString('pt-BR') : '—'} />
                  <DetailRow icon={Calendar} label="Criação da Proposta" value={c.dataCriacaoProposta ? new Date(c.dataCriacaoProposta).toLocaleDateString('pt-BR') : '—'} />
                  <DetailRow icon={Clock} label="SLA Proposta" value={c.slaProposta > 0 ? `${c.slaProposta} dias` : '—'} />
                  <DetailRow icon={Clock} label="Tempo na Etapa" value={c.tempoNaEtapa > 0 ? `${c.tempoNaEtapa} dias` : '—'} />

                  {/* Make enrichment */}
                  {(c.makeRobo || c.makeStatusResposta || c.makeTotalMensagens) && (
                    <>
                      <Separator />
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-3 pb-1">Interações (SOL)</h4>
                      {c.makeRobo && <DetailRow icon={MessageSquare} label="Robô" value={c.makeRobo} />}
                      {c.makeStatusResposta && <DetailRow icon={MessageSquare} label="Status Resposta" value={c.makeStatusResposta} />}
                      {c.makeTotalMensagens != null && <DetailRow icon={MessageSquare} label="Total Mensagens" value={String(c.makeTotalMensagens)} />}
                      {c.makeMensagensRecebidas != null && <DetailRow icon={MessageSquare} label="Mensagens Recebidas" value={String(c.makeMensagensRecebidas)} />}
                      {c.makeSentimento && <DetailRow icon={MessageSquare} label="Sentimento" value={c.makeSentimento} />}
                      {c.makeInteresse && <DetailRow icon={MessageSquare} label="Interesse" value={c.makeInteresse} />}
                    </>
                  )}

                  {/* Etiquetas */}
                  {c.etiquetas && (
                    <>
                      <Separator />
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-3 pb-1">Etiquetas</h4>
                      <div className="flex flex-wrap gap-1.5 py-1">
                        {c.etiquetas.split(',').map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{tag.trim()}</Badge>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
