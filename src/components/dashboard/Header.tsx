import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateFilter, DateRange, DateFilterPreset } from "./DateFilter";

interface HeaderProps {
  lastUpdate: string;
  selectedVendedor: string;
  selectedPreVendedor: string;
  onVendedorChange: (value: string) => void;
  onPreVendedorChange: (value: string) => void;
  vendedores: string[];
  preVendedores: string[];
  dateRange: DateRange;
  datePreset: DateFilterPreset;
  onDateRangeChange: (range: DateRange, preset: DateFilterPreset) => void;
}

const getDateLabel = (preset: DateFilterPreset, dateRange: DateRange): string | null => {
  if (preset === "all") return null;
  if (preset === "7days") return "Últimos 7 dias";
  if (preset === "30days") return "Últimos 30 dias";
  if (preset === "lastMonth") return "Mês anterior";
  if (preset === "custom" && dateRange.from) {
    if (dateRange.to) {
      return `${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`;
    }
    return format(dateRange.from, "dd/MM/yyyy", { locale: ptBR });
  }
  return null;
};

export function Header({
  lastUpdate,
  selectedVendedor,
  selectedPreVendedor,
  onVendedorChange,
  onPreVendedorChange,
  vendedores,
  preVendedores,
  dateRange,
  datePreset,
  onDateRangeChange
}: HeaderProps) {
  const dateLabel = getDateLabel(datePreset, dateRange);
  
  return (
    <div className="mb-6">
      {/* Title */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-foreground">BI Estratégico</h1>
        <p className="text-muted-foreground">
          Inteligência Comercial • Atualizado em {lastUpdate}
        </p>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedVendedor} onValueChange={onVendedorChange}>
          <SelectTrigger className="w-[240px] bg-secondary/50 border-border/50 hover:border-primary/50 transition-colors">
            <SelectValue placeholder="Gerente Comercial" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="todos">Todos Gerentes</SelectItem>
            {vendedores.map(v => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedPreVendedor} onValueChange={onPreVendedorChange}>
          <SelectTrigger className="w-[200px] bg-secondary/50 border-border/50 hover:border-primary/50 transition-colors">
            <SelectValue placeholder="Comercial Responsável" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="todos">Todos Comerciais</SelectItem>
            {preVendedores.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DateFilter
          dateRange={dateRange}
          preset={datePreset}
          onDateRangeChange={onDateRangeChange}
        />

        {/* Date Range Label */}
        {dateLabel && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/30 px-3 py-1.5 text-sm">
            <span className="font-semibold text-primary">{dateLabel}</span>
            <button 
              onClick={() => onDateRangeChange({ from: undefined, to: undefined }, "all")}
              className="text-primary/70 hover:text-primary ml-1"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
