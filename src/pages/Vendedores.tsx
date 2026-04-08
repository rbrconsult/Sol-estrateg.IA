import { useMemo } from "react";
import { useCommercialProposals } from "@/hooks/useCommercialProposals";
import { useSolLeads } from '@/hooks/useSolData';
import { getVendedorPerformance, getPerdasData } from "@/data/dataAdapter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrencyAbbrev, safeToFixed } from "@/lib/formatters";
import { Users, TrendingUp, DollarSign, XCircle, RefreshCw, Bot, Info } from "lucide-react";
import { HelpButton } from "@/components/HelpButton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { useFranquiaId } from "@/hooks/useFranquiaId";
import { PageFloatingFilter } from "@/components/filters/PageFloatingFilter";
import {
  closerAllowlistCount,
  filterProposalsByAllowedCloserIds,
  hasCloserAllowlist,
} from "@/lib/orgCloserAllowlist";
import { filterProposalsToSelectedFranquia } from "@/lib/franquiaSync";
import { useComercialCloserAllowlist } from "@/hooks/useComercialCloserAllowlist";

export default function Vendedores() {
  const { proposals: allProposals, isLoading, error } = useCommercialProposals();
  const { data: solLeads } = useSolLeads();
  const { selectedOrgName, isGlobal, selectedOrgId } = useOrgFilter();
  const franquiaSlug = useFranquiaId();
  const { allowedCloserIds, source: closerSource } = useComercialCloserAllowlist();
  const franchiseSlugMissing = Boolean(selectedOrgId && !franquiaSlug.trim());
  const orgFilterActive = !isGlobal;
  const gf = useGlobalFilters();

  const filteredProposals = useMemo(() => {
    const scoped = filterProposalsToSelectedFranquia(
      allProposals,
      isGlobal,
      isGlobal ? "" : franquiaSlug,
    );
    let list = gf.filterProposals(scoped);
    if (!isGlobal) {
      list = filterProposalsByAllowedCloserIds(list, allowedCloserIds);
    }
    return list;
  }, [allProposals, gf.filterProposals, isGlobal, franquiaSlug, allowedCloserIds]);

  const closerAllowlistActive = !isGlobal && hasCloserAllowlist(allowedCloserIds);

  const { vendedorPerformance, perdasData } = useMemo(() => {
    if (filteredProposals.length === 0) return { vendedorPerformance: [], perdasData: null };
    return {
      vendedorPerformance: getVendedorPerformance(filteredProposals, "closer"),
      perdasData: getPerdasData(filteredProposals, "closer"),
    };
  }, [filteredProposals]);

  // ── ROI SOL: cruzar projectId do DS Thread com propostas ganhas ──
  const roiSol = useMemo(() => {
    const ganhas = filteredProposals.filter(p => p.status === 'Ganho');
    if (ganhas.length === 0) return { total: 0, viaSol: 0, pct: 0, ticketSol: 0, ticketManual: 0 };

    // IDs de projetos qualificados pelo SOL (etapa passou por SOL SDR/QUALIFICADO)
    const solProjectIds = new Set(
      (solLeads || [])
        .filter(r => r.project_id && r.etapa_funil && !['TRAFEGO PAGO', 'DECLÍNIO'].includes((r.etapa_funil || '').toUpperCase().trim()))
        .map(r => r.project_id)
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
  }, [filteredProposals, solLeads]);

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
    return (
      <div className="p-6 space-y-2">
        <p className="text-destructive font-medium">Erro ao carregar dados</p>
        <p className="text-sm text-muted-foreground">{(error as Error)?.message || String(error)}</p>
      </div>
    );
  }

  const maxValor = Math.max(...vendedorPerformance.map(v => v.valorTotal), 1);

  const chartData = vendedorPerformance.slice(0, 12).map((v) => ({
    nome: v.nome.length > 24 ? `${v.nome.slice(0, 22)}…` : v.nome,
    nomeCompleto: v.nome,
    ganho: v.valorGanho,
    perdido: v.valorPerdido,
    aberto: v.valorAberto,
  }));

  const conversaoData = vendedorPerformance.slice(0, 12).map((v) => ({
    nome: v.nome.length > 24 ? `${v.nome.slice(0, 22)}…` : v.nome,
    nomeCompleto: v.nome,
    conversao: v.totalPropostas > 0 ? (v.ganhos / v.totalPropostas) * 100 : 0,
  }));

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  const chartRows = Math.min(vendedorPerformance.length, 12);
  const chartHeight = Math.max(320, chartRows * 40 + 72);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Performance comercial</h1>
          <p className="text-xs md:text-sm text-muted-foreground max-w-2xl">
            Fonte: <span className="font-medium text-foreground">sol_propostas</span>.{" "}
            <span className="font-medium text-foreground">Slug</span> da filial alinha{" "}
            <code className="text-[10px]">franquia_id</code> (RLS). O recorte mandatório por filial é por{" "}
            <span className="font-medium text-foreground">responsável</span> (ID SM em{" "}
            <code className="text-[10px]">organization_configs.comercial_closer_sm_ids</code>, com legado em código se vazio).
          </p>
        </div>
        <div className="flex items-center gap-2">
          {orgFilterActive && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
              🏢 {selectedOrgName}
            </Badge>
          )}
          {closerAllowlistActive && (
            <Badge variant="secondary" className="text-xs max-w-[260px] whitespace-normal text-center leading-tight">
              Responsáveis: {closerAllowlistCount(allowedCloserIds)} IDs SM
              {closerSource === "database" ? " (BD)" : " (legado)"}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">{filteredProposals.length} propostas</Badge>
          <HelpButton moduleId="vendedores" label="Ajuda de Vendedores" />
        </div>
      </div>

      <PageFloatingFilter
        filters={gf.filters} hasFilters={gf.hasFilters} clearFilters={gf.clearFilters}
        setPeriodo={gf.setPeriodo} setDateFrom={gf.setDateFrom} setDateTo={gf.setDateTo}
        setTemperatura={gf.setTemperatura} setSearchTerm={gf.setSearchTerm} setEtapa={gf.setEtapa} setStatus={gf.setStatus}
        config={{ showPeriodo: true, showTemperatura: true, showSearch: true, showEtapa: true, showStatus: true, searchPlaceholder: "Buscar vendedor..." }}
      />

      {franchiseSlugMissing && (
        <Alert>
          <AlertDescription className="text-sm text-muted-foreground">
            Nenhum dado comercial carregado para esta filial: falta <code className="text-xs">organizations.slug</code> coerente com{" "}
            <code className="text-xs">franquia_id</code> nas tabelas de sync. Ajuste no banco de dados.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Pré-venda SOL × contrato ganho (cruzamento project_id) ── */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Bot className="h-5 w-5 text-primary shrink-0" />
            Contratos ganhos: origem pré-venda (SOL) vs demais
          </CardTitle>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Só entra negócio com status <span className="font-medium text-foreground">Ganho</span> na sync de projetos. «Via
            pré-venda SOL» = mesmo <code className="text-[10px]">project_id</code> encontrado em{" "}
            <code className="text-[10px]">sol_leads_sync</code> com etapa além de tráfego bruto/declínio. Se tudo estiver zero,
            ou não há ganhos no filtro ou os IDs não batem entre bases.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {roiSol.total === 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs leading-relaxed">
                Nenhum <strong>Ganho</strong> no período/filtro atual — por isso tickets e percentuais aparecem vazios. Ajuste
                filtros de data ou confira se o SM está gravando ganhos e alinhando <code className="text-[10px]">project_id</code>{" "}
                entre lead e projeto.
              </AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg bg-muted/40 border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Contratos ganhos</p>
              <p className="text-2xl font-bold tabular-nums">{roiSol.total}</p>
            </div>
            <div className="rounded-lg bg-primary/10 border border-primary/25 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Com histórico SOL (project_id)</p>
              <p className="text-2xl font-bold text-primary tabular-nums">{roiSol.viaSol}</p>
              <p className="text-[11px] text-primary/90 mt-1">{roiSol.total > 0 ? `${roiSol.pct.toFixed(0)}% dos ganhos` : "—"}</p>
            </div>
            <div className="rounded-lg bg-muted/40 border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Ticket médio (com SOL)</p>
              <p className="text-lg font-bold tabular-nums">{roiSol.viaSol > 0 ? formatCurrencyAbbrev(roiSol.ticketSol) : "—"}</p>
            </div>
            <div className="rounded-lg bg-muted/40 border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Ticket médio (sem match SOL)</p>
              <p className="text-lg font-bold tabular-nums text-muted-foreground">
                {roiSol.total > roiSol.viaSol && roiSol.ticketManual > 0 ? formatCurrencyAbbrev(roiSol.ticketManual) : "—"}
              </p>
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
              Receita por closer
            </CardTitle>
            <p className="text-xs text-muted-foreground">Barras horizontais · passe o mouse para o nome completo</p>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 8, right: 20, left: 4, bottom: 8 }}
                barCategoryGap="12%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrencyAbbrev(v)} />
                <YAxis
                  type="category"
                  dataKey="nome"
                  stroke="hsl(var(--muted-foreground))"
                  width={156}
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0].payload as { nomeCompleto: string; ganho: number; aberto: number; perdido: number };
                    return (
                      <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md max-w-xs">
                        <p className="font-medium text-foreground mb-1.5 leading-snug">{row.nomeCompleto}</p>
                        <ul className="space-y-0.5 text-muted-foreground">
                          <li>Ganho: <span className="text-foreground font-medium">{formatCurrencyAbbrev(row.ganho)}</span></li>
                          <li>Em aberto: <span className="text-foreground font-medium">{formatCurrencyAbbrev(row.aberto)}</span></li>
                          <li>Perdido: <span className="text-foreground font-medium">{formatCurrencyAbbrev(row.perdido)}</span></li>
                        </ul>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="ganho" stackId="a" fill="hsl(var(--chart-2))" name="Ganho" />
                <Bar dataKey="aberto" stackId="a" fill="hsl(var(--primary))" name="Em aberto" />
                <Bar dataKey="perdido" stackId="a" fill="hsl(var(--destructive))" name="Perdido" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Taxa de conversão (ganhos ÷ propostas)
            </CardTitle>
            <p className="text-xs text-muted-foreground">Mesmo eixo de nomes que o gráfico ao lado — evita rótulos sobrepostos</p>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={conversaoData}
                layout="vertical"
                margin={{ top: 8, right: 20, left: 4, bottom: 8 }}
                barCategoryGap="18%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="nome"
                  stroke="hsl(var(--muted-foreground))"
                  width={156}
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0].payload as { nomeCompleto: string; conversao: number };
                    return (
                      <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md max-w-xs">
                        <p className="font-medium text-foreground mb-1 leading-snug">{row.nomeCompleto}</p>
                        <p className="text-muted-foreground">
                          Conversão: <span className="text-foreground font-semibold">{safeToFixed(row.conversao, 1)}%</span>
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="conversao" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} name="Conversão %" />
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
            Detalhamento por closer
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Linhas agrupadas pelo closer comercial na sync (<code className="text-[10px]">closer_nome</code> →{" "}
            <code className="text-[10px]">responsavel</code>). Conversão = contratos ganhos ÷ propostas enviadas.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-semibold text-muted-foreground">Closer</th>
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
              Perdas por closer
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
