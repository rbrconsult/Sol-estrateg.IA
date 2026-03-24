import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const IMPERSONATION_KEY = 'evolve_impersonation';

interface ImpersonationInfo {
  originalAccessToken: string;
  originalRefreshToken: string;
  targetEmail: string;
  targetName: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  userRole: string | null;
  organizationId: string | null;
  isImpersonating: boolean;
  impersonationInfo: ImpersonationInfo | null;
  startImpersonation: (targetUserId: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'evolve_session_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonationInfo, setImpersonationInfo] = useState<ImpersonationInfo | null>(null);

  // Check for impersonation state on load
  useEffect(() => {
    const stored = localStorage.getItem(IMPERSONATION_KEY);
    if (stored) {
      try {
        const info = JSON.parse(stored) as ImpersonationInfo;
        setImpersonationInfo(info);
        setIsImpersonating(true);
      } catch {
        localStorage.removeItem(IMPERSONATION_KEY);
      }
    }
  }, []);

  const getSessionToken = () => {
    return localStorage.getItem(SESSION_KEY) || crypto.randomUUID();
  };

  const trackSession = async (action: string, userId: string, email: string, sessionToken: string) => {
    try {
      const response = await supabase.functions.invoke('track-session', {
        body: { action, user_id: userId, email, session_token: sessionToken }
      });
      return response.data;
    } catch (error) {
      console.error('Error tracking session:', error);
      return null;
    }
  };

  const validateSession = useCallback(async (userId: string, sessionToken: string) => {
    try {
      const response = await supabase.functions.invoke('track-session', {
        body: { action: 'validate', user_id: userId, session_token: sessionToken }
      });
      
      // Only force logout if the response explicitly says valid=false
      // Ignore 401/error responses (e.g. during logout→login transitions)
      if (response.data && response.data.valid === false && !response.data.error) {
        toast.error('Sua sessão foi encerrada. Outro dispositivo fez login com suas credenciais.');
        await supabase.auth.signOut();
        localStorage.removeItem(SESSION_KEY);
        setUser(null);
        setSession(null);
        setUserRole(null);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      return true;
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
            fetchOrganizationId(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setOrganizationId(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
        fetchOrganizationId(session.user.id);
        // Skip session validation if impersonating
        const isImpersonatingNow = !!localStorage.getItem(IMPERSONATION_KEY);
        if (!isImpersonatingNow) {
          const sessionToken = localStorage.getItem(SESSION_KEY);
          if (sessionToken) {
            validateSession(session.user.id, sessionToken);
          }
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [validateSession]);

  // Periodic session validation (every 30 seconds) - skip during impersonation
  useEffect(() => {
    if (!user || isImpersonating) return;
    
    const sessionToken = localStorage.getItem(SESSION_KEY);
    if (!sessionToken) return;

    const interval = setInterval(() => {
      validateSession(user.id, sessionToken);
    }, 30000);

    return () => clearInterval(interval);
  }, [user, validateSession, isImpersonating]);

  // Inactivity timeout: 15 min for non-privileged users
  useEffect(() => {
    if (!user || isImpersonating || userRole === 'super_admin' || userRole === 'diretor') return;

    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes
    let timeout: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        toast.error('Sessão encerrada por inatividade (15 min).');
        const sessionToken = localStorage.getItem(SESSION_KEY);
        if (sessionToken) {
          await trackSession('logout', user.id, user.email || '', sessionToken);
        }
        localStorage.removeItem(SESSION_KEY);
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setUserRole(null);
      }, INACTIVITY_LIMIT);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer(); // start initial timer

    return () => {
      clearTimeout(timeout);
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [user, userRole, isImpersonating]);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        setUserRole('user');
      } else {
        setUserRole(data?.role || 'user');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('user');
    }
  };

  const fetchOrganizationId = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userId)
        .limit(1)
        .single();
      
      if (error) {
        console.error('Error fetching organization:', error);
        setOrganizationId(null);
      } else {
        setOrganizationId(data?.organization_id || null);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
      setOrganizationId(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data.user) {
      const sessionToken = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, sessionToken);
      await trackSession('login', data.user.id, email, sessionToken);
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    
    if (!error && data.user) {
      const sessionToken = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, sessionToken);
      await trackSession('login', data.user.id, email, sessionToken);
    }
    
    return { error };
  };

  const signOut = async () => {
    const sessionToken = localStorage.getItem(SESSION_KEY);
    if (user && sessionToken) {
      await trackSession('logout', user.id, user.email || '', sessionToken);
    }
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(IMPERSONATION_KEY);
    setIsImpersonating(false);
    setImpersonationInfo(null);
    await supabase.auth.signOut();
    setUserRole(null);
  };

  const startImpersonation = async (targetUserId: string) => {
    try {
      const currentSession = await supabase.auth.getSession();
      if (!currentSession.data.session) {
        toast.error('Sessão atual inválida');
        return;
      }

      const { data, error } = await supabase.functions.invoke('impersonate-user', {
        body: { targetUserId }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (!data?.access_token || !data?.refresh_token) {
        throw new Error('Não foi possível obter a sessão do usuário alvo');
      }

      // Store original session for restoration
      const info: ImpersonationInfo = {
        originalAccessToken: currentSession.data.session.access_token,
        originalRefreshToken: currentSession.data.session.refresh_token,
        targetEmail: data.targetEmail,
        targetName: data.targetName,
      };
      localStorage.setItem(IMPERSONATION_KEY, JSON.stringify(info));

      // Set the impersonated session using tokens from the edge function
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) {
        throw new Error('Falha ao definir sessão: ' + sessionError.message);
      }

      setIsImpersonating(true);
      setImpersonationInfo(info);
      toast.success(`Impersonando ${data.targetName || data.targetEmail}`);
      
      // Small delay to ensure session is persisted before reload
      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.href = '/';
    } catch (error: any) {
      console.error('Impersonation error:', error);
      toast.error(error.message || 'Erro ao impersonar usuário');
      localStorage.removeItem(IMPERSONATION_KEY);
    }
  };

  const stopImpersonation = async () => {
    try {
      const info = impersonationInfo;
      if (!info) {
        toast.error('Dados de impersonação não encontrados');
        return;
      }

      // Restore original admin session
      await supabase.auth.setSession({
        access_token: info.originalAccessToken,
        refresh_token: info.originalRefreshToken,
      });

      localStorage.removeItem(IMPERSONATION_KEY);
      setIsImpersonating(false);
      setImpersonationInfo(null);
      toast.success('Voltou para sua conta de administrador');
      
      // Navigate to admin
      window.location.href = '/admin';
    } catch (error: any) {
      console.error('Error stopping impersonation:', error);
      toast.error('Erro ao restaurar sessão. Faça login novamente.');
      localStorage.removeItem(IMPERSONATION_KEY);
      await supabase.auth.signOut();
      window.location.href = '/auth';
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, session, loading, signIn, signUp, signOut, userRole, organizationId,
      isImpersonating, impersonationInfo, startImpersonation, stopImpersonation
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
