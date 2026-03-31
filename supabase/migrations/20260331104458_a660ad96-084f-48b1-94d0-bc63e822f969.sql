
-- Fix ticket_messages SELECT policy to be org-scoped
DROP POLICY IF EXISTS "Users can view messages of their tickets" ON public.ticket_messages;
CREATE POLICY "Users can view messages of their tickets"
  ON public.ticket_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_messages.ticket_id
      AND (t.organization_id = public.get_user_org(auth.uid())
           OR public.has_role(auth.uid(), 'super_admin'))
  ));

-- Fix ticket_status_history SELECT policy to be org-scoped
DROP POLICY IF EXISTS "Users can view history of their tickets" ON public.ticket_status_history;
CREATE POLICY "Users can view history of their tickets"
  ON public.ticket_status_history FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_status_history.ticket_id
      AND (t.organization_id = public.get_user_org(auth.uid())
           OR public.has_role(auth.uid(), 'super_admin'))
  ));

-- Fix access_logs: allow service role inserts (for edge functions logging)
DROP POLICY IF EXISTS "Service can insert access logs" ON public.access_logs;
CREATE POLICY "Service can insert access logs"
  ON public.access_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
