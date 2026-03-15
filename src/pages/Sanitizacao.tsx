import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Search, AlertTriangle, Phone, PhoneOff, BarChart3, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Data ──────────────────────────────────────────────────────────────────────
const DATA = {
  total: 308,
  sol_sdr: 149,
  funil: { "TRAFEGO PAGO": 139, "PROPOSTA": 63, "NEGOCIAÇÃO": 31, "QUALIFICADO": 22, "CONTATO REALIZADO": 20, "FOLLOW UP": 17, "QUALIFICAÇÃO": 9, "PROSPECÇÃO": 7 } as Record<string, number>,
  responsavel: { "SOL SDR": 149, "Vitoria Coelho": 29, "Leonardo Neves": 26, "Vinicius Selane": 23, "Gabriel Ferrari": 19, "Devisson Apolinário": 16, "DANIELI NICASSO": 13, "Raphael Franca": 10 } as Record<string, number>,
  dup_tel_groups: {"5511974427957":[{"projeto_id":"12565","nome":"RICARDO FERREIRA - CIAPAV","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12531","nome":"RICARDO FERREIRA - CIAPAV","etapa":"PROPOSTA","status":"aberto","responsavel":"Vitoria Coelho","valor":"7500.0"}],"5514981350200":[{"projeto_id":"12740","nome":"Jose Ciro Barbarini","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12777","nome":"Jose Ciro Barbarini","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""}],"5514981747985":[{"projeto_id":"12776","nome":"Luzia Bernadete Rodrigues De Camargo","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12782","nome":"Luzia Bernadete Rodrigues De Camargo","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12783","nome":"Luzia Bernadete Rodrigues De Camargo","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""}],"5514996136154":[{"projeto_id":"12674","nome":"Nathalia Gargaro","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12787","nome":"Nathalia Gargaro","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12697","nome":"NATHALIA","etapa":"PROPOSTA","status":"aberto","responsavel":"DANIELI NICASSO","valor":"11700.0"}],"5516994161049":[{"projeto_id":"12693","nome":"Valeria Mariano","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12792","nome":"Valeria Mariano","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""}],"5516999635060":[{"projeto_id":"12602","nome":"Luana","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12603","nome":"Luana","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""}],"5517981257686":[{"projeto_id":"12742","nome":"Debora Mlaker","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12779","nome":"Debora Mlaker","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""}],"5517981903322":[{"projeto_id":"12530","nome":"Edson Biazzi","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12551","nome":"EDSON ALEXANDRE BIAZZI","etapa":"NEGOCIAÇÃO","status":"aberto","responsavel":"Gabriel Ferrari","valor":"18900.0"}],"5517982309452":[{"projeto_id":"10442","nome":"JOAO MARCIEL MARASCALCHI","etapa":"QUALIFICADO","status":"aberto","responsavel":"Vinicius Selane","valor":""},{"projeto_id":"10372","nome":"EMEF VICENCINA VACARO MORSOLETO","etapa":"PROPOSTA","status":"aberto","responsavel":"Vinicius Selane","valor":"159900.0"},{"projeto_id":"10374","nome":"Supermercado Mutirão (AV Dezessete)","etapa":"PROPOSTA","status":"aberto","responsavel":"Vinicius Selane","valor":"93000.0"},{"projeto_id":"10659","nome":"MONISE BERNARDES DE SOUSA","etapa":"PROPOSTA","status":"aberto","responsavel":"Vinicius Selane","valor":"25850.0"},{"projeto_id":"12728","nome":"Leandro (New Irrigação)","etapa":"PROPOSTA","status":"aberto","responsavel":"Vinicius Selane","valor":"13690.0"}],"5517991009246":[{"projeto_id":"12631","nome":"Ana Carolina Dias Rissi","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12632","nome":"Ana Carolina Dias Rissi","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""}],"5517996399107":[{"projeto_id":"12979","nome":"Tatão Gizoldi","etapa":"PROPOSTA","status":"aberto","responsavel":"Vinicius Selane","valor":"21990.0"},{"projeto_id":"12568","nome":"TESTE FB9","etapa":"NEGOCIAÇÃO","status":"aberto","responsavel":"Vinicius Selane","valor":""}],"5517996669163":[{"projeto_id":"12454","nome":"Posto David de Oliveira (Rua Nove de Julho)","etapa":"NEGOCIAÇÃO","status":"aberto","responsavel":"Vinicius Selane","valor":"40900.0"},{"projeto_id":"12455","nome":"David de Oliveira (Compl da Rua David de Oliveira)","etapa":"NEGOCIAÇÃO","status":"aberto","responsavel":"Vinicius Selane","valor":"37500.0"}],"5518996388887":[{"projeto_id":"12741","nome":"Alen Rosa","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12778","nome":"Alen Rosa","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""}],"5518997012493":[{"projeto_id":"12597","nome":"Izabel Santana De Lima","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12598","nome":"Izabel Santana De Lima","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""}],"5518997497791":[{"projeto_id":"12686","nome":"Jose Luis Da Silva Neto","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12743","nome":"Jose Luis Da Silva Neto","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12780","nome":"Jose Luis Da Silva Neto","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""}],"5518998899898":[{"projeto_id":"12707","nome":"Gabriel Silva","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12796","nome":"Gabriel Silva","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""}],"5524981214425":[{"projeto_id":"12987","nome":"Thaís Jardim [1N]","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"Leonardo Neves","valor":""},{"projeto_id":"12933","nome":"Thais - bairro Elite","etapa":"PROPOSTA","status":"aberto","responsavel":"Leonardo Neves","valor":""}],"553498271102":[{"projeto_id":"12560","nome":"ANTONIO CARLOS DA SILVA","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12593","nome":"ANTONIO CARLOS DA SILVA","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""}],"5536478888895":[{"projeto_id":"12585","nome":"Valentin","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12586","nome":"Valentin","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12587","nome":"Valentin","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12588","nome":"Valentin","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12589","nome":"Valentin","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12590","nome":"Valentin","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""}],"5541988727178":[{"projeto_id":"12688","nome":"Bruno Ribas Muetz","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12790","nome":"Bruno Ribas Muetz","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""}],"5553984741979":[{"projeto_id":"12713","nome":"Fabricio Ricardo Lopes Moralles","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""},{"projeto_id":"12714","nome":"Fabricio Ricardo Lopes Moralles","etapa":"TRAFEGO PAGO","status":"aberto","responsavel":"SOL SDR","valor":""}],"559999999999":[{"projeto_id":"10619","nome":"PREF OLÍMPIA - PMI","etapa":"PROSPECÇÃO","status":"aberto","responsavel":"Gabriel Ferrari","valor":""},{"projeto_id":"10595","nome":"Fernando Nema","etapa":"QUALIFICADO","status":"aberto","responsavel":"Vinicius Selane","valor":"13990.0"},{"projeto_id":"6937","nome":"ANDRE - APORE GO","etapa":"CONTATO REALIZADO","status":"aberto","responsavel":"Gabriel Ferrari","valor":"64900.0"},{"projeto_id":"12553","nome":"ANTONIO CELSO LOPES PEREIRA","etapa":"PROPOSTA","status":"aberto","responsavel":"Gabriel Ferrari","valor":"13900.0"},{"projeto_id":"12709","nome":"FRATERNIDADE OLIMPIENSE","etapa":"PROPOSTA","status":"aberto","responsavel":"Gabriel Ferrari","valor":"16900.0"}],"5599999999999":[{"projeto_id":"12081","nome":"MARILENE DE CARVALHO COSTA","etapa":"PROPOSTA","status":"aberto","responsavel":"Gabriel Ferrari","valor":"19800.0"},{"projeto_id":"12446","nome":"TIAGO HENRIQUE MENEZES SANTOS","etapa":"PROPOSTA","status":"aberto","responsavel":"Gabriel Ferrari","valor":"16500.0"}]} as Record<string, Array<{projeto_id:string;nome:string;etapa:string;status:string;responsavel:string;valor:string}>>,
  sem_tel: [{"projeto_id":"3686","nome":"AG LOGISTICA","etapa":"PROSPECÇÃO","status":"aberto","responsavel":"Gabriel Ferrari"},{"projeto_id":"1415","nome":"Beto Zuliani","etapa":"QUALIFICADO","status":"aberto","responsavel":"Gabriel Ferrari"},{"projeto_id":"11322","nome":"RENATO CARBONI","etapa":"CONTATO REALIZADO","status":"aberto","responsavel":"Gabriel Ferrari"},{"projeto_id":"11924","nome":"ASSOCIACAO DOS MORADORES DO RESIDENCIAL VERIDIANA","etapa":"CONTATO REALIZADO","status":"aberto","responsavel":"Gabriel Ferrari"},{"projeto_id":"11320","nome":"PAULO AFONSO SENO","etapa":"PROPOSTA","status":"aberto","responsavel":"Gabriel Ferrari"},{"projeto_id":"11333","nome":"Augusto Helio","etapa":"PROPOSTA","status":"aberto","responsavel":"Vinicius Selane"},{"projeto_id":"11366","nome":"Leo (Contato Marcílio)","etapa":"PROPOSTA","status":"aberto","responsavel":"Vinicius Selane"},{"projeto_id":"12041","nome":"RENATO BORGES FERREIRA","etapa":"PROPOSTA","status":"aberto","responsavel":"Gabriel Ferrari"},{"projeto_id":"4571","nome":"MAICON BAZAM","etapa":"NEGOCIAÇÃO","status":"perdido","responsavel":"Gabriel Ferrari"},{"projeto_id":"5431","nome":"APARECIDO BARTOLOMEU","etapa":"NEGOCIAÇÃO","status":"perdido","responsavel":"DANIELI NICASSO"}],
};

const RECOMENDACOES = [
  { pri: 'critico', titulo: 'Eliminar 6 duplicatas de "Valentin"', desc: 'Projetos 12585–12590 com mesmo nome e telefone em TRAFEGO PAGO. Manter apenas o mais recente (12590) e arquivar os demais 5.' },
  { pri: 'critico', titulo: 'Corrigir 5 projetos com telefone 559999999999', desc: 'PREF OLÍMPIA, Fernando Nema, ANDRE, ANTONIO CELSO e FRATERNIDADE cadastrados com número fictício.' },
  { pri: 'critico', titulo: 'Investigar número 5517982309452 — 5 clientes diferentes', desc: 'Mesmo número aparece em 5 projetos. Valor potencial somado: R$ 292.440.' },
  { pri: 'alto', titulo: 'Resolver duplicatas NATHALIA (3 projetos, R$ 11.700)', desc: 'Projetos 12674 e 12787 devem ser arquivados. Manter 12697 em PROPOSTA.' },
  { pri: 'alto', titulo: 'Resolver duplicatas Luzia Bernadete (3 projetos)', desc: 'Projetos 12776, 12782 e 12783 todos em TRAFEGO PAGO. Manter o mais recente.' },
  { pri: 'alto', titulo: 'Resolver duplicatas Jose Luis (3 projetos)', desc: 'Projetos 12686, 12743 e 12780 em TRAFEGO PAGO. Manter apenas o mais recente.' },
  { pri: 'alto', titulo: 'Resolver EDSON BIAZZI — manter NEGOCIAÇÃO (R$ 18.900)', desc: 'Projeto 12530 deve ser arquivado. Manter 12551 em NEGOCIAÇÃO.' },
  { pri: 'alto', titulo: 'Resolver RICARDO FERREIRA — manter PROPOSTA (R$ 7.500)', desc: 'Projeto 12565 deve ser arquivado. Manter 12531 em PROPOSTA.' },
  { pri: 'medio', titulo: 'Atualizar telefone nos 10 projetos sem contato', desc: 'Buscar telefone real nos registros físicos ou via contato com o responsável.' },
  { pri: 'medio', titulo: 'Corrigir 2 projetos com telefone 5599999999999', desc: 'MARILENE (R$ 19.800) e TIAGO HENRIQUE (R$ 16.500) com telefone fictício. Total: R$ 36.300.' },
  { pri: 'medio', titulo: 'Implementar validação de duplicatas no Make.com', desc: 'Antes de criar projeto via automação, verificar se já existe lead com mesmo telefone.' },
  { pri: 'baixo', titulo: 'Normalizar formato de telefone', desc: 'Padronizar formato 55XXXXXXXXXXX para facilitar deduplicação automática.' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTel(tel: string) {
  if (tel.length === 13) return `+${tel.slice(0, 2)} (${tel.slice(2, 4)}) ${tel.slice(4, 9)}-${tel.slice(9)}`;
  if (tel.length === 12) return `+${tel.slice(0, 2)} (${tel.slice(2, 4)}) ${tel.slice(4, 8)}-${tel.slice(8)}`;
  return tel;
}

function formatVal(v: string) {
  if (!v) return "—";
  const n = parseFloat(v);
  if (isNaN(n)) return "—";
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;
}

function etapaColor(etapa: string): string {
  const e = etapa.toUpperCase();
  if (e.includes("TRAFEGO")) return "bg-info/10 text-info border-info/20";
  if (e.includes("PROPOSTA")) return "bg-warning/10 text-warning border-warning/20";
  if (e.includes("NEGOCI")) return "bg-destructive/10 text-destructive border-destructive/20";
  if (e.includes("QUALIFICADO")) return "bg-success/10 text-success border-success/20";
  if (e.includes("QUALIFICA")) return "bg-success/10 text-success border-success/20";
  if (e.includes("FOLLOW") || e.includes("CONTATO")) return "bg-primary/10 text-primary border-primary/20";
  if (e.includes("PROSPEC")) return "bg-muted text-muted-foreground border-border";
  return "bg-muted text-muted-foreground border-border";
}

function isAdvancedStage(etapa: string) {
  const e = etapa.toUpperCase();
  return ["PROPOSTA", "NEGOCIAÇÃO", "QUALIFICADO", "QUALIFICAÇÃO", "FOLLOW UP", "CONTATO REALIZADO"].some(s => e.includes(s.replace("Ã", "").replace("Ç", "")));
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
        <p className={cn("text-3xl font-extrabold", colorClass.replace("bg-", "text-").split(" ")[0].replace("text-", "text-"))}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

// ── Dup Group ─────────────────────────────────────────────────────────────────
function DupGroup({ tel, projetos }: { tel: string; projetos: Array<{ projeto_id: string; nome: string; etapa: string; status: string; responsavel: string; valor: string }> }) {
  const [open, setOpen] = useState(false);
  const isFake = tel.includes("99999");
  const count = projetos.length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="glass-card mb-2 overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors cursor-pointer">
            <span className="font-mono text-sm text-primary font-medium">{formatTel(tel)}</span>
            {isFake && <Badge variant="destructive" className="text-[10px]">TEL INVÁLIDO</Badge>}
            <span className="text-sm text-foreground font-medium flex-1 text-left truncate">{projetos[0].nome}</span>
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
  const pct = ((value / max) * 100).toFixed(1);
  return (
    <div className="flex items-center gap-3 bg-card/50 border border-border/50 rounded-lg px-4 py-3">
      <span className="font-mono text-xs text-muted-foreground w-36 shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-background rounded h-1.5 overflow-hidden">
        <div className="h-full rounded bg-gradient-to-r from-primary to-primary/60 transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-bold text-primary text-base w-10 text-right">{value}</span>
      <span className="font-mono text-[11px] text-muted-foreground w-10 text-right">{((value / total) * 100).toFixed(0)}%</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Sanitizacao() {
  const [search, setSearch] = useState("");

  const dupEntries = useMemo(() => {
    const entries = Object.entries(DATA.dup_tel_groups);
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(([tel, projetos]) => {
      const searchStr = (tel + " " + projetos.map(p => p.nome + " " + p.projeto_id).join(" ")).toLowerCase();
      return searchStr.includes(q);
    });
  }, [search]);

  const fakeGroups = useMemo(() => {
    return Object.entries(DATA.dup_tel_groups).filter(([tel]) => tel.includes("99999"));
  }, []);

  const maxEtapa = Math.max(...Object.values(DATA.funil));
  const maxResp = Math.max(...Object.values(DATA.responsavel));

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
            <span>📅 15 Mar 2026</span>
            <span>🏢 Evolve Energia Solar — Olímpia/SP</span>
            <span>📊 308 projetos analisados</span>
          </div>
        </div>
        <Badge variant="destructive" className="text-xs self-start">⚠ Ação Necessária</Badge>
      </div>

      {/* Alert Banner */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex gap-3 items-start py-4">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>Foram identificados problemas de qualidade de dados que impactam diretamente o funil comercial.</strong>{" "}
            Leads sendo contactados múltiplas vezes, projetos com telefone inválido e registros duplicados estão gerando ruído operacional e potencial perda de receita.
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="Duplicatas por Tel." value={59} sub="em 23 telefones únicos" colorClass="bg-destructive text-destructive" />
        <KPICard label="Telefones Inválidos" value={7} sub='formato 999999...' colorClass="bg-warning text-warning" />
        <KPICard label="Sem Telefone" value={10} sub="projetos sem contato" colorClass="bg-warning text-warning" />
        <KPICard label="Total Projetos" value={308} sub="base ativa analisada" colorClass="bg-info text-info" />
        <KPICard label="SOL SDR" value={149} sub="48% dos projetos" colorClass="bg-success text-success" />
        <KPICard label="Com Problemas" value="~19%" sub="taxa de inconsistência" colorClass="bg-primary text-primary" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="duplicatas" className="space-y-4">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-card border border-border/50 p-1">
          <TabsTrigger value="duplicatas" className="flex items-center gap-1.5 text-xs">
            <span className="text-destructive">●</span> Duplicatas <Badge variant="secondary" className="text-[10px] ml-1">23</Badge>
          </TabsTrigger>
          <TabsTrigger value="invalidos" className="flex items-center gap-1.5 text-xs">
            <Phone className="h-3 w-3 text-warning" /> Inválidos <Badge variant="secondary" className="text-[10px] ml-1">7</Badge>
          </TabsTrigger>
          <TabsTrigger value="semtel" className="flex items-center gap-1.5 text-xs">
            <PhoneOff className="h-3 w-3 text-warning" /> Sem Telefone <Badge variant="secondary" className="text-[10px] ml-1">10</Badge>
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
              <p className="text-center text-muted-foreground py-8">Nenhum resultado encontrado.</p>
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
            <Badge variant="secondary" className="font-mono text-[10px]">7 registros</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Esses projetos estão cadastrados com números fictícios (999...). Não é possível realizar contato ativo.
          </p>
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
            <Badge variant="secondary" className="font-mono text-[10px]">10 registros</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DATA.sem_tel.map((p) => {
              const isPerdido = p.status === "perdido";
              return (
                <Card key={p.projeto_id} className="glass-card glass-card-hover">
                  <CardContent className="pt-4 pb-4 space-y-2">
                    <p className="font-mono text-[11px] text-muted-foreground">#{p.projeto_id}</p>
                    <p className="font-medium text-sm">{p.nome}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={cn("text-[10px] uppercase", etapaColor(p.etapa))}>{p.etapa}</Badge>
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
            <Badge variant="secondary" className="font-mono text-[10px]">308 projetos</Badge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest mb-3">Por Etapa</p>
              <div className="space-y-2">
                {Object.entries(DATA.funil).map(([label, val]) => (
                  <FunnelBar key={label} label={label} value={val} max={maxEtapa} total={DATA.total} />
                ))}
              </div>
            </div>
            <div>
              <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest mb-3">Por Responsável (Top 8)</p>
              <div className="space-y-2">
                {Object.entries(DATA.responsavel).map(([label, val]) => (
                  <FunnelBar key={label} label={label} value={val} max={maxResp} total={DATA.total} />
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
              Plano de Ação — 12 Ações Priorizadas
            </h2>
          </div>
          <div className="space-y-3">
            {RECOMENDACOES.map((r, i) => {
              const pri = priConfig[r.pri];
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
          <p>Sol Estrateg.IA — Evolve Energia Solar</p>
          <p className="mt-1">Gerado em 15/03/2026 por RBR Consult</p>
        </div>
        <p>Base: 308 projetos | SolarMarket</p>
      </div>
    </div>
  );
}
