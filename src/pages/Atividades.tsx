import { useMemo } from "react";
import { useGoogleSheetsData } from "@/hooks/useGoogleSheetsData";
import { adaptSheetData, getAtividadesData, getVendedorPerformance } from "@/data/dataAdapter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyAbbrev } from "@/lib/formatters";
import { Activity, Clock, AlertTriangle, Phone, Calendar, Trophy, Zap, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Atividades() {
  const { data: sheetData, isLoading, error } = useGoogleSheetsData();

  const { proposals, atividadesData, vendedorPerformance } = useMemo(() => {
    if (!sheetData?.data) return { proposals: [], atividadesData: null, vendedorPerformance: [] };
    const proposals = adaptSheetData(sheetData.data);
    const atividadesData = getAtividadesData(proposals);
    const vendedorPerformance = getVendedorPerformance(proposals);
    return { proposals, atividadesData, vendedorPerformance };
  }, [sheetData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !atividadesData) {
    return (
      <div className="p-6">
        <p className="text-destructive">Erro ao carregar dados</p>
      </div>
    );
  }

  // Ranking de vendedores por follow-ups
  const rankingFollowUps = [...vendedorPerformance]
    .sort((a, b) => b.totalFollowUps - a.totalFollowUps)
    .slice(0, 5);

  // Ranking por tempo de resposta (menor é melhor)
  const rankingResposta = [...vendedorPerformance]
    .filter(v => v.tempoMedioResposta > 0)
    .sort((a, b) => a.tempoMedioResposta - b.tempoMedioResposta)
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Atividades & Follow-ups</h1>
        <p className="text-muted-foreground">Gestão de contatos e atividades comerciais</p>
      </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Atividades Hoje</p>
                  <p className="text-2xl font-bold text-foreground">{atividadesData.atividadesDoDia.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Follow-ups Atrasados</p>
                  <p className="text-2xl font-bold text-destructive">{atividadesData.followUpsAtrasados.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/20 rounded-lg">
                  <Phone className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sem Contato (&gt;3 dias)</p>
                  <p className="text-2xl font-bold text-warning">{atividadesData.leadsSemContato.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-chart-2/10 to-chart-2/5 border-chart-2/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-chart-2/20 rounded-lg">
                  <Zap className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Speed-to-Lead</p>
                  <p className="text-2xl font-bold text-foreground">{atividadesData.speedToLead} dias</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-chart-3/10 to-chart-3/5 border-chart-3/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-chart-3/20 rounded-lg">
                  <Activity className="h-5 w-5 text-chart-3" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sem Próx. Atividade</p>
                  <p className="text-2xl font-bold text-foreground">{atividadesData.semProximaAtividade.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vendedor mais ativo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-warning" />
                Vendedores Mais Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rankingFollowUps.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Dados de follow-ups não disponíveis
                  <br />
                  <span className="text-xs">(Campo "Número de Follow-ups" não configurado no Sheets)</span>
                </p>
              ) : (
                <div className="space-y-3">
                  {rankingFollowUps.map((v, index) => (
                    <div key={v.nome} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-warning text-warning-foreground' :
                          index === 1 ? 'bg-muted text-muted-foreground' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-secondary text-secondary-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-medium">{v.nome}</span>
                      </div>
                      <Badge variant="secondary">{v.totalFollowUps} follow-ups</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vendedor mais rápido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-chart-2" />
                Vendedores Mais Rápidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rankingResposta.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Dados de tempo de resposta não disponíveis
                  <br />
                  <span className="text-xs">(Campo "Data Primeiro Contato" não configurado no Sheets)</span>
                </p>
              ) : (
                <div className="space-y-3">
                  {rankingResposta.map((v, index) => (
                    <div key={v.nome} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-chart-2 text-white' :
                          index === 1 ? 'bg-muted text-muted-foreground' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-secondary text-secondary-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-medium">{v.nome}</span>
                      </div>
                      <Badge variant="outline">{v.tempoMedioResposta} dias</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabelas de Pendências */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Follow-ups Atrasados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Follow-ups Atrasados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {atividadesData.followUpsAtrasados.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum follow-up atrasado
                    <br />
                    <span className="text-xs">(Campo "Próxima Atividade" não configurado no Sheets)</span>
                  </p>
                ) : (
                  atividadesData.followUpsAtrasados.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <div>
                        <p className="font-medium text-foreground">{p.nomeCliente}</p>
                        <p className="text-xs text-muted-foreground">{p.etapa} • {p.representante || p.responsavel}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrencyAbbrev(p.valorProposta)}</p>
                        <p className="text-xs text-destructive">{p.proximaAtividade}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Leads Estagnados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-warning flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Leads Sem Contato (&gt;3 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {atividadesData.leadsSemContato.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Todos os leads foram contatados recentemente
                  </p>
                ) : (
                  atividadesData.leadsSemContato.slice(0, 20).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border border-warning/20">
                      <div>
                        <p className="font-medium text-foreground">{p.nomeCliente}</p>
                        <p className="text-xs text-muted-foreground">{p.etapa} • {p.representante || p.responsavel}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrencyAbbrev(p.valorProposta)}</p>
                        <p className="text-xs text-warning">{p.tempoNaEtapa} dias na etapa</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
