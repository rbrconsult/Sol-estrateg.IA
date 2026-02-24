import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Send, Paperclip, X } from "lucide-react";
import { SuccessDialog } from "./SuccessDialog";

interface TicketFormProps {
  onTicketCreated: () => void;
  onSelectTicket?: (ticketId: string) => void;
}

const SLA_HOURS: Record<string, number> = {
  critica: 4,
  alta: 24,
  media: 48,
  baixa: 72,
};

const CATEGORY_PRIORITY: Record<string, string> = {
  urgencia: "critica",
  bug: "alta",
  melhoria: "media",
  duvida: "baixa",
};

const FLUXOS = [
  "Fluxo 1 - Captura de Leads Meta Ads e Disparo inicial whatsapp + IA",
  "Fluxo 2 - Captura de Leads Site GERAL e Disparo inicial whatsapp + IA",
  "Robo FUP FRIO",
  "Robo SDR / Sol",
  "Fluxo Remarketing",
];

const PLATAFORMAS = [
  "Krolic",
  "Solar Market",
  "Drive | Planilhas",
  "Make",
  "ChatGPT",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function TicketForm({ onTicketCreated, onSelectTicket }: TicketFormProps) {
  const { user, userRole, organizationId } = useAuth();
  const isSuperAdmin = userRole === "super_admin";
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [fluxo, setFluxo] = useState("");
  const [plataforma, setPlataforma] = useState("");
  const [descricao, setDescricao] = useState("");
  const [clienteNome, setClienteNome] = useState("Gabriel");
  const [clienteTelefone, setClienteTelefone] = useState("(17) 99124-4540");
  const [detalhes, setDetalhes] = useState("");
  const [categoria, setCategoria] = useState("duvida");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedOrgId, setSelectedOrgId] = useState("");

  // Fetch organizations for super_admin
  const { data: organizations } = useQuery({
    queryKey: ["organizations-list"],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("id, name").neq("id", "00000000-0000-0000-0000-000000000001").order("name");
      return (data as any[]) || [];
    },
    enabled: isSuperAdmin,
  });

  // Phone from profile
  const [userPhone, setUserPhone] = useState("");
  const [phoneLoaded, setPhoneLoaded] = useState(false);

  // Success dialog
  const [successOpen, setSuccessOpen] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState("");
  const [createdTicketNumber, setCreatedTicketNumber] = useState<number>(0);

  const prioridade = CATEGORY_PRIORITY[categoria] || "media";

  const priorityLabel: Record<string, string> = {
    critica: "🔴 Crítica (4h)",
    alta: "🟠 Alta (24h)",
    media: "🟡 Média (48h)",
    baixa: "🟢 Baixa (72h)",
  };

  // Load user phone from profile
  useEffect(() => {
    if (!user) return;
    const loadPhone = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", user.id)
        .single();
      if (data?.phone) setUserPhone(data.phone);
      setPhoneLoaded(true);
    };
    loadPhone();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!ALLOWED_TYPES.includes(selected.type)) {
      toast.error("Tipo de arquivo não suportado. Use JPG, PNG, WEBP ou PDF.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande. Limite de 10MB.");
      return;
    }
    setFile(selected);
  };

  const resetForm = () => {
    setTitulo("");
    setFluxo("");
    setPlataforma("");
    setDescricao("");
    setClienteNome("Gabriel");
    setClienteTelefone("(17) 99124-4540");
    setDetalhes("");
    setCategoria("duvida");
    setFile(null);
    setSelectedOrgId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate phone
    if (!userPhone) {
      toast.error("Informe seu número de WhatsApp para receber notificações.");
      return;
    }

    setLoading(true);

    let attachmentUrl: string | null = null;

    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("ticket-attachments")
        .upload(path, file);

      if (uploadError) {
        toast.error("Erro ao enviar anexo: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("ticket-attachments")
        .getPublicUrl(path);

      attachmentUrl = urlData.publicUrl;
    }

    const slaHours = SLA_HOURS[prioridade];
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();

    // Determine organization_id
    const ticketOrgId = isSuperAdmin
      ? (selectedOrgId || organizationId)
      : organizationId;

    const { data: ticketData, error } = await supabase
      .from("support_tickets" as any)
      .insert({
        user_id: user.id,
        titulo,
        fluxo,
        plataforma: plataforma || null,
        descricao,
        cliente_nome: clienteNome,
        cliente_telefone: clienteTelefone,
        detalhes: detalhes || null,
        categoria,
        prioridade,
        sla_deadline: slaDeadline,
        attachment_url: attachmentUrl,
        notification_phone: userPhone.replace(/\D/g, ""),
        organization_id: ticketOrgId,
      })
      .select("id, ticket_number")
      .single();

    setLoading(false);

    if (error) {
      toast.error("Erro ao criar chamado: " + error.message);
      return;
    }

    const ticketId = (ticketData as any)?.id || "";
    const ticketNumber = (ticketData as any)?.ticket_number || 0;

    // Save phone to profile if not saved yet
    if (userPhone) {
      await supabase
        .from("profiles")
        .update({ phone: userPhone })
        .eq("id", user.id);
    }

    // Get user name for notification
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    // Send WhatsApp notification (non-blocking)
    supabase.functions.invoke("notify-ticket-whatsapp", {
      body: {
        ticketId,
        ticketNumero: String(ticketNumber).padStart(4, "0"),
        titulo,
        fluxo,
        plataforma,
        clienteNome,
        clienteTelefone,
        categoria,
        prioridade,
        slaHoras: slaHours,
        descricao,
        userPhone: userPhone.replace(/\D/g, ""),
        userName: profileData?.full_name || user.email,
      },
    }).catch((err) => console.error("WhatsApp notification error:", err));

    // Show success dialog
    setCreatedTicketId(ticketId);
    setCreatedTicketNumber(ticketNumber);
    resetForm();
    setOpen(false);
    setSuccessOpen(true);
    onTicketCreated();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Abrir Chamado
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Chamado</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Seleção de Empresa (apenas super_admin) */}
            {isSuperAdmin && organizations && (
              <div className="space-y-2">
                <Label>Empresa *</Label>
                <Select value={selectedOrgId} onValueChange={setSelectedOrgId} required>
                  <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                  <SelectContent>
                    {organizations.map((org: any) => (
                      <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* WhatsApp do Usuário */}
            <div className="space-y-2">
              <Label htmlFor="userPhone">WhatsApp para notificação *</Label>
              <Input
                id="userPhone"
                value={userPhone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                  let formatted = digits;
                  if (digits.length > 2) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                  if (digits.length > 7) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
                  setUserPhone(formatted);
                }}
                placeholder="(00) 00000-0000"
                inputMode="numeric"
                maxLength={15}
                required
              />
              <p className="text-xs text-muted-foreground">Quem deve ser notificado sobre este chamado?</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Descreva o problema brevemente" required />
            </div>

            <div className="space-y-2">
              <Label>Fluxo *</Label>
              <Select value={fluxo} onValueChange={setFluxo} required>
                <SelectTrigger><SelectValue placeholder="Selecione o fluxo" /></SelectTrigger>
                <SelectContent>
                  {FLUXOS.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Plataforma</Label>
              <Select value={plataforma} onValueChange={setPlataforma}>
                <SelectTrigger><SelectValue placeholder="Selecione a plataforma" /></SelectTrigger>
                <SelectContent>
                  {PLATAFORMAS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição do Problema *</Label>
              <Textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva o problema em detalhes" rows={3} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clienteNome">Nome do Cliente *</Label>
                <Input id="clienteNome" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} placeholder="Nome do cliente" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clienteTelefone">Telefone do Cliente *</Label>
                <Input
                  id="clienteTelefone"
                  value={clienteTelefone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                    let formatted = digits;
                    if (digits.length > 2) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                    if (digits.length > 7) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
                    setClienteTelefone(formatted);
                  }}
                  placeholder="(00) 00000-0000"
                  inputMode="numeric"
                  maxLength={15}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="detalhes">Detalhes do Problema</Label>
              <Textarea id="detalhes" value={detalhes} onChange={(e) => setDetalhes(e.target.value)} placeholder="Informações adicionais (opcional)" rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">🐛 Bug</SelectItem>
                  <SelectItem value="duvida">❓ Dúvida</SelectItem>
                  <SelectItem value="melhoria">✨ Melhoria</SelectItem>
                  <SelectItem value="urgencia">🚨 Urgência</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Prioridade automática: {priorityLabel[prioridade]}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Anexo (imagem ou PDF)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center gap-2 text-sm bg-muted/30 rounded-lg p-2">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate flex-1">{file.name}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFile(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" className="w-full gap-2" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-4 w-4" /> Adicionar Anexo
                </Button>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="ghost" onClick={() => { resetForm(); setOpen(false); }}>Cancelar</Button>
              <Button type="submit" disabled={loading || !fluxo || (isSuperAdmin && !selectedOrgId)} className="gap-2">
                <Send className="h-4 w-4" /> {loading ? "Enviando..." : "Enviar Chamado"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <SuccessDialog
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        onViewTicket={() => {
          setSuccessOpen(false);
          onSelectTicket?.(createdTicketId);
        }}
        ticketId={createdTicketId}
        ticketNumber={createdTicketNumber}
      />
    </>
  );
}
