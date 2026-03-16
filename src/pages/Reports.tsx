import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Sun, Users, Bot, Megaphone } from "lucide-react";

/* ── Template data with placeholders filled ── */

const templates = {
  executivo: {
    titulo: "Relatório Executivo Diário",
    icon: "☀️",
    destinatario: "Diretoria",
    periodicidade: "Diária — 07:00",
    preview: `☀️ *RELATÓRIO EXECUTIVO DIÁRIO*
📅 16/03/2026

📊 *RESUMO DO DIA*
• Leads gerados: 14
• Leads qualificados: 5 (35,7%)
• Oportunidades criadas: 3
• Vendas realizadas: 1
• Faturamento: R$ 18.400

👥 *PERFORMANCE COMERCIAL*
• Conversão geral: 29,6%
• Melhor closer do dia: Fernanda Dias
• Taxa média de resposta: 58,8%

🤖 *ROBÔS*
• Conversas iniciadas: 8
• Leads gerados: 5
• Taxa de qualificação: 29,6%
• Falhas/desvios: 0

💡 *INSIGHTS*
• Lead quente Carlos Oliveira (Score 87) sem agendamento há 2 dias
• FUP Frio reativou Ana Costa no D+7 — encaminhar ao closer
• Meta Ads gerando 67% dos leads com CPL R$ 98

🎯 *RECOMENDAÇÃO*
Priorizar contato com 3 leads quentes sem agendamento. Fernanda Dias com melhor taxa — redistribuir carga.

_Sol Estrateg.IA — 07:00_`,
  },
  closer: {
    titulo: "Performance por Closer",
    icon: "📊",
    destinatario: "Gerente Comercial",
    periodicidade: "Diária — 07:05",
    preview: `📊 *PERFORMANCE POR CLOSER*
📅 16/03/2026

*Visão geral*
• Leads distribuídos: 9
• Reuniões agendadas: 3
• Propostas enviadas: 2
• Vendas fechadas: 1

👤 *Ricardo Lima*
• Leads: 3 | Reuniões: 1
• Propostas: 1 | Vendas: 0
• Conversão: 34% | Ticket: R$ 14.200
• SLA médio: 47min

👤 *Fernanda Dias*
• Leads: 2 | Reuniões: 1
• Propostas: 1 | Vendas: 1
• Conversão: 41% | Ticket: R$ 18.800
• SLA médio: 32min

👤 *Bruno Costa*
• Leads: 4 | Reuniões: 1
• Propostas: 0 | Vendas: 0
• Conversão: 28% | Ticket: R$ 11.900
• SLA médio: 58min

🏆 *DESTAQUES*
• Melhor conversão: Fernanda Dias (41%)
• Maior volume: Bruno Costa (4 leads)

⚠️ *ATENÇÃO*
• Bruno Costa com SLA acima de 50min — verificar gargalo

🎯 *AÇÃO GERENCIAL*
Redistribuir carga de Bruno Costa. Replicar abordagem de Fernanda para leads quentes.

_Sol Estrateg.IA — 07:05_`,
  },
  robos: {
    titulo: "Relatório dos Robôs",
    icon: "🤖",
    destinatario: "Gerente Comercial + Diretor",
    periodicidade: "Diária — 07:10",
    preview: `🤖 *RELATÓRIO DOS ROBÔS*
📅 16/03/2026

*Resumo geral*
• Conversas totais: 318
• Taxa de resposta: 58,8%
• Leads gerados: 187
• Oportunidades: 94
• Handoff humano: 29,6%
• Falhas: 0

☀️ *ROBÔ SOL (SDR IA)*
• Conversas: 270
• Qualificados: 94 (34,8%)
• Score médio: 62,4
• Temperatura: MORNO
• Tempo médio qual.: 8min 42s
• Erros/falhas: 0

❄️ *ROBÔ FUP FRIO*
• Disparos: 124
• Respostas: 86 (69,4%)
• Reativados: 31
• Melhor etapa: D+7

⚙️ *SAÚDE DOS CENÁRIOS*
• Sol SDR: ✅ Operacional
• FUP Frio: ✅ Operacional
• Meta Sync: ✅ Operacional
• Google Sync: ✅ Operacional

💡 *INSIGHTS*
• Taxa de qualificação estável em ~30% — dentro do esperado
• FUP D+7 com pico de reativação (22,4%) — manter cadência

🔧 *AJUSTE RECOMENDADO*
Aumentar agressividade do FUP D+3 (prova social) — taxa subiu para 17,9%.

_Sol Estrateg.IA — 07:10_`,
  },
  campanha: {
    titulo: "Campanha + Insights de Leads",
    icon: "📣",
    destinatario: "Diretoria + Gerente MKT",
    periodicidade: "Semanal — Segunda 08:00",
    preview: `📣 *RELATÓRIO DE CAMPANHA + INSIGHTS*
📅 Semana 10/03 a 16/03/2026

*Resultado da campanha*
• Investimento: R$ 29.600
• Leads gerados: 276
• CPL: R$ 107,25
• Leads qualificados: 75 (27,2%)
• Oportunidades: 31
• Vendas: 8
• CAC: R$ 3.700
• ROI: 4,8×

*Qualidade dos leads*
• Perfil predominante: Residencial 300-600kWh
• Principal origem: Meta Ads (67%)
• Intenção mais comum: Redução de conta
• Objeção mais comum: Valor do investimento

🏆 *TOP CAMPANHAS*
1. Solar Residencial SP — 112 leads | CPL R$ 89 | 31% qual.
2. Energia Limpa Interior — 87 leads | CPL R$ 102 | 26% qual.
3. Google Search Brand — 42 leads | CPL R$ 118 | 28% qual.

💡 *INSIGHTS*
• Meta Ads supera Google em volume mas Google tem CTR 2x maior
• Leads de Google convertem 12% mais rápido no closer
• Criativo "Economia Real" com melhor Hook Rate (8,2%)

🎯 *PRÓXIMAS AÇÕES*
Escalar campanha Solar Residencial SP. Testar novo criativo de prova social no Google.

_Sol Estrateg.IA × RBR Consult_`,
  },
};

const tabConfig = [
  { key: "executivo", label: "Executivo", icon: Sun },
  { key: "closer", label: "Closer", icon: Users },
  { key: "robos", label: "Robôs", icon: Bot },
  { key: "campanha", label: "Campanha", icon: Megaphone },
] as const;

export default function Reports() {
  const [activeTab, setActiveTab] = useState("executivo");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Reports Programados
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Templates dos relatórios WhatsApp enviados automaticamente pelo Make
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          {tabConfig.map((t) => (
            <TabsTrigger key={t.key} value={t.key} className="text-xs">
              <t.icon className="h-4 w-4 mr-1" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabConfig.map((t) => {
          const tmpl = templates[t.key];
          return (
            <TabsContent key={t.key} value={t.key} className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Meta info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Configuração</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Relatório</p>
                      <p className="text-sm font-medium text-foreground">{tmpl.icon} {tmpl.titulo}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Destinatário</p>
                      <p className="text-sm text-foreground">{tmpl.destinatario}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Periodicidade</p>
                      <p className="text-sm text-foreground">{tmpl.periodicidade}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Canal</p>
                      <Badge variant="outline" className="text-xs">WhatsApp</Badge>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Responsável envio</p>
                      <Badge variant="secondary" className="text-xs">Make (Schedule)</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Preview */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Preview da Mensagem</CardTitle>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                        Dados mock
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <div className="rounded-xl bg-[#0b141a] border border-border/30 p-4">
                        <div className="bg-[#005c4b] rounded-lg p-3 max-w-[90%] ml-auto">
                          <pre className="text-xs text-white/90 whitespace-pre-wrap font-sans leading-relaxed">
                            {tmpl.preview}
                          </pre>
                          <div className="text-right mt-1">
                            <span className="text-[9px] text-white/50">07:00 ✓✓</span>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
