import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgFilter } from "@/contexts/OrgFilterContext";

export interface SolLead {
  id: string;
  telefone: string;
  nome: string | null;
  email: string | null;
  cidade: string | null;
  canal_origem: string | null;
  campanha: string | null;
  status: string | null;
  codigo_status: string | null;
  etapa: string | null;
  temperatura: string | null;
  score: number | null;
  valor_conta: string | null;
  imovel: string | null;
  acrescimo_carga: string | null;
  prazo_decisao: string | null;
  forma_pagamento: string | null;
  preferencia_contato: string | null;
  chat_id: string | null;
  contact_id: string | null;
  resumo_conversa: string | null;
  total_mensagens_ia: number | null;
  total_audios_enviados: number | null;
  custo_openai: number | null;
  custo_elevenlabs: number | null;
  custo_total_usd: number | null;
  qualificado_por: string | null;
  aguardando_conta_luz: boolean | null;
  transferido_comercial: boolean | null;
  ds_source: string | null;
  project_id: string | null;
  closer_atribuido: string | null;
  responsavel: string | null;
  robo: string | null;
  data_entrada: string | null;
  data_qualificacao: string | null;
  data_fechamento: string | null;
  organization_id: string | null;
  followup_count: number | null;
  respondeu: boolean | null;
  valor_proposta: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useSolLeads() {
  const { selectedOrgId } = useOrgFilter();

  return useQuery({
    queryKey: ["sol-leads", selectedOrgId],
    queryFn: async (): Promise<SolLead[]> => {
      let query = supabase
        .from("leads_consolidados")
        .select("*")
        .eq("ds_source", "sol_leads")
        .order("created_at", { ascending: false });

      if (selectedOrgId) {
        query = query.eq("organization_id", selectedOrgId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as SolLead[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
