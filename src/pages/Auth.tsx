import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { TurnstileWidget } from '@/components/TurnstileWidget';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Turnstile state
  const [turnstileSiteKey, setTurnstileSiteKey] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/selecao');
    }
  }, [user, authLoading, navigate]);

  // Fetch Turnstile site key
  useEffect(() => {
    const fetchSiteKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('turnstile-verify', {
          method: 'GET',
        });
        if (data?.siteKey) {
          setTurnstileSiteKey(data.siteKey);
        }
      } catch (err) {
        console.warn('Turnstile não disponível:', err);
      }
    };
    fetchSiteKey();
  }, []);

  const validateInputs = () => {
    try {
      emailSchema.parse(email);
    } catch {
      toast.error('Email inválido');
      return false;
    }
    try {
      passwordSchema.parse(password);
    } catch {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return false;
    }
    return true;
  };

  const verifyTurnstile = async (): Promise<boolean> => {
    if (!turnstileSiteKey || !turnstileToken) {
      if (turnstileSiteKey) {
        toast.error('Por favor, complete a verificação de segurança.');
        return false;
      }
      // If no site key loaded, skip verification gracefully
      return true;
    }

    try {
      const { data, error } = await supabase.functions.invoke('turnstile-verify', {
        body: { token: turnstileToken },
      });
      if (error || !data?.success) {
        toast.error('Verificação de segurança falhou. Tente novamente.');
        setTurnstileToken(null);
        return false;
      }
      return true;
    } catch {
      toast.error('Erro na verificação de segurança.');
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);

    const verified = await verifyTurnstile();
    if (!verified) {
      setLoading(false);
      return;
    }

    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Credenciais inválidas. Verifique email e senha.');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Email não confirmado. Verifique sua caixa de entrada.');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Login realizado com sucesso!');
      navigate('/');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(resetEmail);
    } catch {
      toast.error('Email inválido');
      return;
    }

    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setForgotPassword(false);
      setResetEmail('');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <Card className="w-full max-w-md border-border/50 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">S</span>
            </div>
            <span className="text-2xl font-bold">Sol Estrateg.IA</span>
          </div>
          <CardTitle className="text-xl">
            {forgotPassword ? 'Recuperar Senha' : 'Acesso ao Dashboard'}
          </CardTitle>
          <CardDescription>
            {forgotPassword
              ? 'Digite seu email para receber o link de recuperação'
              : 'Entre com suas credenciais para acessar o sistema'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {forgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={resetLoading}>
                {resetLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Link de Recuperação'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setForgotPassword(false)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Login
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {turnstileSiteKey && (
                <TurnstileWidget
                  siteKey={turnstileSiteKey}
                  onVerify={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => setTurnstileToken(null)}
                  onUnsupported={() => {
                    // Turnstile doesn't work on this domain — disable requirement
                    setTurnstileSiteKey(null);
                  }}
                  theme="light"
                />
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || (!!turnstileSiteKey && !turnstileToken)}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setForgotPassword(true)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
