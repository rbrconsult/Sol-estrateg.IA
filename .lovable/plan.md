

# Fazer os filtros de data funcionarem com dados mock

## Problema
Os filtros de periodo (7d, 30d, 90d, personalizado) existem visualmente mas nao alteram nenhum dado — todos os valores sao importados estaticamente e renderizados diretamente.

## Solucao
Criar uma logica de "simulacao de filtro" que aplica multiplicadores proporcionais aos dados mock conforme o periodo selecionado. Isso da a sensacao real de filtragem sem precisar de dados reais.

## Como vai funcionar

| Periodo | Multiplicador | Logica |
|---|---|---|
| 7 dias | ~0.25x | Aproximadamente 1/4 do mes |
| 30 dias (padrao) | 1.0x | Dados base, sem alteracao |
| 90 dias | ~2.8x | Aproximadamente 3 meses acumulados |
| Personalizado | Proporcional | Calcula com base na diferenca de dias entre inicio e fim |

Os multiplicadores serao aplicados a:
- KPI cards (valores e detalhes recalculados)
- Funil (valores proporcionais)
- FUP Frio (entraram, reativados)
- Mensagens (enviadas, recebidas)
- Heatmap (intensidades)
- Taxa por tentativa (mantem % — sao taxas, nao volumes)
- Origem dos leads (mantem % de share e conversao — sao taxas)

## Detalhes tecnicos

### Arquivo: `src/pages/Conferencia.tsx`

1. Criar funcao `getMultiplier(periodo, dateFrom, dateTo)` que retorna o fator de escala baseado no periodo selecionado

2. Criar `useMemo` que gera dados filtrados aplicando o multiplicador:
   - Valores absolutos (leads, MQL, SQL, agendamentos, fechados, mensagens) sao multiplicados e arredondados
   - Percentuais e taxas (conversao, share, SLA) permanecem iguais
   - Details dos KPIs sao recalculados com os novos valores

3. Todos os componentes que hoje leem diretamente dos imports passam a ler dos dados filtrados via `useMemo`

4. O componente KPI recebe os novos valores filtrados (o `target` muda, e o hook de animacao re-anima ao mudar)

5. Fix no hook `useAnimatedNumber`: adicionar `target` como dependencia para re-animar quando o filtro muda (hoje so anima uma vez por interseccao)

### Resultado visual
- Ao trocar de 30d para 7d, os numeros diminuem com animacao
- Ao trocar para 90d, os numeros aumentam
- Filtro personalizado calcula proporcional aos dias selecionados
- Taxas e percentuais permanecem estaveis (comportamento realista)

