

# Reestruturacao do BI Estrategico -- Modelo Executivo

## Visao Geral

Reorganizar a pagina "/" (BI Estrategico) de "painel tecnico/contabil" para "BI decisor/executivo", priorizando receita sobre volume, criando novos componentes estrategicos e reduzindo excesso visual. Nenhuma alteracao no backend.

---

## Nova Ordem dos Blocos na Pagina

```text
+--------------------------------------------------+
| BLOCO 1: Visao Executiva (4 cards grandes)       |
| Receita Prevista | Receita Fechada | Conversao   |
| Ticket Medio                                      |
| + linha secundaria: propostas, abertos, pipeline  |
+--------------------------------------------------+
| BLOCO 2: Meta vs Realizado + Health Score         |
| [Barra de progresso da meta] [Health Score badge] |
+--------------------------------------------------+
| BLOCO 3: Alertas Estrategicos                     |
| Lista de 3-5 alertas calculados automaticamente   |
+--------------------------------------------------+
| BLOCO 4: Funil de Vendas (R$ e kWh)              |
| Com taxas entre etapas e destaque de gargalo      |
+--------------------------------------------------+
| BLOCO 5: Performance Comercial                    |
| Separado em 2 sub-blocos:                         |
|   Performance Comercial | Volume Operacional      |
+--------------------------------------------------+
| BLOCO 6: Ranking + Tendencias (mantidos)          |
+--------------------------------------------------+
```

---

## Arquivos Novos

### 1. `src/components/dashboard/ExecutiveKPIs.tsx`

4 cards grandes em grid 2x2 (mobile) / 4 colunas (desktop):

| Card | Valor | Subtitulo |
|---|---|---|
| Receita Prevista | `kpis.receitaPrevista` (pipeline ponderado por probabilidade) | "Pipeline ponderado" |
| Receita Fechada | `kpis.valorGanho` | "X negocios ganhos" |
| Conversao Real | `kpis.taxaConversao` | "Ganhos / Total" |
| Ticket Medio | `kpis.ticketMedio` | "Por proposta" |

Linha secundaria abaixo com badges menores: total propostas, abertos, pipeline bruto.

Estilo: cards maiores que os atuais KPICards, com destaque monetario (font-size maior para valores em R$), cores mais sutis, menos sombra.

### 2. `src/components/dashboard/GoalProgress.tsx`

Componente "Meta vs Realizado":
- Meta configuravel via `useState` com valor padrao (ex: R$ 5.000.000) -- editavel inline pelo usuario (salvo em localStorage por enquanto, sem backend)
- Barra de progresso visual com 3 segmentos:
  - Verde: valor fechado (`kpis.valorGanho`)
  - Azul: pipeline ponderado (`kpis.receitaPrevista`)
  - Cinza: gap restante
- Texto: "X% da meta atingida" + valor absoluto do gap
- Props: `meta`, `valorFechado`, `receitaPrevista`

### 3. `src/components/dashboard/HealthScore.tsx`

Widget "Saude do Pipeline":
- Calcula score 0-100 baseado em 4 fatores (pesos iguais de 25 cada):
  1. **Conversao**: `taxaConversao >= 15% = 25pts`, `>= 10% = 18pts`, `>= 5% = 10pts`, else `0`
  2. **Ciclo**: `cicloProposta <= 7d = 25pts`, `<= 15d = 18pts`, `<= 30d = 10pts`, else `0`
  3. **Distribuicao**: Se nenhum vendedor concentra >50% do pipeline = 25pts, >60% = 10pts, >70% = 0pts
  4. **Fluxo**: % de propostas paradas >15 dias. `<20% = 25pts`, `<40% = 15pts`, else `0`
- Visual: badge grande com icone e cor:
  - 75-100: Verde "Saudavel"
  - 50-74: Amarelo "Atencao"  
  - 0-49: Vermelho "Risco"
- Props: `proposals`, `kpis`, `vendedorPerformance`

### 4. `src/components/dashboard/StrategicAlerts.tsx`

Card com lista de alertas calculados automaticamente a partir dos dados:

Alertas possiveis (exibir apenas os relevantes, max 5):
1. "X% das oportunidades estao paradas ha +15 dias" (se > 20%)
2. "Conversao caiu para X%" (se < 10%)
3. "1 vendedor concentra X% do pipeline" (se > 50%)
4. "X% das perdas sao por [principal motivo]" (se tiver dados de perda)
5. "Ciclo medio de X dias acima da media" (se > 20 dias)
6. "X propostas sem atualizacao ha +30 dias"
7. "Pipeline ponderado cobre apenas X% da meta"

Cada alerta: icone de severidade (vermelho/amarelo) + texto + valor.

Props: `proposals`, `kpis`, `vendedorPerformance`, `meta`

---

## Arquivos Alterados

### 5. `src/pages/Index.tsx`

Reestruturar completamente o JSX (mantendo toda a logica de dados existente):

**Remover:**
- `FunnelKPIs` (substituido por `ExecutiveKPIs`)
- Secao "Indicadores Detalhados" com 6 `KPICard` (redistribuido entre ExecutiveKPIs e sub-blocos)
- `StatusFunnel` (ciclo de vida) -- informacao ja coberta pelos novos blocos
- `StageProgress` -- redundante com funil melhorado

**Adicionar (nesta ordem):**
1. `ExecutiveKPIs` -- visao de receita
2. `GoalProgress` + `HealthScore` lado a lado (grid 2 colunas)
3. `StrategicAlerts`
4. `StrategicFunnel` + `PowerFunnel` (mantidos, lado a lado)
5. `ComercialResponsavelStats` + `VendedorFunnel` (mantidos)
6. `VendedorRanking` (mantido)
7. `TrendsChart` (mantido)

**Novos imports necessarios:**
- `ExecutiveKPIs`, `GoalProgress`, `HealthScore`, `StrategicAlerts`

**Remover imports nao mais usados:**
- `FunnelKPIs`, `KPICard`, `StatusFunnel`, `StageProgress`
- Icones nao mais usados: `Briefcase`, `Zap`, `Target`, `CheckCircle`, `AlertTriangle`, `Clock`, `DollarSign`

### 6. `src/components/dashboard/StrategicFunnel.tsx`

Melhorias no funil existente:
- Adicionar taxa de conversao entre etapas (badge entre barras mostrando % de passagem da etapa anterior para a atual)
- Destacar gargalo: etapa com menor taxa de passagem recebe borda vermelha e label "Gargalo"
- Mostrar valor acumulado por etapa

---

## Melhorias Visuais Globais

Aplicar no `ExecutiveKPIs` e novos componentes:
- Menos sombra nos cards (shadow-sm ao inves de shadow-card)
- Cores mais sutis e dessaturadas
- Maior destaque para valores monetarios (text-3xl a text-4xl para R$)
- Labels menores e mais discretos
- Sem elementos decorativos "glow" nos novos componentes

---

## Dados Ja Disponiveis (sem alteracao no dataAdapter)

Todos os valores necessarios ja existem em `getKPIs()`:
- `receitaPrevista` (pipeline ponderado) -- ja calculado na linha 208
- `valorGanho` -- linha 161
- `taxaConversao` -- linha 166
- `ticketMedio` -- linha 169
- `cicloProposta` -- linha 203
- `negociosGanhos`, `negociosPerdidos`, `negociosAbertos` -- linhas 213-215

Para alertas e health score, dados de `vendedorPerformance` e `proposals` ja fornecem:
- Concentracao por vendedor
- `tempoNaEtapa` por proposta
- `motivoPerda` por proposta

---

## O Que NAO Sera Alterado

- `src/data/dataAdapter.ts` -- nenhuma funcao nova necessaria
- Backend / Edge Functions
- Google Sheets / integracao
- Outras paginas (Pipeline, Forecast, etc.)
- Sidebar, Auth, Layout

---

## Ordem de Implementacao

1. Criar `ExecutiveKPIs.tsx`
2. Criar `GoalProgress.tsx`
3. Criar `HealthScore.tsx`
4. Criar `StrategicAlerts.tsx`
5. Atualizar `StrategicFunnel.tsx` (taxas entre etapas + gargalo)
6. Reestruturar `Index.tsx` (nova ordem de blocos)

