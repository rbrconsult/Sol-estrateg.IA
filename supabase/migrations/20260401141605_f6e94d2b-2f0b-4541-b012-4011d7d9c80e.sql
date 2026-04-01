
CREATE TABLE public.skill_toggles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  franquia_id text NOT NULL DEFAULT 'evolve_olimpia',
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.skill_toggles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage skill_toggles"
  ON public.skill_toggles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Diretor/gerente can manage own franchise skill_toggles"
  ON public.skill_toggles FOR ALL TO authenticated
  USING (
    (franquia_id = (SELECT organizations.slug FROM organizations WHERE organizations.id = get_user_org(auth.uid())))
    AND (has_role(auth.uid(), 'diretor'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
  )
  WITH CHECK (
    (franquia_id = (SELECT organizations.slug FROM organizations WHERE organizations.id = get_user_org(auth.uid())))
    AND (has_role(auth.uid(), 'diretor'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
  );

CREATE POLICY "Users can view own franchise skill_toggles"
  ON public.skill_toggles FOR SELECT TO authenticated
  USING (
    (franquia_id = (SELECT organizations.slug FROM organizations WHERE organizations.id = get_user_org(auth.uid())))
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );
