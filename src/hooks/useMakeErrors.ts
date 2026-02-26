import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MakeError {
  id: string;
  execution_id: string;
  scenario_id: number | null;
  scenario_name: string | null;
  module_name: string | null;
  module_app: string | null;
  failed_module_index: number | null;
  total_modules: number | null;
  error_type: string | null;
  error_code: string | null;
  error_message: string | null;
  attempts: number | null;
  execution_status: string;
  flow_category: string | null;
  execution_duration_seconds: number | null;
  status: string;
  resolution_notes: string | null;
  occurred_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

export function useMakeErrors() {
  const queryClient = useQueryClient();

  const errorsQuery = useQuery({
    queryKey: ["make-errors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("make_errors")
        .select("*")
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data as MakeError[];
    },
    refetchInterval: 5 * 60 * 1000, // 5 min
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-make-errors");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["make-errors"] });
      toast.success(
        `Sincronização concluída: ${data.stopped} parados, ${data.errorContinued} com erro, ${data.total} total`
      );
    },
    onError: (err: Error) => {
      toast.error(`Erro na sincronização: ${err.message}`);
    },
  });

  const actionMutation = useMutation({
    mutationFn: async (params: { action: "retry" | "discard"; executionId: string; recordId: string }) => {
      const { data, error } = await supabase.functions.invoke("make-action", { body: params });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["make-errors"] });
      toast.success(data.message);
    },
    onError: (err: Error) => {
      toast.error(`Erro na ação: ${err.message}`);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (params: { id: string; status: string; resolution_notes?: string }) => {
      const update: any = { status: params.status };
      if (params.resolution_notes !== undefined) update.resolution_notes = params.resolution_notes;
      if (params.status === "resolved") update.resolved_at = new Date().toISOString();
      const { error } = await supabase.from("make_errors").update(update).eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["make-errors"] });
      toast.success("Status atualizado");
    },
    onError: (err: Error) => {
      toast.error(`Erro ao atualizar: ${err.message}`);
    },
  });

  return { errorsQuery, syncMutation, actionMutation, updateStatusMutation };
}
