import { LayoutDashboard, Kanban, Sparkles, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
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
  const { signOut, user, userRole } = useAuth();
  const dateLabel = getDateLabel(datePreset, dateRange);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Logout realizado com sucesso!');
  };
  
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
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-primary">Inteligência Comercial Estratégica</p>
                <span className="text-xs text-muted-foreground">• {lastUpdate}</span>
              </div>
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
              <SelectTrigger className="w-[280px] bg-secondary/50 border-border/50 hover:border-primary/50 transition-colors">
                <SelectValue placeholder="Gerente Comercial - Guilherme Aguiar" />
              </SelectTrigger>
              <SelectContent>
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

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Info & Logout */}
            <div className="flex items-center gap-2 ml-2">
              <div className="hidden md:flex flex-col items-end text-xs">
                <span className="text-muted-foreground truncate max-w-[150px]">{user?.email}</span>
                {userRole === 'super_admin' && (
                  <span className="text-warning font-semibold">Super Admin</span>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleSignOut}
                className="border-border/50 hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
