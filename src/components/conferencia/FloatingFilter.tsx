import { useState } from "react";
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

interface FloatingFilterProps {
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

export function FloatingFilter({
  periodo, setPeriodo,
  dateFrom, setDateFrom,
  dateTo, setDateTo,
  filterEtapa, setFilterEtapa,
  filterTemp, setFilterTemp,
  searchTerm, setSearchTerm,
  etapasUnicas,
  hasFilters, clearFilters,
}: FloatingFilterProps) {
  const [open, setOpen] = useState(false);

  const activeCount = [
    periodo !== "30d",
    filterEtapa !== "todas",
    filterTemp !== "todas",
    !!searchTerm,
  ].filter(Boolean).length;

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-20 right-5 z-[60] flex items-center gap-2 rounded-full shadow-lg transition-all duration-300",
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

      {/* Filter Panel Overlay */}
      {open && (
        <div className="fixed bottom-36 right-5 z-[60] w-72 rounded-xl border border-border/50 bg-card/95 backdrop-blur-md shadow-2xl p-4 space-y-3 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">Filtros</p>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground" onClick={clearFilters}>
                Limpar tudo
              </Button>
            )}
          </div>

          {/* Período */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Período</label>
            <Select value={periodo} onValueChange={(v) => { setPeriodo(v); setDateFrom(undefined); setDateTo(undefined); }}>
              <SelectTrigger className="w-full h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
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
          </div>

          {periodo === "custom" && (
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("flex-1 h-8 text-xs gap-1", !dateFrom && "text-muted-foreground")}>
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
                  <Button variant="outline" size="sm" className={cn("flex-1 h-8 text-xs gap-1", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="h-3 w-3" />
                    {dateTo ? format(dateTo, "dd/MM/yy") : "Fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={ptBR} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Etapa */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Etapa</label>
            <Select value={filterEtapa} onValueChange={setFilterEtapa}>
              <SelectTrigger className="w-full h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas Etapas</SelectItem>
                {etapasUnicas.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Temperatura */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Temperatura</label>
            <Select value={filterTemp} onValueChange={setFilterTemp}>
              <SelectTrigger className="w-full h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="QUENTE">Quente</SelectItem>
                <SelectItem value="MORNO">Morno</SelectItem>
                <SelectItem value="FRIO">Frio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Busca */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Buscar</label>
            <div className="relative mt-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Nome do lead..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-7 text-xs"
              />
            </div>
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex flex-wrap gap-1 pt-1 border-t border-border/30">
              {periodo !== "30d" && <Badge variant="secondary" className="text-[9px]">{periodo}</Badge>}
              {filterEtapa !== "todas" && <Badge variant="secondary" className="text-[9px]">{filterEtapa}</Badge>}
              {filterTemp !== "todas" && <Badge variant="secondary" className="text-[9px]">{filterTemp}</Badge>}
              {searchTerm && <Badge variant="secondary" className="text-[9px]">"{searchTerm}"</Badge>}
            </div>
          )}
        </div>
      )}
    </>
  );
}
