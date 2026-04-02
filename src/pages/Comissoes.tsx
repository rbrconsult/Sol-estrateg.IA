import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useOrgFilteredProposals } from "@/hooks/useOrgFilteredProposals";
import { getVendedorPerformance, Proposal } from "@/data/dataAdapter";
import { DollarSign, Percent, Users, TrendingUp, ChevronDown, ChevronRight } from "lucide-react";
import { formatCurrencyAbbrev } from "@/lib/formatters";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { PageFloatingFilter } from "@/components/filters/PageFloatingFilter";

const COMMISSION_RATES: Record<string, number> = { "danieli": 3 };
const DEFAULT_RATE = 2;

function getRate(nome: string, overrides: Record<string, string>): number {
  const overrideStr = overrides[nome];
  if (overrideStr !== undefined && overrideStr !== "") return parseFloat(overrideStr) || 0;
  for (const [key, rate] of Object.entries(COMMISSION_RATES)) {
    if (nome.toLowerCase().includes(key.toLowerCase())) return rate;
  }
  return DEFAULT_RATE;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

function ProposalDrillDown({ proposals, rate }: { proposals: Proposal[]; rate: number }) {
  const ganhas = proposals.filter(p => p.status === "Ganho");
  if (ganhas.length === 0) return (
    <tr><td colSpan={8} className="px-8 py-3 text-xs text-muted-foreground italic">Nenhuma proposta fechada (Ganho)</td></tr>
  );
  return (
    <>
      {ganhas.map((p, i) => (
        <TableRow key={p.id || i} className="bg-muted/20 border-border/50">
          <TableCell />
          <TableCell className="text-xs text-muted-foreground pl-8">
            {p.nomeCliente || p.makeNome || p.clienteTelefone}
          </TableCell>
          <TableCell className="text-xs text-center text-muted-foreground">{p.etapa || p.faseSM || "—"}</TableCell>
          <TableCell className="text-xs text-center">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">Ganho</Badge>
          </TableCell>
          <TableCell className="text-xs text-right text-foreground">{formatCurrency(p.valorProposta)}</TableCell>
          <TableCell className="text-xs text-center text-muted-foreground">{rate}%</TableCell>
          <TableCell className="text-xs text-right text-primary font-medium">{formatCurrency(p.valorProposta * rate / 100)}</TableCell>
          <TableCell className="text-xs text-center text-muted-foreground">
            {p.dataCriacaoProposta ? new Date(p.dataCriacaoProposta).toLocaleDateString("pt-BR") : "—"}
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function Comissoes() {
  const { proposals, isLoading, orgFilterActive } = useOrgFilteredProposals();
  const { selectedOrgName } = useOrgFilter();
  const [rateOverrides, setRateOverrides] = useState<Record<string, string>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const gf = useGlobalFilters();

  const filteredProposals = useMemo(() => gf.filterProposals(proposals), [proposals, gf.filterProposals]);

  const vendedorPerf = useMemo(() => {
    if (!filteredProposals.length) return [];
    return getVendedorPerformance(filteredProposals);
  }, [filteredProposals]);

  // Group proposals by vendedor for drill-down
  const proposalsByVendedor = useMemo(() => {
    const map: Record<string, Proposal[]> = {};
    filteredProposals.forEach(p => {
      const v = p.representante || p.responsavel;
      if (!v) return;
      if (!map[v]) map[v] = [];
      map[v].push(p);
    });
    return map;
  }, [filteredProposals]);

  const comissoes = useMemo(() => {
    return vendedorPerf.map(v => {
      const rate = getRate(v.nome, rateOverrides);
      const valorBase = v.valorGanho;
      const comissao = valorBase * (rate / 100);
      return {
        nome: v.nome,
        totalPropostas: v.totalPropostas,
        ganhos: v.ganhos,
        perdidos: v.perdidos,
        abertos: v.abertos,
        valorBase,
        valorTotal: v.valorTotal,
        rate,
        comissao,
        taxaConversao: v.totalPropostas > 0 ? (v.ganhos / v.totalPropostas) * 100 : 0,
      };
    }).sort((a, b) => b.comissao - a.comissao);
  }, [vendedorPerf, rateOverrides]);

  const totals = useMemo(() => ({
    valorBase: comissoes.reduce((s, c) => s + c.valorBase, 0),
    comissao: comissoes.reduce((s, c) => s + c.comissao, 0),
    ganhos: comissoes.reduce((s, c) => s + c.ganhos, 0),
    totalPropostas: comissoes.reduce((s, c) => s + c.totalPropostas, 0),
  }), [comissoes]);

  const chartData = useMemo(() =>
    comissoes.slice(0, 10).map(c => ({
      nome: c.nome.split(" ")[0],
      comissao: c.comissao,
      valorBase: c.valorBase,
      fechamentos: c.ganhos,
    })),
  [comissoes]);

  const toggleRow = (nome: string) => setExpandedRows(prev => ({ ...prev, [nome]: !prev[nome] }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg text-sm">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-primary">Comissão: {formatCurrency(data?.comissao || 0)}</p>
        <p className="text-muted-foreground">Valor Fechado: {formatCurrency(data?.valorBase || 0)}</p>
        <p className="text-muted-foreground">Fechamentos: {data?.fechamentos || 0}</p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comissões</h1>
          <p className="text-sm text-muted-foreground">Padrão: 2% · Danielle: 3% · Editável por vendedor · Base: propostas fechadas</p>
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
        </div>
      </div>

      <PageFloatingFilter
        filters={gf.filters} hasFilters={gf.hasFilters} clearFilters={gf.clearFilters}
        setPeriodo={gf.setPeriodo} setDateFrom={gf.setDateFrom} setDateTo={gf.setDateTo}
        setTemperatura={gf.setTemperatura} setSearchTerm={gf.setSearchTerm} setEtapa={gf.setEtapa} setStatus={gf.setStatus}
        config={{ showPeriodo: true, showTemperatura: true, showSearch: true, showEtapa: true, showStatus: true, searchPlaceholder: "Buscar vendedor..." }}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Receita Fechada", value: formatCurrencyAbbrev(totals.valorBase), icon: DollarSign, sub: `${totals.ganhos} contratos fechados` },
          { label: "Total Comissões", value: formatCurrencyAbbrev(totals.comissao), icon: Percent, sub: "A pagar" },
          { label: "Vendedores", value: comissoes.length.toString(), icon: Users, sub: "Com propostas" },
          { label: "% Médio", value: `${comissoes.length > 0 ? (comissoes.reduce((s, c) => s + c.rate, 0) / comissoes.length).toFixed(1) : 0}%`, icon: TrendingUp, sub: "Taxa média de comissão" },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card key={i} className="opacity-0 animate-fade-up" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "forwards" }}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="opacity-0 animate-fade-up" style={{ animationDelay: "350ms", animationFillMode: "forwards" }}>
          <CardHeader>
            <CardTitle className="text-lg">Top 10 — Comissão por Vendedor</CardTitle>
            <p className="text-xs text-muted-foreground">Valor de comissão e quantidade de fechamentos</p>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="nome" tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyAbbrev(v)} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="left" dataKey="comissao" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={35} name="Comissão (R$)" label={{ position: 'top', fontSize: 9, fill: 'hsl(var(--muted-foreground))', formatter: (v: number) => v > 0 ? formatCurrencyAbbrev(v) : '' }} />
                <Bar yAxisId="right" dataKey="fechamentos" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} maxBarSize={35} name="Fechamentos" label={{ position: 'top', fontSize: 10, fill: 'hsl(var(--chart-2))', formatter: (v: number) => v > 0 ? v : '' }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Table with drill-down */}
      <Card className="opacity-0 animate-fade-up" style={{ animationDelay: "450ms", animationFillMode: "forwards" }}>
        <CardHeader>
          <CardTitle className="text-lg">Detalhamento por Vendedor</CardTitle>
          <p className="text-xs text-muted-foreground">Clique na linha para ver a composição (projetos fechados) · Base = propostas Ganho</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground font-medium w-8" />
                  <TableHead className="text-muted-foreground font-medium">Vendedor</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-center">Propostas</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-center">Fechamentos</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-right">Valor Fechado</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-center w-24">% Comissão</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-right">Comissão (R$)</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-center">Conversão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comissoes.map((c, i) => {
                  const isExpanded = !!expandedRows[c.nome];
                  return (
                    <>
                      <TableRow
                        key={c.nome}
                        className="border-border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => toggleRow(c.nome)}
                      >
                        <TableCell className="w-8 px-2">
                          {isExpanded
                            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          }
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                              i === 0 ? "bg-warning/20 text-warning" :
                              i === 1 ? "bg-muted text-muted-foreground" :
                              i === 2 ? "bg-warning/10 text-warning/70" : "text-muted-foreground"
                            }`}>
                              {i + 1}
                            </span>
                            {c.nome}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">{c.totalPropostas}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{c.ganhos}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground">{formatCurrency(c.valorBase)}</TableCell>
                        <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            className="h-7 w-20 text-xs text-center mx-auto"
                            value={rateOverrides[c.nome] ?? c.rate.toString()}
                            onChange={(e) => setRateOverrides(prev => ({ ...prev, [c.nome]: e.target.value }))}
                          />
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">{formatCurrency(c.comissao)}</TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-sm font-medium ${
                            c.taxaConversao >= 25 ? "bg-primary/10 text-primary" :
                            c.taxaConversao >= 15 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
                          }`}>
                            {c.taxaConversao.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                      {isExpanded && proposalsByVendedor[c.nome] && (
                        <ProposalDrillDown proposals={proposalsByVendedor[c.nome]} rate={c.rate} />
                      )}
                    </>
                  );
                })}
                <TableRow className="border-t-2 border-border bg-muted/30 font-bold">
                  <TableCell />
                  <TableCell className="text-foreground">TOTAL</TableCell>
                  <TableCell className="text-center text-foreground">{totals.totalPropostas}</TableCell>
                  <TableCell className="text-center text-foreground">{totals.ganhos}</TableCell>
                  <TableCell className="text-right text-foreground">{formatCurrency(totals.valorBase)}</TableCell>
                  <TableCell />
                  <TableCell className="text-right text-primary">{formatCurrency(totals.comissao)}</TableCell>
                  <TableCell className="text-center text-foreground">
                    {totals.totalPropostas > 0 ? ((totals.ganhos / totals.totalPropostas) * 100).toFixed(1) : 0}%
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
