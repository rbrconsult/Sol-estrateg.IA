

# Plano: Dashboard de Leads com Dados Reais da Planilha

## Visao Geral

Redesenhar completamente a pagina `/leads` para consumir dados reais da planilha Google Sheets, mapeando corretamente as colunas Q-Y que contem dados da Sol (qualificacao, score, temperatura, etiquetas/origem) e criando analises estrategicas sobre a jornada do lead, qualidade, eficiencia e performance da Sol.

---

## Problema Atual

As colunas Q-Y na edge function `fetch-sheets` estao mapeadas com nomes errados. O mapeamento atual vs o real:

```text
Index | Atual (errado)           | Real (planilha)
------+-------------------------+---------------------------
  16  | origem_lead             | sol_qualificado (Sim/Nao)
  17  | data_primeiro_contato   | sol_score (nota numerica)
  18  | data_ultimo_contato     | temperatura (QUENTE/MORNO/FRIO)
  19  | numero_followups        | data_qualificacao_sol
  20  | proxima_atividade       | nota_completa (texto livre)
  21  | probabilidade           | tempo_na_etapa (SLA dias)
  22  | motivo_perda            | sol_sdr (Sim/Nao)
  23  | tempo_na_etapa          | tempo_sol_sdr (dias)
  24  | desconto                | etiquetas (FACEBOOK, GOOGLE, INDICACAO...)
```

---

## Estrutura do Novo Dashboard

```text
+------------------------------------------------------------------+
|  BLOCO 1: KPIs Gerais                                            |
|  [Total Leads] [Qualificados Sol] [Desqualificados] [Taxa]       |
|  [Quentes] [Mornos] [Frios] [Score Medio]                        |
+------------------------------------------------------------------+
|  BLOCO 2: Jornada do Lead                                        |
|  +---------------------------+  +------------------------------+ |
|  | Leads por Origem/Etiqueta |  | Leads por Etapa do Funil     | |
|  | (FACEBOOK, GOOGLE, etc)   |  | (onde estao travados?)       | |
|  +---------------------------+  +------------------------------+ |
|  +---------------------------+  +------------------------------+ |
|  | Tempo Medio de Qualific.  |  | Temperatura por Etapa        | |
|  | (Data Projeto -> Data Sol)|  | (Quente/Morno/Frio por etapa)| |
|  +---------------------------+  +------------------------------+ |
+------------------------------------------------------------------+
|  BLOCO 3: Performance da Sol                                     |
|  [Qualificados] [Score Medio] [%Quentes] [Conversao Sol->Prop.]  |
|  +---------------------------+  +------------------------------+ |
|  | Score Medio por Origem    |  | Sol SDR: Tempo + Passagem    | |
|  +---------------------------+  +------------------------------+ |
+------------------------------------------------------------------+
|  BLOCO 4: SLA e Gargalos                                         |
|  +---------------------------+  +------------------------------+ |
|  | Leads Parados por Etapa   |  | Leads Quentes Abandonados    | |
|  | (SLA alto = gargalo)      |  | (Quente + parado ha tempo)   | |
|  +---------------------------+  +------------------------------+ |
+------------------------------------------------------------------+
|  BLOCO 5: ROI por Origem                                         |
|  Etiqueta + Valor Proposta + Taxa Conversao + Score Medio        |
+------------------------------------------------------------------+
|  BLOCO 6: Tabela Detalhada de Leads                              |
|  Nome | Etapa | Status | Origem | Temperatura | Score | SLA      |
+------------------------------------------------------------------+
```

---

## Detalhes Tecnicos

### 1. Atualizar Edge Function `fetch-sheets`

Remapear as colunas Q-Y no `SheetRow` interface e no `parseRows`:

| Index | Campo Novo               | Tipo    |
|-------|--------------------------|---------|
| 16    | `sol_qualificado`        | string  |
| 17    | `sol_score`              | string  |
| 18    | `temperatura`            | string  |
| 19    | `data_qualificacao_sol`  | string  |
| 20    | `nota_completa`          | string  |
| 21    | `tempo_na_etapa`         | string  |
| 22    | `sol_sdr`                | string  |
| 23    | `tempo_sol_sdr`          | string  |
| 24    | `etiquetas`              | string  |

### 2. Atualizar `useGoogleSheetsData.ts`

Atualizar a interface `Proposal` para incluir os novos campos da Sol.

### 3. Atualizar `dataAdapter.ts`

- Remapear os campos no `adaptSheetData` para os nomes corretos
- Atualizar a interface `Proposal` com os campos da Sol
- Criar funcao `parseNotaCompleta(nota: string)` para extrair valor da conta, tipo de imovel e forma de pagamento do texto livre
- Adicionar novas funcoes de analise:
  - `getLeadsKPIs()` -- KPIs de leads (total, qualificados, temperatura, score)
  - `getLeadsByOrigem()` -- Agrupamento por etiqueta
  - `getLeadsByEtapa()` -- Distribuicao por etapa do funil
  - `getTempoQualificacao()` -- Tempo medio Data Projeto -> Data Qualificacao Sol
  - `getTemperaturaPorEtapa()` -- Cruzamento temperatura x etapa
  - `getSolPerformance()` -- Metricas da Sol (qualificados, score, conversao)
  - `getScorePorOrigem()` -- Score medio por etiqueta
  - `getSolSDRMetrics()` -- Tempo e taxa de passagem pela Sol SDR
  - `getGargalos()` -- Leads parados por etapa com SLA alto
  - `getLeadsQuentesAbandonados()` -- QUENTE + tempo_na_etapa > threshold
  - `getROIPorOrigem()` -- Etiqueta + valor proposta + conversao

### 4. Redesenhar Componentes de Leads

Substituir os componentes mockados por componentes que consomem dados reais:

| Componente Atual               | Novo Componente                     |
|--------------------------------|-------------------------------------|
| `LeadsKPIs.tsx` (mock)         | `LeadsKPIs.tsx` (dados reais)       |
| `LeadsByOrigin.tsx` (mock)     | `LeadsByEtiqueta.tsx` (etiquetas)   |
| `LeadsByDayOfWeek.tsx` (mock)  | `LeadsByEtapa.tsx` (funil)          |
| `LeadsByHour.tsx` (mock)       | `TempoQualificacao.tsx`             |
| `LeadsByLocation.tsx` (mock)   | `TemperaturaPorEtapa.tsx`           |
| `LeadsTrendChart.tsx` (mock)   | `GargalosLeads.tsx`                 |
| `RoboMetrics.tsx` (mock)       | `SolPerformance.tsx`                |
| `LeadsTable.tsx` (mock)        | `LeadsTable.tsx` (dados reais)      |

Novos componentes adicionais:
- `ScorePorOrigem.tsx` -- Grafico score medio por etiqueta
- `SolSDRMetrics.tsx` -- Metricas da Sol SDR
- `ROIPorOrigem.tsx` -- Tabela ROI por origem
- `LeadsQuentesAbandonados.tsx` -- Alerta de leads quentes parados

### 5. Atualizar Pagina `Leads.tsx`

- Usar `useGoogleSheetsData()` em vez de `mockLeads`
- Chamar `adaptSheetData()` e as novas funcoes de analise
- Montar os 6 blocos com os novos componentes
- Adicionar loading state e error handling (mesmo padrao de Index.tsx)

### 6. Manter Compatibilidade

- As paginas existentes (Dashboard, Pipeline, Forecast, etc.) que usam `origemLead`, `motivoPerda`, `probabilidade` etc. precisarao ser atualizadas no `adaptSheetData` para ler dos campos corretos
- O campo `etiquetas` (col Y) assumira o papel de `origemLead`
- O campo `tempo_na_etapa` (col V, index 21) substituira o calculo automatico
- `probabilidade` passara a usar valor padrao baseado no score + temperatura

### Arquivos a Alterar

1. `supabase/functions/fetch-sheets/index.ts` -- Remapear colunas Q-Y
2. `src/hooks/useGoogleSheetsData.ts` -- Atualizar interface Proposal
3. `src/data/dataAdapter.ts` -- Remapear campos + novas funcoes de analise
4. `src/pages/Leads.tsx` -- Redesenhar com dados reais
5. `src/components/leads/LeadsKPIs.tsx` -- Refazer com dados reais
6. `src/components/leads/LeadsTable.tsx` -- Refazer com dados reais

### Arquivos a Criar

1. `src/components/leads/LeadsByEtiqueta.tsx`
2. `src/components/leads/LeadsByEtapa.tsx`
3. `src/components/leads/TempoQualificacao.tsx`
4. `src/components/leads/TemperaturaPorEtapa.tsx`
5. `src/components/leads/SolPerformance.tsx`
6. `src/components/leads/ScorePorOrigem.tsx`
7. `src/components/leads/SolSDRMetrics.tsx`
8. `src/components/leads/GargalosLeads.tsx`
9. `src/components/leads/ROIPorOrigem.tsx`
10. `src/components/leads/LeadsQuentesAbandonados.tsx`

### Arquivos a Remover (substituidos)

1. `src/components/leads/LeadsByOrigin.tsx`
2. `src/components/leads/LeadsByDayOfWeek.tsx`
3. `src/components/leads/LeadsByHour.tsx`
4. `src/components/leads/LeadsByLocation.tsx`
5. `src/components/leads/LeadsTrendChart.tsx`
6. `src/components/leads/RoboMetrics.tsx`
7. `src/data/leadsMockData.ts`

---

## Sequencia de Implementacao

1. Atualizar edge function `fetch-sheets` com mapeamento correto das colunas
2. Atualizar interfaces em `useGoogleSheetsData.ts` e `dataAdapter.ts`
3. Criar funcoes de analise no `dataAdapter.ts`
4. Criar novos componentes de visualizacao
5. Redesenhar pagina `Leads.tsx` com dados reais
6. Validar que paginas existentes continuam funcionando

