import { Bot, ArrowRight, AlertTriangle, MessageSquare, Zap, TrendingUp, CheckCircle, Send, Users, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Proposal } from "@/data/dataAdapter";
import type { MakeRecord } from "@/hooks/useMakeDataStore";
import { normalizePhone } from "@/hooks/useMakeDataStore";

interface Props {
  proposals: Proposal[];
  makeRecords: MakeRecord[];
  getMakeData: (p: Proposal) => MakeRecord[];
}

/* ── helpers ── */
function safeDate(str: string | undefined): Date | null {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function hoursSince(dateStr: string): number {
  const d = safeDate(dateStr);
  if (!d) return 0;
  return Math.max(0, (Date.now() - d.getTime()) / (1000 * 60 * 60));
}

export function RobotInsights({ proposals, makeRecords, getMakeData }: Props) {
  const abertos = proposals.filter(p => p.status === "Aberto");

  /* ═══ 0. Destaques Positivos ═══ */
  const qualificados = proposals.filter(p => p.solQualificado).length;
  const totalEnviados = makeRecords.filter(r => r.data_envio).length;
  const phonesUnicos = new Set(makeRecords.filter(r => r.telefone).map(r => r.telefone)).size;
  const leadsQuentes = abertos.filter(p => p.temperatura === "QUENTE").length;

  const destaques = [
    { label: "Qualificados pela Sol", value: qualificados, icon: CheckCircle, color: "text-primary" },
    { label: "Mensagens Enviadas", value: totalEnviados, icon: Send, color: "text-primary" },
    { label: "Leads Contactados", value: phonesUnicos, icon: Users, color: "text-primary" },
    { label: "Leads Quentes", value: leadsQuentes, icon: Flame, color: "text-warning" },
  ];

  /* ═══ 1. Métricas Sol vs FUP Frio ═══ */
  const solRecords = makeRecords.filter(r => r.robo === "sol");
  const fupRecords = makeRecords.filter(r => r.robo !== "sol");

  const solResponderam = solRecords.filter(r => r.status_resposta === "respondeu").length;
  const fupResponderam = fupRecords.filter(r => r.status_resposta === "respondeu").length;

  const solTaxaResp = solRecords.length > 0 ? (solResponderam / solRecords.length) * 100 : 0;
  const fupTaxaResp = fupRecords.length > 0 ? (fupResponderam / fupRecords.length) * 100 : 0;

  const solTempos = solRecords
    .filter(r => r.data_envio && r.data_resposta)
    .map(r => {
      const envio = safeDate(r.data_envio);
      const resp = safeDate(r.data_resposta);
      if (!envio || !resp) return -1;
      return (resp.getTime() - envio.getTime()) / (1000 * 60 * 60);
    })
    .filter(h => h >= 0 && h < 720);

  const fupTempos = fupRecords
    .filter(r => r.data_envio && r.data_resposta)
    .map(r => {
      const envio = safeDate(r.data_envio);
      const resp = safeDate(r.data_resposta);
      if (!envio || !resp) return -1;
      return (resp.getTime() - envio.getTime()) / (1000 * 60 * 60);
    })
    .filter(h => h >= 0 && h < 720);

  const solTempoMedio = solTempos.length > 0 ? solTempos.reduce((a, b) => a + b, 0) / solTempos.length : 0;
  const fupTempoMedio = fupTempos.length > 0 ? fupTempos.reduce((a, b) => a + b, 0) / fupTempos.length : 0;

  const robots = [
    {
      name: "Sol (Qualificação)",
      icon: "🤖",
      total: solRecords.length,
      responderam: solResponderam,
      taxa: solTaxaResp,
      tempoMedio: solTempoMedio,
    },
    {
      name: "FUP Frio (Follow-up)",
      icon: "❄️",
      total: fupRecords.length,
      responderam: fupResponderam,
      taxa: fupTaxaResp,
      tempoMedio: fupTempoMedio,
    },
  ];

  /* ═══ 2. Follow-up Count ═══ */
  const phoneMap = new Map<string, { count: number; responded: boolean; name: string }>();
  for (const r of makeRecords) {
    if (!r.telefone) continue;
    const existing = phoneMap.get(r.telefone);
    if (existing) {
      existing.count++;
      if (r.status_resposta === "respondeu") existing.responded = true;
    } else {
      const prop = abertos.find(p => p.clienteTelefone && normalizePhone(p.clienteTelefone) === r.telefone);
      phoneMap.set(r.telefone, {
        count: 1,
        responded: r.status_resposta === "respondeu",
        name: prop?.nomeCliente || r.telefone,
      });
    }
  }

  const fupEntries = Array.from(phoneMap.values());
  const mediaFups = fupEntries.length > 0 ? fupEntries.reduce((a, e) => a + e.count, 0) / fupEntries.length : 0;
  const respondidos = fupEntries.filter(e => e.responded);
  const mediaFupsAteResp = respondidos.length > 0 ? respondidos.reduce((a, e) => a + e.count, 0) / respondidos.length : 0;
  const excessoFups = fupEntries.filter(e => e.count >= 5 && !e.responded).sort((a, b) => b.count - a.count);

  /* ═══ 3. Funil de Conversão dos Robôs ═══ */
  const totalResponderam = makeRecords.filter(r => r.status_resposta === "respondeu").length;

  // Qualificados direto das proposals (sem depender de phonesResponderam)
  const qualificadosFunil = proposals.filter(p => p.solQualificado).length;

  const fechados = proposals.filter(p => p.status === "Ganho").length;

  const funnel = [
    { label: "Enviados", value: totalEnviados, color: "bg-primary/40" },
    { label: "Responderam", value: totalResponderam, color: "bg-primary/60" },
    { label: "Qualificados", value: qualificadosFunil, color: "bg-primary/80" },
    { label: "Fechados", value: fechados, color: "bg-primary" },
  ];
  const maxFunnel = Math.max(...funnel.map(f => f.value), 1);

  /* ═══ 4. Alertas de Ação Imediata ═══ */
  const alertas: { type: "urgent" | "warning" | "info"; title: string; desc: string; count: number }[] = [];

  const quentesSemRobo = abertos.filter(p => {
    if (p.temperatura !== "QUENTE") return false;
    const records = getMakeData(p);
    return records.length === 0;
  });
  if (quentesSemRobo.length > 0) {
    alertas.push({
      type: "urgent",
      title: "Leads quentes sem contato de robô",
      desc: quentesSemRobo.slice(0, 3).map(p => p.nomeCliente).join(", ") + (quentesSemRobo.length > 3 ? ` +${quentesSemRobo.length - 3}` : ""),
      count: quentesSemRobo.length,
    });
  }

  const responderamSemAtend = abertos.filter(p => {
    if (!p.clienteTelefone) return false;
    const records = getMakeData(p);
    const respondeu = records.some(r => r.status_resposta === "respondeu");
    if (!respondeu) return false;
    return p.tempoNaEtapa > 2;
  });
  if (responderamSemAtend.length > 0) {
    alertas.push({
      type: "warning",
      title: "Responderam, mas sem avanço comercial",
      desc: responderamSemAtend.slice(0, 3).map(p => p.nomeCliente).join(", ") + (responderamSemAtend.length > 3 ? ` +${responderamSemAtend.length - 3}` : ""),
      count: responderamSemAtend.length,
    });
  }

  const ignorando3d = makeRecords.filter(r => {
    if (r.status_resposta === "respondeu") return false;
    return hoursSince(r.data_envio) > 72;
  });
  if (ignorando3d.length > 0) {
    alertas.push({
      type: "info",
      title: "Sem resposta há +3 dias",
      desc: `${ignorando3d.length} leads aguardando retorno`,
      count: ignorando3d.length,
    });
  }

  return (
    <section className="mt-6 rounded-xl border border-primary/20 bg-card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/40 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground tracking-tight">Robôs & Follow-up</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sol · FUP Frio · Conversão · Alertas</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* ── Row 0: Destaques Positivos ── */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-medium flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3" /> Destaques
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {destaques.map((d, i) => (
              <div key={i} className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <d.icon className={cn("h-3.5 w-3.5", d.color)} />
                  <p className="text-[10px] text-muted-foreground uppercase">{d.label}</p>
                </div>
                <p className={cn("text-2xl font-bold tabular-nums", d.color)}>{d.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Row 1: Sol vs FUP Frio ── */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-medium flex items-center gap-1.5">
            <Zap className="h-3 w-3" /> Comparativo de Robôs
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {robots.map((robot, i) => (
              <div key={i} className="rounded-lg border border-border/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">{robot.icon}</span>
                  <span className="text-xs font-semibold text-foreground">{robot.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Contatos</p>
                    <p className="text-xl font-bold text-foreground tabular-nums">{robot.total}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Taxa Resp.</p>
                    <p className={cn(
                      "text-xl font-bold tabular-nums",
                      robot.taxa >= 30 ? "text-primary" : robot.taxa >= 15 ? "text-warning" : robot.total === 0 ? "text-muted-foreground" : "text-destructive"
                    )}>
                      {robot.total > 0 ? `${robot.taxa.toFixed(0)}%` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Tempo Méd.</p>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      {robot.tempoMedio > 0 ? `${robot.tempoMedio.toFixed(1)}h` : "—"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/60 transition-all duration-700"
                    style={{ width: `${Math.min(robot.taxa, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Row 2: Follow-up Count ── */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-medium flex items-center gap-1.5">
            <MessageSquare className="h-3 w-3" /> Acompanhamento Ativo
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-border/50 p-3">
              <p className="text-[10px] text-muted-foreground uppercase">Média FUPs/Lead</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">{mediaFups.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{fupEntries.length} leads em acompanhamento</p>
            </div>
            <div className="rounded-lg border border-border/50 p-3">
              <p className="text-[10px] text-muted-foreground uppercase">FUPs até Resposta</p>
              <p className="text-2xl font-bold text-primary tabular-nums">{mediaFupsAteResp.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{respondidos.length} responderam</p>
            </div>
            <div className="rounded-lg border border-border/50 p-3">
              <p className="text-[10px] text-muted-foreground uppercase">Excesso (+5 FUPs)</p>
              <p className={cn(
                "text-2xl font-bold tabular-nums",
                excessoFups.length === 0 ? "text-primary" : "text-warning"
              )}>
                {excessoFups.length === 0 ? "✓" : excessoFups.length}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {excessoFups.length === 0 ? "Nenhum excesso" : "sem resposta"}
              </p>
            </div>
            <div className="rounded-lg border border-border/50 p-3">
              <p className="text-[10px] text-muted-foreground uppercase">Taxa Conversão FUP</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {fupEntries.length > 0 ? ((respondidos.length / fupEntries.length) * 100).toFixed(0) : 0}%
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">leads que responderam</p>
            </div>
          </div>

          {excessoFups.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {excessoFups.slice(0, 5).map((e, i) => (
                <span key={i} className="text-[10px] px-2 py-1 rounded bg-warning/10 text-warning font-medium">
                  {e.name} ({e.count} FUPs)
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Row 3: Funil de Conversão ── */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-medium flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3" /> Funil de Conversão dos Robôs
          </p>
          <div className="space-y-2">
            {funnel.map((step, i) => {
              const pct = (step.value / maxFunnel) * 100;
              const prevValue = i > 0 ? funnel[i - 1].value : step.value;
              const convRate = prevValue > 0 && i > 0 ? ((step.value / prevValue) * 100).toFixed(0) : null;

              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-24 text-[11px] text-muted-foreground">{step.label}</span>
                  <div className="flex-1 h-6 rounded bg-secondary/40 overflow-hidden relative">
                    <div
                      className={cn("h-full rounded transition-all duration-700", step.color)}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-foreground w-10 text-right tabular-nums">{step.value}</span>
                  {convRate && (
                    <span className="text-[10px] text-muted-foreground w-14 text-right flex items-center justify-end gap-0.5">
                      <ArrowRight className="h-2.5 w-2.5" />
                      {convRate}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Row 4: Alertas de Ação Imediata ── */}
        {alertas.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-medium flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3" /> Ação Imediata
            </p>
            <div className="space-y-2">
              {alertas.map((a, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-lg p-3 border flex items-start gap-3",
                    a.type === "urgent" ? "border-destructive/30 bg-destructive/5" :
                    a.type === "warning" ? "border-warning/30 bg-warning/5" :
                    "border-border/50 bg-secondary/20"
                  )}
                >
                  <div className={cn(
                    "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                    a.type === "urgent" ? "bg-destructive/10" :
                    a.type === "warning" ? "bg-warning/10" :
                    "bg-secondary/40"
                  )}>
                    <span className={cn(
                      "text-sm font-bold tabular-nums",
                      a.type === "urgent" ? "text-destructive" :
                      a.type === "warning" ? "text-warning" :
                      "text-muted-foreground"
                    )}>
                      {a.count}
                    </span>
                  </div>
                  <div>
                    <p className={cn(
                      "text-xs font-semibold",
                      a.type === "urgent" ? "text-destructive" :
                      a.type === "warning" ? "text-warning" :
                      "text-foreground"
                    )}>
                      {a.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
