

# Conectar os 4 novos componentes ao filtro de período

## Problema
Os componentes Sol Hoje, Alertas, Temperatura por Etapa e Tabela de Leads usam dados mock fixos e não respondem ao filtro de período (`multiplier`), diferente dos KPIs, Pipeline, FUP e Heatmap que já escalam corretamente.

## Solução
Aplicar a mesma lógica de `scale()` / `multiplier` aos 4 componentes no arquivo `src/pages/Conferencia.tsx`.

### 1. Sol Hoje — Atividade Diária
- Envolver os valores do grid (qualificados, scores, quentes, mornos, frios) com `scale()`
- Aplicar `scale()` nas barras do gráfico de 7 dias
- Criar `filteredSolHoje` via `useMemo` similar aos outros dados filtrados

### 2. Alertas & Insights
- Alertas são textuais/qualitativos, então podem permanecer fixos (faz sentido contextualmente)
- Alternativa: ajustar valores numéricos mencionados nos textos dos alertas (ex: "R$ 42k" -> escalar)

### 3. Temperatura por Etapa
- Criar `filteredTemperatura` via `useMemo` aplicando `scale()` aos valores quente/morno/frio
- O gráfico de barras empilhadas refletirá automaticamente os valores escalados

### 4. Tabela de Leads
- Aplicar `scale()` ao campo `valor` de cada lead
- Manter nome, etapa, temperatura, score e historico fixos (são dados qualitativos)

## Arquivo modificado
- `src/pages/Conferencia.tsx` — adicionar 3 novos `useMemo` (filteredSolHoje, filteredTemperatura, leads com valor escalado) e atualizar as referências no JSX

## Resultado
Todos os componentes numéricos responderão ao filtro de período de forma consistente com o resto do dashboard.

