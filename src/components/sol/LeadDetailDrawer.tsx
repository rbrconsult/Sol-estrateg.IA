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
import type { MakeRecord } from "@/hooks/useMakeDataStore";

interface Props {
  lead: MakeRecord | null;
  open: boolean;
  onClose: () => void;
  onQualificar?: (lead: MakeRecord) => void;
  onDesqualificar?: (lead: MakeRecord) => void;
  onReprocessar?: (lead: MakeRecord) => void;
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

  const score = lead.makeScore ? parseFloat(lead.makeScore) : 0;
  const prefIcon = PREF_ICONS[(lead.preferenciaContato || "").toLowerCase()] || "";

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
              <TemperatureBadge temperatura={lead.makeTemperatura} />
              <CanalOrigemBadge canal={lead.canalOrigem} />
            </div>
          </div>
          {score > 0 && (
            <div className="flex items-center gap-3 mt-3">
              <ScoreGauge score={score} size={48} />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Score ICP</p>
                <p className="text-lg font-bold text-foreground">{score.toFixed(0)}</p>
              </div>
              {lead.dsSource && (
                <Badge variant="outline" className="ml-auto text-[10px]">
                  {lead.dsSource === "sol_leads" ? "SOL v2" : "v1"}
                </Badge>
              )}
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
                <InfoRow label="Imóvel" value={lead.imovel} icon={<Home className="h-3 w-3" />} />
                <InfoRow label="Valor da Conta" value={lead.valorConta} />
                <InfoRow label="Acréscimo de Carga" value={lead.acrescimoCarga} />
                <InfoRow label="Prazo de Decisão" value={lead.prazoDecisao} icon={<Clock className="h-3 w-3" />} />
                <InfoRow label="Forma de Pagamento" value={lead.formaPagamento} />
                <InfoRow label="Preferência de Contato" value={lead.preferenciaContato ? `${prefIcon} ${lead.preferenciaContato}` : undefined} />
                <InfoRow label="Potência do Sistema" value={lead.potenciaSistema ? `${lead.potenciaSistema} kWp` : undefined} />
                <InfoRow label="Qualificado por" value={lead.qualificadoPor} />
                {lead.aguardandoContaLuz && (
                  <div className="flex items-center gap-2 py-1.5">
                    <Badge variant="outline" className="text-[10px] border-warning/30 text-warning">⏳ Aguardando conta de luz</Badge>
                  </div>
                )}
                {lead.transferidoComercial && (
                  <div className="flex items-center gap-2 py-1.5">
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">✅ Transferido ao comercial</Badge>
                  </div>
                )}
              </div>
            </section>

            {/* Conversa */}
            {lead.resumoConversa && (
              <section>
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3" /> Resumo da Conversa
                </h4>
                <div className="rounded-lg border border-border/50 p-3">
                  <div className={cn("text-xs text-foreground whitespace-pre-wrap leading-relaxed", !resumoExpanded && "max-h-32 overflow-hidden")}>
                    {lead.resumoConversa}
                  </div>
                  {lead.resumoConversa.length > 200 && (
                    <Button variant="ghost" size="sm" className="mt-2 h-6 text-[10px]" onClick={() => setResumoExpanded(!resumoExpanded)}>
                      {resumoExpanded ? <><ChevronUp className="h-3 w-3 mr-1" /> Recolher</> : <><ChevronDown className="h-3 w-3 mr-1" /> Expandir</>}
                    </Button>
                  )}
                </div>
              </section>
            )}

            {/* Custos */}
            {(lead.custoTotalUsd !== undefined && lead.custoTotalUsd > 0) && (
              <section>
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3" /> Custos Operacionais
                </h4>
                <div className="rounded-lg border border-border/50 p-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground">OpenAI</p>
                      <p className="text-sm font-bold text-foreground">${(lead.custoOpenai || 0).toFixed(3)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">ElevenLabs</p>
                      <p className="text-sm font-bold text-foreground">${(lead.custoElevenlabs || 0).toFixed(3)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Total</p>
                      <p className="text-sm font-bold text-primary">${(lead.custoTotalUsd || 0).toFixed(3)}</p>
                    </div>
                  </div>
                  {(lead.totalMensagensIa !== undefined && lead.totalMensagensIa > 0) && (
                    <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span><Bot className="h-3 w-3 inline mr-0.5" /> {lead.totalMensagensIa} msgs IA</span>
                      {lead.totalAudiosEnviados !== undefined && lead.totalAudiosEnviados > 0 && (
                        <span>🎙️ {lead.totalAudiosEnviados} áudios</span>
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
