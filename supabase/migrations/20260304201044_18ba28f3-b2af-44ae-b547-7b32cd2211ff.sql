ALTER TABLE public.wav_premium_applications ADD COLUMN IF NOT EXISTS posthog_id text;
ALTER TABLE public.diagnostic_leads ADD COLUMN IF NOT EXISTS posthog_id text;
ALTER TABLE public.oneshot_submissions ADD COLUMN IF NOT EXISTS posthog_id text;