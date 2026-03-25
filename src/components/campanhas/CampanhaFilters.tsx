import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CalendarDays } from 'lucide-react';

interface CampanhaFiltersProps {
  periodo: string;
  setPeriodo: (v: string) => void;
  campanha: string;
  setCampanha: (v: string) => void;
  campanhas: string[];
  canal?: string;
  setCanal?: (v: string) => void;
  extraFilters?: React.ReactNode;
}

export function CampanhaFilters({ periodo, setPeriodo, campanha, setCampanha, campanhas, canal, setCanal, extraFilters }: CampanhaFiltersProps) {
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

      <Select value={campanha} onValueChange={setCampanha}>
        <SelectTrigger className="w-[200px] h-9 text-xs">
          <SelectValue placeholder="Todas campanhas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas campanhas</SelectItem>
          {campanhas.map(c => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {extraFilters}
    </div>
  );
}
