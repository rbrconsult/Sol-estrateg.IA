

## Renomear "Simulação de Mensagens" para "Simular Operação"

### Alterações

**Arquivo: `src/pages/Ajuda.tsx`**
- Renomear o texto da tab de "Simulação de Mensagens" para "Simular Operação"
- Alterar o subtítulo do header de "Documentação, guias e simulação de mensagens" para "Documentação, guias e simulação de operação"

**Arquivo: `src/components/ajuda/MessageSimulation.tsx`**
- Manter o componente atual como placeholder temporário
- Preparar a estrutura para receber o HTML externo via `dangerouslySetInnerHTML` ou iframe, conforme o conteudo que voce enviar

### Resultado
A aba sera renomeada para "Simular Operação" e ficara pronta para incorporar o HTML assim que voce enviar.

