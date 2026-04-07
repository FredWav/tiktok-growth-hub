-- Replace current_revenue + revenue_goal with budget on wav_premium_applications
ALTER TABLE wav_premium_applications
  ADD COLUMN IF NOT EXISTS budget text;
