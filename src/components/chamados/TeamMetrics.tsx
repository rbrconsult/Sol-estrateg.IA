import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Clock, Users, Timer, CheckCircle2, TrendingUp, Zap, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange as DayPickerDateRange } from "react-day-picker";

type PeriodPreset = "thisMonth" | "lastMonth" | "last3Months" | "custom";

interface DateRange {
  from: Date;
  to: Date;
}

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
}

function MetricCard({ icon: Icon, label, value, subtitle, color }: MetricCardProps) {
  return (
    <Card className="group hover:-translate-y-0.5 transition-all duration-200">
      <CardContent className="flex items-center gap-4 p-4">
        <div className={cn("p-2.5 rounded-xl", color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-extrabold tracking-tight">{value}</p>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {subtitle && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function getPresetRange(preset: Exclude<PeriodPreset, "custom">): DateRange {
  const now = new Date();
  switch (preset) {
    case "thisMonth":
      return { from: startOfMonth(now), to: now };
    case "lastMonth": {
      const last = subMonths(now, 1);
      return { from: startOfMonth(last), to: endOfMonth(last) };
    }
    case "last3Months":
      return { from: startOfMonth(subMonths(now, 2)), to: now };
  }
}

export function TeamMetrics() {
  const [preset, setPreset] = useState<PeriodPreset>("thisMonth");
  const [dateRange, setDateRange] = useState<DateRange>(getPresetRange("thisMonth"));
  const [customOpen, setCustomOpen] = useState(false);
  const [tempRange, setTempRange] = useState<{ from?: Date; to?: Date }>({});

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: ticketsData } = await supabase
      .from("support_tickets" as any)
      .select("*")
      .order("created_at", { ascending: false });
    setTickets((ticketsData as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePreset = (p: Exclude<PeriodPreset, "custom">) => {
    setPreset(p);
    setDateRange(getPresetRange(p));
  };

  const handleCustomSelect = (range: DayPickerDateRange | undefined) => {
    if (!range) return;
    setTempRange({ from: range.from, to: range.to });
    if (range.from && range.to) {
      setDateRange({ from: range.from, to: range.to });
      setPreset("custom");
      setCustomOpen(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground py-4">Carregando métricas do time...</div>;
  }

  // Filter tickets by date range
  const filtered = tickets.filter((t: any) => {
    const d = new Date(t.created_at);
    return d >= dateRange.from && d <= dateRange.to;
  });

  const totalResolved = filtered.filter((t: any) => t.resolved_at).length;
  const totalOpen = filtered.filter((t: any) => !["resolvido", "fechado"].includes(t.status)).length;

  // Calculate work hours from resolved filtered tickets
  let totalWorkHours = 0;
  const firstResponseTimes: number[] = [];
  const memberSet = new Set<string>();

  filtered.forEach((t: any) => {
    memberSet.add(t.assigned_to || t.user_id);
    if (t.resolved_at) {
      const created = new Date(t.created_at).getTime();
      const resolved = new Date(t.resolved_at).getTime();
      const pausedMs = t.sla_paused_total_ms || 0;
      totalWorkHours += Math.max(0, resolved - created - pausedMs) / (1000 * 60 * 60);
    }
    if (t.first_response_at) {
      const created = new Date(t.created_at).getTime();
      firstResponseTimes.push(Math.max(0, new Date(t.first_response_at).getTime() - created) / (1000 * 60));
    }
  });

  const avgResolution = totalResolved > 0 ? Math.round((totalWorkHours / totalResolved) * 10) / 10 : 0;
  const avgFirstResp = firstResponseTimes.length > 0
    ? Math.round(firstResponseTimes.reduce((a, b) => a + b, 0) / firstResponseTimes.length)
    : 0;

  const formatHours = (h: number) => {
    if (h < 1) return `${Math.round(h * 60)}min`;
    if (h >= 24) return `${Math.round(h / 24 * 10) / 10}d`;
    return `${Math.round(h * 10) / 10}h`;
  };

  const presetLabel = () => {
    if (preset === "custom") {
      return `${format(dateRange.from, "dd/MM", { locale: ptBR })} - ${format(dateRange.to, "dd/MM", { locale: ptBR })}`;
    }
    return { thisMonth: "Este Mês", lastMonth: "Mês Passado", last3Months: "Últimos 3 Meses" }[preset];
  };

  const presets: { value: Exclude<PeriodPreset, "custom">; label: string }[] = [
    { value: "thisMonth", label: "Este Mês" },
    { value: "lastMonth", label: "Mês Passado" },
    { value: "last3Months", label: "Últimos 3 Meses" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Métricas do Time
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {presets.map((p) => (
            <Button
              key={p.value}
              variant={preset === p.value ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => handlePreset(p.value)}
            >
              {p.label}
            </Button>
          ))}
          <Popover open={customOpen} onOpenChange={(o) => { setCustomOpen(o); if (o) setTempRange({}); }}>
            <PopoverTrigger asChild>
              <Button
                variant={preset === "custom" ? "default" : "outline"}
                size="sm"
                className="text-xs gap-1.5"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                {preset === "custom" ? presetLabel() : "Personalizado"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3 pointer-events-auto" align="end">
              <p className="text-xs text-muted-foreground mb-2">
                {tempRange.from && !tempRange.to ? "Selecione a data final" : "Selecione início e fim"}
              </p>
              <CalendarComponent
                mode="range"
                selected={tempRange as DayPickerDateRange}
                onSelect={handleCustomSelect}
                numberOfMonths={1}
                locale={ptBR}
                className="pointer-events-auto"
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard icon={CheckCircle2} label="Resolvidos" value={totalResolved} color="bg-emerald-500/15 text-emerald-500" />
        <MetricCard icon={Clock} label="Em Aberto" value={totalOpen} color="bg-blue-500/15 text-blue-500" />
        <MetricCard icon={Timer} label="Horas Totais" value={formatHours(totalWorkHours)} subtitle="Tempo de trabalho" color="bg-amber-500/15 text-amber-500" />
        <MetricCard icon={TrendingUp} label="Tempo Médio" value={formatHours(avgResolution)} subtitle="Por chamado" color="bg-purple-500/15 text-purple-500" />
        <MetricCard icon={Zap} label="1ª Resposta" value={avgFirstResp > 0 ? `${avgFirstResp}min` : "—"} subtitle="Média" color="bg-orange-500/15 text-orange-500" />
        <MetricCard icon={Users} label="Membros" value={memberSet.size} subtitle="Ativos" color="bg-cyan-500/15 text-cyan-500" />
      </div>
    </div>
  );
}
