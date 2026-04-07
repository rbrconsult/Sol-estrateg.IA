import { useState, useRef, useEffect } from "react";

function useAnimatedNumber(target: number, duration = 1200, isDecimal = false) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    started.current = false;
    setValue(0);
  }, [target]);

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

function KPICard({ label, value, suffix, isDecimal }: { label: string; value: number; suffix?: string; isDecimal?: boolean }) {
  const { value: animVal, ref } = useAnimatedNumber(value, 1400, isDecimal);
  return (
    <div ref={ref} className="rounded-lg border border-border/50 bg-card p-4 transition-all duration-200 hover:border-border">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">{label}</p>
      <p className="text-2xl font-bold text-foreground tabular-nums">{animVal}{suffix || ""}</p>
    </div>
  );
}

interface LeadsKPIsProps {
  kpis: {
    total: number;
    quentes: number;
    mornos: number;
    frios: number;
    semTemp: number;
    taxaResposta: number;
    scoreMedio: number;
  };
}

export function LeadsKPIs({ kpis }: LeadsKPIsProps) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-7 gap-3 mt-4">
      <KPICard label="Leads Recebidos" value={kpis.total} />
      <KPICard label="Quentes" value={kpis.quentes} />
      <KPICard label="Mornos" value={kpis.mornos} />
      <KPICard label="Frios" value={kpis.frios} />
      <KPICard label="S/ Classificação" value={kpis.semTemp} />
      <KPICard label="Taxa Resposta" value={kpis.taxaResposta} suffix="%" isDecimal />
      <KPICard label="Score Médio" value={kpis.scoreMedio} isDecimal />
    </section>
  );
}
