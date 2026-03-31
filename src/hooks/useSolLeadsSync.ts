import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFranquiaId } from "@/hooks/useFranquiaId";

export interface SolLeadSync {
  telefone: string;
  nome: string | null;
  email: string | null;
  cidade: string | null;
  status: string | null;
  score: string | null;
  temperatura: string | null;
  canal_origem: string | null;
  franquia_id: string | null;
  project_id: string | null;
  identificador: string | null;
  chat_id: string | null;
  contact_id: string | null;
  resumo_conversa: string | null;
  resumo_qualificacao: string | null;
  valor_conta: string | null;
  tipo_imovel: string | null;
  tipo_telhado: string | null;
  acrescimo_carga: string | null;
  prazo_decisao: string | null;
  forma_pagamento: string | null;
  preferencia_contato: string | null;
  closer_nome: string | null;
  closer_sm_id: string | null;
  etapa_funil: string | null;
  qualificado_por: string | null;
  valor_conta_confirmado_ocr: string | null;
  ts_cadastro: string | null;
  ts_ultima_interacao: string | null;
  ts_qualificado: string | null;
  ts_desqualificado: string | null;
  ts_transferido: string | null;
  ts_pedido_conta_luz: string | null;
  ts_ultimo_fup: string | null;
  total_mensagens_ia: number | null;
  aguardando_conta_luz: boolean | null;
  custo_openai: number | null;
  custo_elevenlabs: number | null;
  custo_total_usd: number | null;
  total_audios_enviados: number | null;
  fup_followup_count: number | null;
  transferido_comercial: boolean | null;
  synced_at: string | null;
}

export function useSolLeadsSync(statusFilter?: string[]) {
  const { user } = useAuth();
  const franquiaId = useFranquiaId();

  return useQuery({
    queryKey: ["sol-leads-sync", franquiaId, statusFilter],
    queryFn: async (): Promise<SolLeadSync[]> => {
      let query = supabase
        .from("sol_leads_sync")
        .select("*")
        .eq("franquia_id", franquiaId)
        .order("ts_cadastro", { ascending: false });

      if (statusFilter?.length) {
        query = query.in("status", statusFilter);
      }

      const allRows: any[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await query.range(offset, offset + pageSize - 1);
        if (error) throw error;
        if (data && data.length > 0) {
          allRows.push(...data);
          hasMore = data.length === pageSize;
          offset += pageSize;
        } else {
          hasMore = false;
        }
      }

      return allRows as SolLeadSync[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}
