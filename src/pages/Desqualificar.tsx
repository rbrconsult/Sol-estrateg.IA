import { useState, useMemo } from "react";
import { useSolLeads, normalizePhone, type SolLead } from '@/hooks/useSolData';
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Search, Loader2, Users,
  Phone, MapPin, Thermometer, RefreshCw, XCircle,
} from "lucide-react";

const WEBHOOK_DESQUALIFICAR = "https://hook.us2.make.com/joonk1hj7ubqeogtq1hxwymncruxslbl";

const isDesqualificado = (r: SolLead): boolean => {
  const status = (r.status || "").toUpperCase();
  const etapa = (r.etapa_funil || "").toUpperCase();
  const cod = (r.status || "").toUpperCase();
  return (
    status.includes("DESQUALIFICADO") || status.includes("DECLINIO") || status.includes("DECLÍNIO") ||
    status.includes("LEAD_FRIO") || etapa.includes("DESQUALIFICADO") || cod.includes("DESQUALIFICADO")
  );
};

export default function Desqualificar() {
  const { data: solLeads, isLoading, isFetching, refetch } = useSolLeads();
  
  const gf = useGlobalFilters();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchSending, setBatchSending] = useState(false);
  const [manualDesqPhone, setManualDesqPhone] = useState("");
  const [manualDesqName, setManualDesqName] = useState("");
  const [manualDesqSending, setManualDesqSending] = useState(false);

  const allLeads = useMemo(() => {
    if (!solLeads?.length) return [];
    return gf.filterRecords(solLeads).map((r) => ({ ...r, _desqualificado: isDesqualificado(r) }));
  }, [solLeads, gf]);

  const filtered = useMemo(() => {
    let list = allLeads.filter((l) => !l._desqualificado); // only show candidates
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((l) =>
        (l.nome || "").toLowerCase().includes(q) || (l.telefone || "").includes(q) || (l.cidade || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [allLeads, search]);

  const countDesq = useMemo(() => allLeads.filter((l) => l._desqualificado).length, [allLeads]);

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
    const leadsToSend = filtered.filter((l) => selected.has(l.telefone || ""));
    let success = 0;
    for (const lead of leadsToSend) {
      const rawPhone = (lead.telefone || "").replace(/\D/g, "");
      const telefoneFormatado = rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`;
      try {
        const res = await fetch(WEBHOOK_DESQUALIFICAR, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            telefone: telefoneFormatado, project_id: lead.project_id || "", chatId: "", nome: lead.nome || "",
          }),
        });
        if (res.ok) success++;
      } catch {}
    }
    toast.success(`${success}/${leadsToSend.length} leads desqualificados`);
    setSelected(new Set());
    setBatchSending(false);
    setTimeout(() => refetch(), 2000);
  };

  const sendManualDesqualificar = async () => {
    const cleaned = manualDesqPhone.replace(/\D/g, "");
    if (!cleaned || cleaned.length < 10) { toast.error("Informe um número válido com DDD"); return; }
    const telefoneFormatado = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    setManualDesqSending(true);
    try {
      const res = await fetch(WEBHOOK_DESQUALIFICAR, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telefone: telefoneFormatado, project_id: "", chatId: "", nome: manualDesqName.trim() || "",
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(`${telefoneFormatado} desqualificado`);
      setManualDesqPhone(""); setManualDesqName("");
    } catch (err: any) { toast.error(`Erro: ${err.message}`); }
    finally { setManualDesqSending(false); }
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
            <XCircle className="h-5 w-5 md:h-6 md:w-6 text-destructive" />
            Desqualificar Leads
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">Selecione os leads e desqualifique em lote</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Users className="h-3.5 w-3.5" /> Total</div>
          <p className="text-2xl font-bold">{allLeads.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Users className="h-3.5 w-3.5 text-primary" /> Candidatos</div>
          <p className="text-2xl font-bold">{filtered.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><XCircle className="h-3.5 w-3.5 text-destructive" /> Já desqualificados</div>
          <p className="text-2xl font-bold text-destructive">{countDesq}</p>
        </CardContent></Card>
      </div>

      {/* Manual */}
      <Card className="border-dashed border-destructive/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
            <XCircle className="h-3.5 w-3.5 text-destructive" /> Desqualificar Manual
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={manualDesqSending || !manualDesqPhone.trim()} className="shrink-0 gap-1.5" variant="destructive">
                  {manualDesqSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Desqualificar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar desqualificação</AlertDialogTitle>
                  <AlertDialogDescription>
                    Deseja desqualificar o lead <strong>{manualDesqPhone}</strong>?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={sendManualDesqualificar} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirmar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* List with batch selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome, telefone ou cidade..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>

          {/* Batch toolbar */}
          <div className="flex items-center gap-3 mt-3 p-2 rounded-lg bg-muted/30 border border-border/50">
            <Checkbox checked={filtered.length > 0 && selected.size === filtered.length} onCheckedChange={toggleAll} className="h-4 w-4" />
            <span className="text-xs text-muted-foreground">
              {selected.size > 0 ? `${selected.size} selecionado(s)` : `${filtered.length} leads`}
            </span>
            <div className="ml-auto">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" disabled={selected.size === 0 || batchSending} className="gap-1.5">
                    {batchSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                    Desqualificar ({selected.size})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar desqualificação</AlertDialogTitle>
                    <AlertDialogDescription>
                      Deseja desqualificar <strong>{selected.size}</strong> lead(s)? Esta ação será enviada ao webhook.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={sendBatch} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirmar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum lead candidato encontrado.</p>
          ) : (
            <div className="space-y-1">
              {filtered.map((lead, idx) => {
                const key = lead.telefone || `lead-${idx}`;
                const isSelected = selected.has(key);
                return (
                  <div
                    key={key}
                    onClick={() => toggleSelect(key)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      isSelected ? "border-destructive/50 bg-destructive/5" : "border-border bg-muted/20 hover:bg-muted/40"
                    }`}
                  >
                    <Checkbox checked={isSelected} className="h-4 w-4 shrink-0" onCheckedChange={() => toggleSelect(key)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{lead.nome || "Sem nome"}</span>
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
