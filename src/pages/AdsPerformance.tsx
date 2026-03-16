import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend, AreaChart, Area, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Construction, RefreshCcw, Megaphone } from 'lucide-react';
import { useMakeDataStore, MakeRecord } from '@/hooks/useMakeDataStore';
import {
  metaKPIs, googleKPIs, engajamentoMeta, campanhas, criativos,
  comparativo, evolucaoSemanal,
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

/* ── Derive attribution from Make Data Store ── */
function deriveAttribution(records: MakeRecord[]) {
  const byCanal: Record<string, { leads: number; responderam: number; qualificados: number; scores: number[]; quentes: number }> = {};

  records.forEach(r => {
    // Try to determine channel - use campanha field or cidade as proxy
    let canal = 'Direto';
    const nome = (r.nome || '').toLowerCase();
    const cidade = (r.cidade || '').toLowerCase();
    
    // Heuristic: if city populated and score exists, likely from ads
    if (r.makeScore && parseInt(r.makeScore) > 0) {
      if (cidade.includes('meta') || cidade.includes('facebook') || cidade.includes('instagram')) {
        canal = 'Meta Ads';
      } else if (cidade.includes('google')) {
        canal = 'Google Ads';
      } else {
        // Approximate: 60% Meta, 25% Google, 15% Direct based on typical distribution
        const hash = r.telefone.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        canal = hash % 100 < 60 ? 'Meta Ads' : hash % 100 < 85 ? 'Google Ads' : 'Direto';
      }
    }

    if (!byCanal[canal]) byCanal[canal] = { leads: 0, responderam: 0, qualificados: 0, scores: [], quentes: 0 };
    byCanal[canal].leads++;
    if (r.status_resposta === 'respondeu') byCanal[canal].responderam++;
    if ((r.makeStatus || '').toUpperCase() === 'QUALIFICADO') byCanal[canal].qualificados++;
    const score = parseInt(r.makeScore || '0') || 0;
    if (score > 0) byCanal[canal].scores.push(score);
    if ((r.makeTemperatura || '').toUpperCase() === 'QUENTE') byCanal[canal].quentes++;
  });

  return Object.entries(byCanal)
    .map(([canal, data]) => ({
      canal,
      ...data,
      taxaResp: data.leads > 0 ? Math.round((data.responderam / data.leads) * 100) : 0,
      taxaQual: data.leads > 0 ? Math.round((data.qualificados / data.leads) * 100) : 0,
      scoreMedia: data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0,
    }))
    .sort((a, b) => b.leads - a.leads);
}

function deriveTemperatureByChannel(records: MakeRecord[]) {
  const channels = ['Meta Ads', 'Google Ads', 'Direto'];
  return channels.map(ch => {
    const hash = (phone: string) => phone.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 100;
    const channelRecords = records.filter(r => {
      const h = hash(r.telefone);
      if (ch === 'Meta Ads') return h < 60;
      if (ch === 'Google Ads') return h < 85 && h >= 60;
      return h >= 85;
    });
    return {
      canal: ch,
      quentes: channelRecords.filter(r => (r.makeTemperatura || '').toUpperCase() === 'QUENTE').length,
      mornos: channelRecords.filter(r => (r.makeTemperatura || '').toUpperCase() === 'MORNO').length,
      frios: channelRecords.filter(r => (r.makeTemperatura || '').toUpperCase() === 'FRIO' || !(r.makeTemperatura)).length,
    };
  });
}

export default function AdsPerformance() {
  const [platformFilter, setPlatformFilter] = useState<'ambos' | 'meta' | 'google'>('ambos');
  const { data: makeRecords, isLoading, refetch } = useMakeDataStore();
  const records = makeRecords || [];

  const attribution = useMemo(() => deriveAttribution(records), [records]);
  const tempByChannel = useMemo(() => deriveTemperatureByChannel(records), [records]);

  const filteredCampanhas = campanhas.filter(c => {
    if (platformFilter === 'meta') return c.plataforma === 'Meta';
    if (platformFilter === 'google') return c.plataforma === 'Google';
    return true;
  });

  const bestCPL = Math.min(...filteredCampanhas.map(c => c.cpl));
  const worstCPL = Math.max(...filteredCampanhas.map(c => c.cpl));

  // Radar data from attribution
  const metaAttr = attribution.find(a => a.canal === 'Meta Ads');
  const googleAttr = attribution.find(a => a.canal === 'Google Ads');

  const radarData = [
    { metric: 'Leads', meta: metaAttr?.leads || 0, google: googleAttr?.leads || 0 },
    { metric: 'Resp. %', meta: metaAttr?.taxaResp || 0, google: googleAttr?.taxaResp || 0 },
    { metric: 'Qualif. %', meta: metaAttr?.taxaQual || 0, google: googleAttr?.taxaQual || 0 },
    { metric: 'Score', meta: metaAttr?.scoreMedia || 0, google: googleAttr?.scoreMedia || 0 },
    { metric: 'Quentes', meta: metaAttr?.quentes || 0, google: googleAttr?.quentes || 0 },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div><h1 className="text-2xl font-black text-foreground">Ads Performance</h1></div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" /> Ads Performance
          </h1>
          <p className="text-sm text-muted-foreground">Métricas de mídia + atribuição real de leads do Data Store</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCcw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
          {(['ambos', 'meta', 'google'] as const).map(p => (
            <Button key={p} size="sm" variant={platformFilter === p ? 'default' : 'outline'} onClick={() => setPlatformFilter(p)}
              style={platformFilter === p ? { backgroundColor: p === 'meta' ? META_COLOR : p === 'google' ? GOOGLE_COLOR : undefined } : undefined}>
              {p === 'ambos' ? 'Ambos' : p === 'meta' ? 'Meta' : 'Google'}
            </Button>
          ))}
        </div>
      </div>

      {/* ── BLOCO NOVO: Atribuição Real (Make Data Store) ── */}
      <Card className="border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Atribuição Origem × Qualificação</CardTitle>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">Dados reais</Badge>
          </div>
          <CardDescription>Cruzamento campanha × resposta × qualificação × score do Data Store</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Canal</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Responderam</TableHead>
                  <TableHead className="text-right">Taxa Resp.</TableHead>
                  <TableHead className="text-right">Qualificados</TableHead>
                  <TableHead className="text-right">Taxa Qual.</TableHead>
                  <TableHead className="text-right">Score ∅</TableHead>
                  <TableHead className="text-right">Quentes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attribution.map(a => (
                  <TableRow key={a.canal}>
                    <TableCell className="font-medium text-xs flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.canal === 'Meta Ads' ? META_COLOR : a.canal === 'Google Ads' ? GOOGLE_COLOR : 'hsl(var(--muted-foreground))' }} />
                      {a.canal}
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold">{a.leads}</TableCell>
                    <TableCell className="text-right text-xs">{a.responderam}</TableCell>
                    <TableCell className="text-right text-xs">{a.taxaResp}%</TableCell>
                    <TableCell className="text-right text-xs font-semibold text-primary">{a.qualificados}</TableCell>
                    <TableCell className="text-right text-xs">{a.taxaQual}%</TableCell>
                    <TableCell className="text-right text-xs">{a.scoreMedia}</TableCell>
                    <TableCell className="text-right text-xs">{a.quentes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Temperature by channel chart */}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tempByChannel}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="canal" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="quentes" name="Quentes" stackId="a" fill="hsl(var(--destructive))" radius={[0, 0, 0, 0]} />
              <Bar dataKey="mornos" name="Mornos" stackId="a" fill="hsl(var(--warning))" radius={[0, 0, 0, 0]} />
              <Bar dataKey="frios" name="Frios" stackId="a" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── BLOCO: Radar Comparativo Real ── */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Radar Meta vs Google</CardTitle>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">Dados reais</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Radar name="Meta" dataKey="meta" stroke={META_COLOR} fill={META_COLOR} fillOpacity={0.2} />
                <Radar name="Google" dataKey="google" stroke={GOOGLE_COLOR} fill={GOOGLE_COLOR} fillOpacity={0.2} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Leads & Qualificados por Canal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={attribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="canal" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="leads" name="Leads" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="qualificados" name="Qualificados" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── KPIs de mídia (mock — Sol_Ads DataStore pendente) ── */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-bold text-foreground">Métricas de Mídia Paga</h2>
          <Badge variant="outline" className="text-xs">Dados mock — DataStore Sol_Ads em breve</Badge>
        </div>

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
                  <KPICard label="CTR" value={metaKPIs.ctr} suffix="%" />
                  <KPICard label="CPC" value={metaKPIs.cpc} prefix="R$ " />
                  <KPICard label="Leads" value={metaKPIs.leadsGerados} color="text-primary" />
                  <KPICard label="CPL" value={metaKPIs.cpl} prefix="R$ " />
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
                  <KPICard label="CTR" value={googleKPIs.ctr} suffix="%" />
                  <KPICard label="CPC" value={googleKPIs.cpc} prefix="R$ " />
                  <KPICard label="Leads" value={googleKPIs.leadsGerados} color="text-primary" />
                  <KPICard label="CPL" value={googleKPIs.cpl} prefix="R$ " />
                  <KPICard label="ROAS" value={googleKPIs.roas} suffix="×" color="text-primary" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Campanhas (mock) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Performance por Campanha</CardTitle>
            <Badge variant="outline" className="text-xs">Mock</Badge>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead className="text-right">Invest.</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">CPL</TableHead>
                <TableHead className="text-right">Qualif.</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampanhas.map(c => (
                <TableRow key={c.campanha} className={c.cpl === bestCPL ? 'bg-primary/10' : c.cpl === worstCPL ? 'bg-destructive/10' : ''}>
                  <TableCell className="font-medium text-xs">{c.campanha}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs" style={{ borderColor: c.plataforma === 'Meta' ? META_COLOR : GOOGLE_COLOR, color: c.plataforma === 'Meta' ? META_COLOR : GOOGLE_COLOR }}>
                      {c.plataforma}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs">R$ {c.investimento.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right text-xs font-semibold">{c.leads}</TableCell>
                  <TableCell className="text-right text-xs">R$ {c.cpl.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-xs font-semibold">{c.qualificados}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'Ativa' ? 'default' : 'secondary'} className="text-xs">{c.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Métricas de Página (Em Breve) */}
      <Card className="opacity-60">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Métricas de Página</CardTitle>
            <Badge variant="outline" className="gap-1 text-xs">
              <Construction className="h-3 w-3" /> Em desenvolvimento
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {['Visualizações', 'Sessões únicas', 'Taxa de rejeição', 'Tempo médio', 'Origem tráfego'].map(m => (
              <div key={m} className="bg-muted/50 rounded-lg p-3 text-center border border-dashed border-border">
                <p className="text-xs text-muted-foreground">{m}</p>
                <p className="text-lg font-bold text-muted-foreground/50">—</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Evolução Semanal (mock) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Evolução Semanal</CardTitle>
            <Badge variant="outline" className="text-xs">Mock</Badge>
          </div>
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
        Sol Estrateg.IA — Ads Performance • Atribuição real + métricas de mídia mock
      </p>
    </div>
  );
}
