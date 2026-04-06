# Catálogo de métricas — Fase A (confiança executiva)

Documento de referência para alinhar produto, dados e leitura do CEO. Complementa o código em `src/data/dataAdapter.ts` (`projetosToProposals`, `mapProjetoStatus`, `normalizeEtapaKanban`, `dedupeProjetosLatest`).

## Fontes oficiais

| Domínio | Tabela Supabase | Hook / entrada |
|--------|------------------|----------------|
| Pré-venda (robô, lead, FUP) | `sol_leads_sync` | `useSolLeads` |
| Comercial (proposta, valor, etapa SM) | `sol_projetos_sync` | `useCommercialProposals` → dedupe + `projetosToProposals` |

Não somar “receita” de lead (`valor_conta`) com “receita” de projeto (`valor_proposta`) no mesmo KPI sem rótulo explícito.

## Comercial (Solar Market / CRM)

| KPI | Definição | Filtro de data (global) |
|-----|-----------|-------------------------|
| Receita fechada | Soma `valorProposta` onde `status === Ganho` | `dataCriacaoProposta` no `Proposal` (vem de `ts_proposta`, `ts_proposta_aceita`, `ts_evento` ou cadastro projeto) |
| Pipeline aberto | Soma `valorProposta` onde `status === Aberto` | Idem |
| Negócios ganhos / abertos | Contagem por `status` | Idem |
| Ticket médio (ganhos) | Receita fechada ÷ quantidade de ganhos | Idem |
| Win rate | Ganhos ÷ total de negócios no recorte | Idem |
| Projetos únicos | Após `dedupeProjetosLatest` por `project_id` | — |

### Mapeamento SM → `Proposal.status` (heurística)

Campos lidos: `status_projeto`, `evento`, `proposta_ativa` (concatenados, maiúsculas).

- **Ganho:** contém GANH, FECH, ASSIN, WON, ACEIT  
- **Perdido:** contém PERD, LOST, DESCART, DECL  
- **Excluído:** contém EXCLU  
- **Aberto:** demais casos  

Ajustes finos devem ser feitos preferencialmente no sync (Make) gravando valores canônicos, e depois refletidos nas funções acima.

## Pré-venda

| KPI | Definição |
|-----|-----------|
| Leads recebidos | Leads SDR (`fup_followup_count < 1`) no período (`ts_cadastro`) |
| Responderam | `status_resposta` / `_status_resposta` = `respondeu` |
| FUP | Leads com `fup_followup_count >= 1` |
| SLA robô | Entre `ts_cadastro` e `ts_ultima_interacao` (leads SDR) |

## BI

- Aba **Comercial:** KPIs financeiros, cruzamentos SDR→comercial quando aplicável, leads em risco (baseado em `Proposal` comercial).  
- Aba **Pré-venda:** funil misto lead+projeto (etapas 3–5 usam propostas comerciais), cidade, temperatura, FUP, SLA, motivos, turnos, tabela de leads recentes.

## Sincronização

- Leads: refetch automático a cada 30s (ver `useSolLeads`).  
- Projetos: `staleTime` 5 min (`useSolProjetos`).  
- A UI mostra “consulta HH:mm” com base no `dataUpdatedAt` do React Query (momento em que o cache foi populado/atualizado), não o horário interno do registro no banco.

---

*Fase A — alinhamento fonte única por domínio e transparência na interface.*
