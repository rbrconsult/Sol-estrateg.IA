## Situacao Atual

- **RBR Consult** (`00000000-0000-0000-0000-000000000001`) e a organizacao padrao/matriz do sistema.
- **comercial@rbrconsult.com.br** ja e `super_admin` e pertence a RBR Consult.
- A Evolve Energia e a unica filial real.

## Make.com API — Regras Criticas

- **Base URL**: `https://us2.make.com/api/v2`
- **organizationId**: `5358787` | **teamId**: `1437295`
- Sempre passar `teamId=1437295` em TODOS os endpoints
- Nunca usar `/data-stores/{id}` direto → retorna null
- Endpoint correto para dados: `GET /data-store-data?dataStoreId={ID}&teamId=1437295`
- Paginacao: maximo 100 registros por request (`limit=100&offset=N`)
- Filtros sao client-side — API nao filtra por campo
- PATCH em thread_id: nunca tocar no campo "Data e Hora | Cadastro do Lead" → SC400

## Catalogo de Data Stores (Evolve - Team 1437295)

| DS Name              | DS ID  | Records | Paginas                                       |
|----------------------|--------|---------|-----------------------------------------------|
| thread_id            | 64798  | 904     | Dashboard, Leads, Robo SOL, FUP Frio, Vendedores |
| Comercial            | 84404  | 261     | Pipeline, Propostas, Comissoes, Forecast      |
| Sol_Producao_Olimpia | 81973  | 23      | Robo SOL (metricas)                           |
| Meta_Ads_Olimpia     | 82051  | 72      | Ads Performance                               |
| Google_Ads_Olimpia   | 82094  | 137     | Ads Performance                               |
| leads_site_geral     | 79120  | 357     | (reserva)                                     |
| Lista de Usuarios SM | 84503  | 25      | (referencia)                                  |

## Responsaveis / Closers (Evolve)

| Nome                 | ID SM  | Tipo   |
|----------------------|--------|--------|
| Gabriel Ferrari      | 3766   | Closer |
| Vinicius Selane      | 4938   | Closer |
| Vitoria Coelho       | 19015  | Closer |
| Danieli Nicasso      | 17170  | Closer |
| Devisson Apolinario  | 23012  | Closer |
| SOL SDR (robo)       | 11995  | Robo   |

## Filtros por Aba

| Aba          | Filtro principal                                              |
|--------------|---------------------------------------------------------------|
| Dashboard    | Todos — sem filtro (DS thread_id 64798)                       |
| Pipeline     | DS Comercial 84404 — todos                                    |
| Leads        | canal_origem — agrupar por valor (DS thread_id)               |
| Robo SOL     | closer_atribuido = null OU 11995 (so leads do robo)           |
| FUP Frio     | etapa_funil = "FOLLOW UP"                                     |
| Vendedores   | closer_atribuido != 11995 — agrupar por closer (so humanos)   |
| Ads          | DS Meta_Ads 82051 + Google_Ads 82094 — sem filtro             |

## Regra de Exibicao de Nomes

Sempre usar o campo `responsavel` (Nome) para plotar nomes de vendedores na UI.
Nunca exibir IDs numericos ao usuario.

## Filtro Multi-Tenant Comercial (Implementado)

### Fluxo de Acesso

1. **Super Admin** faz login → pagina de selecao mostra **escolha de Filial** antes do ambiente
   - **Global**: ve todos os dados sem filtro
   - **Evolve Energia** (ou futura filial): ve apenas dados dos responsaveis configurados
2. **Usuario normal**: vai direto para selecao de ambiente, dados filtrados pela sua org automaticamente

### Arquitetura

- `OrgFilterContext` — contexto global que armazena a filial selecionada (persistido em localStorage)
- `Selecao.tsx` — pagina intermediaria com step de filial (super admin) + step de ambiente
- `Sidebar` — mostra badge da filial ativa com botao para trocar
- `fetch-make-comercial` (Edge Function) — aceita `org_id` override do super admin, filtra por `responsavel_id`
- `useMakeComercialData` — passa org selecionada para a Edge Function

### Configuracao de Responsaveis (Admin > Filiais > Configs)

Para cada vendedor da filial:
- `config_key`: `resp_nome` (ex: `resp_gabriel`)
- `config_value`: ID do SolarMarket (ex: `"3766"`)
- `config_category`: `responsavel`

### Seguranca

- Usuarios normais sem responsaveis configurados recebem lista vazia
- Super admin em modo Global recebe tudo
- Super admin com filial selecionada recebe filtrado
- Filtro e server-side na Edge Function

---

## Módulo Campanhas — Plano de Evolução

### Visão Geral

Criar bloco **Campanhas** no sidebar com 3 subpáginas:
1. **Ads Performance** — desempenho de mídia paga (Google Ads + Meta Ads)
2. **Mídia x Receita** — retorno financeiro das campanhas
3. **GA4** — comportamento e conversão no site após o clique

**Narrativa:** `campanha → tráfego → lead → qualificação → oportunidade → venda → receita`

---

### Fase 0 — Integrações (Pré-requisito)

#### 0.1 Google Ads API
- **Edge Function:** `fetch-google-ads`
- **Autenticação:** OAuth2 (Refresh Token)
- **Secrets necessários:**
  - `GOOGLE_ADS_DEVELOPER_TOKEN` — token de desenvolvedor (MCC)
  - `GOOGLE_ADS_CLIENT_ID` — OAuth client ID
  - `GOOGLE_ADS_CLIENT_SECRET` — OAuth client secret
  - `GOOGLE_ADS_REFRESH_TOKEN` — refresh token
  - `GOOGLE_ADS_CUSTOMER_ID` — ID da conta (sem hifens)
  - `GOOGLE_ADS_LOGIN_CUSTOMER_ID` — ID MCC (se aplicável)
- **Endpoint:** Google Ads API v18 (REST)
  - `POST /v18/customers/{id}/googleAds:searchStream`
- **Dados:** campaign.name, campaign.id, campaign.status, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value, segments.date
- **Frequência:** Cron diário 06:00

#### 0.2 Meta Marketing API
- **Edge Function:** `fetch-meta-ads`
- **Autenticação:** Long-lived Access Token
- **Secrets necessários:**
  - `META_ADS_ACCESS_TOKEN`
  - `META_ADS_ACCOUNT_ID` (act_XXXXX)
- **Endpoint:** Graph API v21.0
  - `GET /act_{id}/insights?level=campaign&fields=campaign_name,impressions,clicks,spend,cpc,cpm,ctr,actions,cost_per_action_type`
- **Frequência:** Cron diário 06:00

#### 0.3 Google Analytics 4 Data API
- **Edge Function:** `fetch-ga4-data`
- **Autenticação:** Service Account (reutilizar `GOOGLE_SERVICE_ACCOUNT_KEY` existente)
- **Secret adicional:** `GA4_PROPERTY_ID`
- **Endpoint:** Analytics Data API v1beta — `POST /v1beta/properties/{id}:runReport`
- **Dimensões:** sessionSource, sessionMedium, sessionCampaignName, landingPage, date
- **Métricas:** sessions, totalUsers, engagedSessions, engagementRate, averageSessionDuration, keyEvents, conversions, purchaseRevenue
- **Frequência:** Cron diário 06:00

---

### Fase 1 — Modelagem de Dados

#### Tabela: `campaign_metrics`
```sql
CREATE TABLE public.campaign_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  canal text NOT NULL, -- 'google_ads' | 'meta_ads'
  conta_id text,
  campaign_id text NOT NULL,
  campaign_name text NOT NULL,
  campaign_status text,
  data date NOT NULL,
  impressoes integer DEFAULT 0,
  cliques integer DEFAULT 0,
  investimento numeric(12,2) DEFAULT 0,
  ctr numeric(6,4) DEFAULT 0,
  cpc numeric(8,2) DEFAULT 0,
  cpm numeric(8,2) DEFAULT 0,
  leads integer DEFAULT 0,
  cpl numeric(8,2) DEFAULT 0,
  conversoes integer DEFAULT 0,
  valor_conversoes numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(canal, campaign_id, data)
);
```

#### Tabela: `ga4_metrics`
```sql
CREATE TABLE public.ga4_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  data date NOT NULL,
  source text,
  medium text,
  campaign text,
  landing_page text,
  sessoes integer DEFAULT 0,
  usuarios integer DEFAULT 0,
  sessoes_engajadas integer DEFAULT 0,
  taxa_engajamento numeric(6,4) DEFAULT 0,
  tempo_medio_engajamento numeric(8,2) DEFAULT 0,
  eventos_chave integer DEFAULT 0,
  conversoes integer DEFAULT 0,
  receita numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(data, source, medium, campaign, landing_page)
);
```

#### RLS
- SELECT para membros da org + ALL para super_admin

---

### Fase 2 — Edge Functions

| Function | API | Autenticação | Armazenamento |
|----------|-----|-------------|---------------|
| `fetch-google-ads` | Google Ads v18 REST | OAuth2 refresh | campaign_metrics |
| `fetch-meta-ads` | Meta Graph v21.0 | Access token | campaign_metrics |
| `fetch-ga4-data` | GA4 Data v1beta | Service account JWT | ga4_metrics |

Todas com: CORS headers, retry com backoff, validação de secrets.

---

### Fase 3 — Navegação (Sidebar)

```
📊 Campanhas (grupo colapsável)
  ├── Ads Performance    → /ads-performance
  ├── Mídia x Receita    → /midia-receita
  └── GA4                → /ga4
```

---

### Fase 4 — Páginas

#### 4.1 Ads Performance (revisão)
- **KPIs:** Investimento | Impressões | Cliques | CTR | CPC | CPM | Leads | CPL | Leads Qual. | Custo/Qual.
- **Tabela:** por campanha (canal, campanha, investimento, impressões, cliques, CTR, CPC, leads, CPL, qual., custo/qual.)
- **Gráficos:** investimento/leads/CPL por campanha, Google vs Meta, ranking qualificação

#### 4.2 Mídia x Receita (revisão)
- **KPIs:** Investimento | Vendas | Receita | Ticket Médio | CAC | ROAS | ROI
- **Tabela:** por campanha (canal, campanha, investimento, leads, opp., vendas, receita, ticket, CAC, ROAS, ROI)
- **Gráficos:** receita/ROAS por campanha, investimento x receita, alertas de ineficiência

#### 4.3 GA4 (nova)
- **KPIs:** Sessões | Usuários | Engajadas | Taxa Eng. | Tempo Médio | Eventos | Conversões | Receita
- **Tabela:** source/medium, campaign, landing page, sessões, usuários, engajadas, taxa, eventos, conversões, receita
- **Gráficos:** sessões/conversões por campanha, performance por landing page, funil visita→lead→conversão

---

### Fase 5 — Cruzamento

- `campaign_metrics.campaign_name` ↔ `leads_consolidados.campanha` → leads qualificados por campanha
- `ga4_metrics.campaign` ↔ `campaign_metrics.campaign_name` → correlação mídia x site
- Hooks: `useCampaignMetrics()`, `useGA4Metrics()`, `useCampaignRevenue()`

---

### Secrets Necessários (Ação do Usuário)

| Secret | Status |
|--------|--------|
| `GOOGLE_ADS_DEVELOPER_TOKEN` | ❌ Pendente |
| `GOOGLE_ADS_CLIENT_ID` | ❌ Pendente |
| `GOOGLE_ADS_CLIENT_SECRET` | ❌ Pendente |
| `GOOGLE_ADS_REFRESH_TOKEN` | ❌ Pendente |
| `GOOGLE_ADS_CUSTOMER_ID` | ❌ Pendente |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | ❌ Se MCC |
| `META_ADS_ACCESS_TOKEN` | ❌ Pendente |
| `META_ADS_ACCOUNT_ID` | ❌ Pendente |
| `GA4_PROPERTY_ID` | ❌ Pendente |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | ✅ Já existe |

---

### Prioridade

**P1:** Tabelas + Edge Functions + Secrets + Navegação + Revisar páginas + Criar GA4
**P2:** Filtros avançados + Rankings + Alertas visuais + Comparativos
**P3:** Atribuição avançada + Coorte + Preditivo
