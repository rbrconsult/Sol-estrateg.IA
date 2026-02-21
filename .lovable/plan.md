
# Pausar SLA quando Aguardando Usuario

## Problema
Atualmente o SLA continua contando mesmo quando o ticket esta no status "aguardando_usuario". O tempo que o usuario leva para responder nao deveria contar no prazo de SLA.

## Solucao

### 1. Novas colunas no banco de dados
Adicionar duas colunas na tabela `support_tickets`:
- `sla_paused_at` (timestamp) - momento em que o SLA foi pausado (nulo quando ativo)
- `sla_paused_total_ms` (bigint, default 0) - tempo total acumulado de pausa em milissegundos

### 2. Logica de pausa/retomada

Quando o status muda **para** `aguardando_usuario`:
- Gravar `sla_paused_at = now()`

Quando o status muda **de** `aguardando_usuario` para outro (usuario responde):
- Calcular tempo pausado: `now() - sla_paused_at`
- Somar ao `sla_paused_total_ms`
- Estender `sla_deadline` pelo tempo pausado
- Limpar `sla_paused_at` (setar null)

### 3. Arquivos a alterar

**Migracao SQL** - Adicionar colunas `sla_paused_at` e `sla_paused_total_ms`

**`src/components/chamados/SLATimer.tsx`** - Mostrar indicador "Pausado" quando `sla_paused_at` estiver preenchido (status aguardando_usuario)

**`src/components/chamados/TicketDetail.tsx`** - Nos pontos de transicao de status:
- `handleReturnToUser`: setar `sla_paused_at = now()` ao devolver ao usuario
- `handleSendMessage` (usuario responde enquanto aguardando): calcular tempo pausado, estender deadline, limpar pausa

**`supabase/functions/whatsapp-webhook/index.ts`** - Quando usuario responde via WhatsApp e status muda de `aguardando_usuario`: mesma logica de calculo e extensao do deadline

### 4. Detalhes tecnicos

```text
Fluxo de pausa:
  Admin devolve ticket
    -> status = aguardando_usuario
    -> sla_paused_at = now()
    -> SLA Timer mostra "Pausado"

  Usuario responde (painel ou WhatsApp)
    -> tempo_pausado = now() - sla_paused_at
    -> sla_paused_total_ms += tempo_pausado
    -> sla_deadline += tempo_pausado
    -> sla_paused_at = null
    -> status = em_andamento
    -> SLA Timer volta a contar normalmente
```

O SLATimer recebera uma nova prop `pausedAt` (opcional). Quando preenchida, exibira um badge "Pausado" em vez da contagem regressiva.
