import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useSolLeads, useForceSync, normalizePhone, type SolLead } from '@/hooks/useSolData';
import { useLead360 } from "@/contexts/Lead360Context";
import {
  Zap, User, Bot, Clock, AlertTriangle, CheckCircle2, XCircle, Search,
  ArrowRight, TrendingDown, RefreshCcw,
} from "lucide-react";
import { usePageFilters, PageFloatingFilter } from "@/components/filters/PageFloatingFilter";

type SLAStatus = "dentro" | "atencao" | "fora";

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

function deriveSLAData(records: SolLead[]) {
  // Define stages based on available data fields
  const stages = [
    { id: 1, etapa: "Lead → Sol aborda", slaMeta: "3 min", slaMetaMinutos: 3, ator: "Automação" },
    { id: 2, etapa: "Sol aborda → Responde", slaMeta: "10 min", slaMetaMinutos: 10, ator: "Cliente" },
    { id: 3, etapa: "Sol → Qualificado", slaMeta: "10 min", slaMetaMinutos: 10, ator: "Sol IA" },
    { id: 4, etapa: "Qualificado → Closer contata", slaMeta: "60 min", slaMetaMinutos: 60, ator: "Closer" },
  ];

  // Calculate real response times from data
  const withResponseTime = records.filter(r => r.ts_cadastro && r.ts_ultima_interacao);
  const avgResponseMinutes = withResponseTime.length > 0
    ? withResponseTime.reduce((sum, r) => {
        const diff = (new Date(r.ts_ultima_interacao!).getTime() - new Date(r.ts_cadastro).getTime()) / 60000;
        return sum + Math.max(diff, 0);
      }, 0) / withResponseTime.length
    : 0;

  const formatMinutes = (m: number) => {
    if (m < 1) return `${Math.round(m * 60)}s`;
    if (m < 60) return `${Math.round(m)}min`;
    if (m < 1440) return `${Math.floor(m / 60)}h ${Math.round(m % 60)}min`;
    return `${(m / 1440).toFixed(1)} dias`;
  };

  const slaStages = stages.map(s => {
    let realMedioMin = 0;
    let pctCumprindo = 0;
    let hasData = false;

    if (s.id === 2 && withResponseTime.length > 0) {
      hasData = true;
      realMedioMin = avgResponseMinutes;
      pctCumprindo = Math.round(withResponseTime.filter(r => {
        const diff = (new Date(r.ts_ultima_interacao!).getTime() - new Date(r.ts_cadastro).getTime()) / 60000;
        return diff <= s.slaMetaMinutos;
      }).length / withResponseTime.length * 100);
    } else if (s.id === 1) {
      // C2: No real data available for Lead → Sol aborda. Show "Sem dados" instead of hardcoded.
      hasData = false;
    } else if (s.id === 3) {
      // C2: Use real qualification data if available
      const qualRecs = records.filter(r => (r.status || '').toUpperCase() === 'QUALIFICADO' && r.ts_ultima_interacao && r.ts_cadastro);
      if (qualRecs.length > 0) {
        hasData = true;
        const times = qualRecs.map(r => {
          const envio = new Date(r.ts_cadastro).getTime();
          const resp = new Date(r.ts_ultima_interacao!).getTime();
          return Math.max(0, (resp - envio) / 60000);
        }).filter(t => t > 0 && t < 10080); // < 7 days
        realMedioMin = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
        pctCumprindo = times.length > 0 ? Math.round(times.filter(t => t <= s.slaMetaMinutos).length / times.length * 100) : 0;
      }
    } else if (s.id === 4) {
      // C2: "Em implementação" — no real data for Qualificado → Closer
      hasData = false;
    }

    const status: SLAStatus = !hasData ? "dentro" : pctCumprindo >= 80 ? "dentro" : pctCumprindo >= 50 ? "atencao" : "fora";

    return {
      ...s,
      realMedio: !hasData ? "Sem dados" : formatMinutes(realMedioMin),
      realMedioMinutos: realMedioMin,
      status: !hasData ? "dentro" as SLAStatus : status,
      pctCumprindo: !hasData ? 0 : pctCumprindo,
      hasData,
    };
  });

  // Gargalos
  const gargalos = slaStages
    .filter(s => s.status !== "dentro")
    .map(s => ({
      etapa: s.etapa,
      realMedio: s.realMedio,
      slaMeta: s.slaMeta,
      pctAcima: 100 - s.pctCumprindo,
      status: s.status,
      sugestao: s.id === 2 ? "Tempo de resposta depende do cliente — reforçar urgência na primeira mensagem." :
                s.id === 5 ? "Implementar follow-up automático para agendamento." :
                "Revisar processo e criar alertas automáticos.",
    }));

  // Leads fora do SLA — use records with slow response
  const leadsForaSLA = withResponseTime
    .map(r => {
      const diffMin = (new Date(r.ts_ultima_interacao!).getTime() - new Date(r.ts_cadastro).getTime()) / 60000;
      const sla = 10; // Using Sol response SLA
      if (diffMin <= sla) return null;
      const extrapolou = formatMinutes(diffMin - sla);
      return {
        nome: r.nome || 'Lead',
        etapa: "Sol → Resposta",
        tempoNaEtapa: formatMinutes(diffMin),
        slaMeta: `${sla} min`,
        extrapolou: `+${extrapolou}`,
        status: (diffMin > sla * 3 ? "fora" : "atencao") as SLAStatus,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      // Sort by severity
      if (a!.status === "fora" && b!.status !== "fora") return -1;
      return 0;
    })
    .slice(0, 8) as Array<{ nome: string; etapa: string; tempoNaEtapa: string; slaMeta: string; extrapolou: string; status: SLAStatus }>;

  // Distribution by time range
  const distribuicoes = [
    {
      etapa: "Sol → Resposta do Lead",
      faixas: [
        { label: "<5m", count: withResponseTime.filter(r => (new Date(r.ts_ultima_interacao!).getTime() - new Date(r.ts_cadastro).getTime()) / 60000 < 5).length },
        { label: "5-30m", count: withResponseTime.filter(r => { const d = (new Date(r.ts_ultima_interacao!).getTime() - new Date(r.ts_cadastro).getTime()) / 60000; return d >= 5 && d < 30; }).length },
        { label: "30m-2h", count: withResponseTime.filter(r => { const d = (new Date(r.ts_ultima_interacao!).getTime() - new Date(r.ts_cadastro).getTime()) / 60000; return d >= 30 && d < 120; }).length },
        { label: "2-12h", count: withResponseTime.filter(r => { const d = (new Date(r.ts_ultima_interacao!).getTime() - new Date(r.ts_cadastro).getTime()) / 60000; return d >= 120 && d < 720; }).length },
        { label: "+12h", count: withResponseTime.filter(r => (new Date(r.ts_ultima_interacao!).getTime() - new Date(r.ts_cadastro).getTime()) / 60000 >= 720).length },
      ],
    },
  ];

  // Build search index
  const searchableLeads = records.slice(0, 200).map(r => ({
    nome: r.nome || 'Lead',
    telefone: r.telefone,
    etapas: [
      { etapa: "Lead entrada", data: r.ts_cadastro || '—', duracao: "—", status: "dentro" as SLAStatus },
      ...(r.ts_ultima_interacao ? [{ etapa: "Resposta", data: r.ts_ultima_interacao, duracao: formatMinutes((new Date(r.ts_ultima_interacao).getTime() - new Date(r.ts_cadastro).getTime()) / 60000), status: ((new Date(r.ts_ultima_interacao).getTime() - new Date(r.ts_cadastro).getTime()) / 60000 > 10 ? "atencao" : "dentro") as SLAStatus }] : []),
      ...((r.status || '').toUpperCase() === 'QUALIFICADO' ? [{ etapa: "Qualificado", data: '—', duracao: '—', status: "dentro" as SLAStatus }] : []),
    ],
  }));

  return { slaStages, gargalos, leadsForaSLA, distribuicoes, searchableLeads, totalLeads: records.length };
}

export default function SLAMonitor() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: solLeads, isLoading } = useSolLeads();
  const { forceSync } = useForceSync();
  const { openLead360 } = useLead360();

  const pf = usePageFilters({ showPeriodo: true, showSearch: true });
  const records = useMemo(() => pf.filterRecords(solLeads), [solLeads, pf.filterRecords]);

  const d = useMemo(() => deriveSLAData(records), [records]);

  const searchResult = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return d.searchableLeads.find(
      l => l.nome.toLowerCase().includes(q) || l.telefone.includes(q)
    );
  }, [searchQuery, d.searchableLeads]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div><h1 className="text-2xl font-bold text-foreground">Monitor de SLA</h1></div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="space-y-6 pb-10">
        <div><h1 className="text-2xl font-bold text-foreground">Monitor de SLA</h1></div>
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum dado disponível no Data Store.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Monitor de SLA — Jornada do Lead</h1>
          <p className="text-sm text-muted-foreground mt-1">{d.totalLeads} leads rastreados · Dados reais</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => forceSync()}><RefreshCcw className="h-4 w-4 mr-1" /> Atualizar</Button>
      </div>

      <PageFloatingFilter
        filters={pf.filters} hasFilters={pf.hasFilters} clearFilters={pf.clearFilters}
        setPeriodo={pf.setPeriodo} setDateFrom={pf.setDateFrom} setDateTo={pf.setDateTo}
        setSearchTerm={pf.setSearchTerm} setTemperatura={pf.setTemperatura} setEtapa={pf.setEtapa} setStatus={pf.setStatus}
        config={{ showPeriodo: true, showSearch: true, showTemperatura: true, showEtapa: true, showStatus: true, searchPlaceholder: "Buscar lead..." }}
      />

      {/* Status geral */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {d.slaStages.map(stage => {
          const cfg = statusConfig[stage.status];
          return (
            <Card key={stage.id} className={`border ${cfg.bg}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-medium font-mono">ETAPA {stage.id}</span>
                  <div className={`flex items-center gap-1 ${cfg.color}`}>{cfg.icon}<span className="text-xs font-bold">{cfg.label}</span></div>
                </div>
                <p className="text-sm font-semibold mb-2">{stage.etapa}</p>
                <div className="flex items-center justify-between text-xs">
                  <div><span className="text-muted-foreground">Meta:</span> <span className="font-mono font-medium">{stage.slaMeta}</span></div>
                  <div><span className="text-muted-foreground">Real:</span> <span className={`font-mono font-bold ${cfg.color}`}>{stage.realMedio}</span></div>
                </div>
                {stage.pctCumprindo > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Cumprindo SLA</span>
                      <span className="font-mono font-bold">{stage.pctCumprindo}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted">
                      <div className={`h-full rounded-full transition-all ${stage.status === "dentro" ? "bg-success" : stage.status === "atencao" ? "bg-warning" : "bg-destructive"}`} style={{ width: `${stage.pctCumprindo}%` }} />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">{atorIcon(stage.ator)}<span>{stage.ator}</span></div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Timeline da Jornada</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex items-center gap-0 min-w-[600px] py-4">
              {d.slaStages.map((stage, i) => {
                const cfg = statusConfig[stage.status];
                return (
                  <div key={stage.id} className="flex items-center">
                    <div className="flex flex-col items-center w-28">
                      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${cfg.bg} ${cfg.color}`}>{atorIcon(stage.ator)}</div>
                      <span className="text-[10px] font-semibold mt-1.5 text-center leading-tight">{stage.etapa.split("→").pop()?.trim()}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{stage.slaMeta}</span>
                      <span className={`text-[10px] font-bold font-mono ${cfg.color}`}>{stage.realMedio}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">{stage.pctCumprindo > 0 ? `${stage.pctCumprindo}%` : "—"}</span>
                    </div>
                    {i < d.slaStages.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gargalos */}
      {d.gargalos.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><TrendingDown className="h-5 w-5 text-destructive" />Gargalos Identificados</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {d.gargalos.map((g, i) => {
              const cfg = statusConfig[g.status];
              return (
                <Card key={i} className={`border-l-4 ${g.status === "fora" ? "border-l-destructive" : "border-l-warning"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1 mb-2">{cfg.icon}<span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span></div>
                    <p className="text-sm font-bold mb-1">{g.etapa}</p>
                    <p className="text-xs text-muted-foreground font-mono mb-2">{g.realMedio} vs SLA de {g.slaMeta}. {g.pctAcima}% dos leads acima do SLA.</p>
                    <p className="text-xs text-primary font-medium">💡 {g.sugestao}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Leads fora do SLA */}
      {d.leadsForaSLA.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Leads Fora do SLA</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Lead</TableHead><TableHead>Etapa</TableHead><TableHead>Tempo</TableHead><TableHead>SLA</TableHead><TableHead>Extrapolou</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {d.leadsForaSLA.map((lead, i) => {
                  const cfg = statusConfig[lead.status];
                  return (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{lead.nome}</TableCell>
                      <TableCell className="text-xs font-mono">{lead.etapa}</TableCell>
                      <TableCell className="font-mono text-sm">{lead.tempoNaEtapa}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{lead.slaMeta}</TableCell>
                      <TableCell><Badge variant="outline" className={cfg.color}>{lead.extrapolou}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Distribuição */}
      {d.distribuicoes.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">Distribuição de Tempo por Etapa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {d.distribuicoes.map(dist => (
              <Card key={dist.etapa}>
                <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-medium text-muted-foreground">{dist.etapa}</CardTitle></CardHeader>
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
      )}

      {/* Busca */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Search className="h-5 w-5" />Busca Individual de Lead</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input placeholder="Nome ou telefone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="max-w-sm font-mono" />
          </div>
          {searchResult ? (
            <div>
              <p className="text-sm font-bold mb-3">{searchResult.nome} · {searchResult.telefone}</p>
              <div className="relative">
                {searchResult.etapas.map((etapa, i) => {
                  const cfg = statusConfig[etapa.status];
                  return (
                    <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full border-2 ${etapa.status === "dentro" ? "border-success bg-success/20" : etapa.status === "atencao" ? "border-warning bg-warning/20" : "border-destructive bg-destructive/20"}`} />
                        {i < searchResult.etapas.length - 1 && <div className="w-px h-8 bg-border" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{etapa.etapa}</span>
                          <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>{etapa.duracao}</Badge>
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
