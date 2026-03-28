import { useState, useMemo, useEffect } from "react";
import { useMakeDataStore, MakeRecord } from "@/hooks/useMakeDataStore";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Search, Loader2, Users, Filter,
  Phone, MapPin, Thermometer, RefreshCw, XCircle, Clock,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const WEBHOOK_DESQUALIFICAR = "https://hook.us2.make.com/1rxirj4qss3mglk6lqcf1bswxyvkk3wq";

const isDesqualificado = (r: MakeRecord): boolean => {
  const status = (r.makeStatus || "").toUpperCase();
  const etapa = (r.etapaFunil || "").toUpperCase();
  const cod = ((r as any).codigoStatus || "").toUpperCase();
  return (
    status.includes("DESQUALIFICADO") ||
    status.includes("DECLINIO") ||
    status.includes("DECLÍNIO") ||
    status.includes("LEAD_FRIO") ||
    etapa.includes("DESQUALIFICADO") ||
    cod.includes("DESQUALIFICADO")
  );
};

export default function Desqualificar() {
  const { data: records, isLoading, isFetching, forceSync, refetch } = useMakeDataStore();
  const gf = useGlobalFilters();
  const { selectedOrgId, orgs } = useOrgFilter();
  const [search, setSearch] = useState("");
  const [sendingMap, setSendingMap] = useState<Record<string, boolean>>({});
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [manualDesqPhone, setManualDesqPhone] = useState("");
  const [manualDesqName, setManualDesqName] = useState("");
  const [manualDesqSending, setManualDesqSending] = useState(false);

  const allLeads = useMemo(() => {
    if (!records) return [];
    return records
      .filter((r) => {
        if (!gf.dateRange?.from || !gf.dateRange?.to) return true;
        const d = new Date(r.dataEntrada || r.created_at || "");
        return d >= gf.dateRange.from && d <= gf.dateRange.to;
      })
      .map((r) => ({
        ...r,
        _desqualificado: isDesqualificado(r),
      }));
  }, [records, gf.dateRange]);

  const filtered = useMemo(() => {
    let list = allLeads;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          (l.nome || "").toLowerCase().includes(q) ||
          (l.telefone || "").includes(q) ||
          (l.cidade || "").toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => {
      // Show non-disqualified first (candidates for disqualification)
      if (a._desqualificado !== b._desqualificado) return a._desqualificado ? 1 : -1;
      return 0;
    });
  }, [allLeads, search]);

  const countDesq = useMemo(() => allLeads.filter((l) => l._desqualificado).length, [allLeads]);
  const countAtivos = allLeads.length - countDesq;

  const sendToWebhook = async (lead: MakeRecord & { _desqualificado: boolean }) => {
    const key = lead.telefone || "";
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
        vendedor: "",
        vendedor_sm_id: null,
        vendedor_krolik_id: null,
      };
      const res = await fetch(WEBHOOK_DESQUALIFICAR, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSentMap((m) => ({ ...m, [key]: true }));
      toast.success(`${lead.nome || lead.telefone} desqualificado`);
      setTimeout(() => refetch(), 2000);
    } catch (err: any) {
      toast.error(`Erro ao desqualificar: ${err.message}`);
    } finally {
      setSendingMap((m) => ({ ...m, [key]: false }));
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
            <XCircle className="h-5 w-5 md:h-6 md:w-6 text-destructive" />
            Desqualificar Leads
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Desqualifique leads manualmente ou pela lista
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
              <Users className="h-3.5 w-3.5 text-primary" /> Ativos
            </div>
            <p className="text-2xl font-bold">{countAtivos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <XCircle className="h-3.5 w-3.5 text-destructive" /> Desqualificados
            </div>
            <p className="text-2xl font-bold text-destructive">{countDesq}</p>
          </CardContent>
        </Card>
      </div>

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

      {/* Lead List */}
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
          </div>
          <p className="text-sm text-muted-foreground mt-2">{filtered.length} leads</p>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum lead encontrado.
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((lead, idx) => {
                const key = lead.telefone || `lead-${idx}`;
                const isDQ = lead._desqualificado;

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
                      </div>
                    </div>

                    {!isDQ && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={!!sendingMap[key]}
                        onClick={() => sendToWebhook(lead)}
                        className="gap-1 shrink-0"
                      >
                        {sendingMap[key] ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        Desqualificar
                      </Button>
                    )}
                    {isDQ && (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Já desqualificado
                      </Badge>
                    )}
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
