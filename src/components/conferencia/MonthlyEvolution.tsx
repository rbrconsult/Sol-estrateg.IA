import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, MessageCircle, CheckCircle2, BarChart3 } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
} from "recharts";
import type { MonthlyEvolutionItem } from "@/hooks/useConferenciaData";

interface Props {
  data: MonthlyEvolutionItem[];
}

export function MonthlyEvolution({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-xs">
        Sem dados históricos mensais disponíveis
      </div>
    );
  }

  const latest = data[data.length - 1];
  const prev = data.length > 1 ? data[data.length - 2] : null;
  const qualDelta = prev ? latest.pctQualificacao - prev.pctQualificacao : 0;

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
            Evolução Mensal — Histórico Completo
          </p>
        </div>
        <p className="text-[9px] text-muted-foreground/90 leading-snug pl-6 max-w-4xl">
          Cada mês agrupa leads pelo <span className="font-medium text-foreground">ts_cadastro</span>. % qualificação e ganhos usam o{" "}
          <span className="font-medium text-foreground">estado atual</span> do lead (mesma regra do funil CEO: MQL+ = jornada ≥ qualificado; conversão = negócio ganho /{" "}
          <span className="font-medium text-foreground">VENDA</span> / etapa de vitória). A série mensal considera{" "}
          <span className="font-medium text-foreground">todos os leads carregados</span>, não só o filtro de período do topo.
        </p>
      </div>

      {/* KPIs do mês atual */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-extrabold tabular-nums">{latest.pctQualificacao}%</p>
            <p className="text-[9px] text-muted-foreground uppercase">% Qualificação</p>
            {qualDelta !== 0 && (
              <p className={`text-[10px] font-semibold ${qualDelta > 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                {qualDelta > 0 ? '↑' : '↓'} {Math.abs(qualDelta)}pp
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-extrabold tabular-nums">{latest.totalLeads}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Leads</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-extrabold tabular-nums">{latest.msgEnviadas}</p>
            <p className="text-[9px] text-muted-foreground uppercase leading-tight">Msgs IA (soma)</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-extrabold tabular-nums">{latest.msgRecebidas}</p>
            <p className="text-[9px] text-muted-foreground uppercase leading-tight">Leads c/ resposta</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-extrabold tabular-nums">{latest.conversao}%</p>
            <p className="text-[9px] text-muted-foreground uppercase">Conversão</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Qualificação + Conversão */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Qualificação & Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="mesLabel" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" unit="%" />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="pctQualificacao" name="% Qualificação" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="conversao" name="% Conversão" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Mensagens */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-blue-500" />
              Atividade Robô — Mês a Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="mesLabel" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="msgEnviadas" name="Msgs IA (∑)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="msgRecebidas" name="Leads c/ resposta" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela resumo */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Resumo Mensal Detalhado
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-1.5 px-2 text-muted-foreground text-xs">Mês</th>
                <th className="text-right py-1.5 px-2 text-muted-foreground text-xs">Leads</th>
                <th className="text-right py-1.5 px-2 text-muted-foreground text-xs">Qualif.</th>
                <th className="text-right py-1.5 px-2 text-muted-foreground text-xs">% Qualif.</th>
                <th className="text-right py-1.5 px-2 text-muted-foreground text-xs">Msgs IA</th>
                <th className="text-right py-1.5 px-2 text-muted-foreground text-xs">C/ resposta</th>
                <th className="text-right py-1.5 px-2 text-muted-foreground text-xs">Fechados</th>
                <th className="text-right py-1.5 px-2 text-muted-foreground text-xs">% Conv.</th>
              </tr>
            </thead>
            <tbody>
              {data.map((m, i) => (
                <tr key={m.mes} className="border-b border-border/30 hover:bg-muted/30">
                  <td className="py-1.5 px-2 font-medium text-foreground">{m.mesLabel}</td>
                  <td className="text-right py-1.5 px-2 tabular-nums">{m.totalLeads}</td>
                  <td className="text-right py-1.5 px-2 tabular-nums text-primary font-semibold">{m.qualificados}</td>
                  <td className="text-right py-1.5 px-2 tabular-nums font-bold">
                    <span className={m.pctQualificacao >= 30 ? 'text-emerald-500' : m.pctQualificacao >= 15 ? 'text-amber-500' : 'text-destructive'}>
                      {m.pctQualificacao}%
                    </span>
                  </td>
                  <td className="text-right py-1.5 px-2 tabular-nums">{m.msgEnviadas}</td>
                  <td className="text-right py-1.5 px-2 tabular-nums">{m.msgRecebidas}</td>
                  <td className="text-right py-1.5 px-2 tabular-nums font-semibold">{m.fechados}</td>
                  <td className="text-right py-1.5 px-2 tabular-nums font-bold">
                    <span className={m.conversao >= 15 ? 'text-emerald-500' : m.conversao >= 5 ? 'text-amber-500' : 'text-destructive'}>
                      {m.conversao}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  );
}
