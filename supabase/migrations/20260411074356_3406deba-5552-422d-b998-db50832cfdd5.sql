ALTER TABLE sol_projetos_sync
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS qualificado_por text,
  ADD COLUMN IF NOT EXISTS ts_qualificado text,
  ADD COLUMN IF NOT EXISTS score text,
  ADD COLUMN IF NOT EXISTS temperatura text,
  ADD COLUMN IF NOT EXISTS valor_conta text;