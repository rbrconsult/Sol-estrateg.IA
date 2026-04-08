/**
 * SOL v2 — Unified data hooks.
 * Naming convention: Make DS name → Supabase table → Hook name
 * sol_leads → sol_projetos → useSolLeads()
 * sol_config → sol_config_sync → useSolConfig()
 * sol_equipe → sol_equipe_sync → useSolEquipe()
 * sol_funis → sol_funis_sync → useSolFunis()
 * sol_metricas → sol_metricas_sync → useSolMetricas()
 * sol_propostas → sol_propostas → useSolProjetos()
 * sol_qualificacao → sol_qualificacao_sync → useSolQualificacao()
 * sol_conversions → sol_conversions_sync → useSolConversions()
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { useFranquiaId } from "@/hooks/useFranquiaId";
import { useOrgFilter } from "@/contexts/OrgFilterContext";
import { franquiaColumnValuesForSlug } from "@/lib/franquiaSync";
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
  gestor_key: string | null;
  updated_by: string | null;
  updated_at: string | null;
  synced_at: string | null;
};

/** Linha completa de sol_propostas (comercial / Solar Market) */
export type SolProjeto = Database["public"]["Tables"]["sol_propostas"]["Row"];

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
  const { user, userRole } = useAuth();
  const { selectedOrgId } = useOrgFilter();
  const franquiaId = useFranquiaId();
  const franchiseQueryReady = !selectedOrgId || franquiaId.trim().length > 0;

  return useQuery({
    queryKey: ["sol-leads", franquiaId, statusFilter, userRole, selectedOrgId],
    queryFn: async (): Promise<SolLead[]> => {
      if (selectedOrgId && !franquiaId.trim()) return [];
      const franquiaIds = franquiaColumnValuesForSlug(franquiaId);
      const franquiaFilter = franquiaIds.length > 0 ? franquiaIds : [franquiaId];
      let query = supabase
        .from("sol_projetos")
        .select("*")
        .in("franquia_id", franquiaFilter)
        .order("ts_cadastro", { ascending: false });

      if (statusFilter?.length) {
        query = query.in("status", statusFilter);
      }

      // Role-based filtering: hierarchical visibility
      // closer → own leads only | gerente/diretor/super_admin → all franchise data
      if (userRole === 'closer' && user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (profile?.full_name) {
          query = query.eq("closer_nome", profile.full_name);
        }
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
    enabled: !!user && franchiseQueryReady,
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

/** Limite alto: painéis comerciais agregam o histórico de eventos por franquia */
export function useSolProjetos(limit = 15_000) {
  const { user } = useAuth();
  const { selectedOrgId } = useOrgFilter();
  const franquiaId = useFranquiaId();
  const franchiseQueryReady = !selectedOrgId || franquiaId.trim().length > 0;

  return useQuery({
    queryKey: ["sol-projetos", franquiaId, limit, selectedOrgId],
    queryFn: async (): Promise<SolProjeto[]> => {
      if (selectedOrgId && !franquiaId.trim()) return [];
      const franquiaIds = franquiaColumnValuesForSlug(franquiaId);
      const franquiaFilter = franquiaIds.length > 0 ? franquiaIds : [franquiaId];
      const { data, error } = await supabase
        .from("sol_propostas")
        .select("*")
        .in("franquia_id", franquiaFilter)
        .not("project_id", "is", null)
        .order("ts_evento", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as SolProjeto[];
    },
    enabled: !!user && franchiseQueryReady,
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

      // Trigger reverse sync to Make DS 87419
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
          await fetch(
            `https://${projectId}.supabase.co/functions/v1/sync-sol-config`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                "Content-Type": "application/json",
                apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
              body: JSON.stringify({ keys: [key] }),
            }
          );
        }
      } catch (syncErr) {
        console.warn("Reverse sync to Make failed (non-blocking):", syncErr);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sol-config"] });
      toast.success("Configuração salva e sincronizada com o Agent.");
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
    // Por etapa_funil (posição real no processo)
    trafego_pago: 0,
    sol_sdr: 0,
    follow_up: 0,
    qualificados: 0,
    contato_realizado: 0,
    proposta: 0,
    negociacao: 0,
    ganhos: 0,
    perdidos: 0,
    cobranca: 0,
    contrato: 0,
    declinio: 0,
    // Por status SM
    abertos: 0,
    // Agrupamentos
    pre_venda: 0,
    comercial: 0,
    pos_venda: 0,
    // Backward compat aliases
    em_qualificacao: 0,
    desqualificados: 0,
  };

  if (leads) {
    stats.total = leads.length;
    for (const l of leads) {
      const etapa = (l.etapa_funil || '').toUpperCase().trim();
      const status = (l.status || '').toUpperCase().trim();

      // Contagem por etapa_funil
      if (etapa === 'TRAFEGO PAGO') stats.trafego_pago++;
      else if (etapa === 'SOL SDR') stats.sol_sdr++;
      else if (etapa === 'FOLLOW UP') stats.follow_up++;
      else if (etapa === 'QUALIFICADO') stats.qualificados++;
      else if (etapa === 'CONTATO REALIZADO') stats.contato_realizado++;
      else if (etapa === 'PROPOSTA') stats.proposta++;
      else if (etapa === 'NEGOCIAÇÃO' || etapa === 'NEGOCIACAO') stats.negociacao++;
      else if (etapa === 'GANHO') stats.ganhos++;
      else if (etapa === 'PERDIDO') stats.perdidos++;
      else if (etapa === 'COBRANÇA' || etapa === 'COBRANCA') stats.cobranca++;
      else if (etapa === 'CONTRATO') stats.contrato++;
      else if (etapa === 'DECLÍNIO' || etapa === 'DECLINIO') stats.declinio++;

      // Contagem por status SM
      if (status === 'ABERTO') stats.abertos++;
      else if (status === 'GANHO') stats.ganhos++;
      else if (status === 'PERDIDO') stats.perdidos++;

      // Agrupamento por área
      if (['TRAFEGO PAGO', 'SOL SDR', 'FOLLOW UP'].includes(etapa)) stats.pre_venda++;
      else if (['QUALIFICADO', 'CONTATO REALIZADO', 'PROPOSTA', 'NEGOCIAÇÃO', 'NEGOCIACAO'].includes(etapa)) stats.comercial++;
      else if (['GANHO', 'COBRANÇA', 'COBRANCA', 'CONTRATO'].includes(etapa)) stats.pos_venda++;
    }

    // Backward compat
    stats.em_qualificacao = stats.sol_sdr;
    stats.desqualificados = stats.declinio;
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
