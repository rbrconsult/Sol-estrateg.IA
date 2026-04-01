# SOL v2 — Cenários Make → DS → Sync → Páginas Lovable

**Fluxo de dados:** Cenário Make → grava no DS → Edge Function sync (5-15min) → tabela _sync Supabase → Lovable lê

---

## FLUXO COMPLETO POR CENÁRIO

### 1. WhatsApp Inbound (4568410) — 65 execuções
**Trigger:** Webhook Krolik (msg do lead)
**Grava em:** sol_leads (87418)
**Campos gravados:** nome, telefone, email, cidade, status, canal_origem, chatId, contactId, project_id, ts_cadastro, ts_ultima_interacao, total_mensagens_ia
**Sync:** sol_leads_sync (5min)
**Páginas que exibem:**
- `/dashboard` → card Total Leads, Tráfego Pago
- `/leads` → tabela com novo lead
- `/conferencia` → contagem novos leads
- `/campanhas/whatsapp` → leads via WhatsApp
- `/solarmarket/prevenda` → kanban coluna TRAFEGO_PAGO

### 2. Agent WhatsApp (4568399) — 91 execuções
**Trigger:** Webhook (msg processada pelo Agent GPT)
**Grava em:** sol_leads (87418) + sol_qualificacao (87715)
**Campos gravados (sol_leads):** score, temperatura, valor_conta, tipo_imovel, tipo_telhado, acrescimo_carga, prazo_decisao, forma_pagamento, preferencia_contato, resumo_conversa, resumo_qualificacao, total_mensagens_ia, custo_openai, custo_elevenlabs, custo_total_usd, total_audios_enviados
**Campos gravados (sol_qualificacao):** dados_qualificacao, score, temperatura, acao, resumo_qualificacao
**Sync:** sol_leads_sync + sol_qualificacao_sync (5min)
**Páginas que exibem:**
- `/dashboard` → seção Performance SOL (msgs, custos, score médio)
- `/leads` → drawer Lead360 (resumo_conversa, resumo_qualificacao)
- `/robo-sol` → heatmap atividade, custos IA, funil qualificação
- `/sol/insights` → feed alertas, custos consolidados
- `/solarmarket/prevenda` → kanban card com score/temperatura

### 3. Capture Google+Site (4568455) — 58 execuções
**Trigger:** Google Sheets (15min)
**Grava em:** sol_leads (87418) + sol_metricas (87422)
**Campos gravados (sol_leads):** nome, telefone, email, cidade, status=TRAFEGO_PAGO, canal_origem=GOOGLE_ADS, project_id
**Campos gravados (sol_metricas):** data, robo=sdr, leads_novos+1
**Sync:** sol_leads_sync + sol_metricas_sync (5-15min)
**Páginas que exibem:**
- `/dashboard` → card Tráfego Pago, gráfico tendência diária
- `/leads` → novo lead com tag GOOGLE_ADS
- `/conferencia` → evolução diária
- `/campanhas/whatsapp` → leads_novos por dia

### 4. Capture Meta Ads (4568453) — 21 execuções ⚠️ INATIVO
**Trigger:** Meta Lead Ads (15min) — isinvalid, precisa fix UI
**Grava em:** sol_leads (87418) + sol_metricas (87422)
**Campos gravados (sol_leads):** nome, telefone, email, cidade, status=TRAFEGO_PAGO, canal_origem=META_ADS, project_id, valor_conta (faixa do formulário)
**Mesmas páginas que Capture Google**

### 5. Qualificar Lead (4568405) — 5 execuções
**Trigger:** Webhook (ação do Agent ou manual)
**Grava em:** sol_leads (87418)
**Campos gravados:** status=QUALIFICADO, ts_qualificado
**Sync:** sol_leads_sync (5min)
**Páginas que exibem:**
- `/dashboard` → card Qualificados +1
- `/leads` → lead muda de coluna/badge
- `/qualificacao` → lead sai da lista pendentes
- `/solarmarket/prevenda` → kanban move card pra QUALIFICADO

### 6. Transfer Closer (4568415) — 12 execuções
**Trigger:** Webhook (após qualificação)
**Grava em:** sol_leads (87418) + sol_config (87419, counter)
**Campos gravados:** closer_nome, closer_sm_id, etapa_funil=QUALIFICADO, qualificado_por=SOL_SDR_v2, transferido_comercial=true, ts_transferido
**Sync:** sol_leads_sync (5min)
**Páginas que exibem:**
- `/dashboard` → seção Por Closer
- `/pipeline` → lead aparece no kanban comercial
- `/painel-comercial` → KPIs executivos, ranking closers
- `/performance` → vendedores tab
- `/solarmarket/comercial` → pipeline closers

### 7. Desqualificar Lead (4568404) — 1 execução
**Trigger:** Webhook
**Grava em:** sol_leads (87418)
**Campos gravados:** status=DESQUALIFICADO, ts_desqualificado
**Sync:** sol_leads_sync (5min)
**Páginas que exibem:**
- `/dashboard` → card Desqualificados +1
- `/desqualificar` → lead confirmado como desqualificado

### 8. Reprocessar Lead (4568406) — 7 execuções
**Trigger:** Webhook
**Grava em:** sol_leads (87418)
**Campos gravados:** status=TRAFEGO_PAGO (reset)
**Sync:** sol_leads_sync (5min)
**Páginas que exibem:**
- `/dashboard` → lead volta pro card Tráfego Pago
- `/reprocessamento` → confirmação de reprocessamento

### 9. FUP Frio (4568443) — 49 execuções
**Trigger:** Scheduled (30min)
**Grava em:** sol_leads (87418)
**Campos gravados:** status=FOLLOW_UP, fup_followup_count+1, ts_ultimo_fup, ts_ultima_interacao
**Sync:** sol_leads_sync (5min)
**Páginas que exibem:**
- `/dashboard` → seção FUP Frio (leads com FUP, resgatados)
- `/robo-fup-frio` → detalhamento leads frios, contagem FUPs
- `/followup` → análise cadência, aging

### 10. Sync SM Ganho/Perdido (4568407) — 7 execuções
**Trigger:** Webhook SolarMarket
**Grava em:** sol_leads (87418) + sol_projetos (87423) + sol_conversions (87775)
**Campos gravados (sol_leads):** status=GANHO ou PERDIDO
**Campos gravados (sol_projetos):** project_id, etapa, evento=won/lost, ts_evento
**Campos gravados (sol_conversions):** event_name=Purchase/Lead_Lost
**Sync:** sol_leads_sync + sol_projetos_sync + sol_conversions_sync (5-15min)
**Páginas que exibem:**
- `/dashboard` → cards Ganhos/Perdidos
- `/pipeline` → lead move pra coluna GANHO/PERDIDO
- `/contratos-fechados` → novo contrato
- `/forecast` → atualiza pipeline
- `/comissoes` → nova comissão
- `/campanhas/funil` → funil atualiza
- `/jornada-lead` → evento na timeline

### 11. Sync SM Mudança Etapa (4568408) — 141 execuções
**Trigger:** Webhook SolarMarket
**Grava em:** sol_leads (87418) + sol_projetos (87423)
**Campos gravados:** etapa atualizada, evento=moved
**Sync:** sol_leads_sync + sol_projetos_sync (5-15min)
**Páginas que exibem:**
- `/pipeline` → card move no kanban
- `/jornada-lead` → novo evento timeline
- `/campanhas/funil` → atualiza contagens por etapa

### 12. Sync SM Proposta Aceita (4568409) — 2 execuções
**Trigger:** Webhook SolarMarket
**Grava em:** sol_projetos (87423)
**Campos gravados:** evento=proposal, ts_evento
**Sync:** sol_projetos_sync (15min)
**Páginas que exibem:**
- `/forecast` → nova proposta no pipeline
- `/pipeline` → atualiza card
- `/jornada-lead` → evento proposta

### 13. CAPI Meta Events (4584365) — 2 execuções
**Trigger:** Webhook interno
**Grava em:** sol_conversions (87775)
**Campos gravados:** event_name, canal=META, capi_sent, capi_response, fbclid
**Sync:** sol_conversions_sync (5min)
**Páginas que exibem:**
- `/campanhas/meta` → status CAPI
- `/campanhas/funil` → conversions enviadas

### 14. Google Offline Conversions (4584368) — 2 execuções (100% erro)
**Trigger:** Webhook interno
**Grava em:** sol_conversions (87775) — mas com erro
**Sync:** sol_conversions_sync (5min)
**Páginas que exibem:**
- `/campanhas/google` → status Google Conversions
- `/campanhas/funil` → conversions Google

### 15. Auth Global (4578094) — 129 execuções
**Trigger:** Scheduled (15min)
**Grava em:** sol_auth (87324) — NÃO sincronizado pro Supabase
**Páginas:** Nenhuma (interno Make)

---

## GAPS IDENTIFICADOS

### Dados que Make gera mas NENHUMA página mostra:

| Dado | DS | Cenário | Sugestão |
|---|---|---|---|
| OCR Conta de Luz | sol_leads (valor_conta_confirmado_ocr) | OCR Conta de Luz (inativo) | `/leads` drawer já mostra, mas cenário tá off |
| Newsletter emails | sol_config (prompt_newsletter) | Newsletter (inativo) | `/admin/config` já tem o prompt |
| Auth tokens | sol_auth | Auth Global | `/operacoes` pode mostrar status do token |

### Páginas que existem mas dados v2 ainda NÃO populam:

| Página | Problema | Solução |
|---|---|---|
| `/campanhas/receita` | Usa media_performance_daily (tabela v1) | Cruzar ads_meta + ads_google com sol_leads_sync (status=GANHO) |
| `/campanhas/ads` | Usa ads_meta + ads_google | ✅ Já usa tabelas corretas |
| `/campanhas/ga4` | Usa analytics_ga4_daily | ✅ Já usa tabela correta |
| `/bi` | Usava useBIMakeData (hook v1) | Migrado pra useSolLeads + useSolMetricas |
| `/reports` | Usa report_templates | Tabela própria, não depende de DS Make |
| `/chamados` | Usa support_tickets | Tabela própria, não depende de DS Make |
| `/operacoes` | Usa make_heartbeat | Tabela própria, populated by Edge Function |

### Novas rotas sugeridas:

| Rota | Necessidade | Tabelas |
|---|---|---|
| `/admin/conversions` | Ver status CAPI Meta + Google Offline (0 events registrados, debug) | sol_conversions_sync |
| `/admin/sync` | Monitor do cron-sync Edge Function (integration_runs) | integration_runs |

---

## MAPA DEFINITIVO: TABELA _SYNC → PÁGINAS

### sol_leads_sync (DS 87418) — 15 registros — TABELA CENTRAL
```
/dashboard          → funil, performance SOL, FUP, canal, closer, alertas
/conferencia        → score por origem, SLA, evolução
/leads              → tabela completa, drawer Lead360
/robo-sol           → métricas robô, custos IA
/robo-fup-frio      → leads frios, FUP count
/qualificacao       → lista pendentes qualificação
/desqualificar      → lista pra desqualificar
/reprocessamento    → lista pra reprocessar
/pipeline           → kanban comercial
/painel-comercial   → KPIs executivos
/forecast           → pipeline valor
/contratos-fechados → negócios ganhos
/performance        → ranking vendedores
/comissoes          → comissões
/campanhas/whatsapp → msgs IA, custos
/campanhas/funil    → funil completo
/bi                 → análise cruzada
/followup           → cadência follow-up
/jornada-lead       → timeline lead
/sla                → tempos resposta
/sol/insights       → alertas, custos
/sanitizacao        → limpeza dados
/solarmarket/*      → todas 3 páginas SM
```

### sol_equipe_sync (DS 87420) — 6 registros
```
/dashboard          → seção Por Closer
/pipeline           → nomes closers
/painel-comercial   → ranking closers
/campanhas/funil    → performance closers
/solarmarket/prevenda → dropdown transferir
/solarmarket/comercial → pipeline por closer
/admin/equipe       → CRUD equipe (R+W)
```

### sol_metricas_sync (DS 87422) — 2 registros
```
/dashboard          → gráfico tendência diária
/conferencia        → evolução diária
/robo-sol           → métricas operacionais
/robo-fup-frio      → métricas FUP
/campanhas/whatsapp → leads_novos/dia
/bi                 → trends
/sol/insights       → métricas consolidadas
```

### sol_projetos_sync (DS 87423) — 79 registros
```
/pipeline           → eventos SM, etapas
/painel-comercial   → movimentações
/forecast           → propostas
/contratos-fechados → ganhos com detalhes
/comissoes          → base comissão
/campanhas/funil    → timeline eventos
/bi                 → análise comercial
/jornada-lead       → timeline projeto
/solarmarket/comercial → pipeline SM
```

### sol_qualificacao_sync (DS 87715) — 6 registros
```
/dashboard          → dados qualificação
/leads              → drawer com resumo_qualificacao
/solarmarket/prevenda → card expandido
/sol/insights       → alertas qualificação
```

### sol_conversions_sync (DS 87775) — 0 registros
```
/campanhas/meta     → status CAPI enviados
/campanhas/google   → status Google Conversions
/campanhas/funil    → conversions por tipo
```

### sol_config_sync (DS 87419) — 16 registros
```
/admin/config       → prompts, variáveis, templates FUP (R+W)
```

### sol_funis_sync (DS 87421) — 1 registro
```
/campanhas/funil    → referência etapas SM
/admin/funis        → mapeamento etapas (R+W)
```

### ads_meta_campaigns_daily (Supabase direto)
```
/campanhas          → gasto + leads Meta
/campanhas/meta     → detalhamento campanhas/adsets/ads
/campanhas/ads      → comparativo Meta vs Google
/campanhas/receita  → ROI por canal
```

### ads_google_campaigns_daily (Supabase direto)
```
/campanhas          → gasto + leads Google
/campanhas/google   → detalhamento campanhas/grupos/redes
/campanhas/ads      → comparativo Meta vs Google
/campanhas/receita  → ROI por canal
```

### analytics_ga4_daily (Supabase direto)
```
/campanhas/site     → sessões, páginas, fontes
/campanhas/ga4      → GA4 por campanha UTM
```

---

## AÇÕES NECESSÁRIAS DO LOVABLE

### Prioridade 1: Dashboard (/dashboard)
- Implementar 8 seções conforme SOL_v2_Dashboard_Queries_Lovable.md
- Fonte: useSolLeads() + useSolMetricas() + useSolEquipe()

### Prioridade 2: Leads (/leads)
- Tabela lê de useSolLeads()
- Drawer Lead360 cruza com useSolQualificacao() por telefone

### Prioridade 3: Pipeline (/pipeline)
- Kanban lê de useSolLeads(statusFilter) + useSolProjetos() + useSolEquipe()

### Prioridade 4: Robô SOL + FUP (/robo-sol, /robo-fup-frio)
- Métricas de useSolLeads() (total_mensagens_ia, custos) + useSolMetricas()

### Prioridade 5: Admin (config/equipe/funis)
- R+W nos _sync tables. Já criados.
