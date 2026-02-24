import { useState, useEffect } from "react";
import { Target, Pencil, Check } from "lucide-react";
import { formatCurrencyAbbrev } from "@/lib/formatters";

interface GoalProgressProps {
  valorFechado: number;
  receitaPrevista: number;
}

const STORAGE_KEY = "sol_insights_meta";

export function GoalProgress({ valorFechado, receitaPrevista }: GoalProgressProps) {
  const [meta, setMeta] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : 5_000_000;
  });
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(meta.toString());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, meta.toString());
  }, [meta]);

  const pctFechado = meta > 0 ? Math.min((valorFechado / meta) * 100, 100) : 0;
  const pctPrevisto = meta > 0 ? Math.min((receitaPrevista / meta) * 100, 100 - pctFechado) : 0;
  const pctTotal = pctFechado + pctPrevisto;
  const gap = Math.max(meta - valorFechado - receitaPrevista, 0);

  const handleSave = () => {
    const v = Number(inputVal);
    if (v > 0) setMeta(v);
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Meta vs Realizado</h3>
        </div>
        {editing ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">R$</span>
            <input
              type="number"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              className="w-28 rounded-md border border-input bg-background px-2 py-1 text-xs"
              autoFocus
              onKeyDown={e => e.key === "Enter" && handleSave()}
            />
            <button onClick={handleSave} className="p-1 rounded hover:bg-muted">
              <Check className="h-3.5 w-3.5 text-primary" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setInputVal(meta.toString()); setEditing(true); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Meta: {formatCurrencyAbbrev(meta)}
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-6 w-full rounded-full bg-muted/30 overflow-hidden">
        {/* Fechado */}
        <div
          className="absolute left-0 top-0 h-full bg-primary rounded-l-full transition-all duration-500"
          style={{ width: `${pctFechado}%` }}
        />
        {/* Previsto */}
        <div
          className="absolute top-0 h-full bg-info/60 transition-all duration-500"
          style={{ left: `${pctFechado}%`, width: `${pctPrevisto}%` }}
        />
      </div>

      {/* Labels */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            Fechado: {formatCurrencyAbbrev(valorFechado)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-info/60" />
            Previsto: {formatCurrencyAbbrev(receitaPrevista)}
          </span>
        </div>
        <span className="font-semibold text-foreground">
          {pctTotal.toFixed(0)}% da meta
        </span>
      </div>

      {gap > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Gap: <span className="font-medium text-destructive">{formatCurrencyAbbrev(gap)}</span> para atingir a meta
        </p>
      )}
    </div>
  );
}
