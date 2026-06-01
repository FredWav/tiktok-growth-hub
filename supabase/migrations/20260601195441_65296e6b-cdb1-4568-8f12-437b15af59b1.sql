ALTER TABLE wavacademy_consents
  ADD COLUMN IF NOT EXISTS access_months int;

ALTER TABLE wavacademy_subscriptions
  ADD COLUMN IF NOT EXISTS access_months int,
  ADD COLUMN IF NOT EXISTS access_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_wavacademy_subscriptions_expiry
  ON wavacademy_subscriptions (access_expires_at)
  WHERE status = 'active';