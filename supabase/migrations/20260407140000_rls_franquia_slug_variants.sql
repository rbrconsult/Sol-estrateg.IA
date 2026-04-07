-- RLS: aceitar franquia_id com hífen OU underscore em relação a organizations.slug
-- (Make vs Lovable com grafias diferentes deixavam 0 linhas para o app.)

CREATE OR REPLACE FUNCTION public.franquia_id_matches_org_slug(p_fid text, p_org_slug text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(TRIM(p_fid), '') <> ''
    AND COALESCE(TRIM(p_org_slug), '') <> ''
    AND (
      TRIM(p_fid) = TRIM(p_org_slug)
      OR TRIM(p_fid) = replace(TRIM(p_org_slug), '-', '_')
      OR TRIM(p_fid) = replace(TRIM(p_org_slug), '_', '-')
    );
$$;

COMMENT ON FUNCTION public.franquia_id_matches_org_slug(text, text) IS
  'True se franquia_id na sync bate com organizations.slug ou variantes -/_ (RLS comercial).';

-- sol_projetos_sync
DROP POLICY IF EXISTS "Users can view own franchise projetos sync" ON public.sol_projetos_sync;
CREATE POLICY "Users can view own franchise projetos sync" ON public.sol_projetos_sync
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR public.franquia_id_matches_org_slug(
    franquia_id,
    (SELECT o.slug FROM public.organizations o WHERE o.id = public.get_user_org(auth.uid()))
  )
);

-- sol_leads_sync
DROP POLICY IF EXISTS "Users can view own franchise leads sync" ON public.sol_leads_sync;
CREATE POLICY "Users can view own franchise leads sync" ON public.sol_leads_sync
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR public.franquia_id_matches_org_slug(
    franquia_id,
    (SELECT o.slug FROM public.organizations o WHERE o.id = public.get_user_org(auth.uid()))
  )
);

-- sol_metricas_sync
DROP POLICY IF EXISTS "Users can view own franchise metricas sync" ON public.sol_metricas_sync;
CREATE POLICY "Users can view own franchise metricas sync" ON public.sol_metricas_sync
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR public.franquia_id_matches_org_slug(
    franquia_id,
    (SELECT o.slug FROM public.organizations o WHERE o.id = public.get_user_org(auth.uid()))
  )
);

-- sol_qualificacao_sync
DROP POLICY IF EXISTS "Users can view own franchise qualificacao sync" ON public.sol_qualificacao_sync;
CREATE POLICY "Users can view own franchise qualificacao sync" ON public.sol_qualificacao_sync
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR public.franquia_id_matches_org_slug(
    franquia_id,
    (SELECT o.slug FROM public.organizations o WHERE o.id = public.get_user_org(auth.uid()))
  )
);

-- sol_equipe_sync
DROP POLICY IF EXISTS "Users can view own franchise equipe sync" ON public.sol_equipe_sync;
CREATE POLICY "Users can view own franchise equipe sync" ON public.sol_equipe_sync
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR public.franquia_id_matches_org_slug(
    franquia_id,
    (SELECT o.slug FROM public.organizations o WHERE o.id = public.get_user_org(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Diretor/gerente can manage own franchise equipe sync" ON public.sol_equipe_sync;
CREATE POLICY "Diretor/gerente can manage own franchise equipe sync" ON public.sol_equipe_sync
FOR ALL TO authenticated
USING (
  public.franquia_id_matches_org_slug(
    franquia_id,
    (SELECT o.slug FROM public.organizations o WHERE o.id = public.get_user_org(auth.uid()))
  )
  AND (has_role(auth.uid(), 'diretor'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
)
WITH CHECK (
  public.franquia_id_matches_org_slug(
    franquia_id,
    (SELECT o.slug FROM public.organizations o WHERE o.id = public.get_user_org(auth.uid()))
  )
  AND (has_role(auth.uid(), 'diretor'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
);

-- sol_funis_sync
DROP POLICY IF EXISTS "Users can view own franchise funis sync" ON public.sol_funis_sync;
CREATE POLICY "Users can view own franchise funis sync" ON public.sol_funis_sync
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR public.franquia_id_matches_org_slug(
    franquia_id,
    (SELECT o.slug FROM public.organizations o WHERE o.id = public.get_user_org(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Diretor/gerente can manage own franchise funis sync" ON public.sol_funis_sync;
CREATE POLICY "Diretor/gerente can manage own franchise funis sync" ON public.sol_funis_sync
FOR ALL TO authenticated
USING (
  public.franquia_id_matches_org_slug(
    franquia_id,
    (SELECT o.slug FROM public.organizations o WHERE o.id = public.get_user_org(auth.uid()))
  )
  AND (has_role(auth.uid(), 'diretor'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
)
WITH CHECK (
  public.franquia_id_matches_org_slug(
    franquia_id,
    (SELECT o.slug FROM public.organizations o WHERE o.id = public.get_user_org(auth.uid()))
  )
  AND (has_role(auth.uid(), 'diretor'::app_role) OR has_role(auth.uid(), 'gerente'::app_role))
);
