ALTER TABLE public.express_analyses ALTER COLUMN stripe_session_id DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS express_analyses_stripe_session_id_uniq
  ON public.express_analyses (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;