-- Campos opcionais vindos do Solar Market / Make para a tela de Comissões
ALTER TABLE public.sol_projetos_sync
  ADD COLUMN IF NOT EXISTS valor_comissao text,
  ADD COLUMN IF NOT EXISTS percentual_comissao text;
