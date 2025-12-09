import { LayoutDashboard, Kanban, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
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
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
      <div className="mx-auto max-w-[1600px] px-6 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 shadow-lg animate-glow">
              <span className="text-2xl font-black text-primary-foreground tracking-tighter">E</span>
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-warning animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground bg-clip-text">
                EVOLVE BI
              </h1>
              <p className="text-sm font-medium text-primary">Inteligência Comercial Estratégica</p>
            </div>
          </div>

          {/* Navigation and Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Navigation */}
            <Button variant="default" className="bg-primary hover:bg-primary/90 shadow-md" disabled>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            
            <Link to="/pipeline">
              <Button variant="outline" className="border-border/50 bg-secondary/50 hover:bg-secondary hover:border-primary/50">
                <Kanban className="mr-2 h-4 w-4" />
                Pipeline
              </Button>
            </Link>

            <div className="w-px h-8 bg-border/50 mx-1" />

            {/* Filters */}
            <Select value={selectedVendedor} onValueChange={onVendedorChange}>
              <SelectTrigger className="w-[180px] bg-secondary/50 border-border/50 hover:border-primary/50 transition-colors">
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Vendedores</SelectItem>
                {vendedores.map(v => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPreVendedor} onValueChange={onPreVendedorChange}>
              <SelectTrigger className="w-[200px] bg-secondary/50 border-border/50 hover:border-primary/50 transition-colors">
                <SelectValue placeholder="Comercial Responsável" />
              </SelectTrigger>
              <SelectContent>
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

            {/* Theme Toggle */}
            <ThemeToggle />

            <div className="flex items-center gap-2 rounded-lg bg-secondary/50 border border-border/50 px-4 py-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-muted-foreground">Atualizado:</span>
              <span className="font-medium text-foreground">{lastUpdate}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
