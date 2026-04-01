CREATE TABLE public.internal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'geral',
  content text NOT NULL,
  is_broadcast boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own messages"
ON public.internal_messages FOR SELECT TO authenticated
USING (
  sender_id = auth.uid()
  OR recipient_id = auth.uid()
  OR (is_broadcast = true AND organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "Users can send messages"
ON public.internal_messages FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_messages;