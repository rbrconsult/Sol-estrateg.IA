
-- Add new status value to ticket_status enum
ALTER TYPE public.ticket_status ADD VALUE IF NOT EXISTS 'aguardando_usuario';

-- Add first_response_at to support_tickets for first response tracking
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS first_response_at timestamptz;

-- Create status history table for tracking time in each status
CREATE TABLE public.ticket_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ticket_status_history ENABLE ROW LEVEL SECURITY;

-- RLS: same access as the parent ticket
CREATE POLICY "Users can view history of their tickets"
  ON public.ticket_status_history
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_status_history.ticket_id
      AND (t.user_id = auth.uid() OR t.assigned_to = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role))
  ));

CREATE POLICY "Authorized users can insert history"
  ON public.ticket_status_history
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_status_history.ticket_id
      AND (t.user_id = auth.uid() OR t.assigned_to = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role))
  ));

-- Enable realtime for status history
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_status_history;
