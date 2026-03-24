import { useMemo, useState } from "react";
import { useForceSync } from "@/hooks/useForceSync";
import { RefreshCw, AlertCircle, TrendingUp, Users, Zap, DollarSign, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMakeComercialData, ComercialRecord } from "@/hooks/useMakeComercialData";
import { formatCurrencyAbbrev, formatCurrencyFull, formatPower } from "@/lib/formatters";

// Kanban columns based on SolarMarket stages
const KANBAN_COLUMNS = [
  "TRAFEGO PAGO",
  "PROSPECÇÃO",
  "QUALIFICAÇÃO",
  "QUALIFICADO",
  "CONTATO REALIZADO",
  "PROPOSTA",
  "NEGOCIAÇÃO",
  "RECEBIMENTO DO CLIENTE (F)",
  "CONTRATO ASSINADO",
  "COBRANÇA",
  "ANÁLISE DOCUMENTOS",
  "APROVAÇÃO DE FINANCIAMENTO",
  "ELABORAÇÃO DE CONTRATO",
  "CONTRATO ENVIADO",
  "AGUARDANDO DOCUMENTOS",
];

const columnColors: Record<string, string> = {
  "TRAFEGO PAGO": "border-blue-500/60 bg-blue-500/10",
  "PROSPECÇÃO": "border-indigo-500/60 bg-indigo-500/10",
  "QUALIFICAÇÃO": "border-cyan-500/60 bg-cyan-500/10",
  "QUALIFICADO": "border-teal-500/60 bg-teal-500/10",
  "CONTATO REALIZADO": "border-emerald-500/60 bg-emerald-500/10",
  "PROPOSTA": "border-amber-500/60 bg-amber-500/10",
  "NEGOCIAÇÃO": "border-orange-500/60 bg-orange-500/10",
  "FECHADO": "border-green-500/60 bg-green-500/10",
};

const statusBadge = (status: string) => {
  const s = status.toUpperCase();
  if (s.includes("GANH") || s.includes("FECHAR") || s === "WON") return "bg-green-500/20 text-green-400 border-green-500/30";
  if (s.includes("PERD") || s === "LOST") return "bg-red-500/20 text-red-400 border-red-500/30";
  return "bg-muted text-muted-foreground border-border";
};

export default function Comercial() {
  const { data: records, isLoading, error, isFetching } = useMakeComercialData();
  const { forceSync, isSyncing } = useForceSync();
  const [search, setSearch] = useState("");
  const [filterResp, setFilterResp] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEtapa, setFilterEtapa] = useState("all");

  // Derive unique values for filters
  const responsaveis = useMemo(() => {
    if (!records) return [];
    const set = new Set(records.filter(r => r.responsavel).map(r => r.responsavel));
    return Array.from(set).sort();
  }, [records]);

  const statuses = useMemo(() => {
    if (!records) return [];
    const set = new Set(records.filter(r => r.statusProposta).map(r => r.statusProposta));
    return Array.from(set).sort();
  }, [records]);

  const etapas = useMemo(() => {
    if (!records) return [];
    const set = new Set(records.filter(r => r.etapaSM).map(r => r.etapaSM));
    return Array.from(set).sort();
  }, [records]);

  // Filter records
  const filtered = useMemo(() => {
    if (!records) return [];
    return records.filter(r => {
      if (filterResp !== "all" && r.responsavel !== filterResp) return false;
      if (filterStatus !== "all" && r.statusProposta !== filterStatus) return false;
      if (filterEtapa !== "all" && r.etapaSM !== filterEtapa) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.nomeProposta.toLowerCase().includes(q) ||
          r.projetoId.toLowerCase().includes(q) ||
          r.telefone.includes(q) ||
          r.responsavel.toLowerCase().includes(q) ||
          r.representante.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [records, search, filterResp, filterStatus, filterEtapa]);

  // Group by etapa for Kanban
  const byEtapa = useMemo(() => {
    const grouped: Record<string, ComercialRecord[]> = {};
    KANBAN_COLUMNS.forEach(c => grouped[c] = []);
    filtered.forEach(r => {
      const etapa = (r.etapaSM || "").toUpperCase().trim();
      const matchedCol = KANBAN_COLUMNS.find(c => etapa.includes(c) || c.includes(etapa));
      if (matchedCol) {
        grouped[matchedCol].push(r);
      } else if (grouped[KANBAN_COLUMNS[0]]) {
        grouped[KANBAN_COLUMNS[0]].push(r);
      }
    });
    return grouped;
  }, [filtered]);

  // KPIs
  const kpis = useMemo(() => {
    if (!filtered.length) return { total: 0, valor: 0, potencia: 0, responsaveis: 0 };
    const respSet = new Set(filtered.map(r => r.responsavel).filter(Boolean));
    return {
      total: filtered.length,
      valor: filtered.reduce((a, r) => a + r.valorProposta, 0),
      potencia: filtered.reduce((a, r) => a + r.potenciaSistema, 0),
      responsaveis: respSet.size,
    };
  }, [filtered]);

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Comercial</h1>
          <p className="text-xs text-muted-foreground">
            Pipeline SolarMarket • {records?.length ?? 0} projetos
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar projeto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-44"
            />
          </div>
          <Select value={filterResp} onValueChange={setFilterResp}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Vendedor" />
            </SelectTrigger>
            <SelectContent className="z-[999]" position="popper" sideOffset={4}>
              <SelectItem value="all">Todos Vendedores</SelectItem>
              {responsaveis.map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="z-[999]" position="popper" sideOffset={4}>
              <SelectItem value="all">Todos Status</SelectItem>
              {statuses.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterEtapa} onValueChange={setFilterEtapa}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Etapa" />
            </SelectTrigger>
            <SelectContent className="z-[999]" position="popper" sideOffset={4}>
              <SelectItem value="all">Todas Etapas</SelectItem>
              {etapas.map(e => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(filterResp !== "all" || filterStatus !== "all" || filterEtapa !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterResp("all"); setFilterStatus("all"); setFilterEtapa("all"); }}
              className="text-xs text-muted-foreground"
            >
              Limpar filtros
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-12">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Carregando dados do SolarMarket...
        </div>
      )}

      {/* KPIs */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="h-3.5 w-3.5" /> Projetos
              </div>
              <p className="text-2xl font-bold text-foreground">{kpis.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <DollarSign className="h-3.5 w-3.5" /> Valor Total
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrencyAbbrev(kpis.valor)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Zap className="h-3.5 w-3.5" /> Potência
              </div>
              <p className="text-2xl font-bold text-foreground">{formatPower(kpis.potencia)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Users className="h-3.5 w-3.5" /> Responsáveis
              </div>
              <p className="text-2xl font-bold text-foreground">{kpis.responsaveis}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Kanban */}
      {!isLoading && filtered.length > 0 && (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {KANBAN_COLUMNS.map(column => {
              const items = byEtapa[column] || [];
              const totalVal = items.reduce((a, r) => a + r.valorProposta, 0);
              const totalPow = items.reduce((a, r) => a + r.potenciaSistema, 0);

              return (
                <div key={column} className="flex-shrink-0 w-[290px]">
                  <div className={`rounded-t-lg border-t-4 ${columnColors[column] || 'border-border bg-muted/20'} bg-card p-3`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground text-xs uppercase tracking-wide">{column}</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {items.length}
                      </span>
                    </div>
                    <div className="mt-1.5 flex gap-3 text-xs text-muted-foreground">
                      <span>{formatCurrencyAbbrev(totalVal)}</span>
                      <span>•</span>
                      <span>{totalPow.toFixed(1)} kWp</span>
                    </div>
                  </div>
                  <div className="rounded-b-lg border border-t-0 border-border bg-muted/10 p-2 min-h-[400px] max-h-[calc(100vh-340px)] overflow-y-auto">
                    <div className="space-y-2">
                      {items.map((rec, idx) => (
                        <div
                          key={`${rec.projetoId}-${idx}`}
                          className="rounded-lg border border-border bg-card p-3 hover:bg-accent/30 transition-colors cursor-pointer"
                        >
                          <p className="text-sm font-medium text-foreground truncate">{rec.nomeProposta || rec.projetoId}</p>
                          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                            {rec.statusProposta && (
                              <Badge variant="outline" className={`text-[10px] ${statusBadge(rec.statusProposta)}`}>
                                {rec.statusProposta}
                              </Badge>
                            )}
                            {rec.etiquetas && (
                              <Badge variant="secondary" className="text-[10px]">
                                {rec.etiquetas.split(',')[0]}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                            <span>{formatCurrencyFull(rec.valorProposta)}</span>
                            <span className="text-right">{rec.potenciaSistema.toFixed(1)} kWp</span>
                          </div>
                          {rec.responsavel && (
                            <p className="mt-1 text-[10px] text-muted-foreground truncate">
                              👤 {rec.responsavel}
                            </p>
                          )}
                        </div>
                      ))}
                      {items.length === 0 && (
                        <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                          Nenhum projeto
                        </div>
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

      {/* Empty */}
      {!isLoading && !error && filtered.length === 0 && records && records.length === 0 && (
        <Alert className="border-muted">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Nenhum dado encontrado no Data Store 84404.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
