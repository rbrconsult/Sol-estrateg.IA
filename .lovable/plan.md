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
