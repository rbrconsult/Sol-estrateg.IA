import { useMemo, useState } from "react";
import { RefreshCw, AlertCircle, TrendingUp, Users, DollarSign, Search, ExternalLink, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSolProjetos } from "@/hooks/useSolData";
import { useCommercialProposals } from "@/hooks/useCommercialProposals";
import type { Proposal } from "@/data/dataAdapter";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DataTrustFooter } from "@/components/metrics/DataTrustFooter";

const KANBAN_COLUMNS = ["QUALIFICADO", "GANHO", "PERDIDO"] as const;

const columnColors: Record<string, string> = {
  QUALIFICADO: "border-amber-500/60 bg-amber-500/10",
  GANHO: "border-green-500/60 bg-green-500/10",
  PERDIDO: "border-red-500/60 bg-red-500/10",
};

function kanbanColumn(p: Proposal): (typeof KANBAN_COLUMNS)[number] {
  if (p.status === "Ganho") return "GANHO";
  if (p.status === "Perdido" || p.status === "Excluido") return "PERDIDO";
  return "QUALIFICADO";
}

function closerName(p: Proposal): string {
  return (p.representante || p.responsavel || "").trim() || "Sem responsável";
}

export default function Comercial() {
  const {
    proposals: allProposals,
    isLoading,
    error,
    dataUpdatedAt,
    projectCount,
  } = useCommercialProposals();
  const { data: projetos } = useSolProjetos();

  const [search, setSearch] = useState("");
  const [filterCloser, setFilterCloser] = useState("all");

  const closers = useMemo(() => {
    const set = new Set<string>();
    (allProposals || []).forEach((p) => {
      const c = closerName(p);
      if (c && c !== "Sem responsável") set.add(c);
    });
    return Array.from(set).sort();
  }, [allProposals]);

  const filtered = useMemo(() => {
    if (!allProposals?.length) return [];
    return allProposals.filter((p) => {
      const cname = closerName(p);
      if (filterCloser !== "all" && cname !== filterCloser) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (p.nomeCliente || "").toLowerCase().includes(q) ||
          (p.clienteTelefone || "").toLowerCase().includes(q) ||
          cname.toLowerCase().includes(q) ||
          (p.projetoId || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allProposals, search, filterCloser]);

  const byStatus = useMemo(() => {
    const grouped: Record<string, Proposal[]> = { QUALIFICADO: [], GANHO: [], PERDIDO: [] };
    filtered.forEach((p) => {
      const col = kanbanColumn(p);
      grouped[col].push(p);
    });
    return grouped;
  }, [filtered]);

  const kpis = useMemo(() => {
    if (!filtered.length) {
      return { pipeline: 0, ganhos: 0, perdidos: 0, taxaFechamento: 0, valorMedio: 0 };
    }
    const ganhos = filtered.filter((p) => p.status === "Ganho").length;
    const perdidos = filtered.filter((p) => p.status === "Perdido" || p.status === "Excluido").length;
    const qualificados = byStatus.QUALIFICADO.length;
    const pipelineValor = byStatus.QUALIFICADO.reduce((a, p) => a + (p.valorProposta || 0), 0);
    const decided = ganhos + perdidos;
    return {
      pipeline: pipelineValor,
      ganhos,
      perdidos,
      taxaFechamento: decided > 0 ? (ganhos / decided) * 100 : 0,
      valorMedio: qualificados > 0 ? pipelineValor / qualificados : 0,
    };
  }, [filtered, byStatus]);

  const closerPerformance = useMemo(() => {
    if (!filtered.length) return [];
    const map: Record<
      string,
      { total: number; qualificados: number; ganhos: number; perdidos: number; pipeline: number }
    > = {};
    filtered.forEach((p) => {
      const closer = closerName(p);
      if (!map[closer]) {
        map[closer] = { total: 0, qualificados: 0, ganhos: 0, perdidos: 0, pipeline: 0 };
      }
      map[closer].total++;
      const col = kanbanColumn(p);
      if (col === "QUALIFICADO") {
        map[closer].qualificados++;
        map[closer].pipeline += p.valorProposta || 0;
      }
      if (p.status === "Ganho") map[closer].ganhos++;
      if (p.status === "Perdido" || p.status === "Excluido") map[closer].perdidos++;
    });
    return Object.entries(map)
      .map(([nome, stats]) => ({
        nome,
        ...stats,
        taxaFechamento:
          stats.ganhos + stats.perdidos > 0 ? (stats.ganhos / (stats.ganhos + stats.perdidos)) * 100 : 0,
      }))
      .sort((a, b) => b.ganhos - a.ganhos);
  }, [filtered]);

  const timeAgo = (ts: string | null) => {
    if (!ts) return "";
    try {
      return formatDistanceToNow(new Date(ts), { addSuffix: true, locale: ptBR });
    } catch {
      return "";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Comercial</h1>
          <p className="text-xs text-muted-foreground">
            Pipeline a partir de projetos SM (dedupe) · {filtered.length} de {projectCount} projetos
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-44"
            />
          </div>
          <Select value={filterCloser} onValueChange={setFilterCloser}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent className="z-[999]" position="popper" sideOffset={4}>
              <SelectItem value="all">Todos</SelectItem>
              {closers.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filterCloser !== "all" && (
            <Button variant="ghost" size="sm" onClick={() => setFilterCloser("all")} className="text-xs text-muted-foreground">
              Limpar
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-12">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Carregando pipeline comercial...
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <DollarSign className="h-3.5 w-3.5" /> Pipeline (abertos)
              </div>
              <p className="text-2xl font-bold text-foreground">
                R$ {kpis.pipeline.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="h-3.5 w-3.5" /> Ganhos
              </div>
              <p className="text-2xl font-bold text-green-400">{kpis.ganhos}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <AlertCircle className="h-3.5 w-3.5" /> Perdidos / excl.
              </div>
              <p className="text-2xl font-bold text-red-400">{kpis.perdidos}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="h-3.5 w-3.5" /> Taxa fecham.
              </div>
              <p className="text-2xl font-bold text-foreground">{kpis.taxaFechamento.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Users className="h-3.5 w-3.5" /> Ticket médio (abertos)
              </div>
              <p className="text-2xl font-bold text-foreground">R$ {kpis.valorMedio.toFixed(0)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {KANBAN_COLUMNS.map((column) => {
              const items = byStatus[column] || [];
              return (
                <div key={column} className="flex-shrink-0 w-[290px]">
                  <div className={`rounded-t-lg border-t-4 ${columnColors[column] || "border-border bg-muted/20"} bg-card p-3`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground text-xs uppercase tracking-wide">{column}</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {items.length}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-b-lg border border-t-0 border-border bg-muted/10 p-2 min-h-[400px] max-h-[calc(100vh-340px)] overflow-y-auto">
                    <div className="space-y-2">
                      {items.map((rec) => (
                        <div
                          key={rec.id}
                          className="rounded-lg border border-border bg-card p-3 hover:bg-accent/30 transition-colors cursor-pointer"
                        >
                          <p className="text-sm font-medium text-foreground truncate">{rec.nomeCliente || rec.clienteTelefone}</p>
                          {closerName(rec) !== "Sem responsável" && (
                            <p className="mt-1 text-[10px] text-muted-foreground truncate">👤 {closerName(rec)}</p>
                          )}
                          <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                            <span>
                              R${" "}
                              {(rec.valorProposta || 0).toLocaleString("pt-BR", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}
                            </span>
                            <span className="text-right truncate">{rec.etapa || rec.faseSM || "—"}</span>
                          </div>
                          {rec.temperatura && (
                            <Badge variant="outline" className="mt-1 text-[9px] h-5">
                              {rec.temperatura}
                            </Badge>
                          )}
                          {(rec.ultimaAtualizacao || rec.dataCriacaoProposta) && (
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              <Calendar className="inline h-3 w-3 mr-0.5" />
                              {timeAgo(rec.ultimaAtualizacao || rec.dataCriacaoProposta)}
                            </p>
                          )}
                          {rec.projetoId && (
                            <a
                              href={`https://business.solarmarket.com.br/projects/${rec.projetoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 text-[10px] text-primary flex items-center gap-0.5 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" /> SM
                            </a>
                          )}
                        </div>
                      ))}
                      {items.length === 0 && (
                        <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">Nenhum projeto</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {!isLoading && closerPerformance.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Performance por responsável</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-center">Projetos</TableHead>
                  <TableHead className="text-center">Abertos</TableHead>
                  <TableHead className="text-center">Ganhos</TableHead>
                  <TableHead className="text-center">Perdidos</TableHead>
                  <TableHead className="text-center">Taxa fecham.</TableHead>
                  <TableHead className="text-right">Pipeline R$ (abertos)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closerPerformance.map((cp) => (
                  <TableRow key={cp.nome}>
                    <TableCell className="font-medium">{cp.nome}</TableCell>
                    <TableCell className="text-center">{cp.total}</TableCell>
                    <TableCell className="text-center">{cp.qualificados}</TableCell>
                    <TableCell className="text-center text-green-400">{cp.ganhos}</TableCell>
                    <TableCell className="text-center text-red-400">{cp.perdidos}</TableCell>
                    <TableCell className="text-center">{cp.taxaFechamento.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">
                      R$ {cp.pipeline.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!isLoading && projetos && projetos.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Timeline eventos SM (amostra)</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {projetos.slice(0, 20).map((p, i) => (
                <div
                  key={`${p.project_id ?? "proj"}-${p.ts_evento ?? ""}-${i}`}
                  className="flex items-center gap-3 text-xs text-muted-foreground border-b border-border/50 pb-2"
                >
                  <span className="font-mono text-[10px] shrink-0">
                    {p.ts_evento ? new Date(p.ts_evento).toLocaleDateString("pt-BR") : "—"}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {p.etapa || "—"}
                  </Badge>
                  <span className="truncate">{p.identificador || p.project_id}</span>
                  <span className="ml-auto text-[10px]">{p.evento || ""}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <Alert className="border-muted">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {projectCount === 0
              ? "Nenhum projeto sincronizado ainda (sol_propostas)."
              : "Nenhum projeto no recorte dos filtros locais."}
          </AlertDescription>
        </Alert>
      )}

      <DataTrustFooter
        lines={[
          {
            label: "Comercial (esta página)",
            source: "sol_propostas → 1 card por project_id (último evento)",
            fetchedAt: dataUpdatedAt,
            extra: `${filtered.length} projetos exibidos após busca/filtro local`,
          },
        ]}
      />
    </div>
  );
}
