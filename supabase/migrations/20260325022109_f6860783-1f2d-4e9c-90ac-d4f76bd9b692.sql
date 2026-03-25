
-- 1. ads_meta_campaigns_daily
CREATE TABLE public.ads_meta_campaigns_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  franquia_id text NOT NULL DEFAULT 'evolve_olimpia',
  external_account_id text NOT NULL DEFAULT 'act_431437131828239',
  date date NOT NULL,
  campaign_id text NOT NULL,
  campaign_name text,
  adset_id text,
  adset_name text,
  ad_id text NOT NULL,
  ad_name text,
  creative_id text,
  creative_name text,
  campaign_status text,
  adset_status text,
  ad_status text,
  objetivo text,
  dispositivo text,
  publico_alvo text,
  orcamento_diario numeric(14,2) DEFAULT 0,
  orcamento_total numeric(14,2) DEFAULT 0,
  impressions bigint DEFAULT 0,
  reach bigint DEFAULT 0,
  frequency numeric(14,4) DEFAULT 0,
  clicks bigint DEFAULT 0,
  spend numeric(14,2) DEFAULT 0,
  cpm numeric(14,4) DEFAULT 0,
  cpc numeric(14,4) DEFAULT 0,
  ctr numeric(14,4) DEFAULT 0,
  leads bigint DEFAULT 0,
  leads_qualificados bigint DEFAULT 0,
  leads_agendados bigint DEFAULT 0,
  leads_fechados bigint DEFAULT 0,
  cpl numeric(14,2),
  cpl_qualificado numeric(14,2),
  cpl_agendado numeric(14,2),
  taxa_qualificacao numeric(14,4),
  taxa_agendamento numeric(14,4),
  taxa_fechamento numeric(14,4),
  receita_gerada numeric(14,2) DEFAULT 0,
  roas numeric(14,4),
  capi_lead_enviado boolean DEFAULT false,
  capi_qualificado_enviado boolean DEFAULT false,
  capi_agendado_enviado boolean DEFAULT false,
  capi_fechado_enviado boolean DEFAULT false,
  raw_payload jsonb,
  inserted_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX uq_ads_meta_daily ON public.ads_meta_campaigns_daily (
  franquia_id, external_account_id, date, campaign_id, coalesce(adset_id,''), coalesce(ad_id,'')
);

ALTER TABLE public.ads_meta_campaigns_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own franchise meta ads" ON public.ads_meta_campaigns_daily
  FOR SELECT TO authenticated
  USING (franquia_id = (SELECT slug FROM organizations WHERE id = get_user_org(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage meta ads" ON public.ads_meta_campaigns_daily
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 2. ads_google_campaigns_daily
CREATE TABLE public.ads_google_campaigns_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  franquia_id text NOT NULL DEFAULT 'evolve_olimpia',
  customer_id text NOT NULL DEFAULT '5699577570',
  date date NOT NULL,
  campaign_id text NOT NULL,
  campaign_name text,
  campaign_status text,
  objetivo text,
  ad_group_id text,
  ad_group_name text,
  ad_group_status text,
  ad_id text,
  ad_status text,
  dispositivo text,
  rede text,
  impressions bigint DEFAULT 0,
  clicks bigint DEFAULT 0,
  cost numeric(14,2) DEFAULT 0,
  ctr numeric(14,4) DEFAULT 0,
  cpc numeric(14,4) DEFAULT 0,
  cpm numeric(14,4) DEFAULT 0,
  conversions numeric(14,4) DEFAULT 0,
  conversion_value numeric(14,2) DEFAULT 0,
  cost_per_conversion numeric(14,2) DEFAULT 0,
  all_conversions numeric(14,4) DEFAULT 0,
  all_conversions_value numeric(14,2) DEFAULT 0,
  roas numeric(14,4),
  video_views bigint DEFAULT 0,
  video_view_rate numeric(14,4) DEFAULT 0,
  engagements bigint DEFAULT 0,
  orcamento_campanha numeric(14,2) DEFAULT 0,
  raw_payload jsonb,
  inserted_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX uq_ads_google_daily ON public.ads_google_campaigns_daily (
  franquia_id, customer_id, date, campaign_id, coalesce(ad_group_id,''), coalesce(ad_id,''), coalesce(dispositivo,''), coalesce(rede,'')
);

ALTER TABLE public.ads_google_campaigns_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own franchise google ads" ON public.ads_google_campaigns_daily
  FOR SELECT TO authenticated
  USING (franquia_id = (SELECT slug FROM organizations WHERE id = get_user_org(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage google ads" ON public.ads_google_campaigns_daily
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 3. analytics_ga4_daily
CREATE TABLE public.analytics_ga4_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  franquia_id text NOT NULL DEFAULT 'evolve_olimpia',
  property_id text NOT NULL,
  date date NOT NULL,
  source text,
  medium text,
  campaign text,
  landing_page text,
  sessions bigint DEFAULT 0,
  users bigint DEFAULT 0,
  new_users bigint DEFAULT 0,
  engaged_sessions bigint DEFAULT 0,
  conversions bigint DEFAULT 0,
  revenue numeric(14,2) DEFAULT 0,
  raw_payload jsonb,
  inserted_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX uq_analytics_ga4_daily ON public.analytics_ga4_daily (
  franquia_id, property_id, date, coalesce(source,''), coalesce(medium,''), coalesce(campaign,''), coalesce(landing_page,'')
);

ALTER TABLE public.analytics_ga4_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own franchise ga4" ON public.analytics_ga4_daily
  FOR SELECT TO authenticated
  USING (franquia_id = (SELECT slug FROM organizations WHERE id = get_user_org(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage ga4" ON public.analytics_ga4_daily
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 4. whatsapp_conversations_daily
CREATE TABLE public.whatsapp_conversations_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  franquia_id text NOT NULL DEFAULT 'evolve_olimpia',
  date date NOT NULL,
  campaign_id text,
  campaign_name text,
  conversations_started bigint DEFAULT 0,
  conversations_replied bigint DEFAULT 0,
  leads bigint DEFAULT 0,
  leads_qualificados bigint DEFAULT 0,
  leads_agendados bigint DEFAULT 0,
  leads_fechados bigint DEFAULT 0,
  cpl numeric(14,2),
  raw_payload jsonb,
  inserted_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX uq_whatsapp_daily ON public.whatsapp_conversations_daily (
  franquia_id, date, coalesce(campaign_id,'')
);

ALTER TABLE public.whatsapp_conversations_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own franchise whatsapp" ON public.whatsapp_conversations_daily
  FOR SELECT TO authenticated
  USING (franquia_id = (SELECT slug FROM organizations WHERE id = get_user_org(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage whatsapp" ON public.whatsapp_conversations_daily
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 5. media_performance_daily
CREATE TABLE public.media_performance_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  franquia_id text NOT NULL DEFAULT 'evolve_olimpia',
  date date NOT NULL,
  channel text NOT NULL,
  campaign_id text,
  campaign_name text,
  source text,
  medium text,
  landing_page text,
  impressions bigint DEFAULT 0,
  clicks bigint DEFAULT 0,
  spend numeric(14,2) DEFAULT 0,
  sessions bigint DEFAULT 0,
  users bigint DEFAULT 0,
  leads bigint DEFAULT 0,
  leads_qualificados bigint DEFAULT 0,
  leads_agendados bigint DEFAULT 0,
  leads_fechados bigint DEFAULT 0,
  conversions numeric(14,4) DEFAULT 0,
  revenue numeric(14,2) DEFAULT 0,
  cpl numeric(14,2),
  cac numeric(14,2),
  roas numeric(14,4),
  inserted_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX uq_media_performance_daily ON public.media_performance_daily (
  franquia_id, date, channel, coalesce(campaign_id,''), coalesce(source,''), coalesce(medium,'')
);

ALTER TABLE public.media_performance_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own franchise media perf" ON public.media_performance_daily
  FOR SELECT TO authenticated
  USING (franquia_id = (SELECT slug FROM organizations WHERE id = get_user_org(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage media perf" ON public.media_performance_daily
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 6. integration_runs
CREATE TABLE public.integration_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  franquia_id text DEFAULT 'evolve_olimpia',
  integration_name text NOT NULL,
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL,
  rows_received int DEFAULT 0,
  rows_upserted int DEFAULT 0,
  error_message text,
  meta jsonb
);

ALTER TABLE public.integration_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own franchise integration runs" ON public.integration_runs
  FOR SELECT TO authenticated
  USING (franquia_id = (SELECT slug FROM organizations WHERE id = get_user_org(auth.uid())) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage integration runs" ON public.integration_runs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));
