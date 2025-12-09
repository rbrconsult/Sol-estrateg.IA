import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  userRole: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'evolve_session_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

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
      
      if (response.data && !response.data.valid) {
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
          }, 0);
        } else {
          setUserRole(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
        
        // Validate session on load
        const sessionToken = localStorage.getItem(SESSION_KEY);
        if (sessionToken) {
          validateSession(session.user.id, sessionToken);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [validateSession]);

  // Periodic session validation (every 30 seconds)
  useEffect(() => {
    if (!user) return;
    
    const sessionToken = localStorage.getItem(SESSION_KEY);
    if (!sessionToken) return;

    const interval = setInterval(() => {
      validateSession(user.id, sessionToken);
    }, 30000);

    return () => clearInterval(interval);
  }, [user, validateSession]);

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
    await supabase.auth.signOut();
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, userRole }}>
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
