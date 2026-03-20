# PLANO DE DISASTER RECOVERY — SOL ESTRATEG.IA

**Data:** 2026-03-20  
**Status:** Ativo  
**Responsável:** RBR Consult

---

## PARTE 1 — LISTA EXATA DE ATIVOS PARA EXPORTAR

### 1.1 Código-Fonte (via GitHub)

| # | Arquivo/Diretório | Tipo |
|---|---|---|
| 1 | `src/` (todo o diretório) | Frontend React — 90+ componentes, 30+ páginas, hooks, contexts |
| 2 | `supabase/functions/auth-email-hook/index.ts` | Edge Function — Hook de emails de auth |
| 3 | `supabase/functions/cron-sync/index.ts` | Edge Function — Sync automático multi-tenant |
| 4 | `supabase/functions/executive-summary/index.ts` | Edge Function — Resumo IA via Gemini |
| 5 | `supabase/functions/fetch-make-comercial/index.ts` | Edge Function — DS Comercial 84404 |
| 6 | `supabase/functions/fetch-make-data/index.ts` | Edge Function — DS SOL 64798 |
| 7 | `supabase/functions/fetch-make-errors/index.ts` | Edge Function — Erros Make |
| 8 | `supabase/functions/fetch-make-heartbeat/index.ts` | Edge Function — Heartbeat Make |
| 9 | `supabase/functions/fetch-sheets/index.ts` | Edge Function — Google Sheets (legado) |
| 10 | `supabase/functions/impersonate-user/index.ts` | Edge Function — Impersonation |
| 11 | `supabase/functions/make-action/index.ts` | Edge Function — Ações no Make.com |
| 12 | `supabase/functions/manage-users/index.ts` | Edge Function — CRUD de usuários |
| 13 | `supabase/functions/notify-ticket-whatsapp/index.ts` | Edge Function — Notificação WA |
| 14 | `supabase/functions/send-whatsapp-alert/index.ts` | Edge Function — Alertas WA |
| 15 | `supabase/functions/track-session/index.ts` | Edge Function — Sessões |
| 16 | `supabase/functions/turnstile-verify/index.ts` | Edge Function — Anti-bot |
| 17 | `supabase/functions/whatsapp-proxy/index.ts` | Edge Function — Proxy WA |
| 18 | `supabase/functions/whatsapp-webhook/index.ts` | Edge Function — Webhook WA |
| 19 | `supabase/functions/_shared/email-templates/*.tsx` | 6 templates de email (signup, recovery, invite, magic-link, reauthentication, email-change) |
| 20 | `supabase/config.toml` | Config das Edge Functions (verify_jwt) |
| 21 | `package.json` + `bun.lock` | Dependências do projeto |
| 22 | `tailwind.config.ts` + `postcss.config.js` | Config de estilo |
| 23 | `vite.config.ts` + `tsconfig*.json` | Config de build |
| 24 | `index.html` | Entry point |
| 25 | `docs/inventario-tecnico-sol.md` | Inventário técnico |

### 1.2 Tabelas do Banco de Dados (15 tabelas)

| # | Tabela | Registros | Criticidade | Regenerável? |
|---|---|---|---|---|
| 1 | `organizations` | 2 | 🔴 Crítica | ❌ Não |
| 2 | `organization_configs` | 31 | 🔴 Crítica | ❌ Não — contém credenciais Make per-filial |
| 3 | `organization_members` | 2 | 🔴 Crítica | ❌ Não |
| 4 | `profiles` | 2 | 🔴 Crítica | ❌ Não |
| 5 | `user_roles` | 2 | 🔴 Crítica | ❌ Não |
| 6 | `user_module_permissions` | ? | 🔴 Crítica | ❌ Não |
| 7 | `app_settings` | ? | 🟡 Operacional | ❌ Não |
| 8 | `leads_consolidados` | 0 (test env) | 🟡 Estratégica | 🟡 Parcial — re-sincronizável do Make |
| 9 | `lead_status_history` | 0 (test env) | 🟡 Histórica | ❌ Não |
| 10 | `support_tickets` | 19 | 🟡 Operacional | ❌ Não |
| 11 | `ticket_messages` | 12 | 🟡 Operacional | ❌ Não |
| 12 | `ticket_status_history` | 20 | 🟡 Histórica | ❌ Não |
| 13 | `access_logs` | 236 | 🟢 Auditoria | ❌ Não |
| 14 | `make_heartbeat` | 6.429 | 🟢 Transitória | ♻️ Sim |
| 15 | `make_errors` | 243 | 🟢 Transitória | ♻️ Sim |
| 16 | `user_sessions` | 189 | 🟢 Dispensável | ♻️ Dispensável |

### 1.3 Schema do Banco

| # | Item | Quantidade |
|---|---|---|
| 1 | Database Functions | 7 (has_role, get_user_org, hash_session_token, is_session_valid, invalidate_other_sessions, handle_new_user, update_updated_at_column) |
| 2 | Triggers | 5 no schema public (on_auth_user_created, update_leads_consolidados_updated_at, update_organization_configs_updated_at, update_profiles_updated_at, update_support_tickets_updated_at, update_user_module_permissions_updated_at) |
| 3 | RLS Policies | ~25 policies em 15 tabelas |
| 4 | Enums | 4 (app_role, ticket_category, ticket_priority, ticket_status) |
| 5 | Cron Jobs | 1 (sync-make-data-every-5min) |

### 1.4 Secrets (17)

| # | Secret | Onde obter se precisar recriar |
|---|---|---|
| 1 | `SUPABASE_URL` | Auto-provisionado pelo novo Supabase |
| 2 | `SUPABASE_ANON_KEY` | Auto-provisionado |
| 3 | `SUPABASE_SERVICE_ROLE_KEY` | Auto-provisionado |
| 4 | `SUPABASE_DB_URL` | Auto-provisionado |
| 5 | `SUPABASE_PUBLISHABLE_KEY` | Auto-provisionado |
| 6 | `MAKE_API_KEY` | Make.com → Profile → API Access |
| 7 | `MAKE_DATASTORE_ID` | Make.com → Data Stores → DS SOL 64798 |
| 8 | `MAKE_COMERCIAL_DATASTORE_ID` | Make.com → Data Stores → DS Comercial 84404 |
| 9 | `MAKE_TEAM_ID` | Make.com → Team Settings |
| 10 | `GOOGLE_SHEET_ID` | URL da planilha (legado) |
| 11 | `GOOGLE_API_KEY` | Google Cloud Console → Credentials |
| 12 | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google Cloud Console → Service Accounts |
| 13 | `GOOGLE_SERVICE_ACCOUNT_KEY` | Google Cloud Console → Service Accounts → Keys |
| 14 | `GOOGLE_PRIVATE_KEY` | Idem (duplicata) |
| 15 | `TURNSTILE_SECRET_KEY` | Cloudflare Dashboard → Turnstile |
| 16 | `TURNSTILE_SITE_KEY` | Cloudflare Dashboard → Turnstile |
| 17 | `LOVABLE_API_KEY` | Exclusivo Lovable — substituir por API direta Google/OpenAI |

### 1.5 Storage

| # | Bucket | Conteúdo |
|---|---|---|
| 1 | `ticket-attachments` | Anexos de chamados — download manual necessário |

---

## PARTE 2 — ORDEM EXATA DE EXPORTAÇÃO

```
FASE 1 — CÓDIGO (15 min)
━━━━━━━━━━━━━━━━━━━━━━━━
□ 1.1  Conectar projeto ao GitHub (Settings → GitHub → Connect)
□ 1.2  Verificar que o push inicial incluiu todo o código
□ 1.3  Clonar o repo localmente: git clone <url>
□ 1.4  Verificar presença de supabase/functions/ no clone

FASE 2 — SCHEMA DO BANCO (10 min)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ 2.1  Exportar DB functions     → backup_db_functions.csv      ✅ FEITO
□ 2.2  Exportar triggers         → backup_db_triggers.csv       ✅ FEITO
□ 2.3  Exportar RLS policies     → backup_rls_policies.csv      ✅ FEITO
□ 2.4  Exportar enums            → backup_enums.csv             ✅ FEITO
□ 2.5  Exportar cron jobs        → ⚠️ VALIDAR MANUALMENTE (sem acesso à extensão cron)

FASE 3 — DADOS CRÍTICOS (5 min)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ 3.1  organizations             → backup_organizations.csv              ✅ FEITO (2 registros)
□ 3.2  organization_configs      → backup_organization_configs.csv       ✅ FEITO (31 registros)
□ 3.3  organization_members      → backup_organization_members.csv       ✅ FEITO (2 registros)
□ 3.4  profiles                  → backup_profiles.csv                   ✅ FEITO (2 registros)
□ 3.5  user_roles                → backup_user_roles.csv                 ✅ FEITO (2 registros)
□ 3.6  user_module_permissions   → backup_user_module_permissions.csv    ✅ FEITO
□ 3.7  app_settings              → backup_app_settings.csv               ✅ FEITO

FASE 4 — DADOS OPERACIONAIS (5 min)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ 4.1  leads_consolidados        → backup_leads_consolidados.csv         ✅ FEITO
□ 4.2  lead_status_history       → backup_lead_status_history.csv        ✅ FEITO
□ 4.3  support_tickets           → backup_support_tickets.csv            ✅ FEITO (19 registros)
□ 4.4  ticket_messages           → backup_ticket_messages.csv            ✅ FEITO (12 registros)
□ 4.5  ticket_status_history     → backup_ticket_status_history.csv      ✅ FEITO (20 registros)
□ 4.6  access_logs               → backup_access_logs.csv                ✅ FEITO (236 registros)

FASE 5 — DADOS TRANSITÓRIOS (2 min)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ 5.1  make_heartbeat            → backup_make_heartbeat.csv             ✅ FEITO (6.429 registros)
□ 5.2  make_errors               → backup_make_errors.csv                ✅ FEITO (243 registros)

FASE 6 — SECRETS (15 min — MANUAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ 6.1  Documentar MAKE_API_KEY em vault seguro
□ 6.2  Documentar MAKE_DATASTORE_ID (64798)
□ 6.3  Documentar MAKE_COMERCIAL_DATASTORE_ID (84404)
□ 6.4  Documentar MAKE_TEAM_ID
□ 6.5  Documentar GOOGLE_SERVICE_ACCOUNT_EMAIL
□ 6.6  Documentar GOOGLE_SERVICE_ACCOUNT_KEY / GOOGLE_PRIVATE_KEY
□ 6.7  Documentar GOOGLE_SHEET_ID
□ 6.8  Documentar GOOGLE_API_KEY
□ 6.9  Documentar TURNSTILE_SECRET_KEY
□ 6.10 Documentar TURNSTILE_SITE_KEY
□ 6.11 Nota: LOVABLE_API_KEY não será reutilizável — substituir por API key direta

FASE 7 — STORAGE (5 min — MANUAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ 7.1  Cloud View → Storage → ticket-attachments → Download todos os arquivos

FASE 8 — AMBIENTE LIVE (PRODUÇÃO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  Os exports acima são do ambiente TEST.
□ 8.1  Repetir Fases 3-5 selecionando "Live" no Cloud View → Run SQL
       para exportar dados de produção (que podem diferir do test)
```

---

## PARTE 3 — O QUE VOCÊ CONSEGUE EXPORTAR DIRETAMENTE PELO LOVABLE

| Item | Via Lovable | Como |
|---|---|---|
| Código-fonte completo | ✅ Sim | GitHub Connect (automático) |
| Tabelas (dados CSV) | ✅ Sim | Cloud View → Database → Export por tabela |
| Schema (functions, triggers, RLS) | ✅ Sim | Cloud View → Run SQL (queries manuais) |
| Edge Functions (código) | ✅ Sim | Estão no repo Git |
| Email templates | ✅ Sim | Estão no repo Git |
| Config.toml | ✅ Sim | Está no repo Git |
| Storage (arquivos) | ✅ Sim | Cloud View → Storage → Download |
| **Secrets (valores)** | ❌ Não | Lovable não exibe os valores — documentar manualmente |
| **Cron job definition** | ❌ Não | Não acessível via tooling — validar via Run SQL |
| **Dados do ambiente Live** | ⚠️ Parcial | Cloud View → Run SQL com "Live" selecionado |

---

## PARTE 4 — ITENS QUE PRECISAM SER VALIDADOS MANUALMENTE

| # | Item | Como validar | Status |
|---|---|---|---|
| 1 | **Trigger `on_auth_user_created`** | ✅ CONFIRMADO — trigger ativo em `auth.users` → `handle_new_user()` | ✅ Validado |
| 2 | **pg_cron job** | Cloud View → Run SQL: `SELECT * FROM cron.job;` | ⚠️ Pendente (sem acesso via psql) |
| 3 | **Dados no ambiente LIVE** | Repetir exports com Live selecionado | ⚠️ Pendente |
| 4 | **Valores dos 17 secrets** | Verificar em cada serviço externo se ainda tem os valores | ⚠️ Pendente |
| 5 | **Conteúdo do bucket ticket-attachments** | Cloud View → Storage — verificar se há arquivos | ⚠️ Pendente |
| 6 | **Make.com cenários ativos** | Make.com dashboard → listar cenários e webhooks | ⚠️ Pendente |
| 7 | **Mapeamento status_proposta numérico** | Validar no SolarMarket: 2=?, 5=? | ⚠️ Pendente |

---

## PARTE 5 — RECONSTRUÇÃO PASSO A PASSO

### Etapa 1 — Provisionar Infraestrutura (30 min)

```
□ 1. Criar conta Supabase (supabase.com) — plano Pro recomendado
□ 2. Criar novo projeto (região: South America / us-east-1)
□ 3. Anotar: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
□ 4. Habilitar extensões: pgcrypto, pg_cron, pg_net
□ 5. Provisionar hosting frontend:
     - Opção A: Vercel (recomendado — deploy automático via GitHub)
     - Opção B: Netlify
     - Opção C: Cloudflare Pages
```

### Etapa 2 — Recriar Schema do Banco (1h)

```
□ 1. Criar enums:
     CREATE TYPE app_role AS ENUM ('super_admin', 'admin', 'user');
     CREATE TYPE ticket_category AS ENUM ('bug', 'duvida', 'melhoria', 'urgencia');
     CREATE TYPE ticket_priority AS ENUM ('baixa', 'media', 'alta', 'critica');
     CREATE TYPE ticket_status AS ENUM ('aberto', 'em_andamento', 'resolvido', 'fechado', 'aguardando_usuario');

□ 2. Criar 15 tabelas (usar backup_db_functions.csv como referência para DDL)
     Ordem de criação (respeitar FKs):
     1. organizations
     2. profiles
     3. user_roles
     4. organization_members
     5. organization_configs
     6. user_module_permissions
     7. user_sessions
     8. access_logs
     9. app_settings
     10. leads_consolidados
     11. lead_status_history
     12. support_tickets
     13. ticket_messages
     14. ticket_status_history
     15. make_heartbeat
     16. make_errors

□ 3. Criar 7 database functions (copiar de backup_db_functions.csv)
□ 4. Criar 6 triggers (copiar de backup_db_triggers.csv)
□ 5. Criar ~25 RLS policies (copiar de backup_rls_policies.csv)
□ 6. Habilitar RLS em todas as tabelas
```

### Etapa 3 — Importar Dados (30 min)

```
□ 1. Importar na ordem (respeitar FKs):
     1. organizations           ← backup_organizations.csv
     2. profiles                ← backup_profiles.csv (do ambiente LIVE)
     3. user_roles              ← backup_user_roles.csv
     4. organization_members    ← backup_organization_members.csv
     5. organization_configs    ← backup_organization_configs.csv
     6. user_module_permissions ← backup_user_module_permissions.csv
     7. app_settings            ← backup_app_settings.csv
     8. leads_consolidados      ← backup_leads_consolidados.csv (LIVE)
     9. lead_status_history     ← backup_lead_status_history.csv
     10. support_tickets        ← backup_support_tickets.csv
     11. ticket_messages        ← backup_ticket_messages.csv
     12. ticket_status_history  ← backup_ticket_status_history.csv
     13. access_logs            ← backup_access_logs.csv
     14. make_heartbeat         ← backup_make_heartbeat.csv
     15. make_errors            ← backup_make_errors.csv

⚠️  ATENÇÃO: Os users de auth.users NÃO são exportáveis pelo método CSV.
     Será necessário recriar os usuários manualmente no novo Supabase e
     ajustar os UUIDs nos CSVs de profiles/user_roles/organization_members.
```

### Etapa 4 — Deploy Edge Functions (2h)

```
□ 1. Instalar Supabase CLI: npm install -g supabase
□ 2. Login: supabase login
□ 3. Link ao projeto: supabase link --project-ref <novo-project-id>
□ 4. Deploy de cada function:
     supabase functions deploy auth-email-hook
     supabase functions deploy cron-sync
     supabase functions deploy executive-summary
     supabase functions deploy fetch-make-comercial
     supabase functions deploy fetch-make-data
     supabase functions deploy fetch-make-errors
     supabase functions deploy fetch-make-heartbeat
     supabase functions deploy fetch-sheets
     supabase functions deploy impersonate-user
     supabase functions deploy make-action
     supabase functions deploy manage-users
     supabase functions deploy notify-ticket-whatsapp
     supabase functions deploy send-whatsapp-alert
     supabase functions deploy track-session
     supabase functions deploy turnstile-verify
     supabase functions deploy whatsapp-proxy
     supabase functions deploy whatsapp-webhook

□ 5. Configurar verify_jwt = false conforme supabase/config.toml
```

### Etapa 5 — Configurar Secrets no Novo Supabase (15 min)

```
□ 1. Via CLI ou Dashboard, configurar:
     supabase secrets set MAKE_API_KEY=<valor>
     supabase secrets set MAKE_DATASTORE_ID=64798
     supabase secrets set MAKE_COMERCIAL_DATASTORE_ID=84404
     supabase secrets set MAKE_TEAM_ID=<valor>
     supabase secrets set GOOGLE_SERVICE_ACCOUNT_EMAIL=<valor>
     supabase secrets set GOOGLE_SERVICE_ACCOUNT_KEY=<valor>
     supabase secrets set GOOGLE_PRIVATE_KEY=<valor>
     supabase secrets set GOOGLE_SHEET_ID=<valor>
     supabase secrets set GOOGLE_API_KEY=<valor>
     supabase secrets set TURNSTILE_SECRET_KEY=<valor>
     supabase secrets set TURNSTILE_SITE_KEY=<valor>

□ 2. Para o AI Gateway, substituir LOVABLE_API_KEY por:
     - Obter API key do Google AI Studio (aistudio.google.com)
     - Atualizar executive-summary/index.ts para usar API direta do Gemini
     - supabase secrets set GEMINI_API_KEY=<valor>
```

### Etapa 6 — Configurar Auth (30 min)

```
□ 1. Supabase Dashboard → Authentication → Settings:
     - Desativar auto-confirm email
     - Configurar redirect URLs
     - Configurar email templates (ou manter o auth-email-hook)

□ 2. Recriar usuários manualmente:
     - comercial@rbrconsult.com.br (super_admin)
     - Demais usuários conforme backup de profiles

□ 3. Configurar Cloudflare Turnstile:
     - Adicionar novo domínio autorizado no Cloudflare Dashboard
```

### Etapa 7 — Configurar Storage (10 min)

```
□ 1. Supabase Dashboard → Storage → Create bucket "ticket-attachments" (público)
□ 2. Upload dos arquivos baixados do bucket original
□ 3. Configurar RLS policies no storage (se houver)
```

### Etapa 8 — Configurar Cron Sync (15 min)

```
□ 1. Habilitar extensões pg_cron e pg_net no novo Supabase
□ 2. Executar SQL:
     SELECT cron.schedule(
       'sync-make-data-every-5min',
       '*/5 * * * *',
       $$
       SELECT net.http_post(
         url := 'https://<NOVO-PROJECT-REF>.supabase.co/functions/v1/cron-sync',
         headers := '{"Content-Type": "application/json", "Authorization": "Bearer <NOVO-ANON-KEY>"}'::jsonb,
         body := concat('{"time": "', now(), '"}')::jsonb
       ) AS request_id;
       $$
     );
```

### Etapa 9 — Deploy Frontend (30 min)

```
□ 1. No repo clonado, atualizar .env:
     VITE_SUPABASE_PROJECT_ID=<novo-project-id>
     VITE_SUPABASE_PUBLISHABLE_KEY=<novo-anon-key>
     VITE_SUPABASE_URL=https://<novo-project-ref>.supabase.co

□ 2. Instalar dependências: npm install (ou bun install)
□ 3. Build: npm run build
□ 4. Deploy:
     - Vercel: vercel --prod
     - Netlify: netlify deploy --prod
     - Ou push para GitHub com CI/CD configurado

□ 5. Configurar domínio customizado (se necessário)
□ 6. Atualizar Turnstile com novo domínio
```

### Etapa 10 — Validação (2h)

```
□ 1. Login com comercial@rbrconsult.com.br
□ 2. Verificar seleção de filial funciona
□ 3. Verificar Dashboard carrega dados
□ 4. Verificar Pipeline funciona
□ 5. Verificar Leads carrega do DS SOL
□ 6. Verificar SolarMarket/Comercial carrega do DS Comercial
□ 7. Verificar Chamados funcionam (criar, responder)
□ 8. Verificar Admin Panel (criar user, editar roles)
□ 9. Verificar Cron Sync executou (make_heartbeat atualizado)
□ 10. Verificar Operações (heartbeat + erros Make)
□ 11. Verificar WhatsApp (se Evolution API configurada)
□ 12. Atualizar webhooks no Make.com para apontar para novas Edge Functions
```

---

## PARTE 6 — O QUE MOVER IMEDIATAMENTE PARA REDUZIR DEPENDÊNCIA

| # | Ação | Esforço | Impacto |
|---|---|---|---|
| 1 | **Conectar ao GitHub** | 5 min | 🔴 Máximo — código-fonte salvo fora do Lovable |
| 2 | **Exportar CSVs das tabelas críticas** | 10 min | 🔴 Máximo — dados recuperáveis |
| 3 | **Documentar secrets em vault** | 15 min | 🔴 Máximo — sem isso, reconstrução impossível |
| 4 | **Exportar schema (functions, triggers, RLS)** | 5 min | 🔴 Máximo — estrutura do banco |
| 5 | **Clonar repo localmente** | 2 min | 🟡 Alto — cópia offline do código |
| 6 | **Download do bucket ticket-attachments** | 5 min | 🟢 Baixo — apenas anexos de chamados |
| 7 | **Substituir AI Gateway por API direta Gemini** | 2h dev | 🟡 Médio — elimina dependência exclusiva Lovable |
| 8 | **Configurar CI/CD externo (GitHub Actions → Vercel)** | 30 min | 🟡 Médio — deploy automático independente |

---

## PARTE 7 — CHECKLIST OPERACIONAL DE DISASTER RECOVERY

### ✅ Pré-Desastre (Fazer HOJE)

- [x] Exportar dados de `organizations` (2 registros)
- [x] Exportar dados de `organization_configs` (31 registros — credenciais per-filial)
- [x] Exportar dados de `organization_members` (2 registros)
- [x] Exportar dados de `profiles` (2 registros)
- [x] Exportar dados de `user_roles` (2 registros)
- [x] Exportar dados de `user_module_permissions`
- [x] Exportar dados de `app_settings`
- [x] Exportar dados de `leads_consolidados`
- [x] Exportar dados de `lead_status_history`
- [x] Exportar dados de `support_tickets` + `ticket_messages` + `ticket_status_history`
- [x] Exportar dados de `access_logs`
- [x] Exportar dados de `make_heartbeat` + `make_errors`
- [x] Exportar schema: DB functions
- [x] Exportar schema: Triggers
- [x] Exportar schema: RLS Policies
- [x] Exportar schema: Enums
- [ ] **Conectar projeto ao GitHub** ← PRIORIDADE #1
- [ ] **Clonar repo localmente** após conectar
- [ ] **Documentar valores dos 17 secrets em vault seguro**
- [ ] **Exportar cron job definition** via Cloud View → Run SQL
- [ ] **Repetir exports das tabelas com ambiente LIVE selecionado**
- [ ] **Download de arquivos do bucket `ticket-attachments`**
- [ ] **Documentar Make.com: cenários ativos, IDs, webhooks por filial**

### 🔴 Pós-Desastre — Primeiras 2 Horas

- [ ] Provisionar novo projeto Supabase (Pro)
- [ ] Habilitar extensões: pgcrypto, pg_cron, pg_net
- [ ] Executar DDL: criar enums
- [ ] Executar DDL: criar 15 tabelas (na ordem de FK)
- [ ] Executar DDL: criar 7 database functions
- [ ] Executar DDL: criar 6 triggers
- [ ] Executar DDL: criar ~25 RLS policies
- [ ] Importar CSVs das tabelas críticas (organizações, profiles, roles, configs)

### 🟡 Pós-Desastre — Horas 2-6

- [ ] Instalar Supabase CLI e linkar ao novo projeto
- [ ] Deploy 17 Edge Functions via `supabase functions deploy`
- [ ] Configurar 11 secrets customizados (exceto os auto-provisionados)
- [ ] Recriar usuários no Auth (comercial@rbrconsult.com.br primeiro)
- [ ] Ajustar UUIDs nos CSVs se necessário
- [ ] Importar dados operacionais (leads, tickets, logs)

### 🟢 Pós-Desastre — Horas 6-14

- [ ] Configurar cron job para sync automático
- [ ] Atualizar .env do frontend com novas credenciais
- [ ] Deploy do frontend em Vercel/Netlify
- [ ] Configurar domínio customizado + SSL
- [ ] Atualizar Cloudflare Turnstile com novo domínio
- [ ] Recriar bucket `ticket-attachments` + upload de arquivos
- [ ] Substituir AI Gateway por API direta Gemini
- [ ] Atualizar webhooks no Make.com para novas URLs das Edge Functions
- [ ] Validação completa (10 pontos de teste)

### 📋 Pós-Recuperação

- [ ] Comunicar usuários sobre nova URL
- [ ] Monitorar cron sync por 24h
- [ ] Verificar que Make.com está enviando dados para os novos endpoints
- [ ] Configurar backup automatizado periódico (pg_dump semanal)
- [ ] Documentar nova infraestrutura no inventário técnico

---

## OBSERVAÇÕES IMPORTANTES

### ⚠️ Limitação: Usuários do Auth
Os registros de `auth.users` **não são exportáveis** via CSV padrão. Ao reconstruir:
- Os usuários precisarão ser recriados manualmente ou via API admin
- Os UUIDs serão diferentes — será necessário atualizar os CSVs de `profiles`, `user_roles` e `organization_members`
- Alternativa: usar `supabase db dump` (requer Supabase CLI com acesso ao projeto original)

### ⚠️ Ambiente Test vs Live
Os dados exportados neste backup são do ambiente **Test**. O ambiente **Live** (produção) pode ter dados diferentes. Repetir os exports selecionando "Live" no Cloud View é **obrigatório** para ter um backup completo.

### ⚠️ Secrets
Os valores dos secrets **não são visíveis** via nenhuma ferramenta do Lovable. Você precisa ter esses valores documentados em um vault seguro **antes** de precisar deles. Se não documentar hoje e o Lovable ficar indisponível, será necessário regenerar cada chave nos serviços de origem.

---

*Plano gerado em 2026-03-20. Revisar mensalmente.*
