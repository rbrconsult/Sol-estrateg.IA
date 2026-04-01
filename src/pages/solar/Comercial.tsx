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
import { useSolLeads, useSolProjetos, useSolEquipe, type SolLead } from "@/hooks/useSolData";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const KANBAN_COLUMNS = ["QUALIFICADO", "GANHO", "PERDIDO"];

const columnColors: Record<string, string> = {
  QUALIFICADO: "border-amber-500/60 bg-amber-500/10",
  GANHO: "border-green-500/60 bg-green-500/10",
  PERDIDO: "border-red-500/60 bg-red-500/10",
};

const preferenceIcon = (pref: string | null) => {
  if (!pref) return "";
  const p = pref.toLowerCase();
  if (p.includes("whats") || p.includes("wa")) return "📱";
  if (p.includes("tel") || p.includes("liga")) return "📞";
  if (p.includes("visit")) return "🏠";
  return "📱";
};

export default function Comercial() {
  const { data: allLeads, isLoading, error, isFetching, refetch } = useSolLeads(["QUALIFICADO", "GANHO", "PERDIDO"]);
  const { data: projetos } = useSolProjetos(100);
  const { data: equipe } = useSolEquipe();

  const [search, setSearch] = useState("");
  const [filterCloser, setFilterCloser] = useState("all");

  const closers = useMemo(() => {
    if (!allLeads) return [];
    const set = new Set(allLeads.filter(r => r.closer_nome).map(r => r.closer_nome!));
    return Array.from(set).sort();
  }, [allLeads]);

  const filtered = useMemo(() => {
    if (!allLeads) return [];
    return allLeads.filter(r => {
      if (filterCloser !== "all" && r.closer_nome !== filterCloser) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (r.nome || "").toLowerCase().includes(q) ||
          r.telefone.includes(q) ||
          (r.closer_nome || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allLeads, search, filterCloser]);

  const byStatus = useMemo(() => {
    const grouped: Record<string, SolLead[]> = {};
    KANBAN_COLUMNS.forEach(c => grouped[c] = []);
    filtered.forEach(r => {
      const s = (r.status || "").toUpperCase().trim();
      if (grouped[s]) grouped[s].push(r);
      else grouped["QUALIFICADO"].push(r);
    });
    return grouped;
  }, [filtered]);

  // KPIs
  const kpis = useMemo(() => {
    if (!filtered.length) return { pipeline: 0, ganhos: 0, perdidos: 0, taxaFechamento: 0, valorMedio: 0 };
    const ganhos = filtered.filter(r => r.status === "GANHO").length;
    const perdidos = filtered.filter(r => r.status === "PERDIDO").length;
    const qualificados = filtered.filter(r => r.status === "QUALIFICADO").length;
    const pipelineValor = filtered.reduce((a, r) => a + (parseFloat(r.valor_conta || "0") || 0), 0);
    const total = ganhos + perdidos;
    return {
      pipeline: pipelineValor,
      ganhos,
      perdidos,
      taxaFechamento: total > 0 ? (ganhos / total) * 100 : 0,
      valorMedio: qualificados > 0 ? pipelineValor / qualificados : 0,
    };
  }, [filtered]);

  // Closer performance table
  const closerPerformance = useMemo(() => {
    if (!filtered.length) return [];
    const map: Record<string, { total: number; qualificados: number; ganhos: number; perdidos: number; pipeline: number }> = {};
    filtered.forEach(r => {
      const closer = r.closer_nome || "Sem closer";
      if (!map[closer]) map[closer] = { total: 0, qualificados: 0, ganhos: 0, perdidos: 0, pipeline: 0 };
      map[closer].total++;
      if (r.status === "QUALIFICADO") map[closer].qualificados++;
      if (r.status === "GANHO") map[closer].ganhos++;
      if (r.status === "PERDIDO") map[closer].perdidos++;
      map[closer].pipeline += parseFloat(r.valor_conta || "0") || 0;
    });
    return Object.entries(map).map(([nome, stats]) => ({
      nome,
      ...stats,
      taxaFechamento: (stats.ganhos + stats.perdidos) > 0 ? (stats.ganhos / (stats.ganhos + stats.perdidos)) * 100 : 0,
    })).sort((a, b) => b.ganhos - a.ganhos);
  }, [filtered]);

  const timeAgo = (ts: string | null) => {
    if (!ts) return "";
    try { return formatDistanceToNow(new Date(ts), { addSuffix: true, locale: ptBR }); } catch { return ""; }
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Comercial</h1>
          <p className="text-xs text-muted-foreground">
            Pipeline Closers • {filtered.length} leads
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-44" />
          </div>
          <Select value={filterCloser} onValueChange={setFilterCloser}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Closer" /></SelectTrigger>
            <SelectContent className="z-[999]" position="popper" sideOffset={4}>
              <SelectItem value="all">Todos Closers</SelectItem>
              {closers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          {filterCloser !== "all" && (
            <Button variant="ghost" size="sm" onClick={() => setFilterCloser("all")} className="text-xs text-muted-foreground">Limpar</Button>
          )}
        </div>
      </div>

      {error && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-12">
          <RefreshCw className="h-5 w-5 animate-spin" />Carregando pipeline comercial...
        </div>
      )}

      {/* KPIs */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card><CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><DollarSign className="h-3.5 w-3.5" /> Pipeline</div>
            <p className="text-2xl font-bold text-foreground">R$ {kpis.pipeline.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><TrendingUp className="h-3.5 w-3.5" /> Ganhos</div>
            <p className="text-2xl font-bold text-green-400">{kpis.ganhos}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><AlertCircle className="h-3.5 w-3.5" /> Perdidos</div>
            <p className="text-2xl font-bold text-red-400">{kpis.perdidos}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><TrendingUp className="h-3.5 w-3.5" /> Taxa Fecham.</div>
            <p className="text-2xl font-bold text-foreground">{kpis.taxaFechamento.toFixed(1)}%</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Users className="h-3.5 w-3.5" /> Valor Médio</div>
            <p className="text-2xl font-bold text-foreground">R$ {kpis.valorMedio.toFixed(0)}</p>
          </CardContent></Card>
        </div>
      )}

      {/* Kanban */}
      {!isLoading && filtered.length > 0 && (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {KANBAN_COLUMNS.map(column => {
              const items = byStatus[column] || [];
              return (
                <div key={column} className="flex-shrink-0 w-[290px]">
                  <div className={`rounded-t-lg border-t-4 ${columnColors[column] || "border-border bg-muted/20"} bg-card p-3`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground text-xs uppercase tracking-wide">{column}</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{items.length}</span>
                    </div>
                  </div>
                  <div className="rounded-b-lg border border-t-0 border-border bg-muted/10 p-2 min-h-[400px] max-h-[calc(100vh-340px)] overflow-y-auto">
                    <div className="space-y-2">
                      {items.map((rec, idx) => (
                        <div key={`${rec.telefone}-${idx}`} className="rounded-lg border border-border bg-card p-3 hover:bg-accent/30 transition-colors cursor-pointer">
                          <p className="text-sm font-medium text-foreground truncate">{rec.nome || rec.telefone}</p>
                          {rec.closer_nome && (
                            <p className="mt-1 text-[10px] text-muted-foreground truncate">👤 {rec.closer_nome}</p>
                          )}
                          <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                            <span>R$ {rec.valor_conta || "—"}</span>
                            <span className="text-right">{rec.prazo_decisao || "—"}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{preferenceIcon(rec.preferencia_contato)} {rec.forma_pagamento || ""}</span>
                          </div>
                          {rec.ts_qualificado && (
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              <Calendar className="inline h-3 w-3 mr-0.5" />{timeAgo(rec.ts_qualificado)}
                            </p>
                          )}
                          {rec.project_id && (
                            <a
                              href={`https://business.solarmarket.com.br/projects/${rec.project_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 text-[10px] text-primary flex items-center gap-0.5 hover:underline"
                              onClick={e => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" /> SM
                            </a>
                          )}
                        </div>
                      ))}
                      {items.length === 0 && (
                        <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">Nenhum lead</div>
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

      {/* Closer Performance Table */}
      {!isLoading && closerPerformance.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Performance por Closer</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Closer</TableHead>
                  <TableHead className="text-center">Leads</TableHead>
                  <TableHead className="text-center">Qualificados</TableHead>
                  <TableHead className="text-center">Ganhos</TableHead>
                  <TableHead className="text-center">Perdidos</TableHead>
                  <TableHead className="text-center">Taxa Fecham.</TableHead>
                  <TableHead className="text-right">Pipeline R$</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closerPerformance.map(cp => (
                  <TableRow key={cp.nome}>
                    <TableCell className="font-medium">{cp.nome}</TableCell>
                    <TableCell className="text-center">{cp.total}</TableCell>
                    <TableCell className="text-center">{cp.qualificados}</TableCell>
                    <TableCell className="text-center text-green-400">{cp.ganhos}</TableCell>
                    <TableCell className="text-center text-red-400">{cp.perdidos}</TableCell>
                    <TableCell className="text-center">{cp.taxaFechamento.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">R$ {cp.pipeline.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Timeline Eventos SM */}
      {!isLoading && projetos && projetos.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Timeline Eventos SM</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {projetos.slice(0, 20).map((p, i) => (
                <div key={`${p.key}-${i}`} className="flex items-center gap-3 text-xs text-muted-foreground border-b border-border/50 pb-2">
                  <span className="font-mono text-[10px] shrink-0">{p.ts_evento ? new Date(p.ts_evento).toLocaleDateString("pt-BR") : "—"}</span>
                  <Badge variant="outline" className="text-[10px]">{p.etapa || "—"}</Badge>
                  <span className="truncate">{p.identificador || p.project_id}</span>
                  <span className="ml-auto text-[10px]">{p.evento || ""}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!isLoading && !error && filtered.length === 0 && (
        <Alert className="border-muted">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Nenhum lead comercial encontrado.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
