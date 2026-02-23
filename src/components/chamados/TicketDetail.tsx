import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SLATimer } from "./SLATimer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Send, X, CheckCircle, Undo2, Clock, Trash2, MessageCircle, RotateCcw, Timer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface TicketDetailProps {
  ticketId: string;
  onClose: () => void;
  onUpdated: () => void;
}

const statusLabels: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em Andamento",
  aguardando_usuario: "Aguardando Usuário",
  resolvido: "Resolvido",
  fechado: "Fechado",
};

export function TicketDetail({ ticketId, onClose, onUpdated }: TicketDetailProps) {
  const { user, userRole } = useAuth();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Return dialog state
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returning, setReturning] = useState(false);

  // Resolve dialog state
  const [resolveOpen, setResolveOpen] = useState(false);
  const [workHoursInput, setWorkHoursInput] = useState("");
  const [resolving, setResolving] = useState(false);

  const isAdmin = userRole === "super_admin" || userRole === "admin";

  const fetchData = async () => {
    setLoading(true);
    const [ticketRes, messagesRes, historyRes] = await Promise.all([
      supabase.from("support_tickets" as any).select("*").eq("id", ticketId).single(),
      supabase.from("ticket_messages" as any).select("*").eq("ticket_id", ticketId).order("created_at", { ascending: true }),
      supabase.from("ticket_status_history" as any).select("*").eq("ticket_id", ticketId).order("created_at", { ascending: true }),
    ]);

    if (ticketRes.data) setTicket(ticketRes.data);
    if (messagesRes.data) setMessages(messagesRes.data as any[]);
    if (historyRes.data) setStatusHistory(historyRes.data as any[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_messages", filter: `ticket_id=eq.${ticketId}` }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets", filter: `id=eq.${ticketId}` }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ticketId]);

  const recordStatusChange = async (oldStatus: string, newStatus: string, reason?: string) => {
    if (!user) return;
    await supabase.from("ticket_status_history" as any).insert({
      ticket_id: ticketId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: user.id,
      reason: reason || null,
    });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    setSending(true);

    const { error } = await supabase.from("ticket_messages" as any).insert({
      ticket_id: ticketId,
      user_id: user.id,
      message: newMessage.trim(),
    });

    if (error) {
      toast.error("Erro ao enviar mensagem");
      setSending(false);
      return;
    }

    // Auto-return: if ticket is aguardando_usuario and user (non-admin) responds, change to em_andamento
    if (ticket?.status === "aguardando_usuario" && ticket?.user_id === user.id) {
      // Resume SLA: calculate paused time and extend deadline
      const updateData: any = { status: "em_andamento", sla_paused_at: null };
      if (ticket.sla_paused_at) {
        const pausedMs = Date.now() - new Date(ticket.sla_paused_at).getTime();
        const newDeadline = new Date(new Date(ticket.sla_deadline).getTime() + pausedMs).toISOString();
        updateData.sla_deadline = newDeadline;
        updateData.sla_paused_total_ms = (ticket.sla_paused_total_ms || 0) + pausedMs;
      }
      await supabase
        .from("support_tickets" as any)
        .update(updateData)
        .eq("id", ticketId);
      await recordStatusChange("aguardando_usuario", "em_andamento");
    }

    // Track first response from admin
    if (isAdmin && !ticket?.first_response_at) {
      await supabase
        .from("support_tickets" as any)
        .update({ first_response_at: new Date().toISOString() })
        .eq("id", ticketId);
    }

    // If ticket is still "aberto" and admin responds, move to em_andamento
    if (isAdmin && ticket?.status === "aberto") {
      await supabase
        .from("support_tickets" as any)
        .update({ status: "em_andamento" })
        .eq("id", ticketId);
      await recordStatusChange("aberto", "em_andamento");
    }

    setSending(false);
    setNewMessage("");
    fetchData();
    onUpdated();
  };

  const handleReturnToUser = async () => {
    if (!returnReason.trim() || !user) return;
    setReturning(true);

    // Send the reason as a message
    await supabase.from("ticket_messages" as any).insert({
      ticket_id: ticketId,
      user_id: user.id,
      message: `⚠️ Devolvido ao usuário: ${returnReason.trim()}`,
    });

    const oldStatus = ticket?.status || "aberto";
    await supabase
      .from("support_tickets" as any)
      .update({ status: "aguardando_usuario", sla_paused_at: new Date().toISOString() })
      .eq("id", ticketId);

    await recordStatusChange(oldStatus, "aguardando_usuario", returnReason.trim());

    // Send WhatsApp notification to ticket owner
    try {
      // Get ticket owner's phone from profiles
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("phone, full_name")
        .eq("id", ticket.user_id)
        .single();

      await supabase.functions.invoke("notify-ticket-whatsapp", {
        body: {
          type: "return",
          ticketId,
          ticketNumero: String(ticket.ticket_number || 0).padStart(4, "0"),
          titulo: ticket.titulo,
          reason: returnReason.trim(),
          userPhone: ownerProfile?.phone || null,
          userName: ownerProfile?.full_name || null,
        },
      });
    } catch (e) {
      console.error("Error sending return WhatsApp notification:", e);
    }

    setReturning(false);
    setReturnReason("");
    setReturnOpen(false);
    toast.success("Chamado devolvido ao usuário.");
    fetchData();
    onUpdated();
  };

  const handleDelete = async () => {
    if (!user || !isAdmin) return;
    const { error } = await supabase
      .from("support_tickets" as any)
      .delete()
      .eq("id", ticketId);
    if (error) {
      toast.error("Erro ao excluir chamado");
      return;
    }
    toast.success("Chamado excluído!");
    onClose();
    onUpdated();
  };

  const handleResolve = async () => {
    if (!user) return;
    setResolving(true);
    const oldStatus = ticket?.status || "aberto";
    const workHours = workHoursInput ? parseFloat(workHoursInput) : null;

    const { error } = await supabase
      .from("support_tickets" as any)
      .update({ 
        status: "resolvido", 
        resolved_at: new Date().toISOString(),
        work_hours: workHours,
      })
      .eq("id", ticketId);

    if (error) {
      toast.error("Erro ao resolver chamado");
      setResolving(false);
      return;
    }

    await recordStatusChange(oldStatus, "resolvido");

    // Send WhatsApp notification to ticket owner
    try {
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("phone, full_name")
        .eq("id", ticket.user_id)
        .single();

      await supabase.functions.invoke("notify-ticket-whatsapp", {
        body: {
          type: "resolved",
          ticketId,
          ticketNumero: String(ticket.ticket_number || 0).padStart(4, "0"),
          titulo: ticket.titulo,
          userPhone: ticket.notification_phone || ownerProfile?.phone || null,
          userName: ownerProfile?.full_name || null,
        },
      });
    } catch (e) {
      console.error("Error sending resolve WhatsApp notification:", e);
    }

    setResolving(false);
    setWorkHoursInput("");
    setResolveOpen(false);
    toast.success("Chamado marcado como resolvido!");
    onUpdated();
    fetchData();
  };

  const handleReopen = async () => {
    if (!user) return;
    const oldStatus = ticket?.status || "resolvido";
    const { error } = await supabase
      .from("support_tickets" as any)
      .update({ status: "em_andamento", resolved_at: null, closed_at: null })
      .eq("id", ticketId);

    if (error) {
      toast.error("Erro ao reabrir chamado");
      return;
    }

    await recordStatusChange(oldStatus, "em_andamento", "Chamado reaberto");

    // Send WhatsApp notification to ticket owner
    try {
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("phone, full_name")
        .eq("id", ticket.user_id)
        .single();

      await supabase.functions.invoke("notify-ticket-whatsapp", {
        body: {
          type: "reopen",
          ticketId,
          ticketNumero: String(ticket.ticket_number || 0).padStart(4, "0"),
          titulo: ticket.titulo,
          userPhone: ownerProfile?.phone || null,
          userName: ownerProfile?.full_name || null,
        },
      });
    } catch (e) {
      console.error("Error sending reopen WhatsApp notification:", e);
    }

    toast.success("Chamado reaberto!");
    onUpdated();
    fetchData();
  };

  // Calculate time metrics
  const getTimeMetrics = () => {
    if (!ticket) return null;
    const created = new Date(ticket.created_at).getTime();
    const resolved = ticket.resolved_at ? new Date(ticket.resolved_at).getTime() : null;
    const firstResponse = ticket.first_response_at ? new Date(ticket.first_response_at).getTime() : null;

    const formatDuration = (ms: number) => {
      const hours = Math.floor(ms / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 0) return `${hours}h ${minutes}min`;
      return `${minutes}min`;
    };

    return {
      firstResponse: firstResponse ? formatDuration(firstResponse - created) : null,
      totalTime: resolved ? formatDuration(resolved - created) : null,
    };
  };

  const metrics = getTimeMetrics();

  if (loading || !ticket) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">Carregando...</CardContent>
      </Card>
    );
  }

  const isResolved = ticket.status === "fechado" || ticket.status === "resolvido";

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader className="pb-3 flex flex-row items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{ticket.titulo}</CardTitle>
            <div className="flex gap-2 items-center flex-wrap">
              <Badge variant="outline" className="text-xs">#{String(ticket.ticket_number || 0).padStart(4, "0")}</Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  ticket.status === "aguardando_usuario" && "border-purple-500/50 text-purple-400",
                  ticket.status === "aberto" && "border-blue-500/50 text-blue-400",
                  ticket.status === "em_andamento" && "border-amber-500/50 text-amber-400",
                  ticket.status === "resolvido" && "border-emerald-500/50 text-emerald-400",
                  ticket.status === "fechado" && "border-muted-foreground/50 text-muted-foreground"
                )}
              >
                {statusLabels[ticket.status] || ticket.status}
              </Badge>
              {!isResolved && (
                <SLATimer deadline={ticket.sla_deadline} createdAt={ticket.created_at} pausedAt={ticket.sla_paused_at} />
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:bg-destructive/10" title="Excluir chamado">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ticket info */}
          <div className="bg-muted/30 rounded-lg p-4 text-sm space-y-2">
            <p>{ticket.descricao}</p>
            {ticket.fluxo && <p className="text-xs"><span className="font-medium">Fluxo:</span> {ticket.fluxo}</p>}
            {ticket.plataforma && <p className="text-xs"><span className="font-medium">Plataforma:</span> {ticket.plataforma}</p>}
            {ticket.cliente_nome && <p className="text-xs"><span className="font-medium">Cliente:</span> {ticket.cliente_nome} {ticket.cliente_telefone && `• ${ticket.cliente_telefone}`}</p>}
            {ticket.detalhes && <p className="text-xs"><span className="font-medium">Detalhes:</span> {ticket.detalhes}</p>}
            {ticket.attachment_url && (
              <a href={ticket.attachment_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline inline-flex items-center gap-1">
                📎 Ver Anexo
              </a>
            )}
          </div>

          {/* Time metrics for resolved tickets */}
          {isResolved && metrics && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-center gap-3">
              <Clock className="h-4 w-4 text-emerald-400" />
              <div className="text-xs space-y-0.5">
                {metrics.firstResponse && <p><span className="font-medium">Primeira resposta:</span> {metrics.firstResponse}</p>}
                {metrics.totalTime && <p><span className="font-medium">Tempo total:</span> {metrics.totalTime}</p>}
              </div>
            </div>
          )}

          {/* Status history */}
          {statusHistory.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                Histórico de status ({statusHistory.length})
              </summary>
              <div className="mt-2 space-y-1 pl-2 border-l-2 border-muted">
                {statusHistory.map((h: any) => (
                  <div key={h.id} className="text-muted-foreground">
                    <span>{statusLabels[h.old_status] || h.old_status || "—"}</span>
                    <span className="mx-1">→</span>
                    <span className="text-foreground">{statusLabels[h.new_status] || h.new_status}</span>
                    <span className="ml-2">{format(new Date(h.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                    {h.reason && <span className="ml-1 italic">({h.reason})</span>}
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Messages */}
          <ScrollArea className="h-64 pr-4">
            <div className="space-y-3">
              {messages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={cn(
                    "rounded-lg p-3 text-sm",
                    msg.source === "whatsapp" ? "bg-emerald-500/10 mr-8 border border-emerald-500/20" :
                    msg.user_id === user?.id ? "bg-primary/10 ml-8" : "bg-muted/50 mr-8"
                  )}
                >
                  <p>{msg.message}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    {msg.source === "whatsapp" && (
                      <MessageCircle className="h-3 w-3 text-emerald-400" />
                    )}
                    {msg.source === "whatsapp" && (
                      <span className="text-emerald-400 font-medium">WhatsApp • </span>
                    )}
                    {format(new Date(msg.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Reopen button for resolved/closed tickets */}
          {isResolved && (isAdmin || ticket.user_id === user?.id) && (
            <Button
              variant="outline"
              onClick={handleReopen}
              className="w-full gap-2 text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
            >
              <RotateCcw className="h-4 w-4" /> Reabrir Chamado
            </Button>
          )}

          {/* Input area */}
          {!isResolved && (
            <div className="space-y-2">
              {ticket.status === "aguardando_usuario" && ticket.user_id === user?.id && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2 text-xs text-purple-300">
                  ⚠️ A central solicitou mais informações. Responda abaixo para continuar o atendimento.
                </div>
              )}
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Adicionar mensagem..."
                  rows={2}
                  className="flex-1"
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                />
                <div className="flex flex-col gap-2">
                  <Button size="icon" onClick={handleSendMessage} disabled={sending}>
                    <Send className="h-4 w-4" />
                  </Button>
                  {isAdmin && ticket.status !== "aguardando_usuario" && (
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setReturnOpen(true)}
                      className="text-purple-400 hover:bg-purple-500/10"
                      title="Devolver ao usuário"
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  )}
                  {(isAdmin || ticket.user_id === user?.id) && (
                    <Button size="icon" variant="outline" onClick={handleResolve} className="text-emerald-400 hover:bg-emerald-500/10" title="Resolver">
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  {isAdmin && (
                    <Button size="icon" variant="outline" onClick={handleDelete} className="text-destructive hover:bg-destructive/10" title="Excluir chamado">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Return to user dialog */}
      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Devolver ao Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Informe o motivo da devolução. O usuário será notificado para complementar as informações.
            </p>
            <Textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Ex: Precisamos do número do pedido e print da tela do erro..."
              rows={3}
              required
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReturnOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleReturnToUser}
              disabled={returning || !returnReason.trim()}
              className="gap-2"
            >
              <Undo2 className="h-4 w-4" /> {returning ? "Enviando..." : "Devolver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
