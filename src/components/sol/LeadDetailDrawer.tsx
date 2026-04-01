import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, MapPin, Mail, Phone, Home, Zap, DollarSign, Clock, MessageSquare, Bot, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CanalOrigemBadge } from "./CanalOrigemBadge";
import { TemperatureBadge } from "./TemperatureBadge";
import { ScoreGauge } from "./ScoreGauge";
import type { SolLead } from "@/hooks/useSolData";

interface Props {
  lead: SolLead | null;
  open: boolean;
  onClose: () => void;
  onQualificar?: (lead: SolLead) => void;
  onDesqualificar?: (lead: SolLead) => void;
  onReprocessar?: (lead: SolLead) => void;
  actionsLoading?: boolean;
}

function InfoRow({ label, value, icon }: { label: string; value?: string | number | null; icon?: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-2 py-1.5">
      {icon && <span className="mt-0.5 text-muted-foreground">{icon}</span>}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-xs text-foreground mt-0.5">{String(value)}</p>
      </div>
    </div>
  );
}

const PREF_ICONS: Record<string, string> = {
  whatsapp: "📱",
  ligacao: "📞",
  ligação: "📞",
  reuniao: "💻",
  reunião: "💻",
};

export function LeadDetailDrawer({ lead, open, onClose, onQualificar, onDesqualificar, onReprocessar, actionsLoading }: Props) {
  const [resumoExpanded, setResumoExpanded] = useState(false);

  if (!lead) return null;

  const score = lead.score ? parseFloat(lead.score) : 0;
  const prefIcon = PREF_ICONS[(lead.preferencia_contato || "").toLowerCase()] || "";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-base font-bold">{lead.nome || "Lead sem nome"}</SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">{lead.telefone}</p>
            </div>
            <div className="flex items-center gap-2">
              <TemperatureBadge temperatura={lead.temperatura} />
              <CanalOrigemBadge canal={lead.canal_origem} />
            </div>
          </div>
          {score > 0 && (
            <div className="flex items-center gap-3 mt-3">
              <ScoreGauge score={score} size="md" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Score ICP</p>
                <p className="text-lg font-bold text-foreground">{score.toFixed(0)}</p>
              </div>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-4 space-y-5">
            {/* Dados Pessoais */}
            <section>
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="h-3 w-3" /> Dados Pessoais
              </h4>
              <div className="rounded-lg border border-border/50 p-3 space-y-0.5">
                <InfoRow label="Nome" value={lead.nome} />
                <InfoRow label="E-mail" value={lead.email} icon={<Mail className="h-3 w-3" />} />
                <InfoRow label="Telefone" value={lead.telefone} icon={<Phone className="h-3 w-3" />} />
                <InfoRow label="Cidade" value={lead.cidade} icon={<MapPin className="h-3 w-3" />} />
              </div>
            </section>

            {/* Qualificação */}
            <section>
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="h-3 w-3" /> Qualificação
              </h4>
              <div className="rounded-lg border border-border/50 p-3 space-y-0.5">
                <InfoRow label="Imóvel" value={lead.tipo_imovel} icon={<Home className="h-3 w-3" />} />
                <InfoRow label="Valor da Conta" value={lead.valor_conta} />
                <InfoRow label="Acréscimo de Carga" value={lead.acrescimo_carga} />
                <InfoRow label="Prazo de Decisão" value={lead.prazo_decisao} icon={<Clock className="h-3 w-3" />} />
                <InfoRow label="Forma de Pagamento" value={lead.forma_pagamento} />
                <InfoRow label="Preferência de Contato" value={lead.preferencia_contato ? `${prefIcon} ${lead.preferencia_contato}` : undefined} />
                <InfoRow label="Qualificado por" value={lead.qualificado_por} />
                {lead.aguardando_conta_luz && (
                  <div className="flex items-center gap-2 py-1.5">
                    <Badge variant="outline" className="text-[10px] border-warning/30 text-warning">⏳ Aguardando conta de luz</Badge>
                  </div>
                )}
                {lead.transferido_comercial && (
                  <div className="flex items-center gap-2 py-1.5">
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">✅ Transferido ao comercial</Badge>
                  </div>
                )}
              </div>
            </section>

            {/* Conversa */}
            {lead.resumo_conversa && (
              <section>
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3" /> Resumo da Conversa
                </h4>
                <div className="rounded-lg border border-border/50 p-3">
                  <div className={cn("text-xs text-foreground whitespace-pre-wrap leading-relaxed", !resumoExpanded && "max-h-32 overflow-hidden")}>
                    {lead.resumo_conversa}
                  </div>
                  {lead.resumo_conversa.length > 200 && (
                    <Button variant="ghost" size="sm" className="mt-2 h-6 text-[10px]" onClick={() => setResumoExpanded(!resumoExpanded)}>
                      {resumoExpanded ? <><ChevronUp className="h-3 w-3 mr-1" /> Recolher</> : <><ChevronDown className="h-3 w-3 mr-1" /> Expandir</>}
                    </Button>
                  )}
                </div>
              </section>
            )}

            {/* Custos */}
            {(lead.custo_total_usd !== undefined && lead.custo_total_usd !== null && lead.custo_total_usd > 0) && (
              <section>
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3" /> Custos Operacionais
                </h4>
                <div className="rounded-lg border border-border/50 p-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground">OpenAI</p>
                      <p className="text-sm font-bold text-foreground">${(lead.custo_openai || 0).toFixed(3)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">ElevenLabs</p>
                      <p className="text-sm font-bold text-foreground">${(lead.custo_elevenlabs || 0).toFixed(3)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Total</p>
                      <p className="text-sm font-bold text-primary">${(lead.custo_total_usd || 0).toFixed(3)}</p>
                    </div>
                  </div>
                  {(lead.total_mensagens_ia !== undefined && lead.total_mensagens_ia !== null && lead.total_mensagens_ia > 0) && (
                    <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span><Bot className="h-3 w-3 inline mr-0.5" /> {lead.total_mensagens_ia} msgs IA</span>
                      {lead.total_audios_enviados !== undefined && lead.total_audios_enviados !== null && lead.total_audios_enviados > 0 && (
                        <span>🎙️ {lead.total_audios_enviados} áudios</span>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            <Separator />

            {/* Ações */}
            <section>
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ações</h4>
              <div className="flex flex-wrap gap-2">
                {onQualificar && (
                  <Button size="sm" className="text-xs" disabled={actionsLoading} onClick={() => onQualificar(lead)}>
                    ✅ Qualificar
                  </Button>
                )}
                {onDesqualificar && (
                  <Button size="sm" variant="destructive" className="text-xs" disabled={actionsLoading} onClick={() => onDesqualificar(lead)}>
                    ❌ Desqualificar
                  </Button>
                )}
                {onReprocessar && (
                  <Button size="sm" variant="outline" className="text-xs" disabled={actionsLoading} onClick={() => onReprocessar(lead)}>
                    🔄 Reprocessar
                  </Button>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
