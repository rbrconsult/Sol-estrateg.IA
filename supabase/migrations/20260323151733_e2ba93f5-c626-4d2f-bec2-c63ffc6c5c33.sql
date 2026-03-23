ALTER TABLE public.time_comercial ADD COLUMN entra_random boolean DEFAULT true;

UPDATE public.time_comercial SET entra_random = false WHERE nome IN ('Gabriel Ferrari', 'Vinicius Selane');