CREATE TABLE public.krolic_active_contacts (
  telefone text PRIMARY KEY,
  krolic_id text NOT NULL,
  nome text,
  setor_id text,
  franquia_id text NOT NULL DEFAULT 'evolve_olimpia',
  synced_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.krolic_active_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage krolic_active_contacts"
  ON public.krolic_active_contacts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view own franchise krolic contacts"
  ON public.krolic_active_contacts FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR franquia_id_matches_org_slug(franquia_id, (
      SELECT o.slug FROM organizations o WHERE o.id = get_user_org(auth.uid())
    ))
  );