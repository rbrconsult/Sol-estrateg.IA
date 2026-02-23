import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Users, Timer, CheckCircle2, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMemberStats {
  userId: string;
  email: string;
  name: string;
  ticketsResolved: number;
  totalWorkHours: number;
  avgResolutionHours: number;
  firstResponseAvgMin: number;
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

export function TeamMetrics() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [memberStats, setMemberStats] = useState<TeamMemberStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch all tickets (super admin can see all)
    const { data: ticketsData } = await supabase
      .from("support_tickets" as any)
      .select("*")
      .order("created_at", { ascending: false });

    const allTickets = (ticketsData as any[]) || [];
    setTickets(allTickets);

    // Fetch profiles for team member names
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name");

    const profileMap = new Map<string, { email: string; name: string }>();
    (profiles || []).forEach((p) => {
      profileMap.set(p.id, { email: p.email || "", name: p.full_name || p.email || "—" });
    });

    // Calculate per-member stats from resolved tickets
    const resolvedTickets = allTickets.filter((t: any) => t.resolved_at);
    const memberMap = new Map<string, { resolved: number; totalHours: number; firstResponseMin: number[]; }>();

    // Also count assigned tickets
    allTickets.forEach((t: any) => {
      const assignee = t.assigned_to || t.user_id;
      if (!memberMap.has(assignee)) {
        memberMap.set(assignee, { resolved: 0, totalHours: 0, firstResponseMin: [] });
      }
    });

    resolvedTickets.forEach((t: any) => {
      const assignee = t.assigned_to || t.user_id;
      if (!memberMap.has(assignee)) {
        memberMap.set(assignee, { resolved: 0, totalHours: 0, firstResponseMin: [] });
      }
      const stats = memberMap.get(assignee)!;
      stats.resolved += 1;

      const created = new Date(t.created_at).getTime();
      const resolved = new Date(t.resolved_at).getTime();
      const pausedMs = t.sla_paused_total_ms || 0;
      const workMs = resolved - created - pausedMs;
      stats.totalHours += Math.max(0, workMs) / (1000 * 60 * 60);

      if (t.first_response_at) {
        const firstResp = new Date(t.first_response_at).getTime();
        stats.firstResponseMin.push(Math.max(0, firstResp - created) / (1000 * 60));
      }
    });

    const statsArr: TeamMemberStats[] = [];
    memberMap.forEach((stats, userId) => {
      const profile = profileMap.get(userId);
      const avgFirstResp = stats.firstResponseMin.length > 0
        ? stats.firstResponseMin.reduce((a, b) => a + b, 0) / stats.firstResponseMin.length
        : 0;

      statsArr.push({
        userId,
        email: profile?.email || "—",
        name: profile?.name || "—",
        ticketsResolved: stats.resolved,
        totalWorkHours: Math.round(stats.totalHours * 10) / 10,
        avgResolutionHours: stats.resolved > 0 ? Math.round((stats.totalHours / stats.resolved) * 10) / 10 : 0,
        firstResponseAvgMin: Math.round(avgFirstResp),
      });
    });

    statsArr.sort((a, b) => b.ticketsResolved - a.ticketsResolved);
    setMemberStats(statsArr);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground py-4">Carregando métricas do time...</div>
    );
  }

  const totalResolved = tickets.filter((t: any) => t.resolved_at).length;
  const totalOpen = tickets.filter((t: any) => !["resolvido", "fechado"].includes(t.status)).length;

  const totalWorkHours = memberStats.reduce((sum, m) => sum + m.totalWorkHours, 0);
  const avgResolution = totalResolved > 0
    ? Math.round((totalWorkHours / totalResolved) * 10) / 10
    : 0;

  const avgFirstResponse = memberStats.filter(m => m.firstResponseAvgMin > 0);
  const globalAvgFirstResp = avgFirstResponse.length > 0
    ? Math.round(avgFirstResponse.reduce((s, m) => s + m.firstResponseAvgMin, 0) / avgFirstResponse.length)
    : 0;

  const formatHours = (h: number) => {
    if (h < 1) return `${Math.round(h * 60)}min`;
    if (h >= 24) return `${Math.round(h / 24 * 10) / 10}d`;
    return `${h}h`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Métricas do Time
        </h3>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard icon={CheckCircle2} label="Resolvidos" value={totalResolved} color="bg-emerald-500/15 text-emerald-500" />
        <MetricCard icon={Clock} label="Em Aberto" value={totalOpen} color="bg-blue-500/15 text-blue-500" />
        <MetricCard icon={Timer} label="Horas Totais" value={formatHours(totalWorkHours)} subtitle="Tempo de trabalho" color="bg-amber-500/15 text-amber-500" />
        <MetricCard icon={TrendingUp} label="Tempo Médio" value={formatHours(avgResolution)} subtitle="Por chamado" color="bg-purple-500/15 text-purple-500" />
        <MetricCard icon={Zap} label="1ª Resposta" value={globalAvgFirstResp > 0 ? `${globalAvgFirstResp}min` : "—"} subtitle="Média" color="bg-orange-500/15 text-orange-500" />
        <MetricCard icon={Users} label="Membros" value={memberStats.length} subtitle="Ativos" color="bg-cyan-500/15 text-cyan-500" />
      </div>

      {/* Per-member breakdown */}
      {memberStats.length > 0 && (
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 text-xs text-muted-foreground">
                <th className="text-left px-4 py-2.5 font-semibold">Membro</th>
                <th className="text-center px-3 py-2.5 font-semibold">Resolvidos</th>
                <th className="text-center px-3 py-2.5 font-semibold">Horas Totais</th>
                <th className="text-center px-3 py-2.5 font-semibold">Tempo Médio</th>
                <th className="text-center px-3 py-2.5 font-semibold">1ª Resposta</th>
              </tr>
            </thead>
            <tbody>
              {memberStats.map((m) => (
                <tr key={m.userId} className="border-t border-border/30 hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.email}</div>
                  </td>
                  <td className="text-center px-3 py-2.5 font-semibold">{m.ticketsResolved}</td>
                  <td className="text-center px-3 py-2.5">{formatHours(m.totalWorkHours)}</td>
                  <td className="text-center px-3 py-2.5">{m.ticketsResolved > 0 ? formatHours(m.avgResolutionHours) : "—"}</td>
                  <td className="text-center px-3 py-2.5">{m.firstResponseAvgMin > 0 ? `${m.firstResponseAvgMin}min` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
