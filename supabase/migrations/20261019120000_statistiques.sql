-- Statistiques (lot 5) : ventes confirmées par période, cache des lectures
-- PostHog, et fin de l'ancien suivi des visites (page_views).
--
-- Les ventes viennent toujours de la base, après confirmation de Stripe : un
-- passage sur une page de remerciement ne compte jamais comme un paiement.

-- Ventes et demandes sur une période (dates incluses, heure de Paris).
-- Analyses : nombre de ventes (le montant payé n'est pas enregistré en base).
-- Accompagnements : nombre de commandes payées et encaissements nets (remboursements déduits).
CREATE FUNCTION public.admin_sales(p_from date, p_to date) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  WITH r AS (
    SELECT (p_from::timestamp AT TIME ZONE 'Europe/Paris') AS start,
           ((p_to + 1)::timestamp AT TIME ZONE 'Europe/Paris') AS stop
  ),
  days AS (
    SELECT d::date AS day FROM generate_series(p_from, p_to, interval '1 day') d
  ),
  express AS (
    SELECT (ea.created_at AT TIME ZONE 'Europe/Paris')::date AS day
    FROM express_analyses ea, r
    WHERE ea.created_at >= r.start AND ea.created_at < r.stop AND express_is_paid(ea)
  ),
  video AS (
    SELECT (v.paid_at AT TIME ZONE 'Europe/Paris')::date AS day
    FROM video_analyses v, r
    WHERE v.paid_at >= r.start AND v.paid_at < r.stop AND v.checkout_mode = 'live'
      AND v.status NOT IN ('awaiting_payment', 'refunded')
  ),
  receipts AS (
    SELECT o.offer, rc.amount_cents, (rc.received_at AT TIME ZONE 'Europe/Paris')::date AS day
    FROM commerce_receipts rc JOIN commerce_orders o ON o.id = rc.order_id, r
    WHERE rc.received_at >= r.start AND rc.received_at < r.stop
  ),
  orders AS (
    SELECT o.offer FROM commerce_orders o, r
    WHERE o.paid_at >= r.start AND o.paid_at < r.stop AND o.status NOT IN ('cancelled', 'expired')
  ),
  applications AS (
    SELECT a.offer FROM commerce_applications a, r
    WHERE a.created_at >= r.start AND a.created_at < r.stop
  )
  SELECT jsonb_build_object(
    'analyses', jsonb_build_object(
      'express', (SELECT count(*) FROM express),
      'video', (SELECT count(*) FROM video)),
    'accompagnements', (SELECT jsonb_object_agg(offer, jsonb_build_object(
        'orders', (SELECT count(*) FROM orders WHERE orders.offer = x.offer),
        'revenue_cents', (SELECT coalesce(sum(amount_cents), 0) FROM receipts WHERE receipts.offer = x.offer)))
      FROM unnest(ARRAY['one_shot', 'academy', 'premium']) AS x(offer)),
    'applications', (SELECT jsonb_object_agg(offer, (SELECT count(*) FROM applications WHERE applications.offer = x.offer))
      FROM unnest(ARRAY['one_shot', 'academy', 'premium', 'conseil']) AS x(offer)),
    'daily', (SELECT jsonb_agg(jsonb_build_object(
        'day', days.day,
        'express', (SELECT count(*) FROM express WHERE express.day = days.day),
        'video', (SELECT count(*) FROM video WHERE video.day = days.day),
        'revenue_cents', (SELECT coalesce(sum(amount_cents), 0) FROM receipts WHERE receipts.day = days.day))
      ORDER BY days.day) FROM days));
$$;

REVOKE ALL ON FUNCTION public.admin_sales(date, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_sales(date, date) TO service_role;

-- Cache des lectures PostHog : une période déjà lue n'est pas redemandée avant
-- son expiration. Réservé à la clé de service (aucune politique RLS).
CREATE TABLE public.admin_stats_cache (
  key text PRIMARY KEY,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_stats_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_stats_cache FROM anon, authenticated;
GRANT ALL ON TABLE public.admin_stats_cache TO service_role;

-- page_views : PostHog est désormais la seule mesure d'audience. La table reste
-- consultable par les admins (historique repris), mais plus personne n'y écrit.
DROP POLICY "Anyone can insert valid page_views" ON public.page_views;
DROP POLICY "Admins can manage page_views" ON public.page_views;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.page_views FROM anon, authenticated;
REVOKE SELECT ON TABLE public.page_views FROM anon;
DROP FUNCTION public.update_page_view_duration(uuid, integer);
