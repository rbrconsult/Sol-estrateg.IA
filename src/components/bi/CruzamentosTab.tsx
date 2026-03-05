import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { cruzamentosMock } from "@/data/biMockData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface Aproveitamento {
  totalQualificados: number; avancaram: number; fecharam: number;
  taxaAproveitamento: number; taxaFechamento: number;
}

interface PerfilItem {
  origem: string; fechados: number; valorTotal: number; ticketMedio: number;
}

interface VelocidadeItem {
  faixa: string; total: number; ganhos: number; taxa: number;
}

interface LeadRisco {
  nome: string; etapa: string; temperatura: string; tempoNaEtapa: number; valor: number; score: number;
}

interface Props {
  cruzamentosB: { aproveitamento: Aproveitamento; perfil: PerfilItem[]; velocidadeConversao: VelocidadeItem[] } | null;
  leadsEmRisco: LeadRisco[];
  isLoading: boolean;
}

function formatCurrency(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
  return `R$ ${v.toFixed(0)}`;
}

export function CruzamentosTab({ cruzamentosB, leadsEmRisco, isLoading }: Props) {
  const { custoRealLeadQualificado, criativoPerfilErrado, janelaOuro, cacReal, ltvPerfil } = cruzamentosMock;

  return (
    <div className="space-y-8">
      {/* ═══ GRUPO A — Ads × SDR ═══ */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-base font-bold text-foreground">Grupo A — Ads × SDR</h2>
          <Badge variant="outline" className="border-warning/50 text-warning text-xs">Mock — depende de Ads</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* C1: Custo real por lead qualificado */}
          <div className="rounded-lg border bg-card border-border/50 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-1">C1 — Custo Real por Lead Qualificado</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">CPL bruto vs CPL qualificado</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-1.5 px-2 text-muted-foreground text-xs">Canal</th>
                    <th className="text-right py-1.5 px-2 text-muted-foreground text-xs">CPL Bruto</th>
                    <th className="text-right py-1.5 px-2 text-muted-foreground text-xs">CPL Qualif.</th>
                    <th className="text-right py-1.5 px-2 text-muted-foreground text-xs">Desperdício</th>
                  </tr>
                </thead>
                <tbody>
                  {custoRealLeadQualificado.map((r, i) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="py-1.5 px-2 font-medium text-foreground">{r.canal}</td>
                      <td className="text-right py-1.5 px-2 tabular-nums">R$ {r.cplBruto}</td>
                      <td className="text-right py-1.5 px-2 tabular-nums font-semibold">R$ {r.cplQualificado}</td>
                      <td className="text-right py-1.5 px-2 tabular-nums text-destructive">{r.desperdicio}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* C2: Criativos que atraem perfil errado */}
          <div className="rounded-lg border bg-card border-border/50 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-1">C2 — Criativos com Perfil Errado</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Anúncios com alta rejeição</p>
            <div className="space-y-3">
              {criativoPerfilErrado.map((c, i) => (
                <div key={i} className="rounded-lg border border-border/50 p-3">
                  <p className="text-sm font-semibold text-foreground">{c.criativo}</p>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs text-muted-foreground">{c.leads} leads</span>
                    <span className="text-xs text-primary">{c.qualificados} qualif.</span>
                    <span className="text-xs text-destructive font-bold">{c.pctErrado}% errado</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Motivo: {c.motivoPrincipal}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* C3: Janela de Ouro */}
        <div className="rounded-lg border bg-card border-border/50 p-4 mt-4">
          <h3 className="text-sm font-semibold text-foreground mb-1">C3 — Janela de Ouro por Horário</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Quando os leads mais convertem</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={janelaOuro} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="horario" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="taxaConversao" name="Conversão %" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="taxaResposta" name="Resposta %" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ═══ GRUPO B — SDR × SolarMarket ═══ */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-base font-bold text-foreground">Grupo B — SDR × SolarMarket</h2>
          {cruzamentosB && <Badge variant="outline" className="border-primary/50 text-primary text-xs">Dados Reais</Badge>}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : cruzamentosB ? (
          <div className="space-y-4">
            {/* C4: Aproveitamento */}
            <div className="rounded-lg border bg-card border-border/50 p-4">
              <h3 className="text-sm font-semibold text-foreground mb-1">C4 — Aproveitamento do Lead Qualificado</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">O que acontece após o MQL</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-extrabold tabular-nums text-foreground">{cruzamentosB.aproveitamento.totalQualificados}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Qualificados</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-extrabold tabular-nums text-info">{cruzamentosB.aproveitamento.avancaram}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Avançaram</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-extrabold tabular-nums text-primary">{cruzamentosB.aproveitamento.taxaAproveitamento}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Aproveitamento</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-extrabold tabular-nums text-primary">{cruzamentosB.aproveitamento.taxaFechamento}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Fechamento</p>
                </div>
              </div>
            </div>

            {/* C5: Perfil do lead que fecha */}
            <div className="rounded-lg border bg-card border-border/50 p-4">
              <h3 className="text-sm font-semibold text-foreground mb-1">C5 — Perfil do Lead que Fecha</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Origem dos negócios ganhos</p>
              {cruzamentosB.perfil.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-1.5 px-2 text-muted-foreground text-xs">Origem</th>
                        <th className="text-right py-1.5 px-2 text-muted-foreground text-xs">Fechados</th>
                        <th className="text-right py-1.5 px-2 text-muted-foreground text-xs">Valor Total</th>
                        <th className="text-right py-1.5 px-2 text-muted-foreground text-xs">Ticket Médio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cruzamentosB.perfil.map((p, i) => (
                        <tr key={i} className="border-b border-border/30">
                          <td className="py-1.5 px-2 font-medium text-foreground">{p.origem}</td>
                          <td className="text-right py-1.5 px-2 tabular-nums font-semibold text-primary">{p.fechados}</td>
                          <td className="text-right py-1.5 px-2 tabular-nums">{formatCurrency(p.valorTotal)}</td>
                          <td className="text-right py-1.5 px-2 tabular-nums">{formatCurrency(p.ticketMedio)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">Sem dados de negócios ganhos</p>
              )}
            </div>

            {/* C6: Velocidade × Conversão */}
            <div className="rounded-lg border bg-card border-border/50 p-4">
              <h3 className="text-sm font-semibold text-foreground mb-1">C6 — Velocidade × Conversão</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Tempo do projeto à proposta vs taxa de fechamento</p>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cruzamentosB.velocidadeConversao} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="faixa" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="total" name="Total" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ganhos" name="Ganhos" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">Sem dados cruzados disponíveis</p>
        )}
      </section>

      {/* ═══ GRUPO D — Todos × Todos ═══ */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-base font-bold text-foreground">Grupo D — Métricas Consolidadas</h2>
          <Badge variant="outline" className="border-warning/50 text-warning text-xs">Parcial</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* C10: CAC Real */}
          <div className="rounded-lg border bg-card border-border/50 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-1">C10 — CAC Real</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Custo de Aquisição de Cliente</p>
            <Badge variant="outline" className="border-warning/50 text-warning text-[10px] mb-3">Mock</Badge>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Ads</p>
                <p className="text-lg font-bold tabular-nums text-foreground">R$ {cacReal.ads.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">SDR</p>
                <p className="text-lg font-bold tabular-nums text-foreground">R$ {cacReal.sdr.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Closer</p>
                <p className="text-lg font-bold tabular-nums text-foreground">R$ {cacReal.closer.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CAC / Venda</p>
                <p className="text-lg font-bold tabular-nums text-primary">R$ {cacReal.porVenda.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* C11: LTV por Perfil */}
          <div className="rounded-lg border bg-card border-border/50 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-1">C11 — LTV por Perfil</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Lifetime Value</p>
            <Badge variant="outline" className="border-warning/50 text-warning text-[10px] mb-3">Mock</Badge>
            <div className="space-y-2">
              {ltvPerfil.map((l, i) => (
                <div key={i} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                  <span className="text-xs text-foreground">{l.perfil}</span>
                  <span className="text-xs font-bold tabular-nums text-primary">{formatCurrency(l.ltv)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* C14: Leads em Risco — DADOS REAIS */}
        <div className="rounded-lg border bg-card border-border/50 p-4 mt-4">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-sm font-semibold text-foreground">C14 — Leads em Risco → FUP Automático</h3>
            {leadsEmRisco.length > 0 && <Badge variant="outline" className="border-primary/50 text-primary text-xs">Dados Reais</Badge>}
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Leads parados ou frios que precisam de ação</p>
          {leadsEmRisco.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-1.5 px-2 text-muted-foreground text-xs">Nome</th>
                    <th className="text-left py-1.5 px-2 text-muted-foreground text-xs">Etapa</th>
                    <th className="text-center py-1.5 px-2 text-muted-foreground text-xs">Temp.</th>
                    <th className="text-right py-1.5 px-2 text-muted-foreground text-xs">Dias Parado</th>
                    <th className="text-right py-1.5 px-2 text-muted-foreground text-xs">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {leadsEmRisco.slice(0, 10).map((l, i) => (
                    <tr key={i} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="py-1.5 px-2 text-foreground font-medium truncate max-w-[160px]">{l.nome}</td>
                      <td className="py-1.5 px-2 text-muted-foreground text-xs">{l.etapa}</td>
                      <td className="text-center py-1.5 px-2">
                        <span className={`text-xs font-bold ${l.temperatura === 'QUENTE' ? 'text-destructive' : l.temperatura === 'MORNO' ? 'text-warning' : 'text-info'}`}>
                          {l.temperatura === 'QUENTE' ? '🔥' : l.temperatura === 'MORNO' ? '🌡' : '❄️'} {l.temperatura}
                        </span>
                      </td>
                      <td className="text-right py-1.5 px-2 tabular-nums font-bold text-destructive">{l.tempoNaEtapa}d</td>
                      <td className="text-right py-1.5 px-2 tabular-nums">{formatCurrency(l.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">Nenhum lead em risco identificado</p>
          )}
        </div>
      </section>
    </div>
  );
}
