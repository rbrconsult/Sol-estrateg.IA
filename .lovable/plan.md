

# Plano: Pagina de Conferencia SOL SDR (Dados Mockados)

## Visao Geral

Criar uma pagina standalone `/conferencia` com design premium e dados mockados, seguindo o briefing pixel-perfect da apresentacao SOL SDR x Evolve Energia Solar. Pagina independente da `/leads` existente, com paleta propria, fontes Syne + JetBrains Mono, e animacoes de entrada.

---

## Estrutura da Pagina

```text
+------------------------------------------------------------------+
|  HEADER FIXO                                                      |
|  [emoji sol] SOL SDR - Painel Estrategico   [AO VIVO dot] [relogio]|
+------------------------------------------------------------------+
|  SECAO 1: KPI Row (5 cards com barra colorida no topo)            |
|  [Leads 801] [Qualificados 284] [Quentes 47] [Propostas 61] [ROI]|
+------------------------------------------------------------------+
|  SECAO 2: ROI Card Destaque (gradient laranja/verde, watermark)   |
|  Custo/Lead R$6 | Faturamento R$1.8M | Economia R$11.4k          |
+------------------------------------------------------------------+
|  SECAO 3: Grid 2/3                                                |
|  +-- Funil (barras horizontais animadas) --+-- Insights (5 cards)-+|
|  | TRAFEGO PAGO 84  laranja               | ALERT: 2 Quentes...  ||
|  | PROPOSTA 61 roxo                        | INFO: 10s resposta   ||
|  | NEGOCIACAO 19 verde                     | OK: Agendamentos +52%||
|  | ...                                     | INFO: 47% fora hora  ||
|  +-- Leads por Semana (barras verticais) --| OK: 100% CRM         ||
|  +------------------------------------------+---------------------+|
+------------------------------------------------------------------+
|  SECAO 4: Tabela de Leads (12 linhas com score rings e badges)    |
+------------------------------------------------------------------+
|  SECAO 5: Bottom Grid (3 colunas)                                 |
|  [Origem Leads] [Performance Sol] [Atividade Recente]             |
+------------------------------------------------------------------+
|  RODAPE: RBR CONSULT x EVOLVE ENERGIA SOLAR (watermark)          |
+------------------------------------------------------------------+
```

---

## Detalhes Tecnicos

### Arquivos a Criar

1. **`src/pages/Conferencia.tsx`** -- Pagina principal standalone com todas as secoes
   - Header fixo com relogio em tempo real e badge "AO VIVO" piscando
   - Secao 1: 5 KPI cards com contadores animados (useEffect + requestAnimationFrame)
   - Secao 2: ROI card destaque com gradient e watermark "ROI" em fonte gigante
   - Secao 3: Grid 2/3 com funil horizontal animado + insights cards + barras semanais
   - Secao 4: Tabela com 12 leads, score rings coloridos e badges de temperatura
   - Secao 5: Bottom grid com origem, performance Sol e timeline de atividade
   - Blobs animados laranja/verde no fundo com blur 120px
   - Rodape watermark

2. **`src/data/conferenciaMockData.ts`** -- Todos os dados mockados conforme briefing
   - KPIs fixos (801, 284, 47, 61, 4.2x)
   - ROI data (R$6 vs R$420, R$1.8M, R$11.4k)
   - Funil com 8 etapas e valores exatos
   - 12 leads da tabela com todos os campos
   - Origem dos leads (Site 70, Facebook 52, etc.)
   - Performance Sol (Score 61, Taxa 35%, etc.)
   - Timeline de atividade recente (5 itens)
   - Insights (5 cards com tipo, titulo, descricao)

### Arquivos a Alterar

1. **`src/App.tsx`** -- Adicionar rota `/conferencia` (publica, sem ProtectedRoute, sem MainLayout -- pagina independente)

### Fontes e Estilos

- Importar Google Fonts: Syne (700/800) e JetBrains Mono (400/500) via `@import` no CSS da pagina ou inline
- Paleta custom aplicada via classes Tailwind inline (nao altera o tema global):
  - `bg-[#080C12]` (fundo principal)
  - `bg-[#0D1420]` (cards)
  - `border-white/[0.06]` (bordas)
  - `text-[#F5A623]` (sol/laranja)
  - `text-[#06D6A0]` (verde)
  - `text-[#EF476F]` (quente)
  - `text-[#118AB2]` (frio)
  - `text-[#F0F4FF]` (texto principal)
  - `text-[#6B7A99]` (muted)

### Animacoes

- Contadores de 0 ao valor usando Intersection Observer + requestAnimationFrame
- Barras do funil expandem da esquerda com CSS transition (width 0% -> 100%)
- Badge "AO VIVO" com dot verde pulsando (CSS animation pulse)
- Hover nos cards: `hover:-translate-y-0.5 hover:border-white/10 transition-all`
- Blobs de fundo com animacao CSS lenta de posicao

### Bibliotecas

- `recharts` (ja instalado) para barras semanais
- Tailwind para todo o layout e estilo
- React state para relogio em tempo real

---

## Sequencia de Implementacao

1. Criar dados mockados (`conferenciaMockData.ts`)
2. Criar pagina completa (`Conferencia.tsx`) como componente unico com todas as secoes inline
3. Registrar rota publica `/conferencia` no App.tsx (sem auth, sem sidebar)

