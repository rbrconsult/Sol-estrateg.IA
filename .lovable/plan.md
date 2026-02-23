

## Liberar Visibilidade de Chamados e Metricas para Todos os Usuarios

### O que muda

1. **Todos os usuarios autenticados podem ver todos os chamados** - As politicas de seguranca (RLS) de SELECT serao atualizadas para permitir que qualquer usuario logado veja todos os tickets, mensagens e historico de status.

2. **Metricas visiveis para todos** - O componente TeamMetrics (painel de metricas da equipe) sera exibido para todos os usuarios, nao apenas para super_admin.

### Detalhes tecnicos

**Migracao SQL** - Atualizar 3 politicas RLS de SELECT:

1. `support_tickets` SELECT: trocar para `USING (true)` (qualquer usuario autenticado pode ver)
2. `ticket_messages` SELECT: trocar para `USING (true)`  
3. `ticket_status_history` SELECT: trocar para `USING (true)`

As politicas de INSERT, UPDATE e DELETE permanecem inalteradas (protegidas).

**Arquivo: `src/pages/Chamados.tsx`**

- Remover a condicao `userRole === "super_admin"` que restringe a exibicao do componente `<TeamMetrics />`, tornando-o visivel para todos.

