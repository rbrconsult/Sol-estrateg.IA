# SOL v2 — DOCUMENTO MESTRE (Sessão Completa 31/03–01/04/2026)

**Org Make:** RBR Consult (6724658) | Team: 1934898
**Supabase:** xffzjdulkdgyicsllznp.supabase.co
**Franquia:** evolve_olimpia

---

# PARTE 1 — ARQUITETURA

## 1.1 Fluxo de Dados

```
Make.com (15 cenários ativos)
  ↓ grava em
DataStores Make (9 DSes SOL)
  ↓ sync automático (Edge Function sync-make-datastores, 5-15min)
Supabase (8 tabelas _sync + 3 campanhas)
  ↓ lê direto
Lovable (34 páginas)
```

## 1.2 Direção dos Dados

| Fluxo | Tabelas | Lovable |
|---|---|---|
| **Make → Supabase** (Make escreve, Lovable lê) | sol_leads_sync, sol_metricas_sync, sol_projetos_sync, sol_qualificacao_sync, sol_conversions_sync | **READ-ONLY** |
| **Supabase → Make** (Lovable escreve, Make lê) | sol_config_sync, sol_equipe_sync, sol_funis_sync | **READ + WRITE** |
| **Make direto → Supabase** (sem DS intermediário) | ads_meta_campaigns_daily, ads_google_campaigns_daily, analytics_ga4_daily | **READ-ONLY** |
| **Lovable → Make** (ações do usuário) | Webhooks (Qualificar, Desqualificar, Reprocessar, Transferir) | **POST** |

## 1.3 Sync Automático

Edge Function `sync-make-datastores` (Supabase) chama Make API a cada:
- **5 min:** sol_leads, sol_qualificacao, sol_conversions (fast)
- **15 min:** sol_metricas, sol_projetos (medium)
- **1 hora:** sol_config, sol_equipe, sol_funis (slow)

Logs em tabela `integration_runs`. NÃO usa cenário Make (desativado).

---

# PARTE 2 — DATASTORES & TABELAS

## 2.1 Mapa DS Make → Supabase

| # | DS Make | DS ID | Tabela Supabase | PK | Registros | Direção |
|---|---|---|---|---|---|---|
| 1 | sol_leads | 87418 | sol_leads_sync | telefone | 15 | Make→Supabase |
| 2 | sol_config | 87419 | sol_config_sync | key | 16 | **Supabase→Make** |
| 3 | sol_equipe | 87420 | sol_equipe_sync | key (slug) | 6 | **Supabase→Make** |
| 4 | sol_funis | 87421 | sol_funis_sync | franquia_id | 1 | **Supabase→Make** |
| 5 | sol_metricas | 87422 | sol_metricas_sync | key | 2 | Make→Supabase |
| 6 | sol_projetos | 87423 | sol_projetos_sync | key | 79 (⚠️ vazios) | Make→Supabase |
| 7 | sol_qualificacao | 87715 | sol_qualificacao_sync | telefone | 6 | Make→Supabase |
| 8 | sol_conversions | 87775 | sol_conversions_sync | key | 0 | Make→Supabase |
| 9 | sol_auth | 87324 | ❌ NÃO SYNC | — | 1 | Interno Make |
| — | — | — | ads_meta_campaigns_daily | — | — | Make direto |
| — | — | — | ads_google_campaigns_daily | — | — | Make direto |
| — | — | — | analytics_ga4_daily | — | — | Make direto |

## 2.2 sol_leads_sync — 41 campos (TABELA CENTRAL)

```sql
telefone TEXT PK, nome, email, cidade, 
status TEXT, -- TRAFEGO_PAGO|EM_QUALIFICACAO|QUALIFICADO|DESQUALIFICADO|GANHO|PERDIDO|FOLLOW_UP
score TEXT, temperatura TEXT, -- FRIO|MORNO|QUENTE
canal_origem TEXT, -- GOOGLE_ADS|META_ADS|INBOUND_WHATSAPP|SITE
franquia_id TEXT, project_id TEXT, identificador TEXT,
chat_id TEXT, contact_id TEXT,
transferido_comercial BOOLEAN, total_mensagens_ia INTEGER,
resumo_conversa TEXT, resumo_qualificacao TEXT,
valor_conta TEXT, tipo_imovel TEXT, tipo_telhado TEXT,
acrescimo_carga TEXT, prazo_decisao TEXT, forma_pagamento TEXT,
preferencia_contato TEXT, closer_nome TEXT, closer_sm_id TEXT,
etapa_funil TEXT, qualificado_por TEXT,
aguardando_conta_luz BOOLEAN, valor_conta_confirmado_ocr TEXT,
custo_openai NUMERIC, custo_elevenlabs NUMERIC, custo_total_usd NUMERIC,
total_audios_enviados INTEGER,
ts_cadastro TEXT, ts_ultima_interacao TEXT, ts_qualificado TEXT,
ts_transferido TEXT, ts_desqualificado TEXT, ts_pedido_conta_luz TEXT,
fup_followup_count INTEGER, ts_ultimo_fup TEXT, synced_at TIMESTAMPTZ
```

## 2.3 sol_config_sync — 16 registros (EDITÁVEL)

| Key | Tipo | Conteúdo |
|---|---|---|
| system_prompt_sdr | Prompt | Prompt principal Agent SOL |
| prompt_pre_qualificacao | Prompt | Regras qualificação |
| prompt_fup_frio | Prompt | Prompt FUP personalizado |
| prompt_newsletter | Prompt | Prompt email marketing |
| roleta_counter | Counter | counter: 9 (round-robin, READ-ONLY) |
| variaveis_globais | JSON | SM etapas, Krolik config, OpenAI models, ElevenLabs, notificações |
| sm_usuarios | JSON | 6 usuários SM |
| fup_frio_0 a fup_frio_8 | Template | 9 templates FUP |

## 2.4 sol_equipe_sync — 6 membros (EDITÁVEL)

| Slug | Nome | Cargo | SM ID | Krolik Ativo |
|---|---|---|---|---|
| evolve_olimpia_vitoria_coelho | Vitória Coelho | closer | 19015 | ✅ |
| evolve_olimpia_danieli_nicasso | Danieli Nicasso | closer | 17170 | ✅ |
| evolve_olimpia_devisson_apolinario | Devisson Apolinário | closer | 23012 | ❌ |
| evolve_olimpia_gabriel_ferrari | Gabriel Ferrari | diretor | 3766 | ❌ |
| evolve_olimpia_vinicius_selane | Vinícius Selane | diretor | 4938 | ❌ |
| evolve_olimpia_guilherme_aguiar | Guilherme Aguiar | gerente | 19422 | ❌ |

## 2.5 sol_funis_sync — 37 etapas SM

Funil: Processo Geral (ID 19994), Robô SDR: 11995

## 2.6 sol_metricas_sync — métricas diárias por robô

## 2.7 sol_projetos_sync — 79 registros ⚠️ VAZIOS (bug cenários SM)

Filtrar WHERE project_id IS NOT NULL.

## 2.8 sol_qualificacao_sync — dados de qualificação por lead

Campo `acao`: continuar, qualificar, desqualificar, transferir

## 2.9 sol_conversions_sync — CAPI/Google Offline (vazio)

---

# PARTE 3 — CAMPO valor_conta ≠ valor_proposta

- `valor_conta` = quanto o lead paga de luz (pré-venda)
- `valor_proposta` = quanto custa o sistema solar (comercial, de sol_projetos)
- NUNCA usar valor_conta como receita

---

# PARTE 4 — CENÁRIOS MAKE (15 ativos)

1. WhatsApp Inbound → sol_leads
2. Agent WhatsApp → sol_leads + sol_qualificacao
3. Capture Google+Site → sol_leads + sol_metricas
4. Capture Meta Ads → sol_leads + sol_metricas
5. Qualificar Lead → sol_leads
6. Transfer Closer → sol_leads + sol_config
7. Desqualificar Lead → sol_leads
8. Reprocessar Lead → sol_leads
9. FUP Frio → sol_leads
10. Sync SM Ganho/Perdido → sol_leads + sol_projetos + sol_conversions
11. Sync SM Mudança Etapa → sol_leads + sol_projetos
12. Sync SM Proposta → sol_projetos
13. CAPI Meta Events → sol_conversions
14. Google Offline → sol_conversions
15. Auth Global → sol_auth

---

# PARTE 5 — WEBHOOKS (Lovable → Make)

| Ação | URL |
|---|---|
| Qualificar | oxaip1d1e946l7hmtyhpr1aic626o92m |
| Desqualificar | joonk1hj7ubqeogtq1hxwymncruxslbl |
| Reprocessar | m6zaweontguh6vqsfvid3g73bxb1qg44 |
| Transferir | xwxjtzfj4zul7aye2pxrv2e4glmpgwg7 |

snake_case no Supabase → camelCase no webhook Make

---

# PARTE 6 — HOOKS v2

```typescript
useSolLeads(statusFilter?)     // sol_leads_sync
useSolEquipe()                 // sol_equipe_sync
useSolMetricas()               // sol_metricas_sync
useSolProjetos()               // sol_projetos_sync
useSolQualificacao()           // sol_qualificacao_sync
useSolConversions()            // sol_conversions_sync
useSolConfig()                 // sol_config_sync
useSolFunis()                  // sol_funis_sync
```

---

# PARTE 7 — ROLES & PERMISSÕES

| Role | Visão |
|---|---|
| super_admin | TUDO |
| diretor | Estratégico + gerencial + operacional |
| gerente | Gerencial + operacional |
| closer | Dashboard simplificado + seus leads |

---

# PARTE 8 — MENU POR FLUXO

1. PRÉ-VENDA: Dashboard, Conferência, Leads, Robô SOL, Robô FUP Frio, Funil
2. COMERCIAL: Painel Comercial, Pipeline, Forecast, Contratos, Performance, Comissões
3. PÓS-VENDA: Jornada Lead, SLA Monitor, Follow-up Analista
4. INTELIGÊNCIA: BI, SOL Insights, Reports WhatsApp
5. CAMPANHAS: Visão Geral, Meta, Google, Site, WhatsApp, Ads, Mídia×Receita, GA4
6. OPERACIONAL: Chamados, Monitor Make, Sanitização
7. ADMIN: Geral, Config Filial, Config SOL, Equipe SOL, Funis SM
8. SOLAR MARKET: Pré-Venda SM, Comercial SM, Vendedores SM

---

# PARTE 9 — TABELA → PÁGINAS

| Tabela | Páginas |
|---|---|
| sol_leads_sync | /dashboard, /conferencia, /leads, /robo-sol, /robo-fup-frio, /pipeline, /painel-comercial, /forecast, /contratos-fechados, /performance, /comissoes, /campanhas/whatsapp, /campanhas/funil, /bi, /followup, /jornada-lead, /sla, /sol/insights, /sanitizacao, /solarmarket/* |
| sol_equipe_sync | /dashboard, /pipeline, /painel-comercial, /campanhas/funil, /solarmarket/*, /admin/equipe |
| sol_metricas_sync | /dashboard, /conferencia, /robo-sol, /robo-fup-frio, /campanhas/whatsapp, /bi, /sol/insights |
| sol_projetos_sync | /pipeline, /painel-comercial, /forecast, /contratos-fechados, /comissoes, /campanhas/funil, /bi, /jornada-lead, /solarmarket/comercial |
| sol_qualificacao_sync | /dashboard, /leads, /solarmarket/prevenda, /sol/insights, /pipeline |
| sol_conversions_sync | /campanhas/meta, /campanhas/google, /campanhas/funil |
| sol_config_sync | /admin/config |
| sol_funis_sync | /campanhas/funil, /admin/funis |
| ads_meta_campaigns_daily | /campanhas, /campanhas/meta, /campanhas/ads, /campanhas/receita |
| ads_google_campaigns_daily | /campanhas, /campanhas/google, /campanhas/ads, /campanhas/receita |
| analytics_ga4_daily | /campanhas/site, /campanhas/ga4 |

---

# PARTE 10 — BUGS & CORREÇÕES

## 🔴 Críticos
- B1: sol_projetos vazios → filtrar WHERE project_id IS NOT NULL
- B2: Forecast sem propostas → "Nenhuma proposta ativa"
- B3: Contratos dados falsos → verificar COUNT(GANHO)
- B4: BI usando valor_conta como receita → ERRADO
- B5: Jornada Rafa "sem interação" → tem 11 msgs
- B6: Top 5 Módulos "Unknown" → corrigir make_heartbeat
- B7: /robo-sol não funciona
- B8: SOL Console pesado → DELETAR /ajuda

## 🟡 Dados
- D1: valor_conta ≠ valor_proposta
- D2: Custos em USD
- D3: Custos em sol_leads E sol_metricas (não é duplicata)
- D4: Campo "acao" em qualificacao
- D5: "Sem responsável" é ERRO

## 🟢 UX
- U1-U6: Polish visual

## ⚫ DELETAR
- /ajuda, /qualificacao, /desqualificar, /reprocessamento (se inline OK)

---

# PARTE 11 — PRIORIDADE

1. BUGS B1-B8
2. DADOS D1-D5
3. MENU por fluxo
4. ROLES
5. ESTRUTURA
6. UX
7. DELETAR páginas
