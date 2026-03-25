-- Backfill: set data_entrada = created_at for leads that have NULL data_entrada
-- This ensures existing leads get a reasonable date instead of NULL
UPDATE leads_consolidados 
SET data_entrada = created_at 
WHERE data_entrada IS NULL;