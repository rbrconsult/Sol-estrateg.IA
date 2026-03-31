import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFranquiaId } from "@/hooks/useFranquiaId";
import { toast } from "sonner";

// ── sol_metricas_sync ──
export interface SolMetricaSync {
  key: string;
  data: string | null;
  robo: string | null;
  franquia_id: string | null;
  leads_novos: number | null;
  leads_qualificados: number | null;
  leads_transferidos: number | null;
  custo_total: number | null;
  synced_at: string | null;
}

export function useSolMetricasSync(limit = 30) {
  const { user } = useAuth();
  const franquiaId = useFranquiaId();

  return useQuery({
    queryKey: ["sol-metricas-sync", franquiaId, limit],
    queryFn: async (): Promise<SolMetricaSync[]> => {
      const { data, error } = await supabase
        .from("sol_metricas_sync")
        .select("*")
        .eq("franquia_id", franquiaId)
        .order("data", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as SolMetricaSync[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

// ── sol_equipe_sync ──
export interface SolEquipeSync {
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
}

export function useSolEquipeSync() {
  const { user } = useAuth();
  const franquiaId = useFranquiaId();

  return useQuery({
    queryKey: ["sol-equipe-sync", franquiaId],
    queryFn: async (): Promise<SolEquipeSync[]> => {
      const { data, error } = await supabase
        .from("sol_equipe_sync")
        .select("*")
        .eq("franquia_id", franquiaId)
        .order("cargo")
        .order("nome");
      if (error) throw error;
      return (data || []) as SolEquipeSync[];
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
      qc.invalidateQueries({ queryKey: ["sol-equipe-sync"] });
      toast.success("Equipe atualizada.");
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });
}

export function useSolEquipeInsert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: Record<string, any>) => {
      const { error } = await supabase
        .from("sol_equipe_sync")
        .insert({ ...record, updated_by: "lovable", updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sol-equipe-sync"] });
      toast.success("Membro adicionado.");
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });
}

// ── sol_projetos_sync ──
export interface SolProjetoSync {
  key: string;
  project_id: string | null;
  identificador: string | null;
  etapa: string | null;
  evento: string | null;
  franquia_id: string | null;
  ts_evento: string | null;
  synced_at: string | null;
}

export function useSolProjetosSync(limit = 100) {
  const { user } = useAuth();
  const franquiaId = useFranquiaId();

  return useQuery({
    queryKey: ["sol-projetos-sync", franquiaId, limit],
    queryFn: async (): Promise<SolProjetoSync[]> => {
      const { data, error } = await supabase
        .from("sol_projetos_sync")
        .select("*")
        .eq("franquia_id", franquiaId)
        .order("ts_evento", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as SolProjetoSync[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

// ── sol_qualificacao_sync ──
export interface SolQualificacaoSync {
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
}

export function useSolQualificacaoSync() {
  const { user } = useAuth();
  const franquiaId = useFranquiaId();

  return useQuery({
    queryKey: ["sol-qualificacao-sync", franquiaId],
    queryFn: async (): Promise<SolQualificacaoSync[]> => {
      const { data, error } = await supabase
        .from("sol_qualificacao_sync")
        .select("*")
        .eq("franquia_id", franquiaId);
      if (error) throw error;
      return (data || []) as SolQualificacaoSync[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

// ── sol_conversions_sync ──
export interface SolConversionSync {
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
}

export function useSolConversionsSync() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["sol-conversions-sync"],
    queryFn: async (): Promise<SolConversionSync[]> => {
      const { data, error } = await supabase
        .from("sol_conversions_sync")
        .select("*")
        .order("ts_evento", { ascending: false });
      if (error) throw error;
      return (data || []) as SolConversionSync[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

// ── sol_config_sync ──
export interface SolConfigSync {
  key: string;
  valor_text: string | null;
  counter: number | null;
  updated_by: string | null;
  updated_at: string | null;
  synced_at: string | null;
}

export function useSolConfigSync() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["sol-config-sync"],
    queryFn: async (): Promise<SolConfigSync[]> => {
      const { data, error } = await supabase
        .from("sol_config_sync")
        .select("*")
        .order("key");
      if (error) throw error;
      return (data || []) as SolConfigSync[];
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
      qc.invalidateQueries({ queryKey: ["sol-config-sync"] });
      toast.success("Configuração salva. O Agent usará na próxima mensagem.");
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });
}

// ── sol_funis_sync ──
export interface SolFunilSync {
  franquia_id: string;
  funil_id: number | null;
  funil_nome: string | null;
  sm_robo_id: number | null;
  sm_etiqueta_robo: string | null;
  etapas: any;
  updated_by: string | null;
  updated_at: string | null;
  synced_at: string | null;
}

export function useSolFunisSync() {
  const { user } = useAuth();
  const franquiaId = useFranquiaId();

  return useQuery({
    queryKey: ["sol-funis-sync", franquiaId],
    queryFn: async (): Promise<SolFunilSync[]> => {
      const { data, error } = await supabase
        .from("sol_funis_sync")
        .select("*")
        .eq("franquia_id", franquiaId);
      if (error) throw error;
      return (data || []) as SolFunilSync[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}
