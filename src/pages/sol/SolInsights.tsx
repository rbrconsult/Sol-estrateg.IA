import { useState, useMemo } from "react";
import { Bot, RefreshCw, Search, Send, X, Sparkles, MessageSquare, DollarSign, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TemperatureBadge } from "@/components/sol/TemperatureBadge";
import { CanalOrigemBadge } from "@/components/sol/CanalOrigemBadge";
import { ScoreGauge } from "@/components/sol/ScoreGauge";
import { useSolLeads, useSolMetricas, type SolLead } from "@/hooks/useSolData";
import { useSolActionsV2 as useSolActions } from '@/hooks/useSolActionsV2';

import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { HelpButton } from "@/components/HelpButton";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";

function KPI({ label, value, icon: Icon, suffix }: { label: string; value: string | number; icon: React.ElementType; suffix?: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-xl font-bold tabular-nums">{value}{suffix || ""}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SolAgent() {
  const { data: leads, isLoading: leadsLoading, refetch: refetchLeads } = useSolLeads();
  const { data: metricas, isLoading: metricasLoading } = useSolMetricas(7);
  const { qualificar, desqualificar, reprocessar, isLoading: actionLoading } = useSolActions();
  
  const { selectedOrgName } = useOrgFilter();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<{ action: string; leads: SolLead[] } | null>(null);

  const filtered = useMemo(() => {
    if (!leads) return [];
    if (!search) return leads;
    const term = search.toLowerCase();
    return leads.filter(l =>
      (l.nome || "").toLowerCase().includes(term) ||
      (l.telefone || "").includes(term) ||
      (l.cidade || "").toLowerCase().includes(term)
    );
  }, [leads, search]);

  // KPIs from today's leads
  const kpis = useMemo(() => {
    const all = leads || [];
    const today = new Date().toISOString().split("T")[0];
    const todayLeads = all.filter(l => l.ts_cadastro?.startsWith(today));
    const qualificados = all.filter(l => (l.status || "").toUpperCase() === "QUALIFICADO");
    const taxa = all.length > 0 ? ((qualificados.length / all.length) * 100).toFixed(0) : "0";
    const totalMsgs = all.reduce((acc, l) => acc + (l.total_mensagens_ia || 0), 0);
    const totalCost = all.reduce((acc, l) => acc + (l.custo_total_usd || 0), 0);
    return {
      novos: todayLeads.length,
      qualificados: qualificados.length,
      taxa: `${taxa}%`,
      msgs: totalMsgs,
      custo: `$${totalCost.toFixed(2)}`,
    };
  }, [leads]);

  // Charts data
  const costChartData = useMemo(() => {
    return (metricas || []).map(m => ({
      data: new Date(m.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      OpenAI: 0,
      "11Labs": 0,
      Make: m.custo_total || 0,
    }));
  }, [metricas]);

  const convChartData = useMemo(() => {
    return (metricas || []).map(m => ({
      data: new Date(m.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      Novos: m.leads_novos,
      Qualificados: m.leads_qualificados,
    }));
  }, [metricas]);

  const toggleSelect = (tel: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(tel) ? next.delete(tel) : next.add(tel);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(l => l.telefone)));
    }
  };

  const getSelectedLeads = () => filtered.filter(l => selected.has(l.telefone));

  const handleBatchAction = (action: string) => {
    const selectedLeads = getSelectedLeads();
    if (selectedLeads.length === 0) {
      toast.warning("Selecione pelo menos um lead");
      return;
    }
    setConfirmAction({ action, leads: selectedLeads });
  };

  const executeBatchAction = async () => {
    if (!confirmAction) return;
    const { action, leads: actionLeads } = confirmAction;
    setConfirmAction(null);

    for (const lead of actionLeads) {
      try {
        if (action === "qualificar") {
          await qualificar.mutateAsync({
            telefone: lead.telefone,
            chat_id: lead.chat_id || "",
            contact_id: lead.contact_id || "",
            nome: lead.nome || "",
            score: String(parseInt(String(lead.score || '0')) || 0),
            valor_conta: lead.valor_conta || "",
          });
        } else if (action === "desqualificar") {
          await desqualificar.mutateAsync({
            telefone: lead.telefone,
            chat_id: lead.chat_id || "",
            contact_id: lead.contact_id || "",
            motivo: "Desqualificado em lote",
          });
        } else if (action === "reprocessar") {
          await reprocessar.mutateAsync({ telefone: lead.telefone });
        }
      } catch { /* errors handled in hook */ }
    }

    setSelected(new Set());
    refetchLeads();
  };

  const handleSync = async () => {
    refetchLeads();
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary" /> SOL Insights
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Dashboard operacional — {selectedOrgName}
          </p>
        </div>
        <div className="flex items-center gap-2">
            Force Sync
          </Button>
          <HelpButton moduleId="sol-agent" label="Ajuda" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPI label="Novos Hoje" value={kpis.novos} icon={Users} />
        <KPI label="Qualificados" value={kpis.qualificados} icon={Sparkles} />
        <KPI label="Taxa Qualif." value={kpis.taxa} icon={TrendingUp} />
        <KPI label="Msgs IA" value={kpis.msgs} icon={MessageSquare} />
        <KPI label="Custo Total" value={kpis.custo} icon={DollarSign} />
      </div>

      {/* Batch actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <Badge variant="secondary">{selected.size} selecionado(s)</Badge>
          <Button size="sm" variant="default" onClick={() => handleBatchAction("qualificar")} disabled={actionLoading}>
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Qualificar
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleBatchAction("desqualificar")} disabled={actionLoading}>
            <X className="h-3.5 w-3.5 mr-1" /> Desqualificar
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBatchAction("reprocessar")} disabled={actionLoading}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reprocessar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Limpar</Button>
        </div>
      )}

      {/* Leads Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Leads Ativos (sol_leads)</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-auto max-h-[500px]">
          {leadsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Temp.</TableHead>
                  <TableHead className="text-right">Msgs IA</TableHead>
                  <TableHead>Contato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 100).map(lead => (
                  <TableRow key={lead.telefone} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Checkbox checked={selected.has(lead.telefone)} onCheckedChange={() => toggleSelect(lead.telefone)} />
                    </TableCell>
                    <TableCell className="font-medium">{lead.nome || "—"}</TableCell>
                    <TableCell><CanalOrigemBadge canal={lead.canal_origem} /></TableCell>
                    <TableCell>
                      <Badge variant={(lead.status || "").toUpperCase() === "QUALIFICADO" ? "default" : "secondary"} className="text-[10px]">
                        {lead.status || "TRAFEGO_PAGO"}
                      </Badge>
                    </TableCell>
                    <TableCell><ScoreGauge score={parseInt(String(lead.score || '0')) || 0} /></TableCell>
                    <TableCell><TemperatureBadge temperatura={lead.temperatura} /></TableCell>
                    <TableCell className="text-right tabular-nums">{lead.total_mensagens_ia || 0}</TableCell>
                    <TableCell className="text-xs">
                      {lead.preferencia_contato === "whatsapp" ? "📱" :
                       lead.preferencia_contato === "ligacao" ? "📞" :
                       lead.preferencia_contato === "reuniao" ? "💻" : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nenhum lead SOL v2 encontrado. Os dados serão preenchidos após o primeiro sync.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" /> Custos (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metricasLoading ? <Skeleton className="h-48" /> : costChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={costChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="data" className="text-[10px]" />
                  <YAxis className="text-[10px]" />
                  <RTooltip />
                  <Legend />
                  <Bar dataKey="OpenAI" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="11Labs" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Make" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">Sem dados de métricas. Serão preenchidos pelo sync automático.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Conversão (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metricasLoading ? <Skeleton className="h-48" /> : convChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={convChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="data" className="text-[10px]" />
                  <YAxis className="text-[10px]" />
                  <RTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Novos" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="Qualificados" stroke="hsl(var(--accent))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">Sem dados de conversão. Serão preenchidos pelo sync automático.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirmar {confirmAction?.action}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === "qualificar" && `Qualificar ${confirmAction.leads.length} lead(s)?`}
              {confirmAction?.action === "desqualificar" && `Desqualificar ${confirmAction.leads.length} lead(s)?`}
              {confirmAction?.action === "reprocessar" && `Reprocessar ${confirmAction.leads.length} lead(s)?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeBatchAction}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
