
# Reformulação do Admin — Plano

## Conceito
Substituir o layout atual por um **dashboard organizado em seções colapsáveis** com cards de ação, navegação fluida entre sub-páginas e visual mais limpo.

## Mudanças na `/admin` (página principal)

### 1. Header melhorado
- Título "Painel Administrativo" com ícone e badge do papel do usuário
- Breadcrumb contextual (Admin > Configurações > Prompts)

### 2. Layout híbrido: Abas horizontais limpas + Cards internos
- **Abas simples no topo** (sem decoração excessiva): Visão Geral | Unidades | Pessoas | Módulos | Segurança
- Aba "Visão Geral" (nova, padrão) com:
  - Cards de atalho rápido categorizados: Configuração SOL, Equipe, Funis, Infraestrutura
  - Mini-resumos (quantidade de usuários, módulos ativos, último sync)
- Abas existentes mantém funcionalidade mas com espaçamento e tipografia melhorados

### 3. Navegação entre sub-páginas
- Breadcrumb persistente ao entrar em `/admin/config`, `/admin/equipe`, `/admin/funis`
- Botão "Voltar" mais visível + breadcrumb clicável

## Mudanças na `/admin/config` (Configurações SOL)

### 4. Reorganização visual dos prompts
- Seções com títulos mais destacados e separadores visuais
- Cards de prompt com preview mais compacto (altura fixa menor), expandem ao clicar
- Badges de status mais claros (✓ configurado, ⚠ vazio)

### 5. Perguntas do Robô
- Cards mais compactos em grid 2 colunas, mesma estética dos prompts
- Badge obrigatório/opcional mais visível

### 6. Seção inferior (FUP + Variáveis + Mensagens)
- Agrupar em uma "barra" de ações secundárias mais coesa

## Critérios
- Manter 100% da funcionalidade existente
- Apenas mudanças visuais/UX — sem alterar hooks ou lógica de negócio
- Responsivo (mobile-friendly)
- Tokens semânticos do design system
