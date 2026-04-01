import { useMemo, useState } from "react";
import { useForceSync } from "@/hooks/useForceSync";
import { RefreshCw, Users, DollarSign, TrendingUp, Zap, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSolLeads, SolLead } from "@/hooks/useSolData";
import { formatCurrencyAbbrev, formatCurrencyFull } from "@/lib/formatters";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell, PieChart, Pie,
} from "recharts";

interface VendedorStats {
  nome: string;
  totalProjetos: number;
  valorTotal: number;
  ganhos: number;
  valorGanho: number;
  perdidos: number;
  valorPerdido: number;
  abertos: number;
  valorAberto: number;
  taxaConversao: number;
  ticketMedio: number;
  etapas: Record<string, number>;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
];

function classifyStatus(status: string): "ganho" | "perdido" | "aberto" {
  const s = (status || "").toUpperCase();
  if (s.includes("GANH") || s.includes("WON") || s.includes("FECHAR") || s.includes("FECHAD")) return "ganho";
  if (s.includes("PERD") || s.includes("LOST") || s.includes("DESQUAL")) return "perdido";
  return "aberto";
}

function getValorConta(lead: SolLead): number {
  const v = lead.valor_conta;
  if (!v) return 0;
  const num = parseFloat(String(v).replace(/[^\d.,]/g, "").replace(",", "."));
  return isNaN(num) ? 0 : num;
}

function deriveVendedorStats(records: SolLead[]): VendedorStats[] {
  const map = new Map<string, SolLead[]>();

  records.forEach(r => {
    const key = r.closer_nome || "Sem responsável";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  });

  return Array.from(map.entries())
    .map(([nome, recs]) => {
      const ganhos = recs.filter(r => classifyStatus(r.status || "") === "ganho");
      const perdidos = recs.filter(r => classifyStatus(r.status || "") === "perdido");
      const abertos = recs.filter(r => classifyStatus(r.status || "") === "aberto");

      const etapas: Record<string, number> = {};
      recs.forEach(r => {
        const e = r.etapa_funil || "N/A";
        etapas[e] = (etapas[e] || 0) + 1;
      });

      const totalProjetos = recs.length;
      const valorTotal = recs.reduce((a, r) => a + getValorConta(r), 0);
      const valorGanho = ganhos.reduce((a, r) => a + getValorConta(r), 0);

      return {
        nome,
        totalProjetos,
        valorTotal,
        ganhos: ganhos.length,
        valorGanho,
        perdidos: perdidos.length,
        valorPerdido: perdidos.reduce((a, r) => a + getValorConta(r), 0),
        abertos: abertos.length,
        valorAberto: abertos.reduce((a, r) => a + getValorConta(r), 0),
        taxaConversao: totalProjetos > 0 ? (ganhos.length / totalProjetos) * 100 : 0,
        ticketMedio: totalProjetos > 0 ? valorTotal / totalProjetos : 0,
        etapas,
      };
    })
    .sort((a, b) => b.valorTotal - a.valorTotal);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {formatCurrencyFull(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function VendedorPerformance() {
  const { data: records, isLoading, error, isFetching } = useSolLeads(['QUALIFICADO', 'GANHO', 'PERDIDO']);
  const { forceSync, isSyncing } = useForceSync();
  const [sortBy, setSortBy] = useState<"valor" | "projetos" | "conversao">("valor");

  const stats = useMemo(() => {
    if (!records?.length) return [];
    return deriveVendedorStats(records);
  }, [records]);

  const sorted = useMemo(() => {
    const copy = [...stats];
    if (sortBy === "projetos") copy.sort((a, b) => b.totalProjetos - a.totalProjetos);
    else if (sortBy === "conversao") copy.sort((a, b) => b.taxaConversao - a.taxaConversao);
    return copy;
  }, [stats, sortBy]);

  const totals = useMemo(() => {
    if (!stats.length) return { projetos: 0, valor: 0, vendedores: 0 };
    return {
      projetos: stats.reduce((a, s) => a + s.totalProjetos, 0),
      valor: stats.reduce((a, s) => a + s.valorTotal, 0),
      vendedores: stats.length,
    };
  }, [stats]);

  const barData = useMemo(() =>
    sorted.slice(0, 10).map(v => ({
      nome: v.nome.split(" ")[0],
      ganho: v.valorGanho,
      perdido: v.valorPerdido,
      aberto: v.valorAberto,
    })),
  [sorted]);

  const pieData = useMemo(() =>
    sorted.slice(0, 8).map(v => ({
      name: v.nome.split(" ")[0],
      value: v.valorTotal,
    })),
  [sorted]);

  const maxValor = Math.max(...stats.map(s => s.valorTotal), 1);

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Performance por Vendedor</h1>
          <p className="text-xs text-muted-foreground">
            Ranking e comparativo • {totals.vendedores} vendedores • {totals.projetos} projetos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="valor">Por Valor</SelectItem>
              <SelectItem value="projetos">Por Projetos</SelectItem>
              <SelectItem value="conversao">Por Conversão</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => forceSync()} disabled={isSyncing || isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-12">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Carregando dados...
        </div>
      )}

      {!isLoading && stats.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Users className="h-3.5 w-3.5" /> Vendedores
                </div>
                <p className="text-2xl font-bold text-foreground">{totals.vendedores}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <DollarSign className="h-3.5 w-3.5" /> Valor Pipeline
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrencyAbbrev(totals.valor)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <TrendingUp className="h-3.5 w-3.5" /> Projetos
                </div>
                <p className="text-2xl font-bold text-foreground">{totals.projetos}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Valor por Vendedor (Top 10)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tickFormatter={(v) => formatCurrencyAbbrev(v)} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis type="category" dataKey="nome" width={80} tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="ganho" name="Ganho" stackId="a" fill="hsl(142, 71%, 45%)" />
                    <Bar dataKey="aberto" name="Aberto" stackId="a" fill="hsl(var(--primary))" />
                    <Bar dataKey="perdido" name="Perdido" stackId="a" fill="hsl(0, 84%, 60%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Participação no Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrencyFull(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                Ranking de Vendedores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sorted.map((v, i) => (
                <div key={v.nome} className="rounded-lg border border-border p-3 hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                      i === 0 ? "bg-amber-500/20 text-amber-400" :
                      i === 1 ? "bg-slate-400/20 text-slate-300" :
                      i === 2 ? "bg-orange-500/20 text-orange-400" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{v.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.totalProjetos} projetos
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{formatCurrencyAbbrev(v.valorTotal)}</p>
                      <div className="flex items-center gap-1.5 justify-end mt-0.5">
                        <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-400 border-green-500/30">
                          {v.ganhos}G
                        </Badge>
                        <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                          {v.abertos}A
                        </Badge>
                        <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/30">
                          {v.perdidos}P
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={(v.valorTotal / maxValor) * 100} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {v.taxaConversao.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {!isLoading && !error && stats.length === 0 && (
        <Alert className="border-muted">
          <AlertDescription>Nenhum dado encontrado. Aguardando sincronização.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
