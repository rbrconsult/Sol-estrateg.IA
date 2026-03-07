

# Plano: Segurança Completa de Autenticação

3 componentes: Turnstile anti-bot, Esqueci minha senha, Email templates customizados.

---

## Pré-requisito: Secrets

Os secrets `TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY` **não existem** no projeto. Serão solicitados antes da implementação.

---

## 1. Turnstile (Proteção Anti-Bot)

**Novo arquivo:** `src/components/TurnstileWidget.tsx`
- Componente que carrega o widget Cloudflare Turnstile via polling de `window.turnstile`
- Props: siteKey, onVerify, onExpire, onError, theme, size
- useRef para container e widgetId, cleanup no unmount

**Nova Edge Function:** `supabase/functions/turnstile-verify/index.ts`
- GET → retorna `{ siteKey }` do env
- POST → valida token contra `challenges.cloudflare.com/turnstile/v0/siteverify`
- CORS headers, `verify_jwt = false`

**Modificar:** `src/pages/Auth.tsx`
- Buscar siteKey via GET ao montar
- Renderizar TurnstileWidget abaixo do formulário
- Bloquear submit até token verificado
- Validar token via POST antes de signIn

**Modificar:** `supabase/config.toml` (adicionar turnstile-verify)

---

## 2. Esqueci Minha Senha

**Modificar:** `src/pages/Auth.tsx`
- Adicionar estado `forgotPassword` com fluxo de input email + botão "Esqueceu a senha?"
- Chamar `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })`
- Toast de confirmação

**Novo arquivo:** `src/pages/ResetPassword.tsx`
- Formulário Nova Senha + Confirmar Senha
- Validação: min 6 chars, senhas iguais
- `supabase.auth.updateUser({ password })`
- Redireciona para /auth após sucesso

**Modificar:** `src/App.tsx`
- Adicionar rota pública `/reset-password`

---

## 3. Email Templates Customizados

- Chamar `scaffold_auth_email_templates` para gerar os templates
- Customizar com a identidade visual do projeto:
  - Primária: `hsl(142, 76%, 36%)` → `#22c55e` (verde)
  - Texto: `hsl(222, 47%, 11%)` → navy escuro
  - Muted: `hsl(220, 9%, 46%)`
  - Font: Plus Jakarta Sans, Arial
  - Border radius: 12px
  - Nome: "SOL estrateg.IA"
  - Rodapé: "© SOL estrateg.IA — Energia inteligente para seu negócio."
  - Idioma: PT-BR
  - Logo texto estilizado no topo
- Deploy da edge function `auth-email-hook`

---

## Ordem de Execução

1. Solicitar secrets TURNSTILE_SITE_KEY e TURNSTILE_SECRET_KEY
2. Criar TurnstileWidget + Edge Function turnstile-verify
3. Modificar Auth.tsx (Turnstile + Esqueci senha)
4. Criar ResetPassword.tsx + rota no App.tsx
5. Scaffold + customizar email templates
6. Deploy auth-email-hook

