import { Loader2, Snowflake, TrendingUp, RotateCcw, Target, MessageCircle, Clock, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from "recharts";

interface FupFrioData {
  funil: { etapa: string; valor: number; icon: string }[];
  resgate: {
    taxaResposta: number;
    taxaResgate: number;
    taxaFechamento: number;
    valorResgatado: number;
    valorFechado: number;
    totalResgatados: number;
    totalFechados: number;
  };
  tentativasConversao: {
    faixa: string;
    total: number;
    responderam: number;
    resgatados: number;
    taxaResposta: number;
    taxaResgate: number;
  }[];
  performanceTurnoFup: { turno: string; total: number; responderam: number; taxa: number }[];
  alertas: { tipo: "danger" | "warning" | "success" | "info"; titulo: string; desc: string }[];
  totalFup: number;
  responderam: number;
  aguardando: number;
  ignoraram: number;
}

function formatCurrency(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
  return `R$ ${v.toFixed(0)}`;
}

export function FupFrioTab({ data, isLoading }: { data: FupFrioData | null; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Snowflake className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium">Nenhum registro de FUP Frio encontrado</p>
        <p className="text-xs mt-1">Leads com follow_up_count &gt; 0 aparecerão aqui</p>
      </div>
    );
  }

  const maxFunil = data.funil[0]?.valor || 1;

  return (
    <div className="space-y-4">
      {/* ─── KPIs Resumo ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total FUP", value: data.totalFup, icon: Snowflake, color: "text-blue-500" },
          { label: "Responderam", value: data.responderam, icon: MessageCircle, color: "text-emerald-500" },
          { label: "Resgatados", value: data.resgate.totalResgatados, icon: RotateCcw, color: "text-primary" },
          { label: "Fechados", value: data.resgate.totalFechados, icon: Target, color: "text-amber-500" },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-border/50">
            <CardContent className="p-3 flex items-center gap-3">
              <kpi.icon className={cn("h-5 w-5 shrink-0", kpi.color)} />
              <div>
                <p className="text-2xl font-extrabold tabular-nums leading-none">{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ─── Funil FUP ─── */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Snowflake className="h-4 w-4 text-blue-500" />
              Funil FUP Frio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {data.funil.map((f, i) => {
              const pct = (f.valor / maxFunil) * 100;
              const convPct = i > 0 ? ((f.valor / data.funil[i - 1].valor) * 100).toFixed(0) : null;
              return (
                <div key={f.etapa}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-muted-foreground">{f.icon} {f.etapa}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold tabular-nums">{f.valor}</span>
                      {convPct && <span className="text-[9px] text-muted-foreground/60 tabular-nums">({convPct}%)</span>}
                    </div>
                  </div>
                  <div className="h-4 bg-secondary/50 rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-500/50 rounded transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* ─── Taxa de Resgate ─── */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-primary" />
              Taxa de Resgate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Resposta", value: `${data.resgate.taxaResposta}%`, sub: `${data.responderam} leads` },
                { label: "Resgate", value: `${data.resgate.taxaResgate}%`, sub: `${data.resgate.totalResgatados} leads` },
                { label: "Fechamento", value: `${data.resgate.taxaFechamento}%`, sub: `${data.resgate.totalFechados} leads` },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border border-border/30 p-3">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">{m.label}</p>
                  <p className="text-xl font-extrabold tabular-nums">{m.value}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{m.sub}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border/30 p-3 space-y-1.5">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">💰 Valor Recuperado</p>
              <div className="flex items-baseline gap-3">
                <div>
                  <p className="text-lg font-extrabold text-primary tabular-nums">{formatCurrency(data.resgate.valorResgatado)}</p>
                  <p className="text-[9px] text-muted-foreground">no pipeline</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-emerald-500 tabular-nums">{formatCurrency(data.resgate.valorFechado)}</p>
                  <p className="text-[9px] text-muted-foreground">fechado</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Alertas ─── */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">📋 Alertas FUP Frio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.alertas.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Sem alertas no momento</p>
            )}
            {data.alertas.map((a, i) => {
              const icon = a.tipo === "danger"
                ? <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                : a.tipo === "success"
                ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                : a.tipo === "warning"
                ? <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                : <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
              const border = a.tipo === "danger"
                ? "border-destructive/30 bg-destructive/5"
                : a.tipo === "success"
                ? "border-emerald-500/30 bg-emerald-500/5"
                : a.tipo === "warning"
                ? "border-amber-500/30 bg-amber-500/5"
                : "border-blue-500/30 bg-blue-500/5";
              return (
                <div key={i} className={cn("rounded-md border p-2.5 flex items-start gap-2", border)}>
                  {icon}
                  <div>
                    <p className="text-[11px] font-semibold text-foreground leading-tight">{a.titulo}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{a.desc}</p>
                  </div>
                </div>
              );
            })}

            {/* Status breakdown */}
            <div className="rounded-lg border border-border/30 p-3 mt-2">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Status dos Leads</p>
              <div className="space-y-1.5">
                {[
                  { label: "Responderam", value: data.responderam, pct: data.totalFup > 0 ? Math.round((data.responderam / data.totalFup) * 100) : 0, color: "bg-emerald-500" },
                  { label: "Aguardando", value: data.aguardando, pct: data.totalFup > 0 ? Math.round((data.aguardando / data.totalFup) * 100) : 0, color: "bg-amber-500" },
                  { label: "Ignoraram", value: data.ignoraram, pct: data.totalFup > 0 ? Math.round((data.ignoraram / data.totalFup) * 100) : 0, color: "bg-destructive" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full shrink-0", s.color)} />
                    <span className="text-[10px] text-muted-foreground flex-1">{s.label}</span>
                    <span className="text-[10px] font-bold tabular-nums">{s.value}</span>
                    <span className="text-[9px] text-muted-foreground tabular-nums w-8 text-right">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Tentativas × Conversão + Performance por Turno ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Tentativas × Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.tentativasConversao.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.tentativasConversao} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="faixa" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    formatter={(value: number, name: string) => [value, name === 'responderam' ? 'Responderam' : name === 'resgatados' ? 'Resgatados' : 'Total']}
                    labelFormatter={(label) => `${label} tentativa(s)`}
                  />
                  <Bar dataKey="total" fill="hsl(var(--muted-foreground) / 0.3)" radius={[4, 4, 0, 0]} name="Total" />
                  <Bar dataKey="responderam" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Responderam" />
                  <Bar dataKey="resgatados" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} name="Resgatados" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">Sem dados de tentativas</p>
            )}

            {/* Taxa por faixa */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
              {data.tentativasConversao.map((t) => (
                <div key={t.faixa} className="rounded-lg border border-border/30 p-2 text-center">
                  <p className="text-[9px] text-muted-foreground">{t.faixa} tent.</p>
                  <p className="text-sm font-bold tabular-nums">{t.taxaResposta}%</p>
                  <p className="text-[8px] text-muted-foreground">resposta</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Performance por Turno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.performanceTurnoFup.map((t) => (
                <div key={t.turno} className="rounded-lg border border-border/30 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium">{t.turno === 'Manhã' ? '🌅' : t.turno === 'Tarde' ? '☀️' : '🌙'} {t.turno}</span>
                    <span className="text-xs font-bold tabular-nums">{t.taxa}% resposta</span>
                  </div>
                  <div className="h-3 bg-secondary/50 rounded overflow-hidden">
                    <div
                      className="h-full bg-primary/60 rounded transition-all duration-700"
                      style={{ width: `${t.taxa}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-muted-foreground">{t.total} enviados</span>
                    <span className="text-[9px] text-muted-foreground">{t.responderam} respostas</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
