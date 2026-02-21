-- Add sequential ticket number
ALTER TABLE public.support_tickets ADD COLUMN ticket_number SERIAL;

-- Create a unique index
CREATE UNIQUE INDEX idx_support_tickets_ticket_number ON public.support_tickets (ticket_number);

-- Update existing tickets to have sequential numbers based on creation order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM public.support_tickets
)
UPDATE public.support_tickets t
SET ticket_number = n.rn
FROM numbered n
WHERE t.id = n.id;
