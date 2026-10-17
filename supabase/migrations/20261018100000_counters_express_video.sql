-- Compteurs de preuve sociale des analyses (chiffres donnés par Fred le 17/10/2026, 21 h UTC).
--
-- Analyse Express : 224, chiffre affiché sur le site actuel. Analyse vidéo : 47.
-- Le site ajoute à ces bases (EXPRESS_USERS_BASE_COUNT, VIDEO_USERS_BASE_COUNT
-- dans src/config/offers.ts) les seuls paiements réels enregistrés après ce
-- moment : pas de double comptage. Changer une base et sa date ensemble.

CREATE OR REPLACE FUNCTION public.express_paid_since() RETURNS integer
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  SELECT count(*)::integer FROM (
    SELECT ea.id
      FROM public.express_analyses AS ea
     WHERE ea.stripe_session_id IS NOT NULL
       AND ea.status NOT IN ('cancelled', 'refunded')
       AND ea.refunded_at IS NULL
       AND ea.created_at > TIMESTAMPTZ '2026-10-17 21:00:00+00'
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
       AND c.created_at > TIMESTAMPTZ '2026-10-17 21:00:00+00'
  ) AS paid;
$$;

-- Analyse vidéo : commandes réellement payées (mode live), hors remboursement.
CREATE OR REPLACE FUNCTION public.video_paid_since() RETURNS integer
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  SELECT count(*)::integer
    FROM public.video_analyses
   WHERE checkout_mode = 'live'
     AND paid_at IS NOT NULL
     AND paid_at > TIMESTAMPTZ '2026-10-17 21:00:00+00'
     AND status NOT IN ('awaiting_payment', 'refunded');
$$;
REVOKE ALL ON FUNCTION public.video_paid_since() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.video_paid_since() TO anon, authenticated, service_role;
