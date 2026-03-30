
-- 1. Atualizar make_org_id para nova org
UPDATE organization_configs 
SET config_value = '6724658', updated_at = now() 
WHERE config_key = 'make_org_id' AND organization_id = '57fd98ab-f49c-4fe7-b413-7ab2f2a3e891';

-- 2. Mover DS legados para categoria 'datastore_legado'
UPDATE organization_configs 
SET config_category = 'datastore_legado', updated_at = now()
WHERE organization_id = '57fd98ab-f49c-4fe7-b413-7ab2f2a3e891'
  AND config_key IN (
    'ds_thread_id',        -- 64798 → substituído por sol_leads
    'ds_comercial',        -- 84404 → substituído por sol_projetos + sol_leads
    'ds_google_ads',       -- 82094 → substituído por sol_campanhas
    'ds_meta_ads',         -- 82051 → substituído por sol_campanhas
    'ds_sol_producao',     -- 81973 → substituído por sol_metricas
    'ds_leads_site_geral', -- 79120 → substituído por sol_leads
    'ds_lista_usuarios_sm',-- 84503 → substituído por sol_equipe
    'ds_ocr_conta_luz',    -- 74391 → substituído por sol_leads
    'ds_token_graphql',    -- 62356 → substituído por sol_auth
    'ds_solarmarket'       -- 57996 → substituído por sol_auth (em migração)
  );

-- 3. Mover ds_sol_leads e ds_sol_metricas de 'make' para 'datastore'
UPDATE organization_configs 
SET config_category = 'datastore', updated_at = now()
WHERE organization_id = '57fd98ab-f49c-4fe7-b413-7ab2f2a3e891'
  AND config_key IN ('ds_sol_leads', 'ds_sol_metricas');

-- 4. Inserir novos DataStores v2
INSERT INTO organization_configs (organization_id, config_key, config_value, config_category, is_secret)
VALUES
  ('57fd98ab-f49c-4fe7-b413-7ab2f2a3e891', 'ds_sol_config', '86896', 'datastore', false),
  ('57fd98ab-f49c-4fe7-b413-7ab2f2a3e891', 'ds_sol_equipe', '86895', 'datastore', false),
  ('57fd98ab-f49c-4fe7-b413-7ab2f2a3e891', 'ds_sol_funis', '86897', 'datastore', false),
  ('57fd98ab-f49c-4fe7-b413-7ab2f2a3e891', 'ds_sol_campanhas', '86890', 'datastore', false),
  ('57fd98ab-f49c-4fe7-b413-7ab2f2a3e891', 'ds_sol_projetos', '86888', 'datastore', false),
  ('57fd98ab-f49c-4fe7-b413-7ab2f2a3e891', 'ds_sol_pos_venda', '86889', 'datastore', false),
  ('57fd98ab-f49c-4fe7-b413-7ab2f2a3e891', 'ds_sol_auth', '87395', 'datastore', false);
