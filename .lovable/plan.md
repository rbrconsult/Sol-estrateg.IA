

# Correcao: KPIs de Qualificacao na Pagina Leads

## Problema

A funcao `getLeadsKPIs` em `src/data/dataAdapter.ts` conta **todos** os leads (Aberto + Ganho + Perdido) para calcular "Qualificados Sol" e "Aguardando Qualificacao". Isso distorce os numeros:

- **118 qualificados**: inclui leads ja ganhos e perdidos que foram qualificados pela Sol
- **114 aguardando**: inclui leads ganhos/perdidos que nunca foram qualificados, mas que ja estao encerrados e nao precisam mais de qualificacao

Um lead com status "Ganho" ou "Perdido" nao deveria aparecer como "aguardando qualificacao".

## Solucao

Ajustar `getLeadsKPIs` para separar corretamente:

- **Qualificados Sol**: manter contagem de todos que foram qualificados (independente do status - e um historico valido)
- **Aguardando Qualificacao**: contar apenas leads **Abertos** que ainda nao foram qualificados

### Arquivo: `src/data/dataAdapter.ts`

Alterar a funcao `getLeadsKPIs` (linha 692):

```text
Antes:
  const naoQualificados = total - qualificados;

Depois:
  const abertos = proposals.filter(p => p.status === 'Aberto');
  const naoQualificados = abertos.filter(p => !p.solQualificado).length;
```

A taxa de qualificacao tambem sera ajustada para considerar apenas leads abertos como base, dando uma visao mais realista do trabalho pendente.

## Resultado Esperado

- "Qualificados Sol" continua mostrando todos os leads qualificados pela Sol (historico completo)
- "Aguardando Qualif." mostra apenas leads **abertos** que ainda precisam ser qualificados
- Os numeros refletem a realidade operacional: so aguarda quem esta em aberto

## Arquivo modificado

| Arquivo | Mudanca |
|---|---|
| `src/data/dataAdapter.ts` | Filtrar apenas leads abertos para "Aguardando Qualificacao" |

