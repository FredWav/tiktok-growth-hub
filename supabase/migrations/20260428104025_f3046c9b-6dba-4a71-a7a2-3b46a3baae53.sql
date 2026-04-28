-- Wav Academy claims (Discord onboarding tokens)
CREATE TABLE IF NOT EXISTS public.wavacademy_claims (
  token uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id uuid REFERENCES public.wavacademy_subscriptions(id) ON DELETE CASCADE,
  email text NOT NULL,
  plan_type text NOT NULL,
  discord_role_env text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  claimed_at timestamptz,
  discord_user_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wavacademy_claims_subscription
  ON public.wavacademy_claims (subscription_id);

CREATE INDEX IF NOT EXISTS idx_wavacademy_claims_pending
  ON public.wavacademy_claims (expires_at)
  WHERE claimed_at IS NULL;

ALTER TABLE public.wavacademy_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON public.wavacademy_claims
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Wav Academy consents (CGV + L221-28 waiver log)
CREATE TABLE IF NOT EXISTS public.wavacademy_consents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  plan_type text NOT NULL,
  consent_cgv boolean NOT NULL,
  consent_renonciation boolean NOT NULL,
  cgv_version text NOT NULL DEFAULT 'v1',
  ip_address text,
  user_agent text,
  stripe_session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wavacademy_consents_email
  ON public.wavacademy_consents (email);

CREATE INDEX IF NOT EXISTS idx_wavacademy_consents_session
  ON public.wavacademy_consents (stripe_session_id);

ALTER TABLE public.wavacademy_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON public.wavacademy_consents
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));