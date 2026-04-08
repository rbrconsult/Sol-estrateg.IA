
-- RLS policies for sol_projetos
ALTER TABLE public.sol_projetos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage sol_projetos"
ON public.sol_projetos FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view own franchise sol_projetos"
ON public.sol_projetos FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR franquia_id_matches_org_slug(franquia_id, (SELECT o.slug FROM organizations o WHERE o.id = get_user_org(auth.uid())))
);

-- RLS policies for sol_propostas
ALTER TABLE public.sol_propostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage sol_propostas"
ON public.sol_propostas FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view own franchise sol_propostas"
ON public.sol_propostas FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR franquia_id_matches_org_slug(franquia_id, (SELECT o.slug FROM organizations o WHERE o.id = get_user_org(auth.uid())))
);
