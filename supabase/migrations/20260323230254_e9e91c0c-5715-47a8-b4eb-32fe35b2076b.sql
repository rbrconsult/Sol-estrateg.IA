
CREATE TABLE public.report_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  titulo text NOT NULL,
  icon text NOT NULL DEFAULT '📊',
  destinatario text NOT NULL DEFAULT '',
  periodicidade text NOT NULL DEFAULT 'Diária — 07:00',
  canal text NOT NULL DEFAULT 'WhatsApp',
  conteudo text NOT NULL DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org reports" ON public.report_templates
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org(auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can manage reports" ON public.report_templates
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_report_templates_updated_at
  BEFORE UPDATE ON public.report_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
