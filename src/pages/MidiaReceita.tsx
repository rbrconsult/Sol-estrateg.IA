import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend, PieChart, Pie, Cell,
} from "recharts";
import {
  midiaKPIs, funisOrigem, radarComparativo, campanhas, scorePorOrigem,
  temperaturaPorCanal, engajamentoMeta, evolucaoSemanal,
} from "@/data/mockFase3";
import { useMakeDataStore } from "@/hooks/useMakeDataStore";
import { DollarSign, TrendingUp, Users, Target, Lock } from "lucide-react";

const TEMP_COLORS = { quente: "hsl(var(--destructive))", morno: "hsl(var(--warning))", frio: "hsl(var(--info))" };

export default function MidiaReceita() {
  const { data: makeRecords } = useMakeDataStore();

  // Enrich with real data where available
  const realLeadCount = makeRecords?.length ?? 0;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
          Mídia × Receita — Atribuição e ROI
        </h1>
        <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Jan-Fev 2026 · {realLeadCount > 0 ? `${realLeadCount} leads reais + ` : ""}dados consolidados
        </p>
      </div>

      {/* BLOCO 1 — KPIs TOPO */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base" style={{ fontFamily: "'Syne', sans-serif" }}>
            KPIs por Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Métrica</TableHead>
                  <TableHead><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#1877F2" }} /> Meta</span></TableHead>
                  <TableHead><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#34A853" }} /> Google</span></TableHead>
                  <TableHead className="font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {midiaKPIs.map((kpi) => (
                  <TableRow key={kpi.metrica}>
                    <TableCell className="font-medium text-sm">{kpi.metrica}</TableCell>
                    <TableCell className="font-mono text-sm">{kpi.meta}</TableCell>
                    <TableCell className="font-mono text-sm">{kpi.google}</TableCell>
                    <TableCell className="font-mono text-sm font-bold">{kpi.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* BLOCO 2 — FUNIL POR ORIGEM */}
      <div>
        <h2 className="text-lg font-bold mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
          Funil por Origem
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {funisOrigem.map((funil) => (
            <Card key={funil.origem}>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: funil.cor }} />
                  {funil.origem}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {funil.etapas.map((etapa, i) => {
                  const maxVal = funil.etapas[0].valor;
                  const width = (etapa.valor / maxVal) * 100;
                  return (
                    <div key={i} className="mb-2 last:mb-0">
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className="text-muted-foreground">{etapa.label}</span>
                        <span className="font-mono font-bold">{etapa.valor}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${width}%`, backgroundColor: funil.cor, opacity: 1 - i * 0.15 }}
                        />
                      </div>
                      {i < funil.etapas.length - 1 && (
                        <p className="text-[10px] text-muted-foreground text-center font-mono">↓ {funil.etapas[i + 1]?.pct}</p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* BLOCO 3 — COMPARATIVO RADAR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base" style={{ fontFamily: "'Syne', sans-serif" }}>
              Comparativo Meta vs Google
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarComparativo}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="eixo" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fontSize: 9 }} />
                <Radar name="Meta" dataKey="meta" stroke="#1877F2" fill="#1877F2" fillOpacity={0.2} />
                <Radar name="Google" dataKey="google" stroke="#34A853" fill="#34A853" fillOpacity={0.2} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* BLOCO 5 — SCORE MÉDIO POR ORIGEM */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base" style={{ fontFamily: "'Syne', sans-serif" }}>
              Score Médio por Origem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scorePorOrigem.map((item) => (
                <div key={item.origem}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{item.origem}</span>
                    <span className="font-mono font-bold">{item.score} ⭐</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {temperaturaPorCanal.map((canal) => {
                const total = canal.quente + canal.morno + canal.frio;
                return (
                  <div key={canal.canal}>
                    <p className="text-xs font-medium mb-1">{canal.canal}</p>
                    <div className="flex h-4 rounded-full overflow-hidden">
                      <div style={{ width: `${(canal.quente / total) * 100}%`, backgroundColor: TEMP_COLORS.quente }} />
                      <div style={{ width: `${(canal.morno / total) * 100}%`, backgroundColor: TEMP_COLORS.morno }} />
                      <div style={{ width: `${(canal.frio / total) * 100}%`, backgroundColor: TEMP_COLORS.frio }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5 font-mono">
                      <span>🔥{canal.quente}%</span>
                      <span>🌡{canal.morno}%</span>
                      <span>❄{canal.frio}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BLOCO 4 — PERFORMANCE POR CAMPANHA */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base" style={{ fontFamily: "'Syne', sans-serif" }}>
            Performance por Campanha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">CPL</TableHead>
                <TableHead className="text-right">Qualif.</TableHead>
                <TableHead className="text-right">% Qual</TableHead>
                <TableHead className="text-right">Contratos</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campanhas.map((c) => (
                <TableRow key={c.nome} className={c.status === "verde" ? "bg-success/5" : c.status === "vermelho" ? "bg-destructive/5" : ""}>
                  <TableCell className="font-medium text-sm">{c.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]" style={{
                      borderColor: c.plataforma === "Meta" ? "#1877F2" : "#34A853",
                      color: c.plataforma === "Meta" ? "#1877F2" : "#34A853",
                    }}>
                      {c.plataforma}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{c.leads}</TableCell>
                  <TableCell className="text-right font-mono">{c.cpl}</TableCell>
                  <TableCell className="text-right font-mono">{c.qualificados}</TableCell>
                  <TableCell className="text-right font-mono">{c.pctQual}</TableCell>
                  <TableCell className="text-right font-mono font-bold">{c.contratos}</TableCell>
                  <TableCell className="text-right font-mono font-bold">{c.roas}</TableCell>
                  <TableCell>
                    {c.status === "verde" ? "🟢" : c.status === "amarelo" ? "🟡" : "🔴"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* BLOCO 6 — ENGAJAMENTO META ADS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#1877F2" }} />
              Engajamento Meta Ads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {engajamentoMeta.map((item) => (
                <div key={item.metrica} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-xs text-muted-foreground">{item.metrica}</span>
                  <span className="text-sm font-bold font-mono">{item.valor}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* BLOCO 7 — EVOLUÇÃO SEMANAL */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base" style={{ fontFamily: "'Syne', sans-serif" }}>
              Evolução Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={evolucaoSemanal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="leads" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="cpl" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="leads" type="monotone" dataKey="leadsMeta" name="Leads Meta" stroke="#1877F2" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="leads" type="monotone" dataKey="leadsGoogle" name="Leads Google" stroke="#34A853" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="cpl" type="monotone" dataKey="cplMeta" name="CPL Meta" stroke="#1877F2" strokeDasharray="5 5" strokeWidth={1} dot={false} />
                <Line yAxisId="cpl" type="monotone" dataKey="cplGoogle" name="CPL Google" stroke="#34A853" strokeDasharray="5 5" strokeWidth={1} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* BLOCO 8 — MÉTRICAS DE PÁGINA (EM DESENVOLVIMENTO) */}
      <Card className="border-dashed opacity-60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: "'Syne', sans-serif" }}>
            <Lock className="h-4 w-4" />
            Métricas de Página
            <Badge variant="outline" className="text-warning border-warning/30 text-[10px]">🚧 Em desenvolvimento</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {["Visualizações da LP", "Taxa de conversão da LP", "Scroll depth", "Origem do tráfego", "Heatmap de cliques"].map((item) => (
              <div key={item} className="p-3 rounded-lg bg-muted/20 border border-dashed text-center">
                <p className="text-xs text-muted-foreground">{item}</p>
                <p className="text-lg font-bold text-muted-foreground/40 font-mono mt-1">—</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
