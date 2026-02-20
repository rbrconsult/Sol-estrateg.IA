
# Notificacoes WhatsApp via Evolution API + Popup Profissional

## Resumo

Ao abrir um chamado, o sistema vai:
1. Mostrar um popup profissional confirmando a abertura do chamado
2. Enviar uma mensagem WhatsApp para o usuario que abriu o chamado
3. Enviar uma mensagem WhatsApp para a central de comandos RBR Consult (+55 17 99733-5222)

## Etapas

### 1. Adicionar campo de telefone no perfil do usuario

Adicionar coluna `phone` na tabela `profiles` para que cada usuario tenha seu numero de WhatsApp cadastrado. Isso permite saber para qual numero enviar a notificacao quando ele abrir um chamado.

### 2. Tela para o usuario cadastrar seu telefone

Ao abrir um chamado, se o usuario nao tiver telefone cadastrado no perfil, o sistema pedira que ele informe antes de prosseguir. Apos cadastrado, o numero fica salvo para os proximos chamados.

### 3. Armazenar credenciais da Evolution API como secrets

Salvar as credenciais de forma segura no backend:
- `EVOLUTION_API_URL` = https://api.rbrsistemas.com
- `EVOLUTION_API_KEY` = 34228796396A-4285-A3DC-EEF91521C390
- `EVOLUTION_INSTANCE_NAME` = RBR Flow
- `CENTRAL_WHATSAPP_NUMBER` = 5517997335222

### 4. Criar funcao backend `notify-ticket-whatsapp`

Uma funcao backend que recebe os dados do chamado e envia duas mensagens via Evolution API:

**Mensagem para o usuario (quem abriu):**
```
Ola, {nome}! Seu chamado #{numero} foi aberto com sucesso.

Titulo: {titulo}
Fluxo: {fluxo}
Categoria: {categoria}
Prioridade: {prioridade}
SLA: {sla_horas}h

Acompanhe o status pelo painel ou por aqui. Responderemos em breve!

RBR Consult
```

**Mensagem para a central de comandos:**
```
NOVO CHAMADO #{numero}

Aberto por: {nome_usuario}
Titulo: {titulo}
Fluxo: {fluxo}
Plataforma: {plataforma}
Cliente: {cliente_nome} - {cliente_telefone}
Categoria: {categoria}
Prioridade: {prioridade}
SLA: {sla_horas}h

Descricao: {descricao}
```

### 5. Popup profissional de confirmacao

Apos criar o chamado com sucesso, exibir um dialog elegante com:
- Icone de check animado (verde)
- Titulo: "Chamado Aberto com Sucesso!"
- Numero do protocolo do chamado
- Mensagem: "Voce recebera uma confirmacao no seu WhatsApp com os detalhes do chamado."
- Botao "Acompanhar Chamado" que leva direto ao detalhe
- Botao "Fechar"

### 6. Integrar no fluxo de criacao

Apos o insert do chamado no banco:
1. Buscar o telefone do usuario no perfil
2. Chamar a funcao backend `notify-ticket-whatsapp`
3. Exibir o popup de confirmacao (independente do sucesso do WhatsApp, para nao bloquear o usuario)

## Detalhes Tecnicos

### Migracao do banco
- `ALTER TABLE profiles ADD COLUMN phone text;`

### Edge Function `notify-ticket-whatsapp`
- Recebe: dados do chamado + telefone do usuario
- Chama a Evolution API (`POST /message/sendText/{instance}`) duas vezes (usuario + central)
- Retorna sucesso/erro sem bloquear o fluxo principal

### Arquivos modificados
- `supabase/functions/notify-ticket-whatsapp/index.ts` (novo)
- `supabase/config.toml` (registrar nova funcao)
- `src/components/chamados/TicketForm.tsx` (chamar funcao + popup)
- `src/components/chamados/SuccessDialog.tsx` (novo - popup profissional)

### Secrets necessarios
- EVOLUTION_API_URL
- EVOLUTION_API_KEY
- EVOLUTION_INSTANCE_NAME
- CENTRAL_WHATSAPP_NUMBER
