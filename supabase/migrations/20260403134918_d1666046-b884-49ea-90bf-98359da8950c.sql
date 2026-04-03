-- Fix sol_conversions_sync: table has no franquia_id, data is infra-level sync data
-- Only super_admins need access (they already have ALL via the other policy)
DROP POLICY IF EXISTS "Users can view own franchise conversions sync" ON public.sol_conversions_sync;