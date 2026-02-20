
-- 1. Enable pgcrypto in extensions schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Create hash function using extensions.digest
CREATE OR REPLACE FUNCTION public.hash_session_token(token text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT encode(extensions.digest(token::bytea, 'sha256'), 'hex')
$$;

-- 3. Update invalidate_other_sessions to use hashed tokens
CREATE OR REPLACE FUNCTION public.invalidate_other_sessions(p_user_id uuid, p_current_session text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_sessions
  SET is_active = false
  WHERE user_id = p_user_id
    AND session_token != public.hash_session_token(p_current_session)
    AND is_active = true;
END;
$$;

-- 4. Update is_session_valid to use hashed tokens
CREATE OR REPLACE FUNCTION public.is_session_valid(p_user_id uuid, p_session_token text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_sessions
    WHERE user_id = p_user_id
      AND session_token = public.hash_session_token(p_session_token)
      AND is_active = true
  )
$$;

-- 5. Invalidate all existing plain-text sessions (force re-login)
UPDATE public.user_sessions SET is_active = false;

-- 6. Remove user-level RLS policies from user_sessions
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert their own session" ON public.user_sessions;

-- 7. Remove user INSERT policy from access_logs
DROP POLICY IF EXISTS "Users can insert their own access logs" ON public.access_logs;

-- 8. Update support_tickets policies to include assigned_to
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
CREATE POLICY "Users can view their own tickets"
ON public.support_tickets FOR SELECT TO authenticated
USING (auth.uid() = user_id OR assigned_to = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Users can update their own tickets" ON public.support_tickets;
CREATE POLICY "Users can update their own tickets"
ON public.support_tickets FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR assigned_to = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role));

-- 9. Update ticket_messages policies to include assigned_to
DROP POLICY IF EXISTS "Users can view messages of their tickets" ON public.ticket_messages;
CREATE POLICY "Users can view messages of their tickets"
ON public.ticket_messages FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM support_tickets t
  WHERE t.id = ticket_messages.ticket_id
  AND (t.user_id = auth.uid() OR t.assigned_to = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role))
));

DROP POLICY IF EXISTS "Users can add messages to their tickets" ON public.ticket_messages;
CREATE POLICY "Users can add messages to their tickets"
ON public.ticket_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM support_tickets t
    WHERE t.id = ticket_messages.ticket_id
    AND (t.user_id = auth.uid() OR t.assigned_to = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role))
  )
);

-- 10. Super admin can view all profiles
CREATE POLICY "Super admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));
