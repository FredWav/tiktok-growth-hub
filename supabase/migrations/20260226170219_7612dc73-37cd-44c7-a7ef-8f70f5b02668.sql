
CREATE TABLE public.express_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id text NOT NULL,
  tiktok_username text NOT NULL,
  job_id text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  health_score integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.express_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all express_analyses"
  ON public.express_analyses FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
