import { useState, useMemo } from "react";
import { useMakeDataStore, MakeRecord } from "@/hooks/useMakeDataStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  RotateCcw, Send, Loader2, CheckCircle2, Search, Phone,
  MapPin, Thermometer, RefreshCw, Users, Filter,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const WEBHOOK_URL = "https://hook.us2.make.com/wkesyljs4735mb4vwoo5v033ni9eirho";

function isDesqualificado(r: MakeRecord): boolean {
  const status = (r.makeStatus || "").toUpperCase();
  const etapa = (r.etapaFunil || "").toUpperCase();
  const codigo = (r.codigoStatus || "").toUpperCase();
  return (
    status === "DESQUALIFICADO" ||
    etapa === "DESQUALIFICADO" ||
    etapa === "DECLINIO" ||
    etapa === "DECLÍNIO" ||
    codigo === "DESQUALIFICADO" ||
    codigo === "LEAD_FRIO"
  );
}

function isQualificado(r: MakeRecord): boolean {
  const status = (r.makeStatus || "").toUpperCase();
  const etapa = (r.etapaFunil || "").toUpperCase();
  return status === "QUALIFICADO" || etapa === "QUALIFICADO";
}

const STATUS_OPTIONS = ["all", "ativos", "qualificados", "desqualificados"] as const;

export default function Reprocessamento() {
  const { data: records, isLoading, refetch, isFetching, forceSync } = useMakeDataStore();
  const [numero, setNumero] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_OPTIONS[number]>("ativos");
  const [sendingMap, setSendingMap] = useState<Record<string, boolean>>({});
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  const leads = useMemo(() => {
    if (!records) return [];
    let result = [...records];

    // Status filter
    if (statusFilter === "ativos") {
      result = result.filter(r => !isDesqualificado(r) && !isQualificado(r));
    } else if (statusFilter === "qualificados") {
      result = result.filter(r => isQualificado(r));
    } else if (statusFilter === "desqualificados") {
      result = result.filter(r => isDesqualificado(r));
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
    result.sort((a, b) => {
      const getLatest = (r: MakeRecord) => {
        const lastHist = r.historico?.length ? r.historico[r.historico.length - 1]?.data : null;
        const candidate = lastHist || r.lastFollowupDate || r.data_envio || '';
        return new Date(candidate).getTime() || 0;
      };
      return getLatest(b) - getLatest(a);
    });
    return result;
  }, [records, search, statusFilter]);

  const sendToWebhook = async (phone: string, name?: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (!cleaned || cleaned.length < 10) {
      toast.error("Número inválido");
      return;
    }
    const formatted = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    const key = phone;
    setSendingMap((m) => ({ ...m, [key]: true }));
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: formatted }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSentMap((m) => ({ ...m, [key]: true }));
      toast.success(`Reprocessamento enviado para ${name || formatted}`);
    } catch (err: any) {
      toast.error(`Erro ao enviar: ${err.message}`);
    } finally {
      setSendingMap((m) => ({ ...m, [key]: false }));
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = numero.replace(/\D/g, "");
    if (!cleaned || cleaned.length < 10) {
      toast.error("Informe um número válido com DDD (mínimo 10 dígitos)");
      return;
    }
    setLoading(true);
    const formatted = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: formatted }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(`Reprocessamento enviado para ${formatted}`);
      setNumero("");
    } catch (err: any) {
      toast.error(`Erro ao enviar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24" />
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
            <RotateCcw className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Reprocessamento
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Reprocesse leads via webhook Make.com
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

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="h-3.5 w-3.5" /> Total Leads
            </div>
            <p className="text-2xl font-bold">{leads.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Enviados
            </div>
            <p className="text-2xl font-bold text-primary">
              {Object.values(sentMap).filter(Boolean).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Manual send */}
      <Card className="border-dashed border-primary/30">
        <CardContent className="p-4">
          <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Número (com DDD)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="5514996703996"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="pl-9"
                  disabled={loading}
                />
              </div>
            </div>
            <Button type="submit" disabled={loading || !numero.trim()} className="shrink-0 gap-1.5">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Reprocessar Manual
            </Button>
          </form>
        </CardContent>
      </Card>

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
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof STATUS_OPTIONS[number])}>
          <SelectTrigger className="w-[180px] shrink-0">
            <Filter className="h-4 w-4 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ativos">Ativos</SelectItem>
            <SelectItem value="qualificados">Qualificados</SelectItem>
            <SelectItem value="desqualificados">Desqualificados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lead List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{leads.length} leads disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum lead encontrado.
            </p>
          ) : (
            <div className="space-y-2">
              {leads.map((lead, idx) => {
                const key = lead.telefone || `lead-${idx}`;
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
                        {lead.makeStatus && (
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {lead.makeStatus}
                          </Badge>
                        )}
                        {lead.makeTemperatura && (
                          <Badge
                            variant="secondary"
                            className={`text-[10px] shrink-0 ${
                              lead.makeTemperatura === "QUENTE"
                                ? "bg-destructive/20 text-destructive"
                                : lead.makeTemperatura === "MORNO"
                                ? "bg-accent/60 text-accent-foreground"
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
                    <Button
                      size="sm"
                      variant={sentMap[key] ? "outline" : "default"}
                      disabled={!!sendingMap[key]}
                      onClick={() => sendToWebhook(lead.telefone, lead.nome)}
                      className="shrink-0 gap-1"
                    >
                      {sendingMap[key] ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : sentMap[key] ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      {sentMap[key] ? "Enviado" : "Reprocessar"}
                    </Button>
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
