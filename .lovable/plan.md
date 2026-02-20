
# Sistema de Chamados com SLA

## Objetivo
Criar uma pagina de chamados integrada ao Evolve Sales Insights onde o cliente abre tickets de suporte, com contagem automatica de SLA desde a abertura ate a resolucao.

## Estrutura do Banco de Dados

Duas tabelas novas:

**support_tickets** - Armazena os chamados
- id, titulo, descricao, categoria (bug, duvida, melhoria, urgencia)
- prioridade (baixa, media, alta, critica) com SLAs diferentes
- status (aberto, em_andamento, resolvido, fechado)
- user_id (quem abriu), assigned_to (quem atende)
- created_at (inicio do SLA), resolved_at, closed_at
- sla_deadline (calculado automaticamente pela prioridade)

**ticket_messages** - Historico de mensagens/atualizacoes
- id, ticket_id, user_id, message, created_at

### SLAs por Prioridade
| Prioridade | SLA Resposta | SLA Resolucao |
|------------|-------------|---------------|
| Critica    | 1 hora      | 4 horas       |
| Alta       | 4 horas     | 24 horas      |
| Media      | 8 horas     | 48 horas      |
| Baixa      | 24 horas    | 72 horas      |

## Interface - Pagina /chamados

### 1. Cabecalho com KPIs
- Total de chamados abertos
- Chamados dentro do SLA (verde)
- Chamados proximo de vencer (amarelo)
- Chamados fora do SLA (vermelho)

### 2. Formulario de Abertura
- Titulo, descricao, categoria, prioridade
- Ao salvar, calcula automaticamente o sla_deadline

### 3. Lista de Chamados
- Tabela com colunas: ID, Titulo, Prioridade, Status, SLA restante (timer visual)
- Badge de cor indicando tempo restante do SLA
- Clique para abrir detalhes e historico de mensagens

### 4. Timer de SLA
- Contador regressivo em tempo real mostrando quanto tempo resta
- Muda de cor: verde > amarelo (25% restante) > vermelho (vencido)

## Navegacao
- Novo item "Chamados" no sidebar com icone de headset
- Rota /chamados protegida por autenticacao

## Seguranca (RLS)
- Usuarios veem apenas seus proprios chamados
- Super admins veem todos os chamados
- Qualquer usuario autenticado pode criar chamados

## Detalhes Tecnicos

### Tabelas SQL
```text
- support_tickets: com enum ticket_priority e ticket_status
- ticket_messages: com FK para support_tickets
- RLS policies para ambas as tabelas
- Realtime habilitado para atualizacoes em tempo real
```

### Componentes React
- src/pages/Chamados.tsx - pagina principal
- src/components/chamados/TicketForm.tsx - formulario de abertura
- src/components/chamados/TicketList.tsx - lista com SLA timer
- src/components/chamados/TicketDetail.tsx - detalhes + mensagens
- src/components/chamados/SLATimer.tsx - contador regressivo visual

### Alteracoes em arquivos existentes
- src/App.tsx - nova rota /chamados
- src/components/layout/Sidebar.tsx - novo item no menu

## Estimativa
- 4-6 mensagens para implementar completo
- ~10-15 creditos
