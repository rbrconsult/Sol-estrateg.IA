
-- Create app_settings table for storing Evolution API config
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Only super_admin can read
CREATE POLICY "Super admins can view settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Only super_admin can insert
CREATE POLICY "Super admins can insert settings"
ON public.app_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Only super_admin can update
CREATE POLICY "Super admins can update settings"
ON public.app_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Insert initial values
INSERT INTO public.app_settings (key, value) VALUES
  ('evolution_api_url', 'https://api.rbrsistemas.com'),
  ('evolution_api_key', '34228796396A-4285-A3DC-EEF91521C390'),
  ('evolution_instance_name', 'RBR Flow'),
  ('central_whatsapp_number', '5517997335222');
