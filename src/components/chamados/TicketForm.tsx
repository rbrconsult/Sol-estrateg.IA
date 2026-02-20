import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Send } from "lucide-react";

interface TicketFormProps {
  onTicketCreated: () => void;
}

const SLA_HOURS: Record<string, number> = {
  critica: 4,
  alta: 24,
  media: 48,
  baixa: 72,
};

export function TicketForm({ onTicketCreated }: TicketFormProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("duvida");
  const [prioridade, setPrioridade] = useState("media");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const slaHours = SLA_HOURS[prioridade];
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from("support_tickets" as any).insert({
      user_id: user.id,
      titulo,
      descricao,
      categoria,
      prioridade,
      sla_deadline: slaDeadline,
    });

    setLoading(false);

    if (error) {
      toast.error("Erro ao criar chamado: " + error.message);
      return;
    }

    toast.success("Chamado aberto com sucesso!");
    setTitulo("");
    setDescricao("");
    setCategoria("duvida");
    setPrioridade("media");
    setOpen(false);
    onTicketCreated();
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" /> Abrir Chamado
      </Button>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Novo Chamado</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Descreva o problema brevemente" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhe o problema, passos para reproduzir, etc." rows={4} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">🐛 Bug</SelectItem>
                  <SelectItem value="duvida">❓ Dúvida</SelectItem>
                  <SelectItem value="melhoria">✨ Melhoria</SelectItem>
                  <SelectItem value="urgencia">🚨 Urgência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">🟢 Baixa (72h)</SelectItem>
                  <SelectItem value="media">🟡 Média (48h)</SelectItem>
                  <SelectItem value="alta">🟠 Alta (24h)</SelectItem>
                  <SelectItem value="critica">🔴 Crítica (4h)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="gap-2">
              <Send className="h-4 w-4" /> {loading ? "Enviando..." : "Enviar Chamado"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
