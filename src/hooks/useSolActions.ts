import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QualificarData {
  telefone: string;
  project_id?: string;
  chatId?: string;
  contactId?: string;
  nome?: string;
  score?: number;
  valor_conta?: string;
  mensagem?: boolean;
  closer_sm_id?: number | null;
  closer_krolik_id?: string | null;
}

interface DesqualificarData {
  telefone: string;
  project_id?: string;
  chatId?: string;
  nome?: string;
}

interface ReprocessarData {
  telefone: string;
}

async function callSolAction(action: string, data: Record<string, any>) {
  const { data: result, error } = await supabase.functions.invoke("sol-actions", {
    body: { action, ...data },
  });
  if (error) throw error;
  return result;
}

export function useSolActions() {
  const qualificar = useMutation({
    mutationFn: (data: QualificarData) => callSolAction("qualificar", data),
    onSuccess: () => toast.success("Lead qualificado com sucesso"),
    onError: (err: any) => toast.error(`Erro ao qualificar: ${err.message}`),
  });

  const desqualificar = useMutation({
    mutationFn: (data: DesqualificarData) => callSolAction("desqualificar", data),
    onSuccess: () => toast.success("Lead desqualificado com sucesso"),
    onError: (err: any) => toast.error(`Erro ao desqualificar: ${err.message}`),
  });

  const reprocessar = useMutation({
    mutationFn: (data: ReprocessarData) => callSolAction("reprocessar", data),
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
