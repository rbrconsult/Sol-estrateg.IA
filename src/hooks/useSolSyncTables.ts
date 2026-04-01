/** COMPAT SHIM — re-exports from useSolData */
export {
  useSolEquipe as useSolEquipeSync,
  useSolMetricas as useSolMetricasSync,
  useSolProjetos as useSolProjetosSync,
  useSolQualificacao as useSolQualificacaoSync,
  useSolConversions as useSolConversionsSync,
  useSolFunis as useSolFunisSync,
  useSolConfig as useSolConfigSync,
  useSolConfigUpdate,
  useSolEquipeUpdate,
  useSolEquipeInsert,
  type SolEquipeMembro as SolEquipeSync,
} from '@/hooks/useSolData';
