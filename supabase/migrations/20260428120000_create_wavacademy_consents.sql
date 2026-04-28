-- Wav Academy consent log
-- Captures CGV + L221-28 waiver acceptance BEFORE redirecting to a Stripe
-- Payment Link. The consent id is passed as `client_reference_id` so the
-- webhook can match the resulting Checkout Session back to this record.
-- Required for legal proof in case of a chargeback or B2C dispute.

CREATE TABLE IF NOT EXISTS wavacademy_consents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  plan_type text NOT NULL,                 -- 'acces' | 'live'
  consent_cgv boolean NOT NULL,
  consent_renonciation boolean NOT NULL,
  cgv_version text NOT NULL DEFAULT 'v1',  -- bump when CGV text changes
  ip_address text,
  user_agent text,
  stripe_session_id text,                  -- filled by stripe-webhook on completion
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wavacademy_consents_email
  ON wavacademy_consents (email);

CREATE INDEX IF NOT EXISTS idx_wavacademy_consents_session
  ON wavacademy_consents (stripe_session_id);

ALTER TABLE wavacademy_consents ENABLE ROW LEVEL SECURITY;

-- Service-role only (Edge Functions write/read via service key, RLS bypassed)
CREATE POLICY "Admin full access" ON wavacademy_consents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
