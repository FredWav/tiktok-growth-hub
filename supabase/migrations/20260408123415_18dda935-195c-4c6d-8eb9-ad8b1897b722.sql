
CREATE TABLE IF NOT EXISTS wavacademy_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  email text NOT NULL,
  discord_user_id text,
  discord_role_env text,
  plan_type text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  discord_role_granted boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wavacademy_subscriptions_stripe_sub
  ON wavacademy_subscriptions (stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_wavacademy_subscriptions_email
  ON wavacademy_subscriptions (email);

ALTER TABLE wavacademy_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON wavacademy_subscriptions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
