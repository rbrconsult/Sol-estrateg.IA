

## Adicionar Gestao de Organizacoes no Painel Admin

### O que sera feito

Adicionar uma nova aba "Organizacoes" no painel Admin com funcionalidades para:
- Listar todas as organizacoes cadastradas
- Criar novas organizacoes
- Editar nome/slug de organizacoes existentes
- Ver membros de cada organizacao
- Vincular/desvincular usuarios a organizacoes
- Ao criar usuario, selecionar a organizacao

---

### Detalhes tecnicos

**Arquivo: `src/pages/Admin.tsx`**

1. Adicionar nova aba "Organizacoes" ao componente `Tabs`
2. Criar estados para:
   - Lista de organizacoes
   - Dialog de criar/editar organizacao
   - Dialog de gerenciar membros
3. Adicionar funcoes:
   - `fetchOrganizations()` - buscar todas as organizacoes
   - `handleCreateOrganization()` - criar nova organizacao
   - `handleUpdateOrganization()` - editar organizacao
   - `handleDeleteOrganization()` - excluir organizacao (se nao tiver membros)
   - `fetchOrgMembers(orgId)` - buscar membros de uma organizacao
   - `handleAddMember(orgId, userId)` - vincular usuario
   - `handleRemoveMember(orgId, userId)` - desvincular usuario
4. Atualizar o dialog de criar usuario para incluir campo de selecao de organizacao
5. Atualizar o card de stats para incluir contagem de organizacoes

**Nenhuma alteracao de banco de dados necessaria** - as tabelas `organizations` e `organization_members` ja existem com as politicas RLS corretas para super_admin.

### Funcionalidades da aba Organizacoes

| Funcionalidade | Descricao |
|---|---|
| Tabela de organizacoes | Nome, slug, qtd membros, data criacao |
| Botao "Nova Organizacao" | Dialog com campos nome e slug |
| Botao "Editar" por linha | Editar nome/slug da organizacao |
| Botao "Membros" por linha | Abrir dialog com lista de membros, opcao de adicionar/remover |
| Botao "Excluir" por linha | Excluir organizacao (apenas se sem membros) |

### Fluxo de vincular usuario a empresa

No dialog de "Membros" de uma organizacao:
- Lista os membros atuais com nome, email e papel
- Select para escolher um usuario existente (que nao esteja na org)
- Botao para adicionar
- Botao para remover membro da organizacao

### Atualizacao no fluxo de criar usuario

O dialog de "Novo Usuario" passara a incluir um campo `Select` para escolher a organizacao. O default sera a organizacao padrao (RBR Consult). A edge function `manage-users` sera atualizada para aceitar o `organization_id` e vincular o usuario na organizacao correta.

