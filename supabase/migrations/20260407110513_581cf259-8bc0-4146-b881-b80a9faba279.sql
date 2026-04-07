
ALTER TABLE sol_projetos_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Franquia members can view sol_projetos_sync"
ON sol_projetos_sync
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR franquia_id_matches_org_slug(franquia_id, (SELECT o.slug FROM organizations o WHERE o.id = get_user_org(auth.uid())))
);

CREATE POLICY "Super admins can manage sol_projetos_sync"
ON sol_projetos_sync
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
