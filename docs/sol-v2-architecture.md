# SOL v2 — Documento de Arquitetura Completa

**Atualizado:** 04/04/2026  
**Domínio:** https://sol-estrateg-ia.lovable.app  
**franquia_id:** `evolve_olimpia`  
**Supabase Project:** `xffzjdulkdgyicsllznp`  
**Make Team ID:** `1934898`

**Operação / produção:** racional de dados comerciais (comissões, RLS slug ↔ `franquia_id`, checklist de deploy Live) em **[producao-dados-comerciais-e-deploy.md](./producao-dados-comerciais-e-deploy.md)**.

---

## 1. Banco de Dados — 38 Tabelas

### 1.1 Campanhas (Make → Supabase POST direto)
| Tabela | Colunas-chave | Fonte |
|--------|--------------|-------|
| `ads_meta_campaigns_daily` | date, campaign_id, ad_id, spend, clicks, leads, cpl, roas, franquia_id | Make cenário Meta Ads |
| `ads_google_campaigns_daily` | date, campaign_id, cost, clicks, impressions, search_impression_share, franquia_id | Make cenário Google Ads |
| `analytics_ga4_daily` | date, source, medium, sessions, users, conversions, bounce_rate, franquia_id | Make cenário GA4 |
| `media_performance_daily` | date, channel, spend, leads, revenue, roas, franquia_id | Consolidação mídia |
| `whatsapp_conversations_daily` | — | Conversas WhatsApp |

### 1.2 Operacional (Make DS → Supabase via cron-sync)
| Tabela | DS Make ID | Cron | Colunas-chave |
|--------|-----------|------|--------------|
| `sol_leads_sync` | 87418 | 5min | telefone (PK), nome, status, score, temperatura, canal_origem, closer_nome, ts_cadastro, custo_total_usd |
| `sol_metricas_sync` | 87422 | 15min | key, robo, data, leads_qualificados, custo_total |
| `sol_projetos_sync` | 87423 | 15min | — |
| `sol_qualificacao_sync` | 87715 | 5min | — |
| `sol_conversions_sync` | 87775 | 5min | key, telefone, event_name, capi_sent, google_sent |

### 1.3 Configuração (Supabase ↔ Make DS — sync reverso a cada 15min)
| Tabela | DS Make ID | Tipo | Descrição |
|--------|-----------|------|-----------|
| `sol_config_sync` | 87419 | READ/WRITE | Prompts do agente, variáveis globais |
| `sol_equipe_sync` | 87420 | READ/WRITE | Vendedores, cargo, taxa_conversao, krolik_id, gestor_key |
| `sol_funis_sync` | 87421 | READ/WRITE | Etapas do funil SM |

### 1.4 Inteligência & Insights
| Tabela | Descrição |
|--------|-----------|
| `sol_insights` | Alertas/recomendações gerados por skills (severidade, tipo, acao_sugerida, expires_at) |
| `sol_metricas` | KPIs diários consolidados (leads_novos, qualificados, custos) |
| `skill_toggles` | Toggle on/off por skill_id + franquia_id |
| `organization_configs` | Configuração de parâmetros das skills (pesos, thresholds, SLAs) |

### 1.5 Plataforma / Multi-tenant
| Tabela | Descrição |
|--------|-----------|
| `organizations` | Franquias (id, name, slug, settings) |
| `organization_members` | Membros por org (user_id, role) |
| `profiles` | Perfil do usuário (full_name, email, organization_id, must_change_password) |
| `user_roles` | Papéis (super_admin, admin, diretor, gerente, closer, user) |
| `user_sessions` | Sessões ativas (hash token, is_active) |
| `user_module_permissions` | Permissões por módulo por usuário |
| `access_logs` | Log de login (action, ip, user_agent) |

### 1.6 Suporte & Comunicação
| Tabela | Descrição |
|--------|-----------|
| `support_tickets` | Chamados de suporte |
| `ticket_messages` | Mensagens dos chamados |
| `ticket_status_history` | Histórico de status dos chamados |
| `internal_messages` | Mensagens internas (broadcast, canais) |
| `report_templates` | Templates de relatórios WhatsApp (conteúdo, periodicidade, destinatário) |

### 1.7 Operacional / Automação
| Tabela | Descrição |
|--------|-----------|
| `make_heartbeat` | Heartbeat dos cenários Make (status, duration, ops_count) |
| `make_errors` | Erros de execução Make (scenario_name, error_message, status) |
| `integration_runs` | Histórico de sincronizações (rows_received, rows_upserted, errors) |

### 1.8 Legado (em migração)
| Tabela | Descrição |
|--------|-----------|
| `leads_consolidados` | Tabela legada de leads (substituída por sol_leads_sync) |
| `lead_status_history` | Histórico de mudança de status |
| `time_comercial` | Tabela legada de equipe (substituída por sol_equipe_sync) |
| `campaign_metrics` | Métricas legadas de campanhas |
| `ga4_metrics` | Métricas legadas GA4 |
| `app_settings` | Configurações globais do app |

---

## 2. Edge Functions (23 funções)

| # | Função | JWT? | Descrição |
|---|--------|------|-----------|
| 1 | `sync-make-datastores` | ✅ | Sincroniza Make DS → Supabase (fast/medium/slow groups) |
| 2 | `cron-sync` | ❌ | Orchestrador de cron jobs |
| 3 | `sol-actions` | ❌ | Ações operacionais (qualificar, desqualificar, reprocessar, transferir) |
| 4 | `sync-campaign-data` | ❌ | Sync diário Meta Ads + Google Ads + GA4 (06:00 UTC) |
| 5 | `webhook-campaign-data` | — | Recebe webhooks de sessões GA4 |
| 6 | `sync-time-comercial` | — | Sync equipe comercial |
| 7 | `fetch-make-data` | ❌ | Fetch genérico de dados do Make |
| 8 | `fetch-make-errors` | ❌ | Busca erros dos cenários Make |
| 9 | `fetch-make-heartbeat` | ❌ | Busca heartbeat dos cenários |
| 10 | `fetch-make-comercial` | — | Dados comerciais do Make |
| 11 | `generate-report` | — | Gera relatórios com variáveis dinâmicas |
| 12 | `generate-skill` | ✅ | Pipeline dual IA (GPT-4o + Claude Sonnet) para gerar blueprints de skills |
| 13 | `executive-summary` | — | Resumo executivo com IA |
| 14 | `skill-golden-hour` | — | Detecta leads sem contato em 5min → insere insight + webhook Make |
| 15 | `manage-users` | ❌ | CRUD de usuários (criar, editar, deletar) |
| 16 | `impersonate-user` | ❌ | Impersonar usuário (super_admin only) |
| 17 | `make-action` | ❌ | Proxy para ações no Make |
| 18 | `track-session` | ❌ | Rastreia sessões de usuário |
| 19 | `auth-email-hook` | ❌ | Hook de email customizado (templates HTML) |
| 20 | `turnstile-verify` | — | Verifica Cloudflare Turnstile captcha |
| 21 | `notify-ticket-whatsapp` | ❌ | Notifica novo chamado via WhatsApp |
| 22 | `send-whatsapp-alert` | ❌ | Envia alertas genéricos via WhatsApp |
| 23 | `sync-make-datastores` | — | (listado acima) |

---

## 3. Cron Jobs (pg_cron + pg_net)

| Job | Cron Expression | Frequência | Group | Tabelas Sincronizadas |
|-----|----------------|-----------|-------|----------------------|
| `sync-make-fast` | `*/5 * * * *` | **5 min** | `fast` | sol_leads_sync (87418), sol_qualificacao_sync (87715), sol_conversions_sync (87775) |
| `sync-make-medium` | `*/15 * * * *` | **15 min** | `medium` | sol_metricas_sync (87422), sol_projetos_sync (87423) |
| `sync-make-slow` | `0 * * * *` | **1 hora** | `slow` | sol_config_sync (87419), sol_equipe_sync (87420), sol_funis_sync (87421) |
| `sync-campaigns` | `0 6 * * *` | **Diário 06h UTC** | — | ads_meta, ads_google, analytics_ga4 |

### Fluxo de Sincronização
```
pg_cron → net.http_post → Edge Function sync-make-datastores
  → GET https://us2.make.com/api/v2/data-stores/{DS_ID}/data?teamId=1934898
  → Paginação (100/página)
  → Mapeamento camelCase → snake_case
  → Objetos vazios {} → null
  → UPSERT em batches de 100
  → Registro em integration_runs
```

---

## 4. Webhooks v2 (Lovable → Make)

| Ação | Webhook | Payload Principal |
|------|---------|-------------------|
| Qualificar Lead | `hook.us2.make.com/oxaip1d1...` | telefone, nome, score, temperatura, chatId, contactId, closerSmId, closerKrolikId |
| Desqualificar Lead | `hook.us2.make.com/joonk1hj...` | telefone, chatId, contactId, motivo |
| Reprocessar Lead | `hook.us2.make.com/m6zaweont...` | telefone |
| Transferir Closer | `hook.us2.make.com/xwxjtzfj4...` | telefone, nome, score, chatId, contactId, closerSmId, closerKrolikId |

**⚠️ Mapeamento obrigatório:** `chat_id` → `chatId`, `contact_id` → `contactId` (snake_case → camelCase)

---

## 5. Secrets Configurados (24)

| Secret | Uso |
|--------|-----|
| `MAKE_API_KEY` | API Make.com (sync DS) |
| `MAKE_TEAM_ID` | Team ID Make (1934898) |
| `MAKE_DATASTORE_ID` | DS principal |
| `MAKE_COMERCIAL_DATASTORE_ID` | DS comercial |
| `OPENAI_API_KEY` | GPT-4o (generate-skill, executive-summary) |
| `ANTHROPIC_API_KEY` | Claude Sonnet (revisão de skills) |
| `LOVABLE_API_KEY` | Lovable AI models |
| `META_ACCESS_TOKEN` | Meta Marketing API |
| `GOOGLE_ADS_CLIENT_ID` | Google Ads OAuth |
| `GOOGLE_ADS_CLIENT_SECRET` | Google Ads OAuth |
| `GOOGLE_ADS_REFRESH_TOKEN` | Google Ads OAuth |
| `GOOGLE_API_KEY` | Google APIs |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Service account key |
| `GOOGLE_PRIVATE_KEY` | Chave privada Google |
| `GOOGLE_SHEET_ID` | Planilha Google |
| `SUPABASE_URL` | URL do projeto |
| `SUPABASE_ANON_KEY` | Chave pública |
| `SUPABASE_PUBLISHABLE_KEY` | Chave publicável |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypass RLS (formato sb_secret_) |
| `SUPABASE_DB_URL` | Conexão direta DB |
| `WEBHOOK_SECRET` | Validação webhooks |
| `TURNSTILE_SITE_KEY` | Captcha frontend |
| `TURNSTILE_SECRET_KEY` | Captcha backend |

---

## 6. Páginas e Rotas

| # | Rota | Nome | Tabelas |
|---|------|------|---------|
| 1 | `/` | Dashboard Principal | sol_leads_sync, sol_equipe_sync |
| 2 | `/pipeline` | Pipeline (Kanban) | sol_leads_sync |
| 3 | `/solar/prevenda` | Pré-Venda SDR | sol_leads_sync, sol_qualificacao_sync, sol_equipe_sync |
| 4 | `/solar/comercial` | Comercial Closers | sol_leads_sync, sol_projetos_sync, sol_equipe_sync |
| 5 | `/qualificacao` | Qualificar Leads | sol_leads_sync → webhook Make |
| 6 | `/desqualificar` | Desqualificar Leads | sol_leads_sync → webhook Make |
| 7 | `/reprocessamento` | Reprocessar Leads | sol_leads_sync → webhook Make |
| 8 | `/selecao` | Seleção de Leads | sol_leads_sync |
| 9 | `/campanhas` | Visão Geral Campanhas | ads_meta + ads_google |
| 10 | `/campanhas/meta` | Meta Ads | ads_meta_campaigns_daily |
| 11 | `/campanhas/google` | Google Ads | ads_google_campaigns_daily |
| 12 | `/campanhas/site` | GA4 Analytics | analytics_ga4_daily |
| 13 | `/campanhas/whatsapp` | WhatsApp Agent | sol_metricas_sync, sol_leads_sync |
| 14 | `/campanhas/funil` | Funil Consolidado | sol_leads_sync + projetos + equipe + conversions + funis |
| 15 | `/insights` | Skills & IA | skill_toggles, sol_insights, organization_configs |
| 16 | `/robo-sol` | Robô SOL | sol_leads_sync, sol_metricas |
| 17 | `/robo-fup-frio` | FUP Frio | sol_leads_sync (fup_count, respondeu) |
| 18 | `/monitoramento` | Monitoramento Make | make_heartbeat, make_errors |
| 19 | `/chamados` | Chamados Suporte | support_tickets, ticket_messages |
| 20 | `/reports` | Relatórios WhatsApp | report_templates |
| 21 | `/admin` | Painel Admin | Todas as tabelas (super_admin only) |
| 22 | `/admin/config` | Config SOL | sol_config_sync |
| 23 | `/admin/equipe` | Equipe Comercial | sol_equipe_sync |
| 24 | `/admin/funis` | Funis SM | sol_funis_sync |

---

## 7. Hierarquia de Permissões

| Papel | Visibilidade | Ações |
|-------|-------------|-------|
| `super_admin` | Global (todas franquias) | CRUD total + impersonate |
| `diretor` | Franquia inteira | Gerenciar skills, equipe, config |
| `gerente` | Leads da sua equipe (via gestor_key) | Gerenciar equipe subordinada |
| `closer` | Apenas leads atribuídos (closer_nome) | Visualizar + ações operacionais |
| `user` | Dados da org | Visualizar |

---

## 8. Direção dos Dados

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE DADOS SOL v2                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Make Data Stores ──pg_cron (5/15/60 min)──▶ sync-make-datastores  │
│       │                                           │                 │
│       │                                           ▼                 │
│       │                                    Supabase (sol_*_sync)    │
│       │                                           │                 │
│       │                                           ▼                 │
│       │                                    Lovable (leitura UI)     │
│       │                                                             │
│  Lovable (escrita) ──▶ Supabase (config/equipe/funis_sync)         │
│       │                       │                                     │
│       │                       ▼                                     │
│       │               sync reverso (Make cenário 15min)             │
│       │                       │                                     │
│       │                       ▼                                     │
│       │               Make Data Stores (config atualizado)          │
│       │                                                             │
│  Make Cenários ──POST direto──▶ Supabase (ads_*, analytics_*)      │
│                                                                     │
│  Lovable (ações) ──webhook──▶ Make Cenários v2                     │
│                                (Qualificar/Desqualificar/etc)       │
│                                                                     │
│  Edge Functions (Skills) ──▶ sol_insights ──▶ UI + WhatsApp        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 9. Catálogo Completo de Skills (102 skills)

### 9.1 Pré-Venda (🎯) — 18 skills

| ID | Skill | Status | Verticais | Fonte | Output |
|----|-------|--------|-----------|-------|--------|
| 1.1 | Qualificação Automática (ICP Score) | ✅ Ativo | Universal | leads_sync | Score 0-100 + temperatura |
| golden-hour | Golden Hour (5 min) | ✅ Ativo | Universal | sol_leads_sync (ts_cadastro vs ts_ultima_interacao) | Insight + WhatsApp via Make |
| 1.3 | Detector de Leads Dormentes | ✅ Ativo | Universal | leads_sync (>48h inativo) | Alerta WhatsApp |
| 1.4 | Análise Canal × Conversão | ✅ Ativo | Universal | leads_sync + ads | CPL comparativo |
| 1.5 | Gerador de Script por Persona | ✅ Ativo | Universal | config_sync + qualificacao_sync | Prompt adaptado |
| 1.6 | SLA Primeiro Contato | ✅ Ativo | Universal | leads_sync | SLA cumprido em X% |
| 1.7 | Resgate FUP Inteligente | ✅ Ativo | Universal | leads_sync (fup_count, status) | Taxa resgate |
| 1.8 | Custo IA por Qualificação | ✅ Ativo | Universal | leads_sync (custo WHERE QUALIFICADO) | Custo IA/lead |
| 1.9 | Horário Pico de Resposta | ✅ Ativo | Universal | leads_sync (hora interação) | FUP ajusta horário |
| 1.10 | OCR Conta de Luz | ✅ Ativo | ☀️ Solar | leads_sync (valor_conta_confirmado_ocr) | Valor extraído |
| 1.11 | Score Serasa/SPC | 🚀 Futuro | 🏦 Financeiro | API Serasa/SPC | Score crédito |
| 1.12 | Análise Capacidade Investimento | 🚀 Futuro | 🏦 Financeiro | leads_sync | Capacidade calculada |
| 1.13 | Detector Sazonalidade Destino | 🚀 Futuro | ✈️ Viagens | leads + calendário | Destino × época |
| 1.14 | Matching Pacote × Perfil | 🚀 Futuro | ✈️ Viagens | leads + catálogo | Top 3 pacotes |
| 1.15 | Análise de Risco (Perfil) | 🚀 Futuro | 🛡️ Seguros | leads (idade, veículo) | Score de risco |
| 1.16 | Cotação Automática | 🚀 Futuro | 🛡️ Seguros | API seguradoras | Cotação comparativa |
| 1.17 | Trial Score | 🚀 Futuro | 💪 Academia | leads (frequência trial) | % conversão |
| 1.18 | Horário Ideal de Contato | 🚀 Futuro | 💪 Academia | leads (padrão resposta) | Horário ótimo |

### 9.2 Comercial (💼) — 13 skills

| ID | Skill | Status | Verticais | Fonte | Output |
|----|-------|--------|-----------|-------|--------|
| 2.1 | Distribuição Inteligente | ✅ Ativo | Universal | equipe + leads | Roteamento dinâmico |
| 2.2 | Forecast Pipeline | ✅ Ativo | Universal | leads × taxa × valor | Receita prevista 30d |
| 2.3 | Alerta Lead Parado | ✅ Ativo | Universal | leads (>7d sem ação) | Alerta WhatsApp |
| 2.4 | Sugestão Próxima Ação | ✅ Ativo | Universal | leads (status, etapa) | Ação sugerida |
| 2.5 | Análise Motivo Perda | ✅ Ativo | Universal | projetos (lost) | Top motivos |
| 2.6 | Ranking Performance Vendedores | ✅ Ativo | Universal | leads GROUP BY vendedor | Ranking |
| 2.7 | Coach de Vendas | ✅ Ativo | Universal | leads (resumo_conversa) | Feedback |
| 2.8 | Gerador de Proposta | ✅ Ativo | Universal | leads + catálogo | Proposta |
| 2.9 | Alerta Risco de Perda | ✅ Ativo | Universal | leads (>21d qualificado) | Alerta diretoria |
| 2.10 | Comissão Automática | ✅ Ativo | Universal | projetos × equipe | Comissão calculada |
| 2.11 | Upsell de Experiências | 🚀 Futuro | ✈️ Viagens | reservas + catálogo | Sugestão add-on |
| 2.12 | Cross-sell Coberturas | 🚀 Futuro | 🛡️ Seguros | apólice + perfil | Sugestão cobertura |
| 2.13 | Upgrade de Plano | 🚀 Futuro | 💪 Academia | frequência + plano | Sugestão upgrade |

### 9.3 Campanhas & Marketing (📢) — 10 skills

| ID | Skill | Status | Fonte | Output |
|----|-------|--------|-------|--------|
| 3.1 | CPL por Plataforma | ✅ Ativo | ads_meta + ads_google + leads | CPL por canal |
| 3.2 | ROAS Real | ✅ Ativo | ads (spend) + projetos (GANHO) | ROAS por plataforma |
| 3.3 | Alerta Campanha Sem Leads | ✅ Ativo | ads (spend > X, leads = 0) | Alerta desperdício |
| 3.4 | Criativo Exausto | ✅ Ativo | ads_meta (CTR trend 3d) | Trocar criativo |
| 3.5 | Público Saturado | ✅ Ativo | ads_meta (frequency > 5) | Expandir público |
| 3.6 | Canal Mais Eficiente | ✅ Ativo | ads + leads | Recomendação budget |
| 3.7 | Volume de Busca (Market Intel) | ✅ Ativo | Keyword Planner API | Volume mensal |
| 3.8 | Benchmark CPC | ✅ Ativo | Keyword Planner + ads_google | CPC comparativo |
| 3.9 | Market Share Buscas | ✅ Ativo | Google Ads (impression_share) | % market share |
| 3.10 | Sazonalidade | ✅ Ativo | Keyword Planner (12m) | Curva sazonal |

### 9.4 Site & Conversão (🌐) — 10 skills

| ID | Skill | Status | Fonte | Output |
|----|-------|--------|-------|--------|
| 4.1 | Taxa Conversão LP | ✅ Ativo | analytics_ga4_daily | % conversão LP |
| 4.2 | Funil Site | ✅ Ativo | analytics_ga4_daily (eventos) | Funil drop-off |
| 4.3 | Fonte × Conversão | ✅ Ativo | analytics_ga4 GROUP BY source | Conversão por fonte |
| 4.4 | Cidade × Lead | ✅ Ativo | analytics_ga4 GROUP BY city | Mapa geográfico |
| 4.5 | Device Performance | ✅ Ativo | analytics_ga4 GROUP BY device | Insight responsividade |
| 4.6 | Horário Pico Site | ✅ Ativo | analytics_ga4 GROUP BY hour | Recomendação agenda |
| 4.7 | Bounce Rate por Fonte | ✅ Ativo | analytics_ga4 (bounce_rate) | Diagnóstico por fonte |
| 4.8 | Tempo no Site | ✅ Ativo | analytics_ga4 (duration) | Tempo × conversão |
| 4.9 | Página de Saída | ✅ Ativo | analytics_ga4 (exit pages) | Sugestão UX |
| 4.10 | A/B Testing Sugestão | ✅ Ativo | analytics_ga4 + ads | Recomendação A/B |

### 9.5 Financeiro & ROI (💰) — 13 skills

| ID | Skill | Status | Verticais | Fonte | Output |
|----|-------|--------|-----------|-------|--------|
| 5.1 | CAC Real | ✅ Ativo | Universal | ads + custo_ia + fixos | CAC por contrato |
| 5.2 | Custo IA Total | ✅ Ativo | Universal | leads (SUM custo_total_usd) | Custo mensal IA |
| 5.3 | Custo por Etapa do Funil | ✅ Ativo | Universal | ads + leads + projetos | Custo por etapa |
| 5.4 | Ticket Médio Real | ✅ Ativo | Universal | projetos WHERE GANHO | Ticket médio |
| 5.5 | Payback de Campanha | ✅ Ativo | Universal | ads vs receita | Dias para payback |
| 5.6 | Projeção Receita | ✅ Ativo | Universal | leads × taxa × ticket | Receita projetada |
| 5.7 | Margem por Projeto | ✅ Ativo | Universal | projetos (valor - custo) | % margem |
| 5.8 | Custo Operacional/Lead | ✅ Ativo | Universal | custo_ia + Make + infra | Custo unitário |
| 5.9 | LTV Estimado | 🚀 Futuro | Universal | projetos (recorrência) | LTV estimado |
| 5.10 | Alerta Budget | ✅ Ativo | Universal | ads (spend vs orçamento) | Alerta budget |
| 5.11 | Sinistralidade por Carteira | 🚀 Futuro | 🛡️ Seguros | apólices + sinistros | Índice |
| 5.12 | Churn Prediction | 🚀 Futuro | 💪 Academia | check-ins + plano | Risco churn |
| 5.13 | Receita Recorrente (MRR) | 🚀 Futuro | 💪 Academia | planos × valor | MRR + trend |

### 9.6 Operacional & Monitoramento (⚙️) — 11 skills

| ID | Skill | Status | Fonte | Output |
|----|-------|--------|-------|--------|
| 6.1 | Heartbeat Cenários | ✅ Ativo | make_heartbeat | Status cenários |
| 6.2 | Alerta DLQ | ✅ Ativo | Make API (DLQ) | Alerta DLQ |
| 6.3 | Consumo de Operações | ✅ Ativo | Make API (ops) | Consumo ops |
| 6.4 | Sanitização Automática | ✅ Ativo | leads_sync (validação) | Leads corrigidos |
| 6.5 | Sync Status | ✅ Ativo | integration_runs | Status sync |
| 6.6 | Token Expiration | ✅ Ativo | auth + OAuth | Alerta expiração |
| 6.7 | Volume Make vs Budget | ✅ Ativo | Make API | Otimização |
| 6.8 | Duplicata de Lead | ✅ Ativo | leads (telefone dup) | Dedup |
| 6.9 | FUP Esgotado Alert | ✅ Ativo | leads (fup_count >= max) | Sugestão desqualificar |
| 6.10 | Custo Infra por Lead | ✅ Ativo | Make ops + infra / leads | Custo unitário |
| 6.11 | Relatórios Automáticos WhatsApp | ✅ Ativo | report_templates + leads + campaign | Relatório WhatsApp |

### 9.7 Inteligência de Mercado (📊) — 10 skills

| ID | Skill | Status | Fonte | Output |
|----|-------|--------|-------|--------|
| 7.1 | Volume de Busca Mensal | ✅ Ativo | Keyword Planner API | Volume mensal |
| 7.2 | CPC Benchmark | ✅ Ativo | Keyword Planner | CPC comparativo |
| 7.3 | Concorrência | ✅ Ativo | Auction Insights | Mapa concorrência |
| 7.4 | Sazonalidade | ✅ Ativo | Keyword Planner (12m) | Curva sazonal |
| 7.5 | Market Share Local | ✅ Ativo | impression_share | % market share |
| 7.6 | Oportunidade de Budget | ✅ Ativo | budget_lost | Recomendação invest |
| 7.7 | Ranking vs Concorrência | ✅ Ativo | rank_lost | Ação otimização |
| 7.8 | Tendência do Setor | ✅ Ativo | Google Trends API | Tendência anual |
| 7.9 | Preço Médio Mercado | ✅ Ativo | Web scraping | Competitividade |
| 7.10 | Demanda Reprimida | ✅ Ativo | Keyword + GA4 | TAM estimado |

### 9.8 WhatsApp & Comunicação (💬) — 10 skills

| ID | Skill | Status | Fonte | Output |
|----|-------|--------|-------|--------|
| 8.1 | Resumo Diário | ✅ Ativo | leads + metricas | Resumo WhatsApp |
| 8.2 | Alerta Lead Qualificado | ✅ Ativo | Transfer Closer | Notificação real-time |
| 8.3 | Insight Semanal | ✅ Ativo | Todos + ads | Report semanal |
| 8.4 | Alerta Pipeline Parado | ✅ Ativo | leads (>7d qualificado) | Alerta gestão |
| 8.5 | Alerta Campanha | ✅ Ativo | ads_meta + ads_google | Alerta campanha |
| 8.6 | Report On-Demand | ✅ Ativo | Todos | Report on-demand |
| 8.7 | Coach WhatsApp | ✅ Ativo | resumo_conversa | Sugestão de venda |
| 8.8 | Newsletter Automática | ✅ Ativo | config + leads | Comunicação |
| 8.9 | Notificação Contrato Fechado | ✅ Ativo | projetos (won) | 🏆 WhatsApp equipe |
| 8.10 | Inbox Lovable | ✅ Ativo | sol_insights | Feed de insights |

### 9.9 Equipe & Gestão (👥) — 10 skills

| ID | Skill | Status | Fonte | Output |
|----|-------|--------|-------|--------|
| 9.1 | Round-Robin Inteligente | ✅ Ativo | equipe (ativo, leads_hoje) | Distribuição balanceada |
| 9.2 | Golden Hour Routing | ✅ Ativo | equipe (horario_pico) | Roteamento dinâmico |
| 9.3 | Sobrecarga Alert | ✅ Ativo | leads GROUP BY vendedor | Alerta sobrecarga |
| 9.4 | Performance Semanal | ✅ Ativo | leads + projetos | Ranking semanal |
| 9.5 | Meta vs Realizado | ✅ Ativo | equipe (meta) vs projetos | % da meta |
| 9.6 | Ativar/Desativar Vendedor | ✅ Ativo | equipe_sync (toggle) | Toggle instantâneo |
| 9.7 | Treinamento Sugerido | ✅ Ativo | leads (motivo perda) | Sugestão treinamento |
| 9.8 | Horário Produtivo | ✅ Ativo | leads (ts por vendedor) | Mapa produtividade |
| 9.9 | Férias/Ausência | ✅ Ativo | equipe (toggle) | Redistribuição auto |
| 9.10 | NPS Lead/Cliente | ✅ Ativo | pesquisa pós-atendimento | NPS por vendedor |

### 9.10 Pós-Venda (🔄) — 12 skills

| ID | Skill | Status | Verticais | Fonte | Output |
|----|-------|--------|-----------|-------|--------|
| 10.1 | Tracking Homologação | ✅ Ativo | ☀️ Solar | sol_projetos_sync | Status por etapa |
| 10.2 | Alerta Instalação | ✅ Ativo | ☀️ Solar | sol_projetos_sync (instalacao) | Agenda instalação |
| 10.3 | Geração Monitoramento | 🚀 Futuro | ☀️ Solar | Integração inversor | % geração vs esperado |
| 10.4 | Tempo por Etapa Pós-Venda | ✅ Ativo | Universal | projetos (ts por etapa) | SLA pós-venda |
| 10.5 | Indicação Automática | ✅ Ativo | Universal | projetos (GANHO > X meses) | Solicitação indicação |
| 10.6 | Review Google | ✅ Ativo | Universal | Pós-entrega | Solicitação review |
| 10.7 | Upsell Automático | ✅ Ativo | Universal | projetos + comportamento | Sugestão upsell |
| 10.8 | Feedback Pós-Viagem | 🚀 Futuro | ✈️ Viagens | reservas (retorno) | NPS + feedback |
| 10.9 | Próxima Viagem Sugerida | 🚀 Futuro | ✈️ Viagens | histórico + perfil | Sugestão destino |
| 10.10 | Renovação Automática | 🚀 Futuro | 🛡️ Seguros | apólices (vencimento) | Alerta renovação |
| 10.11 | Reativação de Alunos | 🚀 Futuro | 💪 Academia | cancelamentos | Campanha reativação |
| 10.12 | Aniversário / Marcos | 🚀 Futuro | 💪 Academia | cadastro + check-ins | Mensagem personalizada |

---

## 10. Pipeline Dual de IA (generate-skill)

```
Estágio 1: OpenAI GPT-4o → Gera blueprint JSON da skill
    ↓
Estágio 2: Claude Sonnet 4 → Revisa como "Diretor de Operações"
    ↓
Output: Blueprint validado com score 1-10 + review notes
```

**Wizard de Criação (6 perguntas):**
1. Dor resolvida (operacional/comercial)
2. Momento do fluxo (pré-venda → pós-venda)
3. Nível de autonomia (decisão automática vs recomendação)
4. Integração de sistemas (leitura/escrita)
5. Impacto esperado
6. Forma de envio e periodicidade

---

## 11. Arquitetura de Execução Híbrida das Skills

```
Análise/Detecção: Edge Functions (Supabase pg_cron)
    ↓ Resultado
    ├── sol_insights (persistência)
    ├── Dashboard (visualização)
    └── Webhook → Make → WhatsApp (ação externa)
```

**Exemplo: Golden Hour**
1. `skill-golden-hour` executa via pg_cron
2. Busca leads com `ts_cadastro > 5min` e `ts_ultima_interacao = null`
3. Insere alerta em `sol_insights` (severidade: critico/alerta)
4. (Opcional) Dispara webhook para Make → WhatsApp do closer

---

## 12. Verticais Suportadas

| Vertical | Emoji | Skills Ativas | Skills Futuras |
|----------|-------|--------------|----------------|
| Universal | 🌐 | ~80 | — |
| Solar | ☀️ | 3 | 1 |
| Financeiro | 🏦 | 0 | 2 |
| Viagens | ✈️ | 0 | 4 |
| Seguros | 🛡️ | 0 | 3 |
| Academia | 💪 | 0 | 5 |

---

## 13. Roteiro VPS Migration

A migração para infraestrutura VPS própria está planejada para suportar 13.000+ leads:

1. **VPS Setup** — Node.js + PostgreSQL + Redis
2. **Webhook Receiver** — Substitui Edge Functions com Express/Fastify
3. **Cron Daemon** — node-cron substitui pg_cron
4. **Database Migration** — pg_dump → pg_restore das 38 tabelas
5. **Make Redirect** — Webhooks apontam para VPS
6. **SDK Adapter** — Supabase-js → pg direto ou Prisma
7. **Auth Migration** — JWT próprio ou manter Supabase Auth
8. **CDN/Static** — Vercel/Cloudflare para frontend
9. **Monitoring** — PM2 + Grafana + alertas
10. **Cutover** — DNS switch + validação

**Documento detalhado para configuração:** Exportar este arquivo + `docs/SOL_v2_Documento_Mestre.md` para o consultor VPS.

---

*Documento gerado automaticamente — SOL v2 Plataforma Scale*
