import { useState, useMemo, useEffect } from "react";
import { useMakeDataStore, MakeRecord } from "@/hooks/useMakeDataStore";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Search, Send, CheckCircle2, Loader2, Users, Filter,
  Phone, MapPin, Thermometer, Target, RefreshCw, XCircle, Shuffle, UserCheck, Clock,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const WEBHOOK_QUALIFICAR = "https://hook.us2.make.com/kg2hsdttkmvxq5j2tgeigu0kyv9ucyql";
const WEBHOOK_DESQUALIFICAR = "https://hook.us2.make.com/1rxirj4qss3mglk6lqcf1bswxyvkk3wq";

function classifyLead(r: MakeRecord): string {
  return (r.followupCount || 0) >= 1 ? "FUP FRIO" : "SOL SDR";
}

function isDesqualificado(r: MakeRecord): boolean {
  const status = (r.makeStatus || "").toUpperCase();
  const etapa = (r.etapaFunil || "").toUpperCase();
  const codigo = (r.codigoStatus || "").toUpperCase();
  return (
    status === "DESQUALIFICADO" ||
    status === "DECLINIO" ||
    status === "DECLÍNIO" ||
    status.includes("DECLINIO") ||
    status.includes("DECLÍNIO") ||
    etapa === "DESQUALIFICADO" ||
    etapa === "DECLINIO" ||
    etapa === "DECLÍNIO" ||
    codigo === "DESQUALIFICADO" ||
    codigo === "LEAD_FRIO"
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

export default function Qualificacao() {
  const { data: records, isLoading, isFetching, forceSync, refetch } = useMakeDataStore();
  const gf = useGlobalFilters();
  const [search, setSearch] = useState("");
  const [etapaFilter, setEtapaFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_OPTIONS[number]>("ativos");
  const [sendingMap, setSendingMap] = useState<Record<string, boolean>>({});
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [manualPhone, setManualPhone] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualSending, setManualSending] = useState(false);
  const [manualDesqPhone, setManualDesqPhone] = useState("");
  const [manualDesqName, setManualDesqName] = useState("");
  const [manualDesqSending, setManualDesqSending] = useState(false);

  const [krolicMembers, setKrolicMembers] = useState<KrolicMember[]>([]);
  const [vendorMap, setVendorMap] = useState<Record<string, string>>({});
  const [manualVendor, setManualVendor] = useState<string>("roleta");

  useEffect(() => {
    const fetchKrolic = async () => {
      const { data } = await supabase
        .from("time_comercial")
        .select("id, nome, sm_id, krolik_id")
        .eq("ativo", true)
        .eq("krolic", true);
      if (data) setKrolicMembers(data);
    };
    fetchKrolic();
  }, []);

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

  const isQualificado = (r: MakeRecord): boolean => {
    if (isDesqualificado(r)) return false;
    const status = (r.makeStatus || '').toUpperCase();
    const etapa = (r.etapaFunil || '').toUpperCase();
    const etapaSm = (r.etapaSm || '').toUpperCase();
    return (
      status === 'QUALIFICADO' ||
      status.includes('QUALIFICADO') ||
      etapa === 'QUALIFICADO' ||
      etapaSm.includes('QUALIFICADO')
    );
  };

  const allLeads = useMemo(() => {
    if (!records) return [];
    const roboStatuses = ['EM_QUALIFICACAO', 'AGUARDANDO_ACAO_MANUAL', 'NAO_RESPONDEU', 'NOVO', ''];
    
    // Apply global date filter
    const { from: effFrom, to: effTo } = gf.effectiveDateRange;
    
    return records
      .filter((r) => {
        // Date filter using data_envio (which uses data_entrada as primary)
        if (effFrom || effTo) {
          const dateStr = r.data_envio;
          if (!dateStr) return false; // No date = exclude when filtering by period
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return false;
          if (effFrom) {
            const fromStart = new Date(effFrom);
            fromStart.setHours(0, 0, 0, 0);
            if (d < fromStart) return false;
          }
          if (effTo) {
            const end = new Date(effTo);
            end.setHours(23, 59, 59, 999);
            if (d > end) return false;
          }
        }
        
        const status = (r.makeStatus || '').toUpperCase();
        const isRoboStage = !status || roboStatuses.includes(status) || status === 'WHATSAPP';
        return isRoboStage || status === 'QUALIFICADO' || isDesqualificado(r);
      })
      .map((r) => ({
        ...r,
        _classificacao: classifyLead(r),
        _desqualificado: isDesqualificado(r),
        _qualificado: isQualificado(r),
      }));
  }, [records, gf.effectiveDateRange]);

  const filtered = useMemo(() => {
    let result = allLeads;

    if (statusFilter === "ativos") {
      result = result.filter((r) => !r._desqualificado && !r._qualificado);
    } else if (statusFilter === "qualificados") {
      result = result.filter((r) => r._qualificado);
    } else if (statusFilter === "desqualificados") {
      result = result.filter((r) => r._desqualificado);
    }

    if (etapaFilter !== "all") {
      result = result.filter((r) => r._classificacao === etapaFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          (r.nome || "").toLowerCase().includes(q) ||
          (r.telefone || "").includes(q) ||
          (r.cidade || "").toLowerCase().includes(q)
      );
    }

    // Sort by most recent interaction first (like Krolic)
    result = [...result].sort((a, b) => {
      const getLatest = (r: typeof a) => {
        // Priority: last follow-up > last history entry > data_envio
        const dates = [
          r.lastFollowupDate,
          r.historico?.length ? r.historico[r.historico.length - 1]?.data : null,
          r.data_resposta,
          r.data_envio,
        ].filter(Boolean);
        const timestamps = dates.map(d => new Date(d!).getTime()).filter(t => !isNaN(t) && t > 0);
        return timestamps.length > 0 ? Math.max(...timestamps) : 0;
      };
      return getLatest(b) - getLatest(a);
    });

    return result;
  }, [allLeads, statusFilter, etapaFilter, search]);

  const countAtivos = useMemo(() => allLeads.filter((l) => !l._desqualificado && !l._qualificado).length, [allLeads]);
  const countQualif = useMemo(() => allLeads.filter((l) => l._qualificado).length, [allLeads]);
  const countDesq = useMemo(() => allLeads.filter((l) => l._desqualificado).length, [allLeads]);
  const countByEtapa = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of filtered) {
      map[l._classificacao] = (map[l._classificacao] || 0) + 1;
    }
    return map;
  }, [filtered]);

  const sendToWebhook = async (lead: MakeRecord & { _classificacao: string; _desqualificado: boolean; _qualificado: boolean }, webhookUrl: string, label: string) => {
    const key = `${lead.telefone}-${label}`;
    const vendorSelection = vendorMap[lead.telefone || ""] || "roleta";
    const vendor = resolveVendor(vendorSelection);

    setSendingMap((m) => ({ ...m, [key]: true }));
    try {
      const rawPhone = (lead.telefone || "").replace(/\D/g, "");
      const telefoneFormatado = rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`;
      const payload = {
        telefone: telefoneFormatado,
        nome: lead.nome || "",
        etapa_funil: lead.etapaFunil || "",
        cidade: lead.cidade || "",
        email: lead.email || "",
        valor_conta: lead.valorConta || "",
        score: lead.makeScore || "",
        temperatura: lead.makeTemperatura || "",
        canal_origem: lead.canalOrigem || "",
        vendedor: vendor.nome,
        vendedor_sm_id: vendor.sm_id,
        vendedor_krolik_id: vendor.krolik_id,
      };
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSentMap((m) => ({ ...m, [key]: true }));
      toast.success(`Lead ${lead.nome || lead.telefone} → ${vendor.nome} (${label.toLowerCase()})`);
      // Light refetch from DB (no cron-sync needed, webhook already updated Make DS)
      setTimeout(() => refetch(), 2000);
    } catch (err: any) {
      toast.error(`Erro ao enviar: ${err.message}`);
    } finally {
      setSendingMap((m) => ({ ...m, [key]: false }));
    }
  };

  const sendManual = async () => {
    const cleaned = manualPhone.replace(/\D/g, "");
    if (!cleaned || cleaned.length < 10) {
      toast.error("Informe um número válido com DDD (mínimo 10 dígitos)");
      return;
    }
    const telefoneFormatado = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    const vendor = resolveVendor(manualVendor);
    setManualSending(true);
    try {
      const payload = {
        telefone: telefoneFormatado,
        nome: manualName.trim() || "",
        etapa_funil: "MANUAL",
        cidade: "", email: "", valor_conta: "", score: "", temperatura: "",
        canal_origem: "manual",
        vendedor: vendor.nome,
        vendedor_sm_id: vendor.sm_id,
        vendedor_krolik_id: vendor.krolik_id,
      };
      const res = await fetch(WEBHOOK_QUALIFICAR, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(`${telefoneFormatado} → ${vendor.nome} (qualificado)`);
      setManualPhone("");
      setManualName("");
    } catch (err: any) {
      toast.error(`Erro ao enviar: ${err.message}`);
    } finally {
      setManualSending(false);
    }
  };

  const sendManualDesqualificar = async () => {
    const cleaned = manualDesqPhone.replace(/\D/g, "");
    if (!cleaned || cleaned.length < 10) {
      toast.error("Informe um número válido com DDD (mínimo 10 dígitos)");
      return;
    }
    const telefoneFormatado = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    setManualDesqSending(true);
    try {
      const payload = {
        telefone: telefoneFormatado,
        nome: manualDesqName.trim() || "",
        etapa_funil: "MANUAL",
        cidade: "", email: "", valor_conta: "", score: "", temperatura: "",
        canal_origem: "manual",
        vendedor: "", vendedor_sm_id: null, vendedor_krolik_id: null,
      };
      const res = await fetch(WEBHOOK_DESQUALIFICAR, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(`${telefoneFormatado} desqualificado com sucesso`);
      setManualDesqPhone("");
      setManualDesqName("");
    } catch (err: any) {
      toast.error(`Erro ao desqualificar: ${err.message}`);
    } finally {
      setManualDesqSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
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
          <p className="text-xs md:text-sm text-muted-foreground">
            Qualifique ou desqualifique leads via Make.com
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => forceSync()}
          disabled={isFetching}
          className="shrink-0 gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="h-3.5 w-3.5" /> Total
            </div>
            <p className="text-2xl font-bold">{allLeads.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Ativos
            </div>
            <p className="text-2xl font-bold">{countAtivos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <UserCheck className="h-3.5 w-3.5 text-green-500" /> Qualificados
            </div>
            <p className="text-2xl font-bold text-green-500">{countQualif}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <XCircle className="h-3.5 w-3.5 text-destructive" /> Desqualificados
            </div>
            <p className="text-2xl font-bold">{countDesq}</p>
          </CardContent>
        </Card>
        {Object.entries(countByEtapa).map(([etapa, count]) => (
          <Card key={etapa}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">{etapa}</div>
              <p className="text-2xl font-bold">{count}</p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Send className="h-3.5 w-3.5 text-primary" /> Enviados
            </div>
            <p className="text-2xl font-bold text-primary">
              {Object.values(sentMap).filter(Boolean).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Krolic Members */}
      {krolicMembers.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
              <Shuffle className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">Vendedores Krolic ativos na roleta:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {krolicMembers.map((m) => (
                <Badge key={m.id} variant="secondary" className="text-[11px]">
                  <UserCheck className="h-3 w-3 mr-1" />
                  {m.nome}
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
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            Qualificar Manual
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
                <SelectTrigger>
                  <Shuffle className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roleta">🎰 Roleta</SelectItem>
                  {krolicMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={sendManual} disabled={manualSending || !manualPhone.trim()} className="shrink-0 gap-1.5">
              {manualSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Qualificar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual Desqualificar */}
      <Card className="border-dashed border-destructive/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
            <XCircle className="h-3.5 w-3.5 text-destructive" />
            Desqualificar Manual
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Número (com DDD)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="5514996703996" value={manualDesqPhone} onChange={(e) => setManualDesqPhone(e.target.value)} className="pl-9" disabled={manualDesqSending} />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nome (opcional)</label>
              <Input placeholder="Nome do lead" value={manualDesqName} onChange={(e) => setManualDesqName(e.target.value)} disabled={manualDesqSending} />
            </div>
            <Button onClick={sendManualDesqualificar} disabled={manualDesqSending || !manualDesqPhone.trim()} className="shrink-0 gap-1.5" variant="destructive">
              {manualDesqSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Desqualificar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters + Lead List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone ou cidade..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-44">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativos">Ativos</SelectItem>
                <SelectItem value="qualificados">Qualificados</SelectItem>
                <SelectItem value="desqualificados">Desqualificados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={etapaFilter} onValueChange={setEtapaFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Etapas</SelectItem>
                {ETAPA_OPTIONS.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{filtered.length} leads</p>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum lead encontrado com os filtros aplicados.
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((lead, idx) => {
                const key = lead.telefone || `lead-${idx}`;
                const selectedVendor = vendorMap[key] || "roleta";
                const isDQ = lead._desqualificado;
                const isQF = lead._qualificado;

                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          {lead.nome || "Sem nome"}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] shrink-0 ${
                            lead._classificacao === "SOL SDR"
                              ? "border-blue-500 text-blue-500 bg-blue-500/10"
                              : "border-orange-500 text-orange-500 bg-orange-500/10"
                          }`}
                        >
                          {lead._classificacao === "SOL SDR" ? "🤖 SOL" : "🔁 FUP FRIO"}
                        </Badge>
                        {isQF && (
                          <Badge variant="secondary" className="text-[10px] shrink-0 bg-primary/20 text-primary">
                            QUALIFICADO
                          </Badge>
                        )}
                        {isDQ && (
                          <Badge variant="destructive" className="text-[10px] shrink-0">
                            DESQUALIFICADO
                          </Badge>
                        )}
                        {lead.makeTemperatura && (
                          <Badge
                            variant="secondary"
                            className={`text-[10px] shrink-0 ${
                              lead.makeTemperatura === "QUENTE"
                                ? "bg-destructive/20 text-destructive"
                                : lead.makeTemperatura === "MORNO"
                                ? "bg-accent/50 text-accent-foreground"
                                : "bg-primary/20 text-primary"
                            }`}
                          >
                            <Thermometer className="h-3 w-3 mr-0.5" />
                            {lead.makeTemperatura}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.telefone}
                        </span>
                        {lead.cidade && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {lead.cidade}
                          </span>
                        )}
                        {lead.makeScore && <span>Score: {lead.makeScore}</span>}
                        {(() => {
                          const dates = [
                            lead.lastFollowupDate,
                            lead.historico?.length ? lead.historico[lead.historico.length - 1]?.data : null,
                            lead.data_resposta,
                            lead.data_envio,
                          ].filter(Boolean);
                          const timestamps = dates.map(d => new Date(d!).getTime()).filter(t => !isNaN(t) && t > 0);
                          if (timestamps.length === 0) return null;
                          const latest = new Date(Math.max(...timestamps));
                          const formatted = latest.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                          return (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatted}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <Select
                      value={selectedVendor}
                      onValueChange={(v) => setVendorMap((m) => ({ ...m, [key]: v }))}
                    >
                      <SelectTrigger className="w-40 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="roleta">🎰 Roleta</SelectItem>
                        {krolicMembers.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex gap-1.5 shrink-0">
                      {!isDQ && (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={!!sendingMap[`${key}-Desqualificar`]}
                          onClick={() => sendToWebhook(lead, WEBHOOK_DESQUALIFICAR, "Desqualificar")}
                          className="gap-1"
                        >
                          {sendingMap[`${key}-Desqualificar`] ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          Desqualificar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={sentMap[`${key}-Qualificar`] ? "outline" : "default"}
                        disabled={!!sendingMap[`${key}-Qualificar`]}
                        onClick={() => sendToWebhook(lead, WEBHOOK_QUALIFICAR, "Qualificar")}
                        className="gap-1"
                      >
                        {sendingMap[`${key}-Qualificar`] ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        {isDQ ? "Re-qualificar" : "Qualificar"}
                      </Button>
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
