import { useMemo, useState } from "react";
import { useGoogleSheetsData } from "@/hooks/useGoogleSheetsData";
import { adaptSheetData, getAtividadesData, getVendedorPerformance, Proposal } from "@/data/dataAdapter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyAbbrev } from "@/lib/formatters";
import { Activity, Clock, AlertTriangle, Phone, Calendar, Trophy, Zap, RefreshCw, ChevronDown, ChevronUp, X, User, MapPin } from "lucide-react";
import { HelpButton } from "@/components/HelpButton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

type KPIType = 'atividadesHoje' | 'followUpsAtrasados' | 'semContato' | 'speedToLead' | 'semProximaAtividade' | null;

interface KPICardProps {
  type: KPIType;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  value: number | string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

function KPICard({ type, active, onClick, icon, label, value, colorClass, bgClass, borderClass }: KPICardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:scale-[1.02]",
        bgClass,
        borderClass,
        active && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", bgClass.replace('from-', 'bg-').split(' ')[0].replace('/10', '/20'))}>
              {icon}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className={cn("text-2xl font-bold", colorClass)}>{value}</p>
            </div>
          </div>
          {active ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface LeadListProps {
  leads: Proposal[];
  type: KPIType;
  onClose: () => void;
}

function LeadList({ leads, type, onClose }: LeadListProps) {
  const getTitle = () => {
    switch (type) {
      case 'atividadesHoje': return 'Atividades para Hoje';
      case 'followUpsAtrasados': return 'Follow-ups Atrasados';
      case 'semContato': return 'Leads Sem Contato (>3 dias)';
      case 'semProximaAtividade': return 'Negócios Sem Próxima Atividade';
      default: return 'Leads';
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'atividadesHoje': return 'bg-primary/5 border-primary/20';
      case 'followUpsAtrasados': return 'bg-destructive/5 border-destructive/20';
      case 'semContato': return 'bg-warning/5 border-warning/20';
      case 'semProximaAtividade': return 'bg-chart-3/5 border-chart-3/20';
      default: return 'bg-secondary/50';
    }
  };

  const getItemBgColor = () => {
    switch (type) {
      case 'atividadesHoje': return 'bg-primary/10 border-primary/20 hover:bg-primary/15';
      case 'followUpsAtrasados': return 'bg-destructive/10 border-destructive/20 hover:bg-destructive/15';
      case 'semContato': return 'bg-warning/10 border-warning/20 hover:bg-warning/15';
      case 'semProximaAtividade': return 'bg-chart-3/10 border-chart-3/20 hover:bg-chart-3/15';
      default: return 'bg-secondary/50 hover:bg-secondary/70';
    }
  };

  return (
    <Card className={cn("animate-in slide-in-from-top-2 duration-300", getBgColor())}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getTitle()}
            <Badge variant="secondary" className="ml-2">{leads.length} leads</Badge>
          </CardTitle>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {leads.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum lead encontrado nesta categoria
            </p>
          ) : (
            <div className="space-y-2">
              {leads.map((lead) => (
                <div 
                  key={lead.id} 
                  className={cn(
                    "p-3 rounded-lg border transition-colors",
                    getItemBgColor()
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{lead.nomeCliente}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {lead.etapa}
                        </Badge>
                        {(lead.representante || lead.responsavel) && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {lead.representante || lead.responsavel}
                          </span>
                        )}
                      </div>
                      {lead.clienteTelefone && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.clienteTelefone}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-foreground">{formatCurrencyAbbrev(lead.valorProposta)}</p>
                      {lead.tempoNaEtapa > 0 && (
                        <p className="text-xs text-muted-foreground">{lead.tempoNaEtapa} dias na etapa</p>
                      )}
                      {lead.proximaAtividade && (
                        <p className="text-xs text-muted-foreground">{lead.proximaAtividade}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default function Atividades() {
  const { data: sheetData, isLoading, error } = useGoogleSheetsData();
  const [activeKPI, setActiveKPI] = useState<KPIType>(null);

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

  const handleKPIClick = (type: KPIType) => {
    if (type === 'speedToLead') return; // Speed to Lead não tem lista de leads
    setActiveKPI(activeKPI === type ? null : type);
  };

  const getActiveLeads = (): Proposal[] => {
    switch (activeKPI) {
      case 'atividadesHoje': return atividadesData.atividadesDoDia;
      case 'followUpsAtrasados': return atividadesData.followUpsAtrasados;
      case 'semContato': return atividadesData.leadsSemContato;
      case 'semProximaAtividade': return atividadesData.semProximaAtividade;
      default: return [];
    }
  };

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
        <p className="text-muted-foreground">Clique nos cards para ver os leads relacionados</p>
      </div>

      {/* KPIs Clicáveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          type="atividadesHoje"
          active={activeKPI === 'atividadesHoje'}
          onClick={() => handleKPIClick('atividadesHoje')}
          icon={<Calendar className="h-5 w-5 text-primary" />}
          label="Atividades Hoje"
          value={atividadesData.atividadesDoDia.length}
          colorClass="text-foreground"
          bgClass="bg-gradient-to-br from-primary/10 to-primary/5"
          borderClass="border-primary/20"
        />

        <KPICard
          type="followUpsAtrasados"
          active={activeKPI === 'followUpsAtrasados'}
          onClick={() => handleKPIClick('followUpsAtrasados')}
          icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
          label="Follow-ups Atrasados"
          value={atividadesData.followUpsAtrasados.length}
          colorClass="text-destructive"
          bgClass="bg-gradient-to-br from-destructive/10 to-destructive/5"
          borderClass="border-destructive/20"
        />

        <KPICard
          type="semContato"
          active={activeKPI === 'semContato'}
          onClick={() => handleKPIClick('semContato')}
          icon={<Phone className="h-5 w-5 text-warning" />}
          label="Sem Contato (>3 dias)"
          value={atividadesData.leadsSemContato.length}
          colorClass="text-warning"
          bgClass="bg-gradient-to-br from-warning/10 to-warning/5"
          borderClass="border-warning/20"
        />

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

        <KPICard
          type="semProximaAtividade"
          active={activeKPI === 'semProximaAtividade'}
          onClick={() => handleKPIClick('semProximaAtividade')}
          icon={<Activity className="h-5 w-5 text-chart-3" />}
          label="Sem Próx. Atividade"
          value={atividadesData.semProximaAtividade.length}
          colorClass="text-foreground"
          bgClass="bg-gradient-to-br from-chart-3/10 to-chart-3/5"
          borderClass="border-chart-3/20"
        />
      </div>

      {/* Lista Expandida de Leads */}
      {activeKPI && activeKPI !== 'speedToLead' && (
        <LeadList 
          leads={getActiveLeads()} 
          type={activeKPI} 
          onClose={() => setActiveKPI(null)} 
        />
      )}

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
    </div>
  );
}
