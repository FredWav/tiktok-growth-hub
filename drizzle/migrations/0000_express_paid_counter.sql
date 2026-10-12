-- Compteur social de la page Analyse Express.
-- La base humaine verifiee a la main (213) reste dans src/config/offers.ts.
-- Cette fonction renvoie le nombre de paiements Analyse Express valides depuis le
-- repere ci-dessous, pour que le compteur affiche monte des qu'un paiement Stripe
-- est confirme, sans qu'il faille penser a changer une constante a la main.
--
-- Un paiement est considere valide quand Stripe a rattache une session payee a
-- l'analyse (le webhook n'ecrit stripe_session_id que lorsque payment_status = paid)
-- ou quand le consentement porte stripe_payment_status = 'paid'.
-- Les achats en mode test, les analyses annulees et les remboursements sont exclus.

CREATE OR REPLACE FUNCTION public.express_paid_since()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT count(*)::integer FROM (
    SELECT ea.id
      FROM public.express_analyses AS ea
     WHERE ea.stripe_session_id IS NOT NULL
       AND ea.status NOT IN ('cancelled', 'refunded')
       AND ea.refunded_at IS NULL
       AND ea.created_at > TIMESTAMPTZ '2026-10-12 15:00:00+00'
       AND NOT EXISTS (
         SELECT 1
           FROM public.express_purchase_consents AS c
          WHERE c.express_analysis_id = ea.id
            AND c.checkout_mode = 'test'
       )
    UNION
    SELECT c.express_analysis_id
      FROM public.express_purchase_consents AS c
     WHERE c.stripe_payment_status = 'paid'
       AND c.checkout_mode <> 'test'
       AND c.created_at > TIMESTAMPTZ '2026-10-12 15:00:00+00'
  ) AS paid;
$$;

REVOKE ALL ON FUNCTION public.express_paid_since() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.express_paid_since() TO anon, authenticated;