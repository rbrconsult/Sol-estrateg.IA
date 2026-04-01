import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Send, Users, MessageSquare, Hash, Loader2, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  channel: string;
  content: string;
  is_broadcast: boolean;
  created_at: string;
  sender_name?: string;
}

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
}

export default function Mensagens() {
  const { user, userRole } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeChannel, setActiveChannel] = useState('geral');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [dmTarget, setDmTarget] = useState<string>('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isDiretor = userRole === 'super_admin' || userRole === 'diretor';
  const channels = isDiretor
    ? [
        { key: 'geral', label: 'Geral', icon: Hash },
        { key: 'diretoria', label: 'Diretoria', icon: Users },
      ]
    : [{ key: 'geral', label: 'Geral', icon: Hash }];

  useEffect(() => {
    fetchMessages();
    fetchTeam();

    const channel = supabase
      .channel('internal-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'internal_messages' }, (payload) => {
        const msg = payload.new as any;
        setMessages(prev => [...prev, {
          id: msg.id,
          sender_id: msg.sender_id,
          recipient_id: msg.recipient_id,
          channel: msg.channel,
          content: msg.content,
          is_broadcast: msg.is_broadcast,
          created_at: msg.created_at,
        }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, activeChannel]);

  async function fetchMessages() {
    setLoading(true);
    const { data } = await supabase
      .from('internal_messages' as any)
      .select('*')
      .order('created_at', { ascending: true })
      .limit(200);
    if (data) setMessages(data as any[]);
    setLoading(false);
  }

  async function fetchTeam() {
    const { data } = await supabase.from('profiles').select('id, email, full_name');
    if (data) setTeamMembers(data.filter(m => m.id !== user?.id));
  }

  async function sendMessage() {
    if (!newMessage.trim() || !user) return;
    setSending(true);
    const payload: any = {
      sender_id: user.id,
      channel: activeChannel,
      content: newMessage.trim(),
      is_broadcast: activeChannel !== 'dm',
    };
    if (activeChannel === 'dm' && dmTarget) {
      payload.recipient_id = dmTarget;
      payload.is_broadcast = false;
      payload.channel = 'direto';
    }
    const { error } = await supabase.from('internal_messages' as any).insert(payload);
    if (error) toast.error('Erro ao enviar mensagem');
    else setNewMessage('');
    setSending(false);
  }

  async function sendWhatsApp() {
    if (!whatsappNumber.trim() || !whatsappMessage.trim()) return;
    setSendingWhatsapp(true);
    try {
      const { data: settings } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['krolic_api_token', 'krolic_api_url', 'krolic_instance_name']);
      const cfg: Record<string, string> = {};
      (settings || []).forEach((s: any) => { cfg[s.key] = s.value; });

      if (!cfg.krolic_api_token) {
        toast.error('Token Krolic não configurado');
        return;
      }

      const url = cfg.krolic_api_url || 'https://api.camkrolik.com.br/core/v2/api/chats/send-text';
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'access-token': cfg.krolic_api_token },
        body: JSON.stringify({ number: whatsappNumber, message: whatsappMessage, forceSend: true }),
      });
      if (resp.ok) {
        toast.success('Mensagem WhatsApp enviada!');
        setWhatsappMessage('');
      } else {
        toast.error('Erro ao enviar WhatsApp');
      }
    } catch {
      toast.error('Erro de conexão com Krolic');
    } finally {
      setSendingWhatsapp(false);
    }
  }

  const filteredMessages = messages.filter(m => {
    if (activeChannel === 'dm') {
      return (m.sender_id === user?.id && m.recipient_id === dmTarget) ||
             (m.sender_id === dmTarget && m.recipient_id === user?.id);
    }
    return m.channel === activeChannel;
  });

  const getSenderName = (senderId: string) => {
    if (senderId === user?.id) return 'Você';
    const member = teamMembers.find(m => m.id === senderId);
    return member?.full_name || member?.email || senderId.slice(0, 8);
  };

  return (
    <div className="space-y-4 p-1">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Central de Mensagens</h1>
        <p className="text-muted-foreground">Comunicação interna e envio via WhatsApp</p>
      </div>

      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chat" className="gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Chat Interno</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5"><Phone className="h-3.5 w-3.5" /> WhatsApp</TabsTrigger>
        </TabsList>

        {/* ── Chat Interno ── */}
        <TabsContent value="chat" className="space-y-0">
          <div className="grid lg:grid-cols-[220px_1fr] gap-4 h-[calc(100vh-260px)]">
            {/* Channels sidebar */}
            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Canais</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-2 space-y-1">
                {channels.map(ch => (
                  <button
                    key={ch.key}
                    onClick={() => { setActiveChannel(ch.key); setDmTarget(''); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeChannel === ch.key ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <ch.icon className="h-4 w-4" />
                    {ch.label}
                  </button>
                ))}

                <div className="border-t border-border/50 mt-3 pt-3">
                  <p className="text-xs text-muted-foreground px-3 mb-2">Mensagem Direta</p>
                  {teamMembers.slice(0, 10).map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setActiveChannel('dm'); setDmTarget(m.id); }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        activeChannel === 'dm' && dmTarget === m.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                        {(m.full_name || m.email || '?')[0].toUpperCase()}
                      </div>
                      <span className="truncate">{m.full_name || m.email}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat area */}
            <Card className="flex flex-col">
              <CardHeader className="pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">
                    {activeChannel === 'dm' ? getSenderName(dmTarget) : channels.find(c => c.key === activeChannel)?.label || activeChannel}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">{filteredMessages.length} msgs</Badge>
                </div>
              </CardHeader>
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
                ) : filteredMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm">Nenhuma mensagem ainda</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredMessages.map(msg => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                            isMe ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'
                          }`}>
                            {!isMe && (
                              <p className="text-xs font-semibold mb-0.5 opacity-70">{getSenderName(msg.sender_id)}</p>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                              {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
              <div className="p-3 border-t border-border/50 flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  disabled={sending}
                />
                <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} size="icon">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ── WhatsApp ── */}
        <TabsContent value="whatsapp">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="h-4 w-4 text-green-500" />
                Enviar via WhatsApp (Krolic)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Número (com DDI)</label>
                <Input placeholder="5511999999999" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mensagem</label>
                <textarea
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[100px] resize-none focus:ring-1 focus:ring-primary"
                  placeholder="Escreva a mensagem..."
                  value={whatsappMessage}
                  onChange={e => setWhatsappMessage(e.target.value)}
                />
              </div>
              <Button onClick={sendWhatsApp} disabled={sendingWhatsapp || !whatsappNumber || !whatsappMessage} className="w-full gap-2">
                {sendingWhatsapp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar WhatsApp
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
