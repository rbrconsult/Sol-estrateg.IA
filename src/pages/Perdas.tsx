import { useMemo } from "react";
import { useGoogleSheetsData } from "@/hooks/useGoogleSheetsData";
import { adaptSheetData, getPerdasData } from "@/data/dataAdapter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyAbbrev } from "@/lib/formatters";
import { XCircle, TrendingDown, AlertTriangle, Target, Users, Lightbulb, RefreshCw } from "lucide-react";
import { HelpButton } from "@/components/HelpButton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const COLORS = ['hsl(var(--destructive))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--primary))'];

export default function Perdas() {
  const { data: sheetData, isLoading, error } = useGoogleSheetsData();

  const perdasData = useMemo(() => {
    if (!sheetData?.data) return null;
    const proposals = adaptSheetData(sheetData.data);
    return getPerdasData(proposals);
  }, [sheetData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !perdasData) {
    return (
      <div className="p-6">
        <p className="text-destructive">Erro ao carregar dados</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Perdas</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Entenda os motivos e otimize o processo comercial</p>
        </div>
        <HelpButton moduleId="perdas" label="Ajuda de Perdas" />
      </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/20 rounded-lg">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Perdas</p>
                  <p className="text-2xl font-bold text-destructive">{perdasData.totalPerdidos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/20 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Perdido</p>
                  <p className="text-2xl font-bold text-destructive">{formatCurrencyAbbrev(perdasData.valorTotalPerdido)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Principal Motivo</p>
                  <p className="text-lg font-bold text-foreground truncate">{perdasData.principalMotivo}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-chart-2/10 to-chart-2/5 border-chart-2/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-chart-2/20 rounded-lg">
                  <Target className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Etapa Crítica</p>
                  <p className="text-lg font-bold text-foreground truncate">{perdasData.etapaQueMaisPerde}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights Automáticos */}
        <Alert className="border-primary/50 bg-primary/5">
          <Lightbulb className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary">Insights Automáticos</AlertTitle>
          <AlertDescription className="text-foreground">
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Principal motivo de perda: <strong>{perdasData.principalMotivo}</strong> ({perdasData.porMotivo[0]?.quantidade || 0} ocorrências)</li>
              <li>Etapa que mais perde: <strong>{perdasData.etapaQueMaisPerde}</strong> ({perdasData.porEtapa[0]?.quantidade || 0} perdas)</li>
              {perdasData.porVendedor[0] && (
                <li>Vendedor com mais perdas: <strong>{perdasData.porVendedor[0].vendedor}</strong> ({formatCurrencyAbbrev(perdasData.porVendedor[0].valor)})</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Motivos de Perda */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Motivos de Perda
              </CardTitle>
            </CardHeader>
            <CardContent>
              {perdasData.porMotivo.length === 0 || perdasData.porMotivo.every(m => m.motivo === 'Não informado') ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-center">
                    Dados de motivo de perda não disponíveis
                    <br />
                    <span className="text-xs">(Campo "Motivo da Perda" não configurado no Sheets)</span>
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={perdasData.porMotivo}
                      dataKey="quantidade"
                      nameKey="motivo"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ motivo, percent }) => `${motivo}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {perdasData.porMotivo.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value, 'Quantidade']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Perdas por Etapa */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Perdas por Etapa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={perdasData.porEtapa} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="etapa" type="category" stroke="hsl(var(--muted-foreground))" width={120} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [name === 'quantidade' ? value : formatCurrencyAbbrev(value), name === 'quantidade' ? 'Quantidade' : 'Valor']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="quantidade" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Segunda linha de gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Perdas por Vendedor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Perdas por Vendedor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={perdasData.porVendedor.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="vendedor" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatCurrencyAbbrev(v)} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrencyAbbrev(value), 'Valor Perdido']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="valor" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Perdas por Origem */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Perdas por Origem
              </CardTitle>
            </CardHeader>
            <CardContent>
              {perdasData.porOrigem.length === 0 || perdasData.porOrigem.every(o => o.origem === 'Não informado') ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <Target className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-center">
                    Dados de origem não disponíveis
                    <br />
                    <span className="text-xs">(Campo "Origem do Lead" não configurado no Sheets)</span>
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={perdasData.porOrigem.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="origem" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      formatter={(value: number) => [value, 'Quantidade']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="quantidade" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabela Detalhada */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento por Motivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-semibold text-muted-foreground">Motivo</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">Quantidade</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">Valor Perdido</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">% do Total</th>
                  </tr>
                </thead>
                <tbody>
                  {perdasData.porMotivo.map((m) => (
                    <tr key={m.motivo} className="border-b border-border/50 hover:bg-secondary/30">
                      <td className="p-3 font-medium">{m.motivo}</td>
                      <td className="text-right p-3">{m.quantidade}</td>
                      <td className="text-right p-3 text-destructive font-semibold">{formatCurrencyAbbrev(m.valor)}</td>
                      <td className="text-right p-3">
                        {perdasData.totalPerdidos > 0 ? ((m.quantidade / perdasData.totalPerdidos) * 100).toFixed(1) : 0}%
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
