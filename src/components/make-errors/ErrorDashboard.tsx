import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MakeError } from "@/hooks/useMakeErrors";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { OctagonAlert, AlertTriangle, CheckCircle, Cpu } from "lucide-react";

interface Props {
  errors: MakeError[];
  isLoading: boolean;
}

export function ErrorDashboard({ errors, isLoading }: Props) {
  const today = new Date().toISOString().split("T")[0];

  const stopped = errors.filter((e) => e.execution_status === "stopped" && e.status !== "resolved");
  const errorContinued = errors.filter((e) => e.execution_status === "error_continued" && e.status !== "resolved");
  const resolvedToday = errors.filter((e) => e.resolved_at?.startsWith(today));

  const topModule = useMemo(() => {
    const counts: Record<string, number> = {};
    errors.forEach((e) => {
      const key = `${e.module_app ?? "?"} / ${e.module_name ?? "?"}`;
      counts[key] = (counts[key] ?? 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? { name: sorted[0][0], count: sorted[0][1] } : null;
  }, [errors]);

  // Bar chart: errors per category (last 7 days)
  const categoryData = useMemo(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const recent = errors.filter((e) => (e.occurred_at ?? "") >= sevenDaysAgo);
    const counts: Record<string, number> = {};
    recent.forEach((e) => {
      const cat = e.flow_category ?? "Geral Evolve";
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [errors]);

  // Line chart: daily errors last 30 days
  const dailyData = useMemo(() => {
    const days: Record<string, { stopped: number; error_continued: number }> = {};
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    errors.forEach((e) => {
      const d = (e.occurred_at ?? e.created_at).split("T")[0];
      if (new Date(d) < thirtyDaysAgo) return;
      if (!days[d]) days[d] = { stopped: 0, error_continued: 0 };
      if (e.execution_status === "stopped") days[d].stopped++;
      else days[d].error_continued++;
    });
    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date: date.slice(5), ...v }));
  }, [errors]);

  // Top 5 problematic modules
  const topModules = useMemo(() => {
    const map: Record<string, { app: string; name: string; stopped: number; error_continued: number }> = {};
    errors.forEach((e) => {
      const key = `${e.module_app}||${e.module_name}`;
      if (!map[key]) map[key] = { app: e.module_app ?? "?", name: e.module_name ?? "?", stopped: 0, error_continued: 0 };
      if (e.execution_status === "stopped") map[key].stopped++;
      else map[key].error_continued++;
    });
    return Object.values(map)
      .map((m) => ({ ...m, total: m.stopped + m.error_continued }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [errors]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={stopped.length > 0 ? "border-destructive shadow-[0_0_15px_rgba(239,68,68,0.15)]" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <OctagonAlert className="h-4 w-4 text-destructive" /> Fluxos Parados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">{stopped.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Erros com Continuidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-500">{errorContinued.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" /> Resolvidos Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-500">{resolvedToday.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" /> Módulo com Mais Falhas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold truncate">
              {topModule ? `${topModule.name} (${topModule.count})` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Erros por Categoria (7 dias)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Volume Diário (30 dias)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="stopped" name="Parados" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="error_continued" name="Continuou" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Modules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Top 5 Módulos Problemáticos</CardTitle>
        </CardHeader>
        <CardContent>
          {topModules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum erro encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium text-muted-foreground">App</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Módulo</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">Parados</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">Continuou</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {topModules.map((m, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2">{m.app}</td>
                      <td className="py-2">{m.name}</td>
                      <td className="py-2 text-center text-destructive font-medium">{m.stopped}</td>
                      <td className="py-2 text-center text-amber-500 font-medium">{m.error_continued}</td>
                      <td className="py-2 text-center font-bold">{m.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
