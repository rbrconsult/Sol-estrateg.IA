INSERT INTO public.user_module_permissions (user_id, module_key, enabled)
VALUES 
  ('df6aa4b2-b7fd-400b-97b9-c7da379affda', 'admin-cenarios', true)
ON CONFLICT (user_id, module_key) DO UPDATE SET enabled = true, updated_at = now();