-- Drop unused current_revenue + revenue_goal columns; replaced by `budget` (migration 20260408000000)
ALTER TABLE public.wav_premium_applications
  DROP COLUMN IF EXISTS current_revenue,
  DROP COLUMN IF EXISTS revenue_goal;
