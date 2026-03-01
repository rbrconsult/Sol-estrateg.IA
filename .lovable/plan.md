

## Incorporar HTML em "Simular Operação"

### Abordagem
Substituir o componente `MessageSimulation` atual por um **iframe** que carrega o arquivo HTML completo (`simulacao-v4.html`). O iframe e a melhor opcao porque o HTML possui seus proprios estilos, scripts e layout independente que nao devem conflitar com o CSS do app.

### Alteracoes

**1. Copiar arquivo HTML para o projeto**
- Copiar `user-uploads://simulacao-v4.html` para `public/simulacao-v4.html` (pasta public para acesso direto via URL)

**2. Atualizar `src/pages/Ajuda.tsx`**
- Remover o import do `MessageSimulation`
- Substituir o conteudo da aba "Simular Operacao" por um `iframe` apontando para `/simulacao-v4.html`
- O iframe ocupara toda a altura disponivel (`h-[calc(100vh-12rem)]`) com `w-full`, sem bordas

**3. Arquivo `src/components/ajuda/MessageSimulation.tsx`**
- Manter no projeto (nao deletar), mas nao sera mais usado na pagina de Ajuda

### Resultado
A aba "Simular Operacao" exibira o simulador SOl.estrateg.IA completo, com sidebar, chat e todos os fluxos interativos, incorporado diretamente na pagina de Ajuda.

