-- Journal des événements Stripe reçus par stripe-webhook.
--
-- Un événement déjà traité avec succès n'est plus rejoué (Stripe peut renvoyer
-- plusieurs fois le même événement). Un événement en échec reste ouvert : le
-- rejeu Stripe le retraite, les modules produits restant idempotents.

CREATE TABLE public.stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  livemode boolean NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 1,
  processed_at timestamptz,
  outcome jsonb,
  last_error text
);

COMMENT ON TABLE public.stripe_events IS 'Événements Stripe reçus : dédoublonnage et suivi des échecs du webhook.';

CREATE INDEX stripe_events_open_idx ON public.stripe_events (received_at) WHERE processed_at IS NULL;

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- Écriture réservée au webhook (service_role) ; lecture pour l'admin.
CREATE POLICY "Admins can read stripe events" ON public.stripe_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

REVOKE ALL ON TABLE public.stripe_events FROM anon;
GRANT SELECT ON TABLE public.stripe_events TO authenticated;
GRANT ALL ON TABLE public.stripe_events TO service_role;
