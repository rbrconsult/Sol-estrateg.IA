import { Badge } from "@/components/ui/badge";
import { adsMockData } from "@/data/biMockData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";

export function AdsTab() {
  const { volumeCPL, criativos, sazonalidade, geografia } = adsMockData;

  return (
    <div className="space-y-6">
      <Badge variant="outline" className="border-warning/50 text-warning text-xs">
        ⏳ Aguardando integração Meta / Google Ads — dados simulados
      </Badge>

      {/* V1: Volume & CPL por Canal */}
      <div className="rounded-lg border bg-card border-border/50 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">Volume & CPL por Canal</h3>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-4">Leads gerados e custo por lead</p>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volumeCPL} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="canal" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="leads" name="Leads" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="cpl" name="CPL (R$)" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* V2: Qualidade por Criativo */}
      <div className="rounded-lg border bg-card border-border/50 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">Qualidade por Criativo</h3>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-4">Score de performance dos anúncios</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Criativo</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Tipo</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Impressões</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Leads</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">CPL</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Score</th>
              </tr>
            </thead>
            <tbody>
              {criativos.map((c, i) => (
                <tr key={i} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="py-2 px-3 text-foreground font-medium">{c.nome}</td>
                  <td className="text-right py-2 px-3 text-muted-foreground">{c.tipo}</td>
                  <td className="text-right py-2 px-3 tabular-nums">{c.impressoes.toLocaleString()}</td>
                  <td className="text-right py-2 px-3 tabular-nums font-semibold">{c.leads}</td>
                  <td className="text-right py-2 px-3 tabular-nums">R$ {c.cpl}</td>
                  <td className="text-right py-2 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${c.score >= 75 ? 'bg-primary/20 text-primary' : c.score >= 60 ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive'}`}>
                      {c.score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* V3: Sazonalidade */}
      <div className="rounded-lg border bg-card border-border/50 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">Sazonalidade</h3>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-4">Tendência mensal de leads e CPL</p>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sazonalidade}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="left" type="monotone" dataKey="leads" name="Leads" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="cpl" name="CPL (R$)" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* V4: Geografia */}
      <div className="rounded-lg border bg-card border-border/50 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">Geografia</h3>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-4">Performance por região</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Região</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Leads</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Conversão</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Ticket Médio</th>
              </tr>
            </thead>
            <tbody>
              {geografia.map((g, i) => (
                <tr key={i} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="py-2 px-3 text-foreground font-medium">{g.regiao}</td>
                  <td className="text-right py-2 px-3 tabular-nums font-semibold">{g.leads}</td>
                  <td className="text-right py-2 px-3 tabular-nums">{g.conversao}%</td>
                  <td className="text-right py-2 px-3 tabular-nums">R$ {g.ticketMedio.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
