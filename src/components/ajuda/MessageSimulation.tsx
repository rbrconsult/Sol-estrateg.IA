import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
}

const quickReplies = [
  "Quero saber mais sobre energia solar",
  "Qual o valor de um sistema de 10kWp?",
  "Vocês fazem financiamento?",
  "Gostaria de agendar uma visita técnica",
  "Qual a economia na conta de luz?",
];

export function MessageSimulation() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content: "Olá! 👋 Sou a SOL, assistente virtual da RBR Energy. Como posso ajudar você hoje?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const simulateBotReply = (userMsg: string) => {
    setIsTyping(true);
    const delay = 800 + Math.random() * 1200;

    setTimeout(() => {
      const replies: Record<string, string> = {
        "Quero saber mais sobre energia solar":
          "Ótimo! A energia solar é a fonte que mais cresce no Brasil. 🌞 Com um sistema fotovoltaico, você pode reduzir até 95% da sua conta de luz. Posso te passar um orçamento personalizado?",
        "Qual o valor de um sistema de 10kWp?":
          "Um sistema de 10kWp gera em média 1.300 kWh/mês e custa a partir de R$ 35.000. O retorno do investimento é de 3 a 5 anos. Quer que eu faça uma simulação para o seu consumo?",
        "Vocês fazem financiamento?":
          "Sim! Trabalhamos com as melhores linhas de financiamento: BV, Santander, Sol Agora e consórcio. Parcelas a partir de R$ 250/mês. Posso simular para você? 💰",
        "Gostaria de agendar uma visita técnica":
          "Perfeito! Vou agendar uma visita técnica para avaliar o melhor local de instalação. Qual o melhor dia e horário para você? 📋",
        "Qual a economia na conta de luz?":
          "Com energia solar, a economia média é de 85% a 95% na conta de luz! Para calcular exatamente, preciso da sua conta atual. Pode me enviar uma foto? 📊",
      };

      const reply =
        replies[userMsg] ||
        "Entendi! Vou encaminhar sua solicitação para nosso time comercial. Em breve entraremos em contato. Obrigado! 😊";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "bot",
          content: reply,
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }, delay);
  };

  const sendMessage = (content: string) => {
    if (!content.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    simulateBotReply(content.trim());
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "bot",
        content: "Olá! 👋 Sou a SOL, assistente virtual da RBR Energy. Como posso ajudar você hoje?",
        timestamp: new Date(),
      },
    ]);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] max-h-[700px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">SOL Assistente</p>
            <p className="text-xs text-primary flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
              Online
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={clearChat} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
              msg.role === "user" ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-1",
                msg.role === "bot" ? "bg-primary/10" : "bg-secondary"
              )}
            >
              {msg.role === "bot" ? (
                <Bot className="h-3.5 w-3.5 text-primary" />
              ) : (
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
            <div
              className={cn(
                "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                msg.role === "bot"
                  ? "bg-card border border-border/50 text-foreground rounded-tl-sm"
                  : "bg-primary text-primary-foreground rounded-tr-sm"
              )}
            >
              <p>{msg.content}</p>
              <p
                className={cn(
                  "text-[10px] mt-1",
                  msg.role === "bot" ? "text-muted-foreground" : "text-primary-foreground/60"
                )}
              >
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2 max-w-[85%] animate-in fade-in">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
              <Bot className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick replies */}
      <div className="px-4 py-2 border-t border-border/30 bg-card/50 overflow-x-auto">
        <div className="flex gap-2">
          {quickReplies.map((text) => (
            <button
              key={text}
              onClick={() => sendMessage(text)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors whitespace-nowrap"
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-border/50 bg-card rounded-b-xl">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1"
          disabled={isTyping}
        />
        <Button type="submit" size="icon" disabled={!input.trim() || isTyping}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
