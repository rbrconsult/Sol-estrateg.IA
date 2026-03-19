import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Search, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InlineFiltersProps {
  periodo: string;
  setPeriodo: (v: string) => void;
  dateFrom?: Date;
  setDateFrom: (d: Date | undefined) => void;
  dateTo?: Date;
  setDateTo: (d: Date | undefined) => void;
  filterEtapa: string;
  setFilterEtapa: (v: string) => void;
  filterTemp: string;
  setFilterTemp: (v: string) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  etapasUnicas: string[];
  hasFilters: boolean;
  clearFilters: () => void;
}

export function InlineFilters({
  periodo, setPeriodo,
  dateFrom, setDateFrom,
  dateTo, setDateTo,
  filterEtapa, setFilterEtapa,
  filterTemp, setFilterTemp,
  searchTerm, setSearchTerm,
  etapasUnicas,
  hasFilters, clearFilters,
}: InlineFiltersProps) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm p-3 mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-muted-foreground mr-1">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="text-[10px] font-semibold uppercase tracking-wider hidden sm:inline">Filtros</span>
        </div>

        {/* Período */}
        <Select value={periodo} onValueChange={(v) => { setPeriodo(v); setDateFrom(undefined); setDateTo(undefined); }}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="3d">3 dias</SelectItem>
            <SelectItem value="7d">7 dias</SelectItem>
            <SelectItem value="30d">30 dias</SelectItem>
            <SelectItem value="90d">90 dias</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>

        {/* Custom date pickers */}
        {periodo === "custom" && (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="h-3 w-3" />
                  {dateFrom ? format(dateFrom, "dd/MM/yy") : "Início"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={ptBR} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="h-3 w-3" />
                  {dateTo ? format(dateTo, "dd/MM/yy") : "Fim"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={ptBR} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </>
        )}

        {/* Etapa */}
        <Select value={filterEtapa} onValueChange={setFilterEtapa}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas Etapas</SelectItem>
            {etapasUnicas.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Temperatura */}
        <Select value={filterTemp} onValueChange={setFilterTemp}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Temperatura" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas Temp.</SelectItem>
            <SelectItem value="QUENTE">🔥 Quente</SelectItem>
            <SelectItem value="MORNO">🌤 Morno</SelectItem>
            <SelectItem value="FRIO">❄️ Frio</SelectItem>
          </SelectContent>
        </Select>

        {/* Busca */}
        <div className="relative flex-1 min-w-[140px] max-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Buscar lead..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-7 text-xs"
          />
        </div>

        {/* Limpar */}
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground gap-1" onClick={clearFilters}>
            <X className="h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>

      {/* Active chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/30">
          {periodo !== "30d" && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              Período: {periodo === "custom" ? "Personalizado" : periodo}
            </Badge>
          )}
          {filterEtapa !== "todas" && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              {filterEtapa}
              <button onClick={() => setFilterEtapa("todas")} className="ml-0.5 hover:text-foreground"><X className="h-2.5 w-2.5" /></button>
            </Badge>
          )}
          {filterTemp !== "todas" && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              {filterTemp}
              <button onClick={() => setFilterTemp("todas")} className="ml-0.5 hover:text-foreground"><X className="h-2.5 w-2.5" /></button>
            </Badge>
          )}
          {searchTerm && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              "{searchTerm}"
              <button onClick={() => setSearchTerm("")} className="ml-0.5 hover:text-foreground"><X className="h-2.5 w-2.5" /></button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
