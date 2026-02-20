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
import { Send, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TicketDetailProps {
  ticketId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export function TicketDetail({ ticketId, onClose, onUpdated }: TicketDetailProps) {
  const { user, userRole } = useAuth();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [ticketRes, messagesRes] = await Promise.all([
      supabase.from("support_tickets" as any).select("*").eq("id", ticketId).single(),
      supabase.from("ticket_messages" as any).select("*").eq("ticket_id", ticketId).order("created_at", { ascending: true }),
    ]);

    if (ticketRes.data) setTicket(ticketRes.data);
    if (messagesRes.data) setMessages(messagesRes.data as any[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_messages", filter: `ticket_id=eq.${ticketId}` }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ticketId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    setSending(true);

    const { error } = await supabase.from("ticket_messages" as any).insert({
      ticket_id: ticketId,
      user_id: user.id,
      message: newMessage.trim(),
    });

    setSending(false);
    if (error) {
      toast.error("Erro ao enviar mensagem");
      return;
    }
    setNewMessage("");
    fetchData();
  };

  const handleResolve = async () => {
    const { error } = await supabase
      .from("support_tickets" as any)
      .update({ status: "resolvido", resolved_at: new Date().toISOString() })
      .eq("id", ticketId);

    if (error) {
      toast.error("Erro ao resolver chamado");
      return;
    }
    toast.success("Chamado marcado como resolvido!");
    onUpdated();
    fetchData();
  };

  if (loading || !ticket) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">Carregando...</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3 flex flex-row items-start justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg">{ticket.titulo}</CardTitle>
          <div className="flex gap-2 items-center">
            <Badge variant="outline" className="text-xs">#{ticket.id.slice(0, 6)}</Badge>
            {ticket.status !== "fechado" && ticket.status !== "resolvido" && (
              <SLATimer deadline={ticket.sla_deadline} createdAt={ticket.created_at} />
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/30 rounded-lg p-4 text-sm space-y-2">
          <p>{ticket.descricao}</p>
          {ticket.fluxo && (
            <p className="text-xs"><span className="font-medium">Fluxo:</span> {ticket.fluxo}</p>
          )}
          {ticket.cliente_nome && (
            <p className="text-xs"><span className="font-medium">Cliente:</span> {ticket.cliente_nome} {ticket.cliente_telefone && `• ${ticket.cliente_telefone}`}</p>
          )}
          {ticket.detalhes && (
            <p className="text-xs"><span className="font-medium">Detalhes:</span> {ticket.detalhes}</p>
          )}
          {ticket.attachment_url && (
            <a href={ticket.attachment_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline inline-flex items-center gap-1">
              📎 Ver Anexo
            </a>
          )}
        </div>

        <ScrollArea className="h-64 pr-4">
          <div className="space-y-3">
            {messages.map((msg: any) => (
              <div
                key={msg.id}
                className={cn(
                  "rounded-lg p-3 text-sm",
                  msg.user_id === user?.id ? "bg-primary/10 ml-8" : "bg-muted/50 mr-8"
                )}
              >
                <p>{msg.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(msg.created_at), "dd/MM HH:mm", { locale: ptBR })}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>

        {ticket.status !== "fechado" && ticket.status !== "resolvido" && (
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
              {(userRole === "super_admin" || ticket.user_id === user?.id) && (
                <Button size="icon" variant="outline" onClick={handleResolve} className="text-emerald-400 hover:bg-emerald-500/10">
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
