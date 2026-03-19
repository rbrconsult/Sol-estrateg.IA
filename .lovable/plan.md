## Situacao Atual

- **RBR Consult** (`00000000-0000-0000-0000-000000000001`) e a organizacao padrao/matriz do sistema.
- **comercial@rbrconsult.com.br** ja e `super_admin` e pertence a RBR Consult.
- A Evolve Energia e a unica filial real.

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
- `config_key`: `resp_nome` (ex: `resp_joao`)
- `config_value`: ID do SolarMarket (ex: `"12345"`)
- `config_category`: `responsavel`

### Seguranca

- Usuarios normais sem responsaveis configurados recebem lista vazia
- Super admin em modo Global recebe tudo
- Super admin com filial selecionada recebe filtrado
- Filtro e server-side na Edge Function
