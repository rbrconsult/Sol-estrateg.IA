-- Create table to track user sessions with IP
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, session_token)
);

-- Create index for faster lookups
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view their own sessions"
ON public.user_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Super admins can view all sessions
CREATE POLICY "Super admins can view all sessions"
ON public.user_sessions
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can manage all sessions
CREATE POLICY "Super admins can manage sessions"
ON public.user_sessions
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- Users can insert their own session
CREATE POLICY "Users can insert their own session"
ON public.user_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update their own sessions"
ON public.user_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Create access logs table for IP tracking
CREATE TABLE public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  action TEXT NOT NULL, -- 'login', 'logout', 'session_invalidated'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on access_logs
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Super admins can view all access logs
CREATE POLICY "Super admins can view access logs"
ON public.access_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- System can insert access logs (via service role or authenticated users for their own)
CREATE POLICY "Users can insert their own access logs"
ON public.access_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to invalidate other sessions for a user
CREATE OR REPLACE FUNCTION public.invalidate_other_sessions(p_user_id UUID, p_current_session TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_sessions
  SET is_active = false
  WHERE user_id = p_user_id
    AND session_token != p_current_session
    AND is_active = true;
END;
$$;

-- Function to check if session is valid
CREATE OR REPLACE FUNCTION public.is_session_valid(p_user_id UUID, p_session_token TEXT)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_sessions
    WHERE user_id = p_user_id
      AND session_token = p_session_token
      AND is_active = true
  )
$$;