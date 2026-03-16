
-- Table: leads_consolidados — consolidated lead data synced from Make Data Store
CREATE TABLE public.leads_consolidados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone text NOT NULL,
  nome text,
  email text,
  cidade text,
  valor_conta text,
  imovel text,
  project_id text,
  canal_origem text,
  campanha text,
  temperatura text,
  score integer,
  status text DEFAULT 'novo',
  codigo_status text,
  etapa text,
  responsavel text,
  robo text,
  followup_count integer DEFAULT 0,
  last_followup_date timestamptz,
  respondeu boolean DEFAULT false,
  data_entrada timestamptz DEFAULT now(),
  data_qualificacao timestamptz,
  data_agendamento timestamptz,
  data_proposta timestamptz,
  data_fechamento timestamptz,
  sentimento_resposta text,
  interesse_detectado text,
  tempo_resposta_seg integer,
  valor_proposta numeric,
  organization_id uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid REFERENCES public.organizations(id),
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(telefone, organization_id)
);

ALTER TABLE public.leads_consolidados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org leads" ON public.leads_consolidados
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org(auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage leads" ON public.leads_consolidados
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Table: lead_status_history — tracks status changes over time
CREATE TABLE public.lead_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads_consolidados(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  old_etapa text,
  new_etapa text,
  changed_by text DEFAULT 'system',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org lead history" ON public.lead_status_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads_consolidados lc
      WHERE lc.id = lead_status_history.lead_id
      AND (lc.organization_id = get_user_org(auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role))
    )
  );

CREATE POLICY "Super admins can manage lead history" ON public.lead_status_history
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger to auto-update updated_at
CREATE TRIGGER update_leads_consolidados_updated_at
  BEFORE UPDATE ON public.leads_consolidados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
