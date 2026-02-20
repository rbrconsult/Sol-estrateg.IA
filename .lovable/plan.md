

# Receber Respostas do WhatsApp nos Chamados

## Objetivo
Quando um cliente responder a mensagem do WhatsApp, a resposta aparece automaticamente como mensagem dentro do chamado no painel.

## Como vai funcionar

1. O sistema envia uma notificacao WhatsApp ao abrir o chamado (ja funciona)
2. O cliente responde pelo WhatsApp
3. A Evolution API envia essa resposta para o nosso webhook
4. O webhook identifica o chamado pelo numero de telefone e insere a mensagem
5. O painel atualiza em tempo real (ja funciona via realtime)

## Etapas de Implementacao

### 1. Adicionar coluna `notification_phone` na tabela `support_tickets`
- Armazena o numero de WhatsApp informado na abertura do chamado
- Permite buscar o chamado correto quando chega uma resposta do WhatsApp

### 2. Adicionar coluna `source` na tabela `ticket_messages`
- Valores: `panel` (padrao) ou `whatsapp`
- Permite diferenciar visualmente mensagens vindas do WhatsApp

### 3. Criar RLS para permitir insercao via service role
- O webhook usa `SUPABASE_SERVICE_ROLE_KEY`, que bypassa RLS automaticamente
- Nenhuma politica adicional necessaria

### 4. Criar Edge Function `whatsapp-webhook`
- Recebe o payload da Evolution API (POST)
- Extrai o numero do remetente (`data.key.remoteJid`) e o texto (`data.message.conversation` ou `data.message.extendedTextMessage.text`)
- Filtra: ignora mensagens enviadas por nos (fromMe), status updates, e mensagens sem texto
- Busca o chamado aberto mais recente onde `notification_phone` corresponde ao numero
- Insere a mensagem na tabela `ticket_messages` com `source = 'whatsapp'`
- Se o ticket estiver em `aguardando_usuario`, muda para `em_andamento` automaticamente
- Configurado com `verify_jwt = false` no config.toml (webhook externo)

### 5. Atualizar `TicketForm.tsx`
- Salvar o numero de notificacao no campo `notification_phone` do chamado ao criar

### 6. Atualizar `TicketDetail.tsx`
- Exibir um icone do WhatsApp nas mensagens que vieram do webhook (`source = 'whatsapp'`)

### 7. Configuracao na Evolution API
- Voce precisara configurar o webhook na Evolution API apontando para a URL da funcao
- A URL sera: `https://xffzjdulkdgyicsllznp.supabase.co/functions/v1/whatsapp-webhook`
- Evento: `MESSAGES_UPSERT`

---

## Detalhes Tecnicos

### Migracao SQL
- `ALTER TABLE support_tickets ADD COLUMN notification_phone text;`
- `ALTER TABLE ticket_messages ADD COLUMN source text DEFAULT 'panel';`

### Arquivos novos
- `supabase/functions/whatsapp-webhook/index.ts`

### Arquivos modificados
- `supabase/config.toml` -- adicionar `[functions.whatsapp-webhook]` com `verify_jwt = false`
- `src/components/chamados/TicketForm.tsx` -- salvar `notification_phone` no insert
- `src/components/chamados/TicketDetail.tsx` -- icone WhatsApp nas mensagens com `source = 'whatsapp'`

### Logica do Webhook (resumo)
```text
1. Recebe POST da Evolution API
2. Verifica se e mensagem recebida (nao enviada por nos)
3. Extrai numero (remove @s.whatsapp.net) e texto
4. Busca ticket: notification_phone LIKE %numero%, status != resolvido/fechado, ORDER BY created_at DESC
5. Insere em ticket_messages com user_id = ticket.user_id e source = 'whatsapp'
6. Se status = aguardando_usuario, atualiza para em_andamento
7. Retorna 200 OK
```

### Seguranca
- Sem JWT (webhook externo), mas validacao pelo formato do payload da Evolution API
- Usa `SUPABASE_SERVICE_ROLE_KEY` para operacoes no banco (bypassa RLS)
- Apenas mensagens de texto sao processadas
