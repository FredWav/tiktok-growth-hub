-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any pre-existing job with the same name
DO $$
DECLARE
  jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'reconcile-express-analyses-5min';
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;
END $$;

-- Schedule the reconciliation function every 5 minutes
SELECT cron.schedule(
  'reconcile-express-analyses-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://rdpykyvqcckxpygwblxf.supabase.co/functions/v1/reconcile-express-analyses',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcHlreXZxY2NreHB5Z3dibHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNTcwNTgsImV4cCI6MjA4MzczMzA1OH0.pOtXOPFOxwMQhDOiMWIdzKFN9EQ2kDv_vOsFvuiHo9c"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);