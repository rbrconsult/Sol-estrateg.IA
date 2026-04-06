import { RotateCcw } from "lucide-react";
import type { FupFrio } from "@/hooks/useConferenciaData";

type Props = { fupFrio: FupFrio; className?: string };

/**
 * Quadrante “FUP Frio — Dinheiro na Mesa” (métricas de repescagem e valor).
 */
export function FupFrioMoneyCard({ fupFrio, className }: Props) {
  return (
    <div className={`rounded-lg border border-success/30 bg-success/5 p-4 ${className ?? ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <RotateCcw className="h-4 w-4 text-success" />
        <p className="text-[10px] text-success uppercase tracking-wider font-bold">FUP Frio — Dinheiro na Mesa</p>
      </div>
      <p className="text-[10px] text-muted-foreground mb-3 leading-snug">
        De <span className="font-semibold text-foreground">{fupFrio.totalRecebidos}</span> recebidos,{" "}
        <span className="font-semibold text-foreground">{fupFrio.entraram}</span> passaram pelo FUP Frio (
        <span className="text-success font-medium">{fupFrio.pctBaseComFup}%</span> da base).
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center rounded-md border border-success/20 bg-background/40 p-2">
          <p className="text-2xl font-extrabold text-success tabular-nums">{fupFrio.reativados}</p>
          <p className="text-[10px] text-muted-foreground mt-1">responderam no FUP</p>
          <p className="text-[9px] text-success/80 tabular-nums">{fupFrio.pctReativados}% do FUP</p>
        </div>
        <div className="text-center rounded-md border border-success/20 bg-background/40 p-2">
          <p className="text-2xl font-extrabold text-foreground tabular-nums">{fupFrio.fechadosComFup}</p>
          <p className="text-[10px] text-muted-foreground mt-1">ganhos após FUP</p>
          <p className="text-[9px] text-muted-foreground tabular-nums">{fupFrio.pctGanhosQuePassaramFup}% dos ganhos (qtd)</p>
        </div>
        <div className="text-center rounded-md border border-success/20 bg-background/40 p-2 col-span-2">
          <p className="text-xl font-extrabold text-success tabular-nums">{fupFrio.valorFechadosComFup}</p>
          <p className="text-[10px] text-muted-foreground mt-1">valor (conta de luz / est.) — fechados com FUP na jornada</p>
          <p className="text-[9px] text-muted-foreground mt-0.5 min-h-[2rem]">
            {fupFrio.fechadosComFup === 0 && fupFrio.reativados > 0 && (
              <span className="italic">
                Sem ganho no lead ainda: estimativa operacional em valor recuperado ({fupFrio.valorRecuperado}).
              </span>
            )}
            {fupFrio.fechadosComFup > 0 && (
              <span>
                <span className="font-semibold text-success">{fupFrio.pctValorGanhosViaFup}%</span> do valor total dos ganhos
                (neste recorte) veio de leads com FUP.
              </span>
            )}
            {fupFrio.entraram === 0 && (
              <span className="italic">Nenhum lead com FUP (fup_followup_count ≥ 1 ou etapa FOLLOW UP) no período.</span>
            )}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xl font-extrabold text-foreground tabular-nums">{fupFrio.conversaoPosResgate}%</p>
          <p className="text-[10px] text-muted-foreground mt-1">resposta dentro do FUP</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-extrabold text-foreground tabular-nums">
            {Number.isFinite(fupFrio.diasAteReativar) && fupFrio.diasAteReativar > 0
              ? `${Number(fupFrio.diasAteReativar).toFixed(1)}d`
              : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">tempo médio até resposta (cadastro → FUP/interação)</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-success/20 text-center space-y-1">
        <p className="text-[10px] text-muted-foreground">
          Ticket médio (bloco): <span className="font-semibold text-foreground">{fupFrio.ticketMedio}</span>
        </p>
        <p className="text-[9px] text-muted-foreground/80 leading-snug">
          Ganhos = status no <code className="text-[9px]">sol_leads_sync</code> (GANHO/FECHADO/VENDA). Cruzamento com SM via{" "}
          <code className="text-[9px]">project_id</code> quando necessário.
        </p>
      </div>
    </div>
  );
}
