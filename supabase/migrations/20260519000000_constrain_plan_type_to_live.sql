-- Constrains new Wav Academy records to plan_type = 'live' only.
-- Historical 'acces' rows are preserved for audit/legal purposes.
ALTER TABLE wavacademy_consents
  ADD CONSTRAINT wavacademy_consents_plan_type_check CHECK (plan_type = 'live');

ALTER TABLE wavacademy_subscriptions
  ADD CONSTRAINT wavacademy_subscriptions_plan_type_check CHECK (plan_type = 'live');

ALTER TABLE wavacademy_claims
  ADD CONSTRAINT wavacademy_claims_plan_type_check CHECK (plan_type = 'live');
