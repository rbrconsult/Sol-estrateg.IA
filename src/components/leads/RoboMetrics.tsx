import { useMemo } from "react";
import { Bot, MessageSquare, Clock, RotateCcw, Phone, Video, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import type { Lead } from "@/data/leadsMockData";

const COLORS = ["hsl(var(--primary))", "hsl(var(--warning))", "hsl(142 71% 45%)"];

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h${m > 0 ? ` ${m}min` : ""}`;
}

interface Props { leads: Lead[] }

export function RoboMetrics({ leads }: Props) {
  const metrics = useMemo(() => {
    const atendidos = leads.filter((l) => l.robo_atendeu);
    const totalMsgs = leads.reduce((s, l) => s + l.robo_mensagens, 0);
    const avgResposta = atendidos.length > 0
      ? atendidos.reduce((s, l) => s + l.robo_tempo_resposta_lead, 0) / atendidos.length
      : 0;
    const fupLeads = leads.filter((l) => l.status !== "qualificado");
    const avgFup = fupLeads.length > 0
      ? fupLeads.reduce((s, l) => s + l.robo_tempo_fup_frio, 0) / fupLeads.length
      : 0;

    // agendamentos
    const agendamentos = {
      whatsapp: leads.filter((l) => l.tipo_agendamento === "whatsapp").length,
      reuniao_online: leads.filter((l) => l.tipo_agendamento === "reuniao_online").length,
      ligacao: leads.filter((l) => l.tipo_agendamento === "ligacao").length,
    };

    // FUP behavior by range
    const fupRanges = [
      { label: "< 1h", min: 0, max: 3600 },
      { label: "1-6h", min: 3600, max: 21600 },
      { label: "6-24h", min: 21600, max: 86400 },
      { label: "> 24h", min: 86400, max: Infinity },
    ];
    const fupData = fupRanges.map((r) => ({
      name: r.label,
      leads: fupLeads.filter((l) => l.robo_tempo_fup_frio >= r.min && l.robo_tempo_fup_frio < r.max).length,
    }));

    return { atendidos: atendidos.length, totalMsgs, avgResposta, avgFup, agendamentos, fupData };
  }, [leads]);

  const agendamentoData = [
    { name: "WhatsApp", value: metrics.agendamentos.whatsapp },
    { name: "Reunião Online", value: metrics.agendamentos.reuniao_online },
    { name: "Ligação", value: metrics.agendamentos.ligacao },
  ];

  const kpis = [
    { label: "Atendidos pelo Robô", value: metrics.atendidos, icon: Bot, color: "text-primary" },
    { label: "Mensagens Enviadas", value: metrics.totalMsgs, icon: MessageSquare, color: "text-warning" },
    { label: "Tempo Médio Resposta", value: formatTime(metrics.avgResposta), icon: Clock, color: "text-emerald-500" },
    { label: "Tempo Médio FUP Frio", value: formatTime(metrics.avgFup), icon: RotateCcw, color: "text-destructive" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2"><Bot className="h-5 w-5" /> Métricas do Robô</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-secondary ${k.color}`}>
                <k.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-xl font-bold">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Agendamentos por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={agendamentoData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {agendamentoData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Comportamento FUP Frio</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={metrics.fupData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="leads" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
