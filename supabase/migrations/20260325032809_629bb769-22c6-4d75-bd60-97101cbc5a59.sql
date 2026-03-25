CREATE POLICY "Diretor/gerente can manage own franchise team"
ON public.time_comercial
FOR ALL
TO authenticated
USING (
  (franquia_id = (SELECT organizations.slug FROM organizations WHERE organizations.id = get_user_org(auth.uid())))
  AND (has_role(auth.uid(), 'diretor'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
)
WITH CHECK (
  (franquia_id = (SELECT organizations.slug FROM organizations WHERE organizations.id = get_user_org(auth.uid())))
  AND (has_role(auth.uid(), 'diretor'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
);