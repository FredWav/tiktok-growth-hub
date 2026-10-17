-- Tâches planifiées v2.
--
-- En production Lovable, deux tâches ne faisaient rien : l'expiration Academy
-- s'authentifiait avec la clé anon (refusée par la fonction) et check-vip-expiry
-- appelait une fonction supprimée. La file commerce (commerce-process) n'était
-- pas planifiée du tout, faute d'accès à Vault.
--
-- Ici, chaque tâche lit l'URL du projet et le secret cron dans Vault au moment
-- de l'exécution : aucune valeur sensible n'est écrite dans le dépôt. Les deux
-- secrets se créent une fois par projet (staging puis prod), dans l'éditeur SQL :
--   SELECT vault.create_secret('https://<ref>.supabase.co', 'project_url');
--   SELECT vault.create_secret('<même valeur que RECONCILE_CRON_SECRET>', 'cron_secret');
--
-- Sans pg_cron (tests PGlite), la migration ne fait rien.

CREATE OR REPLACE FUNCTION public.call_cron_function(p_function text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_url text;
  v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'project_url';
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret';
  IF v_url IS NULL OR v_secret IS NULL THEN
    RAISE EXCEPTION 'Secrets Vault project_url / cron_secret absents';
  END IF;
  RETURN net.http_post(
    url := v_url || '/functions/v1/' || p_function,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', v_secret),
    body := '{}'::jsonb
  );
END;
$$;

REVOKE ALL ON FUNCTION public.call_cron_function(text) FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  v_job text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RETURN;
  END IF;

  -- Tâches héritées de Lovable, cassées ou remplacées.
  FOREACH v_job IN ARRAY ARRAY[
    'check-vip-expiry-daily',
    'revoke-expired-wavacademy-daily',
    'reconcile-express-analyses-5min',
    'express-v3-minute'
  ] LOOP
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = v_job) THEN
      PERFORM cron.unschedule(v_job);
    END IF;
  END LOOP;

  -- Analyses Express et vidéo + envoi de la file d'e-mails.
  PERFORM cron.schedule('reconcile-analyses', '* * * * *',
    $cmd$SELECT public.call_cron_function('reconcile-express-analyses')$cmd$);
  -- Activation et fin des commandes d'accompagnement.
  PERFORM cron.schedule('commerce-process', '*/5 * * * *',
    $cmd$SELECT public.call_cron_function('commerce-process')$cmd$);
  -- Fin des accès Academy historiques à durée limitée (l'Academy v2 est à vie).
  PERFORM cron.schedule('revoke-expired-wavacademy', '0 3 * * *',
    $cmd$SELECT public.call_cron_function('revoke-expired-wavacademy')$cmd$);
END;
$$;
