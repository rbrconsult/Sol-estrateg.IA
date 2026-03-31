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

## 6. Direção dos Dados

```
Make Data Stores ──cron──▶ Supabase (sol_*_sync) ──▶ Lovable (leitura)
Lovable (escrita) ──▶ Supabase (sol_config/equipe/funis_sync) ──sync reverso──▶ Make DS
Make Cenários ──POST direto──▶ Supabase (ads_*, analytics_*)
Lovable (ações) ──webhook──▶ Make Cenários v2
```
