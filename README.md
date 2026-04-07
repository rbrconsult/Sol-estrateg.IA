# Sol Estrateg.IA

**Plataforma de BI, CRM e Inteligência Comercial para o setor solar**  
Desenvolvida por **RBR Consult**

---

## 📋 Visão Geral

Sol Estrateg.IA é uma plataforma completa que combina:
- **Camada Operacional** — gestão diária de leads, propostas e pipeline comercial em tempo real
- **Camada Estratégica (BI)** — análise de ROI, performance cross-plataforma e inteligência de dados
- **Automação** — robôs de follow-up (SOL SDR e FUP Frio) via WhatsApp integrados ao Make.com

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│   React 18 + TypeScript + Vite + Tailwind CSS       │
│   shadcn/ui • Recharts • React Query • React Router │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│               LOVABLE CLOUD (Supabase)               │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  PostgreSQL  │  │Edge Functions│  │  Storage   │  │
│  │  + pg_cron   │  │  (Deno)      │  │  (Buckets) │  │
│  └──────┬──────┘  └──────┬───────┘  └────────────┘  │
└─────────┼────────────────┼──────────────────────────┘
          │                │
┌─────────▼────────────────▼──────────────────────────┐
│              INTEGRAÇÕES EXTERNAS                    │
│  Make.com API • Google Sheets API • WhatsApp (Evolution API) │
└─────────────────────────────────────────────────────┘
```

## 🗄️ Banco de Dados

### Tabelas Principais

| Tabela | Descrição |
|---|---|
| `leads_consolidados` | Tabela central de leads sincronizada do Make Data Store |
| `lead_status_history` | Histórico de mudanças de status/etapa dos leads |
| `make_heartbeat` | Logs de execução dos cenários Make.com |
| `make_errors` | Erros e warnings dos cenários Make.com |
| `support_tickets` | Sistema de chamados internos |
| `ticket_messages` | Mensagens dos chamados |
| `ticket_status_history` | Histórico de status dos chamados |
| `profiles` | Perfis de usuários |
| `organizations` | Organizações/empresas |
| `organization_members` | Membros por organização |
| `user_roles` | Papéis de acesso (super_admin, admin, user) |
| `user_module_permissions` | Permissões por módulo |
| `user_sessions` | Sessões ativas |
| `access_logs` | Logs de acesso e auditoria |
| `app_settings` | Configurações do sistema (chave-valor) |

### Enums

- `app_role`: `super_admin` | `admin` | `user`
- `ticket_category`: `bug` | `duvida` | `melhoria` | `urgencia`
- `ticket_priority`: `baixa` | `media` | `alta` | `critica`
- `ticket_status`: `aberto` | `em_andamento` | `resolvido` | `fechado` | `aguardando_usuario`

## ⚡ Edge Functions

| Função | Descrição | Auth |
|---|---|---|
| `cron-sync` | Sincronização automática: Make Data Store → `leads_consolidados` e Make Heartbeat → `make_heartbeat` | Service Role / Anon Key |
| `fetch-make-data` | Busca registros do Make Data Store sob demanda | JWT não verificado |
| `fetch-make-errors` | Busca erros/warnings dos cenários Make e grava em `make_errors` | JWT não verificado |
| `fetch-make-heartbeat` | Busca logs de execução dos cenários Make | JWT não verificado |
| `fetch-make-comercial` | Busca dados comerciais do Make Data Store | JWT |
| `fetch-sheets` | **(Legado)** Busca dados do Google Sheets | JWT não verificado |
| `executive-summary` | Gera resumo executivo via IA (Gemini) | JWT |
| `manage-users` | CRUD de usuários (criar, deletar, reset senha) | super_admin |
| `impersonate-user` | Permite super_admin assumir sessão de outro usuário | super_admin |
| `track-session` | Rastreamento de sessões ativas | JWT não verificado |
| `make-action` | Proxy para ações no Make.com (retry/discard execuções) | JWT |
| `notify-ticket-whatsapp` | Envia notificações de chamados via WhatsApp (Evolution API) | JWT não verificado |
| `send-whatsapp-alert` | Envia alertas via WhatsApp | JWT não verificado |
| `whatsapp-proxy` | Proxy para API do WhatsApp | JWT não verificado |
| `whatsapp-webhook` | Webhook receptor de mensagens WhatsApp | JWT não verificado |
| `turnstile-verify` | Verificação Cloudflare Turnstile (anti-bot) | JWT não verificado |
| `auth-email-hook` | Hook de emails de autenticação (signup, recovery, etc.) | JWT não verificado |

## ⏰ Cron Jobs (pg_cron)

| Job | Schedule | Descrição |
|---|---|---|
| `sync-make-data-every-5min` | `*/5 * * * *` | Sincroniza Make Data Store → `leads_consolidados` e Make Heartbeat → `make_heartbeat` via `cron-sync` |

## 🔐 Secrets (Variáveis de Ambiente)

| Secret | Uso |
|---|---|
| `MAKE_API_KEY` | Autenticação na API do Make.com |
| `MAKE_DATASTORE_ID` | ID do Data Store principal (leads) |
| `MAKE_COMERCIAL_DATASTORE_ID` | ID do Data Store comercial |
| `MAKE_TEAM_ID` | ID do time no Make.com |
| `GOOGLE_SHEET_ID` | ID da planilha Google (legado) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Email da service account Google |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Chave da service account Google |
| `GOOGLE_PRIVATE_KEY` | Chave privada Google |
| `GOOGLE_API_KEY` | API Key Google |
| `TURNSTILE_SECRET_KEY` | Chave secreta Cloudflare Turnstile |
| `TURNSTILE_SITE_KEY` | Chave pública Cloudflare Turnstile |
| `LOVABLE_API_KEY` | Chave para Lovable AI Gateway |

> As variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` e `SUPABASE_PUBLISHABLE_KEY` são provisionadas automaticamente.

## 📂 Estrutura do Projeto

```
src/
├── components/
│   ├── admin/          # Painel administrativo
│   ├── ajuda/          # Central de ajuda
│   ├── chamados/       # Sistema de chamados
│   ├── conferencia/    # Dashboard de conferência
│   ├── dashboard/      # Componentes do dashboard principal
│   ├── filters/        # Filtros reutilizáveis
│   ├── heartbeat/      # Monitoramento Make
│   ├── layout/         # Layouts (MainLayout, Sidebar, SolarLayout)
│   ├── lead360/        # Drawer Lead 360°
│   ├── leads/          # Componentes de análise de leads
│   ├── make-errors/    # Dashboard de erros Make
│   ├── onboarding/     # Modal de onboarding
│   └── ui/             # shadcn/ui components
├── contexts/           # React Contexts (Lead360)
├── data/               # Adaptadores e dados mock
├── hooks/              # Custom hooks (auth, data fetching, permissions)
├── pages/              # Páginas da aplicação
│   └── solar/          # Páginas do módulo solar
├── lib/                # Utilitários (formatters, utils)
└── integrations/
    └── supabase/       # Cliente e tipos Supabase (auto-gerado)

supabase/
└── functions/          # Edge Functions (Deno)
    ├── _shared/        # Templates de email compartilhados
    ├── auth-email-hook/
    ├── cron-sync/
    ├── executive-summary/
    ├── fetch-make-comercial/
    ├── fetch-make-data/
    ├── fetch-make-errors/
    ├── fetch-make-heartbeat/
    ├── fetch-sheets/
    ├── impersonate-user/
    ├── make-action/
    ├── manage-users/
    ├── notify-ticket-whatsapp/
    ├── send-whatsapp-alert/
    ├── track-session/
    ├── turnstile-verify/
    ├── whatsapp-proxy/
    └── whatsapp-webhook/
```

## 📄 Módulos / Páginas

| Módulo | Rota | Descrição |
|---|---|---|
| Seleção | `/selecao` | Hub de navegação principal |
| Dashboard | `/` | Dashboard executivo com KPIs |
| Pipeline | `/pipeline` | Gestão visual do pipeline |
| Leads | `/leads` | Análise completa de leads |
| Conferência | `/conferencia` | Dashboard de conferência operacional |
| Painel Comercial | `/painel-comercial` | Painel comercial operacional |
| Vendedores | `/vendedores` | Performance de vendedores |
| Forecast | `/forecast` | Previsão de vendas |
| BI | `/bi` | Business Intelligence |
| Origens | `/origens` | Análise por origem/canal |
| Perdas | `/perdas` | Análise de perdas |
| Atividades | `/atividades` | Gestão de atividades |
| Operações | `/operacoes` | Monitoramento, erros Make, reprocessamento |
| Robô SOL | `/robo-sol` | Dashboard do robô SOL SDR |
| Robô FUP Frio | `/robo-fup-frio` | Dashboard do robô Follow-up Frio |
| Chamados | `/chamados` | Sistema de suporte interno |
| Admin | `/admin` | Painel administrativo |
| Ajuda | `/ajuda` | Central de ajuda |

## 🛠️ Stack Tecnológica

- **Frontend**: React 18, TypeScript, Vite 5, Tailwind CSS 3
- **UI Components**: shadcn/ui, Radix UI, Lucide Icons
- **Charts**: Recharts
- **State Management**: TanStack React Query
- **Routing**: React Router v6
- **Backend**: Lovable Cloud (Supabase) — PostgreSQL, Edge Functions (Deno), Storage
- **Automação**: Make.com (cenários + Data Stores)
- **WhatsApp**: Evolution API
- **Anti-bot**: Cloudflare Turnstile
- **IA**: Lovable AI Gateway (Google Gemini)

## 🚀 Desenvolvimento Local

```bash
# Clonar o repositório
git clone <URL_DO_REPOSITORIO>

# Instalar dependências
npm install

# Rodar o servidor de desenvolvimento
npm run dev
```

> As variáveis de ambiente Supabase são provisionadas automaticamente pelo Lovable Cloud.

## 🚀 Produção (Live): frontend + banco + funções

Alterações que mexem em **RLS**, **colunas** ou **Edge Functions** não valem só com *Publish* do app: o SQL em `supabase/migrations/` precisa ser **aplicado no projeto Supabase de produção**, e funções alteradas precisam de **redeploy**. Passo a passo e racional (comissões, slug vs `franquia_id`, checklist): **[docs/producao-dados-comerciais-e-deploy.md](./docs/producao-dados-comerciais-e-deploy.md)**.

## 📝 Licença

Projeto proprietário — **RBR Consult**. Todos os direitos reservados.
