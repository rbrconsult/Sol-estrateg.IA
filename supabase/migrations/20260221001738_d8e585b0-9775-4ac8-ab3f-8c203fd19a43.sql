
ALTER TABLE public.support_tickets
ADD COLUMN sla_paused_at timestamp with time zone DEFAULT NULL,
ADD COLUMN sla_paused_total_ms bigint NOT NULL DEFAULT 0;
