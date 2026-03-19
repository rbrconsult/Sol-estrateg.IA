

## Documentar e Integrar Webhooks + Data Stores da Evolve Olímpia

### Inventário Completo — Evolve Olímpia

**14 Webhooks:**

| Nome | URL | Categoria |
|---|---|---|
| Conta de Energia - Leitura de Dados | `...5uomladm` | OCR |
| Ganho Solar Market | `...m2vkc6bc` | Comercial |
| Google Ads Sync - Trigger | `...ukdx7ho3` | Ads |
| Krolic-Entrada | `...hznxse100` | SDR |
| Krolic-Entrada Backup | `...tymardyp` | SDR |
| Meta Ads Sync - Trigger | `...qoxmgudt` | Ads |
| Meta CAPI - Sol Eventos | `...oecwv7a2` | Ads |
| My gateway-webhook | `...tq7nb90e` | Gateway |
| Perder Solar Market | `...56jkdk8t` | Comercial |
| Qualificar | `...yv9ucyql` | SDR |
| Reprocessamento Krolic - Robo Sol | `...ni9eirho` | SDR |
| Sol II | `...rfop5ab9` | SDR |
| TTS ElevenLabs | `...ju12sn4l` | Áudio |
| Webhook SOL - Proposta Criada | `...5bg8j6h` | Comercial |

**7 Data Stores:**

| Nome | Registros | Uso | Finalidade |
|---|---|---|---|
| Comercial | 1 | 358B/1MB | Pipeline comercial |
| Google_Ads_Olimpia | 110 | 95KB/1MB | Leads Google Ads |
| leads_site_geral | 357 | 35KB/1MB | Leads do site |
| Meta_Ads_Olimpia | 52 | 45KB/1MB | Leads Meta Ads |
| OCR Conta de Luz | 0 | 0/1MB | Leitura de contas |
| Sol_Producao_Olimpia | 9 | 2.3KB/1MB | Produção solar |
| thread_id | 933 | 455KB/1MB | Histórico conversas (SDR) |

### Plano de Implementação

#### 1. Migração — Tabela `organization_configs`

Criar tabela para armazenar configs por franquia com categorias:

```sql
CREATE TABLE public.organization_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  config_key text NOT NULL,
  config_value text NOT NULL DEFAULT '',
  config_category text NOT NULL DEFAULT 'general',
  is_secret boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, config_key)
);
```

#### 2. Seed — Evolve Olímpia

Inserir todos os 14 webhooks e 7 data stores como registros na `organization_configs` com categorias: `webhook`, `datastore`, `ads`, `api`.

#### 3. Wizard de Franquias (UI)

Componente `FranchiseWizard.tsx` com 5 steps:

- **Step 1 — Identidade**: Nome, slug, tipo (Franquia/Loja/Parceiro)
- **Step 2 — API Make.com**: API Key, Team ID
- **Step 3 — Data Stores**: Mapear cada DS com nome e ID (tabela editável)
- **Step 4 — Webhooks**: Mapear cada webhook com nome, URL e categoria (tabela editável)
- **Step 5 — Usuários**: Vincular usuários existentes ou criar novos

#### 4. Painel de Configs por Franquia

Substituir a aba Organizações atual por um painel com:
- Cards por franquia mostrando status de integração
- Lista de webhooks e data stores configurados
- Botão "Nova Franquia" abrindo o Wizard
- Botão "Editar" para alterar configs existentes

#### 5. Atualizar `cron-sync` para Multi-Tenant

O `cron-sync` lerá `organization_configs` para obter credenciais por org em vez de usar secrets globais. Iterará sobre cada organização ativa sincronizando seus data stores específicos.

### Arquivos

| Ação | Arquivo |
|---|---|
| Criar | Migração SQL (`organization_configs` + seed Olímpia) |
| Criar | `src/components/admin/FranchiseWizard.tsx` |
| Editar | `src/components/admin/OrganizationsTab.tsx` |
| Editar | `supabase/functions/cron-sync/index.ts` |
| Editar | `src/pages/Admin.tsx` |

