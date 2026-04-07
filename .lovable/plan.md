

# Plano: Deploy da Edge Function + Correção de Erros de Build

## Contexto
A Edge Function `sync-make-datastores` já está atualizada no repo com os novos campos de PROJETOS_COLS. Porém, existem **4 erros de build** que impedem o deploy e precisam ser corrigidos primeiro.

## Erros a Corrigir

### 1. `fetch-make-data/index.ts` — `err` is of type `unknown`
**Linha 115**: `err.message` sem type assertion.
**Fix**: Trocar `err.message` por `(err as Error).message`.

### 2. `dataAdapter.ts` — `synced_at` não existe no tipo `sol_projetos_sync`
**Linhas 188, 216, 311**: O tipo gerado do Supabase não inclui `synced_at` na tabela `sol_projetos_sync`.
**Fix**: Usar type assertion `(r as any).synced_at` ou acessar via optional chaining com cast. Alternativa melhor: o campo `synced_at` provavelmente existe na tabela mas não foi incluído na migration mais recente — precisamos verificar se a coluna existe no banco e, se não, adicioná-la via migration.

### 3. `dataAdapter.ts` + `FunilConsolidado.tsx` + `Comercial.tsx` — `key` não existe no tipo
**Linhas 334, 227, 359**: O tipo `sol_projetos_sync` não tem coluna `key` — o PK é `project_id`.
**Fix**: Substituir `r.key` por `r.project_id` nos três arquivos, ou usar fallback `(r as any).key || r.project_id`.

## Passos de Implementação

| # | Ação | Arquivo |
|---|------|---------|
| 1 | Fix `(err as Error).message` | `supabase/functions/fetch-make-data/index.ts` |
| 2 | Substituir `r.synced_at` por cast seguro `(r as any).synced_at` nas 3 ocorrências | `src/data/dataAdapter.ts` |
| 3 | Substituir `r.key` por `r.project_id` (ou fallback) | `src/data/dataAdapter.ts` |
| 4 | Substituir `p.key` por `p.project_id` no React key | `src/pages/campanhas/FunilConsolidado.tsx` |
| 5 | Substituir `p.key` por `p.project_id` no React key | `src/pages/solar/Comercial.tsx` |
| 6 | Deploy da Edge Function `sync-make-datastores` | Via deploy tool |
| 7 | Verificar secrets (`MAKE_API_KEY`) estão configurados | Já confirmado ✓ |

## Teste Pós-Deploy

Para disparar sync de teste, chamar a função via `supabase.functions.invoke`:
```
POST /functions/v1/sync-make-datastores
Body: { "group": "medium" }
```
Logs ficam visíveis via `edge_function_logs` e resultados na tabela `integration_runs`.

## Nota sobre `synced_at`
A Edge Function `sync-make-datastores` **gera** `synced_at` no upsert (`synced_at: new Date().toISOString()`), então a coluna deve existir na tabela. Se o tipo TypeScript não a inclui, é porque o schema gerado está desatualizado. O cast `(r as any).synced_at` resolve o build sem alterar o banco.

