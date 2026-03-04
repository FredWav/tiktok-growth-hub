
-- wav_premium_applications: add attribution + revenue columns, drop budget_confirmed
ALTER TABLE public.wav_premium_applications
  ADD COLUMN IF NOT EXISTS origin_source text,
  ADD COLUMN IF NOT EXISTS follower_since text,
  ADD COLUMN IF NOT EXISTS conversion_trigger text,
  ADD COLUMN IF NOT EXISTS current_revenue text,
  ADD COLUMN IF NOT EXISTS revenue_goal text;

ALTER TABLE public.wav_premium_applications
  DROP COLUMN IF EXISTS budget_confirmed;

-- diagnostic_leads: add attribution columns
ALTER TABLE public.diagnostic_leads
  ADD COLUMN IF NOT EXISTS origin_source text,
  ADD COLUMN IF NOT EXISTS follower_since text,
  ADD COLUMN IF NOT EXISTS conversion_trigger text;

-- oneshot_submissions: add attribution columns
ALTER TABLE public.oneshot_submissions
  ADD COLUMN IF NOT EXISTS origin_source text,
  ADD COLUMN IF NOT EXISTS conversion_trigger text;
