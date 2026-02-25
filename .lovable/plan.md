

# Integração Make.com Data Store + Planilha Google Sheets

## Objetivo
Cruzar dados da planilha (leads, qualificação Sol) com o Data Store do Make.com (mensagens dos robôs Sol e FUP Frio), usando o **telefone do cliente** como chave de cruzamento. Exibir tudo no Dashboard de Leads com visão executiva.

## Dados a Integrar
- Ultimas mensagens enviadas pelos robôs (Sol e FUP Frio)
- Status do follow-up (contatado, respondeu, ignorou)
- SLA/tempo de resposta do lead
- Historico completo de interacoes

---

## Arquitetura

```text
+-----------------+       +---------------------+       +------------------+
|  Google Sheets  |       |  Edge Function      |       |  Make Data Store |
|  (Planilha)     |       |  fetch-make-data    |       |  (API REST)      |
+-----------------+       +---------------------+       +------------------+
        |                         |                             |
        |   telefone_cliente      |   GET /datastores/{id}      |
        +------------------------>|   via Make API              |
                                  +---------------------------->|
                                  |<----------------------------+
                                  |   mensagens, status, SLA    |
                                  |                             |
                                  v                             
                      Cruzamento por telefone
                      no frontend (React)
```

---

## Etapas de Implementacao

### 1. Configurar Secrets
- Armazenar `MAKE_API_KEY` e `MAKE_DATASTORE_ID` como secrets seguros no backend
- O usuario precisara fornecer ambos os valores

### 2. Criar Edge Function `fetch-make-data`
- Nova funcao backend que:
  - Autentica o usuario (JWT)
  - Chama a API do Make.com: `GET https://eu2.make.com/api/v2/data-stores/{id}/data`
  - Retorna os registros do Data Store
- Headers: `Authorization: Token {MAKE_API_KEY}`
- Configurar `verify_jwt = false` no config.toml (validacao manual)

### 3. Criar Hook `useMakeDataStore`
- Novo React Query hook que chama a edge function
- Cache de 5 minutos (mesmo padrao do Google Sheets)
- Interface tipada para os dados do Data Store

### 4. Cruzamento de Dados no Frontend
- Normalizar telefones (remover formatacao) para matching confiavel
- Criar um `Map<telefone, MakeRecord>` para lookup O(1)
- Merge dos dados no `useMemo` da pagina Leads

### 5. Novas Secoes no Dashboard de Leads

**a) Coluna "Ultimo Contato" na tabela de leads**
- Data e hora da ultima mensagem do robo
- Icone indicando qual robo (Sol ou FUP Frio)

**b) Coluna "Status FUP" na tabela**
- Badge visual: Respondeu (verde), Ignorou (vermelho), Aguardando (amarelo), Sem contato (cinza)

**c) Secao "Atividade dos Robos" (novo card)**
- Mensagens enviadas hoje (Sol vs FUP Frio)
- Taxa de resposta
- Tempo medio de resposta dos leads
- Leads sem resposta ha mais de X dias

**d) Alertas inteligentes adicionais**
- "X leads ignoraram FUP Frio ha mais de 3 dias"
- "Sol enviou X mensagens hoje com Y% de resposta"
- "X leads quentes sem follow-up ativo"

**e) Timeline de interacoes (expansivel)**
- Ao clicar em um lead na tabela, expandir historico completo
- Mostrar todas as mensagens enviadas e recebidas em ordem cronologica

---

## Detalhes Tecnicos

### Edge Function (`supabase/functions/fetch-make-data/index.ts`)
- Endpoint: `GET /functions/v1/fetch-make-data`
- Autenticacao: Bearer token do usuario
- API Make: `https://eu2.make.com/api/v2/data-stores/{MAKE_DATASTORE_ID}/data`
- Paginacao: suporte a limit/offset se necessario

### Interface dos dados Make
```text
MakeRecord {
  telefone: string
  robo: "sol" | "fup_frio"
  ultima_mensagem: string
  data_envio: string
  status_resposta: "respondeu" | "ignorou" | "aguardando"
  data_resposta?: string
  historico: Array<{ tipo, mensagem, data }>
}
```

### Arquivos a criar/modificar
1. `supabase/functions/fetch-make-data/index.ts` — Nova edge function
2. `src/hooks/useMakeDataStore.ts` — Novo hook React Query
3. `src/pages/Leads.tsx` — Integrar dados cruzados na UI
4. `supabase/config.toml` — Adicionar configuracao da nova function

---

## Pre-requisitos do Usuario
1. **API Token do Make.com** — Profile > API no painel do Make
2. **ID do Data Store** — Visivel na URL ao abrir o Data Store no Make
3. Informar a **estrutura exata dos campos** do Data Store (nomes das colunas) para mapear corretamente

