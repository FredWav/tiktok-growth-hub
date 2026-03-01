CREATE TABLE public.oneshot_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  whatsapp text NOT NULL,
  tiktok text NOT NULL,
  objectives text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.oneshot_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage oneshot_submissions"
  ON public.oneshot_submissions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert oneshot_submissions"
  ON public.oneshot_submissions FOR INSERT
  WITH CHECK (true);