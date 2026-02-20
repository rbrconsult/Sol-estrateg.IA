
CREATE POLICY "Super admins can delete tickets"
ON public.support_tickets
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));
