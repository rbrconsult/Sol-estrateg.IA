import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface SuccessDialogProps {
  open: boolean;
  onClose: () => void;
  onViewTicket: () => void;
  ticketId: string;
}

export function SuccessDialog({ open, onClose, onViewTicket, ticketId }: SuccessDialogProps) {
  const shortId = ticketId.substring(0, 8).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md text-center">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="rounded-full bg-green-500/10 p-4 animate-in zoom-in-50 duration-300">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Chamado Aberto com Sucesso!</h2>
            <p className="text-sm text-muted-foreground">
              Protocolo: <span className="font-mono font-bold text-foreground">#{shortId}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Você receberá uma confirmação no seu WhatsApp com os detalhes do chamado.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Fechar</Button>
            <Button onClick={onViewTicket}>Acompanhar Chamado</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
