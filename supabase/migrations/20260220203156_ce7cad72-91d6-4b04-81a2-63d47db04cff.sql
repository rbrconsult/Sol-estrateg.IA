
-- Enums
CREATE TYPE public.ticket_category AS ENUM ('bug', 'duvida', 'melhoria', 'urgencia');
CREATE TYPE public.ticket_priority AS ENUM ('baixa', 'media', 'alta', 'critica');
CREATE TYPE public.ticket_status AS ENUM ('aberto', 'em_andamento', 'resolvido', 'fechado');

-- Support tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assigned_to UUID,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria ticket_category NOT NULL DEFAULT 'duvida',
  prioridade ticket_priority NOT NULL DEFAULT 'media',
  status ticket_status NOT NULL DEFAULT 'aberto',
  sla_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ticket messages table
CREATE TABLE public.ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- RLS for support_tickets
CREATE POLICY "Users can view their own tickets"
ON public.support_tickets FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can create their own tickets"
ON public.support_tickets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets"
ON public.support_tickets FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

-- RLS for ticket_messages
CREATE POLICY "Users can view messages of their tickets"
ON public.ticket_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id
    AND (t.user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))
  )
);

CREATE POLICY "Users can add messages to their tickets"
ON public.ticket_messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id
    AND (t.user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))
  )
);

-- Triggers
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;
