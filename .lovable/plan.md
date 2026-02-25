

# Plano: Corrigir Metricas Zeradas e Destacar Pontos Positivos

## Problema Raiz

O componente `RobotInsights` depende de `status_resposta === "respondeu"` para calcular taxas de resposta, mas o parser do Make (`useMakeDataStore.ts`, linhas 50-56) **sempre** atribui `'aguardando'` quando o campo vem vazio. Como o Make.com provavelmente nao envia esse campo preenchido, **todas as taxas ficam 0%**.

Alem disso:
- O funil mostra "Qualificados = 0" porque exige match de telefone com `phonesResponderam` (vazio)
- O funil "Enviados" usa cor cinza (`bg-muted-foreground/60`) em vez de cor positiva
- Os 12 leads qualificados do Google Sheets nao aparecem em nenhum destaque
- O "76 leads contactados sem resposta" e apresentado de forma negativa

## Correcoes Propostas

### 1. Melhorar deteccao de "respondeu" no parser (useMakeDataStore.ts)

Adicionar heuristicas para detectar resposta:
- Se `data_resposta` existe e nao e vazio -> `respondeu`
- Se existir campo `respondeu`, `replied`, `response` nos dados -> `respondeu`
- Se o historico contem mensagens do tipo `recebida` -> `respondeu`

```text
Antes:
  status_resposta = 'aguardando' (sempre)

Depois:
  Se data_resposta preenchido -> 'respondeu'
  Se historico tem mensagem 'recebida' -> 'respondeu'
  Se status contém 'respond' ou 'replied' -> 'respondeu'
  Senão -> 'aguardando'
```

### 2. Funil usa dados do Google Sheets para "Qualificados" (RobotInsights.tsx)

Em vez de exigir match com `phonesResponderam`, contar qualificados direto das proposals:
```text
Antes:  qualificadosComResp = proposals com solQualificado E telefone em phonesResponderam
Depois: qualificados = proposals.filter(p => p.solQualificado).length  (= 12)
```

### 3. Corrigir cores do funil (RobotInsights.tsx)

```text
Antes:
  Enviados   -> bg-muted-foreground/60 (cinza)
  Responderam -> bg-primary/60
  Qualificados -> bg-primary/80
  Fechados   -> bg-primary

Depois:
  Enviados   -> bg-primary/40 (azul claro)
  Responderam -> bg-primary/60
  Qualificados -> bg-primary/80
  Fechados   -> bg-primary
```

### 4. Adicionar secao "Destaques Positivos" no topo do RobotInsights

Nova row antes do comparativo, mostrando conquistas:
- **Leads Qualificados**: 12 (da planilha, `solQualificado`)
- **Mensagens Enviadas**: 48 (total do Make)
- **Leads Contactados**: 76 (phones unicos)
- **Leads Quentes**: contagem de temperatura QUENTE

Usar cores verdes/primarias e icones positivos (CheckCircle, TrendingUp).

### 5. Reframe metricas negativas

- "76 leads contactados, FUP sem resposta" -> mudar para "76 leads em acompanhamento ativo"
- "Excesso (+5 FUPs)" com valor 0 -> mostrar como "Nenhum excesso" com cor verde
- Esconder alertas quando count = 0

## Arquivos Modificados

| Arquivo | Mudanca |
|---|---|
| `src/hooks/useMakeDataStore.ts` | Heuristicas para detectar `respondeu` |
| `src/components/leads/RobotInsights.tsx` | Destaques positivos, funil com dados reais, cores corrigidas, reframe negativo |

## Resultado Esperado

- Taxa de resposta reflete dados reais (nao mais 0%)
- Funil mostra 12 qualificados em azul forte
- "Enviados = 48" em cor azul (nao cinza)
- Nova secao de destaques com os pontos positivos no topo
- Metricas negativas reescritas de forma construtiva

