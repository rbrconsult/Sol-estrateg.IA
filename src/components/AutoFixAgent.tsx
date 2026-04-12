import { useState, useRef, useEffect } from "react";

const PROXY_URL = "https://xffzjdulkdgyicsllznp.supabase.co/functions/v1/autofix-proxy";
const MAKE_MCP_URL = "https://us2.make.com/mcp/server/2b8e2e8f-ab5f-472e-bc9c-8c4f9255567e";
const TEAM_ID = 1934898;

const SYSTEM_PROMPT = `Você é SOL AutoFix — agente autônomo de correção de cenários Make.com.

MISSÃO: RESOLVER problemas. Nunca apenas descrever.

REGRAS ABSOLUTAS:
1. Cenário INATIVO → chame scenarios_activate com o scenarioId imediatamente
2. Erro de execução → scenarios_get → analise o blueprint → scenarios_update com correção
3. Múltiplos cenários inativos → ative TODOS em sequência
4. Após cada ação → confirme o status atual
5. NUNCA finalize sem executar pelo menos uma ação corretiva

CONTEXTO:
- teamId: ${TEAM_ID}
- orgId: 6724658
- Região: us2.make.com

FORMATO: Direto. Liste ações executadas e resultado final.`;

const QUICK_ACTIONS = [
  { label: "🔄 FUP Frio inativo", text: `Cenário ID 4706875 "Robo FUP Frio | SOL v3" está INATIVO (teamId ${TEAM_ID}). Execute scenarios_activate agora e confirme.` },
  { label: "📣 Remarketing inativo", text: `Cenário ID 4713065 "SOL Remarketing | Disparo" está INATIVO (teamId ${TEAM_ID}). Execute scenarios_activate agora e confirme.` },
  { label: "🔍 Varredura geral", text: `Liste todos os cenários do teamId ${TEAM_ID}. Para cada isActive=false crítico para SOL v3, execute scenarios_activate. Reporte quais foram ativados.` },
  { label: "⚠️ FUP inválido", text: `Cenário 4706875 está INATIVO e isinvalid=true. Faça scenarios_get, identifique o problema no blueprint, corrija via scenarios_update e depois ative com scenarios_activate.` },
];

const S: Record<string, { border: string; bg: string; color: string }> = {
  start:  { border: "#00ff88", bg: "#001a0d", color: "#00ff88" },
  info:   { border: "#4488ff", bg: "#001133", color: "#aaccff" },
  agent:  { border: "#333",    bg: "#0d0d0d", color: "#444" },
  ai:     { border: "#ff9900", bg: "#1a0e00", color: "#ffcc88" },
  tool:   { border: "#cc44ff", bg: "#0d0022", color: "#dd88ff" },
  result: { border: "#44ccff", bg: "#001122", color: "#88ddff" },
  done:   { border: "#00ff88", bg: "#001a0d", color: "#00ff88" },
  warn:   { border: "#ffaa00", bg: "#1a1000", color: "#ffaa00" },
  error:  { border: "#ff4444", bg: "#1a0000", color: "#ff8888" },
};

interface LogEntry {
  type: string;
  msg: string;
  detail: string | null;
  id: number;
}

type Status = "idle" | "running" | "done" | "error";

export default function AutoFixAgent() {
  const [input, setInput] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [log]);

  const addLog = (type: string, msg: string, detail: string | null = null) =>
    setLog((p) => [...p, { type, msg, detail, id: Date.now() + Math.random() }]);

  const runFix = async () => {
    if (!input.trim() || running) return;
    setRunning(true);
    setStatus("running");
    setLog([]);
    addLog("start", "🤖 SOL AutoFix iniciado");
    addLog("info", "Analisando...", input.substring(0, 200));

    try {
      const messages: Array<{ role: string; content: string | Array<Record<string, unknown>> }> = [
        { role: "user", content: input },
      ];
      let iter = 0;

      while (iter < 10) {
        iter++;
        addLog("agent", `Iteração ${iter}...`);

        const res = await fetch(PROXY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2000,
            system: SYSTEM_PROMPT,
            messages,
            mcp_servers: [{ type: "url", url: MAKE_MCP_URL, name: "make-rbr" }],
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        const data = await res.json();
        if (data.error) throw new Error(JSON.stringify(data.error));

        const blocks = data.content || [];
        const asst: Array<Record<string, unknown>> = [];
        let hasTools = false;

        for (const b of blocks) {
          if (b.type === "text" && b.text?.trim()) {
            addLog("ai", b.text);
            asst.push(b);
          } else if (b.type === "mcp_tool_use" || b.type === "tool_use") {
            hasTools = true;
            const labels: Record<string, string> = {
              scenarios_activate: "⚡ Ativando",
              scenarios_get: "📋 Lendo blueprint",
              scenarios_update: "🔧 Corrigindo",
              scenarios_list: "📂 Listando",
            };
            addLog("tool", labels[b.name] || `🔧 ${b.name}`, JSON.stringify(b.input, null, 2));
            asst.push(b);
          } else if (b.type === "mcp_tool_result" || b.type === "tool_result") {
            const txt = b.content?.[0]?.text || JSON.stringify(b.content || "");
            addLog("result", "Resultado", txt.substring(0, 500));
            asst.push(b);
          }
        }

        messages.push({ role: "assistant", content: asst });

        if (data.stop_reason === "end_turn") {
          addLog("done", "✅ Concluído");
          setStatus("done");
          break;
        }

        if (hasTools) {
          const hasResults = blocks.some(
            (b: Record<string, unknown>) => b.type === "mcp_tool_result" || b.type === "tool_result"
          );
          if (!hasResults) messages.push({ role: "user", content: "Continue." });
          continue;
        }

        addLog("done", "✅ Finalizado");
        setStatus("done");
        break;
      }

      if (iter >= 10) { addLog("warn", "⚠️ Limite de iterações"); setStatus("done"); }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      addLog("error", `❌ ${message}`);
      setStatus("error");
    } finally {
      setRunning(false);
    }
  };

  const dot = { idle: "#333", running: "#ffaa00", done: "#00ff88", error: "#ff4444" }[status];
  const lbl = { idle: "AGUARDANDO", running: "EXECUTANDO...", done: "RESOLVIDO", error: "ERRO" }[status];

  return (
    <div style={{ background: "#080808", minHeight: "100vh", padding: "20px 16px", fontFamily: "'JetBrains Mono', monospace", color: "#ccc" }}>
      {/* Header */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: dot, boxShadow: `0 0 6px ${dot}`, transition: "all 0.3s" }} />
          <span style={{ fontSize: "10px", color: dot, letterSpacing: "3px" }}>{lbl}</span>
        </div>
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#fff" }}>
          SOL AutoFix <span style={{ color: "#00ff88", fontWeight: 400, fontSize: "13px" }}>/ Make MCP Agent</span>
        </h1>
        <p style={{ margin: "3px 0 0", fontSize: "10px", color: "#333", letterSpacing: "1px" }}>
          TEAM {TEAM_ID} · US2 · SOL v3
        </p>
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "9px", color: "#333", letterSpacing: "2px", marginBottom: "6px" }}>AÇÕES RÁPIDAS</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {QUICK_ACTIONS.map((q) => (
            <button key={q.label} onClick={() => setInput(q.text)} disabled={running}
              style={{ background: input === q.text ? "#1a1a1a" : "#111", color: input === q.text ? "#ccc" : "#555", border: `1px solid ${input === q.text ? "#333" : "#1a1a1a"}`, borderRadius: "4px", padding: "5px 9px", fontSize: "11px", fontFamily: "inherit", cursor: "pointer" }}>
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={running}
        placeholder="Cole o alerta ou descreva o problema..."
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runFix(); }}
        style={{ width: "100%", height: "90px", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "6px", color: "#ddd", padding: "10px", fontSize: "12px", fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box", marginBottom: "10px" }}
      />

      {/* Botões */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <button onClick={runFix} disabled={running || !input.trim()}
          style={{ background: running || !input.trim() ? "#111" : "#00ff88", color: running || !input.trim() ? "#333" : "#000", border: "none", borderRadius: "4px", padding: "10px 24px", fontSize: "13px", fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: "1px" }}>
          {running ? "EXECUTANDO..." : "▶ RESOLVER"}
        </button>
        <button onClick={() => { setLog([]); setInput(""); setStatus("idle"); }} disabled={running}
          style={{ background: "transparent", color: "#444", border: "1px solid #1a1a1a", borderRadius: "4px", padding: "10px 14px", fontSize: "12px", fontFamily: "inherit", cursor: "pointer" }}>
          LIMPAR
        </button>
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div style={{ background: "#0a0a0a", border: "1px solid #111", borderRadius: "6px", padding: "10px", maxHeight: "420px", overflowY: "auto" }}>
          {log.map((e) => {
            const s = S[e.type] || S.info;
            return (
              <div key={e.id} style={{ padding: "6px 10px", marginBottom: "3px", borderRadius: "3px", fontSize: "12px", fontFamily: "inherit", borderLeft: `3px solid ${s.border}`, background: s.bg, color: s.color, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                <div>{e.msg}</div>
                {e.detail && <div style={{ marginTop: "3px", opacity: 0.5, fontSize: "10px" }}>{e.detail}</div>}
              </div>
            );
          })}
          <div ref={logEndRef} />
        </div>
      )}
    </div>
  );
}
