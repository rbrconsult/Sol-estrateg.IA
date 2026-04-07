import { useMemo, useState, type ComponentType } from "react";
import { useCommercialProposals } from "@/hooks/useCommercialProposals";
import { FORECAST_EXPECTED_CLOSE_LAG_DAYS, getForecastData, Proposal } from "@/data/dataAdapter";
import { isAbertoComValorOuPotencia, isOportunidadeNaMesaDiretoria } from "@/lib/oportunidadeMesa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyAbbrev, formatCurrencyFull, formatNumber } from "@/lib/formatters";
import {
  RefreshCw,
  FileCheck,
  DollarSign,
  Zap,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  User,
  Hash,
  Calendar,
  Clock,
  MessageSquare,
  Percent,
  Target,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { HelpButton } from "@/components/HelpButton";
import { Badge } from "@/components/ui/badge";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { PageFloatingFilter } from "@/components/filters/PageFloatingFilter";
import { useGlobalFilters } from "@/contexts/GlobalFilterContext";
import { DataTrustFooter } from "@/components/metrics/DataTrustFooter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export default function Contratos() {
  const { proposals: allProposals, isLoading, error, dataUpdatedAt } = useCommercialProposals();
  const { selectedOrgName, isGlobal } = useOrgFilter();
  const orgFilterActive = !isGlobal;
  const [selectedContrato, setSelectedContrato] = useState<Proposal | null>(null);
  const pf = useGlobalFilters();

  const filteredProposals = useMemo(() => pf.filterProposals(allProposals), [allProposals, pf.filterProposals]);

  const forecastData = useMemo(() => {
    if (filteredProposals.length === 0) return null;
    return getForecastData(filteredProposals);
  }, [filteredProposals]);

  const baseStats = useMemo(() => {
    const list = filteredProposals;
    const ganhos = list.filter((p) => p.status === "Ganho");
    const abertos = list.filter((p) => p.status === "Aberto");
    return {
      total: list.length,
      ganhos: ganhos.length,
      abertos: abertos.length,
      naMesaDiretoria: abertos.filter(isOportunidadeNaMesaDiretoria).length,
      abertosComNumero: abertos.filter(isAbertoComValorOuPotencia).length,
    };
  }, [filteredProposals]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive">Erro ao carregar dados: {(error as Error)?.message}</p>
      </div>
    );
  }

  if (!forecastData) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Contratos Fechados</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">Nenhum projeto no filtro atual</p>
            <p className="text-muted-foreground text-sm mt-1">Amplie o período ou limpe os filtros globais</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ticketGanho =
    baseStats.ganhos > 0 ? forecastData.receitaConfirmada / baseStats.ganhos : 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Contratos Fechados</h1>
          <p className="text-xs md:text-sm text-muted-foreground max-w-3xl">
            Somente dados derivados de <span className="font-medium text-foreground">sol_projetos_sync</span> (1 registro por{" "}
            <span className="font-medium text-foreground">project_id</span> após dedupe). Não exibimos funil de pré-venda
            (leads) aqui — só o que a sync comercial traz. A receita prevista usa o mesmo proxy do Forecast: data de criação da
            proposta + <span className="font-medium text-foreground">{FORECAST_EXPECTED_CLOSE_LAG_DAYS} dias</span>, horizonte
            cumulativo até +28 dias. O status <span className="font-medium text-foreground">Aberto</span> na sync é o fallback
            quando o SM não envia ganho/perda/exclusão explícitos — por isso o número de «abertos» pode ser maior do que as
            oportunidades que você considera «na mesa»; usamos um recorte de diretoria nos cards abaixo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {orgFilterActive && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
              🏢 {selectedOrgName}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {baseStats.ganhos} ganhos · {baseStats.total} no filtro
          </Badge>
          <HelpButton moduleId="forecast" label="Ajuda dos Contratos" />
        </div>
      </div>

      <PageFloatingFilter
        filters={pf.filters}
        hasFilters={pf.hasFilters}
        clearFilters={pf.clearFilters}
        setPeriodo={pf.setPeriodo}
        setDateFrom={pf.setDateFrom}
        setDateTo={pf.setDateTo}
        setTemperatura={pf.setTemperatura}
        setSearchTerm={pf.setSearchTerm}
        setEtapa={pf.setEtapa}
        setStatus={pf.setStatus}
        config={{
          showPeriodo: true,
          showTemperatura: true,
          showSearch: true,
          showEtapa: true,
          showStatus: true,
          searchPlaceholder: "Buscar vendedor...",
        }}
      />

      {/* Recorte confiável (sem KPIs legados sempre zerados) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileCheck className="h-4 w-4" />
              <span className="text-xs font-medium">Projetos no filtro</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{baseStats.total}</p>
            <p className="text-xs text-muted-foreground mt-1">Total após filtros globais</p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/25 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Abertos (sync)</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{baseStats.abertos}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-snug">
              Fallback quando o SM não marca ganho/perda/exclusão — não é só «mesa»
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Target className="h-4 w-4" />
              <span className="text-xs font-medium">Na mesa (diretoria)</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{baseStats.naMesaDiretoria}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-snug">
              Aberto + (R$ ou kWp) OU etapa qualif./contato/proposta/negociação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">Abertos c/ R$ ou kWp</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{baseStats.abertosComNumero}</p>
            <p className="text-xs text-muted-foreground mt-1">Somente status Aberto</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/25 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">Ganhos</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{baseStats.ganhos}</p>
            <p className="text-xs text-muted-foreground mt-1">
              TM {formatCurrencyAbbrev(ticketGanho)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-emerald-600/30 bg-emerald-600/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">Receita confirmada</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrencyFull(forecastData.receitaConfirmada)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Soma valor da proposta · status Ganho</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-600/30 bg-emerald-600/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <Zap className="h-4 w-4" />
              <span className="text-xs font-medium">Potência confirmada</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
              {formatNumber(forecastData.potenciaConfirmada)} kWp
            </p>
            <p className="text-xs text-muted-foreground mt-1">Soma nos ganhos do recorte</p>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-primary mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">Receita prevista (até +28d)</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{formatCurrencyFull(forecastData.forecast28)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Abertos · valor×prob. · fechamento esp. = criação + {FORECAST_EXPECTED_CLOSE_LAG_DAYS}d
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Previsto vs confirmado</CardTitle>
          <p className="text-xs text-muted-foreground font-normal">
            Previsto = mesma regra da página Forecast (horizonte +28 dias cumulativo). Confirmado = receita em negócios com
            status Ganho neste filtro.
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={[
                { label: "Receita prevista (até +28d)", valor: forecastData.forecast28 },
                { label: "Receita confirmada", valor: forecastData.receitaConfirmada },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatCurrencyAbbrev(v)} />
              <Tooltip
                formatter={(value: number) => formatCurrencyAbbrev(value)}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                <Cell fill="hsl(var(--primary))" />
                <Cell fill="hsl(var(--chart-2))" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Negócios ganhos</CardTitle>
          <p className="text-xs text-muted-foreground font-normal">
            Lista de projetos com status <span className="font-medium text-foreground">Ganho</span> no recorte. Clique na linha
            para detalhes.
          </p>
        </CardHeader>
        <CardContent>
          {(() => {
            const contratos = filteredProposals
              .filter((p) => p.status === "Ganho")
              .sort((a, b) => b.valorProposta - a.valorProposta);
            if (contratos.length === 0) {
              return (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhum negócio ganho no período e filtros atuais
                </p>
              );
            }

            return (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>ID Projeto</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Etapa SM</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Potência</TableHead>
                    <TableHead className="text-right">Data proposta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contratos.map((c) => {
                    const clienteName = c.makeNome || c.nomeCliente || "—";
                    const projetoName = c.nomeProposta || c.projetoId || "—";
                    return (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedContrato(c)}
                      >
                        <TableCell className="font-medium max-w-[180px] truncate" title={clienteName}>
                          {clienteName}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs" title={c.projetoId || ""}>
                          {c.projetoId || "—"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground text-xs" title={projetoName}>
                          {projetoName}
                        </TableCell>
                        <TableCell>{c.responsavel || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {c.etapa}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrencyFull(c.valorProposta)}</TableCell>
                        <TableCell className="text-right">
                          {c.potenciaSistema > 0 ? `${formatNumber(c.potenciaSistema)} kWp` : "—"}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs">
                          {c.dataCriacaoProposta
                            ? new Date(c.dataCriacaoProposta + "T12:00:00").toLocaleDateString("pt-BR")
                            : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            );
          })()}
        </CardContent>
      </Card>

      <Sheet open={!!selectedContrato} onOpenChange={(open) => !open && setSelectedContrato(null)}>
        <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto">
          {selectedContrato &&
            (() => {
              const c = selectedContrato;
              const clienteName = c.makeNome || c.nomeCliente || "—";
              const DetailRow = ({
                icon: Icon,
                label,
                value,
              }: {
                icon: ComponentType<{ className?: string }>;
                label: string;
                value: string;
              }) => (
                <div className="flex items-start gap-3 py-2">
                  <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium break-words">{value || "—"}</p>
                  </div>
                </div>
              );
              return (
                <>
                  <SheetHeader>
                    <SheetTitle className="text-left text-lg">{clienteName}</SheetTitle>
                    <p className="text-xs text-muted-foreground">
                      Projeto #{c.projetoId || "—"} · {c.nomeProposta || "—"}
                    </p>
                  </SheetHeader>

                  <div className="mt-4 space-y-1">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 text-xs">
                        {c.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {c.etapa}
                      </Badge>
                      {c.faseSM && (
                        <Badge variant="secondary" className="text-xs">
                          Fase: {c.faseSM}
                        </Badge>
                      )}
                      {c.temperatura && (
                        <Badge variant="outline" className="text-xs">
                          {c.temperatura === "QUENTE" ? "🔥" : c.temperatura === "MORNO" ? "🌤️" : "❄️"} {c.temperatura}
                        </Badge>
                      )}
                    </div>

                    <Separator />

                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-3 pb-1">Financeiro</h4>
                    <DetailRow icon={DollarSign} label="Valor da Proposta" value={formatCurrencyFull(c.valorProposta)} />
                    <DetailRow
                      icon={Zap}
                      label="Potência do Sistema"
                      value={c.potenciaSistema > 0 ? `${formatNumber(c.potenciaSistema)} kWp` : "—"}
                    />
                    <DetailRow icon={Percent} label="Probabilidade (etapa)" value={`${c.probabilidade}%`} />

                    <Separator />

                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-3 pb-1">Contato</h4>
                    <DetailRow icon={Phone} label="Telefone" value={c.clienteTelefone} />
                    <DetailRow icon={Mail} label="Email" value={c.makeEmail || c.clienteEmail || "—"} />
                    <DetailRow icon={MapPin} label="Cidade" value={c.makeCidade || "—"} />
                    {c.makeValorConta && <DetailRow icon={Zap} label="Valor da Conta" value={c.makeValorConta} />}
                    {c.makeImovel && <DetailRow icon={Hash} label="Imóvel" value={c.makeImovel} />}

                    <Separator />

                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-3 pb-1">
                      Responsáveis
                    </h4>
                    <DetailRow icon={User} label="Responsável (SDR)" value={c.responsavel} />
                    <DetailRow icon={User} label="Representante (Closer)" value={c.representante} />

                    <Separator />

                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-3 pb-1">Datas</h4>
                    <DetailRow
                      icon={Calendar}
                      label="Criação do Projeto"
                      value={c.dataCriacaoProjeto ? new Date(c.dataCriacaoProjeto + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                    />
                    <DetailRow
                      icon={Calendar}
                      label="Criação da Proposta"
                      value={
                        c.dataCriacaoProposta
                          ? new Date(c.dataCriacaoProposta + "T12:00:00").toLocaleDateString("pt-BR")
                          : "—"
                      }
                    />
                    <DetailRow icon={Clock} label="SLA Proposta" value={c.slaProposta > 0 ? `${c.slaProposta} dias` : "—"} />
                    <DetailRow
                      icon={Clock}
                      label="Tempo na Etapa"
                      value={c.tempoNaEtapa > 0 ? `${c.tempoNaEtapa} dias` : "—"}
                    />

                    {(c.makeRobo || c.makeStatusResposta || c.makeTotalMensagens) && (
                      <>
                        <Separator />
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-3 pb-1">
                          Interações (SOL)
                        </h4>
                        {c.makeRobo && <DetailRow icon={MessageSquare} label="Robô" value={c.makeRobo} />}
                        {c.makeStatusResposta && (
                          <DetailRow icon={MessageSquare} label="Status Resposta" value={c.makeStatusResposta} />
                        )}
                        {c.makeTotalMensagens != null && (
                          <DetailRow icon={MessageSquare} label="Total Mensagens" value={String(c.makeTotalMensagens)} />
                        )}
                        {c.makeMensagensRecebidas != null && (
                          <DetailRow
                            icon={MessageSquare}
                            label="Mensagens Recebidas"
                            value={String(c.makeMensagensRecebidas)}
                          />
                        )}
                        {c.makeSentimento && <DetailRow icon={MessageSquare} label="Sentimento" value={c.makeSentimento} />}
                        {c.makeInteresse && <DetailRow icon={MessageSquare} label="Interesse" value={c.makeInteresse} />}
                      </>
                    )}

                    {c.etiquetas && (
                      <>
                        <Separator />
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-3 pb-1">
                          Etiquetas
                        </h4>
                        <div className="flex flex-wrap gap-1.5 py-1">
                          {c.etiquetas.split(",").map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </>
              );
            })()}
        </SheetContent>
      </Sheet>

      <DataTrustFooter
        lines={[
          {
            label: "Comercial",
            source: "sol_projetos_sync (dedupe por project_id)",
            fetchedAt: dataUpdatedAt,
            extra: `${filteredProposals.length} projetos no filtro global`,
          },
        ]}
      />
    </div>
  );
}
