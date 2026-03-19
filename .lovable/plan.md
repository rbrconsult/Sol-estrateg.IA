

## Filtro de Dados Comerciais por Responsavel ID

### Entendimento

O campo `responsavel_id` no Data Store 84404 corresponde ao `responsavel.id` do SolarMarket (GraphQL). E o identificador unico do vendedor. Cada filial cadastra os IDs dos seus vendedores no Admin, e a Edge Function filtra os registros server-side.

### Nomenclatura

Manter `responsavel_id` como nome padrao — e claro, vem direto do Make/SolarMarket, e e o campo de filtro.

### Plano

**1. Edge Function `fetch-make-comercial/index.ts`**

- Criar um admin client (service role) para consultas internas
- Identificar o `user_id` do token JWT via `getClaims`
- Verificar se e `super_admin` via `has_role` — se sim, retorna tudo sem filtro
- Buscar `organization_id` do usuario via `get_user_org`
- Buscar todos os `config_value` de `organization_configs` onde `organization_id` = org do usuario e `config_category = 'responsavel'`
- Apos buscar todos os registros do Data Store, filtrar: manter apenas os que tem `responsavel_id` (campo raw do DS) presente na lista de IDs configurados
- Se nenhum responsavel configurado, retornar vazio (seguranca — nao vazar dados)

**2. Hook `useMakeComercialData.ts`**

- Adicionar `responsavelId` ao interface `ComercialRecord`
- Parsear `d.responsavel_id` no `parseRecords`

**3. Admin (Filiais > Configs) — sem mudanca de codigo**

Os responsaveis ja sao cadastrados com `config_category: 'responsavel'`. O valor (`config_value`) deve ser o ID do SolarMarket (ex: `"12345"`). O CRUD existente ja permite gerenciar isso.

### Fluxo

```text
Admin cadastra:
  config_key: "resp_joao"
  config_value: "12345"        ← responsavel.id do SolarMarket
  config_category: "responsavel"

Edge Function:
  1. user → get_user_org → org_id
  2. org_id → organization_configs (category=responsavel) → ["12345", "67890"]
  3. Data Store records → filtrar onde responsavel_id ∈ ["12345", "67890"]
  4. Retornar apenas registros filtrados
```

### Arquivos modificados
- `supabase/functions/fetch-make-comercial/index.ts` — filtro server-side
- `src/hooks/useMakeComercialData.ts` — expor `responsavelId` no tipo

