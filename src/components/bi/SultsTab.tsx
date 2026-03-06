import { Badge } from "@/components/ui/badge";
import { sultsMockData } from "@/data/biMockData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

export function SultsTab() {
  const { funilOperacional, eficiencia } = sultsMockData;

  return (
    <div className="space-y-6">
      <Badge variant="outline" className="border-warning/50 text-warning text-xs">
        ⏳ Aguardando integração Sults API — dados simulados
      </Badge>

      {/* V12: Funil Operacional Pós-venda */}
      <div className="rounded-lg border bg-card border-border/50 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">Funil Operacional Pós-venda</h3>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-4">Da venda à homologação</p>
        <div className="flex flex-wrap gap-2">
          {funilOperacional.map((stage, i) => {
            const prev = i > 0 ? funilOperacional[i - 1].valor : stage.valor;
            const pct = prev > 0 ? Math.round((stage.valor / prev) * 100) : 100;
            return (
              <div key={stage.etapa} className="flex-1 min-w-[110px] rounded-lg border border-border/50 p-3 text-center hover:border-primary/40 transition-colors">
                <span className="text-lg">{stage.icon}</span>
                <p className="text-2xl font-extrabold tabular-nums text-foreground mt-1">{stage.valor}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stage.etapa}</p>
                {i > 0 && <p className="text-[10px] text-primary font-semibold mt-1">{pct}%</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* V13: Eficiência Técnica */}
      <div className="rounded-lg border bg-card border-border/50 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">Eficiência Técnica</h3>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-4">Performance das equipes de instalação</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Equipe</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Instalações</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Tempo Médio (dias)</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Satisfação</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Retrabalho %</th>
              </tr>
            </thead>
            <tbody>
              {eficiencia.map((e, i) => (
                <tr key={i} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="py-2 px-3 text-foreground font-medium">{e.equipe}</td>
                  <td className="text-right py-2 px-3 tabular-nums font-semibold">{e.instalacoes}</td>
                  <td className="text-right py-2 px-3 tabular-nums">{e.tempoMedio}</td>
                  <td className="text-right py-2 px-3">
                    <span className={`font-bold ${e.satisfacao >= 4.5 ? 'text-primary' : e.satisfacao >= 4 ? 'text-warning' : 'text-destructive'}`}>
                      ⭐ {e.satisfacao}
                    </span>
                  </td>
                  <td className="text-right py-2 px-3">
                    <span className={`font-bold ${e.retrabalho <= 3 ? 'text-primary' : e.retrabalho <= 6 ? 'text-warning' : 'text-destructive'}`}>
                      {e.retrabalho}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
