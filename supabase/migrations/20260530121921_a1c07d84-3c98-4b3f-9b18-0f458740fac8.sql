ALTER TABLE public.wav_premium_applications
  ADD COLUMN IF NOT EXISTS profil text,
  ADD COLUMN IF NOT EXISTS motivation text,
  ADD COLUMN IF NOT EXISTS accompagnement_type text,
  ADD COLUMN IF NOT EXISTS accompagnement_critere text;

ALTER TABLE public.wav_premium_applications
  DROP CONSTRAINT IF EXISTS check_current_level_not_empty,
  DROP CONSTRAINT IF EXISTS check_blockers_not_empty;

ALTER TABLE public.wav_premium_applications
  ALTER COLUMN current_level DROP NOT NULL,
  ALTER COLUMN blockers DROP NOT NULL;

ALTER TABLE public.wav_premium_applications
  ADD CONSTRAINT check_profil_not_empty
    CHECK (trim(profil) <> ''),
  ADD CONSTRAINT check_motivation_not_empty
    CHECK (trim(motivation) <> ''),
  ADD CONSTRAINT check_accompagnement_type_not_empty
    CHECK (trim(accompagnement_type) <> '');

DROP POLICY IF EXISTS "Anyone can insert valid applications" ON public.wav_premium_applications;

CREATE POLICY "Anyone can insert valid applications"
ON public.wav_premium_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  trim(first_name) <> ''
  AND trim(last_name) <> ''
  AND trim(email) <> ''
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND trim(goals) <> ''
  AND trim(profil) <> ''
  AND trim(motivation) <> ''
  AND trim(accompagnement_type) <> ''
);