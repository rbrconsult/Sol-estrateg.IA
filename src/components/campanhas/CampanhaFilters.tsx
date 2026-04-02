import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { CalendarDays, ChevronDown, X, Search } from 'lucide-react';

interface CampanhaFiltersProps {
  periodo: string;
  setPeriodo: (v: string) => void;
  /** Selected campaigns (multi-select). Empty = all */
  selectedCampanhas: string[];
  setSelectedCampanhas: (v: string[]) => void;
  /** All available campaign names */
  campanhas: string[];
  canal?: string;
  setCanal?: (v: string) => void;
  extraFilters?: React.ReactNode;
}

export function CampanhaFilters({ periodo, setPeriodo, selectedCampanhas, setSelectedCampanhas, campanhas, canal, setCanal, extraFilters }: CampanhaFiltersProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filteredList = campanhas.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (name: string) => {
    if (selectedCampanhas.includes(name)) {
      setSelectedCampanhas(selectedCampanhas.filter(c => c !== name));
    } else {
      setSelectedCampanhas([...selectedCampanhas, name]);
    }
  };

  const clearAll = () => setSelectedCampanhas([]);
  const selectAll = () => setSelectedCampanhas([...campanhas]);

  const label = selectedCampanhas.length === 0
    ? 'Todas campanhas'
    : selectedCampanhas.length === 1
      ? selectedCampanhas[0]
      : `${selectedCampanhas.length} campanhas`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={periodo} onValueChange={setPeriodo}>
        <SelectTrigger className="w-[150px] h-9 text-xs">
          <CalendarDays className="h-3.5 w-3.5 mr-1" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Últimos 7 dias</SelectItem>
          <SelectItem value="14d">Últimos 14 dias</SelectItem>
          <SelectItem value="30d">Últimos 30 dias</SelectItem>
          <SelectItem value="90d">Últimos 90 dias</SelectItem>
          <SelectItem value="all">Todo período</SelectItem>
        </SelectContent>
      </Select>

      {setCanal && (
        <Select value={canal || 'all'} onValueChange={setCanal}>
          <SelectTrigger className="w-[130px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos canais</SelectItem>
            <SelectItem value="meta">Meta</SelectItem>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="site_ga4">Site (GA4)</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Multi-select campanhas */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 text-xs min-w-[200px] justify-between gap-1">
            <span className="truncate max-w-[160px]">{label}</span>
            {selectedCampanhas.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-1">
                {selectedCampanhas.length}
              </Badge>
            )}
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar campanha..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 text-xs pl-7"
              />
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-1.5 border-b">
            <button onClick={selectAll} className="text-[11px] text-primary hover:underline">Selecionar tudo</button>
            <button onClick={clearAll} className="text-[11px] text-muted-foreground hover:underline">Limpar</button>
          </div>
          <ScrollArea className="max-h-[240px]">
            <div className="p-1">
              {filteredList.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhuma campanha encontrada</p>
              )}
              {filteredList.map(c => (
                <label
                  key={c}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
                >
                  <Checkbox
                    checked={selectedCampanhas.includes(c)}
                    onCheckedChange={() => toggle(c)}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-xs truncate">{c}</span>
                </label>
              ))}
            </div>
          </ScrollArea>
          {selectedCampanhas.length > 0 && (
            <div className="border-t p-2 flex flex-wrap gap-1">
              {selectedCampanhas.slice(0, 5).map(c => (
                <Badge key={c} variant="secondary" className="text-[10px] gap-1 pr-1">
                  <span className="truncate max-w-[100px]">{c}</span>
                  <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => toggle(c)} />
                </Badge>
              ))}
              {selectedCampanhas.length > 5 && (
                <Badge variant="outline" className="text-[10px]">+{selectedCampanhas.length - 5}</Badge>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>

      {extraFilters}
    </div>
  );
}
