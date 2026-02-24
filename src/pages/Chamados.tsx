import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TicketForm } from "@/components/chamados/TicketForm";
import { TicketList } from "@/components/chamados/TicketList";
import { TicketDetail } from "@/components/chamados/TicketDetail";
import { TeamMetrics } from "@/components/chamados/TeamMetrics";
import { Card, CardContent } from "@/components/ui/card";
import { Headset, CheckCircle, AlertTriangle, XCircle, PauseCircle } from "lucide-react";
import { getSLAStatus } from "@/components/chamados/SLATimer";
import { HelpButton } from "@/components/HelpButton";

interface KPIProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}

function KPICard({ icon: Icon, label, value, color }: KPIProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Chamados() {
  const { user, userRole } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string>();
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("support_tickets" as any)
      .select("*")
      .order("created_at", { ascending: false });

    setTickets((data as any[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTickets();

    const channel = supabase
      .channel("tickets-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => fetchTickets())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTickets]);

  const activeTickets = tickets.filter((t) => !["resolvido", "fechado"].includes(t.status));
  const openTickets = activeTickets.filter((t) => t.status === "aberto" || t.status === "em_andamento");
  const aguardandoUsuario = activeTickets.filter((t) => t.status === "aguardando_usuario").length;
  const withinSLA = openTickets.filter((t) => getSLAStatus(t.sla_deadline, t.created_at, t.sla_paused_at) === "ok").length;
  const warningSLA = openTickets.filter((t) => getSLAStatus(t.sla_deadline, t.created_at, t.sla_paused_at) === "warning").length;
  const overdueSLA = openTickets.filter((t) => getSLAStatus(t.sla_deadline, t.created_at, t.sla_paused_at) === "overdue").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Headset className="h-6 w-6 text-primary" /> Chamados
          </h1>
          <p className="text-sm text-muted-foreground">Abra e acompanhe seus chamados de suporte</p>
        </div>
        <div className="flex items-center gap-2">
          <HelpButton moduleId="chamados" label="Ajuda de Chamados" />
          <TicketForm onTicketCreated={fetchTickets} onSelectTicket={setSelectedTicketId} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard icon={Headset} label="Abertos" value={openTickets.length} color="bg-blue-500/20 text-blue-400" />
        <KPICard icon={PauseCircle} label="Aguardando Usuário" value={aguardandoUsuario} color="bg-purple-500/20 text-purple-400" />
        <KPICard icon={CheckCircle} label="Dentro do SLA" value={withinSLA} color="bg-emerald-500/20 text-emerald-400" />
        <KPICard icon={AlertTriangle} label="Próx. de Vencer" value={warningSLA} color="bg-amber-500/20 text-amber-400" />
        <KPICard icon={XCircle} label="Fora do SLA" value={overdueSLA} color="bg-destructive/20 text-destructive" />
      </div>

      <TeamMetrics />

      <div className={selectedTicketId ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : ""}>
        <div>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Carregando chamados...</div>
          ) : (
            <TicketList tickets={tickets} onSelectTicket={setSelectedTicketId} selectedTicketId={selectedTicketId} />
          )}
        </div>

        {selectedTicketId && (
          <TicketDetail
            ticketId={selectedTicketId}
            onClose={() => setSelectedTicketId(undefined)}
            onUpdated={fetchTickets}
          />
        )}
      </div>
    </div>
  );
}
