import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  slaStages, slaGargalos, slaLeadsForaSLA, slaDistribuicoes, slaLeadsBusca,
  type SLAStatus,
} from "@/data/mockFase3";
import { useMakeDataStore } from "@/hooks/useMakeDataStore";
import { useLead360 } from "@/contexts/Lead360Context";
import {
  Zap, User, Bot, Clock, AlertTriangle, CheckCircle2, XCircle, Search,
  ArrowRight, TrendingDown,
} from "lucide-react";

const statusConfig: Record<SLAStatus, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  dentro: { label: "DENTRO", color: "text-success", icon: <CheckCircle2 className="h-4 w-4" />, bg: "border-success/30 bg-success/5" },
  atencao: { label: "ATENÇÃO", color: "text-warning", icon: <AlertTriangle className="h-4 w-4" />, bg: "border-warning/30 bg-warning/5" },
  fora: { label: "FORA", color: "text-destructive", icon: <XCircle className="h-4 w-4" />, bg: "border-destructive/30 bg-destructive/5" },
};

const atorIcon = (ator: string) => {
  if (ator === "Automação") return <Zap className="h-3.5 w-3.5 text-primary" />;
  if (ator === "Sol IA") return <Bot className="h-3.5 w-3.5 text-primary" />;
  if (ator === "Closer") return <User className="h-3.5 w-3.5 text-info" />;
  return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
};

export default function SLAMonitor() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: makeRecords } = useMakeDataStore();
  const { openLead360 } = useLead360();

  const searchResult = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return slaLeadsBusca.find(
      (l) => l.nome.toLowerCase().includes(q) || l.telefone.includes(q)
    );
  }, [searchQuery]);

  // Derive real lead count from Make data if available
  const totalLeads = makeRecords?.length ?? 276;

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
          Monitor de SLA — Jornada do Lead
        </h1>
        <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {totalLeads} leads rastreados · Jan-Fev 2026
        </p>
      </div>

      {/* BLOCO 1 — STATUS GERAL DOS SLAs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {slaStages.map((stage) => {
          const cfg = statusConfig[stage.status];
          return (
            <Card key={stage.id} className={`border ${cfg.bg}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    ETAPA {stage.id}
                  </span>
                  <div className={`flex items-center gap-1 ${cfg.color}`}>
                    {cfg.icon}
                    <span className="text-xs font-bold">{cfg.label}</span>
                  </div>
                </div>
                <p className="text-sm font-semibold mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {stage.etapa}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-muted-foreground">Meta:</span>{" "}
                    <span className="font-mono font-medium">{stage.slaMeta}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Real:</span>{" "}
                    <span className={`font-mono font-bold ${cfg.color}`}>{stage.realMedio}</span>
                  </div>
                </div>
                {stage.pctCumprindo > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Cumprindo SLA</span>
                      <span className="font-mono font-bold">{stage.pctCumprindo}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${
                          stage.status === "dentro" ? "bg-success" :
                          stage.status === "atencao" ? "bg-warning" : "bg-destructive"
                        }`}
                        style={{ width: `${stage.pctCumprindo}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  {atorIcon(stage.ator)}
                  <span>{stage.ator}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* BLOCO 2 — TIMELINE VISUAL */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base" style={{ fontFamily: "'Syne', sans-serif" }}>
            Timeline da Jornada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex items-center gap-0 min-w-[900px] py-4">
              {slaStages.map((stage, i) => {
                const cfg = statusConfig[stage.status];
                return (
                  <div key={stage.id} className="flex items-center">
                    <div className="flex flex-col items-center w-28">
                      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${cfg.bg} ${cfg.color}`}>
                        {atorIcon(stage.ator)}
                      </div>
                      <span className="text-[10px] font-semibold mt-1.5 text-center leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                        {stage.etapa.split("→").pop()?.trim()}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">{stage.slaMeta}</span>
                      <span className={`text-[10px] font-bold font-mono ${cfg.color}`}>{stage.realMedio}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        {stage.pctCumprindo > 0 ? `${stage.pctCumprindo}%` : "—"}
                      </span>
                    </div>
                    {i < slaStages.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BLOCO 3 — GARGALOS IDENTIFICADOS */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ fontFamily: "'Syne', sans-serif" }}>
          <TrendingDown className="h-5 w-5 text-destructive" />
          Gargalos Identificados
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {slaGargalos.map((g, i) => {
            const cfg = statusConfig[g.status];
            return (
              <Card key={i} className={`border-l-4 ${
                g.status === "fora" ? "border-l-destructive" : "border-l-warning"
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1 mb-2">
                    {cfg.icon}
                    <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <p className="text-sm font-bold mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {g.etapa}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mb-2">
                    {g.realMedio} vs SLA de {g.slaMeta}. {g.pctAcima}% dos leads acima do SLA.
                  </p>
                  <p className="text-xs text-primary font-medium">
                    💡 {g.sugestao}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* BLOCO 4 — LEADS FORA DO SLA AGORA */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base" style={{ fontFamily: "'Syne', sans-serif" }}>
            Leads Fora do SLA Agora
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Tempo na etapa</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Extrapolou</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slaLeadsForaSLA.map((lead, i) => {
                const cfg = statusConfig[lead.status];
                return (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{lead.nome}</TableCell>
                    <TableCell className="text-xs font-mono">{lead.etapa}</TableCell>
                    <TableCell className="font-mono text-sm">{lead.tempoNaEtapa}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{lead.slaMeta}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cfg.color}>
                        {lead.extrapolou} {lead.status === "fora" ? "🔴" : "⚠️"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-xs text-primary">
                        Ver lead
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* BLOCO 5 — DISTRIBUIÇÃO DE TEMPO POR ETAPA */}
      <div>
        <h2 className="text-lg font-bold mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
          Distribuição de Tempo por Etapa
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {slaDistribuicoes.map((dist) => (
            <Card key={dist.etapa}>
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">{dist.etapa}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={dist.faixas}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} width={25} />
                    <Tooltip />
                    <Bar dataKey="count" name="Leads" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* BLOCO 6 — BUSCA INDIVIDUAL */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: "'Syne', sans-serif" }}>
            <Search className="h-5 w-5" />
            Busca Individual de Lead
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Nome ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm font-mono"
            />
          </div>

          {searchResult ? (
            <div>
              <p className="text-sm font-bold mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
                {searchResult.nome} · {searchResult.telefone}
              </p>
              <div className="relative">
                {searchResult.etapas.map((etapa, i) => {
                  const cfg = statusConfig[etapa.status];
                  return (
                    <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full border-2 ${
                          etapa.status === "dentro" ? "border-success bg-success/20" :
                          etapa.status === "atencao" ? "border-warning bg-warning/20" :
                          "border-destructive bg-destructive/20"
                        }`} />
                        {i < searchResult.etapas.length - 1 && (
                          <div className="w-px h-8 bg-border" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{etapa.etapa}</span>
                          <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>
                            {etapa.duracao}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">{etapa.data}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : searchQuery.trim() ? (
            <p className="text-sm text-muted-foreground">Nenhum lead encontrado.</p>
          ) : (
            <p className="text-sm text-muted-foreground">Digite um nome ou telefone para buscar a jornada completa do lead.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
