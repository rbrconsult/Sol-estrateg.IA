# INVENTÁRIO TÉCNICO OPERACIONAL — SOL ESTRATEG.IA

**Data de geração:** 2026-03-20
**Gerado por:** Auditoria de continuidade operacional

---

## 1. IDENTIFICAÇÃO GERAL DO PROJETO

| Item | Valor |
|------|-------|
| **Nome** | Sol Estrateg.IA |
| **Descrição** | Plataforma de BI, CRM e Inteligência Comercial para o setor de energia solar |
| **Desenvolvido por** | RBR Consult |
| **URL Preview (staging)** | `https://id-preview--ef3bfa4b-8d71-49e4-8cda-f0097ab70309.lovable.app` |
| **URL Publicada (produção)** | `https://rbrenergy.lovable.app` |
| **Ambientes** | Test (desenvolvimento/staging) e Live (produção) |
| **Stack** | React 18 + Vite + TypeScript + Tailwind CSS |
| **Backend** | Lovable Cloud (Supabase) — Edge Functions (Deno) |
| **Supabase Project ID** | `xffzjdulkdgyicsllznp` |
| **Arquitetura** | Multi-tenant (filiais), SPA com sidebar, auth nativo, cron sync automático |
| **Tema** | Dark mode padrão, alternável via ThemeToggle |

### Serviços Conectados
1. **Lovable Cloud (Supabase)** — BD, auth, edge functions, storage
2. **Make.com** — Automação, Data Stores (DS 64798 SOL, DS 84404 Comercial)
3. **Google Sheets API** — Legado (fetch-sheets), em processo de migração para DS
4. **Lovable AI Gateway** — Resumo executivo via Gemini 2.5 Flash Lite
5. **Cloudflare Turnstile** — Anti-bot no login
6. **Evolution API (WhatsApp)** — Webhooks de mensagens e notificações

---

## 2. BANCO DE DADOS E PERSISTÊNCIA

### 2.1 Tabelas

| Tabela | Finalidade | Colunas-chave | Classificação |
|--------|-----------|---------------|---------------|
| `profiles` | Perfil de usuário (nome, email, telefone, org) | id (FK auth.users), email, full_name, organization_id, onboarding_completed | **Crítica** |
| `user_roles` | Roles de acesso (super_admin, admin, user) | user_id, role (enum app_role) | **Crítica** |
| `user_sessions` | Controle de sessões ativas | user_id, session_token (SHA-256), is_active, ip_address, last_activity | **Crítica** |
| `organizations` | Cadastro de filiais/tenants | id, name, slug, settings (JSONB) | **Crítica** |
| `organization_members` | Vinculação user↔org com role | organization_id, user_id, role | **Crítica** |
| `organization_configs` | Configurações por filial (credenciais Make, responsáveis, DS IDs) | organization_id, config_category, config_key, config_value, is_secret | **Crítica** |
| `leads_consolidados` | Leads sincronizados do Make DS SOL | telefone (chave), nome, email, cidade, status, etapa, responsavel, score, temperatura, followup_count, organization_id | **Estratégica** |
| `lead_status_history` | Histórico de mudanças de status/etapa de leads | lead_id (FK leads_consolidados), old_status, new_status, old_etapa, new_etapa | **Histórica** |
| `support_tickets` | Chamados de suporte internos | titulo, descricao, categoria (enum), prioridade (enum), status (enum), user_id, organization_id, sla_deadline | **Operacional** |
| `ticket_messages` | Mensagens dentro de chamados | ticket_id (FK support_tickets), user_id, message, source | **Operacional** |
| `ticket_status_history` | Histórico de mudanças de status de chamados | ticket_id, old_status, new_status, changed_by | **Histórica** |
| `make_heartbeat` | Logs de execução de cenários Make.com | scenario_id, scenario_name, execution_id, status, duration_seconds, started_at | **Operacional** |
| `make_errors` | Erros de execução Make.com com detalhes de módulo | execution_id, scenario_name, error_message, error_type, module_name, status | **Operacional** |
| `access_logs` | Log de auditoria (login/logout/impersonation) | user_id, email, action, ip_address, user_agent | **Segurança** |
| `user_module_permissions` | Controle de acesso granular por módulo | user_id, module_key, enabled | **Crítica** |
| `app_settings` | Configurações globais da app | key, value | **Operacional** |

### 2.2 Relacionamentos

```
auth.users(id) ──trigger──> profiles(id)
auth.users(id) ──trigger──> user_roles(user_id)
auth.users(id) ──trigger──> organization_members(user_id)
profiles.organization_id ──FK──> organizations.id
organization_members.organization_id ──FK──> organizations.id
organization_configs.organization_id ──FK──> organizations.id
leads_consolidados.organization_id ──FK──> organizations.id
lead_status_history.lead_id ──FK──> leads_consolidados.id
support_tickets.organization_id ──FK──> organizations.id
ticket_messages.ticket_id ──FK──> support_tickets.id
ticket_status_history.ticket_id ──FK──> support_tickets.id
```

### 2.3 Views
**Nenhuma view existente.**

### 2.4 Functions (Database)

| Função | Tipo | Finalidade |
|--------|------|-----------|
| `has_role(_user_id, _role)` | SECURITY DEFINER | Verifica se user tem determinada role — usada em todas as RLS |
| `get_user_org(p_user_id)` | SECURITY DEFINER | Retorna organization_id do user — usada em RLS multi-tenant |
| `hash_session_token(token)` | SECURITY DEFINER | SHA-256 do token de sessão |
| `is_session_valid(p_user_id, p_session_token)` | SECURITY DEFINER | Valida sessão ativa |
| `invalidate_other_sessions(p_user_id, p_current_session)` | SECURITY DEFINER | Derruba outras sessões do mesmo user |
| `handle_new_user()` | TRIGGER FUNCTION | Auto-cria profile, role (user) e org_member na org padrão |
| `update_updated_at_column()` | TRIGGER FUNCTION | Atualiza campo updated_at automaticamente |

### 2.5 Triggers
**Nota:** O schema reporta "no triggers" atualmente, mas a função `handle_new_user()` é um trigger function que **deveria** estar vinculada a `auth.users ON INSERT`. **Validar manualmente se o trigger está ativo.**

### 2.6 RLS (Row-Level Security)
Todas as 15 tabelas têm RLS habilitado. Padrão de isolamento:
- **Multi-tenant:** `organization_id = get_user_org(auth.uid())` para dados de org
- **Super admin bypass:** `has_role(auth.uid(), 'super_admin')` em todas as tabelas
- **Owner-based:** tickets, perfis acessíveis apenas pelo próprio user
- **Admin-only:** `make_heartbeat`, `make_errors`, `access_logs` — apenas super_admin

### 2.7 Storage Buckets

| Bucket | Público | Uso |
|--------|---------|-----|
| `ticket-attachments` | Sim | Anexos de chamados de suporte |

**Tipos de arquivo:** Não há restrição explícita configurada. Presumivelmente imagens e documentos.

### 2.8 Classificação de Dados

| Criticidade | Tabelas |
|-------------|---------|
| **Críticas (sem elas a plataforma não opera)** | profiles, user_roles, organizations, organization_members, organization_configs, user_module_permissions |
| **Estratégicas (core do negócio)** | leads_consolidados, lead_status_history |
| **Operacionais (suporte ao dia-a-dia)** | support_tickets, ticket_messages, ticket_status_history, make_heartbeat, make_errors, app_settings |
| **Segurança/Auditoria** | access_logs, user_sessions |
| **Transitórias (re-sincronizáveis)** | make_heartbeat, make_errors (regeneráveis do Make.com) |

---

## 3. AUTENTICAÇÃO E CONTROLE DE ACESSO

### 3.1 Implementação
- **Auth nativo** via Supabase Auth (email/senha)
- **Signup com verificação de email** (sem auto-confirm)
- **Recovery de senha** via email → rota `/reset-password`
- **Anti-bot:** Cloudflare Turnstile no formulário de login (verificação server-side via edge function `turnstile-verify`)
- **Session tracking:** Token UUID por sessão, hash SHA-256, validação a cada 30s
- **Inatividade:** Logout automático após 15 min para users (não super_admins)
- **Single session:** Login invalida todas as sessões anteriores do mesmo user

### 3.2 Roles (enum `app_role`)

| Role | Descrição | Acesso |
|------|-----------|--------|
| `super_admin` | Administrador master | Todas as filiais, admin panel, impersonation, sem timeout |
| `admin` | Admin de filial | Visão da própria organização |
| `user` | Usuário regular | Visão da própria organização, módulos permitidos |

### 3.3 Conta Master
`comercial@rbrconsult.com.br` — Super Admin da Matriz (org `00000000-0000-0000-0000-000000000001` "RBR Consult")

### 3.4 Rotas e Proteção

| Rota | Componente | Proteção | Módulo Guard |
|------|-----------|----------|-------------|
| `/auth` | Auth | Pública | — |
| `/reset-password` | ResetPassword | Pública | — |
| `/` | → Redirect `/selecao` | ProtectedRoute | — |
| `/selecao` | Selecao | ProtectedRoute | — |
| `/conferencia` | Conferencia | ProtectedRoute | `conferencia` |
| `/dashboard` | Index | ProtectedRoute | `dashboard` |
| `/pipeline` | PipelinePage | ProtectedRoute | `pipeline` |
| `/forecast` | Forecast | ProtectedRoute | `pipeline` |
| `/performance` | Performance | ProtectedRoute | `vendedores` |
| `/comissoes` | Comissoes | ProtectedRoute | `vendedores` |
| `/chamados` | Chamados | ProtectedRoute | `chamados` |
| `/bi` | BI | ProtectedRoute | `bi` |
| `/operacoes` | Operacoes | ProtectedRoute | `monitoramento` |
| `/sanitizacao` | Sanitizacao | ProtectedRoute | `monitoramento` |
| `/reprocessamento` | Reprocessamento | ProtectedRoute | `monitoramento` |
| `/ads-performance` | AdsPerformance | ProtectedRoute | `bi` |
| `/robo-sol` | RoboSol | ProtectedRoute | `bi` |
| `/robo-fup-frio` | RoboFupFrio | ProtectedRoute | `bi` |
| `/jornada-lead` | JornadaLead | ProtectedRoute | `bi` |
| `/ajuda` | Ajuda | ProtectedRoute | `ajuda` |
| `/leads` | Leads | ProtectedRoute | — |
| `/admin` | Admin | ProtectedRoute | Super Admin check |
| `/admin/filial/:orgId` | OrgConfigPage | ProtectedRoute | Super Admin check |
| `/roadmap` | Roadmap | ProtectedRoute | — |
| `/painel-comercial` | PainelComercial | ProtectedRoute | — |
| `/reports` | Reports | ProtectedRoute | — |
| `/sla` | SLAMonitor | ProtectedRoute | — |
| `/midia` | MidiaReceita | ProtectedRoute | — |
| `/followup` | AnalistaFollowup | ProtectedRoute | — |
| `/solarmarket/prevenda` | PreVenda | ProtectedRoute | — |
| `/solarmarket/comercial` | Comercial | ProtectedRoute | — |
| `/solarmarket/vendedores` | VendedorPerformance | ProtectedRoute | — |

### 3.5 Impersonation
Super Admins podem assumir a identidade de qualquer user via edge function `impersonate-user` (magic link server-side). Sessão original é preservada em localStorage e restaurável.

### 3.6 Variáveis de Ambiente e Secrets

| Secret | Uso | Criticidade |
|--------|-----|-------------|
| `SUPABASE_URL` | URL do projeto Supabase | Infraestrutura |
| `SUPABASE_ANON_KEY` | Chave pública Supabase | Infraestrutura |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave admin Supabase (server-side) | **CRÍTICA** |
| `SUPABASE_DB_URL` | Connection string do PostgreSQL | **CRÍTICA** |
| `SUPABASE_PUBLISHABLE_KEY` | Alias da anon key | Infraestrutura |
| `MAKE_API_KEY` | Token API Make.com (global fallback) | **CRÍTICA** |
| `MAKE_DATASTORE_ID` | DS SOL 64798 (global fallback) | Operacional |
| `MAKE_COMERCIAL_DATASTORE_ID` | DS Comercial 84404 (global fallback) | Operacional |
| `MAKE_TEAM_ID` | Team ID Make.com (global fallback) | Operacional |
| `GOOGLE_SHEET_ID` | ID da planilha Google Sheets (legado) | Em depreciação |
| `GOOGLE_API_KEY` | Chave da API Google | Em depreciação |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Email da service account Google | Em depreciação |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Chave privada da service account | Em depreciação |
| `GOOGLE_PRIVATE_KEY` | Chave privada (duplicata) | Em depreciação |
| `TURNSTILE_SECRET_KEY` | Secret Cloudflare Turnstile (server) | Segurança |
| `TURNSTILE_SITE_KEY` | Site key Cloudflare Turnstile (client) | Segurança |
| `LOVABLE_API_KEY` | Chave do AI Gateway Lovable | IA |

**Nota:** Credenciais per-filial são armazenadas em `organization_configs` (config_key: `make_api_key`, `ds_comercial`, `ds_leads_site_geral`, `make_team_id`).

---

## 4. FRONT-END E ESTRUTURA FUNCIONAL

### 4.1 Providers (App.tsx)
```
ThemeProvider → QueryClientProvider → AuthProvider → OrgFilterProvider → GlobalFilterProvider → Lead360Provider → TooltipProvider → BrowserRouter
```

### 4.2 Layouts
| Layout | Uso |
|--------|-----|
| `MainLayout` | Layout principal com Sidebar (todas as rotas exceto auth/solar) |
| `SolarLayout` | Layout específico para páginas `/solarmarket/*` |

### 4.3 Grupos de Menu (Sidebar)

| Grupo | Páginas |
|-------|---------|
| **Pré-venda** | Dashboard (Conferência), Pipeline, Leads, Robô SOL, FUP Frio |
| **Comercial** | Painel Comercial, Propostas (Forecast), Contratos (Dashboard), Vendedores (Performance), Comissões |
| **Inteligência** | BI, Analista Follow-up, Jornada Lead, Monitor de SLA, Ads Performance, Mídia × Receita |
| **Insights** | Reports |
| **Operacional** | Chamados, Monitor (Operações), Reprocessar, Sanitização |

### 4.4 Páginas Críticas para Operação Comercial
1. `/conferencia` — Dashboard de pré-venda com funis e KPIs
2. `/pipeline` — Pipeline visual (Kanban-style)
3. `/dashboard` — Contratos/Dashboard comercial principal
4. `/performance` — Performance de vendedores
5. `/comissoes` — Cálculo de comissões
6. `/leads` — Gestão de leads consolidados

### 4.5 Páginas que Dependem do Supabase (diretamente)
- `/leads` → `leads_consolidados`
- `/chamados` → `support_tickets`, `ticket_messages`, `ticket_status_history`
- `/admin` → `user_roles`, `profiles`, `organizations`, `organization_members`, `organization_configs`
- `/operacoes` → `make_heartbeat`, `make_errors`

### 4.6 Páginas que Dependem de APIs Externas
- `/conferencia`, `/dashboard`, `/pipeline`, `/forecast`, `/performance`, `/comissoes` → Google Sheets (via `fetch-sheets`) + Make DS SOL (via `fetch-make-data`)
- `/solarmarket/*` → Make DS Comercial 84404 (via `fetch-make-comercial`)
- `/operacoes` → Make.com API (cenários, logs)
- `/robo-sol`, `/robo-fup-frio` → Make DS SOL 64798 (via `fetch-make-data`)
- `/reports` → Lovable AI Gateway (resumo executivo)

### 4.7 Formulários Existentes
- Login/Signup (`Auth.tsx`)
- Reset password (`ResetPassword.tsx`)
- Ticket creation (`TicketForm.tsx`)
- Ticket messages
- Admin: criação de filial (FranchiseWizard), gestão de users, configurações de org

### 4.8 Dashboards Existentes
- ExecutiveKPIs, ExecutiveSummary (IA), HealthScore, StrategicAlerts
- SalesFunnel, PowerFunnel, StrategicFunnel, StatusFunnel
- VendedorRanking, VendedorTable, VendedorFunnel
- LeadsTrendsChart, PerformanceChart, TrendsChart
- GoalProgress, StageProgress
- KanbanBoard (pipeline visual)
- HeartbeatGrid, HeartbeatSummary (monitor operacional)
- ErrorDashboard (erros Make)
- SLAMetrics, SLATimer
- ComercialResponsavelStats, DateFilter
- ScorePorOrigem, TemperaturaPorEtapa, GargalosLeads

---

## 5. LÓGICA DE NEGÓCIO

### 5.1 Regras de Negócio Implementadas

**Mapeamento de Status de Propostas (`dataAdapter.ts`):**
- `ganho/fechado/vencido` → `Ganho`
- `perdido/cancelado` → `Perdido`
- Qualquer outro → `Aberto`
- **Nota:** DS Comercial usa status numéricos (2, 5) — mapeamento pendente de validação

**Cálculo de Probabilidade:**
- Ganho = 100%, Perdido = 0%
- Aberto base = 50%
- Score SOL > 0 → `min(100, score * 10)`
- QUENTE → `max(prob, 70)`, FRIO → `min(prob, 30)`

**Cálculo de Comissão:**
- Calculada sobre `valorGanho` (propostas com status=Ganho)
- Filtrada por vendedor/representante

**Normalização de Telefone:**
- Remove não-dígitos
- Se 12+ dígitos começando com `55`, remove código de país

**Detecção de Robô (Make DS):**
- `followup_count >= 1` → FUP Frio
- Caso contrário → SOL SDR

**Detecção de Resposta (Make DS):**
- Heurística multi-sinal: data_resposta, flag respondeu, histórico com tipo=recebida, status WHATSAPP/QUALIFICADO

### 5.2 KPIs Calculados
- Taxa de Conversão = ganhos / total
- Ticket Médio = valor_pipeline / total_propostas
- Ciclo de Proposta = avg(data_proposta - data_projeto)
- Receita Prevista = Σ(valor × probabilidade) para abertos
- Health Score = calculado no front
- Potência Total (kWp)

### 5.3 Filtros e Segmentações
- **OrgFilter** — Filial ou Global (super admins)
- **GlobalFilter** — Filtros de data, vendedor, etapa, origem (cross-page)
- **Lead360** — Visão 360° do lead via drawer

### 5.4 Sincronização Automática (cron-sync)
- pg_cron a cada 5 minutos
- Itera por todas as organizações
- Para cada org: busca DS SOL → upsert `leads_consolidados` + busca cenários Make → upsert `make_heartbeat`
- Chave de deduplicação: `telefone,organization_id` (leads) e `execution_id` (heartbeat)

### 5.5 Enriquecimento de Dados
Pipeline atual: `Google Sheets (fetch-sheets)` → `adaptSheetData()` → enriquece com `Make DS SOL (fetch-make-data)` → `Proposal[]`
**Em migração para:** `DS Comercial 84404` como fonte primária

---

## 6. INTEGRAÇÕES EXTERNAS

### 6.1 Edge Functions (17 total)

| Edge Function | API Externa | Finalidade | Auth | Impacto se parar |
|---------------|------------|-----------|------|-----------------|
| `fetch-sheets` | Google Sheets API | Busca propostas da planilha | Service Account JWT | **ALTO** — Dashboard, Pipeline, Comissões sem dados |
| `fetch-make-data` | Make.com Data Store (DS 64798) | Busca leads do DS SOL | Token API | **ALTO** — Enriquecimento de leads falha |
| `fetch-make-comercial` | Make.com Data Store (DS 84404) | Busca dados comerciais SM | Token API (per-org) | **ALTO** — Solar Market sem dados |
| `fetch-make-errors` | Make.com API (scenario logs) | Busca erros de execução | Token API | MÉDIO — Monitor sem erros |
| `fetch-make-heartbeat` | Make.com API (scenario logs) | Busca heartbeat de cenários | Token API | MÉDIO — Monitor sem heartbeat |
| `cron-sync` | Make.com Data Store + API | Sync automático multi-tenant | Service Role + Token API | **CRÍTICO** — Dados param de atualizar |
| `make-action` | Make.com API | Executa ações (start/stop cenários) | Token API + super_admin | MÉDIO — Reprocessamento manual |
| `executive-summary` | Lovable AI Gateway (Gemini) | Gera resumo executivo via IA | LOVABLE_API_KEY | BAIXO — Resumo IA indisponível |
| `track-session` | — (interno) | Gerencia sessões ativas | Bearer JWT | **ALTO** — Sessões não rastreadas |
| `impersonate-user` | — (interno) | Impersonation de users | Service Role + super_admin | BAIXO — Funcionalidade admin |
| `manage-users` | — (interno) | CRUD de usuários | Service Role + super_admin | MÉDIO — Gestão de users |
| `turnstile-verify` | Cloudflare Turnstile | Verificação anti-bot | TURNSTILE_SECRET_KEY | BAIXO — Degrada graciosamente |
| `notify-ticket-whatsapp` | Evolution API (WhatsApp) | Notifica sobre tickets via WA | Bearer JWT | BAIXO — Notificações fora |
| `send-whatsapp-alert` | Evolution API (WhatsApp) | Envia alertas via WA | Bearer JWT | BAIXO — Alertas fora |
| `whatsapp-webhook` | — (recebe de Evolution API) | Recebe mensagens WA | — (webhook público) | BAIXO — Mensagens WA não processadas |
| `whatsapp-proxy` | Evolution API | Proxy para API WA | Bearer JWT | BAIXO |
| `auth-email-hook` | — (interno) | Customiza emails de auth | — | MÉDIO — Emails com template padrão |

### 6.2 Webhooks

| Direção | Serviço | Endpoint | Finalidade |
|---------|---------|----------|-----------|
| **Recebido** | Evolution API (WhatsApp) | `whatsapp-webhook` | Mensagens WA inbound |
| **Recebido** | Make.com | (configurado externamente) | Triggers de cenários |
| **Enviado** | Make.com Data Store | via `fetch-make-*` | Consulta de dados |
| **Enviado** | Cloudflare Turnstile | via `turnstile-verify` | Validação de token |
| **Enviado** | Lovable AI Gateway | via `executive-summary` | Geração de resumo IA |

### 6.3 Variáveis por Integração

| Integração | Secrets Necessários |
|-----------|-------------------|
| **Make.com** | `MAKE_API_KEY`, `MAKE_DATASTORE_ID`, `MAKE_COMERCIAL_DATASTORE_ID`, `MAKE_TEAM_ID` + per-org em `organization_configs` |
| **Google Sheets** | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_KEY` (ou `GOOGLE_PRIVATE_KEY`), `GOOGLE_SHEET_ID` |
| **Cloudflare Turnstile** | `TURNSTILE_SECRET_KEY`, `TURNSTILE_SITE_KEY` |
| **Lovable AI** | `LOVABLE_API_KEY` |
| **Supabase** | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |

---

## 7. DEPENDÊNCIAS CRÍTICAS

### 7.1 O que depende exclusivamente do Lovable

| Componente | Detalhe |
|-----------|---------|
| **Hospedagem do frontend** | Build e deploy do React SPA |
| **Edge Functions runtime** | Deno runtime para todas as 17 edge functions |
| **Supabase (via Lovable Cloud)** | Banco de dados, auth, storage, cron jobs |
| **Domínio `rbrenergy.lovable.app`** | DNS e SSL |
| **LOVABLE_API_KEY** | Acesso ao AI Gateway para resumo executivo |
| **Deploy automático** | CI/CD do código frontend |

### 7.2 O que depende do Supabase (via Lovable Cloud)

| Componente |
|-----------|
| PostgreSQL (todas as 15 tabelas) |
| Auth (signup, login, password recovery, magic links) |
| RLS policies (toda a camada de segurança multi-tenant) |
| Edge Functions (17 funções) |
| Storage (bucket `ticket-attachments`) |
| pg_cron (sync automático a cada 5 min) |
| Database functions (has_role, get_user_org, etc.) |

### 7.3 O que depende de serviços externos

| Serviço | Componentes Afetados |
|---------|---------------------|
| **Make.com** | Toda a pipeline de dados comerciais, leads, heartbeat, erros |
| **Google Sheets** | Dashboard, Pipeline, Comissões (legado — em migração) |
| **Cloudflare** | Proteção anti-bot no login |
| **Evolution API** | Notificações WhatsApp |

### 7.4 Se o Lovable ficar indisponível

| Status | Componente |
|--------|-----------|
| ✅ **Continua funcionando** | Make.com automações (operam independentemente) |
| ✅ **Continua funcionando** | Dados no Supabase (acessíveis via conexão direta se tiver credentials) |
| ✅ **Continua funcionando** | Google Sheets (dados acessíveis diretamente) |
| ❌ **Para imediatamente** | Frontend (toda a interface web) |
| ❌ **Para imediatamente** | Edge Functions (todas as 17) |
| ❌ **Para imediatamente** | Cron sync automático |
| ❌ **Para imediatamente** | Auth (login/signup) |
| ❌ **Para imediatamente** | API calls para Make.com (via edge functions) |
| ❌ **Para imediatamente** | Resumo executivo via IA |

### 7.5 Partes mais acopladas ao Lovable
1. **Edge Functions** — 17 funções Deno específicas do Supabase/Lovable
2. **Auth** — Supabase Auth nativo com triggers e RLS
3. **Cron sync** — pg_cron no Supabase
4. **AI Gateway** — `ai.gateway.lovable.dev` exclusivo do Lovable
5. **Frontend hosting** — Sem CI/CD externo configurado

---

## 8. RECONSTRUÇÃO E MIGRAÇÃO

### 8.1 Para reconstruir o SOL fora do Lovable

**Etapa 1 — Infraestrutura Mínima:**
1. Provisionar projeto Supabase (ou PostgreSQL + auth alternativo)
2. Exportar schema completo (tabelas, functions, triggers, RLS policies, enums)
3. Exportar dados de todas as tabelas
4. Configurar Deno Deploy (ou equivalente) para Edge Functions
5. Configurar hosting para SPA React (Vercel, Netlify, Cloudflare Pages)

**Etapa 2 — Credenciais:**
- Recriar todos os 17 secrets no novo ambiente
- Migrar credentials per-org de `organization_configs`
- Configurar DNS/domínio customizado

**Etapa 3 — Edge Functions:**
- Portar 17 edge functions (são Deno puro, portáveis para Supabase self-hosted ou Deno Deploy)
- Substituir `ai.gateway.lovable.dev` por API direta do Google Gemini ou OpenAI

**Etapa 4 — Cron:**
- Reconfigurar pg_cron ou usar scheduler externo (cron + curl)

### 8.2 Ativos Indispensáveis

| Ativo | Formato | Onde está |
|-------|---------|----------|
| Código-fonte React | TypeScript/TSX | Repo Git (Lovable) |
| 17 Edge Functions | TypeScript (Deno) | `supabase/functions/` |
| Schema SQL completo | SQL DDL | Migrations Supabase |
| Dados de `organization_configs` | JSONB rows | PostgreSQL |
| Dados de `profiles` + `user_roles` + `organizations` | Rows | PostgreSQL |
| Dados de `leads_consolidados` | Rows | PostgreSQL |
| Dados de `support_tickets` + mensagens | Rows | PostgreSQL |
| Email templates | TSX | `supabase/functions/_shared/email-templates/` |

### 8.3 Tabelas Mínimas para Religar Operação

1. `organizations` (filiais)
2. `organization_configs` (credenciais Make per-org)
3. `organization_members` (vínculo user↔org)
4. `profiles` (dados de usuário)
5. `user_roles` (permissões)
6. `user_module_permissions` (módulos habilitados)
7. `leads_consolidados` (re-sincronizável, mas necessário para continuidade)

### 8.4 O que migra facilmente

| Componente | Dificuldade | Motivo |
|-----------|-------------|--------|
| Frontend React | ⭐ Fácil | SPA puro, sem dependência de framework Lovable |
| Edge Functions | ⭐ Fácil | Deno padrão, portável para qualquer Supabase |
| Schema SQL | ⭐ Fácil | DDL exportável |
| Dados PostgreSQL | ⭐ Fácil | pg_dump padrão |
| Make.com integração | ⭐ Fácil | Apenas muda URL dos edge functions nos webhooks |
| Cloudflare Turnstile | ⭐ Fácil | Trocar domínio autorizado |

### 8.5 O que exigiria retrabalho maior

| Componente | Dificuldade | Motivo |
|-----------|-------------|--------|
| AI Gateway (resumo executivo) | ⭐⭐ Médio | Trocar endpoint por API direta do Gemini/OpenAI (precisa API key própria) |
| Auth + RLS completa | ⭐⭐ Médio | Precisa recriar trigger `handle_new_user`, todas as RLS policies, e testar isolamento |
| pg_cron | ⭐⭐ Médio | Recriar job no novo Supabase ou scheduler externo |
| Domínio + SSL | ⭐ Fácil | Apontar DNS para novo hosting |
| Email templates (auth-email-hook) | ⭐⭐ Médio | Configurar hook no novo Supabase |

---

## 9. BACKUP E DISASTER RECOVERY

### 9.1 Dados que Precisam de Backup Diário

| Tabela | Razão |
|--------|-------|
| `leads_consolidados` | Core do negócio, embora re-sincronizável tem dados históricos |
| `lead_status_history` | Auditoria de mudanças — não regenerável |
| `support_tickets` + `ticket_messages` + `ticket_status_history` | Histórico de suporte |
| `profiles` + `user_roles` + `organization_members` | Identidade e permissões |
| `organizations` + `organization_configs` | Configuração de filiais e credenciais |
| `access_logs` | Logs de segurança/auditoria |
| `user_module_permissions` | Controle de acesso granular |

### 9.2 Estruturas a Exportar

- Schema SQL completo (DDL com tabelas, indexes, enums, functions, triggers, RLS policies)
- Migrations directory (`supabase/migrations/`)
- Edge Functions (`supabase/functions/`)
- Email templates (`supabase/functions/_shared/email-templates/`)
- `supabase/config.toml`
- `package.json` + `bun.lock` (dependências)

### 9.3 Configurações a Documentar

- Todos os 17 secrets e seus valores
- `organization_configs` completa (dump da tabela)
- pg_cron job definition
- Cloudflare Turnstile site key + authorized domains
- Make.com: Team IDs, Data Store IDs, Webhook URLs por filial
- DNS records do domínio customizado (se houver)

### 9.4 Pontos de Risco de Perda de Dados

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Lovable Cloud indisponível | Perda total de acesso ao BD e edge functions | Export periódico via pg_dump |
| Make.com Data Store perder dados | Leads não re-sincronizáveis | Backup do DS via API Make |
| Secrets não documentados | Impossibilidade de reconstrução | Documentar em vault seguro |
| `organization_configs` corrompida | Filiais perdem acesso a dados | Backup periódico desta tabela |
| Trigger `handle_new_user` ausente | Novos usuários sem profile/role | Verificar e documentar triggers |

### 9.5 Single Points of Failure

1. **Lovable Cloud** — toda a operação depende desta plataforma
2. **`SUPABASE_SERVICE_ROLE_KEY`** — se perdida, edge functions param
3. **`MAKE_API_KEY`** — se revogada, sync e dados comerciais param
4. **pg_cron job** — se removido, dados param de sincronizar
5. **Conta master (`comercial@rbrconsult.com.br`)** — único super_admin confirmado
6. **`organization_configs`** — centraliza todas as credenciais per-filial

---

## 10. RESUMO EXECUTIVO

### Ativos Críticos do SOL

| # | Ativo | Criticidade |
|---|-------|-------------|
| 1 | Código-fonte (React + 17 Edge Functions) | 🔴 Máxima |
| 2 | Schema SQL + RLS policies + DB functions | 🔴 Máxima |
| 3 | Dados das tabelas críticas (profiles, orgs, configs, leads) | 🔴 Máxima |
| 4 | 17 Secrets do projeto | 🔴 Máxima |
| 5 | Configurações per-filial (organization_configs) | 🔴 Máxima |
| 6 | Make.com automações e Data Stores | 🟡 Alta |
| 7 | Google Sheets (legado, em migração) | 🟢 Baixa |

### Dependências Críticas

| Dependência | Risco de Indisponibilidade |
|------------|---------------------------|
| **Lovable Cloud (Supabase)** | 🔴 ALTO — sem fallback configurado |
| **Make.com** | 🟡 MÉDIO — dados ficam estáticos mas sistema opera com cache |
| **Google Sheets** | 🟢 BAIXO — em migração, será eliminada |
| **Cloudflare** | 🟢 BAIXO — degrada graciosamente |

### Risco de Indisponibilidade
**🔴 ALTO** — A plataforma depende inteiramente do Lovable Cloud. Não há redundância, failover ou hosting alternativo configurado. Se Lovable ficar indisponível, **toda a operação para imediatamente**.

### Risco de Perda de Dados
**🟡 MÉDIO** — Os dados estão em PostgreSQL (Supabase) com backup automático do provedor, mas não há export periódico controlado pelo cliente. Dados de `leads_consolidados` são re-sincronizáveis do Make.com. Dados de auditoria e configuração **não são regeneráveis**.

### Prioridade de Backup

| Prioridade | Ação |
|-----------|------|
| 🔴 P0 | Exportar schema SQL completo (DDL + RLS + functions + triggers) |
| 🔴 P0 | Documentar todos os 17 secrets em vault seguro |
| 🔴 P0 | pg_dump de `organization_configs`, `profiles`, `user_roles`, `organizations`, `organization_members` |
| 🟡 P1 | pg_dump de `leads_consolidados`, `lead_status_history` |
| 🟡 P1 | Backup do código-fonte em repo Git externo (GitHub) |
| 🟡 P1 | pg_dump de `support_tickets` + mensagens |
| 🟢 P2 | pg_dump de `make_heartbeat`, `make_errors`, `access_logs`, `user_sessions` |

### Prioridade de Migração

| Prioridade | Ação |
|-----------|------|
| 🔴 P0 | Conectar repo ao GitHub para backup contínuo do código |
| 🔴 P0 | Exportar schema + dados críticos periodicamente |
| 🟡 P1 | Completar migração Google Sheets → DS Comercial (em andamento) |
| 🟡 P1 | Substituir AI Gateway Lovable por API direta (Gemini/OpenAI) |
| 🟢 P2 | Avaliar hosting alternativo para frontend (Vercel/Netlify) |
| 🟢 P2 | Avaliar Supabase self-hosted ou managed como fallback |

### Prioridade de Documentação

| Prioridade | Ação |
|-----------|------|
| 🔴 P0 | Documentar mapeamento completo de `organization_configs` por filial |
| 🔴 P0 | Documentar secrets e onde obtê-los se precisar recriar |
| 🔴 P0 | Documentar pg_cron job (schedule, function, parâmetros) |
| 🟡 P1 | Documentar Make.com: cenários, webhooks, Data Stores por filial |
| 🟡 P1 | Documentar fluxo de dados: DS → Edge Function → Frontend |
| 🟢 P2 | Documentar regras de negócio (status mapping, comissão, score) |

---

### LIMITAÇÕES DE VISIBILIDADE

Os seguintes itens **não são visíveis** do código e precisam ser validados manualmente:

1. **Trigger `handle_new_user`** — A função existe mas o trigger linkado a `auth.users` não aparece no schema reportado. Verificar no Cloud View.
2. **pg_cron job** — A definição do cron job (schedule, target) não é visível no código. Verificar via `SELECT * FROM cron.job`.
3. **Dados reais de `organization_configs`** — O conteúdo exato (quais filiais, quais credenciais) precisa ser consultado diretamente.
4. **Make.com cenários e webhooks** — Os cenários configurados no Make.com não são visíveis do Lovable. Verificar no dashboard Make.
5. **Evolution API (WhatsApp)** — Configuração do webhook de entrada e credenciais não documentados nos secrets visíveis.
6. **Domínio customizado** — Não há evidência de domínio customizado além de `rbrenergy.lovable.app`.
7. **Mapeamento `status_proposta` numérico** — Valores `"2"` e `"5"` encontrados no DS Comercial; mapeamento para Ganho/Perdido pendente de validação.

---

*Inventário gerado em 2026-03-20. Recomenda-se atualização trimestral.*
