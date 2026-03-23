import { useMemo } from "react";
import { useOrgFilteredProposals } from "@/hooks/useOrgFilteredProposals";
import { useMakeDataStore } from "@/hooks/useMakeDataStore";
import { getVendedorPerformance, getPerdasData } from "@/data/dataAdapter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyAbbrev } from "@/lib/formatters";
import { Users, TrendingUp, DollarSign, XCircle, RefreshCw, Bot, Target, Clock, Award } from "lucide-react";
import { HelpButton } from "@/components/HelpButton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { PageFloatingFilter } from "@/components/filters/PageFloatingFilter";

export default function Vendedores() {
  const { proposals: allProposals, isLoading, error, orgFilterActive } = useOrgFilteredProposals();
  const { data: makeRecords } = useMakeDataStore();
  const { selectedOrgName } = useOrgFilter();
  const gf = useGlobalFilters();

  const filteredProposals = useMemo(() => gf.filterProposals(allProposals), [allProposals, gf.filterProposals]);

  const { vendedorPerformance, perdasData } = useMemo(() => {
    if (filteredProposals.length === 0) return { vendedorPerformance: [], perdasData: null };
    return {
      vendedorPerformance: getVendedorPerformance(filteredProposals),
      perdasData: getPerdasData(filteredProposals),
    };
  }, [filteredProposals]);

  // ── ROI SOL: cruzar projectId do DS Thread com propostas ganhas ──
  const roiSol = useMemo(() => {
    const ganhas = filteredProposals.filter(p => p.status === 'Ganho');
    if (ganhas.length === 0) return { total: 0, viaSol: 0, pct: 0, ticketSol: 0, ticketManual: 0 };

    // IDs de projetos qualificados pelo SOL (etapa passou por SOL SDR/QUALIFICADO)
    const solProjectIds = new Set(
      (makeRecords || [])
        .filter(r => r.projectId && r.etapaFunil && !['TRAFEGO PAGO', 'DESQUALIFICADO'].includes(r.etapaFunil))
        .map(r => r.projectId)
    );

    const viaSol = ganhas.filter(p => solProjectIds.has(p.projetoId));
    const manual = ganhas.filter(p => !solProjectIds.has(p.projetoId));

    const ticketSol = viaSol.length > 0
      ? viaSol.reduce((a, p) => a + p.valorProposta, 0) / viaSol.length
      : 0;
    const ticketManual = manual.length > 0
      ? manual.reduce((a, p) => a + p.valorProposta, 0) / manual.length
      : 0;

    return {
      total: ganhas.length,
      viaSol: viaSol.length,
      pct: ganhas.length > 0 ? (viaSol.length / ganhas.length) * 100 : 0,
      ticketSol,
      ticketManual,
    };
  }, [filteredProposals, makeRecords]);

  // ── Totais da tabela ──
  const totais = useMemo(() => ({
    propostas: vendedorPerformance.reduce((a, v) => a + v.totalPropostas, 0),
    ganhos: vendedorPerformance.reduce((a, v) => a + v.ganhos, 0),
    valorGanho: vendedorPerformance.reduce((a, v) => a + v.valorGanho, 0),
    perdidos: vendedorPerformance.reduce((a, v) => a + v.perdidos, 0),
  }), [vendedorPerformance]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6"><p className="text-destructive">Erro ao carregar dados</p></div>;
  }

  const maxValor = Math.max(...vendedorPerformance.map(v => v.valorTotal), 1);

  const chartData = vendedorPerformance.slice(0, 10).map(v => ({
    nome: v.nome.split(' ')[0],
    ganho: v.valorGanho,
    perdido: v.valorPerdido,
    aberto: v.valorAberto,
  }));

  const conversaoData = vendedorPerformance.slice(0, 10).map(v => ({
    nome: v.nome.split(' ')[0],
    conversao: v.totalPropostas > 0 ? (v.ganhos / v.totalPropostas) * 100 : 0,
  }));

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Vendedores</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Performance comercial · Evolve Filial Olímpia</p>
        </div>
        <div className="flex items-center gap-2">
          {orgFilterActive && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
              🏢 {selectedOrgName}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">{filteredProposals.length} propostas</Badge>
          <HelpButton moduleId="vendedores" label="Ajuda de Vendedores" />
        </div>
      </div>

      <PageFloatingFilter
        filters={gf.filters} hasFilters={gf.hasFilters} clearFilters={gf.clearFilters}
        setPeriodo={gf.setPeriodo} setDateFrom={gf.setDateFrom} setDateTo={gf.setDateTo}
        setTemperatura={gf.setTemperatura} setSearchTerm={gf.setSearchTerm} setEtapa={gf.setEtapa}
        config={{ showPeriodo: true, showTemperatura: true, showSearch: true, showEtapa: true, searchPlaceholder: "Buscar vendedor..." }}
      />

      {/* ── ROI SOL ── */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Bot className="h-5 w-5" />
            ROI Sol Estrateg.IA — Do Lead ao Contrato
          </CardTitle>
          <p className="text-xs text-muted-foreground">Dos contratos fechados, quantos passaram pela qualificação do Robô SOL</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="rounded-lg bg-card border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Contratos Fechados</p>
              <p className="text-3xl font-bold text-foreground">{roiSol.total}</p>
            </div>
            <div className="rounded-lg bg-primary/10 border border-primary/30 p-4 text-center">
              <p className="text-xs text-primary mb-1">Via Robô SOL</p>
              <p className="text-3xl font-bold text-primary">{roiSol.viaSol}</p>
              <p className="text-sm text-primary font-semibold">{roiSol.pct.toFixed(0)}% do total</p>
            </div>
            <div className="rounded-lg bg-card border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Ticket Médio SOL</p>
              <p className="text-2xl font-bold text-chart-2">{formatCurrencyAbbrev(roiSol.ticketSol)}</p>
            </div>
            <div className="rounded-lg bg-card border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Ticket Médio Manual</p>
              <p className="text-2xl font-bold text-muted-foreground">{roiSol.ticketManual > 0 ? formatCurrencyAbbrev(roiSol.ticketManual) : '—'}</p>
            </div>
          </div>

          {/* Jornada Lead → Contrato */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Jornada Lead → Contrato</p>
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { label: 'Tráfego Pago', sub: 'entrada', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
                { label: 'SOL SDR', sub: '1ª qualif.', color: 'bg-primary/20 text-primary border-primary/30' },
                { label: 'Qualificado', sub: 'MQL', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
                { label: 'Closer', sub: 'contato', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
                { label: 'Proposta', sub: 'negócio', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
                { label: 'Contrato', sub: 'fechado ✓', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
              ].map((step, i, arr) => (
                <div key={step.label} className="flex items-center gap-1">
                  <div className={`rounded-lg border px-3 py-2 text-center ${step.color}`}>
                    <p className="text-xs font-bold">{step.label}</p>
                    <p className="text-[10px] opacity-70">{step.sub}</p>
                  </div>
                  {i < arr.length - 1 && <span className="text-muted-foreground text-xs">→</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Com SOL vs Sem SOL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="rounded-lg bg-primary/10 border border-primary/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="h-4 w-4 text-primary" />
                <p className="font-semibold text-primary text-sm">Com Sol Estrateg.IA</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Contratos via SOL</span><span className="font-bold">{roiSol.viaSol}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">% do total</span><span className="font-bold text-primary">{roiSol.pct.toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Ticket médio</span><span className="font-bold">{formatCurrencyAbbrev(roiSol.ticketSol)}</span></div>
              </div>
            </div>
            <div className="rounded-lg bg-muted/30 border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold text-muted-foreground text-sm">Sem Sol Estrateg.IA (Manual)</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Contratos manuais</span><span className="font-bold">{roiSol.total - roiSol.viaSol}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">% do total</span><span className="font-bold">{roiSol.total > 0 ? (100 - roiSol.pct).toFixed(1) : 0}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Ticket médio</span><span className="font-bold">{roiSol.ticketManual > 0 ? formatCurrencyAbbrev(roiSol.ticketManual) : '—'}</span></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Gráficos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Receita por Vendedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatCurrencyAbbrev(v)} />
                <YAxis dataKey="nome" type="category" stroke="hsl(var(--muted-foreground))" width={70} />
                <Tooltip
                  formatter={(value: number, name: string) => [formatCurrencyAbbrev(value), name === 'ganho' ? 'Ganho' : name === 'perdido' ? 'Perdido' : 'Em Aberto']}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="ganho" stackId="a" fill="hsl(var(--chart-2))" name="Ganho" />
                <Bar dataKey="aberto" stackId="a" fill="hsl(var(--primary))" name="Em Aberto" />
                <Bar dataKey="perdido" stackId="a" fill="hsl(var(--destructive))" name="Perdido" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Taxa de Conversão (Fechadas ÷ Enviadas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversaoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="nome" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Conversão']}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="conversao" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabela com totalizador ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Detalhamento por Vendedor
          </CardTitle>
          <p className="text-xs text-muted-foreground">Performance individual · Conversão = Contratos ÷ Propostas</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-semibold text-muted-foreground">Vendedor</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">Propostas</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">Contratos</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">Valor Ganho</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">Perdidas</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">Ticket Médio</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">Conversão</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">Tempo Resp.</th>
                  <th className="p-3 font-semibold text-muted-foreground">Performance</th>
                </tr>
              </thead>
              <tbody>
                {vendedorPerformance.map((v, index) => {
                  const taxaConversao = v.totalPropostas > 0 ? (v.ganhos / v.totalPropostas) * 100 : 0;
                  return (
                    <tr key={v.nome} className="border-b border-border/50 hover:bg-secondary/30">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-warning text-warning-foreground' :
                            index === 1 ? 'bg-muted text-muted-foreground' :
                            index === 2 ? 'bg-orange-600 text-white' :
                            'bg-secondary text-secondary-foreground'
                          }`}>{index + 1}</div>
                          <span className="font-medium">{v.nome}</span>
                        </div>
                      </td>
                      <td className="text-right p-3">{v.totalPropostas}</td>
                      <td className="text-right p-3">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{v.ganhos}</Badge>
                      </td>
                      <td className="text-right p-3 font-semibold text-chart-2">{formatCurrencyAbbrev(v.valorGanho)}</td>
                      <td className="text-right p-3 text-destructive">{v.perdidos}</td>
                      <td className="text-right p-3">{formatCurrencyAbbrev(v.ticketMedio)}</td>
                      <td className="text-right p-3">
                        <Badge variant={taxaConversao >= 25 ? "default" : taxaConversao >= 15 ? "secondary" : "destructive"}>
                          {taxaConversao.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="text-right p-3">
                        {v.tempoMedioResposta > 0 ? `${v.tempoMedioResposta}d` : '-'}
                      </td>
                      <td className="p-3 w-32">
                        <Progress value={(v.valorTotal / maxValor) * 100} className="h-2" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* TOTALIZADOR */}
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/30 font-bold">
                  <td className="p-3 text-foreground">TOTAL</td>
                  <td className="text-right p-3">{totais.propostas}</td>
                  <td className="text-right p-3">
                    <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20">{totais.ganhos}</Badge>
                  </td>
                  <td className="text-right p-3 font-bold text-chart-2">{formatCurrencyAbbrev(totais.valorGanho)}</td>
                  <td className="text-right p-3 text-destructive">{totais.perdidos}</td>
                  <td className="text-right p-3">{totais.propostas > 0 ? formatCurrencyAbbrev(totais.valorGanho / totais.propostas) : '—'}</td>
                  <td className="text-right p-3">
                    <Badge variant={totais.propostas > 0 && (totais.ganhos / totais.propostas) * 100 >= 15 ? "default" : "destructive"}>
                      {totais.propostas > 0 ? ((totais.ganhos / totais.propostas) * 100).toFixed(1) : 0}%
                    </Badge>
                  </td>
                  <td className="p-3" colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Perdas */}
      {perdasData && perdasData.porVendedor.length > 0 && (
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
