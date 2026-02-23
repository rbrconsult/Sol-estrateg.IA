
-- ============================================
-- FASE 1: Infraestrutura de Multi-Tenancy
-- ============================================

-- 1. Tabela organizations
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  settings jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Tabela organization_members
CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user'::app_role,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- 3. Inserir organização default (RBR Consult)
INSERT INTO public.organizations (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'RBR Consult', 'rbr-consult');

-- 4. Adicionar organization_id nas tabelas principais (nullable por enquanto)
ALTER TABLE public.support_tickets 
  ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

ALTER TABLE public.profiles 
  ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

-- 5. Migrar dados existentes para a org default
UPDATE public.support_tickets 
  SET organization_id = '00000000-0000-0000-0000-000000000001' 
  WHERE organization_id IS NULL;

UPDATE public.profiles 
  SET organization_id = '00000000-0000-0000-0000-000000000001' 
  WHERE organization_id IS NULL;

-- 6. Vincular todos os usuários existentes à org default
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT '00000000-0000-0000-0000-000000000001', ur.user_id, ur.role
FROM public.user_roles ur
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 7. Índices para performance
CREATE INDEX idx_support_tickets_org ON public.support_tickets(organization_id);
CREATE INDEX idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);

-- 8. Função helper get_user_org()
CREATE OR REPLACE FUNCTION public.get_user_org(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = p_user_id
  LIMIT 1
$$;

-- 9. Atualizar trigger handle_new_user para incluir org default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    '00000000-0000-0000-0000-000000000001'
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Add to default organization
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES ('00000000-0000-0000-0000-000000000001', NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- 10. Default para novos tickets
ALTER TABLE public.support_tickets 
  ALTER COLUMN organization_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- ============================================
-- FASE 2: RLS Policies
-- ============================================

-- Organizations: todos autenticados podem ver sua org, super_admin vê todas
CREATE POLICY "Users can view their organization"
  ON public.organizations FOR SELECT TO authenticated
  USING (
    id = get_user_org(auth.uid()) 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Super admins can manage organizations"
  ON public.organizations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Organization members: ver membros da sua org
CREATE POLICY "Users can view members of their org"
  ON public.organization_members FOR SELECT TO authenticated
  USING (
    organization_id = get_user_org(auth.uid()) 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Super admins can manage members"
  ON public.organization_members FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Atualizar RLS de support_tickets SELECT para filtrar por org
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
CREATE POLICY "Users can view org tickets"
  ON public.support_tickets FOR SELECT TO authenticated
  USING (
    organization_id = get_user_org(auth.uid()) 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Atualizar RLS de profiles SELECT
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
CREATE POLICY "Users can view org profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    organization_id = get_user_org(auth.uid()) 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );
