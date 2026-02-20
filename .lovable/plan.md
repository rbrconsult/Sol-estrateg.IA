
# Plano de Correção de Segurança - Evolve CRM

## Resumo
Corrigir vulnerabilidades identificadas na análise de segurança sem impactar a usabilidade.

---

## 1. Hash de Tokens de Sessão (CRÍTICO)
**Problema:** Tokens em texto plano na `user_sessions`, acessíveis via SELECT.

**Solução:**
- Habilitar extensão `pgcrypto` 
- Criar função `hash_session_token(text)` com SHA-256
- Edge function `track-session`: fazer hash antes de INSERT/query
- Invalidar sessões existentes (forçar re-login único)
- Remover acesso direto do usuário à tabela `user_sessions`

**Impacto:** Re-login único. Transparente depois.

---

## 2. Remover RLS desnecessário em `user_sessions`
**Problema:** Usuários podem SELECT/UPDATE/INSERT direto, expondo tokens.

**Solução:** Remover políticas de usuário. Manter apenas super_admin. Toda operação já usa edge function com service role.

**Impacto:** Nenhum.

---

## 3. Remover INSERT direto em `access_logs`
**Problema:** Qualquer usuário pode inserir logs (poluição de audit trail).

**Solução:** Remover política INSERT de usuário. Inserção já acontece via edge function.

**Impacto:** Nenhum.

---

## 4. Habilitar Proteção Contra Senhas Vazadas
**Problema:** Senhas comprometidas podem ser usadas.

**Solução:** Configurar no auth (HaveIBeenPwned check).

**Impacto:** Senhas fracas/vazadas rejeitadas no cadastro.

---

## 5. Permitir Agentes Verem Tickets Atribuídos
**Problema:** `assigned_to` não tem acesso via RLS.

**Solução:** Adicionar `OR assigned_to = auth.uid()` nas políticas SELECT/UPDATE de `support_tickets` e `ticket_messages`.

**Impacto:** Melhora usabilidade para agentes.

---

## 6. Super Admin ver perfis (profiles)
**Solução:** Adicionar SELECT para super_admin na tabela `profiles`.

---

## Ordem de Execução
1. Migração SQL (pgcrypto + hash function + RLS adjustments)
2. Atualizar edge function `track-session`
3. Habilitar leaked password protection
4. Marcar findings como resolvidos
