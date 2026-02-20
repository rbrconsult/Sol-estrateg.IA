
# Reformulacao do Formulario de Chamados

## Resumo das Alteracoes

O formulario de abertura de chamados sera redesenhado com novos campos, upload de anexos e prioridade automatica baseada na categoria selecionada.

## Novos Campos do Formulario

| Campo | Tipo | Obrigatorio |
|-------|------|-------------|
| Titulo | Input texto | Sim |
| Fluxo | Dropdown com lista fixa | Sim |
| Descricao do Problema | Textarea | Sim |
| Nome do Cliente | Input texto | Sim |
| Telefone do Cliente | Input texto | Sim |
| Detalhes do Problema | Textarea | Nao |
| Anexo (imagem/documento) | Upload de arquivo | Nao |
| Categoria | Dropdown (manter atual) | Sim |
| Prioridade | Calculada automaticamente | --- |

## Lista de Fluxos (Dropdown)

- Fluxo 1 - Captura de Leads Meta Ads e Disparo inicial whatsapp + IA
- Fluxo 2 - Captura de Leads Site GERAL e Disparo inicial whatsapp + IA
- Robo FUP FRIO
- Robo SDR / Sol
- Fluxo Remarketing

## Logica de Prioridade Automatica

A prioridade sera definida automaticamente com base na categoria:

| Categoria | Prioridade | SLA |
|-----------|-----------|-----|
| Urgencia | Critica | 4h |
| Bug | Alta | 24h |
| Melhoria | Media | 48h |
| Duvida | Baixa | 72h |

O campo de prioridade nao aparecera mais no formulario para o usuario.

## Upload de Anexos

- Criar um bucket de storage chamado `ticket-attachments` (publico para leitura)
- Permitir upload de imagens (jpg, png, webp) e documentos (pdf)
- Limite de 10MB por arquivo
- Armazenar a URL do arquivo na tabela `support_tickets`

## Detalhes Tecnicos

### 1. Migracao do Banco de Dados

Adicionar colunas na tabela `support_tickets`:
- `fluxo` (text, nullable) - nome do fluxo selecionado
- `cliente_nome` (text, nullable) - nome do cliente
- `cliente_telefone` (text, nullable) - telefone do cliente
- `detalhes` (text, nullable) - detalhes adicionais do problema
- `attachment_url` (text, nullable) - URL do anexo

Criar bucket de storage `ticket-attachments` com politicas RLS para upload (usuarios autenticados) e leitura (publica).

### 2. Atualizar TicketForm.tsx

- Adicionar os novos campos ao formulario
- Implementar dropdown de fluxos com lista fixa
- Remover campo de prioridade e calcular automaticamente pela categoria
- Adicionar componente de upload de arquivo usando Supabase Storage
- Abrir formulario em um Dialog/Modal ao inves de expandir inline

### 3. Atualizar TicketDetail.tsx

- Exibir os novos campos (fluxo, cliente, telefone, detalhes)
- Mostrar anexo com link para download/visualizacao

### 4. Atualizar TicketList.tsx

- Adicionar coluna "Fluxo" na tabela
- Exibir nome do cliente quando disponivel
