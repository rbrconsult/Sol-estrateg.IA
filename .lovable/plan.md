
## Controle de Encerramento de Chamados - Apenas Super Admin

### O que muda

1. **Apenas super_admin pode encerrar chamados** - O botao de resolver sera exibido somente para usuarios com role `super_admin`. Usuarios comuns nao terao mais essa opcao.

2. **Dialog de resolucao com escolha de tipo de horas** - Ao clicar em resolver, o super admin vera um dialog com duas opcoes via radio buttons:
   - **Horas manuais**: campo para digitar a quantidade de horas gastas (ex: 2.5)
   - **Horas reais**: calcula automaticamente o tempo decorrido entre abertura e encerramento (descontando pausas de SLA)

3. **Calculo automatico de horas reais** - Quando o super admin selecionar "Horas reais", o sistema calcula: `(now - created_at - sla_paused_total_ms)` convertido em horas e exibe o valor calculado antes de confirmar.

### Detalhes tecnicos

**Arquivo: `src/components/chamados/TicketDetail.tsx`**

- Remover o botao de resolver para usuarios nao-super_admin (linhas 503-513). Apenas `userRole === "super_admin"` vera o botao.
- Alterar o clique do botao de resolver: sempre abrir o dialog (remover o atalho direto).
- Adicionar estado `hoursMode` com valores `"manual"` ou `"real"`.
- No dialog de resolucao, adicionar `RadioGroup` com duas opcoes:
  - "Horas manuais" - mostra o campo de input numerico existente
  - "Horas reais" - calcula e exibe o tempo real em horas (read-only)
- No `handleResolve`, determinar o valor de `work_hours` conforme o modo selecionado:
  - Manual: usa o valor digitado
  - Real: calcula `(Date.now() - created_at - sla_paused_total_ms) / 3600000`

Nenhuma alteracao no banco de dados e necessaria.
