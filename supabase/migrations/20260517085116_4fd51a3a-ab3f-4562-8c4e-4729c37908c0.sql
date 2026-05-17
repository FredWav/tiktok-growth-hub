ALTER TABLE public.wav_premium_applications
  DROP COLUMN IF EXISTS current_revenue,
  DROP COLUMN IF EXISTS revenue_goal;