ALTER TABLE public.leads_consolidados
  ADD COLUMN IF NOT EXISTS closer_atribuido text,
  ADD COLUMN IF NOT EXISTS etapa_sm text,
  ADD COLUMN IF NOT EXISTS status_proposta text,
  ADD COLUMN IF NOT EXISTS potencia_sistema numeric,
  ADD COLUMN IF NOT EXISTS representante text;