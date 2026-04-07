import { useMemo } from "react";
import { Globe, TrendingUp, Users, MousePointer, Clock, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useGA4Metrics } from "@/hooks/useCampaignData";
import { usePageFilters, PageFloatingFilter } from "@/components/filters/PageFloatingFilter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

function KPICard({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GA4Page() {
  const { data: ga4Data, isLoading } = useGA4Metrics();
  const pf = usePageFilters({ showPeriodo: true, showSearch: true }, "mes");

  const filtered = useMemo(() => {
    if (!ga4Data) return [];
    let records = ga4Data;
    if (pf.effectiveDateRange?.from) {
      const from = pf.effectiveDateRange.from.toISOString().slice(0, 10);
      records = records.filter((r) => r.date >= from);
    }
    if (pf.effectiveDateRange?.to) {
      const to = pf.effectiveDateRange.to.toISOString().slice(0, 10);
      records = records.filter((r) => r.date <= to);
    }
    return records;
  }, [ga4Data, pf.effectiveDateRange]);

  const kpis = useMemo(() => {
    const totalSessions = filtered.reduce((s, r) => s + r.sessions, 0);
    const totalUsers = filtered.reduce((s, r) => s + (r.users || 0), 0);
    const totalNewUsers = filtered.reduce((s, r) => s + r.new_users, 0);
    const totalConversions = filtered.reduce((s, r) => s + r.conversions, 0);
    const avgBounce = filtered.length > 0
      ? (filtered.reduce((s, r) => s + r.bounce_rate, 0) / filtered.length).toFixed(1)
      : "0";
    const avgDuration = filtered.length > 0
      ? (filtered.reduce((s, r) => s + r.avg_session_duration, 0) / filtered.length).toFixed(0)
      : "0";
    return { totalSessions, totalUsers, totalNewUsers, totalConversions, avgBounce, avgDuration };
  }, [filtered]);

  const sourceData = useMemo(() => {
    const map: Record<string, { source: string; sessions: number; users: number; conversions: number }> = {};
    filtered.forEach((r) => {
      const key = r.source || "(direct)";
      if (!map[key]) map[key] = { source: key, sessions: 0, users: 0, conversions: 0 };
      map[key].sessions += r.sessions;
      map[key].users += r.users || 0;
      map[key].conversions += r.conversions;
    });
    return Object.values(map).sort((a, b) => b.sessions - a.sessions).slice(0, 10);
  }, [filtered]);

  const landingData = useMemo(() => {
    const map: Record<string, { page: string; sessions: number; conversions: number; bounce: number; count: number }> = {};
    filtered.forEach((r) => {
      const key = r.landing_page || "/";
      if (!map[key]) map[key] = { page: key, sessions: 0, conversions: 0, bounce: 0, count: 0 };
      map[key].sessions += r.sessions;
      map[key].conversions += r.conversions;
      map[key].bounce += r.bounce_rate;
      map[key].count += 1;
    });
    return Object.values(map)
      .map((p) => ({ ...p, bounce: p.count > 0 ? (p.bounce / p.count).toFixed(1) : "0" }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10);
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const isEmpty = !ga4Data || ga4Data.length === 0;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageFloatingFilter
        filters={pf.filters} hasFilters={pf.hasFilters} clearFilters={pf.clearFilters}
        setPeriodo={pf.setPeriodo} setDateFrom={pf.setDateFrom} setDateTo={pf.setDateTo}
        config={{ showPeriodo: true, showSearch: true, showEtapa: true, showStatus: true, showTemperatura: true }}
      />
      <div>
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" /> GA4 — Aquisição & Conversão
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Comportamento, tráfego e conversões do site
        </p>
      </div>

      {isEmpty ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Globe className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-1">Sem dados GA4</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Configure um cenário no Make.com para enviar dados GA4 via webhook.
            </p>
            <div className="bg-muted rounded-lg p-4 text-left text-xs font-mono max-w-lg mx-auto">
              <p className="text-muted-foreground mb-1">POST para:</p>
              <p className="text-primary break-all">
                {`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || 'xffzjdulkdgyicsllznp'}.supabase.co/functions/v1/webhook-campaign-data`}
              </p>
              <p className="text-muted-foreground mt-2 mb-1">Body JSON:</p>
              <pre className="text-foreground whitespace-pre-wrap">{`{
  "type": "ga4",
  "organization_id": "...",
  "records": [
    {
      "date": "2025-01-15",
      "source": "google",
      "medium": "cpc",
      "campaign": "campanha_x",
      "sessions": 120,
      "users": 95,
      "conversions": 8
    }
  ]
}`}</pre>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPICard label="Sessões" value={kpis.totalSessions.toLocaleString("pt-BR")} icon={Globe} />
            <KPICard label="Usuários" value={kpis.totalUsers.toLocaleString("pt-BR")} icon={Users} />
            <KPICard label="Novos Usuários" value={kpis.totalNewUsers.toLocaleString("pt-BR")} icon={ArrowUpRight} />
            <KPICard label="Conversões" value={kpis.totalConversions.toLocaleString("pt-BR")} icon={TrendingUp} />
            <KPICard label="Bounce Rate" value={`${kpis.avgBounce}%`} icon={MousePointer} />
            <KPICard label="Tempo Médio (s)" value={kpis.avgDuration} icon={Clock} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm">Sessões por Origem</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sourceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="source" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Conversões por Origem</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={sourceData.filter(s => s.conversions > 0)} dataKey="conversions" nameKey="source" cx="50%" cy="50%" outerRadius={100} label>
                      {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Landing Pages — Top 10</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2">Página</th>
                      <th className="text-right py-2">Sessões</th>
                      <th className="text-right py-2">Conversões</th>
                      <th className="text-right py-2">Bounce</th>
                    </tr>
                  </thead>
                  <tbody>
                    {landingData.map((p) => (
                      <tr key={p.page} className="border-b border-border/50">
                        <td className="py-2 font-mono text-xs truncate max-w-[300px]">{p.page}</td>
                        <td className="text-right py-2">{p.sessions.toLocaleString("pt-BR")}</td>
                        <td className="text-right py-2">
                          <Badge variant={p.conversions > 0 ? "default" : "secondary"}>{p.conversions}</Badge>
                        </td>
                        <td className="text-right py-2">{p.bounce}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
