import { ScenarioHealth } from "@/hooks/useMakeHeartbeat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle2, XCircle, AlertTriangle, Timer } from "lucide-react";

interface Props {
  scenarios: ScenarioHealth[];
  isLoading: boolean;
}

export function HeartbeatSummary({ scenarios, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6"><div className="h-12 bg-muted rounded" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalScenarios = scenarios.length;
  const healthy = scenarios.filter((s) => s.uptime >= 99).length;
  const degraded = scenarios.filter((s) => s.uptime >= 90 && s.uptime < 99).length;
  const critical = scenarios.filter((s) => s.uptime < 90).length;
  const globalUptime = totalScenarios > 0
    ? scenarios.reduce((acc, s) => acc + s.uptime, 0) / totalScenarios
    : 100;
  const totalErrors = scenarios.reduce((acc, s) => acc + s.errors, 0);
  const totalWarnings = scenarios.reduce((acc, s) => acc + s.warnings, 0);
  const avgDurations = scenarios.filter((s) => s.avgDuration != null).map((s) => s.avgDuration!);
  const globalAvgDuration = avgDurations.length > 0
    ? avgDurations.reduce((a, b) => a + b, 0) / avgDurations.length
    : null;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Uptime Global</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${globalUptime >= 99 ? "text-emerald-500" : globalUptime >= 90 ? "text-amber-500" : "text-destructive"}`}>
            {globalUptime.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {healthy} saudável · {degraded} degradado · {critical} crítico
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cenários Ativos</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalScenarios}</div>
          <p className="text-xs text-muted-foreground mt-1">monitorados em tempo real</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Erros / Avisos</CardTitle>
          <XCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            <span className="text-destructive">{totalErrors}</span>
            <span className="text-muted-foreground mx-1">/</span>
            <span className="text-amber-500">{totalWarnings}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">nos últimos 7 dias</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
          <Timer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {globalAvgDuration != null ? `${globalAvgDuration.toFixed(0)}s` : "—"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">duração média por execução</p>
        </CardContent>
      </Card>
    </div>
  );
}
