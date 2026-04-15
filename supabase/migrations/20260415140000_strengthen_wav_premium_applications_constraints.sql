-- ============================================================
-- Strengthen wav_premium_applications against empty/bot inserts
-- ============================================================

-- 1. Add CHECK constraints at DB level so empty strings are
--    rejected regardless of where the INSERT comes from
--    (REST API, edge function, or frontend JS).

ALTER TABLE public.wav_premium_applications
  ADD CONSTRAINT check_first_name_not_empty
    CHECK (trim(first_name) <> ''),
  ADD CONSTRAINT check_last_name_not_empty
    CHECK (trim(last_name) <> ''),
  ADD CONSTRAINT check_email_valid
    CHECK (
      trim(email) <> ''
      AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    ),
  ADD CONSTRAINT check_current_level_not_empty
    CHECK (trim(current_level) <> ''),
  ADD CONSTRAINT check_blockers_not_empty
    CHECK (trim(blockers) <> ''),
  ADD CONSTRAINT check_goals_not_empty
    CHECK (trim(goals) <> '');

-- 2. Replace the wide-open INSERT policy with one that
--    enforces non-empty required fields at the RLS layer,
--    giving a second line of defence before the CHECK hits.

DROP POLICY IF EXISTS "Anyone can insert applications" ON public.wav_premium_applications;

CREATE POLICY "Anyone can insert valid applications"
ON public.wav_premium_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  trim(first_name) <> ''
  AND trim(last_name) <> ''
  AND trim(email) <> ''
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND trim(current_level) <> ''
  AND trim(blockers) <> ''
  AND trim(goals) <> ''
);
