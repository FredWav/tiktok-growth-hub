-- Formulaire multi-offres : idempotence et limitation de débit côté serveur.
ALTER TABLE public.wav_premium_applications
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
    CHECK (form_version IS NULL OR form_version = ANY (ARRAY['orientation_v2', 'orientation_v3']));

-- Le formulaire public passe désormais par submit-orientation (service-role),
-- qui valide, déduplique et limite les dépôts avant toute écriture.
DROP POLICY IF EXISTS "Anyone can insert valid applications" ON public.wav_premium_applications;
