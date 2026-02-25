

# Consolidar Origens de Leads: Indicacao + Prospecao + Organico

## O que muda

Unificar as tres origens menores (Indicacao, Prospecao e Organico) em uma unica categoria chamada **"ORGANICO"** (ou outro nome, se preferir), somando seus valores.

## Calculo

| Origem atual | Valor | Pct |
|---|---|---|
| ORGANICO | 11 | 5% |
| INDICACAO | 6 | 3% |
| PROSPECAO | 3 | 1% |
| **ORGANICO (consolidado)** | **20** | **9%** |

## Resultado final

```text
SITE       → 70  (33%)
FACEBOOK   → 52  (24%)
GOOGLE     → 12  (6%)
ORGANICO   → 20  (9%)   ← soma de Organico + Indicacao + Prospecao
```

## Arquivo modificado

| Arquivo | Mudanca |
|---|---|
| `src/data/conferenciaMockData.ts` | Substituir as 3 linhas (ORGANICO, INDICACAO, PROSPECAO) por uma unica linha consolidada com valores somados |

