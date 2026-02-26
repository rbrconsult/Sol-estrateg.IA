
# Duplicar SOL Insights com Backup

## Objetivo
Criar uma copia de seguranca da pagina SOL Insights atual antes de fazer mudancas, garantindo que se algo der errado, o backup esteja disponivel.

## Arquivos a criar

| Arquivo | Descricao |
|---|---|
| `src/pages/ConferenciaBackup.tsx` | Copia exata do `Conferencia.tsx` atual, renomeado internamente para `ConferenciaBackup` |

## Arquivos a modificar

| Arquivo | Mudanca |
|---|---|
| `src/App.tsx` | Adicionar rota `/conferencia-backup` apontando para `ConferenciaBackup` (protegida, com MainLayout, sem ModuleGuard para ficar oculta do menu) |
| `src/components/layout/Sidebar.tsx` | Nenhuma mudanca -- a pagina backup nao aparece no menu, fica acessivel apenas por URL direto |

## Resultado

- **`/conferencia`** -- SOL Insights principal, pronta para receber novas metricas
- **`/conferencia-backup`** -- Copia identica do estado atual, oculta do menu, acessivel apenas via URL direto
- A pagina principal continua funcionando normalmente e pode ser editada livremente
- Se precisar restaurar, basta acessar `/conferencia-backup` para comparar ou copiar o codigo de volta

## Proximo passo
Apos aprovacao, voce podera me passar as novas metricas e topicos para atualizar a pagina principal `/conferencia`.
