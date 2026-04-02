import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useSolLeads, type SolLead } from '@/hooks/useSolData';
import { useLead360 } from "@/contexts/Lead360Context";
import {
  Zap, User, Bot, Clock, AlertTriangle, CheckCircle2, XCircle, Search,
  ArrowRight, TrendingDown, Gauge,
} from "lucide-react";
import { usePageFilters, PageFloatingFilter } from "@/components/filters/PageFloatingFilter";
import { cn } from "@/lib/utils";

type SLAStatus = "dentro" | "atencao" | "fora";

const statusConfig: Record<SLAStatus, { label: string; color: string; icon: React.ReactNode; bg: string; border: string }> = {
  dentro: { label: "DENTRO", color: "text-success", icon: <CheckCircle2 className="h-4 w-4" />, bg: "bg-success/5", border: "border-success/30" },
  atencao: { label: "ATENÇÃO", color: "text-warning", icon: <AlertTriangle className="h-4 w-4" />, bg: "bg-warning/5", border: "border-warning/30" },
  fora: { label: "FORA", color: "text-destructive", icon: <XCircle className="h-4 w-4" />, bg: "bg-destructive/5", border: "border-destructive/30" },
};

const atorIcon = (ator: string) => {
  if (ator === "Automação") return <Zap className="h-3.5 w-3.5 text-primary" />;
  if (ator === "Sol IA") return <Bot className="h-3.5 w-3.5 text-primary" />;
  if (ator === "Closer") return <User className="h-3.5 w-3.5 text-info" />;
  return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
};

function deriveSLAData(records: SolLead[]) {
  const stages = [
    { id: 1, etapa: "Lead → Sol aborda", slaMeta: "3 min", slaMetaMinutos: 3, ator: "Automação" },
    { id: 2, etapa: "Sol aborda → Responde", slaMeta: "10 min", slaMetaMinutos: 10, ator: "Cliente" },
    { id: 3, etapa: "Sol → Qualificado", slaMeta: "10 min", slaMetaMinutos: 10, ator: "Sol IA" },
    { id: 4, etapa: "Qualificado → Closer contata", slaMeta: "60 min", slaMetaMinutos: 60, ator: "Closer" },
  ];

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
    } else if (s.id === 3) {
      const qualRecs = records.filter(r => (r.status || '').toUpperCase() === 'QUALIFICADO' && r.ts_ultima_interacao && r.ts_cadastro);
      if (qualRecs.length > 0) {
        hasData = true;
        const times = qualRecs.map(r => {
          const envio = new Date(r.ts_cadastro).getTime();
          const resp = new Date(r.ts_ultima_interacao!).getTime();
          return Math.max(0, (resp - envio) / 60000);
        }).filter(t => t > 0 && t < 10080);
        realMedioMin = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
        pctCumprindo = times.length > 0 ? Math.round(times.filter(t => t <= s.slaMetaMinutos).length / times.length * 100) : 0;
      }
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

  const gargalos = slaStages
    .filter(s => s.status !== "dentro")
    .map(s => ({
      etapa: s.etapa,
      realMedio: s.realMedio,
      slaMeta: s.slaMeta,
      pctAcima: 100 - s.pctCumprindo,
      status: s.status,
      sugestao: s.id === 2 ? "Reforçar urgência na primeira mensagem do Sol." :
                s.id === 5 ? "Implementar follow-up automático para agendamento." :
                "Revisar processo e criar alertas automáticos.",
    }));

  const leadsForaSLA = withResponseTime
    .map(r => {
      const diffMin = (new Date(r.ts_ultima_interacao!).getTime() - new Date(r.ts_cadastro).getTime()) / 60000;
      const sla = 10;
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
      if (a!.status === "fora" && b!.status !== "fora") return -1;
      return 0;
    })
    .slice(0, 8) as Array<{ nome: string; etapa: string; tempoNaEtapa: string; slaMeta: string; extrapolou: string; status: SLAStatus }>;

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

  const searchableLeads = records.slice(0, 200).map(r => ({
    nome: r.nome || 'Lead',
    telefone: r.telefone,
    etapas: [
      { etapa: "Lead entrada", data: r.ts_cadastro || '—', duracao: "—", status: "dentro" as SLAStatus },
      ...(r.ts_ultima_interacao ? [{ etapa: "Resposta", data: r.ts_ultima_interacao, duracao: formatMinutes((new Date(r.ts_ultima_interacao).getTime() - new Date(r.ts_cadastro).getTime()) / 60000), status: ((new Date(r.ts_ultima_interacao).getTime() - new Date(r.ts_cadastro).getTime()) / 60000 > 10 ? "atencao" : "dentro") as SLAStatus }] : []),
      ...((r.status || '').toUpperCase() === 'QUALIFICADO' ? [{ etapa: "Qualificado", data: '—', duracao: '—', status: "dentro" as SLAStatus }] : []),
    ],
  }));

  // Leads por etapa (from JornadaLead)
  const leadsByStage: Record<string, { qtd: number; alertas: number }> = {};
  records.forEach(r => {
    const s = (r.status || 'SEM_STATUS').toUpperCase();
    if (!leadsByStage[s]) leadsByStage[s] = { qtd: 0, alertas: 0 };
    leadsByStage[s].qtd++;
    const score = parseInt(r.score || '0') || 0;
    if (score >= 70 && (s === 'WHATSAPP' || s === 'TRAFEGO_PAGO')) leadsByStage[s].alertas++;
  });
  const leadsByStageArr = Object.entries(leadsByStage).map(([etapa, data]) => ({ etapa, ...data }));

  // Abandono por etapa
  const total = records.length || 1;
  const desq = records.filter(r => (r.status || '').toUpperCase() === 'DESQUALIFICADO').length;
  const noResp = records.filter(r => ((r as any)._status_resposta || '') === 'ignorou' || r.status === 'NAO_RESPONDEU').length;
  const aguardando = records.filter(r => ((r as any)._status_resposta || '') === 'aguardando').length;
  const abandonArr = [
    { etapa: 'Pré-venda', abandonaram: Math.round((noResp / total) * 100), motivoPrincipal: 'Não respondeu' },
    { etapa: 'Qualificação', abandonaram: Math.round((desq / total) * 100), motivoPrincipal: 'Desqualificado pelo Sol' },
    { etapa: 'Comercial', abandonaram: Math.round((aguardando / total) * 30), motivoPrincipal: 'Closer não fechou' },
    { etapa: 'Proposta', abandonaram: Math.round((aguardando / total) * 15), motivoPrincipal: 'Perdido na negociação' },
  ];

  return { slaStages, gargalos, leadsForaSLA, distribuicoes, searchableLeads, totalLeads: records.length, leadsByStageArr, abandonArr };
}

export default function SLAMonitor() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: solLeads, isLoading } = useSolLeads();
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

  // Summary KPIs
  const totalDentro = d.slaStages.filter(s => s.status === "dentro").length;
  const totalAtencao = d.slaStages.filter(s => s.status === "atencao").length;
  const totalFora = d.slaStages.filter(s => s.status === "fora").length;

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div className="flex items-center gap-3">
          <Gauge className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">Carregando dados SLA...</span>
        </div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="space-y-6 pb-10">
        <div><h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2"><Gauge className="h-5 w-5 text-primary" /> Monitor de SLA</h1></div>
        <Card className="border-border/50"><CardContent className="py-12 text-center text-muted-foreground text-sm">Nenhum dado disponível.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Gauge className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Monitor de SLA
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            {d.totalLeads} leads rastreados · Jornada do lead em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          {totalDentro > 0 && <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/20">{totalDentro} OK</Badge>}
          {totalAtencao > 0 && <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/20">{totalAtencao} Atenção</Badge>}
          {totalFora > 0 && <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">{totalFora} Fora</Badge>}
        </div>
      </div>

      <PageFloatingFilter
        filters={pf.filters} hasFilters={pf.hasFilters} clearFilters={pf.clearFilters}
        setPeriodo={pf.setPeriodo} setDateFrom={pf.setDateFrom} setDateTo={pf.setDateTo}
        setSearchTerm={pf.setSearchTerm} setTemperatura={pf.setTemperatura} setEtapa={pf.setEtapa} setStatus={pf.setStatus}
        config={{ showPeriodo: true, showSearch: true, showTemperatura: true, showEtapa: true, showStatus: true, searchPlaceholder: "Buscar lead..." }}
      />

      {/* Stage Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {d.slaStages.map(stage => {
          const cfg = statusConfig[stage.status];
          return (
            <Card key={stage.id} className={cn("border overflow-hidden", cfg.border, cfg.bg)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Etapa {stage.id}</span>
                  <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold", cfg.color, cfg.bg)}>
                    {cfg.icon}
                    <span>{cfg.label}</span>
                  </div>
                </div>
                <p className="text-sm font-semibold mb-3 leading-tight">{stage.etapa}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-background/50 rounded-md p-2">
                    <span className="text-muted-foreground text-[10px] block">Meta</span>
                    <span className="font-mono font-semibold">{stage.slaMeta}</span>
                  </div>
                  <div className="bg-background/50 rounded-md p-2">
                    <span className="text-muted-foreground text-[10px] block">Real</span>
                    <span className={cn("font-mono font-bold", cfg.color)}>{stage.realMedio}</span>
                  </div>
                </div>
                {stage.pctCumprindo > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-muted-foreground">Cumprindo SLA</span>
                      <span className="font-mono font-bold">{stage.pctCumprindo}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-background/60">
                      <div className={cn("h-full rounded-full transition-all duration-700", stage.status === "dentro" ? "bg-success" : stage.status === "atencao" ? "bg-warning" : "bg-destructive")} style={{ width: `${stage.pctCumprindo}%` }} />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground">
                  {atorIcon(stage.ator)}
                  <span>{stage.ator}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Timeline */}
      <Card className="border-border/50">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-primary" /> Timeline da Jornada
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="overflow-x-auto">
            <div className="flex items-center gap-0 min-w-[600px] py-4">
              {d.slaStages.map((stage, i) => {
                const cfg = statusConfig[stage.status];
                return (
                  <div key={stage.id} className="flex items-center">
                    <div className="flex flex-col items-center w-28">
                      <div className={cn("w-10 h-10 rounded-full border-2 flex items-center justify-center", cfg.bg, cfg.border, cfg.color)}>
                        {atorIcon(stage.ator)}
                      </div>
                      <span className="text-[10px] font-semibold mt-1.5 text-center leading-tight">{stage.etapa.split("→").pop()?.trim()}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{stage.slaMeta}</span>
                      <span className={cn("text-[10px] font-bold font-mono", cfg.color)}>{stage.realMedio}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">{stage.pctCumprindo > 0 ? `${stage.pctCumprindo}%` : "—"}</span>
                    </div>
                    {i < d.slaStages.length - 1 && (
                      <div className="flex items-center">
                        <div className="w-8 h-px bg-border" />
                        <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gargalos */}
      {d.gargalos.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-destructive" /> Gargalos Identificados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {d.gargalos.map((g, i) => {
              const cfg = statusConfig[g.status];
              return (
                <Card key={i} className={cn("border-l-4", g.status === "fora" ? "border-l-destructive" : "border-l-warning", "border-border/50")}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      {cfg.icon}
                      <span className={cn("text-xs font-bold", cfg.color)}>{cfg.label}</span>
                    </div>
                    <p className="text-sm font-semibold mb-1">{g.etapa}</p>
                    <p className="text-xs text-muted-foreground font-mono mb-2">
                      {g.realMedio} vs SLA {g.slaMeta} · {g.pctAcima}% acima
                    </p>
                    <p className="text-xs text-primary/80">💡 {g.sugestao}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Leads fora do SLA */}
      {d.leadsForaSLA.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" /> Leads Fora do SLA
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{d.leadsForaSLA.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30">
                  <TableHead className="text-[10px] uppercase h-8">Lead</TableHead>
                  <TableHead className="text-[10px] uppercase h-8">Etapa</TableHead>
                  <TableHead className="text-[10px] uppercase h-8">Tempo</TableHead>
                  <TableHead className="text-[10px] uppercase h-8">SLA</TableHead>
                  <TableHead className="text-[10px] uppercase h-8">Excedeu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.leadsForaSLA.map((lead, i) => {
                  const cfg = statusConfig[lead.status];
                  return (
                    <TableRow key={i} className="border-border/20">
                      <TableCell className="font-medium text-sm py-2">{lead.nome}</TableCell>
                      <TableCell className="text-xs font-mono py-2">{lead.etapa}</TableCell>
                      <TableCell className="font-mono text-sm py-2">{lead.tempoNaEtapa}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground py-2">{lead.slaMeta}</TableCell>
                      <TableCell className="py-2"><Badge variant="outline" className={cn("text-[10px]", cfg.color)}>{lead.extrapolou}</Badge></TableCell>
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
        <div className="space-y-3">
          <h2 className="text-sm font-bold">Distribuição de Tempo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {d.distribuicoes.map(dist => (
              <Card key={dist.etapa} className="border-border/50">
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
      )}

      {/* Busca Individual */}
      <Card className="border-border/50">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" /> Busca Individual
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <Input placeholder="Nome ou telefone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="max-w-sm font-mono text-sm h-9 mb-4" />
          {searchResult ? (
            <div>
              <p className="text-sm font-bold mb-3">{searchResult.nome} · <span className="text-muted-foreground font-mono">{searchResult.telefone}</span></p>
              <div className="relative">
                {searchResult.etapas.map((etapa, i) => {
                  const cfg = statusConfig[etapa.status];
                  return (
                    <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
                      <div className="flex flex-col items-center">
                        <div className={cn("w-3 h-3 rounded-full border-2", etapa.status === "dentro" ? "border-success bg-success/20" : etapa.status === "atencao" ? "border-warning bg-warning/20" : "border-destructive bg-destructive/20")} />
                        {i < searchResult.etapas.length - 1 && <div className="w-px h-8 bg-border" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{etapa.etapa}</span>
                          <Badge variant="outline" className={cn("text-[10px]", cfg.color)}>{etapa.duracao}</Badge>
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
            <p className="text-xs text-muted-foreground">Digite nome ou telefone para buscar a jornada completa.</p>
          )}
        </CardContent>
      </Card>

      {/* Leads por Etapa */}
      {d.leadsByStageArr.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">Leads por Etapa — Agora</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30">
                  <TableHead className="text-[10px] uppercase h-8">Etapa</TableHead>
                  <TableHead className="text-[10px] uppercase h-8 text-right">Qtd</TableHead>
                  <TableHead className="text-[10px] uppercase h-8 text-right">Alertas SLA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.leadsByStageArr.map(l => (
                  <TableRow key={l.etapa} className="border-border/20">
                    <TableCell className="font-medium text-xs py-2">{l.etapa}</TableCell>
                    <TableCell className="text-right text-xs font-semibold py-2">{l.qtd}</TableCell>
                    <TableCell className="text-right py-2">
                      {l.alertas > 0 ? (
                        <Badge variant="destructive" className="text-[10px] gap-1">
                          <AlertTriangle className="h-3 w-3" /> {l.alertas}
                        </Badge>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Abandono por Etapa */}
      <Card className="border-border/50">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-semibold">Taxa de Abandono por Etapa</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-3">
            {d.abandonArr.map(a => (
              <div key={a.etapa} className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground w-24 text-right shrink-0">{a.etapa}</span>
                <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                  <div className="bg-destructive/60 h-full rounded-full flex items-center justify-end pr-2 transition-all duration-1000"
                    style={{ width: `${Math.min(a.abandonaram, 100)}%` }}>
                    <span className="text-[10px] font-bold text-destructive-foreground">{a.abandonaram}%</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-40 shrink-0">{a.motivoPrincipal}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
