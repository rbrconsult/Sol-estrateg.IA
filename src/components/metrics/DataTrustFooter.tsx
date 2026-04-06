import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { BRAND_FOOTER_TAGLINE } from "@/constants/branding";

export function formatDataTrustTimestamp(ts: number | undefined): string {
  if (ts == null || ts <= 0) return "—";
  try {
    return format(new Date(ts), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return "—";
  }
}

export type DataTrustLine = {
  label: string;
  source: string;
  /** React Query dataUpdatedAt (ms) */
  fetchedAt?: number;
  extra?: string;
};

type DataTrustFooterProps = {
  lines: DataTrustLine[];
  className?: string;
};

export function DataTrustFooter({ lines, className }: DataTrustFooterProps) {
  return (
    <footer className={cn("border-t border-border/50 pt-4 mt-6 space-y-1.5", className)}>
      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/90">
        Confiança nos dados
      </p>
      {lines.map((l) => (
        <p key={l.label} className="text-[10px] text-muted-foreground leading-snug">
          <span className="font-medium text-foreground/80">{l.label}:</span> {l.source}
          {l.fetchedAt ? ` · consulta ${formatDataTrustTimestamp(l.fetchedAt)}` : ""}
          {l.extra ? ` · ${l.extra}` : ""}
        </p>
      ))}
      <p className="text-[9px] text-muted-foreground/70 pt-1">
        Valores monetários do comercial usam <code className="text-[9px]">valor_proposta</code> em{" "}
        <code className="text-[9px]">sol_projetos_sync</code> (último evento por <code className="text-[9px]">project_id</code>
        ). Detalhes em <code className="text-[9px]">docs/metricas-fase-a.md</code>.
      </p>
      <p className="text-[9px] text-muted-foreground/60 pt-2 text-center">{BRAND_FOOTER_TAGLINE}</p>
    </footer>
  );
}
