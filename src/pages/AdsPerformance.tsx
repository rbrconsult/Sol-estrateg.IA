import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, AreaChart, Area, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Eye, MousePointer, DollarSign, Users, Target, BarChart3, Construction, ChevronDown, ChevronUp, Image, Video, LayoutGrid } from 'lucide-react';
import {
  metaKPIs, googleKPIs, engajamentoMeta, campanhas, criativos,
  comparativo, evolucaoSemanal, type CampanhaMock
} from '@/data/biPagesMock';

function useAnimatedNumber(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setValue(target * p);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return { value, ref };
}

function KPICard({ label, value, prefix = '', suffix = '', color }: { label: string; value: number; prefix?: string; suffix?: string; color?: string }) {
  const anim = useAnimatedNumber(value);
  const isDecimal = suffix === '%' || suffix === '×' || value < 100;
  return (
    <div className="bg-card border border-border/50 rounded-lg p-3 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-lg font-bold ${color || 'text-foreground'}`}>
        {prefix}{isDecimal ? anim.value.toFixed(value < 10 ? 2 : value < 1000 ? 1 : 0) : Math.round(anim.value).toLocaleString('pt-BR')}{suffix}
      </p>
    </div>
  );
}

const META_COLOR = '#1877F2';
const GOOGLE_COLOR = '#34A853';

const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 };

function formatCurrency(v: number) {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`;
  return `R$ ${v.toFixed(0)}`;
}

export default function AdsPerformance() {
  const [platformFilter, setPlatformFilter] = useState<'ambos' | 'meta' | 'google'>('ambos');
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);

  const filteredCampanhas = campanhas.filter(c => {
    if (platformFilter === 'meta') return c.plataforma === 'Meta';
    if (platformFilter === 'google') return c.plataforma === 'Google';
    return true;
  });

  const bestCPL = Math.min(...filteredCampanhas.map(c => c.cpl));
  const worstCPL = Math.max(...filteredCampanhas.map(c => c.cpl));

  const radarData = [
    { metric: 'Leads', meta: 100, google: (89 / 187) * 100 },
    { metric: 'CTR', meta: (2.16 / 4.71) * 100, google: 100 },
    { metric: 'CPL', meta: 100, google: (98.40 / 125.84) * 100 },
    { metric: 'ROAS', meta: 100, google: (4.1 / 5.2) * 100 },
    { metric: 'Qualific.', meta: 100, google: (24 / 51) * 100 },
    { metric: 'Conversão', meta: (2.09 / 2.11) * 100, google: 100 },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Ads Performance</h1>
          <p className="text-sm text-muted-foreground">Métricas de mídia paga — Jan-Fev 2026 (dados mockados)</p>
        </div>
        <div className="flex gap-2">
          {(['ambos', 'meta', 'google'] as const).map(p => (
            <Button key={p} size="sm" variant={platformFilter === p ? 'default' : 'outline'} onClick={() => setPlatformFilter(p)}
              style={platformFilter === p ? { backgroundColor: p === 'meta' ? META_COLOR : p === 'google' ? GOOGLE_COLOR : undefined } : undefined}>
              {p === 'ambos' ? 'Ambos' : p === 'meta' ? 'Meta Ads' : 'Google Ads'}
            </Button>
          ))}
        </div>
      </div>

      {/* BLOCO 1 — KPIs */}
      <div className={`grid gap-6 ${platformFilter === 'ambos' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
        {(platformFilter === 'ambos' || platformFilter === 'meta') && (
          <Card className="border-t-4" style={{ borderTopColor: META_COLOR }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: META_COLOR }} /> Meta Ads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                <KPICard label="Investimento" value={metaKPIs.investimento} prefix="R$ " />
                <KPICard label="Impressões" value={metaKPIs.impressoes} />
                <KPICard label="Alcance" value={metaKPIs.alcance} />
                <KPICard label="Frequência" value={metaKPIs.frequencia} suffix="×" />
                <KPICard label="Cliques link" value={metaKPIs.cliquesLink} />
                <KPICard label="CTR" value={metaKPIs.ctr} suffix="%" />
                <KPICard label="CPC" value={metaKPIs.cpc} prefix="R$ " />
                <KPICard label="CPM" value={metaKPIs.cpm} prefix="R$ " />
                <KPICard label="Leads" value={metaKPIs.leadsGerados} color="text-primary" />
                <KPICard label="CPL" value={metaKPIs.cpl} prefix="R$ " />
                <KPICard label="Conv. form" value={metaKPIs.taxaConversaoForm} suffix="%" />
                <KPICard label="Qualificados" value={metaKPIs.leadsQualificados} color="text-primary" />
                <KPICard label="Custo/qualif." value={metaKPIs.custoLeadQualificado} prefix="R$ " />
                <KPICard label="ROAS" value={metaKPIs.roas} suffix="×" color="text-primary" />
              </div>
            </CardContent>
          </Card>
        )}

        {(platformFilter === 'ambos' || platformFilter === 'google') && (
          <Card className="border-t-4" style={{ borderTopColor: GOOGLE_COLOR }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GOOGLE_COLOR }} /> Google Ads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                <KPICard label="Investimento" value={googleKPIs.investimento} prefix="R$ " />
                <KPICard label="Impressões" value={googleKPIs.impressoes} />
                <KPICard label="Cliques" value={googleKPIs.cliques} />
                <KPICard label="CTR" value={googleKPIs.ctr} suffix="%" />
                <KPICard label="CPC" value={googleKPIs.cpc} prefix="R$ " />
                <KPICard label="CPM" value={googleKPIs.cpm} prefix="R$ " />
                <KPICard label="Leads" value={googleKPIs.leadsGerados} color="text-primary" />
                <KPICard label="CPL" value={googleKPIs.cpl} prefix="R$ " />
                <KPICard label="Conv." value={googleKPIs.taxaConversao} suffix="%" />
                <KPICard label="Qualificados" value={googleKPIs.leadsQualificados} color="text-primary" />
                <KPICard label="Custo/qualif." value={googleKPIs.custoLeadQualificado} prefix="R$ " />
                <KPICard label="ROAS" value={googleKPIs.roas} suffix="×" color="text-primary" />
                <KPICard label="Pos. média" value={googleKPIs.posicaoMedia} />
                <KPICard label="Índ. qualidade" value={googleKPIs.indiceQualidade} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* BLOCO 2 — Engajamento Meta */}
      {(platformFilter === 'ambos' || platformFilter === 'meta') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Engajamento — Meta Ads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <KPICard label="Curtidas" value={engajamentoMeta.curtidas} />
              <KPICard label="Comentários" value={engajamentoMeta.comentarios} />
              <KPICard label="Compartilhamentos" value={engajamentoMeta.compartilhamentos} />
              <KPICard label="Salvamentos" value={engajamentoMeta.salvamentos} />
              <KPICard label="Cliques perfil" value={engajamentoMeta.cliquesPerfil} />
              <KPICard label="Views 3s" value={engajamentoMeta.videoViews3s} />
              <KPICard label="Views 25%" value={engajamentoMeta.videoViews25} />
              <KPICard label="Views 75%" value={engajamentoMeta.videoViews75} />
              <KPICard label="Conclusão vídeo" value={engajamentoMeta.taxaConclusao} suffix="%" />
              <KPICard label="ThruPlay" value={engajamentoMeta.thruPlay} />
              <KPICard label="Custo/ThruPlay" value={engajamentoMeta.custoThruPlay} prefix="R$ " />
              <KPICard label="Hook Rate" value={engajamentoMeta.hookRate} suffix="%" color="text-primary" />
              <KPICard label="Hold Rate" value={engajamentoMeta.holdRate} suffix="%" color="text-primary" />
              <KPICard label="Engajamento" value={engajamentoMeta.taxaEngajamento} suffix="%" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* BLOCO 3 — Performance por Campanha */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Performance por Campanha</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead>Objetivo</TableHead>
                <TableHead className="text-right">Invest.</TableHead>
                <TableHead className="text-right">Impr.</TableHead>
                <TableHead className="text-right">Cliques</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">CPL</TableHead>
                <TableHead className="text-right">Qualif.</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampanhas.map((c) => (
                <TableRow key={c.campanha}
                  className={c.cpl === bestCPL ? 'bg-primary/10' : c.cpl === worstCPL ? 'bg-destructive/10' : ''}>
                  <TableCell className="font-medium text-xs">{c.campanha}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs" style={{ borderColor: c.plataforma === 'Meta' ? META_COLOR : GOOGLE_COLOR, color: c.plataforma === 'Meta' ? META_COLOR : GOOGLE_COLOR }}>
                      {c.plataforma}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{c.objetivo}</TableCell>
                  <TableCell className="text-right text-xs">R$ {c.investimento.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right text-xs">{c.impressoes.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right text-xs">{c.cliques.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right text-xs">{c.ctr}%</TableCell>
                  <TableCell className="text-right text-xs font-semibold">{c.leads}</TableCell>
                  <TableCell className="text-right text-xs">R$ {c.cpl.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-xs font-semibold">{c.qualificados}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'Ativa' ? 'default' : c.status === 'Pausada' ? 'secondary' : 'outline'} className="text-xs">
                      {c.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* BLOCO 4 — Criativos Meta */}
      {(platformFilter === 'ambos' || platformFilter === 'meta') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Performance por Criativo — Meta</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criativo</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead className="text-right">Impr.</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">CPL</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Hook</TableHead>
                  <TableHead className="text-right">Hold</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criativos.map(c => (
                  <TableRow key={c.nome}>
                    <TableCell className="font-medium text-xs flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                        {c.formato === 'Vídeo' ? <Video className="h-4 w-4 text-muted-foreground" /> : c.formato === 'Carrossel' ? <LayoutGrid className="h-4 w-4 text-muted-foreground" /> : <Image className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      {c.nome}
                    </TableCell>
                    <TableCell className="text-xs">{c.formato}</TableCell>
                    <TableCell className="text-right text-xs">{c.impressoes.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right text-xs">{c.ctr}%</TableCell>
                    <TableCell className="text-right text-xs">R$ {c.cpl.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-xs font-semibold">{c.leads}</TableCell>
                    <TableCell className="text-right text-xs">{c.hookRate}%</TableCell>
                    <TableCell className="text-right text-xs">{c.holdRate}%</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={c.score >= 85 ? 'default' : 'secondary'} className="text-xs">{c.score}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* BLOCO 5 — Métricas de Página (Em Breve) */}
      <Card className="opacity-60">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Métricas de Página</CardTitle>
            <Badge variant="outline" className="gap-1 text-xs">
              <Construction className="h-3 w-3" /> Em desenvolvimento — DataStore e fluxo em breve
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {['Visualizações', 'Sessões únicas', 'Taxa de rejeição', 'Tempo médio', 'Origem tráfego', 'Páginas visitadas', 'Conv. landing page', 'Heatmap cliques', 'Scroll depth', 'Leads LP vs Meta'].map(m => (
              <div key={m} className="bg-muted/50 rounded-lg p-3 text-center border border-dashed border-border">
                <p className="text-xs text-muted-foreground">{m}</p>
                <p className="text-lg font-bold text-muted-foreground/50">—</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* BLOCO 6 — Comparativo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Comparativo Meta vs Google</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Métrica</TableHead>
                  <TableHead className="text-center" style={{ color: META_COLOR }}>Meta</TableHead>
                  <TableHead className="text-center" style={{ color: GOOGLE_COLOR }}>Google</TableHead>
                  <TableHead className="text-center">Melhor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparativo.map(c => (
                  <TableRow key={c.metrica}>
                    <TableCell className="font-medium text-xs">{c.metrica}</TableCell>
                    <TableCell className="text-center text-xs">{c.meta}</TableCell>
                    <TableCell className="text-center text-xs">{c.google}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs"
                        style={{ borderColor: c.melhor === 'Meta' ? META_COLOR : c.melhor === 'Google' ? GOOGLE_COLOR : undefined, color: c.melhor === 'Meta' ? META_COLOR : c.melhor === 'Google' ? GOOGLE_COLOR : undefined }}>
                        {c.melhor}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Bar Chart */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Leads & Qualificados</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { name: 'Leads', Meta: 187, Google: 89 },
                  { name: 'Qualificados', Meta: 51, Google: 24 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="Meta" fill={META_COLOR} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Google" fill={GOOGLE_COLOR} radius={[4, 4, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Radar */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Radar Comparativo</p>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Radar name="Meta" dataKey="meta" stroke={META_COLOR} fill={META_COLOR} fillOpacity={0.2} />
                  <Radar name="Google" dataKey="google" stroke={GOOGLE_COLOR} fill={GOOGLE_COLOR} fillOpacity={0.2} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BLOCO 7 — Evolução Semanal */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Evolução Semanal — Jan/Fev 2026</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="investimento">
            <TabsList className="mb-4">
              <TabsTrigger value="investimento">Investimento</TabsTrigger>
              <TabsTrigger value="leads">Leads</TabsTrigger>
              <TabsTrigger value="cpl">CPL</TabsTrigger>
            </TabsList>

            <TabsContent value="investimento">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={evolucaoSemanal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="semana" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => formatCurrency(v)} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="metaInvest" name="Meta" stroke={META_COLOR} fill={META_COLOR} fillOpacity={0.15} />
                  <Area type="monotone" dataKey="googleInvest" name="Google" stroke={GOOGLE_COLOR} fill={GOOGLE_COLOR} fillOpacity={0.15} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="leads">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={evolucaoSemanal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="semana" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="metaLeads" name="Meta" stroke={META_COLOR} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="googleLeads" name="Google" stroke={GOOGLE_COLOR} strokeWidth={2} dot={{ r: 3 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="cpl">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={evolucaoSemanal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="semana" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `R$${v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                  <Line type="monotone" dataKey="metaCPL" name="Meta" stroke={META_COLOR} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="googleCPL" name="Google" stroke={GOOGLE_COLOR} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground pt-4">
        Sol Estrateg.IA — Ads Performance • Dados mockados Jan-Fev 2026
      </p>
    </div>
  );
}
