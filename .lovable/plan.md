

# Detalhar Modulo e Run ID nos Erros Make

## Situacao Atual

- **Execucoes incompletas (stopped)**: ja capturam `module_name`, `module_app` e `failed_module_index` da API do Make
- **Logs de erro/warning**: o modulo fica como "Unknown" porque a API de logs nao retorna detalhes do modulo diretamente
- **Run ID (execution_id)**: ja esta salvo no banco mas **nao aparece** no painel de detalhes

## O Que Sera Feito

### 1. Mostrar Execution ID e Scenario ID no painel de detalhes
Adicionar ao `ErrorDetail.tsx` uma secao de identificacao com:
- **Execution ID** (run ID) - com botao de copiar
- **Scenario ID** - para referencia rapida no Make.com

### 2. Melhorar captura de dados do modulo na Edge Function
Na `fetch-make-errors/index.ts`, para os logs de cenario (SOURCE 2), a API do Make retorna campos adicionais que podem ser extraidos:
- Tentar buscar detalhes da execucao individual via `/scenarios/{id}/logs/{logId}` para obter o modulo que falhou
- Alternativamente, usar os campos disponiveis no log como `imtId` (module ID) quando presentes

### 3. Exibir modulo de forma mais clara no detalhe
No `ErrorDetail.tsx`, melhorar a secao de diagnostico:
- Mostrar numero do modulo de forma destacada: "Modulo #3 de 8"
- Quando module_name for "Unknown", exibir mensagem explicativa

---

## Detalhes Tecnicos

### ErrorDetail.tsx - Nova secao de identificacao
Adicionar logo apos o titulo "Diagnostico do Fluxo":
- Execution ID com icone de copiar (clipboard)
- Scenario ID
- Link conceitual para referencia

### fetch-make-errors/index.ts - Enriquecer logs
Para SOURCE 2 (scenario logs), a API retorna campos como `imtId` e detalhes adicionais. Vamos:
- Buscar o endpoint `/scenarios/{sid}/logs/{logId}` para cada erro/warning para obter `moduleName` e `moduleIndex`
- Limitar a 5 chamadas paralelas por cenario para nao sobrecarregar a API
- Fallback para "Unknown" se o detalhe nao estiver disponivel

### Arquivos modificados
1. `src/components/make-errors/ErrorDetail.tsx` - adicionar execution_id, scenario_id e melhorar exibicao do modulo
2. `supabase/functions/fetch-make-errors/index.ts` - enriquecer dados de modulo dos logs

