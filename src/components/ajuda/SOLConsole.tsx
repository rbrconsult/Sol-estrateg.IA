import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rocket, Zap, Database, MessageSquare, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const WEBHOOKS: Record<string, { name: string; url: string; color: string }> = {
  inbound: { name: "Inbound (Novo Lead)", url: "https://hook.us2.make.com/zu63gqpag58mj9h9palrs9qec58wo1ht", color: "#10b981" },
  agent: { name: "Agent WhatsApp", url: "https://hook.us2.make.com/a5rn6878os5av47425i86m3a1siapgrc", color: "#6366f1" },
  qualificar: { name: "Qualificar Lead", url: "https://hook.us2.make.com/oxaip1d1e946l7hmtyhpr1aic626o92m", color: "#22c55e" },
  desqualificar: { name: "Desqualificar Lead", url: "https://hook.us2.make.com/joonk1hj7ubqeogtq1hxwymncruxslbl", color: "#ef4444" },
  reprocessar: { name: "Reprocessar Lead", url: "https://hook.us2.make.com/m6zaweontguh6vqsfvid3g73bxb1qg44", color: "#f59e0b" },
  transfer: { name: "Transfer Closer", url: "https://hook.us2.make.com/xwxjtzfj4zul7aye2pxrv2e4glmpgwg7", color: "#8b5cf6" },
  sm_ganho: { name: "SM Ganho/Perdido", url: "https://hook.us2.make.com/m8kbskb6paqmmogmssi1euqexdgsecj2", color: "#06b6d4" },
  sm_etapa: { name: "SM Mudança Etapa", url: "https://hook.us2.make.com/9y86mx4u2fn7igbquvvqm8b8jlpxp6r0", color: "#06b6d4" },
  sm_proposta: { name: "SM Proposta Aceita", url: "https://hook.us2.make.com/2dad4pjofaloeejveumf5ku3ax9q5aj7", color: "#06b6d4" },
};

const DS_IDS: Record<string, number> = {
  sol_leads: 87418,
  sol_qualificacao: 87715,
  sol_config: 87419,
  sol_auth: 87324,
  sol_equipe: 87420,
  sol_funis: 87421,
  sol_metricas: 87422,
  sol_projetos: 87423,
  sol_campanhas: 87325,
  sol_conversions: 87775,
};

const MAKE_BASE = "https://us2.make.com/api/v2";
const MAKE_TEAM = "1934898";

interface LogEntry {
  time: string;
  message: string;
  type: "info" | "success" | "error";
  detail?: string | object | null;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    idle: "bg-muted text-muted-foreground",
    loading: "bg-yellow-500/20 text-yellow-400",
    success: "bg-green-500/20 text-green-400",
    error: "bg-destructive/20 text-destructive",
  };
  const labels: Record<string, string> = { idle: "—", loading: "⏳", success: "✅", error: "❌" };
  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-mono", variants[status] || variants.idle)}>
      {labels[status] || "—"}
    </span>
  );
}

function LogEntryRow({ log }: { log: LogEntry }) {
  return (
    <div className={cn(
      "border-l-2 pl-3 py-1.5 text-xs font-mono",
      log.type === "error" ? "border-destructive" : log.type === "success" ? "border-green-500" : "border-muted"
    )}>
      <div className="flex gap-2 items-start">
        <span className="text-muted-foreground shrink-0">{log.time}</span>
        <span className={cn(
          log.type === "error" ? "text-destructive" : log.type === "success" ? "text-green-400" : "text-foreground"
        )}>{log.message}</span>
      </div>
      {log.detail && (
        <pre className="text-[10px] text-muted-foreground mt-1 whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
          {typeof log.detail === "string" ? log.detail : JSON.stringify(log.detail, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function SOLConsole() {
  const [makeToken, setMakeToken] = useState("e8c4149c-028a-4793-bbbb-591fd968ff42");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  const [lead, setLead] = useState({
    telefone: "5511974426112",
    nome: "Rafael Teste E2E",
    chatId: "E2E_RAF_001",
    contactId: "E2E_RAF_CONTACT_001",
    msg1: "Minha conta de luz é R$ 520 reais por mês",
    msg2: "Moro em Olímpia SP, minha casa é residencial com telhado de cerâmica. Não preciso de acréscimo de carga.",
    msg3: "Quero instalar o mais rápido possível, prazo imediato. Vou financiar. Meu email é teste.e2e@gmail.com. Prefiro contato por WhatsApp.",
  });

  const [selectedDS, setSelectedDS] = useState("sol_leads");
  const [dsData, setDsData] = useState<any>(null);
  const [dsLoading, setDsLoading] = useState(false);
  const [dsSearchKey, setDsSearchKey] = useState("");

  const [quickPhone, setQuickPhone] = useState("");
  const [quickMsg, setQuickMsg] = useState("");

  const [e2eRunning, setE2eRunning] = useState(false);
  const [e2eStep, setE2eStep] = useState("");
  const [e2eProgress, setE2eProgress] = useState(0);

  const addLog = useCallback((message: string, type: LogEntry["type"] = "info", detail: any = null) => {
    const time = new Date().toLocaleTimeString("pt-BR");
    setLogs((prev) => [{ time, message, type, detail }, ...prev].slice(0, 100));
  }, []);

  const setStatus = useCallback((key: string, status: string) => {
    setStatuses((prev) => ({ ...prev, [key]: status }));
  }, []);

  const callWebhook = async (key: string, payload: Record<string, any>) => {
    const webhook = WEBHOOKS[key];
    setStatus(key, "loading");
    addLog(`→ ${webhook.name}`, "info", payload);
    try {
      const res = await fetch(webhook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (res.ok) {
        setStatus(key, "success");
        addLog(`✅ ${webhook.name} — ${res.status}`, "success", text);
      } else {
        setStatus(key, "error");
        addLog(`❌ ${webhook.name} — ${res.status}`, "error", text);
      }
      return res.ok;
    } catch (err: any) {
      setStatus(key, "error");
      addLog(`❌ ${webhook.name} — ${err.message}`, "error");
      return false;
    }
  };

  const callMakeAPI = async (path: string) => {
    const sep = path.includes("?") ? "&" : "?";
    const url = `${MAKE_BASE}${path}${sep}teamId=${MAKE_TEAM}`;
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Token ${makeToken}` },
      });
      return await res.json();
    } catch (err: any) {
      addLog(`❌ Make API — ${err.message}`, "error");
      return null;
    }
  };

  const deleteMakeRecord = async (dsId: number, key: string) => {
    const url = `${MAKE_BASE}/data-stores/${dsId}/data?teamId=${MAKE_TEAM}`;
    try {
      await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${makeToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([key]),
      });
    } catch (_e) { /* ignore */ }
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const runE2E = async () => {
    setE2eRunning(true);
    setLogs([]);
    setStatuses({});
    const steps = 7;
    let current = 0;

    const step = (name: string) => {
      current++;
      setE2eProgress(Math.round((current / steps) * 100));
      setE2eStep(name);
      addLog(`══ FASE ${current}: ${name} ══`, "info");
    };

    try {
      step("PRÉ-VÔO");
      addLog("Limpando mocks anteriores...");
      await deleteMakeRecord(DS_IDS.sol_leads, lead.telefone);
      await deleteMakeRecord(DS_IDS.sol_qualificacao, lead.telefone);
      addLog("Mocks limpos ✅", "success");
      await sleep(1000);

      step("INBOUND");
      await callWebhook("inbound", {
        numero: lead.telefone, nome: lead.nome,
        mensagem: "Oi, vi o anúncio de vocês sobre energia solar e quero saber mais",
        tipo_mensagem: "1", chatId: lead.chatId, contactId: lead.contactId,
      });
      addLog("⏳ Aguardando Make processar (10s)...");
      await sleep(10000);

      const leadCheck1 = await callMakeAPI(`/data-stores/${DS_IDS.sol_leads}/data/${lead.telefone}`);
      if (leadCheck1?.data) {
        addLog(`Lead criado: ${leadCheck1.data.nome} | Status: ${leadCheck1.data.status}`, "success");
      } else {
        addLog("Lead não encontrado no DS — pode precisar de mais tempo", "error");
      }

      step("AGENT — Msg 1");
      await callWebhook("agent", {
        numero: lead.telefone, nome: lead.nome, mensagem: lead.msg1,
        tipo_mensagem: "1", chatId: lead.chatId, contactId: lead.contactId,
      });
      addLog("⏳ GPT processando (12s)...");
      await sleep(12000);

      const leadCheck2 = await callMakeAPI(`/data-stores/${DS_IDS.sol_leads}/data/${lead.telefone}`);
      if (leadCheck2?.data) {
        addLog(`Score: ${leadCheck2.data.score} | Valor conta: ${leadCheck2.data.valor_conta} | Msgs: ${leadCheck2.data.total_mensagens_ia}`, "success");
      }

      step("AGENT — Msg 2");
      await callWebhook("agent", {
        numero: lead.telefone, nome: lead.nome, mensagem: lead.msg2,
        tipo_mensagem: "1", chatId: lead.chatId, contactId: lead.contactId,
      });
      addLog("⏳ GPT processando (12s)...");
      await sleep(12000);

      step("AGENT — Msg 3 (Qualificação)");
      await callWebhook("agent", {
        numero: lead.telefone, nome: lead.nome, mensagem: lead.msg3,
        tipo_mensagem: "1", chatId: lead.chatId, contactId: lead.contactId,
      });
      addLog("⏳ GPT qualificando (15s)...");
      await sleep(15000);

      step("VERIFICAÇÃO");
      const leadFinal = await callMakeAPI(`/data-stores/${DS_IDS.sol_leads}/data/${lead.telefone}`);
      if (leadFinal?.data) {
        const d = leadFinal.data;
        addLog("═══ RESULTADO FINAL ═══", "success");
        addLog(`👤 Nome: ${d.nome}`, "success");
        addLog(`📧 Email: ${d.email || "—"}`, d.email ? "success" : "info");
        addLog(`📍 Cidade: ${d.cidade || "—"}`, d.cidade ? "success" : "info");
        addLog(`💰 Valor conta: ${d.valor_conta || "—"}`, d.valor_conta ? "success" : "info");
        addLog(`📊 Score: ${d.score || 0}`, "success");
        addLog(`🌡️ Temperatura: ${d.temperatura || "—"}`, "success");
        addLog(`📌 Status: ${d.status}`, d.status === "QUALIFICADO" ? "success" : "info");
        addLog(`🔄 Transferido: ${d.transferido_comercial}`, "info");
        addLog(`💬 Msgs IA: ${d.total_mensagens_ia}`, "info");
        addLog(`💵 Custo total: $${d.custo_total_usd || 0}`, "info");
        if (d.resumo_qualificacao) addLog(`📋 Resumo: presente ✅`, "success");
      }

      const qualFinal = await callMakeAPI(`/data-stores/${DS_IDS.sol_qualificacao}/data/${lead.telefone}`);
      if (qualFinal?.data) {
        addLog(`🏷️ sol_qualificacao: modelo=${qualFinal.data.modelo_negocio} | ação=${qualFinal.data.acao}`, "success");
      }

      step("COMPLETO");
      addLog("🎉 E2E Test finalizado!", "success");
    } catch (err: any) {
      addLog(`💥 Erro no E2E: ${err.message}`, "error");
    }

    setE2eRunning(false);
  };

  const loadDS = async () => {
    setDsLoading(true);
    const dsId = DS_IDS[selectedDS];
    let data;
    if (dsSearchKey.trim()) {
      data = await callMakeAPI(`/data-stores/${dsId}/data/${dsSearchKey.trim()}`);
      if (data) setDsData({ type: "single", data });
    } else {
      data = await callMakeAPI(`/data-stores/${dsId}/data?pg[limit]=20`);
      if (data) setDsData({ type: "list", data });
    }
    setDsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)]">
      {/* Header */}
      <Card className="mb-4">
        <CardContent className="py-3 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sun className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">SOL v2 — Operations Console</h2>
              <p className="text-xs text-muted-foreground">Evolve Energia Solar | RBR Consult | Team {MAKE_TEAM}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Make Token:</span>
            <Input
              type="password"
              value={makeToken}
              onChange={(e) => setMakeToken(e.target.value)}
              className="w-48 h-8 text-xs font-mono"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Main Panel */}
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="e2e" className="h-full flex flex-col">
            <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
              <TabsTrigger value="e2e" className="gap-1.5 text-xs">
                <Rocket className="h-3.5 w-3.5" /> E2E Flow
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="gap-1.5 text-xs">
                <Zap className="h-3.5 w-3.5" /> Webhooks
              </TabsTrigger>
              <TabsTrigger value="ds" className="gap-1.5 text-xs">
                <Database className="h-3.5 w-3.5" /> DataStores
              </TabsTrigger>
              <TabsTrigger value="quick" className="gap-1.5 text-xs">
                <MessageSquare className="h-3.5 w-3.5" /> Quick Action
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4">
              {/* E2E Tab */}
              <TabsContent value="e2e" className="mt-0 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">📋 Dados do Lead</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        ["telefone", "Telefone"],
                        ["nome", "Nome"],
                        ["chatId", "Chat ID Krolik"],
                        ["contactId", "Contact ID Krolik"],
                      ] as const).map(([key, label]) => (
                        <div key={key}>
                          <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                          <Input
                            value={lead[key]}
                            onChange={(e) => setLead((p) => ({ ...p, [key]: e.target.value }))}
                            className="h-8 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {([
                        ["msg1", "💬 Msg 1 — Valor conta"],
                        ["msg2", "💬 Msg 2 — Cidade + Imóvel"],
                        ["msg3", "💬 Msg 3 — Prazo + Pagamento"],
                      ] as const).map(([key, label]) => (
                        <div key={key}>
                          <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                          <Textarea
                            value={lead[key]}
                            onChange={(e) => setLead((p) => ({ ...p, [key]: e.target.value }))}
                            rows={2}
                            className="text-xs resize-none min-h-[56px]"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {e2eRunning && (
                  <Card className="border-primary/30">
                    <CardContent className="py-3 px-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-primary font-medium">{e2eStep}</span>
                        <span className="text-xs text-muted-foreground">{e2eProgress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${e2eProgress}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button
                  onClick={runE2E}
                  disabled={e2eRunning}
                  className="w-full"
                  size="lg"
                >
                  {e2eRunning ? "⏳ Executando E2E..." : "🚀 Iniciar E2E Flow Completo"}
                </Button>
              </TabsContent>

              {/* Webhooks Tab */}
              <TabsContent value="webhooks" className="mt-0 space-y-3">
                <Card>
                  <CardContent className="py-3 px-4">
                    <label className="text-xs text-muted-foreground mb-1 block">Telefone do lead</label>
                    <Input
                      value={lead.telefone}
                      onChange={(e) => setLead((p) => ({ ...p, telefone: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </CardContent>
                </Card>
                <div className="space-y-2">
                  {Object.entries(WEBHOOKS).map(([key, wh]) => (
                    <Card key={key}>
                      <CardContent className="py-2.5 px-4 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: wh.color }} />
                        <span className="text-xs font-medium flex-1 text-foreground">{wh.name}</span>
                        <StatusBadge status={statuses[key] || "idle"} />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() =>
                            callWebhook(key, {
                              numero: lead.telefone,
                              telefone: lead.telefone,
                              nome: lead.nome,
                              mensagem: "Teste manual via console",
                              tipo_mensagem: "1",
                              chatId: lead.chatId,
                              contactId: lead.contactId,
                              acao: key === "qualificar" ? "qualificar" : key === "desqualificar" ? "desqualificar" : undefined,
                              novo_status: key === "reprocessar" ? "EM_QUALIFICACAO" : undefined,
                            })
                          }
                        >
                          Disparar
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* DS Viewer Tab */}
              <TabsContent value="ds" className="mt-0 space-y-4">
                <div className="flex gap-2">
                  <Select value={selectedDS} onValueChange={(v) => { setSelectedDS(v); setDsData(null); }}>
                    <SelectTrigger className="w-52 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DS_IDS).map(([name, id]) => (
                        <SelectItem key={name} value={name} className="text-xs">
                          {name} (ID: {id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={dsSearchKey}
                    onChange={(e) => setDsSearchKey(e.target.value)}
                    placeholder="Buscar por key (telefone)..."
                    className="flex-1 h-8 text-xs"
                  />
                  <Button onClick={loadDS} disabled={dsLoading} size="sm" className="h-8">
                    {dsLoading ? "⏳" : "🔍 Buscar"}
                  </Button>
                </div>

                {dsData && (
                  <Card>
                    <CardContent className="py-3 px-4">
                      <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap break-all max-h-96 overflow-y-auto">
                        {JSON.stringify(dsData.data, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Quick Action Tab */}
              <TabsContent value="quick" className="mt-0 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Ação rápida — enviar mensagem ou comando</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Telefone</label>
                      <Input
                        value={quickPhone}
                        onChange={(e) => setQuickPhone(e.target.value)}
                        placeholder="5517991234567"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Mensagem do lead</label>
                      <Textarea
                        value={quickMsg}
                        onChange={(e) => setQuickMsg(e.target.value)}
                        placeholder="Ex: Quero saber sobre energia solar"
                        rows={3}
                        className="text-xs resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        size="sm"
                        className="text-xs"
                        onClick={() => callWebhook("agent", { numero: quickPhone, nome: "Quick Lead", mensagem: quickMsg, tipo_mensagem: "1", chatId: "QUICK_001", contactId: "QUICK_C_001" })}
                      >
                        💬 Agent
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-green-500/30 text-green-500 hover:bg-green-500/10"
                        onClick={() => callWebhook("qualificar", { telefone: quickPhone, acao: "qualificar" })}
                      >
                        ✅ Qualificar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
                        onClick={() => callWebhook("reprocessar", { telefone: quickPhone, novo_status: "EM_QUALIFICACAO" })}
                      >
                        🔄 Reprocessar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Log Panel */}
        <Card className="w-80 shrink-0 flex flex-col">
          <CardHeader className="py-2.5 px-4 flex-row items-center justify-between border-b">
            <CardTitle className="text-xs">📜 Console Log</CardTitle>
            <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setLogs([])}>
              Limpar
            </Button>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1">
              {logs.length === 0 && (
                <p className="text-xs text-muted-foreground text-center mt-8">Nenhum log ainda. Execute um teste.</p>
              )}
              {logs.map((log, i) => (
                <LogEntryRow key={i} log={log} />
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
