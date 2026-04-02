
-- Modules that the sidebar actually uses
-- All modules a diretor should have access to
DO $$
DECLARE
  gabriel_id UUID := 'df6aa4b2-b7fd-400b-97b9-c7da379affda';
  vinicius_id UUID := '4e33971c-a645-408a-90be-296725b69240';
  modules TEXT[] := ARRAY[
    'conferencia', 'leads', 'robo-sol', 'robo-fup-frio', 'bi',
    'pipeline', 'painel-comercial', 'forecast', 'vendedores', 'comissoes',
    'chamados', 'monitoramento', 'sla-monitor', 'followup',
    'sanitizacao', 'qualificacao', 'reprocessamento', 'time-comercial',
    'admin-pessoas', 'admin-usuarios', 'admin-cenarios'
  ];
  m TEXT;
  uid UUID;
BEGIN
  FOREACH uid IN ARRAY ARRAY[gabriel_id, vinicius_id] LOOP
    FOREACH m IN ARRAY modules LOOP
      INSERT INTO user_module_permissions (user_id, module_key, enabled)
      VALUES (uid, m, true)
      ON CONFLICT (user_id, module_key)
      DO UPDATE SET enabled = true, updated_at = now();
    END LOOP;
  END LOOP;
END $$;
