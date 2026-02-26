

# Rebuild /conferencia como Painel de Controle Denso

## Visao Geral
Reescrever completamente a pagina `/conferencia` removendo todas as secoes explicativas ("O Problema", "A Solucao", "Antes x Depois") e substituindo por um dashboard denso, estilo painel de controle, com 6 rows de informacao pura.

## O que sera removido
- Secoes "O PROBLEMA", "A SOLUCAO SOL", "IMPACTO & ROI"
- Comparativo "Antes x Depois"
- Textos explicativos, paragrafos, descricoes longas
- Cards de insight com texto
- Tabela de leads qualificados (substituida por dados mais uteis)
- Atividade recente (substituida por mapa de calor)
- `SectionHeader` component

## Novo Layout (6 Rows)

### Row 1 -- KPIs principais (6 cards horizontais)
Cards compactos lado a lado: Leads Recebidos, Taxa Resposta, MQL, SQL, Agendamentos, Fechados. Apenas label curto + numero grande. Animacao de contagem ao entrar no viewport.

### Row 2 -- Funil + Origem (2 colunas, grid 1:1)
- **Esquerda**: Funil vertical compacto com barras horizontais e % de conversao entre cada etapa
- **Direita**: Barras horizontais de origem (Meta, Google, Site, Organico, Indicacao) com % de share e % de conversao ao lado

### Row 3 -- FUP Frio + Desqualificacao (2 colunas)
- **Esquerda**: 3 numeros grandes (entraram no FUP, reativados com %, dias ate reativar)
- **Direita**: Donut chart (Recharts PieChart) com motivos de desqualificacao (sem condicao, imovel inelegivel, timing, sem interesse, outros)

### Row 4 -- Mensagens + SLA (3 colunas)
- 3 numeros grandes: enviadas, recebidas, interacoes/conversa
- Gauge visual de SLA (barra de progresso circular ou linear): 94% abordados em 5min
- Tempo medio de resposta do lead: 4h 17min

### Row 5 -- Mapa de calor (full width)
Grid 7 colunas (Seg-Dom) x 3 linhas (Manha/Tarde/Noite). Celulas coloridas por intensidade (escala verde). Label "Pico: Ter/Qua 10h-12h e 19h-21h"

### Row 6 -- Taxa de resposta por tentativa (barras decrescentes)
4 barras horizontais: 1a msg 42%, 2a msg 28%, 3a msg 18%, 4a+ 12%

### Badge no topo
Discreto, ao lado do titulo: `DEMO -- dados simulados . Jan-Fev 2026`

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/data/conferenciaMockData.ts` | Atualizar -- adicionar novos datasets (heatmap, motivos desqualificacao, metricas mensagens, taxa por tentativa, origens com conversao, FUP frio) |
| `src/pages/Conferencia.tsx` | Reescrever -- novo layout denso com 6 rows |

## Dados mock novos (conferenciaMockData.ts)

```text
kpiCards: 342 leads, 58% resp rate, 94 MQL, 61 SQL, 38 agend, 11 fechados

origemLeads atualizado: com campo conversao
  Meta 52% share -> 18% conv
  Google 18% -> 31% conv
  Site 16% -> 38% conv
  Organico 8% -> 29% conv
  Indicacao 6% -> 67% conv

fupFrio: { entraram: 124, reativados: 31, pctReativados: 25, diasAteReativar: 8.4 }

desqualMotivos: [
  { motivo: "Sem condicao", pct: 34 },
  { motivo: "Imovel inelegivel", pct: 22 },
  { motivo: "Timing", pct: 19 },
  { motivo: "Sem interesse", pct: 15 },
  { motivo: "Outros", pct: 10 }
]

mensagens: { enviadas: 2847, recebidas: 1203, interacoesPorConv: 14.2 }
sla: { pctAbordados5min: 94, tempoMedioRespostaLead: "4h 17min" }

heatmap: grid 7x3 com valores de intensidade 0-100
  pico: "Ter/Qua 10h-12h e 19h-21h"

taxaPorTentativa: [
  { tentativa: "1a msg", pct: 42 },
  { tentativa: "2a msg", pct: 28 },
  { tentativa: "3a msg", pct: 18 },
  { tentativa: "4a+", pct: 12 }
]
```

## Principios visuais aplicados
- Zero texto explicativo, apenas labels curtos e numeros
- Cores semanticas: verde (bom/primario), amarelo (atencao), vermelho (critico)
- Cards compactos com padding minimo
- Grid denso, maximo de info por cm2
- Recharts para donut e barras, CSS puro para heatmap e gauges
- Manter header sticky com relogio e badge DEMO
- Manter filtros existentes (periodo, etapa, temperatura, responsavel)
- Rodape discreto mantido

