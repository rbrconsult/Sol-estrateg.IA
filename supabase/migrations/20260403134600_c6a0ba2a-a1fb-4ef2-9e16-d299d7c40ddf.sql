-- Fix 1: Restrict secret organization configs from non-admin users
DROP POLICY IF EXISTS "Users can view own org configs" ON public.organization_configs;

CREATE POLICY "Users can view non-secret org configs"
  ON public.organization_configs FOR SELECT TO authenticated
  USING (
    organization_id = get_user_org(auth.uid())
    AND is_secret = false
  );

CREATE POLICY "Admins can view secret org configs"
  ON public.organization_configs FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Fix 2: Make ticket-attachments bucket private
UPDATE storage.buckets SET public = false WHERE id = 'ticket-attachments';