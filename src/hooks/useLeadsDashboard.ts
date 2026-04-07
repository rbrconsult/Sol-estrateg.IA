import { useMemo } from "react";
import { SolLead } from "@/hooks/useSolData";
import { safeToFixed } from "@/lib/formatters";
import { isFupFrioLead } from "@/hooks/useConferenciaData";
import {
  JOURNEY_ORDER,
  normalizeTemp,
  getEtapaLabel,
  safeDate,
  hoursSince,
  isLeadQualificadoMql
} from "@/lib/leads-utils";

export function useLeadsDashboard(filtered: SolLead[]) {
  /* ── KPIs ── */
  const kpis = useMemo(() => {
    const total = filtered.length;
    const quentes = filtered.filter(r => normalizeTemp(r.temperatura) === "QUENTE").length;
    const mornos = filtered.filter(r => normalizeTemp(r.temperatura) === "MORNO").length;
    const frios = filtered.filter(r => normalizeTemp(r.temperatura) === "FRIO").length;
    const semTemp = total - quentes - mornos - frios;
    const responderam = filtered.filter(r => ((r as any)._status_resposta || '') === "respondeu").length;
    const taxaResposta = total > 0 ? (responderam / total) * 100 : 0;
    const scores = filtered.filter(r => r.score).map(r => parseFloat(r.score!) || 0).filter(s => s > 0);
    const scoreMedio = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return { total, quentes, mornos, frios, semTemp, responderam, taxaResposta, scoreMedio };
  }, [filtered]);

  /* ── Funil por Etapa ── */
  const funnelData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of filtered) {
      const etapa = getEtapaLabel(r);
      counts[etapa] = (counts[etapa] || 0) + 1;
    }
    const inOrder = new Set(JOURNEY_ORDER);
    const ordered = JOURNEY_ORDER.filter(etapa => (counts[etapa] || 0) > 0).map(etapa => ({ etapa, quantidade: counts[etapa] || 0 }));
    const extras = Object.entries(counts)
      .filter(([k]) => !inOrder.has(k))
      .sort((a, b) => b[1] - a[1])
      .map(([etapa, quantidade]) => ({ etapa, quantidade }));
    return [...ordered, ...extras];
  }, [filtered]);

  const maxFunnel = useMemo(() => Math.max(...funnelData.map(f => f.quantidade), 1), [funnelData]);
  const funnelSum = useMemo(() => funnelData.reduce((s, f) => s + f.quantidade, 0), [funnelData]);

  /* ── SLA Metrics (SolLead only) ── */
  const slaData = useMemo(() => {
    const SLA_ETAPA: Record<string, { label: string; maxDias: number }> = {
      "TRAFEGO PAGO": { label: "Tráfego Pago", maxDias: 1 },
      "SOL SDR": { label: "Sol SDR", maxDias: 2 },
      "PROSPECÇÃO": { label: "Prospecção", maxDias: 2 },
      "QUALIFICAÇÃO": { label: "Qualificação", maxDias: 3 },
      "QUALIFICADO": { label: "Qualificado", maxDias: 5 },
      "CONTATO REALIZADO": { label: "Contato Realizado", maxDias: 3 },
      "PROPOSTA": { label: "Proposta", maxDias: 5 },
      "NEGOCIAÇÃO": { label: "Negociação", maxDias: 7 },
    };

    const ativos = filtered.filter(r => r.status && !["PERDIDO", "EXCLUIDO", "GANHO"].includes(r.status.toUpperCase()));
    const etapaSLA = Object.entries(SLA_ETAPA).map(([etapa, config]) => {
      const leads = ativos.filter(r => getEtapaLabel(r) === etapa);
      const comData = leads.filter(r => !!r.ts_cadastro);
      const tempos = comData.map(r => {
        const d = safeDate(r.ts_cadastro);
        if (!d) return 0;
        return Math.max(0, (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
      }).filter(t => t > 0 && t < 365);
      const media = tempos.length > 0 ? tempos.reduce((a, b) => a + b, 0) / tempos.length : 0;
      const foraDoSLA = tempos.filter(t => t > config.maxDias).length;
      const semData = leads.length - comData.length;
      return { etapa, ...config, quantidade: leads.length, media: Math.round(media * 10) / 10, foraDoSLA, semData, comDados: tempos.length };
    }).filter(e => e.quantidade > 0);

    const totalForaSLA = etapaSLA.reduce((a, e) => a + e.foraDoSLA, 0);

    const comResposta = filtered.filter(r => r.ts_cadastro && r.ts_ultima_interacao);
    const temposRoboMin = comResposta.map(r => {
      const envio = safeDate(r.ts_cadastro);
      const resp = safeDate(r.ts_ultima_interacao);
      if (!envio || !resp) return -1;
      return Math.max(0, (resp.getTime() - envio.getTime()) / (1000 * 60));
    }).filter(m => m >= 0 && m < 720 * 60);
    const mediaRoboMin = temposRoboMin.length > 0 ? temposRoboMin.reduce((a, b) => a + b, 0) / temposRoboMin.length : 0;

    const comQualif = filtered.filter(r => r.ts_cadastro && r.ts_ultima_interacao);
    const temposAtendMin = comQualif.map(r => {
      const entrada = safeDate(r.ts_cadastro);
      const resp = safeDate(r.ts_ultima_interacao);
      if (!entrada || !resp) return -1;
      return Math.max(0, (resp.getTime() - entrada.getTime()) / (1000 * 60));
    }).filter(m => m >= 0 && m < 365 * 24 * 60);
    const mediaAtendMin = temposAtendMin.length > 0 ? temposAtendMin.reduce((a, b) => a + b, 0) / temposAtendMin.length : 0;
    const limite24hMin = 24 * 60;
    const dentroSLA24h = temposAtendMin.filter(m => m <= limite24hMin).length;
    const taxaSLA24h = temposAtendMin.length > 0 ? (dentroSLA24h / temposAtendMin.length) * 100 : 0;

    const totalComEntrada = filtered.filter(r => !!r.ts_cadastro).length;
    const dadosInsuficientes = temposAtendMin.length === 0;

    return {
      etapaSLA,
      totalForaSLA,
      mediaRoboMin,
      mediaAtendMin,
      taxaSLA24h,
      dentroSLA24h,
      temposAtendCount: temposAtendMin.length,
      dadosInsuficientes,
      totalComEntrada,
      totalLeads: filtered.length,
    };
  }, [filtered]);

  /* ── Robot Insights ── */
  const robotData = useMemo(() => {
    const solRecords = filtered.filter(r => !isFupFrioLead(r));
    const fupRecords = filtered.filter(r => isFupFrioLead(r));

    const solResp = solRecords.filter(r => ((r as any)._status_resposta || '') === "respondeu").length;
    const fupResp = fupRecords.filter(r => ((r as any)._status_resposta || '') === "respondeu").length;
    const solTaxa = solRecords.length > 0 ? (solResp / solRecords.length) * 100 : 0;
    const fupTaxa = fupRecords.length > 0 ? (fupResp / fupRecords.length) * 100 : 0;

    const calcTempoMedioMin = (records: SolLead[]) => {
      const tempos = records
        .filter(r => r.ts_cadastro && r.ts_ultima_interacao)
        .map(r => {
          const envio = safeDate(r.ts_cadastro);
          const resp = safeDate(r.ts_ultima_interacao);
          if (!envio || !resp) return -1;
          return (resp.getTime() - envio.getTime()) / (1000 * 60);
        })
        .filter(m => m >= 0 && m < 720 * 60);
      return tempos.length > 0 ? tempos.reduce((a, b) => a + b, 0) / tempos.length : 0;
    };

    const robots = [
      {
        key: "sol",
        name: "Robô SOL (SDR)",
        blurb: "Leads sem sequência FUP ativa",
        icon: "🤖",
        total: solRecords.length,
        responderam: solResp,
        taxa: solTaxa,
        tempoMedioMin: calcTempoMedioMin(solRecords),
      },
      {
        key: "fup",
        name: "Robô FUP Frio",
        blurb: "Universo FUP: fup_followup_count ≥ 1 ou etapa_funil FOLLOW UP",
        icon: "❄️",
        total: fupRecords.length,
        responderam: fupResp,
        taxa: fupTaxa,
        tempoMedioMin: calcTempoMedioMin(fupRecords),
      },
    ];

    const phoneMap = new Map<string, { count: number; responded: boolean }>();
    for (const r of fupRecords) {
      if (!r.telefone) continue;
      const fc = r.fup_followup_count ?? 0;
      if (fc < 1) continue;
      const existing = phoneMap.get(r.telefone);
      if (existing) {
        existing.count = Math.max(existing.count, fc);
        if (((r as any)._status_resposta || '') === "respondeu") existing.responded = true;
      } else {
        phoneMap.set(r.telefone, { count: fc, responded: ((r as any)._status_resposta || '') === "respondeu" });
      }
    }
    const fupEntries = Array.from(phoneMap.values());
    const mediaFups = fupEntries.length > 0 ? fupEntries.reduce((a, e) => a + e.count, 0) / fupEntries.length : 0;
    const respondidos = fupEntries.filter(e => e.responded);
    const mediaFupsAteResp = respondidos.length > 0 ? respondidos.reduce((a, e) => a + e.count, 0) / respondidos.length : 0;
    const excessoFups = fupEntries.filter(e => e.count >= 5 && !e.responded).length;

    const totalEnviados = filtered.filter(r => r.ts_cadastro).length;
    const totalResponderam = filtered.filter(r => ((r as any)._status_resposta || '') === "respondeu").length;
    const qualificados = filtered.filter(isLeadQualificadoMql).length;

    const ignorando3dLeads = filtered.filter(r => ((r as any)._status_resposta || '') !== "respondeu" && hoursSince(r.ts_cadastro) > 72);
    const quentesSemRespLeads = filtered.filter(r => normalizeTemp(r.temperatura) === "QUENTE" && ((r as any)._status_resposta || '') !== "respondeu");

    return {
      robots,
      mediaFups,
      mediaFupsAteResp,
      excessoFups,
      fupEntries: fupEntries.length,
      respondidosCount: respondidos.length,
      totalEnviados,
      totalResponderam,
      qualificados,
      ignorando3dLeads,
      quentesSemRespLeads,
    };
  }, [filtered]);

  /* ── Alerts ── */
  const alerts = useMemo(() => {
    const result: Array<{ id: string; type: "alert" | "info" | "success"; title: string; desc: string; leads: SolLead[] }> = [];
    if (robotData.ignorando3dLeads.length > 0) {
      result.push({
        id: "sem-resp-72h",
        type: "alert",
        title: `${robotData.ignorando3dLeads.length} leads sem resposta há +3 dias`,
        desc: "Status de resposta ≠ «respondeu» e mais de 72h desde cadastro.",
        leads: robotData.ignorando3dLeads,
      });
    }
    if (robotData.quentesSemRespLeads.length > 0) {
      result.push({
        id: "quentes-sem-resp",
        type: "alert",
        title: `${robotData.quentesSemRespLeads.length} leads quentes sem resposta`,
        desc: "Temperatura QUENTE e ainda sem «respondeu» no status.",
        leads: robotData.quentesSemRespLeads,
      });
    }
    if (kpis.total > 0) {
      const respLeads = filtered.filter(r => ((r as any)._status_resposta || '') === "respondeu");
      result.push({
        id: "taxa-resposta",
        type: "info",
        title: `Taxa de resposta: ${safeToFixed(kpis.taxaResposta, 0)}%`,
        desc: `${kpis.responderam} de ${kpis.total} leads responderam.`,
        leads: respLeads,
      });
    }
    if (kpis.quentes > 0) {
      const quenteLeads = filtered.filter(r => normalizeTemp(r.temperatura) === "QUENTE");
      result.push({
        id: "dist-temp",
        type: "success",
        title: `${kpis.quentes} leads quentes`,
        desc: `${kpis.mornos} mornos · ${kpis.frios} frios · ${kpis.semTemp} s/ temp.`,
        leads: quenteLeads,
      });
    }
    return result;
  }, [kpis, robotData, filtered]);

  return {
    kpis,
    funnelData,
    maxFunnel,
    funnelSum,
    slaData,
    robotData,
    alerts
  };
}
