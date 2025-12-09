import { useState } from "react";
import { Calendar, CalendarDays } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

export type DateFilterPreset = "all" | "7days" | "30days" | "lastMonth" | "custom";

interface DateFilterProps {
  dateRange: DateRange;
  preset: DateFilterPreset;
  onDateRangeChange: (range: DateRange, preset: DateFilterPreset) => void;
}

export function DateFilter({ dateRange, preset, onDateRangeChange }: DateFilterProps) {
  const [open, setOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange>(dateRange);

  const handlePresetClick = (newPreset: DateFilterPreset) => {
    const today = new Date();
    let newRange: DateRange = { from: undefined, to: undefined };

    switch (newPreset) {
      case "all":
        newRange = { from: undefined, to: undefined };
        break;
      case "7days":
        newRange = { from: subDays(today, 7), to: today };
        break;
      case "30days":
        newRange = { from: subDays(today, 30), to: today };
        break;
      case "lastMonth":
        const lastMonth = subMonths(today, 1);
        newRange = { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
        break;
      case "custom":
        // Don't close, let user pick dates
        return;
    }

    onDateRangeChange(newRange, newPreset);
    setOpen(false);
  };

  const handleCustomDateSelect = (range: DateRange | undefined) => {
    if (range) {
      setTempRange(range);
    }
  };

  const applyCustomRange = () => {
    if (tempRange.from) {
      onDateRangeChange(tempRange, "custom");
      setOpen(false);
    }
  };

  const getButtonLabel = () => {
    if (preset === "all") return "Período";
    if (preset === "7days") return "7 dias";
    if (preset === "30days") return "30 dias";
    if (preset === "lastMonth") return "Mês anterior";
    if (preset === "custom" && dateRange.from) {
      if (dateRange.to) {
        return `${format(dateRange.from, "dd/MM", { locale: ptBR })} - ${format(dateRange.to, "dd/MM", { locale: ptBR })}`;
      }
      return format(dateRange.from, "dd/MM/yy", { locale: ptBR });
    }
    return "Período";
  };

  const presets: { value: DateFilterPreset; label: string }[] = [
    { value: "all", label: "Todos" },
    { value: "7days", label: "7 dias" },
    { value: "30days", label: "30 dias" },
    { value: "lastMonth", label: "Mês anterior" },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "border-border/50 bg-secondary/50 hover:bg-secondary hover:border-primary/50 gap-2",
            preset !== "all" && "border-primary/50 bg-primary/10"
          )}
        >
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">{getButtonLabel()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="p-3 border-b border-border">
          <p className="text-sm font-medium text-foreground mb-2">Filtrar por período</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <Button
                key={p.value}
                variant={preset === p.value ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetClick(p.value)}
                className="text-xs"
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="p-3">
          <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Personalizado
          </p>
          <CalendarComponent
            mode="range"
            selected={tempRange}
            onSelect={handleCustomDateSelect}
            numberOfMonths={1}
            locale={ptBR}
            className="pointer-events-auto"
          />
          <div className="mt-3 flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              size="sm" 
              onClick={applyCustomRange}
              disabled={!tempRange.from}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
