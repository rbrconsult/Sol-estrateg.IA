UPDATE organization_configs 
SET config_value = 'ddd3f515-6a71-4558-9190-c77defb35099',
    updated_at = now()
WHERE organization_id = '57fd98ab-f49c-4fe7-b413-7ab2f2a3e891' 
AND config_key = 'make_api_key';