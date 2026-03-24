import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Search, AlertTriangle, Phone, PhoneOff, BarChart3, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEnrichedProposals } from "@/hooks/useEnrichedProposals";
import { normalizePhone } from "@/hooks/useMakeDataStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProjectEntry {
  projeto_id: string;
  nome: string;
  etapa: string;
  status: string;
  responsavel: string;
  valor: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTel(tel: string) {
  if (tel.length === 13) return `+${tel.slice(0, 2)} (${tel.slice(2, 4)}) ${tel.slice(4, 9)}-${tel.slice(9)}`;
  if (tel.length === 12) return `+${tel.slice(0, 2)} (${tel.slice(2, 4)}) ${tel.slice(4, 8)}-${tel.slice(8)}`;
  if (tel.length === 11) return `(${tel.slice(0, 2)}) ${tel.slice(2, 7)}-${tel.slice(7)}`;
  if (tel.length === 10) return `(${tel.slice(0, 2)}) ${tel.slice(2, 6)}-${tel.slice(6)}`;
  return tel;
}

function formatVal(v: string) {
  if (!v) return "—";
  const n = parseFloat(v);
  if (isNaN(n)) return "—";
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;
}

function etapaColor(etapa: string): string {
  const e = (etapa || "").toUpperCase();
  if (e.includes("TRAFEGO")) return "bg-info/10 text-info border-info/20";
  if (e.includes("PROPOSTA")) return "bg-warning/10 text-warning border-warning/20";
  if (e.includes("NEGOCI")) return "bg-destructive/10 text-destructive border-destructive/20";
  if (e.includes("QUALIFICADO") || e.includes("QUALIFICA")) return "bg-success/10 text-success border-success/20";
  if (e.includes("FOLLOW") || e.includes("CONTATO")) return "bg-primary/10 text-primary border-primary/20";
  if (e.includes("PROSPEC")) return "bg-muted text-muted-foreground border-border";
  return "bg-muted text-muted-foreground border-border";
}

function isAdvancedStage(etapa: string) {
  const e = (etapa || "").toUpperCase();
  return ["PROPOSTA", "NEGOCIAÇ", "QUALIFICADO", "QUALIFICAÇ", "FOLLOW UP", "CONTATO REALIZADO"].some(s => e.includes(s));
}

function isInvalidPhone(tel: string): boolean {
  if (!tel) return true;
  const digits = tel.replace(/\D/g, "");
  if (digits.length < 10) return true;
  // Repeated digits (999999, 000000, etc.)
  if (/^(\d)\1{5,}$/.test(digits)) return true;
  // Known fake patterns
  if (digits.includes("99999999")) return true;
  if (digits === "0") return true;
  return false;
}

const priConfig: Record<string, { label: string; cls: string }> = {
  critico: { label: "🔴 CRÍTICO", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  alto: { label: "🟠 ALTO", cls: "bg-warning/15 text-warning border-warning/30" },
  medio: { label: "🟡 MÉDIO", cls: "bg-warning/15 text-warning border-warning/30" },
  baixo: { label: "🟢 BAIXO", cls: "bg-success/15 text-success border-success/30" },
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, colorClass }: { label: string; value: string | number; sub: string; colorClass: string }) {
  return (
    <Card className={cn("relative overflow-hidden animate-fade-up glass-card glass-card-hover")}>
      <div className={cn("absolute top-0 left-0 right-0 h-1", colorClass)} />
      <CardContent className="pt-6 pb-4">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono mb-2">{label}</p>
        <p className="text-3xl font-extrabold">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

// ── Dup Group ─────────────────────────────────────────────────────────────────
function DupGroup({ tel, projetos }: { tel: string; projetos: ProjectEntry[] }) {
  const [open, setOpen] = useState(false);
  const isFake = isInvalidPhone(tel);
  const count = projetos.length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="glass-card mb-2 overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors cursor-pointer">
            <span className="font-mono text-sm text-primary font-medium">{formatTel(tel)}</span>
            {isFake && <Badge variant="destructive" className="text-[10px]">TEL INVÁLIDO</Badge>}
            <span className="text-sm text-foreground font-medium flex-1 text-left truncate">{projetos[0]?.nome}</span>
            <Badge variant={count >= 4 ? "destructive" : "secondary"} className="text-[10px]">
              {count} projetos
            </Badge>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase tracking-wider">ID</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Nome</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Etapa</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Responsável</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Valor</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projetos.map((p) => (
                  <TableRow key={p.projeto_id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">#{p.projeto_id}</TableCell>
                    <TableCell className="text-sm">{p.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px] uppercase", etapaColor(p.etapa))}>{p.etapa}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.responsavel}</TableCell>
                    <TableCell className={cn("text-xs font-mono", p.valor ? "text-success" : "text-muted-foreground")}>{formatVal(p.valor)}</TableCell>
                    <TableCell>
                      {isAdvancedStage(p.etapa) ? (
                        <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/20">✓ MANTER</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">× ARQUIVAR</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// ── Funnel Bar ────────────────────────────────────────────────────────────────
function FunnelBar({ label, value, max, total }: { label: string; value: number; max: number; total: number }) {
  const pct = max > 0 ? ((value / max) * 100).toFixed(1) : "0";
  return (
    <div className="flex items-center gap-3 bg-card/50 border border-border/50 rounded-lg px-4 py-3">
      <span className="font-mono text-xs text-muted-foreground w-36 shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-background rounded h-1.5 overflow-hidden">
        <div className="h-full rounded bg-gradient-to-r from-primary to-primary/60 transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-bold text-primary text-base w-10 text-right">{value}</span>
      <span className="font-mono text-[11px] text-muted-foreground w-10 text-right">{total > 0 ? ((value / total) * 100).toFixed(0) : 0}%</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Sanitizacao() {
  const [search, setSearch] = useState("");
  const { proposals, isLoading, lastUpdate, isFetching } = useEnrichedProposals();
  const { forceSync, isSyncing } = useForceSync();

  // ── Compute all analytics from live proposals ──
  const analysis = useMemo(() => {
    if (!proposals || proposals.length === 0) {
      return { total: 0, dupGroups: {} as Record<string, ProjectEntry[]>, semTel: [] as ProjectEntry[], invalidGroups: {} as Record<string, ProjectEntry[]>, funil: {} as Record<string, number>, responsavel: {} as Record<string, number>, dupProjectCount: 0, invalidProjectCount: 0, recommendations: [] as Array<{ pri: string; titulo: string; desc: string }> };
    }

    const toEntry = (p: any): ProjectEntry => ({
      projeto_id: p.projeto_id || "",
      nome: p.nome_cliente || p.makeNome || "",
      etapa: p.etapa || "",
      status: p.status || "",
      responsavel: p.responsavel || "",
      valor: p.valor_proposta ? String(p.valor_proposta) : "",
    });

    // Group by normalized phone
    const phoneMap = new Map<string, ProjectEntry[]>();
    const noPhone: ProjectEntry[] = [];

    for (const p of proposals) {
      const raw = p.clienteTelefone || "";
      const norm = normalizePhone(raw);
      if (!norm || norm.length < 8) {
        noPhone.push(toEntry(p));
        continue;
      }
      const existing = phoneMap.get(norm) || [];
      existing.push(toEntry(p));
      phoneMap.set(norm, existing);
    }

    // Duplicates: phones with 2+ projects
    const dupGroups: Record<string, ProjectEntry[]> = {};
    let dupProjectCount = 0;
    for (const [tel, entries] of phoneMap) {
      if (entries.length >= 2) {
        dupGroups[tel] = entries;
        dupProjectCount += entries.length;
      }
    }

    // Invalid phone groups (from duplicates or standalone)
    const invalidGroups: Record<string, ProjectEntry[]> = {};
    let invalidProjectCount = 0;
    for (const [tel, entries] of phoneMap) {
      if (isInvalidPhone(tel)) {
        invalidGroups[tel] = entries;
        invalidProjectCount += entries.length;
      }
    }

    // Funnel distribution
    const funil: Record<string, number> = {};
    const responsavel: Record<string, number> = {};
    for (const p of proposals) {
      const e = p.etapa || "SEM ETAPA";
      funil[e] = (funil[e] || 0) + 1;
      const r = p.responsavel || "Sem responsável";
      responsavel[r] = (responsavel[r] || 0) + 1;
    }

    // Sort funnel descending
    const sortedFunil = Object.fromEntries(Object.entries(funil).sort((a, b) => b[1] - a[1]));
    const sortedResp = Object.fromEntries(Object.entries(responsavel).sort((a, b) => b[1] - a[1]).slice(0, 10));

    // Dynamic recommendations
    const recommendations: Array<{ pri: string; titulo: string; desc: string }> = [];
    const dupCount = Object.keys(dupGroups).length;
    const invalidCount = Object.keys(invalidGroups).length;

    // Find worst offenders
    const sortedDups = Object.entries(dupGroups).sort((a, b) => b[1].length - a[1].length);

    if (sortedDups.length > 0) {
      const [worstTel, worstEntries] = sortedDups[0];
      const totalVal = worstEntries.reduce((s, e) => s + (parseFloat(e.valor) || 0), 0);
      recommendations.push({
        pri: worstEntries.length >= 4 ? "critico" : "alto",
        titulo: `Eliminar ${worstEntries.length} duplicatas de "${worstEntries[0].nome}"`,
        desc: `Telefone ${formatTel(worstTel)} com ${worstEntries.length} projetos.${totalVal > 0 ? ` Valor total: R$ ${totalVal.toLocaleString("pt-BR")}.` : ""} Manter o mais avançado e arquivar os demais.`,
      });
    }

    if (invalidCount > 0) {
      recommendations.push({
        pri: "critico",
        titulo: `Corrigir ${invalidProjectCount} projetos com telefone inválido`,
        desc: `${invalidCount} telefone(s) fictício(s) detectado(s). Não é possível realizar contato ativo com esses leads.`,
      });
    }

    if (noPhone.length > 0) {
      recommendations.push({
        pri: "medio",
        titulo: `Atualizar ${noPhone.length} projetos sem telefone`,
        desc: "Buscar telefone real nos registros físicos ou via contato com o responsável.",
      });
    }

    // More dup-specific recommendations
    for (const [tel, entries] of sortedDups.slice(1, 5)) {
      const hasAdvanced = entries.some(e => isAdvancedStage(e.etapa));
      const totalVal = entries.reduce((s, e) => s + (parseFloat(e.valor) || 0), 0);
      recommendations.push({
        pri: hasAdvanced ? "alto" : "medio",
        titulo: `Resolver ${entries.length} duplicatas: ${entries[0].nome}`,
        desc: `Telefone ${formatTel(tel)}.${totalVal > 0 ? ` Valor: R$ ${totalVal.toLocaleString("pt-BR")}.` : ""} ${hasAdvanced ? "Manter projeto em etapa mais avançada." : "Manter o mais recente."}`,
      });
    }

    if (dupCount > 3) {
      recommendations.push({
        pri: "medio",
        titulo: "Implementar validação de duplicatas na automação",
        desc: "Antes de criar projeto via automação, verificar se já existe lead com mesmo telefone.",
      });
    }

    recommendations.push({
      pri: "baixo",
      titulo: "Normalizar formato de telefone",
      desc: "Padronizar formato 55XXXXXXXXXXX para facilitar deduplicação automática.",
    });

    return {
      total: proposals.length,
      dupGroups,
      semTel: noPhone,
      invalidGroups,
      funil: sortedFunil,
      responsavel: sortedResp,
      dupProjectCount,
      invalidProjectCount,
      recommendations,
    };
  }, [proposals]);

  // ── Filtered dup entries ──
  const dupEntries = useMemo(() => {
    const entries = Object.entries(analysis.dupGroups);
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(([tel, projetos]) => {
      const searchStr = (tel + " " + projetos.map(p => p.nome + " " + p.projeto_id).join(" ")).toLowerCase();
      return searchStr.includes(q);
    });
  }, [search, analysis.dupGroups]);

  const fakeGroups = useMemo(() => {
    return Object.entries(analysis.invalidGroups);
  }, [analysis.invalidGroups]);

  const maxEtapa = Math.max(...Object.values(analysis.funil), 1);
  const maxResp = Math.max(...Object.values(analysis.responsavel), 1);
  const dupGroupCount = Object.keys(analysis.dupGroups).length;
  const inconsistencyRate = analysis.total > 0 ? ((analysis.dupProjectCount + analysis.invalidProjectCount + analysis.semTel.length) / analysis.total * 100).toFixed(0) : "0";

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Carregando dados para análise de sanitização...</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (analysis.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Nenhum dado disponível para análise de sanitização.</p>
        <Button variant="outline" size="sm" onClick={() => forceSync()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Recarregar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">☀🤖</span>
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Sol Estrateg.IA × RBR Consult</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Diagnóstico de Base — <span className="gradient-text">SolarMarket</span>
          </h1>
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground font-mono">
            <span>📅 {lastUpdate}</span>
            <span>📊 {analysis.total} projetos analisados</span>
            {isFetching && <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Atualizando...</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("h-4 w-4 mr-1", isFetching && "animate-spin")} /> Atualizar
          </Button>
          {(analysis.dupProjectCount > 0 || analysis.invalidProjectCount > 0 || analysis.semTel.length > 0) && (
            <Badge variant="destructive" className="text-xs">⚠ Ação Necessária</Badge>
          )}
        </div>
      </div>

      {/* Alert Banner */}
      {(analysis.dupProjectCount > 0 || analysis.invalidProjectCount > 0) && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex gap-3 items-start py-4">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong>Foram identificados problemas de qualidade de dados que impactam diretamente o funil comercial.</strong>{" "}
              {analysis.dupProjectCount > 0 && `${analysis.dupProjectCount} projetos duplicados em ${dupGroupCount} telefones. `}
              {analysis.invalidProjectCount > 0 && `${analysis.invalidProjectCount} projetos com telefone inválido. `}
              {analysis.semTel.length > 0 && `${analysis.semTel.length} projetos sem telefone. `}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="Duplicatas por Tel." value={analysis.dupProjectCount} sub={`em ${dupGroupCount} telefones`} colorClass="bg-destructive text-destructive" />
        <KPICard label="Telefones Inválidos" value={analysis.invalidProjectCount} sub={`${Object.keys(analysis.invalidGroups).length} números`} colorClass="bg-warning text-warning" />
        <KPICard label="Sem Telefone" value={analysis.semTel.length} sub="projetos sem contato" colorClass="bg-warning text-warning" />
        <KPICard label="Total Projetos" value={analysis.total} sub="base ativa analisada" colorClass="bg-info text-info" />
        <KPICard label="SOL SDR" value={proposals.filter(p => (p.responsavel || "").toUpperCase().includes("SOL")).length} sub={`${analysis.total > 0 ? ((proposals.filter(p => (p.responsavel || "").toUpperCase().includes("SOL")).length / analysis.total) * 100).toFixed(0) : 0}% dos projetos`} colorClass="bg-success text-success" />
        <KPICard label="Com Problemas" value={`~${inconsistencyRate}%`} sub="taxa de inconsistência" colorClass="bg-primary text-primary" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="duplicatas" className="space-y-4">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-card border border-border/50 p-1">
          <TabsTrigger value="duplicatas" className="flex items-center gap-1.5 text-xs">
            <span className="text-destructive">●</span> Duplicatas <Badge variant="secondary" className="text-[10px] ml-1">{dupGroupCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="invalidos" className="flex items-center gap-1.5 text-xs">
            <Phone className="h-3 w-3 text-warning" /> Inválidos <Badge variant="secondary" className="text-[10px] ml-1">{analysis.invalidProjectCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="semtel" className="flex items-center gap-1.5 text-xs">
            <PhoneOff className="h-3 w-3 text-warning" /> Sem Telefone <Badge variant="secondary" className="text-[10px] ml-1">{analysis.semTel.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="funil" className="flex items-center gap-1.5 text-xs">
            <BarChart3 className="h-3 w-3 text-success" /> Funil
          </TabsTrigger>
          <TabsTrigger value="plano" className="flex items-center gap-1.5 text-xs">
            <CheckCircle2 className="h-3 w-3 text-success" /> Plano de Ação
          </TabsTrigger>
        </TabsList>

        {/* Tab: Duplicatas */}
        <TabsContent value="duplicatas" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              Duplicatas por Telefone
            </h2>
            <Badge variant="secondary" className="font-mono text-[10px]">{dupEntries.length} grupos</Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por telefone, nome ou projeto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 font-mono text-sm"
            />
          </div>
          <div className="space-y-1">
            {dupEntries.map(([tel, projetos]) => (
              <DupGroup key={tel} tel={tel} projetos={projetos} />
            ))}
            {dupEntries.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {dupGroupCount === 0 ? "🎉 Nenhuma duplicata encontrada! Base limpa." : "Nenhum resultado para a busca."}
              </p>
            )}
          </div>
        </TabsContent>

        {/* Tab: Inválidos */}
        <TabsContent value="invalidos" className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
              Projetos com Telefone Inválido
            </h2>
            <Badge variant="secondary" className="font-mono text-[10px]">{analysis.invalidProjectCount} registros</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Esses projetos estão cadastrados com números fictícios ou inválidos. Não é possível realizar contato ativo.
          </p>
          {fakeGroups.length === 0 && (
            <p className="text-center text-muted-foreground py-8">🎉 Nenhum telefone inválido detectado!</p>
          )}
          {fakeGroups.map(([tel, projetos]) => (
            <DupGroup key={tel} tel={tel} projetos={projetos} />
          ))}
        </TabsContent>

        {/* Tab: Sem Telefone */}
        <TabsContent value="semtel" className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
              Projetos sem Telefone Cadastrado
            </h2>
            <Badge variant="secondary" className="font-mono text-[10px]">{analysis.semTel.length} registros</Badge>
          </div>
          {analysis.semTel.length === 0 && (
            <p className="text-center text-muted-foreground py-8">🎉 Todos os projetos possuem telefone cadastrado!</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {analysis.semTel.map((p) => {
              const isPerdido = p.status?.toLowerCase() === "perdido";
              return (
                <Card key={p.projeto_id} className="glass-card glass-card-hover">
                  <CardContent className="pt-4 pb-4 space-y-2">
                    <p className="font-mono text-[11px] text-muted-foreground">#{p.projeto_id}</p>
                    <p className="font-medium text-sm">{p.nome || "Sem nome"}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={cn("text-[10px] uppercase", etapaColor(p.etapa))}>{p.etapa || "—"}</Badge>
                      {isPerdido ? (
                        <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">× ARQUIVAR</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/20">🔍 BUSCAR TEL</Badge>
                      )}
                      <span className="text-[11px] text-muted-foreground">{p.responsavel}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab: Funil */}
        <TabsContent value="funil" className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Distribuição do Funil
            </h2>
            <Badge variant="secondary" className="font-mono text-[10px]">{analysis.total} projetos</Badge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest mb-3">Por Etapa</p>
              <div className="space-y-2">
                {Object.entries(analysis.funil).map(([label, val]) => (
                  <FunnelBar key={label} label={label} value={val} max={maxEtapa} total={analysis.total} />
                ))}
              </div>
            </div>
            <div>
              <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest mb-3">Por Responsável (Top 10)</p>
              <div className="space-y-2">
                {Object.entries(analysis.responsavel).map(([label, val]) => (
                  <FunnelBar key={label} label={label} value={val} max={maxResp} total={analysis.total} />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Plano de Ação */}
        <TabsContent value="plano" className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Plano de Ação — {analysis.recommendations.length} Ações Priorizadas
            </h2>
          </div>
          {analysis.recommendations.length === 0 && (
            <p className="text-center text-muted-foreground py-8">🎉 Base limpa! Nenhuma ação necessária.</p>
          )}
          <div className="space-y-3">
            {analysis.recommendations.map((r, i) => {
              const pri = priConfig[r.pri] || priConfig.baixo;
              return (
                <Card key={i} className="glass-card glass-card-hover">
                  <CardContent className="flex gap-4 items-start py-4">
                    <span className="text-2xl font-extrabold text-border leading-none w-8 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{r.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.desc}</p>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] shrink-0 uppercase font-mono", pri.cls)}>
                      {pri.label}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="flex flex-wrap justify-between items-center border-t border-border/50 pt-4 text-xs text-muted-foreground font-mono">
        <div>
          <p>Sol Estrateg.IA — Diagnóstico Automatizado</p>
          <p className="mt-1">Última atualização: {lastUpdate}</p>
        </div>
        <p>Base: {analysis.total} projetos | Dados em tempo real</p>
      </div>
    </div>
  );
}
