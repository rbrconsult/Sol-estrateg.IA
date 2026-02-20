

# WhatsApp Notifications + Popup Profissional + Config no Admin

## Resumo

Implementar o sistema completo de notificacoes WhatsApp ao abrir chamado, com popup de confirmacao profissional e uma aba de configuracoes no Painel de Administracao para gerenciar as credenciais da Evolution API.

## 1. Tabela de Configuracoes no Banco

Criar uma tabela `app_settings` para armazenar as configuracoes da Evolution API de forma editavel pelo admin, sem depender de secrets fixos:

- `key` (text, primary key): nome da configuracao
- `value` (text): valor da configuracao
- `updated_at` (timestamp)

Valores iniciais:
- `evolution_api_url` = `https://api.rbrsistemas.com`
- `evolution_api_key` = `34228796396A-4285-A3DC-EEF91521C390`
- `evolution_instance_name` = `RBR Flow`
- `central_whatsapp_number` = `5517997335222`

RLS: somente `super_admin` pode ler e editar.

## 2. Aba "Configuracoes" no Painel de Administracao

Adicionar uma nova aba no Admin (`/admin`) com:

- Campos editaveis para URL da API, API Key, Nome da Instancia e Numero da Central
- Botao "Salvar Configuracoes"
- Indicador visual de status (salvo/nao salvo)
- Campo de API Key com mascara (mostra parcialmente, tipo `34228***C390`)

## 3. Edge Function `notify-ticket-whatsapp`

Funcao backend que:
1. Busca as credenciais da Evolution API na tabela `app_settings`
2. Envia mensagem WhatsApp para o usuario que abriu o chamado
3. Envia mensagem WhatsApp para a central de comandos

Mensagem para o usuario:
```text
Ola, {nome}! Seu chamado #{numero} foi aberto com sucesso.

Titulo: {titulo}
Fluxo: {fluxo}
Categoria: {categoria}
Prioridade: {prioridade}
SLA: {sla_horas}h

Acompanhe o status pelo painel ou por aqui. Responderemos em breve!

RBR Consult
```

Mensagem para a central:
```text
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

## 4. Popup Profissional de Confirmacao

Novo componente `SuccessDialog.tsx` exibido apos criar o chamado:

- Icone de check animado (verde)
- Titulo: "Chamado Aberto com Sucesso!"
- Numero do protocolo
- Mensagem: "Voce recebera uma confirmacao no seu WhatsApp"
- Botao "Acompanhar Chamado"
- Botao "Fechar"

## 5. Campo de Telefone no Perfil

Se o usuario nao tiver telefone cadastrado no perfil, o formulario de chamado pedira para informar antes de enviar. O numero fica salvo para os proximos chamados.

## 6. Integracao no Fluxo de Criacao

Apos inserir o chamado no banco:
1. Buscar telefone do usuario no perfil
2. Chamar a edge function `notify-ticket-whatsapp` (sem bloquear o fluxo)
3. Exibir o popup de confirmacao

---

## Detalhes Tecnicos

### Arquivos novos
- `supabase/functions/notify-ticket-whatsapp/index.ts` - Edge function
- `src/components/chamados/SuccessDialog.tsx` - Popup profissional

### Arquivos modificados
- `src/pages/Admin.tsx` - Nova aba "Configuracoes" com formulario da Evolution API
- `src/components/chamados/TicketForm.tsx` - Integrar chamada da edge function + popup + campo telefone do perfil

### Migracao SQL
- Criar tabela `app_settings` com RLS para super_admin
- Inserir valores iniciais das credenciais Evolution API

### Fluxo da Edge Function
1. Recebe dados do chamado via POST
2. Consulta `app_settings` para obter credenciais
3. Chama `POST https://{url}/message/sendText/{instance}` da Evolution API duas vezes
4. Retorna status sem bloquear o frontend

