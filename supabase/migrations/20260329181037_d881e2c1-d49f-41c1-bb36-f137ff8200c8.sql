
-- SOL v2: Add new fields to leads_consolidados
ALTER TABLE leads_consolidados ADD COLUMN IF NOT EXISTS acrescimo_carga TEXT;
ALTER TABLE leads_consolidados ADD COLUMN IF NOT EXISTS prazo_decisao TEXT;
ALTER TABLE leads_consolidados ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;
ALTER TABLE leads_consolidados ADD COLUMN IF NOT EXISTS preferencia_contato TEXT;
ALTER TABLE leads_consolidados ADD COLUMN IF NOT EXISTS chat_id TEXT;
ALTER TABLE leads_consolidados ADD COLUMN IF NOT EXISTS contact_id TEXT;
ALTER TABLE leads_consolidados ADD COLUMN IF NOT EXISTS resumo_conversa TEXT;
ALTER TABLE leads_consolidados ADD COLUMN IF NOT EXISTS total_mensagens_ia INTEGER DEFAULT 0;
ALTER TABLE leads_consolidados ADD COLUMN IF NOT EXISTS total_audios_enviados INTEGER DEFAULT 0;
ALTER TABLE leads_consolidados ADD COLUMN IF NOT EXISTS custo_openai NUMERIC DEFAULT 0;
ALTER TABLE leads_consolidados ADD COLUMN IF NOT EXISTS custo_elevenlabs NUMERIC DEFAULT 0;
ALTER TABLE leads_consolidados ADD COLUMN IF NOT EXISTS custo_total_usd NUMERIC DEFAULT 0;
ALTER TABLE leads_consolidados ADD COLUMN IF NOT EXISTS qualificado_por TEXT;
ALTER TABLE leads_consolidados ADD COLUMN IF NOT EXISTS aguardando_conta_luz BOOLEAN DEFAULT false;
ALTER TABLE leads_consolidados ADD COLUMN IF NOT EXISTS transferido_comercial BOOLEAN DEFAULT false;
ALTER TABLE leads_consolidados ADD COLUMN IF NOT EXISTS ds_source TEXT DEFAULT 'ds_thread';

-- SOL v2: Create sol_metricas table
CREATE TABLE IF NOT EXISTS sol_metricas (
  id TEXT PRIMARY KEY,
  data DATE NOT NULL,
  robo TEXT NOT NULL DEFAULT 'sdr',
  franquia_id TEXT NOT NULL DEFAULT 'evolve_olimpia',
  leads_novos INTEGER DEFAULT 0,
  leads_qualificados INTEGER DEFAULT 0,
  leads_desqualificados INTEGER DEFAULT 0,
  total_mensagens INTEGER DEFAULT 0,
  total_audios INTEGER DEFAULT 0,
  custo_openai_usd NUMERIC DEFAULT 0,
  custo_elevenlabs_usd NUMERIC DEFAULT 0,
  custo_make_usd NUMERIC DEFAULT 0,
  custo_total_usd NUMERIC DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sol_metricas_data ON sol_metricas(data, franquia_id);

ALTER TABLE sol_metricas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage sol_metricas" ON sol_metricas FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Users can view own franchise sol_metricas" ON sol_metricas FOR SELECT TO authenticated USING (
  franquia_id = (SELECT organizations.slug FROM organizations WHERE organizations.id = get_user_org(auth.uid()))
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- SOL v2: Create sol_insights table
CREATE TABLE IF NOT EXISTS sol_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franquia_id TEXT NOT NULL DEFAULT 'evolve_olimpia',
  robo TEXT DEFAULT 'sdr',
  tipo TEXT NOT NULL,
  categoria TEXT,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  dados JSONB,
  severidade TEXT DEFAULT 'INFO',
  acao_sugerida TEXT,
  visualizado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sol_insights_franquia ON sol_insights(franquia_id, created_at DESC);

ALTER TABLE sol_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage sol_insights" ON sol_insights FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Users can view own franchise sol_insights" ON sol_insights FOR SELECT TO authenticated USING (
  franquia_id = (SELECT organizations.slug FROM organizations WHERE organizations.id = get_user_org(auth.uid()))
  OR has_role(auth.uid(), 'super_admin'::app_role)
);
CREATE POLICY "Users can update own franchise sol_insights" ON sol_insights FOR UPDATE TO authenticated USING (
  franquia_id = (SELECT organizations.slug FROM organizations WHERE organizations.id = get_user_org(auth.uid()))
  OR has_role(auth.uid(), 'super_admin'::app_role)
);
