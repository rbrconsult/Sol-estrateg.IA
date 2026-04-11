import { useState, useMemo, useCallback } from "react";
import { Filter, X, CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JOURNEY_ORDER } from "@/lib/leads-utils";
import {
  DEFAULT_GLOBAL_FILTER_STATE,
  filterProposalsByGlobalFilters,
  filterRecordsByGlobalFilters,
  getEffectiveDateRange,
  type FilterConfig,
  type FilterState,
  type FilterableProposal,
  type FilterableRecord,
} from "@/lib/globalFilters";

export type { FilterConfig, FilterState } from "@/lib/globalFilters";

const ALL_ETAPAS = JOURNEY_ORDER;
const ALL_STATUSES = ["ABERTO", "GANHO", "PERDIDO", "EXCLUIDO"];

export function usePageFilters(config?: FilterConfig, defaultPeriodo?: string) {
  const initialState = useMemo<FilterState>(
    () => ({ ...DEFAULT_GLOBAL_FILTER_STATE, periodo: defaultPeriodo || DEFAULT_GLOBAL_FILTER_STATE.periodo }),
    [defaultPeriodo],
  );
  const [filters, setFilters] = useState<FilterState>(initialState);

  const setPeriodo = useCallback((v: string) => setFilters((f) => ({ ...f, periodo: v, dateFrom: undefined, dateTo: undefined })), []);
  const setDateFrom = useCallback((d: Date | undefined) => setFilters((f) => ({ ...f, dateFrom: d })), []);
  const setDateTo = useCallback((d: Date | undefined) => setFilters((f) => ({ ...f, dateTo: d })), []);
  const setCanal = useCallback((v: string) => setFilters((f) => ({ ...f, canal: v })), []);
  const setTemperatura = useCallback((v: string) => setFilters((f) => ({ ...f, temperatura: v })), []);
  const setSearchTerm = useCallback((v: string) => setFilters((f) => ({ ...f, searchTerm: v })), []);
  const setEtapa = useCallback((v: string) => setFilters((f) => ({ ...f, etapa: v })), []);
  const setStatus = useCallback((v: string) => setFilters((f) => ({ ...f, status: v })), []);
  const clearFilters = useCallback(() => setFilters(initialState), [initialState]);

  const hasFilters =
    filters.periodo !== initialState.periodo ||
    !!filters.dateFrom ||
    !!filters.dateTo ||
    filters.canal !== initialState.canal ||
    filters.temperatura !== initialState.temperatura ||
    !!filters.searchTerm ||
    filters.etapa !== initialState.etapa ||
    filters.status !== initialState.status;

  const effectiveDateRange = useMemo(
    () => getEffectiveDateRange(filters),
    [filters.periodo, filters.dateFrom, filters.dateTo],
  );

  const filterRecords = useCallback(
    <T extends FilterableRecord>(records: T[]): T[] => filterRecordsByGlobalFilters(records, filters, effectiveDateRange),
    [effectiveDateRange, filters],
  );

  const filterProposals = useCallback(
    <T extends FilterableProposal>(proposals: T[]): T[] => filterProposalsByGlobalFilters(proposals, filters, effectiveDateRange),
    [effectiveDateRange, filters],
  );

  return {
    filters,
    hasFilters,
    clearFilters,
    setPeriodo,
    setDateFrom,
    setDateTo,
    setCanal,
    setTemperatura,
    setSearchTerm,
    setEtapa,
    setStatus,
    effectiveDateRange,
    filterRecords,
    filterProposals,
  };
}

interface PageFloatingFilterProps {
  filters: FilterState;
  hasFilters: boolean;
  clearFilters: () => void;
  setPeriodo: (v: string) => void;
  setDateFrom: (d: Date | undefined) => void;
  setDateTo: (d: Date | undefined) => void;
  setCanal?: (v: string) => void;
  setTemperatura?: (v: string) => void;
  setSearchTerm?: (v: string) => void;
  setEtapa?: (v: string) => void;
  setStatus?: (v: string) => void;
  canais?: string[];
  config?: FilterConfig;
}

export function PageFloatingFilter({
  filters, hasFilters, clearFilters,
  setPeriodo, setDateFrom, setDateTo,
  setCanal, setTemperatura, setSearchTerm, setEtapa, setStatus,
  canais = [],
  config = { showPeriodo: true },
}: PageFloatingFilterProps) {
  const [open, setOpen] = useState(false);

  const activeCount = [
    filters.periodo !== "all",
    filters.canal !== "todos",
    filters.temperatura !== "todas",
    !!filters.searchTerm,
    filters.etapa !== "todas",
    filters.status !== "todos",
  ].filter(Boolean).length;

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-20 right-5 z-[9990] flex items-center gap-2 rounded-full shadow-lg transition-all duration-300",
          "bg-primary text-primary-foreground hover:shadow-xl hover:scale-105",
          open ? "px-4 py-3" : "p-3"
        )}
      >
        {open ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
        {!open && activeCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
        {open && <span className="text-xs font-medium">Fechar</span>}
      </button>

      {open && (
        <div className="fixed bottom-36 right-5 z-[9990] w-72 rounded-xl border border-border/50 bg-card/95 backdrop-blur-md shadow-2xl p-4 space-y-3 animate-in slide-in-from-bottom-4 fade-in duration-200 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">Filtros Globais</p>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground" onClick={clearFilters}>
                Limpar tudo
              </Button>
            )}
          </div>

          {/* Período */}
          {config.showPeriodo !== false && (
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Período</label>
              <Select value={filters.periodo} onValueChange={(v) => { setPeriodo(v); setDateFrom(undefined); setDateTo(undefined); }}>
                <SelectTrigger className="w-full h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="hoje">Hoje</SelectItem>
                   <SelectItem value="7d">7 dias</SelectItem>
                   <SelectItem value="mes">Este mês</SelectItem>
                   <SelectItem value="mesAnterior">Mês anterior</SelectItem>
                   <SelectItem value="all">Todos</SelectItem>
                   <SelectItem value="custom">Personalizado</SelectItem>
                 </SelectContent>
              </Select>
            </div>
          )}

          {filters.periodo === "custom" && (
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("flex-1 h-8 text-xs gap-1", !filters.dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="h-3 w-3" />
                    {filters.dateFrom ? format(filters.dateFrom, "dd/MM/yy") : "Início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={filters.dateFrom} onSelect={setDateFrom} locale={ptBR} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("flex-1 h-8 text-xs gap-1", !filters.dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="h-3 w-3" />
                    {filters.dateTo ? format(filters.dateTo, "dd/MM/yy") : "Fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={filters.dateTo} onSelect={setDateTo} locale={ptBR} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Etapa Funil — posição no funil */}
          {config.showEtapa && setEtapa && (
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">📋 Etapa do Funil</label>
              <Select value={filters.etapa} onValueChange={setEtapa}>
                <SelectTrigger className="w-full h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Etapas</SelectItem>
                  {(config.etapas || ALL_ETAPAS).map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status — situação de resposta do lead */}
          {config.showStatus && setStatus && (
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">🏷 Situação do Lead</label>
              <Select value={filters.status} onValueChange={setStatus}>
                <SelectTrigger className="w-full h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Situações</SelectItem>
                  {(config.statuses || ALL_STATUSES).map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Canal */}
          {config.showCanal && setCanal && canais.length > 0 && (
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Canal / Origem</label>
              <Select value={filters.canal} onValueChange={setCanal}>
                <SelectTrigger className="w-full h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {canais.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Temperatura */}
          {config.showTemperatura && setTemperatura && (
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Temperatura</label>
              <Select value={filters.temperatura} onValueChange={setTemperatura}>
                <SelectTrigger className="w-full h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="QUENTE">🔥 Quente</SelectItem>
                  <SelectItem value="MORNO">🌤 Morno</SelectItem>
                  <SelectItem value="FRIO">❄️ Frio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Busca */}
          {config.showSearch && setSearchTerm && (
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Buscar</label>
              <div className="relative mt-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder={config.searchPlaceholder || "Nome do lead..."}
                  value={filters.searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 pl-7 text-xs"
                />
              </div>
            </div>
          )}

          {/* Active chips */}
          {hasFilters && (
            <div className="flex flex-wrap gap-1 pt-1 border-t border-border/30">
              {filters.periodo !== "all" && <Badge variant="secondary" className="text-[9px]">{filters.periodo}</Badge>}
              {filters.etapa !== "todas" && <Badge variant="secondary" className="text-[9px]">📋 {filters.etapa}</Badge>}
              {filters.status !== "todos" && <Badge variant="secondary" className="text-[9px]">🏷 {filters.status.replace(/_/g, ' ')}</Badge>}
              {filters.canal !== "todos" && <Badge variant="secondary" className="text-[9px]">{filters.canal}</Badge>}
              {filters.temperatura !== "todas" && <Badge variant="secondary" className="text-[9px]">{filters.temperatura}</Badge>}
              {filters.searchTerm && <Badge variant="secondary" className="text-[9px]">"{filters.searchTerm}"</Badge>}
            </div>
          )}
        </div>
      )}
    </>
  );
}