import { useState, useMemo, Fragment } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { SolLead } from "@/hooks/useSolData";
import { normalizeTemp, normalizeCloser, getEtapaLabel } from "@/lib/leads-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CanalOrigemBadge } from "@/components/sol/CanalOrigemBadge";
import { TemperatureBadge } from "@/components/sol/TemperatureBadge";

interface LeadsTableProps {
  filtered: SolLead[];
  onLeadClick: (lead: SolLead) => void;
  expandedLead: string | null;
}

export function LeadsTable({ filtered, onLeadClick, expandedLead }: LeadsTableProps) {
  const [tableLimit, setTableLimit] = useState(50);
  const [tableColTemp, setTableColTemp] = useState<string>("todas");
  const [tableColResposta, setTableColResposta] = useState<string>("todas");
  const [tableMinScore, setTableMinScore] = useState("");
  const [tableMinMsgs, setTableMinMsgs] = useState("");

  const tableDetailFiltered = useMemo(() => {
    const minSc = parseFloat(tableMinScore);
    const minM = parseInt(tableMinMsgs, 10);
    return filtered.filter(r => {
      if (tableColTemp !== "todas" && normalizeTemp(r.temperatura) !== tableColTemp) return false;
      if (tableColResposta !== "todas") {
        const st = String((r as any)._status_resposta || "");
        if (tableColResposta === "respondeu" && st !== "respondeu") return false;
        if (tableColResposta === "ignorou" && st !== "ignorou") return false;
        if (tableColResposta === "aguardando" && (st === "respondeu" || st === "ignorou")) return false;
      }
      if (Number.isFinite(minSc) && minSc > 0) {
        const sc = parseFloat(r.score || "0");
        if (sc < minSc) return false;
      }
      if (Number.isFinite(minM) && minM > 0 && (r.total_mensagens_ia ?? 0) < minM) return false;
      return true;
    });
  }, [filtered, tableColTemp, tableColResposta, tableMinScore, tableMinMsgs]);

  const tableLeads = useMemo(() => tableDetailFiltered.slice(0, tableLimit), [tableDetailFiltered, tableLimit]);

  return (
    <section className="mt-6 rounded-lg border border-border/50 bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/40 space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Leads Detalhados · {tableDetailFiltered.length} de {filtered.length} (após filtros da tabela)
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Filtros da tabela:</span>
          <Select value={tableColTemp} onValueChange={setTableColTemp}>
            <SelectTrigger className="w-[130px] h-7 text-xs"><SelectValue placeholder="Temp." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas temp.</SelectItem>
              <SelectItem value="QUENTE">Quente</SelectItem>
              <SelectItem value="MORNO">Morno</SelectItem>
              <SelectItem value="FRIO">Frio</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tableColResposta} onValueChange={setTableColResposta}>
            <SelectTrigger className="w-[150px] h-7 text-xs"><SelectValue placeholder="Resposta" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas respostas</SelectItem>
              <SelectItem value="respondeu">Respondeu</SelectItem>
              <SelectItem value="ignorou">Ignorou</SelectItem>
              <SelectItem value="aguardando">Aguardando</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={0}
            placeholder="Score mín."
            value={tableMinScore}
            onChange={(e) => setTableMinScore(e.target.value)}
            className="h-7 w-[100px] text-xs"
          />
          <Input
            type="number"
            min={0}
            placeholder="Msgs IA mín."
            value={tableMinMsgs}
            onChange={(e) => setTableMinMsgs(e.target.value)}
            className="h-7 w-[110px] text-xs"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40">
              {["Nome", "Telefone", "Canal", "Etapa", "Status", "Temp.", "Score", "Msgs IA", "Closer", "FUPs", "Resposta", "Data"].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableLeads.map((r, i) => {
              const isExpanded = expandedLead === (r.telefone + i);
              const closer = normalizeCloser(r.closer_nome);
              return (
                <Fragment key={r.telefone + String(i)}>
                  <tr
                    className="border-b border-border/20 transition-colors hover:bg-secondary/30 cursor-pointer"
                    onClick={() => onLeadClick(r)}
                  >
                    <td className="px-3 py-2.5 font-medium text-foreground text-xs">
                      <div className="flex items-center gap-1.5">
                        {r.nome || '—'}
                        {r.franquia_id === 'sol_leads' && <span className="text-[9px] bg-primary/10 text-primary px-1 rounded">v2</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs font-mono">{r.telefone || '—'}</td>
                    <td className="px-3 py-2.5"><CanalOrigemBadge canal={r.canal_origem} /></td>
                    <td className="px-3 py-2.5">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded", getEtapaLabel(r) === "TRAFEGO PAGO" ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary")}>
                        {getEtapaLabel(r)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.status || '—'}</td>
                    <td className="px-3 py-2.5"><TemperatureBadge temperatura={r.temperatura} /></td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-foreground tabular-nums">
                      {r.score && parseFloat(r.score) > 0 ? parseFloat(r.score).toFixed(1) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground tabular-nums">{r.total_mensagens_ia ?? '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{closer || '—'}</td>
                    <td className="px-3 py-2.5 text-xs font-mono tabular-nums text-muted-foreground">{r.fup_followup_count ?? 0}</td>
                    <td className="px-3 py-2.5">
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded",
                        ((r as any)._status_resposta || '') === 'respondeu' ? "bg-primary/10 text-primary" :
                        ((r as any)._status_resposta || '') === 'ignorou' ? "bg-destructive/10 text-destructive" :
                        "bg-secondary text-muted-foreground"
                      )}>
                        {((r as any)._status_resposta || '') === 'respondeu' ? 'Respondeu' :
                         ((r as any)._status_resposta || '') === 'ignorou' ? 'Ignorou' : 'Aguardando'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[10px] text-muted-foreground">
                      {(() => { try { const d = new Date(r.ts_cadastro || ""); return !isNaN(d.getTime()) ? format(d, "dd/MM HH:mm", { locale: ptBR }) : "—"; } catch { return "—"; } })()}
                    </td>
                  </tr>
                  {/* Expansion section logic (simplified for the extraction, timeline would need fetching usually) */}
                  {isExpanded && ([] as any[]).length > 0 && (
                    <tr key={`${r.telefone}${i}-timeline`}>
                      <td colSpan={12} className="px-6 py-4 bg-secondary/20">
                        <div className="space-y-2">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <MessageSquare className="h-3 w-3" /> Histórico de interações
                          </p>
                          {([] as any[]).slice(0, 10).map((h, idx) => (
                            <div key={idx} className={cn(
                              "flex items-start gap-3 rounded-lg p-2.5",
                              h.tipo === 'recebida' ? "bg-primary/5" : "bg-card"
                            )}>
                              <span className="text-[10px] mt-0.5">{'sol' === 'sol' ? '🤖' : '❄️'}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                                    {h.tipo === 'recebida' ? 'Resposta do lead' : `Robô Sol/FUP`}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground/60">
                                    {(() => { try { const d = new Date(h.data); return !isNaN(d.getTime()) ? format(d, "dd/MM/yy HH:mm", { locale: ptBR }) : ""; } catch { return ""; } })()}
                                  </span>
                                </div>
                                <p className="text-xs text-foreground leading-relaxed truncate">{h.mensagem || "—"}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {tableDetailFiltered.length > tableLimit && (
        <div className="px-5 py-3 border-t border-border/40 text-center">
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setTableLimit(prev => prev + 50)}>
            Carregar mais ({tableDetailFiltered.length - tableLimit} restantes)
          </Button>
        </div>
      )}
    </section>
  );
}
