

# Adicionar 4 componentes da Leads ao SOL Insights (mock data)

## Componentes a adicionar

### 1. Sol Hoje — Atividade Diaria (7 dias)
Seção com destaque do dia (qualificados, scores, quentes, mornos, frios) e mini barras dos últimos 7 dias. Posicionamento: logo após os KPIs (ROW 1), antes do Pipeline.

### 2. Alertas & Insights (barra lateral)
Coluna lateral com cards coloridos (vermelho = atenção, amarelo = info, verde = positivo). Será integrada ao lado da seção de Origem dos Leads (ROW 3), transformando o layout em grid 3 colunas.

### 3. Temperatura por Etapa
Barras empilhadas (quente/morno/frio) por etapa do funil. Posicionamento: após o heatmap (ROW 5), junto com Performance Sol num grid de 2 colunas.

### 4. Tabela de Leads Detalhados
Tabela compacta com os campos: Cliente, Etapa, Temperatura (dot colorido), Score, SLA, Status FUP, Valor. Com timeline expandível mockada. Posicionamento: após Temperatura por Etapa, antes do rodapé.

## Dados mock necessarios

Adicionar ao `src/data/conferenciaMockData.ts`:

- `solHojeMock`: array de 7 dias com qualificados, scores, quentes, mornos, frios
- `alertasMock`: array de 5-6 alertas com type, title, desc
- `temperaturaPorEtapaMock`: array por etapa com quente, morno, frio, sem
- `tabelaLeadsMock`: array de ~15 leads com nome, etapa, temperatura, score, sla, status, valor, e historico de interações mockado

## Layout final do SOL Insights

```text
ROW 1: KPIs (7 cards)
ROW 1.5: SOL HOJE (atividade diária + 7 dias mini barras)  [NOVO]
ROW 2: Pipeline Real + Micro Funil + FUP Frio
ROW 3: FUP Frio ROI | Origem | Alertas & Insights  [MODIFICADO - 3 colunas]
ROW 4: Desqualificação | Mensagens | SLA
ROW 5: Mapa de Calor
ROW 6: Taxa por Tentativa | Temperatura por Etapa  [MODIFICADO - 2 colunas]
ROW 7: Tabela de Leads Detalhados  [NOVO]
RODAPÉ
```

## Detalhes tecnicos

### Arquivo: `src/data/conferenciaMockData.ts`
- Adicionar 4 novos exports com dados mock consistentes com o pipeline existente (342 leads total, distribuição coerente por etapa)

### Arquivo: `src/pages/Conferencia.tsx`
- Importar novos dados mock
- Inserir seção Sol Hoje (copiar padrão visual da Leads: grid 5 colunas + barras verticais)
- Modificar ROW 3 para grid de 3 colunas, adicionando coluna de Alertas
- Adicionar Temperatura por Etapa ao lado da Taxa por Tentativa
- Adicionar Tabela de Leads com expand/collapse para timeline (usando estado `expandedLead`)
- Reutilizar o componente TempDot e padrões visuais da Leads (badges, cores, tipografia)

Total: 2 arquivos modificados, sem novos arquivos, sem dependências adicionais.
