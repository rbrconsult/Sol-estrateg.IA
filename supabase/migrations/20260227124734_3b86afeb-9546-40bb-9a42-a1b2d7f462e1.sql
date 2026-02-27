
CREATE TABLE public.make_heartbeat (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id integer NOT NULL,
  scenario_name text NOT NULL,
  execution_id text NOT NULL,
  status text NOT NULL DEFAULT 'success',
  duration_seconds integer,
  ops_count integer,
  transfer_bytes bigint,
  error_message text,
  started_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(execution_id)
);

-- Index for fast queries by scenario and time
CREATE INDEX idx_heartbeat_scenario_started ON public.make_heartbeat (scenario_id, started_at DESC);
CREATE INDEX idx_heartbeat_started ON public.make_heartbeat (started_at DESC);

-- RLS
ALTER TABLE public.make_heartbeat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage heartbeat"
  ON public.make_heartbeat
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow service role insert (edge function uses service role key)
