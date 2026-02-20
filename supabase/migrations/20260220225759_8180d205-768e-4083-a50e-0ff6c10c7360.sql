
ALTER TABLE public.support_tickets ADD COLUMN notification_phone text;

ALTER TABLE public.ticket_messages ADD COLUMN source text DEFAULT 'panel';
