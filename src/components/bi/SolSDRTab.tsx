import { Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

interface SolSDRData {
  funil: { etapa: string; valor: number; icon: string }[];
  motivos: { motivo: string; pct: number; count: number; fill: string }[];
  performanceTurno: { turno: string; total: number; responderam: number; taxa: number }[];
  qualidadeLead: {
    totalEntregues: number; scoreMedio: number;
    quentes: number; mornos: number; frios: number; pctQuentes: number;
  };
}

interface Props {
  data: SolSDRData | null;
  isLoading: boolean;
}

export function SolSDRTab({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground text-center py-10">Sem dados disponíveis.</p>;
  }

  return (
    <div className="space-y-6">
      {/* V5: Funil Real-time */}
      <div className="rounded-lg border bg-card border-border/50 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">Funil Real-time SOL SDR</h3>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-4">Pipeline do robô de qualificação</p>
        <div className="flex flex-wrap gap-2">
          {data.funil.map((stage, i) => {
            const prev = i > 0 ? data.funil[i - 1].valor : stage.valor;
            const pct = prev > 0 ? Math.round((stage.valor / prev) * 100) : 100;
            return (
              <div
                key={stage.etapa}
                className="flex-1 min-w-[120px] rounded-lg border border-border/50 p-3 text-center hover:border-primary/40 transition-colors"
              >
                <span className="text-lg">{stage.icon}</span>
                <p className="text-2xl font-extrabold tabular-nums text-foreground mt-1">{stage.valor}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stage.etapa}</p>
                {i > 0 && (
                  <p className="text-[10px] text-primary font-semibold mt-1">{pct}%</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* V6: Motivos de Desqualificação */}
        <div className="rounded-lg border bg-card border-border/50 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-1">Motivos de Desqualificação</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-4">Por que leads não avançam</p>
          {data.motivos.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="h-[200px] w-[200px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.motivos} dataKey="pct" nameKey="motivo" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                      {data.motivos.map((m, i) => (
                        <Cell key={i} fill={m.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 flex-1">
                {data.motivos.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: m.fill }} />
                    <span className="text-xs text-foreground flex-1">{m.motivo}</span>
                    <span className="text-xs font-bold tabular-nums text-foreground">{m.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">Sem dados de desqualificação</p>
          )}
        </div>

        {/* V7: Performance por Turno */}
        <div className="rounded-lg border bg-card border-border/50 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-1">Performance por Turno</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-4">Manhã / Tarde / Noite</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.performanceTurno} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="turno" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="total" name="Enviados" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="responderam" name="Responderam" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            {data.performanceTurno.map(t => (
              <div key={t.turno} className="text-center">
                <p className="text-lg font-bold tabular-nums text-foreground">{t.taxa}%</p>
                <p className="text-[10px] text-muted-foreground">{t.turno}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* V8: Qualidade do Lead Entregue */}
      <div className="rounded-lg border bg-card border-border/50 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">Qualidade do Lead Entregue ao CRM</h3>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-4">Leads que passaram pela qualificação SOL</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-3xl font-extrabold tabular-nums text-foreground">{data.qualidadeLead.totalEntregues}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Entregues</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold tabular-nums text-primary">{data.qualidadeLead.scoreMedio}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Score Médio</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold tabular-nums text-destructive">{data.qualidadeLead.quentes}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">🔥 Quentes</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold tabular-nums text-warning">{data.qualidadeLead.mornos}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">🌡 Mornos</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold tabular-nums text-info">{data.qualidadeLead.frios}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">❄️ Frios</p>
          </div>
        </div>
      </div>
    </div>
  );
}
