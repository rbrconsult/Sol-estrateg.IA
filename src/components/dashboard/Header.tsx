import { Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HeaderProps {
  lastUpdate: string;
  selectedVendedor: string;
  selectedPreVendedor: string;
  onVendedorChange: (value: string) => void;
  onPreVendedorChange: (value: string) => void;
  vendedores: string[];
  preVendedores: string[];
}

export function Header({
  lastUpdate,
  selectedVendedor,
  selectedPreVendedor,
  onVendedorChange,
  onPreVendedorChange,
  vendedores,
  preVendedores
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="mx-auto max-w-[1600px] px-6 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-glow-primary">
              <span className="text-xl font-bold text-primary-foreground">E</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                EVOLVE
              </h1>
              <p className="text-sm text-muted-foreground">Dashboard Comercial</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedVendedor} onValueChange={onVendedorChange}>
              <SelectTrigger className="w-[180px] bg-background border-border">
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
              <SelectTrigger className="w-[180px] bg-background border-border">
                <SelectValue placeholder="Pré-vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Pré-vendedores</SelectItem>
                {preVendedores.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" className="border-border bg-background">
              <Calendar className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Atualizado: {lastUpdate}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
