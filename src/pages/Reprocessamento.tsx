import { useState, useMemo } from "react";
import { useSolLeads, normalizePhone, type SolLead } from '@/hooks/useSolData';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  RotateCcw, Send, Loader2, CheckCircle2, Search, Phone, Clock,
  MapPin, Thermometer, Users, Filter,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const WEBHOOK_URL = "https://hook.us2.make.com/m6zaweontguh6vqsfvid3g73bxb1qg44";

function classifyLead(r: SolLead): string {
  return (r.fup_followup_count || 0) >= 1 ? "FUP FRIO" : "SOL SDR";
}

const ETAPA_OPTIONS = ["SOL SDR", "FUP FRIO"];
const STATUS_OPTIONS = ["all", "ativos"] as const;

export default function Reprocessamento() {
  const { data: solLeads, isLoading, isFetching } = useSolLeads();
  
  const [numero, setNumero] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_OPTIONS[number]>("ativos");
  const [etapaFilter, setEtapaFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchSending, setBatchSending] = useState(false);
  const [sentSet, setSentSet] = useState<Set<string>>(new Set());

  const ALLOWED_ETAPAS = ['TRAFEGO PAGO', 'SOL SDR', 'FOLLOW UP'];

  const allLeads = useMemo(() => {
    if (!solLeads?.length) return [];
    return solLeads
      .filter((r) => {
        const status = (r.status || '').toUpperCase().trim();
        if (status && status !== 'ABERTO') return false;
        const etapa = (r.etapa_funil || '').toUpperCase().trim();
        if (!ALLOWED_ETAPAS.includes(etapa)) return false;
        return true;
      })
      .map((r) => ({
        ...r,
        _classificacao: classifyLead(r),
      }));
  }, [solLeads]);

  const filtered = useMemo(() => {
    let result = allLeads;
    if (etapaFilter !== "all") result = result.filter((r) => r._classificacao === etapaFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) =>
        (r.nome || "").toLowerCase().includes(q) || (r.telefone || "").includes(q) || (r.cidade || "").toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => {
      const getLatest = (r: typeof a) => {
        const dates = [r.ts_ultimo_fup, r.ts_ultima_interacao, r.ts_cadastro].filter(Boolean);
        const timestamps = dates.map(d => new Date(d!).getTime()).filter(t => !isNaN(t) && t > 0);
        return timestamps.length > 0 ? Math.max(...timestamps) : 0;
      };
      return getLatest(b) - getLatest(a);
    });
  }, [allLeads, etapaFilter, search]);

  const toggleSelect = (key: string) => {
    setSelected((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((l) => l.telefone || "")));
  };

  const sendBatch = async () => {
    if (selected.size === 0) return;
    setBatchSending(true);
    const toSend = filtered.filter((l) => selected.has(l.telefone || ""));
    let success = 0;
    for (const lead of toSend) {
      const cleaned = (lead.telefone || "").replace(/\D/g, "");
      const formatted = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
      try {
        const res = await fetch(WEBHOOK_URL, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telefone: formatted }),
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
        body: JSON.stringify({ telefone: formatted }),
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
            <RotateCcw className="h-5 w-5 md:h-6 md:w-6 text-primary" /> Reprocessamento
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">Selecione os leads e reprocesse em lote</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Users className="h-3.5 w-3.5" /> Total</div>
          <p className="text-2xl font-bold">{allLeads.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Users className="h-3.5 w-3.5 text-primary" /> Filtrados</div>
          <p className="text-2xl font-bold">{filtered.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Enviados</div>
          <p className="text-2xl font-bold text-green-500">{sentSet.size}</p>
        </CardContent></Card>
      </div>

      {/* Manual */}
      <Card className="border-dashed border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
            <RotateCcw className="h-3.5 w-3.5 text-primary" /> Reprocessar Manual
          </div>
          <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Número (com DDD)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="5514996703996" value={numero} onChange={(e) => setNumero(e.target.value)} className="pl-9" disabled={loading} />
              </div>
            </div>
            <Button type="submit" disabled={loading || !numero.trim()} className="shrink-0 gap-1.5">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Reprocessar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Filters + Batch */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, telefone ou cidade..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={etapaFilter} onValueChange={setEtapaFilter}>
              <SelectTrigger className="w-44"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Etapa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Etapas</SelectItem>
                {ETAPA_OPTIONS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Batch toolbar */}
          <div className="flex items-center gap-3 mt-3 p-2 rounded-lg bg-muted/30 border border-border/50">
            <Checkbox checked={filtered.length > 0 && selected.size === filtered.length} onCheckedChange={toggleAll} className="h-4 w-4" />
            <span className="text-xs text-muted-foreground">
              {selected.size > 0 ? `${selected.size} selecionado(s)` : `${filtered.length} leads`}
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
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum lead encontrado com os filtros aplicados.</p>
          ) : (
            <div className="space-y-1">
              {filtered.map((lead, idx) => {
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
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${
                          lead._classificacao === "SOL SDR" ? "border-blue-500 text-blue-500 bg-blue-500/10" : "border-orange-500 text-orange-500 bg-orange-500/10"
                        }`}>
                          {lead._classificacao === "SOL SDR" ? "🤖 SOL" : "🔁 FUP FRIO"}
                        </Badge>
                        {wasSent && <Badge variant="secondary" className="text-[10px] shrink-0 bg-green-500/20 text-green-600">✓ Enviado</Badge>}
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
