import { useState, useMemo, useEffect } from "react";
import { useSolLeads, normalizePhone, type SolLead } from '@/hooks/useSolData';
import { supabase } from "@/integrations/supabase/client";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Search, Send, CheckCircle2, Loader2, Users, Filter,
  Phone, MapPin, Thermometer, Target, RefreshCw, Shuffle, UserCheck, Clock,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const WEBHOOK_QUALIFICAR = "https://hook.us2.make.com/oxaip1d1e946l7hmtyhpr1aic626o92m";

function classifyLead(r: SolLead): string {
  return (r.fup_followup_count || 0) >= 1 ? "FUP FRIO" : "SOL SDR";
}

function isDesqualificado(r: SolLead): boolean {
  const status = (r.status || "").toUpperCase();
  const etapa = (r.etapa_funil || "").toUpperCase();
  const codigo = (r.status || "").toUpperCase();
  return (
    status === "DESQUALIFICADO" || status === "DECLINIO" || status === "DECLÍNIO" ||
    status.includes("DECLINIO") || status.includes("DECLÍNIO") ||
    etapa === "DESQUALIFICADO" || etapa === "DECLINIO" || etapa === "DECLÍNIO" ||
    codigo === "DESQUALIFICADO" || codigo === "LEAD_FRIO"
  );
}

const ETAPA_OPTIONS = ["SOL SDR", "FUP FRIO"];
const STATUS_OPTIONS = ["all", "ativos", "qualificados", "desqualificados"] as const;

interface KrolicMember {
  id: string;
  nome: string;
  sm_id: number | null;
  krolik_id: string | null;
}

type EnrichedLead = SolLead & { _classificacao: string; _desqualificado: boolean; _qualificado: boolean };

export default function Qualificacao() {
  const { data: solLeads, isLoading, isFetching, refetch } = useSolLeads();
  
  const gf = useGlobalFilters();
  const { selectedOrgId, orgs } = useOrgFilter();
  const [search, setSearch] = useState("");
  const [etapaFilter, setEtapaFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_OPTIONS[number]>("ativos");
  const [manualPhone, setManualPhone] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualSending, setManualSending] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchSending, setBatchSending] = useState(false);
  const [comMensagem, setComMensagem] = useState(true);

  const [krolicMembers, setKrolicMembers] = useState<KrolicMember[]>([]);
  const [batchVendor, setBatchVendor] = useState<string>("roleta");
  const [manualVendor, setManualVendor] = useState<string>("roleta");

  const selectedOrgSlug = useMemo(() => {
    if (!selectedOrgId) return null;
    return orgs.find((o) => o.id === selectedOrgId)?.slug || null;
  }, [selectedOrgId, orgs]);

  useEffect(() => {
    const fetchKrolic = async () => {
      let query = supabase
        .from("sol_equipe_sync")
        .select("key, nome, sm_id, krolik_id")
        .eq("ativo", true)
        .eq("krolik_ativo", true);
      if (selectedOrgSlug) query = query.eq("franquia_id", selectedOrgSlug);
      const { data } = await query;
      if (data) setKrolicMembers(data.map((d: any) => ({ id: d.key, nome: d.nome, sm_id: d.sm_id, krolik_id: d.krolik_id })));
    };
    fetchKrolic();
  }, [selectedOrgSlug]);

  const resolveVendor = (selectedValue: string) => {
    if (selectedValue === "roleta" || !selectedValue) {
      if (krolicMembers.length === 0) return { nome: "Roleta", sm_id: null, krolik_id: null };
      const pick = krolicMembers[Math.floor(Math.random() * krolicMembers.length)];
      return { nome: pick.nome, sm_id: pick.sm_id, krolik_id: pick.krolik_id };
    }
    const member = krolicMembers.find((m) => m.id === selectedValue);
    return member
      ? { nome: member.nome, sm_id: member.sm_id, krolik_id: member.krolik_id }
      : { nome: "", sm_id: null, krolik_id: null };
  };

  const isQualificado = (r: SolLead): boolean => {
    if (isDesqualificado(r)) return false;
    const status = (r.status || '').toUpperCase();
    const etapa = (r.etapa_funil || '').toUpperCase();
    const etapaSm = (r.etapa_funil || '').toUpperCase();
    return status === 'QUALIFICADO' || status.includes('QUALIFICADO') || etapa === 'QUALIFICADO' || etapaSm.includes('QUALIFICADO');
  };

  const allLeads = useMemo(() => {
    if (!solLeads?.length) return [];
    const roboStatuses = ['EM_QUALIFICACAO', 'AGUARDANDO_ACAO_MANUAL', 'NAO_RESPONDEU'];
    const { from: effFrom, to: effTo } = gf.effectiveDateRange;
    return solLeads
      .filter((r) => {
        if (effFrom || effTo) {
          const dateStr = r.ts_cadastro;
          if (!dateStr) return false;
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return false;
          if (effFrom) { const fs = new Date(effFrom); fs.setHours(0,0,0,0); if (d < fs) return false; }
          if (effTo) { const es = new Date(effTo); es.setHours(23,59,59,999); if (d > es) return false; }
        }
        const status = (r.status || '').toUpperCase();
        const isRoboStage = !status || roboStatuses.includes(status) || status === 'WHATSAPP';
        return isRoboStage || status === 'QUALIFICADO' || isDesqualificado(r);
      })
      .map((r) => ({
        ...r,
        _classificacao: classifyLead(r),
        _desqualificado: isDesqualificado(r),
        _qualificado: isQualificado(r),
      }));
  }, [solLeads, gf.effectiveDateRange]);

  const filtered = useMemo(() => {
    let result = allLeads;
    if (statusFilter === "ativos") result = result.filter((r) => !r._desqualificado && !r._qualificado);
    else if (statusFilter === "qualificados") result = result.filter((r) => r._qualificado);
    else if (statusFilter === "desqualificados") result = result.filter((r) => r._desqualificado);
    if (etapaFilter !== "all") result = result.filter((r) => r._classificacao === etapaFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) =>
        (r.nome || "").toLowerCase().includes(q) || (r.telefone || "").includes(q) || (r.cidade || "").toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => {
      const getLatest = (r: typeof a) => {
        const dates = [r.ts_ultimo_fup, ([] as any[])?.length ? ([] as any[])[([] as any[]).length - 1]?.data : null, r.ts_ultima_interacao, r.ts_cadastro].filter(Boolean);
        const timestamps = dates.map(d => new Date(d!).getTime()).filter(t => !isNaN(t) && t > 0);
        return timestamps.length > 0 ? Math.max(...timestamps) : 0;
      };
      return getLatest(b) - getLatest(a);
    });
  }, [allLeads, statusFilter, etapaFilter, search]);

  const countAtivos = useMemo(() => allLeads.filter((l) => !l._desqualificado && !l._qualificado).length, [allLeads]);
  const countQualif = useMemo(() => allLeads.filter((l) => l._qualificado).length, [allLeads]);
  const countDesq = useMemo(() => allLeads.filter((l) => l._desqualificado).length, [allLeads]);

  const toggleSelect = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((l) => l.telefone || "")));
    }
  };

  const sendBatch = async () => {
    if (selected.size === 0) return;
    setBatchSending(true);
    const leadsToSend = filtered.filter((l) => selected.has(l.telefone || ""));
    let success = 0;
    for (const lead of leadsToSend) {
      const vendor = resolveVendor(batchVendor);
      const rawPhone = (lead.telefone || "").replace(/\D/g, "");
      const telefoneFormatado = rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`;
      try {
        const res = await fetch(WEBHOOK_QUALIFICAR, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            telefone: telefoneFormatado, project_id: lead.project_id || "", chatId: "", contactId: "",
            nome: lead.nome || "", score: lead.score || "", valor_conta: lead.valor_conta || "",
            mensagem: comMensagem, closer_sm_id: vendor.sm_id, closer_krolik_id: vendor.krolik_id,
          }),
        });
        if (res.ok) success++;
      } catch {}
    }
    toast.success(`${success}/${leadsToSend.length} leads qualificados com sucesso`);
    setSelected(new Set());
    setBatchSending(false);
    setTimeout(() => refetch(), 2000);
  };

  const sendManual = async () => {
    const cleaned = manualPhone.replace(/\D/g, "");
    if (!cleaned || cleaned.length < 10) { toast.error("Informe um número válido com DDD"); return; }
    const telefoneFormatado = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    const vendor = resolveVendor(manualVendor);
    setManualSending(true);
    try {
      const res = await fetch(WEBHOOK_QUALIFICAR, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telefone: telefoneFormatado, project_id: "", chatId: "", contactId: "",
          nome: manualName.trim() || "", score: "", valor_conta: "",
          mensagem: comMensagem, closer_sm_id: vendor.sm_id, closer_krolik_id: vendor.krolik_id,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(`${telefoneFormatado} → ${vendor.nome} (qualificado)`);
      setManualPhone(""); setManualName("");
    } catch (err: any) { toast.error(`Erro: ${err.message}`); }
    finally { setManualSending(false); }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Target className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Qualificação de Leads
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">Selecione os leads e qualifique em lote</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => forceSync()} disabled={isFetching} className="shrink-0 gap-1.5">
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Users className="h-3.5 w-3.5" /> Total</div>
          <p className="text-2xl font-bold">{allLeads.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Ativos</div>
          <p className="text-2xl font-bold">{countAtivos}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><UserCheck className="h-3.5 w-3.5 text-green-500" /> Qualificados</div>
          <p className="text-2xl font-bold text-green-500">{countQualif}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Target className="h-3.5 w-3.5 text-destructive" /> Desqualificados</div>
          <p className="text-2xl font-bold">{countDesq}</p>
        </CardContent></Card>
      </div>

      {/* Krolic Members */}
      {krolicMembers.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
              <Shuffle className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">Vendedores Krolic ativos:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {krolicMembers.map((m) => (
                <Badge key={m.id} variant="secondary" className="text-[11px]">
                  <UserCheck className="h-3 w-3 mr-1" />{m.nome}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Qualificar */}
      <Card className="border-dashed border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Qualificar Manual
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Número (com DDD)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="5514996703996" value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} className="pl-9" disabled={manualSending} />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nome (opcional)</label>
              <Input placeholder="Nome do lead" value={manualName} onChange={(e) => setManualName(e.target.value)} disabled={manualSending} />
            </div>
            <div className="w-48 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Vendedor</label>
              <Select value={manualVendor} onValueChange={setManualVendor}>
                <SelectTrigger><Shuffle className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="roleta">🎰 Roleta</SelectItem>
                  {krolicMembers.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={sendManual} disabled={manualSending || !manualPhone.trim()} className="shrink-0 gap-1.5">
              {manualSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Qualificar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters + Batch Action Bar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, telefone ou cidade..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-44"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativos">Ativos</SelectItem>
                <SelectItem value="qualificados">Qualificados</SelectItem>
                <SelectItem value="desqualificados">Desqualificados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={etapaFilter} onValueChange={setEtapaFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Etapa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Etapas</SelectItem>
                {ETAPA_OPTIONS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Batch toolbar */}
          <div className="flex items-center gap-3 mt-3 p-2 rounded-lg bg-muted/30 border border-border/50">
            <Checkbox
              checked={filtered.length > 0 && selected.size === filtered.length}
              onCheckedChange={toggleAll}
              className="h-4 w-4"
            />
            <span className="text-xs text-muted-foreground">
              {selected.size > 0 ? `${selected.size} selecionado(s)` : `${filtered.length} leads`}
            </span>
            <div className="ml-auto flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox checked={comMensagem} onCheckedChange={(v) => setComMensagem(!!v)} className="h-3.5 w-3.5" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">Com mensagem</span>
              </label>
              <Select value={batchVendor} onValueChange={setBatchVendor}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <Shuffle className="h-3.5 w-3.5 mr-1.5" /><SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roleta">🎰 Roleta</SelectItem>
                  {krolicMembers.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                </SelectContent>
              </Select>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" disabled={selected.size === 0 || batchSending} className="gap-1.5">
                    {batchSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Qualificar ({selected.size})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar qualificação</AlertDialogTitle>
                    <AlertDialogDescription>
                      Deseja qualificar <strong>{selected.size}</strong> lead(s)?{comMensagem ? " Uma mensagem será enviada." : " Sem envio de mensagem."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={sendBatch}>Confirmar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum lead encontrado com os filtros aplicados.</p>
          ) : (
            <div className="space-y-1">
              {filtered.map((lead, idx) => {
                const key = lead.telefone || `lead-${idx}`;
                const isSelected = selected.has(key);
                const isDQ = lead._desqualificado;
                const isQF = lead._qualificado;

                return (
                  <div
                    key={key}
                    onClick={() => toggleSelect(key)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-muted/20 hover:bg-muted/40"
                    }`}
                  >
                    <Checkbox checked={isSelected} className="h-4 w-4 shrink-0" onCheckedChange={() => toggleSelect(key)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{lead.nome || "Sem nome"}</span>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${
                          lead._classificacao === "SOL SDR" ? "border-blue-500 text-blue-500 bg-blue-500/10" : "border-orange-500 text-orange-500 bg-orange-500/10"
                        }`}>
                          {lead._classificacao === "SOL SDR" ? "🤖 SOL" : "🔁 FUP FRIO"}
                        </Badge>
                        {isQF && <Badge variant="secondary" className="text-[10px] shrink-0 bg-primary/20 text-primary">QUALIFICADO</Badge>}
                        {isDQ && <Badge variant="destructive" className="text-[10px] shrink-0">DESQUALIFICADO</Badge>}
                        {lead.temperatura && (
                          <Badge variant="secondary" className={`text-[10px] shrink-0 ${
                            lead.temperatura === "QUENTE" ? "bg-destructive/20 text-destructive"
                            : lead.temperatura === "MORNO" ? "bg-accent/50 text-accent-foreground"
                            : "bg-primary/20 text-primary"
                          }`}>
                            <Thermometer className="h-3 w-3 mr-0.5" />{lead.temperatura}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.telefone}</span>
                        {lead.cidade && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.cidade}</span>}
                        {lead.score && <span>Score: {lead.score}</span>}
                        {(() => {
                          const dates = [lead.ts_ultimo_fup, lead.ts_ultima_interacao, lead.ts_cadastro].filter(Boolean);
                          const timestamps = dates.map(d => new Date(d!).getTime()).filter(t => !isNaN(t) && t > 0);
                          if (timestamps.length === 0) return null;
                          const latest = new Date(Math.max(...timestamps));
                          return <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{latest.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>;
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
