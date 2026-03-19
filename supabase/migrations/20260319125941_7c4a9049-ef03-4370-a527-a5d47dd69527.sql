
CREATE TABLE public.organization_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  config_key text NOT NULL,
  config_value text NOT NULL DEFAULT '',
  config_category text NOT NULL DEFAULT 'general',
  is_secret boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, config_key)
);

ALTER TABLE public.organization_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage org configs"
  ON public.organization_configs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own org configs"
  ON public.organization_configs FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()));

CREATE TRIGGER update_organization_configs_updated_at
  BEFORE UPDATE ON public.organization_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
