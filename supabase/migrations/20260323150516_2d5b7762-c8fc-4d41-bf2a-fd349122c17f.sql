
CREATE TABLE public.time_comercial (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franquia_id text NOT NULL,
  nome text NOT NULL,
  cargo text,
  telefone text,
  email text,
  ativo boolean DEFAULT true,
  sm_id integer,
  krolik_id text,
  krolik_setor_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.time_comercial ENABLE ROW LEVEL SECURITY;

-- Super admins full access
CREATE POLICY "Super admins can manage time_comercial"
  ON public.time_comercial FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Org users can view their franchise members
CREATE POLICY "Users can view own franchise team"
  ON public.time_comercial FOR SELECT
  TO authenticated
  USING (
    franquia_id = (
      SELECT slug FROM public.organizations WHERE id = public.get_user_org(auth.uid())
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_time_comercial_updated_at
  BEFORE UPDATE ON public.time_comercial
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
