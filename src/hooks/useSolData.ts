/**
 * SOL v2 — Unified data hooks.
 * Naming convention: Make DS name → Supabase table → Hook name
 * sol_leads → sol_leads_sync → useSolLeads()
 * sol_config → sol_config_sync → useSolConfig()
 * sol_equipe → sol_equipe_sync → useSolEquipe()
 * sol_funis → sol_funis_sync → useSolFunis()
 * sol_metricas → sol_metricas_sync → useSolMetricas()
 * sol_projetos → sol_projetos_sync → useSolProjetos()
 * sol_qualificacao → sol_qualificacao_sync → useSolQualificacao()
 * sol_conversions → sol_conversions_sync → useSolConversions()
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFranquiaId } from "@/hooks/useFranquiaId";
import { toast } from "sonner";
import { useCallback, useState } from "react";

// ── Types (from Supabase schema) ──

export type SolLead = {
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
};

export type SolMetrica = {
  key: string;
  data: string | null;
  robo: string | null;
  franquia_id: string | null;
  leads_novos: number | null;
  leads_qualificados: number | null;
  leads_transferidos: number | null;
  custo_total: number | null;
  synced_at: string | null;
};

export type SolEquipeMembro = {
  key: string;
  franquia_id: string | null;
  nome: string | null;
  cargo: string | null;
  sm_id: number | null;
  krolik_id: string | null;
  krolik_setor_id: string | null;
  krolik_ativo: boolean | null;
  ativo: boolean | null;
  leads_hoje: number | null;
  leads_mes: number | null;
  taxa_conversao: number | null;
  horario_pico_inicio: string | null;
  horario_pico_fim: string | null;
  updated_by: string | null;
  updated_at: string | null;
  synced_at: string | null;
};

export type SolProjeto = {
  key: string;
  project_id: string | null;
  identificador: string | null;
  etapa: string | null;
  evento: string | null;
  franquia_id: string | null;
  ts_evento: string | null;
  synced_at: string | null;
};

export type SolQualificacao = {
  telefone: string;
  franquia_id: string | null;
  modelo_negocio: string | null;
  resumo_qualificacao: string | null;
  temperatura: string | null;
  acao: string | null;
  score: number | null;
  dados_qualificacao: any;
  ts_primeira_qualificacao: string | null;
  ts_ultima_atualizacao: string | null;
  synced_at: string | null;
};

export type SolConversion = {
  key: string;
  telefone: string | null;
  project_id: string | null;
  event_name: string | null;
  canal: string | null;
  capi_sent: boolean | null;
  google_sent: boolean | null;
  capi_response: string | null;
  google_response: string | null;
  value: number | null;
  gclid: string | null;
  fbclid: string | null;
  ts_evento: string | null;
  ts_enviado: string | null;
  synced_at: string | null;
};

export type SolConfig = {
  key: string;
  valor_text: string | null;
  counter: number | null;
  updated_by: string | null;
  updated_at: string | null;
  synced_at: string | null;
};

export type SolFunil = {
  franquia_id: string;
  funil_id: number | null;
  funil_nome: string | null;
  sm_robo_id: number | null;
  sm_etiqueta_robo: string | null;
  etapas: any;
  updated_by: string | null;
  updated_at: string | null;
  synced_at: string | null;
};

// ── Utility ──

/** Normalize phone: keep only digits, strip leading country code 55 if 12+ digits */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 12 && digits.startsWith('55')) {
    return digits.slice(2);
  }
  return digits;
}

// ── sol_leads ──

export function useSolLeads(statusFilter?: string[]) {
  const { user } = useAuth();
  const franquiaId = useFranquiaId();

  return useQuery({
    queryKey: ["sol-leads", franquiaId, statusFilter],
    queryFn: async (): Promise<SolLead[]> => {
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

      return allRows as SolLead[];
    },
    enabled: !!user,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

// ── sol_metricas ──

export function useSolMetricas(limit = 30) {
  const { user } = useAuth();
  const franquiaId = useFranquiaId();

  return useQuery({
    queryKey: ["sol-metricas", franquiaId, limit],
    queryFn: async (): Promise<SolMetrica[]> => {
      const { data, error } = await supabase
        .from("sol_metricas_sync")
        .select("*")
        .eq("franquia_id", franquiaId)
        .order("data", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as SolMetrica[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

// ── sol_equipe ──

export function useSolEquipe() {
  const { user } = useAuth();
  const franquiaId = useFranquiaId();

  return useQuery({
    queryKey: ["sol-equipe", franquiaId],
    queryFn: async (): Promise<SolEquipeMembro[]> => {
      const { data, error } = await supabase
        .from("sol_equipe_sync")
        .select("*")
        .eq("franquia_id", franquiaId)
        .order("cargo")
        .order("nome");
      if (error) throw error;
      return (data || []) as SolEquipeMembro[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSolEquipeUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, updates }: { key: string; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from("sol_equipe_sync")
        .update({ ...updates, updated_by: "lovable", updated_at: new Date().toISOString() })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sol-equipe"] });
      toast.success("Equipe atualizada.");
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });
}

export function useSolEquipeInsert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: Record<string, any>) => {
      const payload = { ...record, updated_by: "lovable", updated_at: new Date().toISOString() };
      const { error } = await supabase
        .from("sol_equipe_sync")
        .insert(payload as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sol-equipe"] });
      toast.success("Membro adicionado.");
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });
}

// ── sol_projetos ──

export function useSolProjetos(limit = 100) {
  const { user } = useAuth();
  const franquiaId = useFranquiaId();

  return useQuery({
    queryKey: ["sol-projetos", franquiaId, limit],
    queryFn: async (): Promise<SolProjeto[]> => {
      const { data, error } = await supabase
        .from("sol_projetos_sync")
        .select("*")
        .eq("franquia_id", franquiaId)
        .not("project_id", "is", null)
        .order("ts_evento", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as SolProjeto[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

// ── sol_qualificacao ──

export function useSolQualificacao() {
  const { user } = useAuth();
  const franquiaId = useFranquiaId();

  return useQuery({
    queryKey: ["sol-qualificacao", franquiaId],
    queryFn: async (): Promise<SolQualificacao[]> => {
      const { data, error } = await supabase
        .from("sol_qualificacao_sync")
        .select("*")
        .eq("franquia_id", franquiaId);
      if (error) throw error;
      return (data || []) as SolQualificacao[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

// ── sol_conversions ──

export function useSolConversions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["sol-conversions"],
    queryFn: async (): Promise<SolConversion[]> => {
      const { data, error } = await supabase
        .from("sol_conversions_sync")
        .select("*")
        .order("ts_evento", { ascending: false });
      if (error) throw error;
      return (data || []) as SolConversion[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

// ── sol_config ──

export function useSolConfig() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["sol-config"],
    queryFn: async (): Promise<SolConfig[]> => {
      const { data, error } = await supabase
        .from("sol_config_sync")
        .select("*")
        .order("key");
      if (error) throw error;
      return (data || []) as SolConfig[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSolConfigUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, valor_text }: { key: string; valor_text: string }) => {
      const { error } = await supabase
        .from("sol_config_sync")
        .update({ valor_text, updated_by: "lovable", updated_at: new Date().toISOString() })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sol-config"] });
      toast.success("Configuração salva. O Agent usará na próxima mensagem.");
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });
}

// ── sol_funis ──

export function useSolFunis() {
  const { user } = useAuth();
  const franquiaId = useFranquiaId();

  return useQuery({
    queryKey: ["sol-funis", franquiaId],
    queryFn: async (): Promise<SolFunil[]> => {
      const { data, error } = await supabase
        .from("sol_funis_sync")
        .select("*")
        .eq("franquia_id", franquiaId);
      if (error) throw error;
      return (data || []) as SolFunil[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Funnel stats (convenience) ──

export function useFunnelStats() {
  const { data: leads, isLoading, error } = useSolLeads();

  const stats = {
    total: 0,
    trafego_pago: 0,
    em_qualificacao: 0,
    qualificados: 0,
    desqualificados: 0,
    follow_up: 0,
    ganhos: 0,
    perdidos: 0,
    contrato: 0,
  };

  if (leads) {
    stats.total = leads.length;
    for (const l of leads) {
      const s = l.status;
      if (s === 'TRAFEGO_PAGO') stats.trafego_pago++;
      else if (s === 'EM_QUALIFICACAO') stats.em_qualificacao++;
      else if (s === 'QUALIFICADO') stats.qualificados++;
      else if (s === 'DESQUALIFICADO') stats.desqualificados++;
      else if (s === 'FOLLOW_UP') stats.follow_up++;
      else if (s === 'GANHO') stats.ganhos++;
      else if (s === 'PERDIDO') stats.perdidos++;
      else if (s === 'CONTRATO') stats.contrato++;
    }
  }

  return { stats, isLoading, error, leads };
}

// ── Force sync ──

export function useForceSync() {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  const forceSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const { error } = await supabase.functions.invoke('sync-make-datastores', {
        body: { time: new Date().toISOString() },
      });
      if (error) {
        console.error('Error triggering sync:', error);
        toast.error('Erro ao sincronizar dados');
        return;
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sol-leads'] }),
        queryClient.invalidateQueries({ queryKey: ['sol-metricas'] }),
        queryClient.invalidateQueries({ queryKey: ['sol-equipe'] }),
        queryClient.invalidateQueries({ queryKey: ['sol-projetos'] }),
        queryClient.invalidateQueries({ queryKey: ['sol-qualificacao'] }),
        queryClient.invalidateQueries({ queryKey: ['sol-conversions'] }),
        queryClient.invalidateQueries({ queryKey: ['sol-config'] }),
        queryClient.invalidateQueries({ queryKey: ['sol-funis'] }),
      ]);
      toast.success('Dados sincronizados com sucesso');
    } catch (err) {
      console.error('Force sync failed:', err);
      toast.error('Erro ao sincronizar');
    } finally {
      setIsSyncing(false);
    }
  }, [queryClient]);

  return { forceSync, isSyncing };
}
