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
| `lastFollowupDate` | Parcialmente preenchido | "Última resposta" mostra "—" em vários leads |

**DS de origem:** DS Thread (filtrado por `followupCount >= 1`)

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

## 7. Recomendações

1. **Mapear campos TS** no `cron-sync` para preencher `data_qualificacao` e `data_entrada`
2. **Padronizar formato de datas** no DS Thread (ISO 8601)
3. **Preencher `data_resposta`** via automação Make quando lead responde
4. **Limpar datas futuras** (>hoje) e datas anteriores a 01/01/2026 se fora do escopo
5. **Preencher `historico[]`** corretamente no webhook de mensagens
