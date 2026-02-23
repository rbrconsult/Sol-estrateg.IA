
-- Update SELECT policy on support_tickets to allow all authenticated users
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets
  FOR SELECT
  TO authenticated
  USING (true);

-- Update SELECT policy on ticket_messages to allow all authenticated users
DROP POLICY IF EXISTS "Users can view messages of their tickets" ON public.ticket_messages;
CREATE POLICY "Users can view messages of their tickets"
  ON public.ticket_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Update SELECT policy on ticket_status_history to allow all authenticated users
DROP POLICY IF EXISTS "Users can view history of their tickets" ON public.ticket_status_history;
CREATE POLICY "Users can view history of their tickets"
  ON public.ticket_status_history
  FOR SELECT
  TO authenticated
  USING (true);
