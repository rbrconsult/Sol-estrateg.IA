import { useState, useMemo, useEffect } from "react";
import { useMakeDataStore, MakeRecord } from "@/hooks/useMakeDataStore";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Search, Send, CheckCircle2, Loader2, Users, Filter,
  Phone, MapPin, Thermometer, Target, RefreshCw, XCircle, Shuffle, UserCheck,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const WEBHOOK_QUALIFICAR = "https://hook.us2.make.com/kg2hsdttkmvxq5j2tgeigu0kyv9ucyql";
const WEBHOOK_DESQUALIFICAR = "https://hook.us2.make.com/1rxirj4qss3mglk6lqcf1bswxyvkk3wq";

function classifyLead(r: MakeRecord): string {
  return (r.followupCount || 0) >= 1 ? "FUP FRIO" : "SOL SDR";
}

const ETAPAS_QUALIFICAVEIS = ["SOL SDR", "FUP FRIO"];

type ViewMode = "qualificar" | "desqualificar";

interface KrolicMember {
  id: string;
  nome: string;
  sm_id: number | null;
  krolik_id: string | null;
}

export default function Qualificacao() {
  const { data: records, isLoading, refetch, isFetching } = useMakeDataStore();
  const [search, setSearch] = useState("");
  const [etapaFilter, setEtapaFilter] = useState<string>("all");
  const [sendingMap, setSendingMap] = useState<Record<string, boolean>>({});
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [manualPhone, setManualPhone] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualSending, setManualSending] = useState(false);
  const [manualDesqPhone, setManualDesqPhone] = useState("");
  const [manualDesqName, setManualDesqName] = useState("");
  const [manualDesqSending, setManualDesqSending] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("qualificar");

  // Krolic members
  const [krolicMembers, setKrolicMembers] = useState<KrolicMember[]>([]);
  // Per-lead vendor selection: key = lead phone, value = member id or "roleta"
  const [vendorMap, setVendorMap] = useState<Record<string, string>>({});
  // Global vendor for manual send
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

  const resolveVendor = (selectedValue: string): { nome: string; sm_id: number | null; krolik_id: string | null } => {
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

  const leadsAtivos = useMemo(() => {
    if (!records) return [];
    return records
      .filter((r) => (r.makeStatus || "").toUpperCase() !== "DESQUALIFICADO")
      .map((r) => ({ ...r, _classificacao: classifyLead(r) }));
  }, [records]);

  const leadsDesqualificados = useMemo(() => {
    if (!records) return [];
    return records
      .filter((r) => (r.makeStatus || "").toUpperCase() === "DESQUALIFICADO")
      .map((r) => ({ ...r, _classificacao: classifyLead(r) }));
  }, [records]);

  const leads = viewMode === "qualificar" ? leadsAtivos : leadsDesqualificados;

  const filtered = useMemo(() => {
    let result = leads;
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
    result = [...result].sort((a, b) => {
      const getLatest = (r: typeof a) => {
        const lastHist = r.historico?.length ? r.historico[r.historico.length - 1]?.data : null;
        const candidate = lastHist || r.lastFollowupDate || r.data_envio || '';
        return new Date(candidate).getTime() || 0;
      };
      return getLatest(b) - getLatest(a);
    });
    return result;
  }, [leads, etapaFilter, search]);

  const actionLabel = viewMode === "qualificar" ? "Qualificar" : "Re-qualificar";

  const sendToWebhookWithUrl = async (lead: MakeRecord & { _classificacao: string }, webhookUrl: string, label: string) => {
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
    } catch (err: any) {
      toast.error(`Erro ao enviar: ${err.message}`);
    } finally {
      setSendingMap((m) => ({ ...m, [key]: false }));
    }
  };

  const webhookUrl = viewMode === "qualificar" ? WEBHOOK_QUALIFICAR : WEBHOOK_DESQUALIFICAR;

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
        cidade: "",
        email: "",
        valor_conta: "",
        score: "",
        temperatura: "",
        canal_origem: "manual",
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
      toast.success(`${telefoneFormatado} → ${vendor.nome} (${actionLabel.toLowerCase()})`);
      setManualPhone("");
      setManualName("");
    } catch (err: any) {
      toast.error(`Erro ao enviar: ${err.message}`);
    } finally {
      setManualSending(false);
    }
  };

  const countByEtapa = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of leads) {
      map[l._classificacao] = (map[l._classificacao] || 0) + 1;
    }
    return map;
  }, [leads]);

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
          onClick={() => refetch()}
          disabled={isFetching}
          className="shrink-0 gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => { setViewMode(v as ViewMode); setSentMap({}); }}>
        <TabsList>
          <TabsTrigger value="qualificar" className="gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            Qualificar ({leadsAtivos.length})
          </TabsTrigger>
          <TabsTrigger value="desqualificar" className="gap-1.5">
            <XCircle className="h-4 w-4" />
            Desqualificados ({leadsDesqualificados.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="h-3.5 w-3.5" /> Total
            </div>
            <p className="text-2xl font-bold">{leads.length}</p>
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
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Enviados
            </div>
            <p className="text-2xl font-bold text-green-500">
              {Object.values(sentMap).filter(Boolean).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Krolic Members Info */}
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

      {/* Filters */}
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
        <Select value={etapaFilter} onValueChange={setEtapaFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Etapas</SelectItem>
            {ETAPAS_QUALIFICAVEIS.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Envio Manual - Qualificar */}
      <Card className="border-dashed border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            Qualificar Manual
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Número (com DDD)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="5514996703996"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="pl-9"
                  disabled={manualSending}
                />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nome (opcional)</label>
              <Input
                placeholder="Nome do lead"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                disabled={manualSending}
              />
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
            <Button
              onClick={sendManual}
              disabled={manualSending || !manualPhone.trim()}
              className="shrink-0 gap-1.5"
            >
              {manualSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Qualificar Manual
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Envio Manual - Desqualificar */}
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
                <Input
                  placeholder="5514996703996"
                  value={manualDesqPhone}
                  onChange={(e) => setManualDesqPhone(e.target.value)}
                  className="pl-9"
                  disabled={manualDesqSending}
                />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nome (opcional)</label>
              <Input
                placeholder="Nome do lead"
                value={manualDesqName}
                onChange={(e) => setManualDesqName(e.target.value)}
                disabled={manualDesqSending}
              />
            </div>
            <Button
              onClick={sendManualDesqualificar}
              disabled={manualDesqSending || !manualDesqPhone.trim()}
              className="shrink-0 gap-1.5"
              variant="destructive"
            >
              {manualDesqSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Desqualificar Manual
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lead List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {filtered.length} leads {viewMode === "qualificar" ? "para qualificação" : "desqualificados"}
          </CardTitle>
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
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {lead._classificacao}
                        </Badge>
                        {viewMode === "desqualificar" && (
                          <Badge variant="destructive" className="text-[10px] shrink-0">
                            DESQUALIFICADO
                          </Badge>
                        )}
                        {lead.makeTemperatura && (
                          <Badge
                            variant="secondary"
                            className={`text-[10px] shrink-0 ${
                              lead.makeTemperatura === "QUENTE"
                                ? "bg-red-500/20 text-red-400"
                                : lead.makeTemperatura === "MORNO"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-blue-500/20 text-blue-400"
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
                        {lead.makeScore && (
                          <span>Score: {lead.makeScore}</span>
                        )}
                      </div>
                    </div>

                    {/* Vendor selector per lead */}
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
                      {viewMode === "qualificar" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={!!sendingMap[`${key}-Desqualificar`]}
                          onClick={() => sendToWebhookWithUrl(lead, WEBHOOK_DESQUALIFICAR, "Desqualificar")}
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
                        variant={sentMap[`${key}-${actionLabel}`] ? "outline" : "default"}
                        disabled={!!sendingMap[`${key}-${actionLabel}`]}
                        onClick={() => sendToWebhookWithUrl(lead, viewMode === "qualificar" ? WEBHOOK_QUALIFICAR : WEBHOOK_QUALIFICAR, actionLabel)}
                        className="gap-1"
                      >
                        {sendingMap[`${key}-${actionLabel}`] ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        {actionLabel}
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
