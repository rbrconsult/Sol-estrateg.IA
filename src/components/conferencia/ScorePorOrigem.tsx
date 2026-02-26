interface ScoreItem {
  origem: string;
  score: number;
  leads: number;
}

export function ScorePorOrigem({ data }: { data: ScoreItem[] }) {
  const maxScore = Math.max(...data.map((d) => d.score));

  return (
    <div className="rounded-lg border border-border/50 bg-card p-4">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">Score Médio por Origem</p>
      <div className="space-y-2.5">
        {data.map((d) => (
          <div key={d.origem} className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-20 shrink-0 truncate">{d.origem}</span>
            <div className="flex-1 h-5 bg-secondary/50 rounded overflow-hidden">
              <div
                className="h-full bg-primary/60 rounded transition-all duration-700"
                style={{ width: `${(d.score / maxScore) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-foreground tabular-nums w-8 text-right">{d.score}</span>
            <span className="text-[9px] text-muted-foreground/60 tabular-nums w-16 text-right">{d.leads} leads</span>
          </div>
        ))}
      </div>
    </div>
  );
}
