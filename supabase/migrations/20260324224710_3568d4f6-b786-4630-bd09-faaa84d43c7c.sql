
-- Campaign metrics table (Google Ads + Meta Ads)
CREATE TABLE public.campaign_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  plataforma text NOT NULL, -- 'google_ads' | 'meta_ads'
  campaign_id text,
  campaign_name text,
  adset_name text,
  ad_name text,
  data_referencia date NOT NULL,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  spend numeric(12,2) DEFAULT 0,
  conversions integer DEFAULT 0,
  leads integer DEFAULT 0,
  ctr numeric(8,4) DEFAULT 0,
  cpc numeric(10,2) DEFAULT 0,
  cpl numeric(10,2) DEFAULT 0,
  roas numeric(10,2) DEFAULT 0,
  receita numeric(14,2) DEFAULT 0,
  raw_data jsonb DEFAULT '{}'::jsonb,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, plataforma, campaign_id, data_referencia)
);

-- GA4 metrics table
CREATE TABLE public.ga4_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  data_referencia date NOT NULL,
  source text,
  medium text,
  campaign text,
  landing_page text,
  sessions integer DEFAULT 0,
  users_count integer DEFAULT 0,
  new_users integer DEFAULT 0,
  bounce_rate numeric(6,2) DEFAULT 0,
  avg_session_duration numeric(10,2) DEFAULT 0,
  pages_per_session numeric(6,2) DEFAULT 0,
  conversions integer DEFAULT 0,
  conversion_rate numeric(6,4) DEFAULT 0,
  events jsonb DEFAULT '{}'::jsonb,
  raw_data jsonb DEFAULT '{}'::jsonb,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, data_referencia, source, medium, campaign, landing_page)
);

-- RLS
ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ga4_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for campaign_metrics
CREATE POLICY "Users can view org campaign metrics" ON public.campaign_metrics
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org(auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage campaign metrics" ON public.campaign_metrics
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Policies for ga4_metrics
CREATE POLICY "Users can view org ga4 metrics" ON public.ga4_metrics
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org(auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage ga4 metrics" ON public.ga4_metrics
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Updated at trigger
CREATE TRIGGER update_campaign_metrics_updated_at BEFORE UPDATE ON public.campaign_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ga4_metrics_updated_at BEFORE UPDATE ON public.ga4_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
