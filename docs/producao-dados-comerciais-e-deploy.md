# Dados comerciais, comissões e deploy em produção

**Objetivo:** registrar o **racional** das mudanças recentes (Performance, Comissões, filial, RLS) e deixar claro **como fazer isso valer no ambiente Live**, onde o código no Git não altera o banco sozinho.

> **Não rode este arquivo no SQL Editor.** Este documento é Markdown (texto com `#`, listas, etc.). O Postgres acusa erro `syntax error at or near "#"` se você colar a página inteira.  
> **O que colar no Supabase:** somente o conteúdo dos arquivos **`.sql`** em `supabase/migrations/` (veja a seção 3.2), ou **apenas** os blocos `SELECT` de verificação mais abaixo — nada de título `#` nem parágrafos.

---

## 1. Racional — o que o produto assume

### 1.1 Fonte dos números comerciais

- Telas como **Performance**, **Vendedores**, **Origens**, **Perdas**, **Comissões** e o bloco **CommercialDataPipelineNote** leem principalmente **`sol_projetos_sync`** (propostas/projetos) e, onde aplicável, **`sol_leads_sync`**.
- Essas tabelas são alimentadas pelo **sync Make → Supabase** (no projeto: Edge Function **`sync-make-datastores`**, acionada por cron ou equivalente). Se o sync não rodar ou não tiver dados no Data Store, a UI fica vazia por falta de linhas, não por “bug de gráfico”.

### 1.2 Filial, `franquia_id` e `organizations.slug`

- O app filtra por **filial** usando o **slug da organização** (`organizations.slug`) e o campo **`franquia_id`** vindo das tabelas `_sync`.
- O **Make** pode gravar `franquia_id` com **underscore** (ex.: `evolve_olimpia`) enquanto o Lovable/org usa **hífen** no slug (ex.: `evolve-olimpia`). Com RLS comparando **igualdade estrita**, o Postgres **não devolvia nenhuma linha** para usuários autenticados — a UI parecia “sem dados” mesmo com dados no banco.

### 1.3 Correção de RLS (slug ↔ `franquia_id`)

- Migração: **`supabase/migrations/20260407140000_rls_franquia_slug_variants.sql`**
- Cria a função **`public.franquia_id_matches_org_slug(text, text)`**, que aceita match **direto** ou trocando **`-` ↔ `_`** entre `franquia_id` e o slug da org do usuário.
- Recria as políticas de **SELECT** (e políticas de gerente onde existiam) em tabelas comerciais sync, incluindo pelo menos:  
  `sol_projetos_sync`, `sol_leads_sync`, `sol_metricas_sync`, `sol_qualificacao_sync`, `sol_equipe_sync`, `sol_funis_sync`.
- **Super admin** continua enxergando tudo pelas condições já existentes (`has_role(..., 'super_admin')`).

### 1.4 Comissões — não depende de coluna preenchida

- A tela **Comissões** usa **`valor_proposta`** e status **Ganho** como base; **`valor_comissao`** e **`percentual_comissao`** são **opcionais** (vindos do Make/Solar Market quando existirem).
- É **normal** a base ter **zero** linhas com esses campos preenchidos e ainda assim haver comissão **estimada** pelo percentual configurado na UI.
- Migração que só adiciona colunas (idempotente): **`supabase/migrations/20260406120000_sol_projetos_comissao.sql`**

### 1.5 Closers (filtro “quem pode aparecer”)

- Lista de closers permitidos: **`organization_configs`** com chave **`comercial_closer_sm_ids`** (JSON array de identificadores SM / closer). Enquanto o registro não existe, o código pode usar **fallback legado** por slug (ex.: mapa histórico para Olímpia).
- Sem allowlist e sem fallback, telas que filtram por closer podem ficar vazias mesmo com projetos na base.

### 1.6 Transparência na UI

- **`CommercialDataPipelineNote`** resume contagens (bruto vs após filtros) e alerta quando a API retorna **sucesso com 0 linhas** (cenário típico: RLS/slug ou tabela vazia para aquela filial), separado de **erro de rede** ou **filial sem slug**.

### 1.7 Filtro de período (datas)

- Ordem de fallback para data em propostas: **`dataCriacaoProposta` → `ultimaAtualizacao` → `dataCriacaoProjeto`** (implementado no filtro de página), para não “sumir” linha só porque um campo de data veio vazio no sync.

---

## 2. Por que “atualizei o código” e produção não mudou o banco

Três camadas independentes:

| Camada | O que muda | Como “vai para produção” |
|--------|------------|---------------------------|
| **Frontend** (React/Vite) | Telas, hooks, textos | **Publish** no Lovable (Live) ou deploy do `dist/` no seu host |
| **PostgreSQL** (schema + RLS) | Colunas, funções, policies | **Rodar migrações SQL** no projeto Supabase **de produção** (Dashboard SQL, ou `supabase db push` linkado ao projeto certo) |
| **Edge Functions** | Lógica do sync, colunas mapeadas | **Redeploy** da função no Supabase de produção se o código da função no repo mudou |

**Não existe um único botão** que aplique automaticamente, no ar, todo SQL que está em `supabase/migrations/` — isso é **deliberado** (controle e auditoria). Quem opera precisa aplicar as migrações **no mesmo projeto** que o app Live usa (`VITE_SUPABASE_URL` / anon key).

---

## 3. Checklist — colocar as correções no ar (produção)

### 3.1 Frontend

1. Garantir que a branch com as alterações está **mergeada** no fluxo que o Lovable usa (ou no repositório que o CI publica).
2. No **Lovable**: publicar para o ambiente **Live** / domínio de produção (o Preview não é o que os usuários finais usam se a URL de produção for outra).
3. Após publicar: **hard refresh** (ou limpar cache) no browser.

### 3.2 Banco (Supabase de produção)

1. Abrir o **mesmo** projeto Supabase ligado ao app Live (conferir ref/projeto no inventário interno, ex.: `docs/inventario-tecnico-sol.md`).
2. Aplicar, **nesta ordem**, o SQL das migrações que ainda **não** foram executadas naquele projeto:
   - `20260406120000_sol_projetos_comissao.sql` — colunas opcionais em `sol_projetos_sync`
   - `20260407140000_rls_franquia_slug_variants.sql` — função + policies RLS com variantes `-`/`_`

   **Onde colar:** Supabase Dashboard → **SQL Editor** → novo script → colar o conteúdo completo de cada arquivo → **Run**.  
   (Se o time usa CLI: `supabase link` ao projeto de produção e `supabase db push` — com cuidado para não apontar para staging por engano.)

3. Verificações rápidas (opcional, no SQL Editor):

```sql
-- Colunas de comissão
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'sol_projetos_sync'
  and column_name in ('valor_comissao', 'percentual_comissao');

-- Função usada nas policies
select proname from pg_proc
where pronamespace = 'public'::regnamespace
  and proname = 'franquia_id_matches_org_slug';
```

4. Com usuário **não** super_admin: após a migração RLS, um `select` via PostgREST/app deve voltar linhas se `franquia_id` e `organizations.slug` forem equivalentes com troca `-`/`_`.

### 3.3 Edge Functions (somente se o código da função mudou no repo)

1. Se **`supabase/functions/sync-make-datastores`** (ou outra função tocada) foi alterada: fazer **deploy** dessa função no projeto de produção (Dashboard **Edge Functions** ou `supabase functions deploy <nome>` com o projeto linkado).
2. Se **só** o frontend e o SQL mudaram, e o sync já grava em `sol_projetos_sync`, muitas vezes **não** é obrigatório redeploy da função — mas o **ADD COLUMN** no BD evita falha de upsert quando o payload passar a incluir os novos campos.

### 3.4 Dados e operação

1. Confirmar que **`organizations.slug`** da filial bate semanticamente com o **`franquia_id`** do Make (ou com a variante `-`/`_` já coberta pela função).
2. Confirmar **`organization_members`** / **`get_user_org`** para o usuário de teste (usuário sem org correta não vê dados mesmo com RLS certo).
3. Opcional: preencher **`comercial_closer_sm_ids`** em **Admin → config da org** para alinhar closers ao Solar Market.

---

## 4. Resumo em uma frase

**Publicar o app** coloca o JavaScript novo no ar; **rodar as migrações no Supabase de produção** aplica schema e RLS; **redeploy de Edge Functions** só é necessário quando o código Deno do sync mudou.

---

## 5. Referências no repositório

- Migrações: `supabase/migrations/20260406120000_sol_projetos_comissao.sql`, `supabase/migrations/20260407140000_rls_franquia_slug_variants.sql`
- UI de diagnóstico: `src/components/metrics/CommercialDataPipelineNote.tsx`
- Propostas comerciais agregadas: `src/hooks/useCommercialProposals.ts`, `src/hooks/useSolData.ts`
- Allowlist de closers: `src/hooks/useComercialCloserAllowlist.ts`
