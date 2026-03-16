import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, Line, Legend, PieChart, Pie, Cell,
} from "recharts";
import {
  followupKPIs, followupPipeline, followupResultadoReativados, followupPorCanal,
  followupPerfilReativacao, followupLeadsAtivos, followupEvolucaoTemporal,
} from "@/data/mockFase3";
import { useMakeDataStore } from "@/hooks/useMakeDataStore";
import { useLead360 } from "@/contexts/Lead360Context";
import {
  Repeat, Users, DollarSign, Clock, Zap, TrendingUp, MessageSquare, Target,
} from "lucide-react";

const kpiCards = [
  { label: "Leads em FUP ativo", value: followupKPIs.leadsEmFUP, icon: Users },
  { label: "Total entrou no FUP", value: followupKPIs.totalEntrouFUP, icon: Target },
  { label: "Reativados", value: `${followupKPIs.reativados} (${followupKPIs.pctReativados})`, icon: Zap },
  { label: "Receita gerada", value: followupKPIs.receitaFUP, icon: DollarSign },
  { label: "Tempo médio reativação", value: followupKPIs.tempoMedioReativacao, icon: Clock },
  { label: "FUPs médios até reativação", value: followupKPIs.fupsAteMedioReativacao, icon: Repeat },
  { label: "Custo da régua", value: followupKPIs.custoRegua, icon: TrendingUp },
  { label: "Contratos via FUP", value: followupKPIs.contratosOriginadosFUP, icon: MessageSquare },
];

export default function AnalistaFollowup() {
  const { data: makeRecords } = useMakeDataStore();
  const { openLead360 } = useLead360();

  // Merge real FUP data if available
  const realFupLeads = makeRecords?.filter((r) => (r.followupCount ?? 0) > 0).length ?? 0;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
          Analista de Follow-up Frio
        </h1>
        <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Régua de reativação · Jan-Fev 2026
          {realFupLeads > 0 && ` · ${realFupLeads} leads reais em FUP`}
        </p>
      </div>

      {/* BLOCO 1 — KPIs TOPO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <kpi.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-lg font-bold font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {kpi.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* BLOCO 2 — PIPELINE DA SEQUÊNCIA */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base" style={{ fontFamily: "'Syne', sans-serif" }}>
            Pipeline da Sequência FUP
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {followupPipeline.map((etapa) => (
              <div
                key={etapa.etapa}
                className={`p-3 rounded-lg border transition-all ${
                  etapa.destaque
                    ? "border-success/50 bg-success/5"
                    : "border-border/50 bg-muted/10"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge variant={etapa.destaque ? "default" : "outline"} className="text-[10px] px-1.5">
                    {etapa.dia}
                  </Badge>
                  {etapa.destaque && <span className="text-[10px]">⭐</span>}
                </div>
                <p className="text-[10px] text-muted-foreground mb-2">{etapa.gatilho}</p>
                <div className="space-y-0.5 text-[10px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Disparos</span>
                    <span className="font-bold">{etapa.disparos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Respostas</span>
                    <span className="font-bold">{etapa.respostas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa</span>
                    <span className={`font-bold ${etapa.destaque ? "text-success" : ""}`}>{etapa.taxa}</span>
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${etapa.destaque ? "bg-success" : "bg-primary"}`}
                    style={{ width: `${(etapa.respostas / etapa.disparos) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* BLOCO 3 — RESULTADO DOS REATIVADOS + BLOCO 4 — POR CANAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base" style={{ fontFamily: "'Syne', sans-serif" }}>
              Resultado dos Reativados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={followupResultadoReativados}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="valor"
                    nameKey="label"
                  >
                    {followupResultadoReativados.map((entry, i) => (
                      <Cell key={i} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {followupResultadoReativados.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.cor }} />
                      <span className="text-muted-foreground">{item.label}</span>
                    </div>
                    <span className="font-mono font-bold">{item.valor} ({item.pct}%)</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Contratos via FUP</span>
                    <span className="font-bold font-mono">4</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Receita gerada</span>
                    <span className="font-bold font-mono text-success">R$ 42.300</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Ticket médio FUP</span>
                    <span className="font-bold font-mono">R$ 10.575</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base" style={{ fontFamily: "'Syne', sans-serif" }}>
              Reativação por Canal de Origem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {followupPorCanal.map((canal) => {
                const taxa = (canal.reativados / canal.entrouFUP) * 100;
                return (
                  <div key={canal.canal}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{canal.canal}</span>
                      <div className="flex items-center gap-3 font-mono text-xs">
                        <span className="text-muted-foreground">{canal.entrouFUP} → {canal.reativados}</span>
                        <span className="font-bold">{canal.taxa}</span>
                      </div>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${taxa}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BLOCO 5 — PERFIL DO LEAD QUE REATIVA */}
      <div>
        <h2 className="text-lg font-bold mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
          Perfil do Lead que Reativa
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-bold mb-3">🌡️ Temperatura na entrada</p>
              {followupPerfilReativacao.temperatura.map((item) => (
                <div key={item.label} className="flex items-center justify-between mb-2 last:mb-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-info" style={{ width: `${item.pct}%` }} />
                    </div>
                    <span className="text-sm font-mono font-bold w-10 text-right">{item.pct}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-bold mb-3">💰 Faixa de conta de luz</p>
              {followupPerfilReativacao.faixaConta.map((item) => (
                <div key={item.label} className="flex items-center justify-between mb-2 last:mb-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-warning" style={{ width: `${item.pct}%` }} />
                    </div>
                    <span className="text-sm font-mono font-bold w-10 text-right">{item.pct}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-bold mb-3">📍 Cidades que mais reativam</p>
              {followupPerfilReativacao.cidades.map((item) => (
                <div key={item.label} className="flex items-center justify-between mb-2 last:mb-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${item.pct}%` }} />
                    </div>
                    <span className="text-sm font-mono font-bold w-10 text-right">{item.pct}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BLOCO 6 — LEADS EM FUP AGORA */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base" style={{ fontFamily: "'Syne', sans-serif" }}>
            Leads em FUP Agora
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Etapa atual</TableHead>
                <TableHead>Próximo FUP</TableHead>
                <TableHead>Dias em FUP</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Últ. resposta</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {followupLeadsAtivos.map((lead) => (
                <TableRow key={lead.nome}>
                  <TableCell className="font-medium">{lead.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-mono">{lead.etapaAtual}</Badge>
                  </TableCell>
                  <TableCell className="text-sm font-mono">{lead.proximoFUP}</TableCell>
                  <TableCell className="text-sm font-mono">{lead.diasEmFUP}</TableCell>
                  <TableCell className="text-sm">{lead.canal}</TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">{lead.ultResposta}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="text-xs text-primary">
                      Ver conversa
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* BLOCO 7 — EVOLUÇÃO TEMPORAL */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base" style={{ fontFamily: "'Syne', sans-serif" }}>
            Evolução Temporal — Disparos vs Respostas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={followupEvolucaoTemporal}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="count" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="acum" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Area yAxisId="count" type="monotone" dataKey="disparos" name="Disparos" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} />
              <Area yAxisId="count" type="monotone" dataKey="respostas" name="Respostas" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.15} />
              <Line yAxisId="acum" type="monotone" dataKey="reativacaoAcum" name="Reativação acum." stroke="hsl(var(--warning))" strokeDasharray="5 5" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
