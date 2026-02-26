
CREATE TABLE public.make_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id text UNIQUE NOT NULL,
  scenario_id integer,
  scenario_name text,
  module_name text,
  module_app text,
  failed_module_index integer,
  total_modules integer,
  error_type text,
  error_code text,
  error_message text,
  attempts integer DEFAULT 0,
  execution_status text NOT NULL DEFAULT 'stopped',
  flow_category text,
  execution_duration_seconds integer,
  status text NOT NULL DEFAULT 'pending',
  resolution_notes text,
  occurred_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.make_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage make_errors"
  ON public.make_errors
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX idx_make_errors_status ON public.make_errors(status);
CREATE INDEX idx_make_errors_execution_status ON public.make_errors(execution_status);
CREATE INDEX idx_make_errors_occurred_at ON public.make_errors(occurred_at DESC);
CREATE INDEX idx_make_errors_flow_category ON public.make_errors(flow_category);
