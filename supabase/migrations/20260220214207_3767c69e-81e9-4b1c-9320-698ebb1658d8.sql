
-- Add new columns to support_tickets
ALTER TABLE public.support_tickets
  ADD COLUMN fluxo text,
  ADD COLUMN cliente_nome text,
  ADD COLUMN cliente_telefone text,
  ADD COLUMN detalhes text,
  ADD COLUMN attachment_url text;

-- Create storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', true);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload ticket attachments"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'ticket-attachments' AND auth.role() = 'authenticated');

-- Allow public read access
CREATE POLICY "Public can view ticket attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ticket-attachments');

-- Allow users to update their own uploads
CREATE POLICY "Users can update their own ticket attachments"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'ticket-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own ticket attachments"
ON storage.objects
FOR DELETE
USING (bucket_id = 'ticket-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
