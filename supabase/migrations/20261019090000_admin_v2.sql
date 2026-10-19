-- Admin v2 : vue d'ensemble et état réel des tâches planifiées.
--
-- Fonctions réservées à la clé de service : l'admin les appelle par la fonction
-- commerce-admin, après vérification du rôle admin. Aucune donnée personnelle
-- n'est renvoyée : uniquement des nombres et des états.

-- Analyse Express réellement payée (même règle que express_paid_since, sans date).
CREATE FUNCTION public.express_is_paid(ea public.express_analyses) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT (ea.stripe_session_id IS NOT NULL AND ea.status NOT IN ('cancelled','refunded','awaiting_payment') AND ea.refunded_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM express_purchase_consents c WHERE c.express_analysis_id = ea.id AND c.checkout_mode = 'test'))
    OR EXISTS (SELECT 1 FROM express_purchase_consents c WHERE c.express_analysis_id = ea.id
      AND c.stripe_payment_status = 'paid' AND c.checkout_mode <> 'test' AND ea.refunded_at IS NULL);
$$;

CREATE FUNCTION public.admin_overview() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  WITH m AS (SELECT (date_trunc('month', now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris') AS start)
  SELECT jsonb_build_object(
    'month_start', (SELECT start FROM m),
    'sales', jsonb_build_object(
      'express', (SELECT count(*) FROM express_analyses ea, m WHERE ea.created_at >= m.start AND express_is_paid(ea)),
      'video', (SELECT count(*) FROM video_analyses v, m WHERE v.paid_at >= m.start AND v.checkout_mode = 'live'
        AND v.status NOT IN ('awaiting_payment','refunded')),
      'accompagnements', commerce_revenue()),
    'todo', jsonb_build_object(
      'applications', (SELECT count(*) FROM commerce_applications WHERE stage = 'received'),
      'orders_awaiting_payment', (SELECT count(*) FROM commerce_orders WHERE status = 'pending'
        AND amount_received < amount_cents AND hold_until > now()),
      'orders_to_reschedule', (SELECT count(*) FROM commerce_orders WHERE status = 'needs_reschedule'),
      'activation_errors', (SELECT count(*) FROM commerce_orders WHERE last_error IS NOT NULL
        AND status NOT IN ('cancelled','expired')),
      'unmatched_payments', (SELECT count(*) FROM commerce_unmatched_payments WHERE resolved_order_id IS NULL),
      'failed_mail', (SELECT count(*) FROM commerce_mail WHERE state = 'failed'),
      'express_incidents', (SELECT count(*) FROM express_analyses WHERE refunded_at IS NULL AND (
        status = 'failed' OR support_requested_at IS NOT NULL
        OR (status IN ('starting','processing') AND coalesce(processing_started_at, launch_started_at, created_at) < now() - interval '30 minutes')
        OR (status IN ('complete','completed') AND result_email_sent_at IS NULL AND completed_at < now() - interval '30 minutes'))),
      'video_incidents', (SELECT count(*) FROM video_analyses WHERE status NOT IN ('refunded') AND (
        status = 'failed' OR support_requested_at IS NOT NULL
        OR (status IN ('paid','starting','processing') AND coalesce(processing_started_at, paid_at, created_at) < now() - interval '30 minutes')
        OR (status = 'completed' AND completed_at < now() - interval '30 minutes')))),
    'places', commerce_places());
$$;

-- Tâches planifiées : programmation et dernière exécution (pg_cron absent : liste vide).
CREATE FUNCTION public.admin_cron_status() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE result jsonb;
BEGIN
  IF to_regclass('cron.job') IS NULL THEN RETURN '[]'::jsonb; END IF;
  EXECUTE $q$
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'name', j.jobname, 'schedule', j.schedule, 'active', j.active,
      'last_status', r.status, 'last_start', r.start_time,
      'last_message', left(r.return_message, 200)) ORDER BY j.jobname), '[]'::jsonb)
    FROM cron.job j
    LEFT JOIN LATERAL (SELECT status, start_time, return_message FROM cron.job_run_details d
      WHERE d.jobid = j.jobid ORDER BY d.start_time DESC LIMIT 1) r ON true
  $q$ INTO result;
  RETURN result;
END $$;

REVOKE ALL ON FUNCTION public.express_is_paid(public.express_analyses), public.admin_overview(), public.admin_cron_status()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.express_is_paid(public.express_analyses), public.admin_overview(), public.admin_cron_status()
  TO service_role;
