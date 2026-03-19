

## Situacao Atual

- **RBR Consult** (`00000000-0000-0000-0000-000000000001`) e a organizacao padrao/matriz do sistema. Todos os novos usuarios sao atribuidos a ela automaticamente (trigger `handle_new_user`).
- **comercial@rbrconsult.com.br** ja e `super_admin` e pertence a RBR Consult.
- A Evolve Energia e a unica filial real.

## O que acho

RBR Consult nao deve aparecer como filial na listagem porque ela e a **matriz** — a entidade administrativa raiz. Faz sentido:

1. **Ocultar RBR Consult da listagem de filiais** — filtrar a org padrao (`00000000-...0001`) na query do `OrganizationsTab`, para que apenas filiais reais aparecam.
2. **Manter RBR Consult no banco** — ela continua sendo a org padrao para o trigger de novos usuarios e para dados nao atribuidos a nenhuma filial.
3. **Super Admin = acesso global** — `comercial@rbrconsult.com.br` ja e `super_admin`, o que ja lhe da acesso a todas as filiais via RLS (`has_role(auth.uid(), 'super_admin')`). Nenhuma mudanca de permissao necessaria.

## Plano de Implementacao

### 1. Ocultar a org padrao na aba Filiais
- Em `OrganizationsTab.tsx`, na funcao `fetchOrganizations`, filtrar a org com id `00000000-0000-0000-0000-000000000001` do resultado antes de setar no estado.
- Adicionar um banner/info discreto no topo: "Matriz: RBR Consult (administracao global)" para contexto.

### 2. Nenhuma alteracao no banco
- A trigger `handle_new_user` continua apontando para a org padrao.
- As RLS policies continuam funcionando normalmente.
- O super_admin ja tem acesso total a todas as filiais.

---

**Resumo**: Apenas 1 arquivo editado (`OrganizationsTab.tsx`) para ocultar a RBR Consult da lista de filiais, mantendo-a como org administrativa interna.

