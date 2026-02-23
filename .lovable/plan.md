

## Vincular Planilha Google Sheets por Organizacao

### Problema atual
Hoje existe apenas uma planilha fixa (secret `GOOGLE_SHEET_ID`) que alimenta todos os dados. Quando uma nova empresa for criada, nao ha como vincular uma planilha diferente a ela.

### Solucao

Armazenar o ID da planilha Google Sheets nas configuracoes (`settings`) de cada organizacao, e fazer o sistema carregar os dados da planilha correta com base na organizacao do usuario logado.

---

### Mudancas necessarias

**1. Tela Admin - Formulario de organizacao (OrganizationsTab.tsx)**

Adicionar um campo "Google Sheet ID" no dialog de criar/editar organizacao. O valor sera salvo no campo `settings` (jsonb) da tabela `organizations`:

```json
{ "google_sheet_id": "18LfyoHUA7Yk4VBEi-hXHy600pzxBWpqinSvFEIIT1ng" }
```

**2. Edge Function fetch-sheets**

- Receber o `organization_id` como parametro no body da requisicao
- Buscar a organizacao no banco para obter o `google_sheet_id` dos `settings`
- Se nao encontrar, usar o fallback do secret `GOOGLE_SHEET_ID` (compatibilidade)
- Usar o sheet ID da organizacao para buscar os dados

**3. Hook useGoogleSheetsData.ts**

- Importar o `organizationId` do `useAuth()`
- Enviar o `organization_id` no body da chamada a edge function
- Incluir o `organizationId` na query key para cache separado por empresa

**4. Migrar dado existente**

- Atualizar a organizacao Evolve Energia no banco para incluir o sheet ID atual nos settings

---

### Fluxo completo

```text
Admin cria org "Solar Plus"
        |
        v
Preenche Google Sheet ID no formulario
        |
        v
Salva em organizations.settings.google_sheet_id
        |
        v
Usuario da Solar Plus faz login
        |
        v
useAuth() retorna organization_id
        |
        v
fetch-sheets recebe org_id -> busca sheet_id -> retorna dados da planilha correta
```

### Detalhes tecnicos

| Arquivo | Mudanca |
|---|---|
| `src/components/admin/OrganizationsTab.tsx` | Novo campo "Google Sheet ID" no dialog de criar/editar |
| `supabase/functions/fetch-sheets/index.ts` | Aceitar `organization_id`, buscar sheet ID do banco |
| `src/hooks/useGoogleSheetsData.ts` | Enviar `organization_id` na chamada, cache por org |
| Migracao SQL | UPDATE organizations SET settings para Evolve Energia |

### Seguranca

- A edge function validara o JWT do usuario antes de processar
- Usuarios so conseguem buscar dados da propria organizacao (via `get_user_org`)
- Super admins podem consultar qualquer organizacao

