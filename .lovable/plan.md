

# Dashboard de Leads e Robo -- Plano de Implementacao

## Visao Geral

Criar uma nova pagina `/leads` com dashboard completo de captacao de leads e metricas do robo de atendimento. Inicialmente com dados mockados, depois substituiremos por dados reais do Make/banco de dados.

---

## Estrutura da Pagina

A pagina sera dividida em **4 blocos principais**:

```text
+------------------------------------------------------------------+
|  BLOCO 1: KPIs Gerais (cards no topo)                            |
|  [Total Leads] [Qualificados] [Desqualificados] [Taxa Qualif.]   |
+------------------------------------------------------------------+
|  BLOCO 2: Analise de Leads                                       |
|  +---------------------------+  +------------------------------+ |
|  | Leads por Origem (pizza)  |  | Leads por Dia da Semana      | |
|  | Meta, LP, Site, Orcamento |  | (barras - Seg a Dom)         | |
|  +---------------------------+  +------------------------------+ |
|  +---------------------------+  +------------------------------+ |
|  | Leads por Horario (barras)|  | Leads por Cidade/UF (tabela) | |
|  | (faixas horárias)         |  | + "Quanto Gasta" por regiao  | |
|  +---------------------------+  +------------------------------+ |
|  +------------------------------------------------------+       |
|  | Tendencia de Leads ao longo do tempo (area chart)     |       |
|  +------------------------------------------------------+       |
+------------------------------------------------------------------+
|  BLOCO 3: Metricas do Robo                                       |
|  [Atendidos] [Msgs Enviadas] [Tempo Medio Resp.] [Tempo FUP]    |
|  +---------------------------+  +------------------------------+ |
|  | Agendamentos por Tipo     |  | Comportamento FUP Frio       | |
|  | WhatsApp/Reuniao/Ligacao  |  | (timeline ou barras)         | |
|  +---------------------------+  +------------------------------+ |
+------------------------------------------------------------------+
|  BLOCO 4: Tabela Detalhada de Leads                              |
|  Data | Origem | Cidade | UF | Gasto | Status | Agendamento     |
+------------------------------------------------------------------+
```

---

## O Que Voce Precisa Me Fornecer

Para estruturar os dados mockados de forma realista, preciso que voce me confirme os **campos** que chegam do Make. Aqui esta o que estou assumindo:

| Campo | Descricao |
|-------|-----------|
| `data_entrada` | Data/hora que o lead chegou |
| `origem` | Meta, Landing Page, Site, Orcamento, Organico |
| `nome` | Nome do lead |
| `telefone` | Telefone |
| `cidade` | Cidade |
| `uf` | Estado |
| `gasto_mensal` | Quanto gasta de energia |
| `status` | qualificado, desqualificado, pendente |
| `tipo_agendamento` | whatsapp, reuniao_online, ligacao, null |
| `robo_mensagens` | Qtde de mensagens que o robo enviou |
| `robo_tempo_resposta_lead` | Tempo que o lead demorou a responder (segundos) |
| `robo_tempo_fup_frio` | Tempo medio de retorno no FUP frio |
| `robo_atendeu` | Se o robo atendeu (boolean) |

---

## Detalhes Tecnicos

### Arquivos a Criar

1. **`src/pages/Leads.tsx`** -- Pagina principal do dashboard com todos os blocos
2. **`src/data/leadsMockData.ts`** -- Dados mockados (50-100 leads) com distribuicao realista por origem, cidade, horario, dia da semana
3. **`src/components/leads/LeadsKPIs.tsx`** -- Cards de KPI do topo (Total, Qualificados, Desqualificados, Taxa)
4. **`src/components/leads/LeadsByOrigin.tsx`** -- Grafico pizza por origem
5. **`src/components/leads/LeadsByDayOfWeek.tsx`** -- Grafico barras por dia da semana
6. **`src/components/leads/LeadsByHour.tsx`** -- Grafico barras por faixa horaria
7. **`src/components/leads/LeadsByLocation.tsx`** -- Tabela cidade/UF com gasto medio
8. **`src/components/leads/RoboMetrics.tsx`** -- KPIs e graficos do robo
9. **`src/components/leads/LeadsTable.tsx`** -- Tabela detalhada com todos os leads

### Arquivos a Alterar

1. **`src/App.tsx`** -- Adicionar rota `/leads`
2. **`src/components/layout/Sidebar.tsx`** -- Adicionar item "Leads" no menu

### Bibliotecas Utilizadas

- `recharts` (ja instalado) para todos os graficos
- Componentes UI existentes (`Card`, `Table`, `Tabs`, `Badge`)
- `date-fns` (ja instalado) para manipulacao de datas
- `lucide-react` para icones

### Padrao de Dados Mock

Os dados mockados terao distribuicao realista:
- **Origens**: Meta (40%), Landing Page (25%), Site (15%), Orcamento (12%), Organico (8%)
- **Dias**: maior volume Seg-Qui, menor Sab-Dom
- **Horarios**: pico entre 9h-12h e 14h-17h
- **Cidades**: MG, SP, RJ, ES com pesos diferentes
- **Status**: 45% qualificados, 30% desqualificados, 25% pendentes

---

## Sequencia de Implementacao

1. Criar os dados mockados (`leadsMockData.ts`)
2. Criar os componentes de grafico e KPI (todos em paralelo)
3. Criar a pagina principal (`Leads.tsx`) montando os blocos
4. Registrar a rota e o menu
5. Revisar visual e ajustar responsividade

