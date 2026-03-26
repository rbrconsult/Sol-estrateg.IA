# Relatório de Inconsistências — Data Stores → Supabase

> Gerado em: 2026-03-26  
> Fonte: Auditoria página a página do sistema Sol Estrateg.IA

---

## 1. Dashboard (Página Inicial)

| Campo | Problema | Impacto |
|-------|----------|---------|
| `data_entrada` | 622 leads sem data preenchida | KPIs de volume por período ficam subestimados |
| `data_qualificacao` | Maioria vazia | Funil de conversão não calcula tempo de qualificação |
| `data_proposta` / `data_fechamento` | Poucos registros preenchidos | Etapas finais do funil sem dados |
| Datas futuras (>hoje) | Registros com datas em 2027+ | Distorcem filtros de período |
| Datas passadas (<01/01/2026) | Registros antigos sem contexto | Poluem métricas do período atual |

**DS de origem:** DS Thread (principal), DS Comercial (propostas)

---

## 2. Leads

| Campo | Problema | Impacto |
|-------|----------|---------|
| `data_entrada` | 622 leads sem data | Leads não aparecem em filtros por período |
| `data_qualificacao` | Vazio na maioria | SLA de 1º atendimento impossível de calcular |
| `respondeu` + `data_qualificacao` | Não coexistem preenchidos | Métrica "tempo até resposta" quebrada |
| `temperatura` | Muitos registros sem valor | Gráfico de temperatura por etapa incompleto |
| `score` | Formato inconsistente (string vs number) | Parsing falha em alguns registros |
| `canalOrigem` | Nem sempre preenchido | Filtro por canal incompleto |

**DS de origem:** DS Thread  
**Nota:** Campos `TS_qualificado`, `data_cadastro`, `TS_qualificando` existem no DS mas não são mapeados no sync.

---

## 3. Robô SOL

| Campo | Problema | Impacto |
|-------|----------|---------|
| `data_resposta` | Maioria vazia no DS Thread | SLA do robô (tempo 1ª resposta) sem dados |
| `data_envio` | Formatos mistos (DD/MM/YYYY vs ISO) | Heatmap de horários impreciso |
| `historico[]` | Arrays frequentemente vazios | Contagem de mensagens = 0 para muitos leads |
| `codigoStatus` | Valores inconsistentes para desqualificação | Motivos de desqualificação imprecisos |

**DS de origem:** DS Thread  
**Alvos SLA hardcoded:** 3min, 10min — sem fonte dinâmica no DS

---

## 4. Robô FUP Frio

| Campo | Problema | Impacto |
|-------|----------|---------|
| `followupCount` | Correto na maioria, mas sem `lastFollowupDate` em muitos | Pipeline por etapa OK, mas "dias em FUP" é estimativa |
| `status_resposta` | Depende de `'respondeu'` — OK quando preenchido | Reativações calculadas corretamente quando presente |
| `cidade` | Nem sempre preenchido | Coluna "Cidade" na tabela de leads ativos mostra "—" |
| `data_resposta` | Vazio | Impossível calcular tempo entre FUPs |
| `lastFollowupDate` | Parcialmente preenchido (~40%) | Heatmap de horários e "Última resposta" afetados |
| `data_envio` (fallback) | Formato inconsistente | Heatmap usa como fallback quando `lastFollowupDate` vazio |
| `respondeu` (boolean) | Apenas 12 de 187 leads FUP têm `true` (6.4%) | Taxa de reativação artificialmente baixa; `respondeu` parece ser marcado apenas na qualificação, não na resposta real do lead |
| `codigo_status` | Valores mistos: `LEAD_FRIO`, `NAO_RESPONDEU`, `WHATSAPP`, `SOLARMARKET_*`, `null` | Classificação "por status anterior" inconsistente; leads com `null` não entram em nenhuma categoria |
| `status` (campo geral) | Leads FUP com status `ABERTO`, `PERDIDO`, `EM_QUALIFICACAO` sem distinção clara | Dificulta saber se o lead foi reativado e depois perdido vs. nunca reativado |

**DS de origem:** DS Thread (filtrado por `followupCount >= 1`)

**⚠️ Erro crítico identificado:**  
Dos 187 leads com `followup_count >= 1`, apenas **12 possuem `respondeu = true`**. Distribuição por FUP:
- FUP 1: 5 responderam (de ~35)
- FUP 2: 1 respondeu (de ~21)  
- FUP 3: 6 responderam (de ~43)
- FUP 4-5: 0 responderam (de ~88)

**Causa provável:** O campo `respondeu` no DS Thread só é atualizado quando o lead atinge status `QUALIFICADO`, não quando ele efetivamente responde uma mensagem do FUP Frio. Isso faz com que leads que responderam mas não foram qualificados apareçam como "ignorou".

**Correção sugerida no DS:** Criar um trigger no Make que marque `respondeu = TRUE` sempre que uma resposta for recebida no WhatsApp, independente do status final do lead.

---

## 5. Resumo Geral de Campos Críticos Ausentes

| Campo DS Thread | Preenchimento estimado | Páginas afetadas |
|----------------|----------------------|------------------|
| `data_entrada` | ~85% | Dashboard, Leads, Conferência |
| `data_qualificacao` | ~5% | Leads, Dashboard (funil) |
| `data_resposta` | ~2% | Robô SOL (SLA), FUP Frio |
| `data_envio` | ~60% (formato inconsistente) | Robô SOL (heatmap) |
| `historico[]` | ~30% com dados | Robô SOL (mensagens) |
| `lastFollowupDate` | ~40% | FUP Frio (tabela leads) |
| `temperatura` | ~70% | Leads, Dashboard |
| `cidade` | ~65% | FUP Frio, Leads |

---

## 6. Campos existentes no DS não mapeados no sync

- `TS_qualificado` — poderia substituir `data_qualificacao`
- `TS_qualificando` — timestamp intermediário útil para SLA
- `data_cadastro` — backup para `data_entrada`

---

## 7. Correção Sugerida — Campo `respondeu` no Make.com

### Problema
O campo `respondeu` no DS Thread só é marcado como `true` quando o lead atinge o status `QUALIFICADO`. Se o lead **responde** uma mensagem do FUP Frio mas **não é qualificado**, ele aparece como "ignorou" — distorcendo métricas de reativação.

### Solução Proposta

**No cenário Make de recebimento de mensagens WhatsApp**, criar um trigger que:

1. **Detecte respostas de leads com `followupCount >= 1`**
2. **Atualize no DS Thread:**
   - `respondeu = TRUE`
   - `data_resposta = <timestamp atual no formato ISO 8601>`
3. **Desacople "respondeu" de "qualificado":**
   - `respondeu` = o lead enviou qualquer mensagem de volta (evento de engajamento)
   - `QUALIFICADO` = o lead passou pelo critério de qualificação (evento de conversão)

### Lógica sugerida (pseudocódigo Make)

```
SE mensagem_recebida.telefone EXISTE no DS Thread
  E DS Thread[telefone].followupCount >= 1
  E DS Thread[telefone].respondeu != TRUE
ENTÃO
  ATUALIZAR DS Thread[telefone]:
    respondeu = TRUE
    data_resposta = NOW() em ISO 8601
    status_resposta = "respondeu_fup"
```

### Impacto Esperado
- Métricas de reativação refletirão dados reais
- Taxa de resposta por etapa FUP (1→8) será mensurável
- Estudo de Rotas poderá identificar quais gatilhos (Urgência, Prova Social, Escassez etc.) geram engajamento real
- Diferenciação entre "respondeu mas não qualificou" vs. "ignorou completamente"

### Campos a preencher no DS Thread
| Campo | Valor | Quando |
|-------|-------|--------|
| `respondeu` | `TRUE` | Qualquer resposta WhatsApp recebida |
| `data_resposta` | `ISO 8601 timestamp` | Momento da 1ª resposta |
| `status_resposta` | `"respondeu_fup"` | Resposta durante sequência FUP |

---

## 8. Qualificação

| Campo | Problema | Impacto |
|-------|----------|---------|
| `data_entrada` / `data_envio` | 622 leads sem data | Leads excluídos quando filtro de período ativo (linha 137: `if (!dateStr) return false`) |
| `makeStatus` | Valores inconsistentes entre DS Thread e DS Comercial | Classificação QUALIFICADO/DESQUALIFICADO pode divergir da realidade |
| `codigoStatus` | `LEAD_FRIO` tratado como desqualificado (linha 41) | Leads frios no FUP que deveriam ser "ativos" aparecem como desqualificados |
| `etapaFunil` vs `etapa` vs `etapaSm` | Três campos usados para determinar qualificação (linhas 112-122) | Ambiguidade: lead pode ser qualificado por um campo e desqualificado por outro |
| `temperatura` | Nem sempre preenchido | Badge de temperatura ausente na lista de leads |
| `score` | Formato inconsistente (string vs number) | Exibido como string sem validação |
| `cidade` | ~65% preenchido | Filtro de busca por cidade falha para 35% dos leads |
| `canalOrigem` | Nem sempre preenchido | Webhook envia `canal_origem: ""` para o Make |
| Webhooks hardcoded | URLs de webhook fixas no código (linhas 20-21) | Se Make mudar URLs, página quebra silenciosamente sem erro visível |

**DS de origem:** DS Thread (classificação), DS Comercial (status proposta)

**⚠️ Problema lógico identificado:**  
A função `isDesqualificado()` trata `LEAD_FRIO` como desqualificado (`codigo === "LEAD_FRIO"`, linha 41). Porém, leads com `codigoStatus = LEAD_FRIO` são justamente os candidatos ao Robô FUP Frio. Isso significa que leads que **deveriam estar ativos** para requalificação aparecem como "desqualificados" na contagem e são filtrados da visualização padrão.

**Correção sugerida:**  
Remover `LEAD_FRIO` da função `isDesqualificado()` ou criar uma terceira classificação "EM_REATIVACAO" para distinguir leads frios em processo de FUP de leads efetivamente descartados.

---

## 9. Pipeline (Kanban)

| Campo/Lógica | Problema | Impacto |
|-------|----------|---------|
| `CONTRATO_AGRUPADOS` (linha 24-29) | Constante definida mas **nunca usada** | Código morto; agrupamento de etapas pós-contrato não ocorre |
| Thread leads sem filtro global | `threadLeads` não passa por `gf.filterProposals()` (linha 72-81 vs 59-61) | Leads pré-venda ignoram filtro de período, busca, temperatura e etapa |
| `counts.abertos` inflado | Soma `filteredProposals` (filtrado) + `threadLeads.length` (não filtrado) — linha 85 | Contador "Abertos" mostra total errado quando filtros estão ativos |
| `valorProposta: 0` hardcoded | Todos os thread leads têm valor R$0 (linha 114) | Totais financeiros nas colunas pré-venda zerados; distorce visão de pipeline |
| `potenciaSistema: 0` hardcoded | Idem (linha 115) | kWp total das colunas pré-venda sempre zero |
| `origemLead: ''` | Thread leads sem origem (linha 130) | Impossível filtrar/analisar leads por canal no Kanban |
| `probabilidade: 50` hardcoded | Todos os thread leads com 50% (linha 131) | Se usado no Forecast, previsão financeira será genérica |
| `temperatura` cast `as any` | Type safety quebrada (linha 123) | Possível crash se valor inesperado |
| Badges de origem ausentes | Projeto prevê badges "SOL SDR" / "Solar Market" mas não estão implementados | Usuário não distingue origem do lead visualmente |
| `etapaFunil` normalização parcial | Só converte PROSPECAO, QUALIFICACAO, SOL SDR (linhas 98-101) | Outras variações de etapa caem em TRAFEGO PAGO incorretamente |

**DS de origem:** DS Thread (etapas 1-6), DS Comercial (etapas 7-9)

**⚠️ Bug crítico:** Thread leads não são filtrados pelos filtros globais (período, busca, temperatura), mas leads comerciais sim. Quando o usuário filtra por "últimos 7 dias", os cards pré-venda mostram **todos** os leads do DS Thread, enquanto os cards comerciais mostram apenas os do período selecionado.

**Correção sugerida:**
1. Aplicar `gf.filterProposals()` nos thread leads convertidos, ou criar filtro equivalente sobre `makeRecords` antes da conversão
2. Remover `CONTRATO_AGRUPADOS` ou implementar o agrupamento pretendido
3. Implementar badges visuais de origem (SOL SDR / Solar Market) nos ProjectCards
4. Mapear `origemLead` a partir de `canal_origem` do DS Thread

---

## 9.1 Pipeline — Enriquecimento dos Cards (Implementado)

**Melhoria aplicada:** Cards do Kanban agora exibem dados de conversa de qualificação vindos do DS Thread:

| Campo | Origem DB | Exibição no Card |
|-------|-----------|-----------------|
| `sentimento_resposta` | `leads_consolidados.sentimento_resposta` | Emoji + label (😊 positivo, 😞 negativo, 😐 neutro) |
| `interesse_detectado` | `leads_consolidados.interesse_detectado` | Ícone 🎯 + texto do interesse |
| `ultima_mensagem` | Último item do `historico[]` ou campo `ultima_mensagem` | Ícone 💬 + texto (line-clamp 2 linhas) |
| `historico` (contagem) | Array reconstruído no `rowToMakeRecord` | Badge "X msg" |

**⚠️ Limitação atual:** O `historico[]` é reconstruído de forma sintética (mensagem inicial + FUPs + resposta) pois o DS Thread não envia o conteúdo real das mensagens para o banco. Para dados reais, seria necessário que o Make.com populasse um campo `historico_json` no DS Thread com as mensagens trocadas.

---

## 10. Recomendações Gerais

1. **Mapear campos TS** no `cron-sync` para preencher `data_qualificacao` e `data_entrada`
2. **Padronizar formato de datas** no DS Thread (ISO 8601)
3. **Implementar trigger de `respondeu`** conforme seção 7 acima
4. **Limpar datas futuras** (>hoje) e datas anteriores a 01/01/2026 se fora do escopo
5. **Preencher `historico[]`** corretamente no webhook de mensagens
6. **Preencher `data_resposta`** via automação Make quando lead responde (qualquer robô)
7. **Revisar classificação `LEAD_FRIO`** — não deve ser tratado como desqualificado na página de Qualificação
8. **Mover URLs de webhook** para configuração dinâmica (organization_configs) em vez de hardcoded
9. **Filtrar thread leads** pelos mesmos filtros globais aplicados aos leads comerciais no Pipeline
10. **Implementar badges de origem** (SOL SDR / Solar Market) no Kanban conforme especificação
11. **Enriquecer DS Thread no Make.com** com campo `historico_json` contendo mensagens reais da conversa de qualificação para exibição completa nos cards do Pipeline
