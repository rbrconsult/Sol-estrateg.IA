

# Recriar ConferenciaBackup com dados originais

## Problema
O `ConferenciaBackup.tsx` atual importa dados do mesmo arquivo `conferenciaMockData.ts` que ja foi modificado (funil reordenado, BANT removido, origens consolidadas). Portanto, nao funciona como backup real.

## Solucao
Criar um arquivo de dados separado `src/data/conferenciaMockDataBackup.ts` com os valores originais e atualizar o `ConferenciaBackup.tsx` para importar dele.

## Diferencas entre original e atual

| Item | Valor atual (modificado) | Valor original (backup) |
|---|---|---|
| Insight BANT | "...100% dos dados inseridos no CRM..." | "...100% dos dados inseridos no CRM automaticamente via BANT..." |
| Origens | 4 entradas (ORGANICO consolidado = 20) | 6 entradas separadas: SITE(70), FACEBOOK(52), GOOGLE(12), ORGANICO(11), INDICACAO(6), PROSPECAO(3) |
| Funil | Sequencia atual com DESQUALIFICADOS auto-calculado | Sequencia original sem DESQUALIFICADOS |
| Subtitulo Solucao | Sem "BANT" | Com "Qualificacao BANT 24/7" |

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/data/conferenciaMockDataBackup.ts` | Criar -- copia dos dados originais com funil, origens e textos BANT restaurados |
| `src/pages/ConferenciaBackup.tsx` | Alterar import para usar `conferenciaMockDataBackup` e remover estilo condicional de DESQUALIFICADOS no funil |

## Detalhes tecnicos

**conferenciaMockDataBackup.ts** tera:
- `origemLeads` com 6 entradas separadas (SITE, FACEBOOK, GOOGLE, ORGANICO, INDICACAO, PROSPECAO)
- `funnelData` sem a linha DESQUALIFICADOS
- `insights` com mencao BANT restaurada
- Demais dados identicos

**ConferenciaBackup.tsx**:
- Trocar `from "@/data/conferenciaMockData"` por `from "@/data/conferenciaMockDataBackup"`
- Remover logica condicional de cor vermelha para DESQUALIFICADOS no funil (ja que essa etapa nao existira)

