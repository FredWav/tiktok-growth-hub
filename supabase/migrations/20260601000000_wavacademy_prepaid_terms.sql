-- Wav Academy : grille à durées (1 / 3 / 6 mois).
-- Le 1 mois reste un abonnement récurrent (révoqué via customer.subscription.deleted).
-- Les formules 3 et 6 mois sont des paiements uniques prépayés : pas d'abonnement Stripe,
-- donc l'accès doit expirer à une date calculée (access_expires_at) puis être révoqué par cron.
-- L'accès est identique pour les 3 formules : plan_type reste 'live' (contrainte inchangée).

-- Durée achetée (1, 3 ou 6), capturée au consentement pour le calcul d'expiration.
ALTER TABLE wavacademy_consents
  ADD COLUMN IF NOT EXISTS access_months int;

-- access_months : durée achetée. access_expires_at : NULL pour le 1 mois récurrent
-- (l'abonnement Stripe pilote la fin d'accès), renseigné pour le prépayé 3/6 mois.
ALTER TABLE wavacademy_subscriptions
  ADD COLUMN IF NOT EXISTS access_months int,
  ADD COLUMN IF NOT EXISTS access_expires_at timestamptz;

-- Index pour le job de révocation : ne cible que les accès prépayés actifs arrivant à échéance.
CREATE INDEX IF NOT EXISTS idx_wavacademy_subscriptions_expiry
  ON wavacademy_subscriptions (access_expires_at)
  WHERE status = 'active';
