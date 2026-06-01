-- Planifie la révocation quotidienne des accès Wav Academy prépayés (3/6 mois) arrivés à échéance.
-- Même mécanisme que reconcile-express-analyses (pg_cron + pg_net), exécuté à 03:00 UTC.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any pre-existing job with the same name
DO $$
DECLARE
  jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'revoke-expired-wavacademy-daily';
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;
END $$;

-- Schedule the revocation function every day at 03:00 UTC
SELECT cron.schedule(
  'revoke-expired-wavacademy-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://rdpykyvqcckxpygwblxf.supabase.co/functions/v1/revoke-expired-wavacademy',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcHlreXZxY2NreHB5Z3dibHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNTcwNTgsImV4cCI6MjA4MzczMzA1OH0.pOtXOPFOxwMQhDOiMWIdzKFN9EQ2kDv_vOsFvuiHo9c"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
