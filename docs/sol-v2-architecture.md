# SOL v2 — Arquitetura de Dados e Páginas

**Atualizado:** 31/03/2026  
**Domínio:** https://solestrategia.com.br  
**franquia_id:** `evolve_olimpia`

---

## 1. Tabelas Oficiais (Source of Truth: Supabase)

### Campanhas (Write direto do Make)
| Tabela | Tipo | Fonte |
|--------|------|-------|
| `ads_meta_campaigns_daily` | READ | Make → Supabase direto |
| `ads_google_campaigns_daily` | READ | Make → Supabase direto |
| `analytics_ga4_daily` | READ | Make → Supabase direto |

### Operacional (Make DS → Supabase via cron-sync)
| Tabela | Tipo | DS Make ID |
|--------|------|-----------|
| `sol_leads_sync` | READ | 87418 |
| `sol_metricas_sync` | READ | 87422 |
| `sol_projetos_sync` | READ | — |
| `sol_qualificacao_sync` | READ | 87715 |
| `sol_conversions_sync` | READ | 87775 |

### Configuração (Supabase → Make DS via sync reverso)
| Tabela | Tipo | DS Make ID |
|--------|------|-----------|
| `sol_config_sync` | READ/WRITE | 87419 |
| `sol_equipe_sync` | READ/WRITE | 87420 |
| `sol_funis_sync` | READ/WRITE | 87421 |

---

## 2. Páginas e Rotas

| # | Rota | Nome | Tipo | Tabelas |
|---|------|------|------|---------|
| 1 | `/campanhas` | Dashboard Geral | READ | ads_meta + ads_google |
| 2 | `/campanhas/meta` | Meta Ads | READ | ads_meta_campaigns_daily |
| 3 | `/campanhas/google` | Google Ads | READ | ads_google_campaigns_daily |
| 4 | `/campanhas/site` | GA4 Analytics | READ | analytics_ga4_daily |
| 5 | `/campanhas/whatsapp` | WhatsApp / Agent IA | READ | sol_metricas_sync + sol_leads_sync |
| 6 | `/campanhas/funil` | Funil Lead→Venda | READ | sol_leads_sync + sol_projetos_sync + sol_equipe_sync + sol_conversions_sync + sol_funis_sync |
| 7 | `/solar/prevenda` | Pré-Venda SDR (Kanban) | READ+ACTIONS | sol_leads_sync + sol_qualificacao_sync + sol_equipe_sync |
| 8 | `/solar/comercial` | Comercial Closers | READ+ACTIONS | sol_leads_sync + sol_projetos_sync + sol_equipe_sync |
| 9 | `/admin/config` | Configurações | READ/WRITE | sol_config_sync |
| 10 | `/admin/equipe` | Equipe | READ/WRITE | sol_equipe_sync |
| 11 | `/admin/funis` | Funis SM | READ/WRITE | sol_funis_sync |

---

## 3. Webhooks v2 (Ações Lovable → Make)

| Ação | Webhook URL | Payload |
|------|-------------|---------|
| Qualificar Lead | `hook.us2.make.com/oxaip1d1...` | telefone, nome, score, temperatura, chatId, contactId, etc. |
| Desqualificar Lead | `hook.us2.make.com/joonk1hj...` | telefone, chatId, contactId, motivo |
| Reprocessar Lead | `hook.us2.make.com/m6zaweont...` | telefone |
| Transferir Closer | `hook.us2.make.com/xwxjtzfj4...` | telefone, nome, score, chatId, contactId, etc. |

**⚠️ Mapeamento:** Supabase `chat_id` → Webhook `chatId` (snake_case → camelCase)

---

## 4. Hooks Compartilhados

| Hook | Função |
|------|--------|
| `useFranquiaId` | Resolve org → franquia_id slug |
| `useSolLeadsSync` | Fetch sol_leads_sync com filtros |
| `useSolSyncTables` | Fetch de todas as tabelas sync |
| `useSolActionsV2` | Mutations para webhooks v2 |

---

## 5. Filtros Globais

Todas as queries respeitam:
- `franquia_id` (derivado da organização do usuário)
- Período (data início/fim do filtro global)
- Filtros específicos por página (canal, closer, campanha, etc.)

---

## 6. Sincronização Automática (pg_cron → Edge Function)

A Edge Function `sync-make-datastores` é chamada automaticamente via **pg_cron + pg_net**.

### Jobs Ativos

| Job Name | Cron | Frequência | Group | Tabelas |
|----------|------|-----------|-------|---------|
| `sync-make-fast` | `*/5 * * * *` | **Cada 5 min** | `fast` | `sol_leads_sync` (DS 87418), `sol_qualificacao_sync` (DS 87715), `sol_conversions_sync` (DS 87775) |
| `sync-make-medium` | `*/15 * * * *` | **Cada 15 min** | `medium` | `sol_metricas_sync` (DS 87422), `sol_projetos_sync` (DS 87423) |
| `sync-make-slow` | `0 * * * *` | **Cada 1 hora** | `slow` | `sol_config_sync` (DS 87419), `sol_equipe_sync` (DS 87420), `sol_funis_sync` (DS 87421) |

### Como funciona

1. pg_cron dispara `net.http_post` para a Edge Function com `{"group": "fast|medium|slow"}`
2. A Edge Function chama `GET https://us2.make.com/api/v2/data-stores/{DS_ID}/data?teamId=1934898` com paginação (100/página)
3. Mapeia campos camelCase → snake_case (ex: `chatId` → `chat_id`)
4. Converte objetos vazios `{}` → `null`
5. Faz upsert em batches de 100 na tabela _sync correspondente
6. Registra resultado em `integration_runs` (status, rows_received, rows_upserted, errors)

### Secrets necessários

| Secret | Valor |
|--------|-------|
| `MAKE_API_KEY` | Token da API Make.com (já configurado) |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-disponível nas Edge Functions |

### Monitoramento

Consultar últimas execuções:
```sql
SELECT integration_name, status, rows_received, rows_upserted, error_message, started_at
FROM integration_runs
WHERE integration_name LIKE 'sync-make-ds-%'
ORDER BY started_at DESC
LIMIT 20;
```

---

## 7. Direção dos Dados

```
Make Data Stores ──pg_cron (5/15/60 min)──▶ Edge Function sync-make-datastores ──▶ Supabase (sol_*_sync) ──▶ Lovable (leitura)
Lovable (escrita) ──▶ Supabase (sol_config/equipe/funis_sync) ──sync reverso──▶ Make DS
Make Cenários ──POST direto──▶ Supabase (ads_*, analytics_*)
Lovable (ações) ──webhook──▶ Make Cenários v2
```
