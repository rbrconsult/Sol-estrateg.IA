
## Plano de Preparacao para Multi-Tenancy

### Situacao atual

A plataforma e single-tenant: todos os usuarios compartilham os mesmos dados, sem separacao por empresa/organizacao. Nao existe conceito de "tenant" no banco de dados.

### Estrategia recomendada: Abordagem incremental

Em vez de refatorar tudo agora, a ideia e preparar a base de dados e o codigo de forma que a transicao para multi-tenant seja simples quando necessario.

---

### Fase 1 - Criar a infraestrutura de tenants (fazer agora)

**1. Tabela `organizations`**

Criar uma tabela central para representar cada empresa/tenant:

```text
organizations
  - id (uuid, PK)
  - name (text)
  - slug (text, unique) -- identificador amigavel
  - created_at (timestamptz)
  - settings (jsonb) -- configuracoes por tenant
```

**2. Tabela `organization_members`**

Vincular usuarios a organizacoes com papeis:

```text
organization_members
  - id (uuid, PK)
  - organization_id (uuid, FK -> organizations)
  - user_id (uuid, FK -> auth.users)
  - role (app_role)
  - created_at (timestamptz)
  - UNIQUE(organization_id, user_id)
```

**3. Adicionar `organization_id` nas tabelas principais**

Adicionar coluna `organization_id` (nullable por enquanto, com default para o tenant atual) nas tabelas:

- `support_tickets`
- `ticket_messages` (herda do ticket)
- `profiles`

**4. Funcao helper `get_user_org()`**

Criar funcao SECURITY DEFINER que retorna o `organization_id` do usuario atual:

```text
get_user_org(user_id uuid) -> uuid
```

**5. Popular dados existentes**

Migrar todos os registros existentes para pertencer a uma organizacao "default" (RBR Consult).

---

### Fase 2 - Atualizar RLS (fazer agora)

Atualizar as politicas RLS para filtrar por `organization_id`, mantendo compatibilidade:

```text
-- Exemplo para support_tickets SELECT:
USING (
  organization_id = get_user_org(auth.uid())
  OR has_role(auth.uid(), 'super_admin')
)
```

Isso garante que cada usuario so ve dados da sua organizacao, enquanto super_admin ve tudo.

---

### Fase 3 - Ajustes no frontend (fazer agora, minimos)

- Nenhuma mudanca visual necessaria para o usuario final
- Apenas garantir que ao criar tickets/registros, o `organization_id` seja incluido automaticamente (via default no banco ou no codigo)
- Adicionar o `organization_id` do usuario ao contexto de autenticacao (`useAuth`)

---

### Fase 4 - Painel de gestao de tenants (fazer no futuro)

Quando for necessario adicionar novos clientes:

- Tela de cadastro de organizacoes no painel Admin
- Convite de usuarios para organizacoes
- Configuracoes por tenant (logo, SLA personalizado, etc.)
- Dashboard do super_admin com visao cross-tenant

---

### Resumo do que sera feito agora

| Item | Descricao |
|------|-----------|
| Tabela `organizations` | Estrutura central de tenants |
| Tabela `organization_members` | Vinculo usuario-organizacao |
| Coluna `organization_id` | Adicionada em `support_tickets` e `profiles` |
| Funcao `get_user_org()` | Helper para RLS |
| Migracao de dados | Todos os registros atuais vinculados ao tenant default |
| RLS atualizado | Filtro por organizacao em todas as tabelas |
| Frontend | `organization_id` injetado automaticamente nas operacoes |

### O que NAO muda para o usuario

- Interface permanece identica
- Fluxo de login nao muda
- Todos os dados continuam visiveis (pois todos pertencem ao mesmo tenant)
- Performance nao e impactada (indice na coluna `organization_id`)
