-- Wav Academy claim tokens
-- Issued after a successful Stripe checkout. The buyer receives an email with a
-- unique link (/claim/<token>) that walks them through Discord OAuth so the bot
-- can add them to the guild and assign the correct role via guilds.join.

CREATE TABLE IF NOT EXISTS wavacademy_claims (
  token uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id uuid REFERENCES wavacademy_subscriptions(id) ON DELETE CASCADE,
  email text NOT NULL,
  plan_type text NOT NULL,                -- 'acces' | 'live'
  discord_role_env text NOT NULL,         -- 'DISCORD_VIP1_ROLE_ID' | 'DISCORD_VIP2_ROLE_ID'
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  claimed_at timestamptz,
  discord_user_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wavacademy_claims_subscription
  ON wavacademy_claims (subscription_id);

CREATE INDEX IF NOT EXISTS idx_wavacademy_claims_pending
  ON wavacademy_claims (expires_at)
  WHERE claimed_at IS NULL;

-- RLS: service role only (Edge Functions). No public read — token is the secret.
ALTER TABLE wavacademy_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON wavacademy_claims
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
