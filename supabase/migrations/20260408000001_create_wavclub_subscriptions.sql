-- Wav Academy subscriptions table
-- Tracks members for ACCÈS (39€/mois) and LIVE (97€/mois) plans
-- ÉLITE (1500€/mois) goes through the existing wav_premium_applications flow

CREATE TABLE IF NOT EXISTS wavacademy_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  email text NOT NULL,
  discord_user_id text,
  discord_role_env text,        -- env var name holding the role ID, e.g. DISCORD_VIP1_ROLE_ID
  plan_type text NOT NULL,      -- 'acces' | 'live'
  status text NOT NULL DEFAULT 'active', -- 'active' | 'cancelled' | 'expired'
  discord_role_granted boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for lookups by subscription ID (webhook cancellation flow)
CREATE INDEX IF NOT EXISTS idx_wavacademy_subscriptions_stripe_sub
  ON wavacademy_subscriptions (stripe_subscription_id);

-- Index for lookups by email
CREATE INDEX IF NOT EXISTS idx_wavacademy_subscriptions_email
  ON wavacademy_subscriptions (email);

-- RLS: admin-only access (service role bypasses RLS)
ALTER TABLE wavacademy_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON wavacademy_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
