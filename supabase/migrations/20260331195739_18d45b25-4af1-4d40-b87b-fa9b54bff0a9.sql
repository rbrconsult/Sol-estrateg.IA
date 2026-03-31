
-- =============================================
-- GRUPO 2: OPERACIONAL (Make → Supabase, READ-ONLY)
-- =============================================

-- 2.1 sol_leads_sync (DS 87418)
CREATE TABLE public.sol_leads_sync (
  telefone TEXT PRIMARY KEY,
  nome TEXT,
  email TEXT,
  cidade TEXT,
  status TEXT,
  score TEXT,
  temperatura TEXT,
  canal_origem TEXT,
  franquia_id TEXT DEFAULT 'evolve_olimpia',
  project_id TEXT,
  identificador TEXT,
  chat_id TEXT,
  contact_id TEXT,
  transferido_comercial BOOLEAN DEFAULT FALSE,
  total_mensagens_ia INTEGER DEFAULT 0,
  resumo_conversa TEXT,
  resumo_qualificacao TEXT,
  valor_conta TEXT,
  tipo_imovel TEXT,
  tipo_telhado TEXT,
  acrescimo_carga TEXT,
  prazo_decisao TEXT,
  forma_pagamento TEXT,
  preferencia_contato TEXT,
  closer_nome TEXT,
  closer_sm_id TEXT,
  etapa_funil TEXT,
  qualificado_por TEXT,
  aguardando_conta_luz BOOLEAN DEFAULT FALSE,
  valor_conta_confirmado_ocr TEXT,
  custo_openai NUMERIC DEFAULT 0,
  custo_elevenlabs NUMERIC DEFAULT 0,
  custo_total_usd NUMERIC DEFAULT 0,
  total_audios_enviados INTEGER DEFAULT 0,
  ts_cadastro TEXT,
  ts_ultima_interacao TEXT,
  ts_qualificado TEXT,
  ts_transferido TEXT,
  ts_desqualificado TEXT,
  ts_pedido_conta_luz TEXT,
  fup_followup_count INTEGER DEFAULT 0,
  ts_ultimo_fup TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_leads_sync_status ON public.sol_leads_sync(status);
CREATE INDEX idx_leads_sync_franquia ON public.sol_leads_sync(franquia_id);
CREATE INDEX idx_leads_sync_closer ON public.sol_leads_sync(closer_sm_id);
CREATE INDEX idx_leads_sync_canal ON public.sol_leads_sync(canal_origem);
CREATE INDEX idx_leads_sync_ts ON public.sol_leads_sync(ts_cadastro);

ALTER TABLE public.sol_leads_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can manage sol_leads_sync" ON public.sol_leads_sync FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Users can view own franchise leads sync" ON public.sol_leads_sync FOR SELECT TO authenticated USING (franquia_id = (SELECT organizations.slug FROM organizations WHERE organizations.id = get_user_org(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 2.2 sol_metricas_sync (DS 87422)
CREATE TABLE public.sol_metricas_sync (
  key TEXT PRIMARY KEY,
  data TEXT,
  robo TEXT,
  franquia_id TEXT,
  leads_novos INTEGER DEFAULT 0,
  leads_qualificados INTEGER DEFAULT 0,
  leads_transferidos INTEGER DEFAULT 0,
  custo_total NUMERIC DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_metricas_sync_data ON public.sol_metricas_sync(data);
CREATE INDEX idx_metricas_sync_franquia ON public.sol_metricas_sync(franquia_id);

ALTER TABLE public.sol_metricas_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can manage sol_metricas_sync" ON public.sol_metricas_sync FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Users can view own franchise metricas sync" ON public.sol_metricas_sync FOR SELECT TO authenticated USING (franquia_id = (SELECT organizations.slug FROM organizations WHERE organizations.id = get_user_org(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 2.3 sol_projetos_sync (DS 87423)
CREATE TABLE public.sol_projetos_sync (
  key TEXT PRIMARY KEY,
  project_id TEXT,
  identificador TEXT,
  etapa TEXT,
  evento TEXT,
  franquia_id TEXT,
  ts_evento TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_proj_sync_project ON public.sol_projetos_sync(project_id);
CREATE INDEX idx_proj_sync_franquia ON public.sol_projetos_sync(franquia_id);

ALTER TABLE public.sol_projetos_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can manage sol_projetos_sync" ON public.sol_projetos_sync FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Users can view own franchise projetos sync" ON public.sol_projetos_sync FOR SELECT TO authenticated USING (franquia_id = (SELECT organizations.slug FROM organizations WHERE organizations.id = get_user_org(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 2.4 sol_qualificacao_sync (DS 87715)
CREATE TABLE public.sol_qualificacao_sync (
  telefone TEXT PRIMARY KEY,
  franquia_id TEXT,
  modelo_negocio TEXT DEFAULT 'solar',
  dados_qualificacao JSONB,
  resumo_qualificacao TEXT,
  score INTEGER DEFAULT 0,
  temperatura TEXT,
  acao TEXT,
  ts_primeira_qualificacao TEXT,
  ts_ultima_atualizacao TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_qual_sync_franquia ON public.sol_qualificacao_sync(franquia_id);

ALTER TABLE public.sol_qualificacao_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can manage sol_qualificacao_sync" ON public.sol_qualificacao_sync FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Users can view own franchise qualificacao sync" ON public.sol_qualificacao_sync FOR SELECT TO authenticated USING (franquia_id = (SELECT organizations.slug FROM organizations WHERE organizations.id = get_user_org(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 2.5 sol_conversions_sync (DS 87775)
CREATE TABLE public.sol_conversions_sync (
  key TEXT PRIMARY KEY,
  telefone TEXT,
  project_id TEXT,
  event_name TEXT,
  canal TEXT,
  capi_sent BOOLEAN DEFAULT FALSE,
  google_sent BOOLEAN DEFAULT FALSE,
  capi_response TEXT,
  google_response TEXT,
  value NUMERIC DEFAULT 0,
  gclid TEXT,
  fbclid TEXT,
  ts_evento TIMESTAMPTZ,
  ts_enviado TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_conv_sync_telefone ON public.sol_conversions_sync(telefone);
CREATE INDEX idx_conv_sync_event ON public.sol_conversions_sync(event_name);

ALTER TABLE public.sol_conversions_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can manage sol_conversions_sync" ON public.sol_conversions_sync FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Users can view own franchise conversions sync" ON public.sol_conversions_sync FOR SELECT TO authenticated USING (true);

-- =============================================
-- GRUPO 3: CONFIGURAÇÃO (Supabase → Make, READ + WRITE)
-- =============================================

-- 3.1 sol_config_sync (DS 87419)
CREATE TABLE public.sol_config_sync (
  key TEXT PRIMARY KEY,
  valor_text TEXT,
  counter INTEGER,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sol_config_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can manage sol_config_sync" ON public.sol_config_sync FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Diretor/gerente can view sol_config_sync" ON public.sol_config_sync FOR SELECT TO authenticated USING (has_role(auth.uid(), 'diretor'::app_role) OR has_role(auth.uid(), 'gerente'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 3.2 sol_equipe_sync (DS 87420)
CREATE TABLE public.sol_equipe_sync (
  key TEXT PRIMARY KEY,
  franquia_id TEXT DEFAULT 'evolve_olimpia',
  nome TEXT,
  cargo TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  krolik_ativo BOOLEAN DEFAULT FALSE,
  sm_id INTEGER,
  krolik_id TEXT,
  krolik_setor_id TEXT,
  horario_pico_inicio TEXT,
  horario_pico_fim TEXT,
  taxa_conversao NUMERIC DEFAULT 0,
  leads_hoje INTEGER DEFAULT 0,
  leads_mes INTEGER DEFAULT 0,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_equipe_sync_franquia ON public.sol_equipe_sync(franquia_id);
CREATE INDEX idx_equipe_sync_ativo ON public.sol_equipe_sync(ativo);

ALTER TABLE public.sol_equipe_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can manage sol_equipe_sync" ON public.sol_equipe_sync FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Diretor/gerente can manage own franchise equipe sync" ON public.sol_equipe_sync FOR ALL TO authenticated USING (franquia_id = (SELECT organizations.slug FROM organizations WHERE organizations.id = get_user_org(auth.uid())) AND (has_role(auth.uid(), 'diretor'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))) WITH CHECK (franquia_id = (SELECT organizations.slug FROM organizations WHERE organizations.id = get_user_org(auth.uid())) AND (has_role(auth.uid(), 'diretor'::app_role) OR has_role(auth.uid(), 'gerente'::app_role)));
CREATE POLICY "Users can view own franchise equipe sync" ON public.sol_equipe_sync FOR SELECT TO authenticated USING (franquia_id = (SELECT organizations.slug FROM organizations WHERE organizations.id = get_user_org(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 3.3 sol_funis_sync (DS 87421)
CREATE TABLE public.sol_funis_sync (
  franquia_id TEXT PRIMARY KEY,
  funil_id INTEGER,
  funil_nome TEXT,
  sm_robo_id INTEGER,
  sm_etiqueta_robo TEXT,
  etapas JSONB,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sol_funis_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can manage sol_funis_sync" ON public.sol_funis_sync FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Diretor/gerente can manage own franchise funis sync" ON public.sol_funis_sync FOR ALL TO authenticated USING (franquia_id = (SELECT organizations.slug FROM organizations WHERE organizations.id = get_user_org(auth.uid())) AND (has_role(auth.uid(), 'diretor'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))) WITH CHECK (franquia_id = (SELECT organizations.slug FROM organizations WHERE organizations.id = get_user_org(auth.uid())) AND (has_role(auth.uid(), 'diretor'::app_role) OR has_role(auth.uid(), 'gerente'::app_role)));
CREATE POLICY "Users can view own franchise funis sync" ON public.sol_funis_sync FOR SELECT TO authenticated USING (franquia_id = (SELECT organizations.slug FROM organizations WHERE organizations.id = get_user_org(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role));
