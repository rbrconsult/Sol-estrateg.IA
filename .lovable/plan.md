

# Plano: Pagina BI — Centro de Inteligencia (sem Telhado)

## Resumo

Nova pagina `/bi` com 5 abas (Ads, Sol SDR, SolarMarket, Sults, Cruzamentos). Sem Telhado Inteligente. Sem Grupo C nos cruzamentos. Visual identico ao Sol Estrateg.IA. Zero alteracoes nas paginas existentes.

## Estrutura

```text
┌──────────────────────────────────────────────────────┐
│  BI — Centro de Inteligência              [⏱ live]  │
├──────────────────────────────────────────────────────┤
│ [📣 Ads] [🤖 Sol SDR] [📋 SolarMarket] [🔧 Sults] [🔀 Cruzamentos] │
├──────────────────────────────────────────────────────┤
│  Conteudo da aba ativa (cards, graficos, tabelas)   │
└──────────────────────────────────────────────────────┘
```

## Conteudo por Aba

### 📣 Ads (V1-V4) — Mock + badge "Aguardando API"
- V1: Volume & CPL por canal (bar chart)
- V2: Qualidade por criativo (tabela com score)
- V3: Sazonalidade (line chart)
- V4: Geografia (tabela)

### 🤖 Sol SDR (V5-V8) — Dados reais (Make Data Store)
- V5: Funil real-time
- V6: Motivos de desqualificacao (pie chart)
- V7: Performance por turno (manha/tarde/noite)
- V8: Qualidade do lead entregue ao CRM

### 📋 SolarMarket (V9-V11) — Dados reais (Google Sheets)
- V9: Funil comercial completo
- V10: Performance por vendedor (bar chart)
- V11: Inteligencia de proposta (ticket medio, tempo, conversao)

### 🔧 Sults (V12-V13) — Mock + badge "Aguardando API"
- V12: Funil operacional pos-venda
- V13: Eficiencia tecnica

### 🔀 Cruzamentos — 3 grupos (A, B, D)
- **Grupo A (Ads × SDR):** C1, C2, C3 — mock (depende de Ads)
- **Grupo B (SDR × SolarMarket):** C4 aproveitamento, C5 perfil que fecha, C6 velocidade × conversao — **dados reais**
- **Grupo D (Todos × Todos):** C10 CAC real, C11 LTV por perfil, C12 campanhas por receita, C13 benchmark franquias, C14 lead em risco — parcial (C14 dados reais)

## Arquivos

### Criar
1. `src/pages/BI.tsx` — Pagina com Tabs, header estilo Conferencia
2. `src/hooks/useBIData.ts` — Agrega useGoogleSheetsData + useMakeDataStore, calcula cruzamentos B e metricas SDR/CRM
3. `src/components/bi/AdsTab.tsx` — V1-V4 com mock
4. `src/components/bi/SolSDRTab.tsx` — V5-V8 dados reais
5. `src/components/bi/SolarMarketTab.tsx` — V9-V11 dados reais
6. `src/components/bi/SultsTab.tsx` — V12-V13 com mock
7. `src/components/bi/CruzamentosTab.tsx` — Grupos A, B, D

### Modificar
- `src/App.tsx` — Rota `/bi` com ProtectedRoute + ModuleGuard
- `src/components/layout/Sidebar.tsx` — Item "BI" com icone `BarChart3`
- `src/hooks/useModulePermissions.ts` — Module key `bi`
- `src/data/biMockData.ts` — Remover dados de Telhado (ja nao tem, confirmar)

## Estilo Visual
- `max-w-[1400px] mx-auto px-3 md:px-4`
- Cards: `rounded-lg border bg-card border-border/50 hover:border-primary/40`
- KPIs: `text-3xl font-extrabold tabular-nums`
- Labels: `text-[10px] text-muted-foreground uppercase tracking-wider`
- Recharts: palette verde/azul/amarelo do tema
- Placeholders: badge `border-warning/50 text-warning`

## Dados Reais vs Mock

| Secao | Status |
|-------|--------|
| Sol SDR (V5-V8) | Dados reais |
| SolarMarket (V9-V11) | Dados reais |
| Cruzamentos B (C4-C6) | Dados reais |
| Cruzamento D C14 | Dados reais |
| Ads (V1-V4) | Mock |
| Sults (V12-V13) | Mock |
| Cruzamentos A, D parcial | Mock |

