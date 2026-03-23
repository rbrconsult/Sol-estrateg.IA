import { useState, useMemo } from "react";
import { useMakeDataStore, MakeRecord } from "@/hooks/useMakeDataStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Search, Send, CheckCircle2, Loader2, Users, Filter,
  Phone, MapPin, Thermometer, Target,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const WEBHOOK_URL = "https://hook.us2.make.com/kg2hsdttkmvxq5j2tgeigu0kyv9ucyql";

const ETAPAS_QUALIFICAVEIS = ["SOL SDR", "FOLLOW UP"];

export default function Qualificacao() {
  const { data: records, isLoading } = useMakeDataStore();
  const [search, setSearch] = useState("");
  const [etapaFilter, setEtapaFilter] = useState<string>("all");
  const [sendingMap, setSendingMap] = useState<Record<string, boolean>>({});
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [manualPhone, setManualPhone] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualSending, setManualSending] = useState(false);

  const leads = useMemo(() => {
    if (!records) return [];
    return records.filter((r) => {
      const etapa = (r.etapaFunil || "").toUpperCase();
      if (!ETAPAS_QUALIFICAVEIS.includes(etapa)) return false;
      const status = (r.makeStatus || "").toUpperCase();
      if (status === "DESQUALIFICADO") return false;
      return true;
    });
  }, [records]);

  const filtered = useMemo(() => {
    let result = leads;
    if (etapaFilter !== "all") {
      result = result.filter((r) => (r.etapaFunil || "").toUpperCase() === etapaFilter);
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
    return result;
  }, [leads, etapaFilter, search]);

  const sendToWebhook = async (lead: MakeRecord) => {
    const key = lead.telefone;
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
      };
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSentMap((m) => ({ ...m, [key]: true }));
      toast.success(`Lead ${lead.nome || lead.telefone} enviado para qualificação!`);
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
      };
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(`Número ${telefoneFormatado} enviado para qualificação!`);
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
      const e = (l.etapaFunil || "").toUpperCase();
      map[e] = (map[e] || 0) + 1;
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
      <div>
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Target className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          Qualificação de Leads
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Leads nas etapas SOL SDR e Follow Up prontos para qualificação via Make.com
        </p>
      </div>

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

      {/* Envio Manual */}
      <Card className="border-dashed border-primary/30">
        <CardContent className="p-4">
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

      {/* Lead List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {filtered.length} leads para qualificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum lead encontrado com os filtros aplicados.
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((lead) => {
                const key = lead.telefone;
                const isSending = sendingMap[key];
                const isSent = sentMap[key];

                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          {lead.nome || "Sem nome"}
                        </span>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {lead.etapaFunil || "—"}
                        </Badge>
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

                    {/* Action */}
                    <Button
                      size="sm"
                      variant={isSent ? "outline" : "default"}
                      disabled={isSending}
                      onClick={() => sendToWebhook(lead)}
                      className="shrink-0 gap-1.5"
                    >
                      {isSending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isSent ? (
                        <Send className="h-3.5 w-3.5" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      {isSent ? "Re-qualificar" : "Qualificar"}
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
