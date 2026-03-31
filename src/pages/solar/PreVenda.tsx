import { useState, useMemo } from 'react';
import { useSolLeadsSync } from '@/hooks/useSolLeadsSync';
import { useSolEquipeSync, useSolQualificacaoSync } from '@/hooks/useSolSyncTables';
import { useSolActionsV2 } from '@/hooks/useSolActionsV2';
import { useFranquiaId } from '@/hooks/useFranquiaId';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Search, RefreshCw, Phone, MessageSquare, Clock, FileText, Send, X, RotateCcw, UserCheck, UserX } from 'lucide-react';
import type { SolLeadSync } from '@/hooks/useSolLeadsSync';

const KANBAN_COLUMNS = ['TRAFEGO_PAGO', 'EM_QUALIFICACAO', 'FOLLOW_UP'] as const;
const COL_LABELS: Record<string, string> = { TRAFEGO_PAGO: 'Leads Recebidos', EM_QUALIFICACAO: 'MQL', FOLLOW_UP: 'Follow Up' };
const COL_COLORS: Record<string, string> = { TRAFEGO_PAGO: 'border-blue-500/60 bg-blue-500/10', EM_QUALIFICACAO: 'border-amber-500/60 bg-amber-500/10', FOLLOW_UP: 'border-violet-500/60 bg-violet-500/10' };

function timeAgo(ts: string | null): string {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '—';
  const diff = Date.now() - d.getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff / 60000)}min`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function scoreBadge(score: string | null) {
  const s = parseInt(score || '0');
  if (s >= 70) return 'text-red-500 border-red-500/30';
  if (s >= 40) return 'text-yellow-500 border-yellow-500/30';
  return 'text-blue-500 border-blue-500/30';
}

export default function PreVenda() {
  const franquiaId = useFranquiaId();
  const { data: leads, isLoading: l1, refetch } = useSolLeadsSync(['TRAFEGO_PAGO', 'EM_QUALIFICACAO', 'FOLLOW_UP', 'DESQUALIFICADO']);
  const { data: equipe, isLoading: l2 } = useSolEquipeSync();
  const { data: qualificacoes } = useSolQualificacaoSync();
  const actions = useSolActionsV2();

  const [search, setSearch] = useState('');
  const [tempFilter, setTempFilter] = useState('all');
  const [canalFilter, setCanalFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<SolLeadSync | null>(null);
  const [desqualMotivo, setDesqualMotivo] = useState('');
  const [showDesqualDialog, setShowDesqualDialog] = useState(false);
  const [desqualTarget, setDesqualTarget] = useState<SolLeadSync | null>(null);

  const isLoading = l1 || l2;
  const closers = useMemo(() => (equipe || []).filter(e => e.ativo && e.krolik_ativo), [equipe]);

  const filtered = useMemo(() => {
    if (!leads) return [];
    return leads.filter(l => {
      if (search) {
        const q = search.toLowerCase();
        if (!(l.nome || '').toLowerCase().includes(q) && !l.telefone.includes(q)) return false;
      }
      if (tempFilter !== 'all' && (l.temperatura || '').toUpperCase() !== tempFilter) return false;
      if (canalFilter !== 'all' && (l.canal_origem || '') !== canalFilter) return false;
      return true;
    });
  }, [leads, search, tempFilter, canalFilter]);

  const byColumn = useMemo(() => {
    const grouped: Record<string, SolLeadSync[]> = {};
    KANBAN_COLUMNS.forEach(c => grouped[c] = []);
    filtered.forEach(l => {
      const s = l.status || 'TRAFEGO_PAGO';
      if (grouped[s]) grouped[s].push(l);
      else if (s === 'DESQUALIFICADO') { /* skip */ }
      else grouped['TRAFEGO_PAGO'].push(l);
    });
    return grouped;
  }, [filtered]);

  const kpis = useMemo(() => {
    const total = filtered.length;
    const emQual = filtered.filter(l => l.status === 'EM_QUALIFICACAO').length;
    const fup = filtered.filter(l => l.status === 'FOLLOW_UP').length;
    const scores = filtered.map(l => parseInt(l.score || '0')).filter(s => s > 0);
    const scoreMedio = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return { total, emQual, fup, scoreMedio };
  }, [filtered]);

  const qual = useMemo(() => {
    if (!selectedLead || !qualificacoes) return null;
    return qualificacoes.find(q => q.telefone === selectedLead.telefone) || null;
  }, [selectedLead, qualificacoes]);

  const handleQualificar = (lead: SolLeadSync) => {
    actions.qualificar.mutate({
      telefone: lead.telefone, nome: lead.nome, score: lead.score, temperatura: lead.temperatura,
      valor_conta: lead.valor_conta, preferencia_contato: lead.preferencia_contato, email: lead.email,
      chat_id: lead.chat_id, contact_id: lead.contact_id, project_id: lead.project_id, canal_origem: lead.canal_origem,
    }, { onSuccess: () => { refetch(); setSelectedLead(null); } });
  };

  const handleDesqualificar = () => {
    if (!desqualTarget) return;
    actions.desqualificar.mutate({
      telefone: desqualTarget.telefone, chat_id: desqualTarget.chat_id, contact_id: desqualTarget.contact_id, motivo: desqualMotivo,
    }, { onSuccess: () => { refetch(); setShowDesqualDialog(false); setDesqualTarget(null); setDesqualMotivo(''); setSelectedLead(null); } });
  };

  const handleReprocessar = (lead: SolLeadSync) => {
    actions.reprocessar.mutate({ telefone: lead.telefone }, { onSuccess: () => refetch() });
  };

  const handleTransferir = (lead: SolLeadSync) => {
    actions.transferir.mutate({
      telefone: lead.telefone, nome: lead.nome, score: lead.score, temperatura: lead.temperatura,
      valor_conta: lead.valor_conta, preferencia_contato: lead.preferencia_contato, email: lead.email,
      chat_id: lead.chat_id, contact_id: lead.contact_id, project_id: lead.project_id, canal_origem: lead.canal_origem,
    }, { onSuccess: () => { refetch(); setSelectedLead(null); } });
  };

  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-64 mb-4" /><div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96" />)}</div></div>;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pré-Venda SDR</h1>
          <p className="text-xs text-muted-foreground">Kanban de leads pré-qualificação</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Nome ou telefone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-44 h-9 text-xs" />
          </div>
          <Select value={tempFilter} onValueChange={setTempFilter}>
            <SelectTrigger className="w-[110px] h-9 text-xs"><SelectValue placeholder="Temperatura" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todas</SelectItem><SelectItem value="QUENTE">Quente</SelectItem><SelectItem value="MORNO">Morno</SelectItem><SelectItem value="FRIO">Frio</SelectItem></SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9 text-xs">
            <RefreshCw className="mr-1 h-3 w-3" /> Atualizar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-3"><p className="text-xs text-muted-foreground">Total Leads</p><p className="text-xl font-bold">{kpis.total}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Em Qualificação</p><p className="text-xl font-bold">{kpis.emQual}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Follow Up</p><p className="text-xl font-bold">{kpis.fup}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Score Médio</p><p className="text-xl font-bold">{kpis.scoreMedio}</p></Card>
      </div>

      {/* Kanban */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {KANBAN_COLUMNS.map(column => {
            const items = byColumn[column] || [];
            return (
              <div key={column} className="flex-shrink-0 w-[320px]">
                <div className={`rounded-t-lg border-t-4 ${COL_COLORS[column]} bg-card p-3`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground text-sm">{COL_LABELS[column]}</h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{items.length}</span>
                  </div>
                </div>
                <div className="rounded-b-lg border border-t-0 border-border bg-muted/10 p-2 min-h-[400px] max-h-[calc(100vh-340px)] overflow-y-auto">
                  <div className="space-y-2">
                    {items.map(lead => (
                      <div key={lead.telefone} className="rounded-lg border border-border bg-card p-3 hover:bg-accent/30 transition-colors cursor-pointer whitespace-normal" onClick={() => setSelectedLead(lead)}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium truncate">{lead.nome || lead.telefone}</p>
                          {lead.score && <Badge variant="outline" className={`text-[10px] ${scoreBadge(lead.score)}`}>{lead.score}</Badge>}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Phone className="h-3 w-3" />
                          <a href={`https://wa.me/${lead.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary" onClick={e => e.stopPropagation()}>{lead.telefone}</a>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {lead.canal_origem && <Badge variant="secondary" className="text-[10px]">{lead.canal_origem}</Badge>}
                          {lead.temperatura && <Badge variant="outline" className="text-[10px]">{lead.temperatura}</Badge>}
                          {lead.aguardando_conta_luz && <Badge variant="outline" className="text-[10px]">📎 Conta</Badge>}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{lead.valor_conta ? `R$ ${lead.valor_conta}` : ''} {lead.tipo_imovel ? `| ${lead.tipo_imovel}` : ''}</span>
                          <span>
                            {lead.total_mensagens_ia ? `💬 ${lead.total_mensagens_ia}` : ''}
                            {' · '}
                            <Clock className="inline h-2.5 w-2.5" /> {timeAgo(lead.ts_cadastro)}
                          </span>
                        </div>
                        {lead.status === 'FOLLOW_UP' && lead.fup_followup_count != null && (
                          <p className="text-[10px] text-muted-foreground mt-1">FUP #{lead.fup_followup_count}/9</p>
                        )}
                        {/* Action buttons */}
                        <div className="flex gap-1 mt-2" onClick={e => e.stopPropagation()}>
                          {lead.status === 'EM_QUALIFICACAO' && parseInt(lead.score || '0') >= 40 && (
                            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-green-600" onClick={() => handleQualificar(lead)} disabled={actions.isLoading}>
                              <UserCheck className="h-3 w-3 mr-1" /> Qualificar
                            </Button>
                          )}
                          {['EM_QUALIFICACAO', 'TRAFEGO_PAGO', 'FOLLOW_UP'].includes(lead.status || '') && (
                            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-red-600" onClick={() => { setDesqualTarget(lead); setShowDesqualDialog(true); }} disabled={actions.isLoading}>
                              <UserX className="h-3 w-3 mr-1" /> Desqual.
                            </Button>
                          )}
                          {['DESQUALIFICADO', 'FOLLOW_UP', 'TRAFEGO_PAGO'].includes(lead.status || '') && (
                            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => handleReprocessar(lead)} disabled={actions.isLoading}>
                              <RotateCcw className="h-3 w-3 mr-1" /> Reproc.
                            </Button>
                          )}
                          {lead.status === 'EM_QUALIFICACAO' && (
                            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-primary" onClick={() => handleTransferir(lead)} disabled={actions.isLoading}>
                              <Send className="h-3 w-3 mr-1" /> Transferir
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">Nenhum lead</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Lead Detail Drawer */}
      <Sheet open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedLead && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedLead.nome || selectedLead.telefone}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Dados Pessoais</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground text-xs">Telefone:</span> <a href={`https://wa.me/${selectedLead.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-primary">{selectedLead.telefone}</a></div>
                    <div><span className="text-muted-foreground text-xs">Email:</span> {selectedLead.email || '—'}</div>
                    <div><span className="text-muted-foreground text-xs">Cidade:</span> {selectedLead.cidade || '—'}</div>
                    <div><span className="text-muted-foreground text-xs">Canal:</span> {selectedLead.canal_origem || '—'}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Qualificação Solar</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground text-xs">Valor Conta:</span> R$ {selectedLead.valor_conta || '—'}</div>
                    <div><span className="text-muted-foreground text-xs">Imóvel:</span> {selectedLead.tipo_imovel || '—'}</div>
                    <div><span className="text-muted-foreground text-xs">Telhado:</span> {selectedLead.tipo_telhado || '—'}</div>
                    <div><span className="text-muted-foreground text-xs">Acréscimo:</span> {selectedLead.acrescimo_carga || '—'}</div>
                    <div><span className="text-muted-foreground text-xs">Prazo:</span> {selectedLead.prazo_decisao || '—'}</div>
                    <div><span className="text-muted-foreground text-xs">Pagamento:</span> {selectedLead.forma_pagamento || '—'}</div>
                    <div><span className="text-muted-foreground text-xs">Pref. Contato:</span> {selectedLead.preferencia_contato || '—'}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Score & Temperatura</h4>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`${scoreBadge(selectedLead.score)}`}>{selectedLead.score || '—'}</Badge>
                    <Badge variant="secondary">{selectedLead.temperatura || '—'}</Badge>
                  </div>
                </div>
                {qual?.resumo_qualificacao && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase">Resumo IA</h4>
                    <p className="text-sm bg-muted/50 p-3 rounded whitespace-pre-wrap">{qual.resumo_qualificacao}</p>
                  </div>
                )}
                {selectedLead.resumo_conversa && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase">Conversa</h4>
                    <p className="text-sm bg-muted/50 p-3 rounded whitespace-pre-wrap max-h-48 overflow-y-auto">{selectedLead.resumo_conversa}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Custos</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div><span className="text-muted-foreground text-xs">OpenAI:</span> ${(selectedLead.custo_openai || 0).toFixed(3)}</div>
                    <div><span className="text-muted-foreground text-xs">ElevenLabs:</span> ${(selectedLead.custo_elevenlabs || 0).toFixed(3)}</div>
                    <div><span className="text-muted-foreground text-xs">Total:</span> ${(selectedLead.custo_total_usd || 0).toFixed(3)}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Timestamps</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Cadastro: {selectedLead.ts_cadastro ? new Date(selectedLead.ts_cadastro).toLocaleString('pt-BR') : '—'}</div>
                    <div>Última Interação: {timeAgo(selectedLead.ts_ultima_interacao)}</div>
                    <div>FUPs: {selectedLead.fup_followup_count || 0}/9</div>
                    <div>Msgs IA: {selectedLead.total_mensagens_ia || 0}</div>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {selectedLead.status === 'EM_QUALIFICACAO' && parseInt(selectedLead.score || '0') >= 40 && (
                    <Button size="sm" onClick={() => handleQualificar(selectedLead)} disabled={actions.isLoading}><UserCheck className="mr-1 h-4 w-4" /> Qualificar</Button>
                  )}
                  {selectedLead.status === 'EM_QUALIFICACAO' && (
                    <Button size="sm" variant="outline" onClick={() => handleTransferir(selectedLead)} disabled={actions.isLoading}><Send className="mr-1 h-4 w-4" /> Transferir Closer</Button>
                  )}
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => { setDesqualTarget(selectedLead); setShowDesqualDialog(true); }} disabled={actions.isLoading}><UserX className="mr-1 h-4 w-4" /> Desqualificar</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleReprocessar(selectedLead)} disabled={actions.isLoading}><RotateCcw className="mr-1 h-4 w-4" /> Reprocessar</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Desqualificar dialog */}
      <AlertDialog open={showDesqualDialog} onOpenChange={setShowDesqualDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desqualificar Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo da desqualificação de <strong>{desqualTarget?.nome || desqualTarget?.telefone}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea placeholder="Ex: conta baixa, sem interesse..." value={desqualMotivo} onChange={e => setDesqualMotivo(e.target.value)} />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDesqualMotivo(''); setDesqualTarget(null); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDesqualificar} disabled={!desqualMotivo.trim() || actions.isLoading}>Desqualificar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
