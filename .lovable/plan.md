

# Plano de Execucao -- SOL Insights

## Visao Geral

Rebranding da plataforma de EVOLVE para SOL Insights, criacao de Central de Ajuda, Onboarding Guiado e Checklist de Configuracao. Nenhuma alteracao no backend, integracao com Google Sheets, API Evolution, logica de BI ou SLA.

---

## FASE 1 -- Rebranding (Baixo Risco)

### 1.1 Arquivos a alterar

| Arquivo | Alteracao |
|---|---|
| `index.html` | Title, meta tags (title, description, author, og:title, og:description), favicon letra "E" para "S" |
| `src/components/layout/Sidebar.tsx` | Logo "E" para "S", texto "EVOLVE" para "SOL Insights", subtitulo "CRM Solar" para "BI, CRM e Suporte" |
| `src/pages/Auth.tsx` | Logo "E" para "S", texto "EVOLVE" para "SOL Insights" |
| `src/pages/Index.tsx` | Footer "EVOLVE" para "SOL Insights" |
| `src/data/dataAdapter.ts` | Comentario "planilha EVOLVE" (cosmetic) |

### 1.2 Nao alterar
- `src/hooks/useAuth.tsx`: chaves internas `evolve_impersonation` e `evolve_session_token` sao chaves de localStorage, nao visíveis ao usuario. Manter para evitar logout em massa.
- `src/components/admin/OrganizationsTab.tsx`: placeholder de URL e exemplo, manter como esta.

---

## FASE 2 -- Central de Ajuda (`/ajuda`)

### 2.1 Novos arquivos

- `src/pages/Ajuda.tsx` -- Pagina principal com sidebar de categorias, campo de busca e area de conteudo.
- `src/data/helpContent.ts` -- Conteudo estatico estruturado em array de objetos com `{ id, title, icon, sections: [{ title, content }] }` para cada modulo.

### 2.2 Categorias de conteudo

Primeiros Passos, BI Estrategico, Pipeline, Forecast, Atividades, Vendedores, Perdas, Origens, Chamados, Admin, Monitoramento.

Cada categoria tera:
- O que e
- Para que serve
- Como funciona
- Boas praticas

### 2.3 Alteracoes em arquivos existentes

| Arquivo | Alteracao |
|---|---|
| `src/App.tsx` | Adicionar rota `/ajuda` protegida com MainLayout |
| `src/components/layout/Sidebar.tsx` | Adicionar item "Ajuda" com icone `HelpCircle` no menu |

---

## FASE 3 -- Onboarding Guiado

### 3.1 Migracao de banco

Adicionar coluna `onboarding_completed` na tabela `profiles`:

```sql
ALTER TABLE public.profiles
ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;
```

### 3.2 Novos arquivos

- `src/components/onboarding/OnboardingModal.tsx` -- Modal com stepper de boas-vindas, 5-7 etapas com ilustracoes/icones, botoes "Proximo"/"Pular". Ao finalizar, atualiza `profiles.onboarding_completed = true`.

### 3.3 Alteracoes em arquivos existentes

| Arquivo | Alteracao |
|---|---|
| `src/components/layout/MainLayout.tsx` | Importar e renderizar `OnboardingModal` condicionalmente (se `onboarding_completed === false`) |

### 3.4 Etapas do tour

1. Boas-vindas ao SOL Insights
2. Dashboard -- visao geral dos KPIs
3. Pipeline -- acompanhe propostas no Kanban
4. Chamados -- abra e acompanhe tickets
5. Ajuda -- acesse a Central de Ajuda
6. Finalizacao -- pronto para comecar

### 3.5 Botao "Refazer Onboarding"

Adicionar opcao no footer da Sidebar para resetar o flag e reexibir o tour.

---

## FASE 4 -- Checklist de Configuracao Inicial

### 4.1 Novos arquivos

- `src/components/dashboard/SetupChecklist.tsx` -- Card com checklist que detecta automaticamente:
  - Google Sheet configurado (verifica se dados retornam da API)
  - Vendedores cadastrados (verifica se existem propostas com vendedores)
  - Primeira proposta inserida (count > 0)
  - Usuarios criados (count de membros da org > 1)
  - Monitoramento configurado (verifica `status_url` na org)

### 4.2 Alteracoes em arquivos existentes

| Arquivo | Alteracao |
|---|---|
| `src/pages/Index.tsx` | Renderizar `SetupChecklist` no topo do dashboard (visivel apenas se nem todos os itens estao completos) |

---

## FASE 5 -- Icones de Ajuda Contextual

### 5.1 Novos arquivos

- `src/components/HelpButton.tsx` -- Botao circular `?` que recebe `moduleId` como prop e gera link para `/ajuda#moduleId`.

### 5.2 Alteracoes em arquivos existentes

Adicionar `HelpButton` no header de cada pagina principal:
- `src/pages/Index.tsx` (moduleId: "bi-estrategico")
- `src/pages/Pipeline.tsx` (moduleId: "pipeline")
- `src/pages/Forecast.tsx` (moduleId: "forecast")
- `src/pages/Atividades.tsx` (moduleId: "atividades")
- `src/pages/Vendedores.tsx` (moduleId: "vendedores")
- `src/pages/Perdas.tsx` (moduleId: "perdas")
- `src/pages/Origens.tsx` (moduleId: "origens")
- `src/pages/Chamados.tsx` (moduleId: "chamados")
- `src/pages/Monitoramento.tsx` (moduleId: "monitoramento")

---

## Ordem de Execucao

1. **Fase 1** -- Rebranding (6 arquivos, risco zero)
2. **Fase 2** -- Central de Ajuda (2 novos + 2 alterados)
3. **Fase 3** -- Onboarding (1 migracao + 2 novos + 1 alterado)
4. **Fase 4** -- Checklist (1 novo + 1 alterado)
5. **Fase 5** -- Icones de ajuda (1 novo + 9 alterados)

## O que NAO sera alterado

- Estrutura multi-tenant e RLS
- Conexao Google Sheets / Edge Functions
- API Evolution / WhatsApp
- Logica de BI, funis e KPIs
- SLA de chamados
- Sistema de roles e autenticacao

