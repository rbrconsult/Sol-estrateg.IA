import { useState, useMemo } from "react";
import { useMakeDataStore, MakeRecord } from "@/hooks/useMakeDataStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
  return status === "DESQUALIFICADO" || etapa === "DESQUALIFICADO" || etapa === "DECLINIO" || etapa === "DECLÍNIO" || codigo === "DESQUALIFICADO" || codigo === "LEAD_FRIO";
}

function isQualificado(r: MakeRecord): boolean {
  const status = (r.makeStatus || "").toUpperCase();
  const etapa = (r.etapaFunil || "").toUpperCase();
  return status === "QUALIFICADO" || etapa === "QUALIFICADO";
}

const STATUS_OPTIONS = ["all", "ativos", "qualificados", "desqualificados"] as const;

export default function Reprocessamento() {
  const { data: records, isLoading, isFetching, forceSync } = useMakeDataStore();
  const [numero, setNumero] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_OPTIONS[number]>("ativos");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchSending, setBatchSending] = useState(false);
  const [sentSet, setSentSet] = useState<Set<string>>(new Set());

  const leads = useMemo(() => {
    if (!records) return [];
    let result = [...records];
    if (statusFilter === "ativos") result = result.filter(r => !isDesqualificado(r) && !isQualificado(r));
    else if (statusFilter === "qualificados") result = result.filter(r => isQualificado(r));
    else if (statusFilter === "desqualificados") result = result.filter(r => isDesqualificado(r));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) =>
        (r.nome || "").toLowerCase().includes(q) || (r.telefone || "").includes(q) || (r.cidade || "").toLowerCase().includes(q)
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

  const toggleSelect = (key: string) => {
    setSelected((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  };
  const toggleAll = () => {
    if (selected.size === leads.length) setSelected(new Set());
    else setSelected(new Set(leads.map((l) => l.telefone || "")));
  };

  const sendBatch = async () => {
    if (selected.size === 0) return;
    setBatchSending(true);
    const toSend = leads.filter((l) => selected.has(l.telefone || ""));
    let success = 0;
    for (const lead of toSend) {
      const cleaned = (lead.telefone || "").replace(/\D/g, "");
      const formatted = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
      try {
        const res = await fetch(WEBHOOK_URL, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ numero: formatted }),
        });
        if (res.ok) { success++; setSentSet((s) => new Set(s).add(lead.telefone || "")); }
      } catch {}
    }
    toast.success(`${success}/${toSend.length} leads reprocessados`);
    setSelected(new Set());
    setBatchSending(false);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = numero.replace(/\D/g, "");
    if (!cleaned || cleaned.length < 10) { toast.error("Informe um número válido com DDD"); return; }
    setLoading(true);
    const formatted = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: formatted }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(`Reprocessamento enviado para ${formatted}`);
      setNumero("");
    } catch (err: any) { toast.error(`Erro: ${err.message}`); }
    finally { setLoading(false); }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-64" /><Skeleton className="h-24" /><Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <RotateCcw className="h-5 w-5 md:h-6 md:w-6 text-primary" /> Reprocessamento
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">Selecione os leads e reprocesse em lote</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => forceSync()} disabled={isFetching} className="shrink-0 gap-1.5">
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Users className="h-3.5 w-3.5" /> Total</div>
          <p className="text-2xl font-bold">{leads.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Enviados</div>
          <p className="text-2xl font-bold text-primary">{sentSet.size}</p>
        </CardContent></Card>
      </div>

      {/* Manual */}
      <Card className="border-dashed border-primary/30">
        <CardContent className="p-4">
          <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Número (com DDD)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="5514996703996" value={numero} onChange={(e) => setNumero(e.target.value)} className="pl-9" disabled={loading} />
              </div>
            </div>
            <Button type="submit" disabled={loading || !numero.trim()} className="shrink-0 gap-1.5">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Reprocessar Manual
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Filters + batch */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, telefone ou cidade..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof STATUS_OPTIONS[number])}>
              <SelectTrigger className="w-[180px] shrink-0">
                <Filter className="h-4 w-4 mr-1.5 text-muted-foreground" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativos">Ativos</SelectItem>
                <SelectItem value="qualificados">Qualificados</SelectItem>
                <SelectItem value="desqualificados">Desqualificados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Batch toolbar */}
          <div className="flex items-center gap-3 mt-3 p-2 rounded-lg bg-muted/30 border border-border/50">
            <Checkbox checked={leads.length > 0 && selected.size === leads.length} onCheckedChange={toggleAll} className="h-4 w-4" />
            <span className="text-xs text-muted-foreground">
              {selected.size > 0 ? `${selected.size} selecionado(s)` : `${leads.length} leads`}
            </span>
            <div className="ml-auto">
              <Button
                size="sm"
                disabled={selected.size === 0 || batchSending}
                onClick={sendBatch}
                className="gap-1.5"
              >
                {batchSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                Reprocessar ({selected.size})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum lead encontrado.</p>
          ) : (
            <div className="space-y-1">
              {leads.map((lead, idx) => {
                const key = lead.telefone || `lead-${idx}`;
                const isSelected = selected.has(key);
                const wasSent = sentSet.has(key);
                return (
                  <div
                    key={key}
                    onClick={() => toggleSelect(key)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      isSelected ? "border-primary/50 bg-primary/5"
                      : wasSent ? "border-green-500/30 bg-green-500/5"
                      : "border-border bg-muted/20 hover:bg-muted/40"
                    }`}
                  >
                    <Checkbox checked={isSelected} className="h-4 w-4 shrink-0" onCheckedChange={() => toggleSelect(key)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{lead.nome || "Sem nome"}</span>
                        {lead.makeStatus && <Badge variant="outline" className="text-[10px] shrink-0">{lead.makeStatus}</Badge>}
                        {wasSent && <Badge variant="secondary" className="text-[10px] shrink-0 bg-green-500/20 text-green-600">✓ Enviado</Badge>}
                        {lead.makeTemperatura && (
                          <Badge variant="secondary" className={`text-[10px] shrink-0 ${
                            lead.makeTemperatura === "QUENTE" ? "bg-destructive/20 text-destructive"
                            : lead.makeTemperatura === "MORNO" ? "bg-accent/60 text-accent-foreground"
                            : "bg-primary/20 text-primary"
                          }`}>
                            <Thermometer className="h-3 w-3 mr-0.5" />{lead.makeTemperatura}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.telefone}</span>
                        {lead.cidade && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.cidade}</span>}
                        {lead.makeScore && <span>Score: {lead.makeScore}</span>}
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
