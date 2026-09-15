ALTER TABLE public.wav_premium_applications
  ADD COLUMN IF NOT EXISTS form_version text,
  ADD COLUMN IF NOT EXISTS account_url text,
  ADD COLUMN IF NOT EXISTS business_stage text,
  ADD COLUMN IF NOT EXISTS primary_goal text,
  ADD COLUMN IF NOT EXISTS main_blocker text,
  ADD COLUMN IF NOT EXISTS work_mode text,
  ADD COLUMN IF NOT EXISTS orientation_request_id uuid,
  ADD COLUMN IF NOT EXISTS orientation_fingerprint text;

CREATE UNIQUE INDEX IF NOT EXISTS wav_premium_applications_orientation_request
  ON public.wav_premium_applications(orientation_request_id)
  WHERE orientation_request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS wav_premium_applications_orientation_rate
  ON public.wav_premium_applications(orientation_fingerprint, created_at)
  WHERE orientation_fingerprint IS NOT NULL;

ALTER TABLE public.wav_premium_applications
  DROP CONSTRAINT IF EXISTS check_orientation_form_version;

ALTER TABLE public.wav_premium_applications
  ADD CONSTRAINT check_orientation_form_version
    CHECK (form_version IS NULL OR form_version = ANY (ARRAY['orientation_v2','orientation_v3']));

ALTER TABLE public.wav_premium_applications
  DROP CONSTRAINT IF EXISTS check_orientation_business_stage,
  DROP CONSTRAINT IF EXISTS check_orientation_primary_goal,
  DROP CONSTRAINT IF EXISTS check_orientation_work_mode,
  DROP CONSTRAINT IF EXISTS check_orientation_main_blocker,
  DROP CONSTRAINT IF EXISTS check_orientation_account_url;

ALTER TABLE public.wav_premium_applications
  ADD CONSTRAINT check_orientation_account_url
    CHECK (account_url IS NULL OR (trim(account_url) <> '' AND char_length(account_url) <= 500)),
  ADD CONSTRAINT check_orientation_business_stage
    CHECK (business_stage IS NULL OR business_stage = ANY (ARRAY['debut','irregulier','stagnation','visibilite_sans_revenus','activite_a_accelerer'])),
  ADD CONSTRAINT check_orientation_primary_goal
    CHECK (primary_goal IS NULL OR primary_goal = ANY (ARRAY['comprendre_contenus','gagner_visibilite','attirer_clients','mieux_vendre','structurer_strategie'])),
  ADD CONSTRAINT check_orientation_main_blocker
    CHECK (main_blocker IS NULL OR (char_length(trim(main_blocker)) BETWEEN 20 AND 2000)),
  ADD CONSTRAINT check_orientation_work_mode
    CHECK (work_mode IS NULL OR work_mode = ANY (ARRAY['outils_autonomes','plan_ponctuel','suivi_collectif','suivi_individuel','a_definir','autonome','regard_strategique']));

DROP POLICY IF EXISTS "Anyone can insert valid applications" ON public.wav_premium_applications;