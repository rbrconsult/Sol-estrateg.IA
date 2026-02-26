
# Mini Funil de % da Jornada Completa no Pipeline Real

## O que muda

Adicionar um **micro funil horizontal** dentro da seção "Pipeline Real — Fluxo do Lead", mostrando a % acumulada de toda a jornada (de ponta a ponta). Ele ficará entre o pipeline visual atual e a linha de repescagem FUP Frio — um espaço vago natural.

## Layout

O micro funil será uma barra horizontal segmentada mostrando a taxa de sobrevivência em cada etapa em relação ao total inicial (Robô SOL = 100%):

```text
|████████████████████████████████████| 100%  → |███████████████████| 57.9%  → |██████████| 27.5%  → |██████| 17.8%  → |████| 11.1%  → |██| 3.2%
  Robô SOL                              Qualificação                Qualificado          Closer           Proposta        Fechado
```

## Detalhes da implementacao

### Arquivo: `src/pages/Conferencia.tsx`

1. **Calcular percentuais acumulados** — para cada etapa do `filteredPipeline`, calcular `(valor / filteredPipeline[0].valor * 100)` para obter a % relativa ao total de leads recebidos.

2. **Inserir micro funil** entre a `div` do pipeline horizontal (linha ~287) e a linha do FUP Frio (linha ~289):
   - Uma `div` com label "FUNIL DA JORNADA" em texto pequeno
   - Uma barra horizontal segmentada onde cada segmento tem largura proporcional à % acumulada
   - Abaixo de cada segmento: o nome da etapa e a % (ex: "57.9%")
   - Cores degradando de `primary` (100%) para tons mais claros até `success` no Fechado

3. **Estilo**: bordas arredondadas, altura compacta (`h-3`), fundo `bg-secondary/30`, segmentos com gradiente de cor. Labels em `text-[10px]` para manter consistência com o resto do dashboard.

### Dados necessarios
Nenhum dado novo — tudo calculado a partir do `filteredPipeline` existente, dividindo cada `valor` pelo valor da primeira etapa.
