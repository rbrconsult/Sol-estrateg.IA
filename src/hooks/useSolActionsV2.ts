import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

const WEBHOOKS = {
  qualificar: "https://hook.us2.make.com/oxaip1d1e946l7hmtyhpr1aic626o92m",
  desqualificar: "https://hook.us2.make.com/joonk1hj7ubqeogtq1hxwymncruxslbl",
  reprocessar: "https://hook.us2.make.com/m6zaweontguh6vqsfvid3g73bxb1qg44",
};

async function callWebhook(url: string, data: Record<string, any>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Webhook error: ${res.status}`);
  return res.json().catch(() => ({}));
}

interface QualificarData {
  telefone: string;
  nome?: string | null;
  score?: string | null;
  temperatura?: string | null;
  valor_conta?: string | null;
  preferencia_contato?: string | null;
  email?: string | null;
  chatid?: string | null;
  contactid?: string | null;
  project_id?: string | null;
  canal_origem?: string | null;
}

interface DesqualificarData {
  telefone: string;
  chatid?: string | null;
  contactid?: string | null;
  motivo: string;
}

interface ReprocessarData {
  telefone: string;
}

export function useSolActionsV2() {
  const qualificar = useMutation({
    mutationFn: (data: QualificarData) =>
      callWebhook(WEBHOOKS.qualificar, {
        telefone: data.telefone,
        nome: data.nome,
        score: data.score,
        temperatura: data.temperatura,
        valor_conta: data.valor_conta,
        preferencia_contato: data.preferencia_contato,
        email: data.email,
        chatId: data.chatid,
        contactId: data.contactid,
        project_id: data.project_id,
        canal_origem: data.canal_origem,
      }),
    onSuccess: () => toast.success("Lead qualificado com sucesso"),
    onError: (err: any) => toast.error(`Erro ao qualificar: ${err.message}`),
  });

  const desqualificar = useMutation({
    mutationFn: (data: DesqualificarData) =>
      callWebhook(WEBHOOKS.desqualificar, {
        telefone: data.telefone,
        chatId: data.chatid,
        contactId: data.contactid,
        motivo: data.motivo,
      }),
    onSuccess: () => toast.success("Lead desqualificado com sucesso"),
    onError: (err: any) => toast.error(`Erro ao desqualificar: ${err.message}`),
  });

  const reprocessar = useMutation({
    mutationFn: (data: ReprocessarData) =>
      callWebhook(WEBHOOKS.reprocessar, { telefone: data.telefone }),
    onSuccess: () => toast.success("Lead reprocessado com sucesso"),
    onError: (err: any) => toast.error(`Erro ao reprocessar: ${err.message}`),
  });

  return {
    qualificar,
    desqualificar,
    reprocessar,
    isLoading: qualificar.isPending || desqualificar.isPending || reprocessar.isPending,
  };
}
