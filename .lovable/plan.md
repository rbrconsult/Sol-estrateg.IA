

# Plano: Verificacao e Enriquecimento do Dashboard de Leads com SLA

## Diagnostico dos Leads Ausentes

Analisando o codigo, identifiquei dois possiveis motivos para leads qualificados hoje nao aparecerem:

1. **Filtro obrigatorio de `projeto_id`** (fetch-sheets, linha 140): Linhas da planilha sem `projeto_id` preenchido sao descartadas silenciosamente. Se "Marcos Giacomo" ou "Edmilson J Ragnoli" ainda nao tiverem `projeto_id`, eles nao chegam ao frontend.

2. **Cache de 5 minutos**: O React Query armazena os dados por 5 minutos (`staleTime`). Se os dados foram inseridos na planilha apos o ultimo fetch, nao aparecerao ate o proximo ciclo (maximo 10 min de `refetchInterval`).

## Correcoes Propostas

### 1. Tornar `projeto_id` opcional no filtro
- **Arquivo**: `supabase/functions/fetch-sheets/index.ts` (linha 140)
- **Mudanca**: Remover o `.filter((p: SheetRow) => p.projeto_id)` ou tornar o filtro mais permissivo, permitindo linhas que tenham ao menos `nome_cliente` preenchido
- Gerar um ID sintetico para leads sem `projeto_id` (ja feito no `adaptSheetData` com `PROP-XXXX`)

### 2. Adicionar botao "Atualizar Dados" no header
- **Arquivo**: `src/pages/Leads.tsx`
- Botao que invalida o cache do React Query (`queryClient.invalidateQueries`) para forcar re-fetch imediato dos dados da planilha e do Make.com

### 3. Melhorar o SLAMetrics com dados disponiveis
- **Arquivo**: `src/components/leads/SLAMetrics.tsx`
- Usar `ultima_atualizacao` como fallback quando `data_qualificacao_sol` estiver vazio
- Calcular SLA do 1o atendimento usando `data_criacao_proposta` como alternativa a `data_criacao_projeto`
- Usar campo `ultima_mensagem` do Make.com como proxy para tempo de resposta dos robos quando `data_resposta` nao existir

### 4. Adicionar busca por nome na tabela
- **Arquivo**: `src/pages/Leads.tsx`
- Campo de busca textual para localizar rapidamente leads como "Marcos Giacomo" na tabela detalhada

## Detalhes Tecnicos

### Alteracao no filtro de parseRows (fetch-sheets)
```typescript
// De:
.filter((p: SheetRow) => p.projeto_id);
// Para:
.filter((p: SheetRow) => p.projeto_id || p.nome_cliente);
```

### Botao de Refresh
```typescript
const queryClient = useQueryClient();
const handleRefresh = () => {
  queryClient.invalidateQueries({ queryKey: ['google-sheets-data'] });
  queryClient.invalidateQueries({ queryKey: ['make-data-store'] });
};
```

### Fallbacks no SLAMetrics
- `dataCriacaoProjeto` vazio -> usar `dataCriacaoProposta`
- `dataQualificacaoSol` vazio -> usar `ultimaAtualizacao` (para leads qualificados)
- Robot SLA: usar diferenca entre `data_envio` e a data atual para leads "aguardando"

## Arquivos Modificados

| Arquivo | Mudanca |
|---|---|
| `supabase/functions/fetch-sheets/index.ts` | Filtro permissivo para leads sem projeto_id |
| `src/pages/Leads.tsx` | Botao refresh, campo busca por nome |
| `src/components/leads/SLAMetrics.tsx` | Fallbacks para KPIs de SLA |

## Resultado Esperado

- Leads como "Marcos Giacomo" (Score 60, MORNO) e "Edmilson J Ragnoli" (Trafego Pago) aparecerao imediatamente no dashboard
- KPIs de SLA mostrarao valores reais em vez de "--"
- Botao de refresh permitira ver dados recem-inseridos sem esperar o cache

