import { useState, useEffect, useRef, useCallback } from "react";
import {
  kpis, roiData, funnelData, weeklyLeads, insights,
  leadsTable, origemLeads, solPerformance, atividadeRecente,
} from "@/data/conferenciaMockData";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip,
} from "recharts";

/* ───────── font import (inline style tag) ───────── */
const FontImport = () => (
  <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap');`}</style>
);

/* ───────── animated counter hook ───────── */
function useAnimatedNumber(target: number, duration = 1200, isDecimal = false) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(isDecimal ? +(target * eased).toFixed(1) : Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, isDecimal]);

  return { value, ref };
}

/* ───────── score ring ───────── */
function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? "#EF476F" : score >= 60 ? "#F5A623" : score >= 50 ? "#118AB2" : "#6B7A99";
  const pct = (score / 100) * 100;
  return (
    <div className="relative h-9 w-9 flex items-center justify-center">
      <svg className="absolute inset-0" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset="25"
          strokeLinecap="round" className="transition-all duration-1000"
        />
      </svg>
      <span className="text-xs font-bold" style={{ fontFamily: "JetBrains Mono", color }}>{score}</span>
    </div>
  );
}

/* ───────── temp badge ───────── */
function TempBadge({ temp }: { temp: string }) {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    QUENTE: { bg: "rgba(239,71,111,0.15)", text: "#EF476F", dot: "🔴" },
    MORNO: { bg: "rgba(245,166,35,0.15)", text: "#F5A623", dot: "🟡" },
    FRIO: { bg: "rgba(17,138,178,0.15)", text: "#118AB2", dot: "🔵" },
  };
  const s = map[temp] || map.MORNO;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: s.bg, color: s.text, fontFamily: "JetBrains Mono" }}>
      {s.dot} {temp}
    </span>
  );
}

/* ═══════════════════ MAIN PAGE ═══════════════════ */
export default function Conferencia() {
  /* clock */
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* funnel animation */
  const [funnelVisible, setFunnelVisible] = useState(false);
  const funnelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = funnelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setFunnelVisible(true); }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const maxFunnel = Math.max(...funnelData.map((f) => f.valor));

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#080C12", color: "#F0F4FF", fontFamily: "'JetBrains Mono', monospace" }}>
      <FontImport />

      {/* ── blobs ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.07] animate-pulse"
          style={{ background: "radial-gradient(circle, #F5A623, transparent 70%)", filter: "blur(120px)" }} />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.07] animate-pulse"
          style={{ background: "radial-gradient(circle, #06D6A0, transparent 70%)", filter: "blur(120px)", animationDelay: "3s" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

        {/* ══════ HEADER ══════ */}
        <header className="sticky top-0 z-50 py-4 flex items-center justify-between backdrop-blur-xl"
          style={{ background: "rgba(8,12,18,0.85)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight" style={{ fontFamily: "Syne, sans-serif" }}>
            🌞 SOL SDR — <span style={{ color: "#F5A623" }}>Painel Estratégico</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: "rgba(6,214,160,0.15)", color: "#06D6A0" }}>
              <span className="h-2 w-2 rounded-full bg-[#06D6A0] animate-pulse" /> AO VIVO
            </span>
            <span className="text-sm font-medium" style={{ color: "#6B7A99" }}>
              {time.toLocaleTimeString("pt-BR")}
            </span>
          </div>
        </header>

        {/* ══════ SEÇÃO 1 — KPIs ══════ */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
          {kpis.map((k, i) => {
            const { value: animVal, ref } = useAnimatedNumber(k.value, 1400, k.isDecimal);
            return (
              <div key={i} ref={ref}
                className="rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/10"
                style={{ background: "#0D1420", borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="h-1 w-full rounded-full mb-3" style={{ background: k.color }} />
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#6B7A99" }}>{k.label}</p>
                <p className="text-3xl font-extrabold" style={{ color: k.color, fontFamily: "Syne" }}>
                  {animVal}{k.suffix || ""}
                </p>
                {k.trend && (
                  <span className="text-xs font-semibold mt-1 inline-block" style={{ color: "#06D6A0" }}>
                    ↑ {k.trend}%
                  </span>
                )}
              </div>
            );
          })}
        </section>

        {/* ══════ SEÇÃO 2 — ROI Destaque ══════ */}
        <section className="mt-8 rounded-xl border relative overflow-hidden p-6 md:p-8"
          style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.08), rgba(6,214,160,0.08))", borderColor: "rgba(255,255,255,0.06)" }}>
          <span className="absolute -right-8 -top-8 text-[140px] font-extrabold opacity-[0.04] select-none pointer-events-none"
            style={{ fontFamily: "Syne", color: "#F5A623" }}>ROI</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#6B7A99" }}>Custo por Lead Qualificado</p>
              <p className="text-4xl font-extrabold" style={{ fontFamily: "Syne", color: "#06D6A0" }}>R$ 6</p>
              <p className="text-sm mt-1" style={{ color: "#6B7A99" }}>vs <span style={{ color: "#EF476F" }}>R$ 420</span> SDR humano</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#6B7A99" }}>Faturamento Potencial</p>
              <p className="text-4xl font-extrabold" style={{ fontFamily: "Syne", color: "#F5A623" }}>R$ 1.8M</p>
              <p className="text-sm mt-1" style={{ color: "#6B7A99" }}>284 leads × ticket R$ 28k</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#6B7A99" }}>Economia Mensal</p>
              <p className="text-4xl font-extrabold" style={{ fontFamily: "Syne", color: "#06D6A0" }}>R$ 11.4k</p>
              <p className="text-sm mt-1" style={{ color: "#6B7A99" }}>Escala sem aumentar time</p>
            </div>
          </div>
        </section>

        {/* ══════ SEÇÃO 3 — Grid 2/3 (Funil + Insights) ══════ */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Funil + Weekly chart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Funil horizontal */}
            <div ref={funnelRef} className="rounded-xl border p-6" style={{ background: "#0D1420", borderColor: "rgba(255,255,255,0.06)" }}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ fontFamily: "Syne", color: "#F0F4FF" }}>
                Funil de Leads
              </h3>
              <div className="space-y-3">
                {funnelData.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-40 text-xs truncate" style={{ color: "#6B7A99" }}>{f.etapa}</span>
                    <div className="flex-1 h-7 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div
                        className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-1000 ease-out"
                        style={{
                          width: funnelVisible ? `${(f.valor / maxFunnel) * 100}%` : "0%",
                          background: f.color,
                          transitionDelay: `${i * 100}ms`,
                        }}
                      >
                        <span className="text-xs font-bold text-white drop-shadow">{f.valor}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly chart */}
            <div className="rounded-xl border p-6" style={{ background: "#0D1420", borderColor: "rgba(255,255,255,0.06)" }}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ fontFamily: "Syne", color: "#F0F4FF" }}>
                Leads por Semana
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyLeads} barCategoryGap="20%">
                  <XAxis dataKey="semana" tick={{ fill: "#6B7A99", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: "#0D1420", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#F0F4FF" }}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Bar dataKey="leads" radius={[6, 6, 0, 0]}>
                    {weeklyLeads.map((_, i) => (
                      <Cell key={i} fill={i === weeklyLeads.length - 1 ? "#06D6A0" : "rgba(245,166,35,0.5)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insights */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ fontFamily: "Syne", color: "#F0F4FF" }}>
              Insights
            </h3>
            {insights.map((ins, i) => (
              <div key={i}
                className="rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/10"
                style={{ background: "#0D1420", borderColor: "rgba(255,255,255,0.06)", borderLeft: `3px solid ${ins.borderColor}` }}>
                <div className="flex items-start gap-2">
                  <span className="text-sm">{ins.icon}</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-0.5"
                      style={{ color: ins.borderColor }}>
                      {ins.type === "alert" ? "ALERT" : ins.type === "info" ? "INFO" : "OK"}
                    </p>
                    <p className="text-sm font-semibold mb-1" style={{ color: "#F0F4FF" }}>{ins.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "#6B7A99" }}>{ins.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════ SEÇÃO 4 — Tabela ══════ */}
        <section className="mt-8 rounded-xl border overflow-hidden" style={{ background: "#0D1420", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="p-6 pb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ fontFamily: "Syne", color: "#F0F4FF" }}>
              Leads Qualificados
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Cliente", "Cidade", "Valor Conta", "Score", "Temperatura", "Etapa", "Responsável", "Data"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7A99" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leadsTable.map((l, i) => (
                  <tr key={i} className="transition-colors hover:bg-white/[0.02]"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="px-4 py-3 font-medium" style={{ color: "#F0F4FF" }}>{l.nome}</td>
                    <td className="px-4 py-3" style={{ color: "#6B7A99" }}>{l.cidade}</td>
                    <td className="px-4 py-3" style={{ color: "#6B7A99" }}>{l.valorConta}</td>
                    <td className="px-4 py-3"><ScoreRing score={l.score} /></td>
                    <td className="px-4 py-3"><TempBadge temp={l.temperatura} /></td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#F0F4FF" }}>
                        {l.etapa}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: "#6B7A99" }}>{l.responsavel}</td>
                    <td className="px-4 py-3" style={{ color: "#6B7A99" }}>{l.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ══════ SEÇÃO 5 — Bottom Grid ══════ */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Origem */}
          <div className="rounded-xl border p-6" style={{ background: "#0D1420", borderColor: "rgba(255,255,255,0.06)" }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ fontFamily: "Syne", color: "#F0F4FF" }}>Origem dos Leads</h3>
            <div className="space-y-3">
              {origemLeads.map((o, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-24 text-xs" style={{ color: "#6B7A99" }}>{o.origem}</span>
                  <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="h-full rounded-full" style={{ width: `${o.pct * 3}%`, background: o.color }} />
                  </div>
                  <span className="text-xs font-bold w-8 text-right" style={{ color: "#F0F4FF" }}>{o.valor}</span>
                  <span className="text-xs w-10 text-right" style={{ color: "#6B7A99" }}>{o.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Sol */}
          <div className="rounded-xl border p-6" style={{ background: "#0D1420", borderColor: "rgba(255,255,255,0.06)" }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ fontFamily: "Syne", color: "#F0F4FF" }}>Performance Sol</h3>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: "Score Médio", val: solPerformance.scoreMedio, color: "#F5A623" },
                { label: "Taxa Qualif.", val: `${solPerformance.taxaQualificacao}%`, color: "#06D6A0" },
                { label: "Resp. Médio", val: `${solPerformance.respostMedia}s`, color: "#118AB2" },
                { label: "Agendados", val: solPerformance.agendados, color: "#F5A623" },
              ].map((m, i) => (
                <div key={i} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <p className="text-xs mb-0.5" style={{ color: "#6B7A99" }}>{m.label}</p>
                  <p className="text-xl font-extrabold" style={{ fontFamily: "Syne", color: m.color }}>{m.val}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {solPerformance.temperaturas.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-16 text-xs" style={{ color: "#6B7A99" }}>{t.label}</span>
                  <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="h-full rounded-full" style={{ width: `${t.pct}%`, background: t.color }} />
                  </div>
                  <span className="text-xs font-bold w-12 text-right" style={{ color: t.color }}>{t.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Atividade Recente */}
          <div className="rounded-xl border p-6" style={{ background: "#0D1420", borderColor: "rgba(255,255,255,0.06)" }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ fontFamily: "Syne", color: "#F0F4FF" }}>Atividade Recente</h3>
            <div className="space-y-4">
              {atividadeRecente.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-lg">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#F0F4FF" }}>{a.nome}</p>
                    <p className="text-xs" style={{ color: "#6B7A99" }}>{a.detalhe}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{ background: `${a.badgeColor}20`, color: a.badgeColor }}>
                    {a.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ RODAPÉ ══════ */}
        <footer className="mt-16 mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] font-bold" style={{ color: "rgba(107,122,153,0.4)" }}>
            RBR CONSULT × EVOLVE ENERGIA SOLAR
          </p>
        </footer>
      </div>
    </div>
  );
}
