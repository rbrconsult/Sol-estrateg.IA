

## Ajustes nas Metricas do Time - Chamados

### O que muda

1. **Remover a tabela de membros** - A tabela detalhada por membro será removida, mantendo apenas os 6 KPI cards de resumo (Resolvidos, Em Aberto, Horas Totais, Tempo Medio, 1a Resposta, Membros).

2. **Adicionar filtro por periodo** no topo das metricas com as opcoes:
   - Este Mes
   - Mes Passado
   - Ultimos 3 Meses
   - Personalizado (abre date picker com selecao de intervalo)

### Detalhes tecnicos

**Arquivo: `src/components/chamados/TeamMetrics.tsx`**

- Adicionar estado para periodo selecionado e date range customizado
- Criar botoes de preset no topo do componente (Este Mes, Mes Passado, Ultimos 3 Meses, Personalizado)
- Para "Personalizado", usar Popover + Calendar (react-day-picker) em modo range, seguindo o padrao ja existente em `DateFilter.tsx`
- Filtrar os tickets por `created_at` dentro do periodo selecionado antes de calcular as metricas
- Remover toda a secao da tabela de membros (linhas do `<table>`)
- Manter o calculo de `memberStats` apenas para alimentar os KPIs agregados (total membros, media primeira resposta)
- Periodo padrao: "Este Mes"

Nenhuma alteracao no banco de dados e necessaria.

